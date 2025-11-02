
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import InputField from "@/components/atoms/InputField";
import UnitToggle from "@/components/pages/bmi/UnitToggle";
import ShareButton from "@/components/atoms/ShareButton";
import ResultCard from "@/components/atoms/ResultCard";
import { useShareableImage } from "@/hooks/useShareableImage";

// Utility functions
const round = (value, digits = 1) => {
  const p = Math.pow(10, digits);
  return Math.round(value * p) / p;
};

// Conversion utilities
const conversions = {
  kgToLb: (kg) => round(kg * 2.20462, 1),
  lbToKg: (lb) => round(lb / 2.20462, 1),
  literToOz: (liters) => round(liters * 33.814, 1),
  ozToLiter: (oz) => round(oz / 33.814, 1),
  literToCups: (liters) => round(liters * 4.227, 1),
  cupsToLiter: (cups) => round(cups / 4.227, 1),
};

// Activity levels for water adjustment
const ACTIVITY_LEVELS = [
  { value: 1.0, label: "Sedentary", description: "Little to no exercise", adjustment: 0 },
  { value: 1.2, label: "Light Activity", description: "Light exercise 1-3 days/week", adjustment: 0.35 },
  { value: 1.4, label: "Moderate Activity", description: "Moderate exercise 3-5 days/week", adjustment: 0.7 },
  { value: 1.6, label: "High Activity", description: "Hard exercise 6-7 days/week", adjustment: 1.0 },
  { value: 1.8, label: "Very High Activity", description: "Very hard exercise, physical job", adjustment: 1.5 },
];

// Climate conditions
const CLIMATE_CONDITIONS = [
  { value: 1.0, label: "Temperate", description: "Normal temperature & humidity", adjustment: 0 },
  { value: 1.2, label: "Hot Climate", description: "High temperature or humidity", adjustment: 0.5 },
  { value: 1.4, label: "Very Hot/Humid", description: "Extreme heat or humidity", adjustment: 1.0 },
  { value: 1.1, label: "Cold Climate", description: "Low temperature", adjustment: 0.2 },
];

// Health conditions that affect water needs
const HEALTH_CONDITIONS = [
  { id: "fever", label: "Fever", adjustment: 0.5 },
  { id: "vomiting", label: "Vomiting/Diarrhea", adjustment: 0.7 },
  { id: "bladderInfection", label: "Bladder Infection", adjustment: 0.3 },
  { id: "heartDisease", label: "Heart Disease", adjustment: -0.2 },
  { id: "kidneyDisease", label: "Kidney Disease", adjustment: -0.3 },
];

export default function WaterIntakeCalculator() {
  const [unitSystem, setUnitSystem] = useState("metric");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(25);
  const [activityLevel, setActivityLevel] = useState(1.0);
  const [climateCondition, setClimateCondition] = useState(1.0);
  const [isPregnant, setIsPregnant] = useState(false);
  const [isBreastfeeding, setIsBreastfeeding] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);

  // Share functionality
  const { shareableCardRef, generateImage, generateShareData, validateResultForPrivacy } = useShareableImage('water-intake');

  // Store both metric and imperial values
  const [weight, setWeight] = useState({ kg: 70, lb: 154.3 });

  // Weight handlers
  const handleWeightChange = (value, unit) => {
    if (unit === "kg") {
      setWeight({ kg: value, lb: conversions.kgToLb(value) });
    } else {
      setWeight({ kg: conversions.lbToKg(value), lb: value });
    }
  };

  // Handle health condition selection
  const handleConditionChange = (conditionId) => {
    setSelectedConditions(prev => 
      prev.includes(conditionId)
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  // Calculate daily water intake
  const waterIntake = useMemo(() => {
    const weightKg = weight.kg;
    if (!weightKg || weightKg <= 0) return { liters: 0, oz: 0, cups: 0 };

    // Base calculation: 35ml per kg of body weight
    let baseIntake = (weightKg * 35) / 1000; // Convert to liters

    // Age adjustments
    if (age >= 65) {
      baseIntake *= 0.9; // Elderly need slightly less
    } else if (age < 18) {
      baseIntake *= 1.1; // Children and teens need more per kg
    }

    // Gender adjustments (men typically need more)
    if (gender === "male") {
      baseIntake *= 1.1;
    }

    // Activity level adjustment
    const activityData = ACTIVITY_LEVELS.find(level => level.value === activityLevel);
    baseIntake += (activityData?.adjustment || 0);

    // Climate adjustment
    const climateData = CLIMATE_CONDITIONS.find(climate => climate.value === climateCondition);
    baseIntake += (climateData?.adjustment || 0);

    // Pregnancy and breastfeeding adjustments
    if (isPregnant) {
      baseIntake += 0.3; // Additional 300ml
    }
    if (isBreastfeeding) {
      baseIntake += 0.7; // Additional 700ml
    }

    // Health condition adjustments
    selectedConditions.forEach(conditionId => {
      const condition = HEALTH_CONDITIONS.find(c => c.id === conditionId);
      if (condition) {
        baseIntake += condition.adjustment;
      }
    });

    // Ensure minimum intake
    baseIntake = Math.max(baseIntake, 1.5);

    return {
      liters: round(baseIntake, 1),
      oz: round(conversions.literToOz(baseIntake), 0),
      cups: round(conversions.literToCups(baseIntake), 1),
      ml: round(baseIntake * 1000, 0),
    };
  }, [weight.kg, age, gender, activityLevel, climateCondition, isPregnant, isBreastfeeding, selectedConditions]);

  // Calculate hourly intake recommendations
  const hourlyIntake = useMemo(() => {
    const totalMl = waterIntake.ml;
    const wakingHours = 16; // Assuming 8 hours sleep
    
    return {
      ml: round(totalMl / wakingHours, 0),
      oz: round(conversions.literToOz(totalMl / 1000) / wakingHours, 1),
    };
  }, [waterIntake.ml]);

  // Prepare share data for water intake results
  const shareResult = useMemo(() => {
    if (!waterIntake.liters || waterIntake.liters <= 0) return null;
    
    return validateResultForPrivacy({
      value: waterIntake.liters,
      unit: 'L/day',
      alternativeUnits: `${waterIntake.ml}ml | ${waterIntake.oz}oz | ${waterIntake.cups} cups`,
      hourlyGoal: `${hourlyIntake.ml}ml/hour`
    }, ['weight', 'age', 'gender', 'activityLevel', 'climateCondition', 'selectedConditions', 'isPregnant', 'isBreastfeeding']); // Exclude sensitive input data
  }, [waterIntake, hourlyIntake, validateResultForPrivacy]);

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
          Daily Water Intake Calculator
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Calculate your personalized daily water intake needs
        </p>
      </motion.div>

      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
      >
        {/* Unit System Selector */}
        <div className="mb-6 flex justify-center">
          <UnitToggle unitSystem={unitSystem} onUnitChange={setUnitSystem} />
        </div>

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

            {/* Weight */}
            <InputField
              label={`Weight (${unitSystem === "metric" ? "kg" : "lbs"})`}
              value={unitSystem === "metric" ? weight.kg : weight.lb}
              onChange={(value) =>
                handleWeightChange(
                  value,
                  unitSystem === "metric" ? "kg" : "lb"
                )
              }
              type="number"
              placeholder={unitSystem === "metric" ? "70" : "154"}
              min="1"
            />

            {/* Special Conditions for Women */}
            {gender === "female" && (
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={(e) => setIsPregnant(e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">Pregnant</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isBreastfeeding}
                    onChange={(e) => setIsBreastfeeding(e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">Breastfeeding</span>
                </label>
              </div>
            )}
          </div>

          {/* Activity & Environment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Activity & Environment</h3>
            
            {/* Activity Level */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {ACTIVITY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Climate Condition */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Climate Condition
              </label>
              <select
                value={climateCondition}
                onChange={(e) => setClimateCondition(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {CLIMATE_CONDITIONS.map((climate) => (
                  <option key={climate.value} value={climate.value}>
                    {climate.label} - {climate.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Health Conditions */}
        <div className="mt-6">
          <h3 className="mb-4 text-lg font-semibold">Health Conditions</h3>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Select any conditions that apply (these affect water needs):
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {HEALTH_CONDITIONS.map((condition) => (
              <label key={condition.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(condition.id)}
                  onChange={() => handleConditionChange(condition.id)}
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                <span className="text-sm font-medium">{condition.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6">
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/40">
            <p>
              <strong>Medical Disclaimer:</strong> This calculator provides general estimates. Individual needs may vary. Consult healthcare professionals, especially if you have medical conditions affecting fluid balance.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Results Section */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Daily Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <div className="text-center">
            <h3 className="mb-4 text-lg font-semibold">Daily Total</h3>
            <div className="mb-4">
              <p className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                {waterIntake.liters}L
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {waterIntake.ml} ml
              </p>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>{waterIntake.oz} fl oz</p>
              <p>{waterIntake.cups} cups</p>
            </div>
            

          </div>
        </motion.div>

        {/* Hourly Intake */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <div className="text-center">
            <h3 className="mb-4 text-lg font-semibold">Hourly Goal</h3>
            <div className="mb-4">
              <p className="text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {hourlyIntake.ml}
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                ml per hour
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {hourlyIntake.oz} fl oz per hour
            </p>
          </div>
        </motion.div>

        {/* Water Bottles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <div className="text-center">
            <h3 className="mb-4 text-lg font-semibold">Water Bottles</h3>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {round(waterIntake.liters / 0.5, 1)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">500ml bottles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {round(waterIntake.oz / 16.9, 1)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">16.9 fl oz bottles</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hydration Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
      >
        <h3 className="mb-6 text-center text-lg font-semibold">
          Suggested Hydration Schedule
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { time: "Wake Up", amount: round(waterIntake.ml * 0.15), description: "Start your day" },
            { time: "Morning", amount: round(waterIntake.ml * 0.25), description: "Pre-lunch" },
            { time: "Afternoon", amount: round(waterIntake.ml * 0.35), description: "Peak hours" },
            { time: "Evening", amount: round(waterIntake.ml * 0.25), description: "Before dinner" },
          ].map(({ time, amount, description }) => (
            <div key={time} className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950/40">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200">{time}</h4>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{amount}ml</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">{description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-8 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 p-6 dark:from-cyan-900/20 dark:to-blue-900/20"
      >
        <h3 className="mb-4 text-lg font-semibold text-center">
          💧 Hydration Tips
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <h4 className="font-medium text-cyan-600 dark:text-cyan-400">
              Stay Consistent:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Sip throughout the day</li>
              <li>• Don&apos;t wait until you&apos;re thirsty</li>
              <li>• Set hourly reminders</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-600 dark:text-blue-400">
              Quality Matters:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Choose clean, filtered water</li>
              <li>• Limit sugary drinks</li>
              <li>• Herbal teas count too</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-indigo-600 dark:text-indigo-400">
              Monitor Signs:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Urine should be pale yellow</li>
              <li>• Check for thirst and fatigue</li>
              <li>• Adjust for activity and weather</li>
            </ul>
          </div>
        </div>
      </motion.div>

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
          <div className="flex justify-center">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <ResultCard
                type="water"
                value={shareResult.value}
                category="Optimal"
                subtitle={`${shareResult.alternativeUnits} | Goal: ${shareResult.hourlyGoal}`}
                aspectRatio="square"
              />
            </div>
          </div>
          <div className="text-center mt-6">
            <ShareButton
              onGenerateImage={handleGenerateImage}
              shareData={shareData}
              variant="secondary"
              className="mx-auto"
            />
          </div>
        </div>
      )}

      {/* Hidden Shareable Card for Image Generation */}
      {shareResult && (
        <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">
          <ResultCard
            ref={shareableCardRef}
            type="water"
            value={shareResult.value}
            category="Optimal"
            subtitle={`${shareResult.alternativeUnits} | Goal: ${shareResult.hourlyGoal}`}
          />
        </div>
      )}
    </div>
  );
}
