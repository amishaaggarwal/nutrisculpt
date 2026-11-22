
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import InputField from "@/components/atoms/InputField";
import ShareButton from "@/components/atoms/ShareButton";
import ResultCard from "@/components/atoms/ResultCard";
import ResultExplanation from "@/components/atoms/ResultExplanation";
import HealthDisclaimer from "@/components/atoms/HealthDisclaimer";
import { useShareableImage } from "@/hooks/useShareableImage";
import CalculatorNextStep from "@/components/atoms/CalculatorNextStep";
import {
  MAX_HR_METHODS,
  computeHrZones,
  validateHeartRateInputs,
} from "@/lib/calculators.mjs";

// Heart rate zone definitions
const HR_ZONES = [
  {
    zone: 1,
    name: "Recovery",
    percentage: { min: 50, max: 60 },
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-700/20",
    description: "Very light intensity, active recovery",
    benefits: "Recovery, warm-up, active recovery",
    activities: ["Walking", "Easy cycling", "Gentle yoga"],
  },
  {
    zone: 2,
    name: "Aerobic Base",
    percentage: { min: 60, max: 70 },
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-700/20",
    description: "Light intensity, aerobic development",
    benefits: "Builds aerobic base, general endurance",
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
    name: "Maximal Effort",
    percentage: { min: 90, max: 100 },
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-700/20",
    description: "Near-maximal effort, neuromuscular power",
    benefits: "Anaerobic capacity, neuromuscular power",
    activities: ["Sprint intervals", "Hill sprints", "HIIT"],
  },
];

// Training goals and recommended zones
const TRAINING_GOALS = [
  {
    goal: "Weight Loss",
    primaryZones: [1, 2],
    description: "Regular moderate-intensity activity alongside overall energy balance",
    recommendation: "Most sessions at a moderate intensity. Weight change depends mainly on total energy balance, not on a specific heart-rate zone.",
  },
  {
    goal: "General Fitness",
    primaryZones: [2, 3],
    description: "Build overall cardiovascular health",
    recommendation: "Mix easy and moderate sessions, with occasional recovery work.",
  },
  {
    goal: "Endurance",
    primaryZones: [2, 3, 4],
    description: "Build aerobic capacity and endurance",
    recommendation: "Mostly easy volume with some moderate-to-hard sessions.",
  },
  {
    goal: "Performance",
    primaryZones: [3, 4, 5],
    description: "Improve speed and power",
    recommendation: "Include higher-intensity work as tolerated and recovered.",
  },
];

export default function HeartRateZoneCalculator() {
  const [age, setAge] = useState(25);
  const [restingHR, setRestingHR] = useState(60);
  const [maxHR, setMaxHR] = useState(195);
  const [useCustomMaxHR, setUseCustomMaxHR] = useState(false);
  const [methodIndex, setMethodIndex] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState("General Fitness");
  const [gender, setGender] = useState("male");

  // Share functionality
  const { shareableCardRef, generateImage, generateShareData, validateResultForPrivacy } = useShareableImage('heart-rate');

  const method = MAX_HR_METHODS[methodIndex] || MAX_HR_METHODS[0];

  // Keep the selected method valid for the chosen gender.
  const handleGenderChange = (nextGender) => {
    setGender(nextGender);
    const current = MAX_HR_METHODS[methodIndex] || MAX_HR_METHODS[0];
    if (!current.genders.includes(nextGender)) {
      setMethodIndex(0);
    }
  };

  const validation = useMemo(
    () =>
      validateHeartRateInputs({
        age,
        restingHR,
        maxHR,
        useCustomMaxHR,
        methodId: method.id,
        sex: gender,
      }),
    [age, restingHR, maxHR, useCustomMaxHR, method.id, gender]
  );

  // Use either custom or predicted max HR
  const effectiveMaxHR = validation.predicted;

  // Calculate heart rate zones using both percentage of max HR and Karvonen method
  const hrZones = useMemo(() => {
    if (!validation.valid || !Number.isFinite(effectiveMaxHR)) return null;
    return computeHrZones({
      maxHR: effectiveMaxHR,
      restingHR,
      zones: HR_ZONES,
    });
  }, [validation.valid, effectiveMaxHR, restingHR]);

  // Get recommendation for selected goal
  const goalRecommendation = TRAINING_GOALS.find(goal => goal.goal === selectedGoal);

  // Prepare share data for heart rate zones.
  // Allowlist: only fields that are actually rendered on the card or used in
  // the share message. Resting heart rate is used for the Karvonen
  // calculation only and is deliberately never placed on the shareable card.
  const shareResult = useMemo(() => {
    if (!hrZones || hrZones.length === 0 || !goalRecommendation) return null;

    return validateResultForPrivacy({
      goal: selectedGoal,
      maxHR: effectiveMaxHR,
      maxHRLabel: useCustomMaxHR
        ? "Entered maximum heart rate"
        : "Estimated maximum heart rate"
    }, ['age', 'gender']); // Exclude sensitive input data
  }, [hrZones, goalRecommendation, selectedGoal, effectiveMaxHR, useCustomMaxHR, validateResultForPrivacy]);

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
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
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
                      onChange={(e) => handleGenderChange(e.target.value)}
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
            {validation.errors.age && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {validation.errors.age}
              </p>
            )}

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
            {validation.errors.restingHR && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {validation.errors.restingHR}
              </p>
            )}
            {validation.errors.reserve && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {validation.errors.reserve}
              </p>
            )}
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
                value={methodIndex}
                onChange={(e) => setMethodIndex(parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {MAX_HR_METHODS.map((m, index) => (
                  <option
                    key={m.id}
                    value={index}
                    disabled={!m.genders.includes(gender)}
                  >
                    {m.name} - {m.note}
                  </option>
                ))}
              </select>
              {validation.errors.method && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {validation.errors.method}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950/40">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {useCustomMaxHR ? "Using your measured max HR" : "Predicted Max HR"}:{" "}
                {validation.valid && Number.isFinite(effectiveMaxHR)
                  ? `${effectiveMaxHR} bpm`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
                {useCustomMaxHR
                  ? "Your entered value is used directly."
                  : `${method.name}. ${method.note}`}
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
            {validation.errors.maxHR && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {validation.errors.maxHR}
              </p>
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

        {!hrZones ? (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-900 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/40">
            <p className="font-semibold">Check your inputs</p>
            <ul className="mt-2 list-disc pl-5">
              {Object.values(validation.errors).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Two models are shown. <strong>% of Max HR</strong> applies the percentage directly to
              estimated maximum heart rate. <strong>Karvonen (Heart Rate Reserve)</strong> applies
              the same percentage to the difference between maximum and resting heart rate, so its
              values sit higher for the same zone. They are alternative estimates, not equivalent
              prescriptions.
            </p>
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
                
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
          </>
        )}
      </motion.div>

      {/* Talk Test */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
      >
        <h3 className="mb-4 text-center text-lg font-semibold">Talk Test</h3>
        <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
          A practical way to gauge intensity without a monitor. It is a general cue, not a
          replacement for medical evaluation.
        </p>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/40">
            <h4 className="font-semibold text-emerald-700 dark:text-emerald-300">
              Moderate intensity
            </h4>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              You can talk comfortably but not sing.
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/40">
            <h4 className="font-semibold text-red-700 dark:text-red-300">
              Vigorous intensity
            </h4>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Speaking more than a few words requires pausing for breath.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Red flags */}
      <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-900 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/40">
        <p>
          <strong>Stop and seek urgent care</strong> for chest pain or pressure, fainting, severe
          dizziness, or severe or unusual breathlessness. These ranges are not a substitute for
          clinical assessment.
        </p>
      </div>

      {/* Educational explanation */}
      <div className="mt-6">
        <ResultExplanation
          whatItMeans={
            <>
              Your estimated maximum heart rate is{" "}
              <strong>{Number.isFinite(effectiveMaxHR) ? `${effectiveMaxHR} bpm` : "—"}</strong>
              {useCustomMaxHR
                ? " (your entered value)"
                : ` (${method.name})`}
              . Your heart rate training zones are ranges of heartbeats per minute that
              correspond to different training intensities. Zone 1 is the lightest and Zone 5 is
              the most intense. Zones are calculated as percentages of that maximum.
            </>
          }
          whyItMatters={
            <>
              Training in different zones produces different fitness benefits. Lower zones support
              recovery and endurance, while higher zones improve cardiovascular fitness, speed and
              power. Knowing your zones helps you structure workouts to match your goals. The Talk
              Test is a practical check: at moderate intensity you can talk but not sing; at
              vigorous intensity you can only manage a few words before pausing for breath.
            </>
          }
          limitations={
            <>
              Maximum heart rate formulas are population estimates with wide individual variation.
              A measured maximum is more accurate than an age-based prediction. Beta blockers and
              other heart-rate-altering medications, cardiovascular conditions, pregnancy, and
              clinician-prescribed exercise limits can make predicted ranges unreliable; in those
              cases, clinician-guided targets or perceived exertion may be more appropriate.
              Standard zones do not identify lactate thresholds, VO₂max boundaries, or a
              fat-burning requirement, and no single zone guarantees fat loss.
            </>
          }
        />
      </div>

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
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Health Disclaimer */}
      <div className="mt-6">
        <HealthDisclaimer
          universalDisclaimer={
            <>
              The results provided are estimates based on general population
              formulas and the information you have entered. They are
              intended for general educational and fitness guidance, not as a
              substitute for professional medical advice. Individual
              requirements may vary depending on age, body composition,
              activity level, lifestyle, health status and other personal
              factors. These values should be treated as a starting reference,
              not fixed targets. Health Notice: If you have an existing medical
              condition, metabolic disorder, are taking medication, are
              pregnant, or have specific dietary or exercise restrictions,
              consult a qualified healthcare professional before making
              changes to your diet, hydration or exercise routine. Remember:
              Your fitness journey is individual. Use these results as a
              starting point and adjust your approach based on your body&apos;s
              response and professional guidance.
            </>
          }
          specificCaution={
            <>
              These zones are estimates, not individually measured training thresholds. Beta
              blockers and other heart-rate-altering medications, cardiovascular conditions, and
              clinician-prescribed exercise limits can make standard ranges unreliable. Seek
              medical guidance before starting or changing exercise if you have relevant health
              concerns, and stop for chest pain, fainting, severe dizziness, or unusual
              breathlessness.
            </>
          }
        />
      </div>

      {/* Enhanced Interactive Result Card Preview */}
      {shareResult && (
        <div className="mt-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your Shareable Result
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Interactive fitness-inspired result card with animations
            </p>
          </div>
          <div className="flex justify-center px-2 sm:px-4">
            <div className="w-full max-w-xs sm:max-w-sm transform hover:scale-105 transition-transform duration-300">
              <ResultCard
                type="heart"
                value={shareResult.maxHR}
                category={shareResult.goal}
                subtitle={shareResult.maxHRLabel}
                aspectRatio="square"
              />
            </div>
          </div>
          <div className="text-center mt-6">
            <ShareButton
              onGenerateImage={handleGenerateImage}
              shareData={shareData}
              variant="primary"
              className="mx-auto"
            />
          </div>
        </div>
      )}

      {/* Calculator Next Step */}
      <CalculatorNextStep
        heading="What's Next"
        description={
          <>
            Estimated heart-rate ranges can support general exercise-intensity
            education. Explore performance coaching or your broader fitness
            picture.
          </>
        }
        source="calculator-heart-rate"
        calculatorId="heart-rate"
        showEnquiry={true}
        primaryCta={{
          label: "Explore Performance Coaching",
          href: "/services/category/functional-fitness-life-stages",
        }}
        secondaryLinks={[
          {
            label: "Explore Your Fitness & Health Snapshot",
            href: "/transformation",
          },
        ]}
      />

      {/* Hidden Shareable Card for Image Generation */}
      {shareResult && (
        <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">
          <ResultCard
            ref={shareableCardRef}
            type="heart"
            value={shareResult.maxHR}
            category={shareResult.goal}
            subtitle={shareResult.maxHRLabel}
          />
        </div>
      )}
    </div>
  );
}
