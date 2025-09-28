
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import InputField from "@/components/atoms/InputField";
import ShareButton from "@/components/atoms/ShareButton";
import ShareableResultCard from "@/components/atoms/ShareableResultCard";
import { useShareableImage } from "@/hooks/useShareableImage";

// Utility functions
const round = (value, digits = 0) => {
  const p = Math.pow(10, digits);
  return Math.round(value * p) / p;
};

// Heart rate zone definitions
const HR_ZONES = [
  {
    zone: 1,
    name: "Recovery",
    percentage: { min: 50, max: 60 },
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-700/20",
    description: "Very light intensity, active recovery",
    benefits: "Recovery, fat burning, warm-up",
    activities: ["Walking", "Easy cycling", "Gentle yoga"],
  },
  {
    zone: 2,
    name: "Aerobic Base",
    percentage: { min: 60, max: 70 },
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-700/20",
    description: "Light intensity, aerobic development",
    benefits: "Builds aerobic capacity, fat burning",
    activities: ["Jogging", "Easy swimming", "Light cycling"],
  },
  {
    zone: 3,
    name: "Aerobic",
    percentage: { min: 70, max: 80 },
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-700/20",
    description: "Moderate intensity, aerobic fitness",
    benefits: "Improves cardiovascular efficiency",
    activities: ["Steady running", "Group fitness", "Cycling"],
  },
  {
    zone: 4,
    name: "Lactate Threshold",
    percentage: { min: 80, max: 90 },
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-700/20",
    description: "Hard intensity, lactate threshold",
    benefits: "Increases lactate threshold, speed",
    activities: ["Tempo runs", "Time trials", "Intervals"],
  },
  {
    zone: 5,
    name: "VO2 Max",
    percentage: { min: 90, max: 100 },
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-700/20",
    description: "Maximum intensity, neuromuscular power",
    benefits: "Improves VO2 max, anaerobic capacity",
    activities: ["Sprint intervals", "Hill sprints", "HIIT"],
  },
];

// Training goals and recommended zones
const TRAINING_GOALS = [
  {
    goal: "Weight Loss",
    primaryZones: [1, 2],
    description: "Focus on fat-burning zones with longer duration",
    recommendation: "60-70% of training time in zones 1-2",
  },
  {
    goal: "General Fitness",
    primaryZones: [2, 3],
    description: "Build overall cardiovascular health",
    recommendation: "Mix of zones 2-3 with some zone 1 recovery",
  },
  {
    goal: "Endurance",
    primaryZones: [2, 3, 4],
    description: "Build aerobic capacity and endurance",
    recommendation: "80% easy (zones 1-2), 20% moderate-hard (zones 3-4)",
  },
  {
    goal: "Performance",
    primaryZones: [3, 4, 5],
    description: "Improve speed and power",
    recommendation: "Include all zones with emphasis on 4-5",
  },
];

// Age prediction methods
const AGE_PREDICTION_METHODS = [
  {
    name: "Standard (220 - Age)",
    formula: (age) => 220 - age,
    description: "Most common formula",
  },
  {
    name: "Tanaka (208 - 0.7 × Age)",
    formula: (age) => 208 - (0.7 * age),
    description: "More accurate for older adults",
  },
  {
    name: "Gulati Women (206 - 0.88 × Age)",
    formula: (age) => 206 - (0.88 * age),
    description: "Specific formula for women",
  },
];

export default function HeartRateZoneCalculator() {
  const [age, setAge] = useState(25);
  const [restingHR, setRestingHR] = useState(60);
  const [maxHR, setMaxHR] = useState(195);
  const [useCustomMaxHR, setUseCustomMaxHR] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState("General Fitness");
  const [gender, setGender] = useState("male");

  // Share functionality
  const { shareableCardRef, generateImage, generateShareData, validateResultForPrivacy } = useShareableImage('heart-rate');

  // Calculate predicted max HR
  const predictedMaxHR = useMemo(() => {
    const method = AGE_PREDICTION_METHODS[selectedMethod];
    if (!method) return 195;
    
    // Use gender-specific formula if Gulati is selected and user is female
    if (method.name.includes("Gulati") && gender === "female") {
      return round(method.formula(age));
    } else if (method.name.includes("Gulati") && gender === "male") {
      // Use Tanaka for males when Gulati is selected
      return round(208 - (0.7 * age));
    }
    
    return round(method.formula(age));
  }, [age, selectedMethod, gender]);

  // Use either custom or predicted max HR
  const effectiveMaxHR = useCustomMaxHR ? maxHR : predictedMaxHR;

  // Calculate heart rate zones using both percentage of max HR and Karvonen method
  const hrZones = useMemo(() => {
    return HR_ZONES.map(zone => {
      // Percentage of Max HR method
      const maxHRMin = round((zone.percentage.min / 100) * effectiveMaxHR);
      const maxHRMax = round((zone.percentage.max / 100) * effectiveMaxHR);
      
      // Karvonen method (Heart Rate Reserve)
      const hrReserve = effectiveMaxHR - restingHR;
      const karvonenMin = round(restingHR + (zone.percentage.min / 100) * hrReserve);
      const karvonenMax = round(restingHR + (zone.percentage.max / 100) * hrReserve);
      
      return {
        ...zone,
        maxHR: { min: maxHRMin, max: maxHRMax },
        karvonen: { min: karvonenMin, max: karvonenMax },
      };
    });
  }, [effectiveMaxHR, restingHR]);

  // Get recommendation for selected goal
  const goalRecommendation = TRAINING_GOALS.find(goal => goal.goal === selectedGoal);

  // Prepare share data for heart rate zones
  const shareResult = useMemo(() => {
    if (!hrZones || hrZones.length === 0 || !goalRecommendation) return null;
    
    const recommendedZones = hrZones.filter(zone => goalRecommendation.primaryZones.includes(zone.zone));
    const zoneRanges = recommendedZones.map(zone => `Zone ${zone.zone}: ${zone.maxHR.min}-${zone.maxHR.max} bpm`).join(', ');
    
    return validateResultForPrivacy({
      goal: selectedGoal,
      zones: zoneRanges,
      maxHR: effectiveMaxHR,
      restingHR: restingHR
    }, ['age', 'gender']); // Exclude sensitive input data
  }, [hrZones, goalRecommendation, selectedGoal, effectiveMaxHR, restingHR, validateResultForPrivacy]);

  const shareData = useMemo(() => {
    if (!shareResult) return null;
    return generateShareData(shareResult);
  }, [shareResult, generateShareData]);

  const handleGenerateImage = async () => {
    if (!shareResult) throw new Error('No results to share');
    return await generateImage();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 text-center"
      >
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Heart Rate Zone Calculator
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Calculate your personalized heart rate training zones
        </p>
      </motion.div>

      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            {/* Gender Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gender
              </label>
              <div className="flex gap-4">
                {["male", "female"].map((g) => (
                  <label key={g} className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={(e) => setGender(e.target.value)}
                      className="mr-2 h-4 w-4 text-blue-600"
                    />
                    <span className="capitalize text-sm font-medium">
                      {g}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age */}
            <InputField
              label="Age"
              value={age}
              onChange={setAge}
              type="number"
              placeholder="25"
              min="1"
              max="120"
            />

            {/* Resting Heart Rate */}
            <InputField
              label="Resting Heart Rate (bpm)"
              value={restingHR}
              onChange={setRestingHR}
              type="number"
              placeholder="60"
              min="30"
              max="120"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Measure first thing in the morning before getting out of bed
            </p>
          </div>

          {/* Max Heart Rate Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Maximum Heart Rate</h3>
            
            {/* Method Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Calculation Method
              </label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {AGE_PREDICTION_METHODS.map((method, index) => (
                  <option key={index} value={index}>
                    {method.name} - {method.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950/40">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Predicted Max HR: {predictedMaxHR} bpm
              </p>
            </div>

            {/* Custom Max HR Option */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useCustomMaxHR}
                  onChange={(e) => setUseCustomMaxHR(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                <span className="text-sm font-medium">Use known max heart rate</span>
              </label>
            </div>

            {useCustomMaxHR && (
              <InputField
                label="Known Max Heart Rate (bpm)"
                value={maxHR}
                onChange={setMaxHR}
                type="number"
                placeholder="195"
                min="120"
                max="250"
              />
            )}

            {/* Training Goal */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Training Goal
              </label>
              <select
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {TRAINING_GOALS.map((goal) => (
                  <option key={goal.goal} value={goal.goal}>
                    {goal.goal}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6">
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/40">
            <p>
              <strong>Note:</strong> For most accurate results, consider a professional fitness test to determine your actual maximum heart rate. Age-predicted formulas are estimates and individual variation is common.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Heart Rate Zones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
      >
        <h3 className="mb-6 text-center text-lg font-semibold">
          Your Heart Rate Training Zones
        </h3>
        
        <div className="space-y-4">
          {hrZones.map((zone) => {
            const isRecommended = goalRecommendation?.primaryZones.includes(zone.zone);
            
            return (
              <div
                key={zone.zone}
                className={`rounded-lg p-4 ${zone.bgColor} ${
                  isRecommended ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`text-xl font-bold ${zone.color}`}>
                      Zone {zone.zone}
                    </div>
                    <div>
                      <h4 className={`font-semibold ${zone.color}`}>{zone.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {zone.percentage.min}% - {zone.percentage.max}% of Max HR
                      </p>
                    </div>
                    {isRecommended && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                        Recommended
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">Heart Rate Range</h5>
                    <p className="text-lg font-bold">
                      {zone.maxHR.min} - {zone.maxHR.max} bpm
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">% of Max HR method</p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">Karvonen Method</h5>
                    <p className="text-lg font-bold">
                      {zone.karvonen.min} - {zone.karvonen.max} bpm
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Heart Rate Reserve</p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">Benefits</h5>
                    <p className="text-sm">{zone.benefits}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">Typical Activities</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {zone.activities.join(", ")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Training Recommendation */}
      {goalRecommendation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 p-6 shadow-lg dark:from-blue-900/30 dark:to-purple-900/30"
        >
          <h3 className="mb-4 text-lg font-semibold text-center">
            Training Recommendation for {selectedGoal}
          </h3>
          <div className="text-center">
            <p className="mb-3 text-gray-700 dark:text-gray-300">
              {goalRecommendation.description}
            </p>
            <div className="rounded-lg bg-white/50 p-4 dark:bg-gray-800/50">
              <p className="font-medium text-blue-900 dark:text-blue-200">
                {goalRecommendation.recommendation}
              </p>
            </div>
            
            {/* Share Button */}
            {shareResult && shareData && (
              <div className="mt-4">
                <ShareButton
                  onGenerateImage={handleGenerateImage}
                  shareData={shareData}
                  variant="primary"
                  className="mx-auto"
                />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-8 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 p-6 dark:from-red-900/20 dark:to-orange-900/20"
      >
        <h3 className="mb-4 text-lg font-semibold text-center">
          ❤️ Heart Rate Training Tips
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <h4 className="font-medium text-red-600 dark:text-red-400">
              Getting Started:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Use a heart rate monitor for accuracy</li>
              <li>• Start with lower zones and progress</li>
              <li>• Allow time for adaptation</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-orange-600 dark:text-orange-400">
              During Training:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Stay within your target zone</li>
              <li>• Listen to your body</li>
              <li>• Include recovery periods</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-600 dark:text-yellow-400">
              Important Notes:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Factors like stress affect HR</li>
              <li>• Medication can influence readings</li>
              <li>• Consult professionals if needed</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Hidden Shareable Card for Image Generation */}
      {shareResult && (
        <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">
          <ShareableResultCard
            ref={shareableCardRef}
            calculatorType="heart-rate"
            result={{
              value: `${shareResult.maxHR} bpm`,
              category: shareResult.goal
            }}
            subtitle={`Max HR | Resting: ${shareResult.restingHR} bpm`}
          />
        </div>
      )}
    </div>
  );
}
