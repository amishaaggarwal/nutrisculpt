
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import InputField from "@/components/atoms/InputField";
import UnitToggle from "@/components/pages/bmi/UnitToggle";
import ShareButton from "@/components/atoms/ShareButton";
import ShareableResultCard from "@/components/atoms/ShareableResultCard";
import { useShareableImage } from "@/hooks/useShareableImage";

// Utility functions
const round = (value, digits = 0) => {
  const p = Math.pow(10, digits);
  return Math.round(value * p) / p;
};

// Conversion utilities
const conversions = {
  kgToLb: (kg) => round(kg * 2.20462, 1),
  lbToKg: (lb) => round(lb / 2.20462, 1),
  cmToFtIn: (cm) => {
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inches = round(totalInches % 12, 1);
    return { ft, in: inches };
  },
  ftInToCm: (ft, inches) => round((ft * 12 + inches) * 2.54, 1),
};

// Activity levels for calorie calculation
const ACTIVITY_LEVELS = [
  {
    value: 1.2,
    label: "Sedentary",
    description: "Little to no exercise",
  },
  {
    value: 1.375,
    label: "Lightly Active",
    description: "Light exercise 1-3 days/week",
  },
  {
    value: 1.55,
    label: "Moderately Active",
    description: "Moderate exercise 3-5 days/week",
  },
  {
    value: 1.725,
    label: "Very Active",
    description: "Hard exercise 6-7 days/week",
  },
  {
    value: 1.9,
    label: "Extremely Active",
    description: "Very hard exercise, physical job",
  },
];

// Goals for calorie adjustment
const CALORIE_GOALS = [
  { value: -500, label: "Lose Weight", description: "1 lb/week loss" },
  { value: -250, label: "Mild Weight Loss", description: "0.5 lb/week loss" },
  { value: 0, label: "Maintain Weight", description: "Current weight" },
  { value: 250, label: "Mild Weight Gain", description: "0.5 lb/week gain" },
  { value: 500, label: "Gain Weight", description: "1 lb/week gain" },
];

// Calorie calculation utilities
const calorieUtils = {
  calculateBMR: (weight, height, age, gender) => {
    // Mifflin-St Jeor Equation
    if (gender === "male") {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  },
  calculateTDEE: (bmr, activityLevel) => {
    return bmr * activityLevel;
  },
  adjustForGoal: (tdee, goalAdjustment) => {
    return tdee + goalAdjustment;
  },
};

export default function CalorieCalculator() {
  const [unitSystem, setUnitSystem] = useState("metric");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(25);
  const [activityLevel, setActivityLevel] = useState(1.375);
  const [goal, setGoal] = useState(0);

  // Store both metric and imperial values
  const [weight, setWeight] = useState({ kg: 70, lb: 154.3 });
  const [height, setHeight] = useState({ cm: 170, ft: 5, in: 7 });

  // Share functionality
  const { shareableCardRef, generateImage, generateShareData, validateResultForPrivacy } = useShareableImage('calories');

  // Weight handlers
  const handleWeightChange = (value, unit) => {
    if (unit === "kg") {
      setWeight({ kg: value, lb: conversions.kgToLb(value) });
    } else {
      setWeight({ kg: conversions.lbToKg(value), lb: value });
    }
  };

  // Height handlers
  const handleHeightChange = (value, unit) => {
    if (unit === "cm") {
      const ftIn = conversions.cmToFtIn(value);
      setHeight({ cm: value, ft: ftIn.ft, in: ftIn.in });
    } else if (unit === "ft") {
      const cm = conversions.ftInToCm(value, height.in);
      setHeight({ cm, ft: value, in: height.in });
    } else if (unit === "in") {
      const cm = conversions.ftInToCm(height.ft, value);
      setHeight({ cm, ft: height.ft, in: value });
    }
  };

  // Calculate calories
  const { bmr, tdee, targetCalories } = useMemo(() => {
    const bmr = calorieUtils.calculateBMR(weight.kg, height.cm, age, gender);
    const tdee = calorieUtils.calculateTDEE(bmr, activityLevel);
    const targetCalories = calorieUtils.adjustForGoal(tdee, goal);
    
    return {
      bmr: round(bmr),
      tdee: round(tdee),
      targetCalories: round(targetCalories),
    };
  }, [weight.kg, height.cm, age, gender, activityLevel, goal]);

  const selectedActivity = ACTIVITY_LEVELS.find(level => level.value === activityLevel);
  const selectedGoal = CALORIE_GOALS.find(g => g.value === goal);

  // Prepare share data for calorie results
  const shareResult = useMemo(() => {
    if (!targetCalories || targetCalories <= 0) return null;
    
    return validateResultForPrivacy({
      value: targetCalories,
      unit: 'calories/day',
      goal: selectedGoal?.label || 'Maintain Weight',
      bmr: bmr,
      tdee: tdee
    }, ['weight', 'height', 'age', 'gender', 'activityLevel']); // Exclude sensitive input data
  }, [targetCalories, selectedGoal, bmr, tdee, validateResultForPrivacy]);

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
          Daily Calorie Calculator
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Calculate your daily calorie needs based on your goals and activity level
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
              unit="years"
            />

            {/* Weight */}
            <div className="flex gap-2">
              <div className="flex-1">
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
                  unit={unitSystem === "metric" ? "kg" : "lb"}
                />
              </div>
            </div>

            {/* Height */}
            {unitSystem === "metric" ? (
              <InputField
                label="Height(cm)"
                value={height.cm}
                onChange={(value) => handleHeightChange(value, "cm")}
                type="number"
                placeholder="170"
                min="1"
                unit="cm"
              />
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <InputField
                    label="Height (ft)"
                    value={height.ft}
                    onChange={(value) => handleHeightChange(value, "ft")}
                    type="number"
                    placeholder="5"
                    min="1"
                    unit="ft"
                  />
                </div>
                <div className="flex-1">
                  <InputField
                    label="Height (in)"
                    value={height.in}
                    onChange={(value) => handleHeightChange(value, "in")}
                    type="number"
                    placeholder="7"
                    min="0"
                    max="11"
                    unit="in"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Activity & Goals */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Activity & Goals</h3>
            
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

            {/* Goal Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {CALORIE_GOALS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label} - {g.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-inset ring-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/40">
            <p>
              These calculations are estimates based on general formulas. Individual needs may vary based on metabolism, medical conditions, and other factors. Consult a healthcare professional or nutritionist for personalized advice.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Results Section */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* BMR Result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <div className="text-center">
            <h3 className="mb-4 text-lg font-semibold">Basal Metabolic Rate</h3>
            <div className="mb-4">
              <p className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                {bmr}
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                calories/day
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Calories burned at rest
            </p>
          </div>
        </motion.div>

        {/* TDEE Result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <div className="text-center">
            <h3 className="mb-4 text-lg font-semibold">Maintenance Calories</h3>
            <div className="mb-4">
              <p className="text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {tdee}
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                calories/day
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              With {selectedActivity?.label.toLowerCase()} lifestyle
            </p>
          </div>
        </motion.div>

        {/* Target Calories Result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <div className="text-center">
            <h3 className="mb-4 text-lg font-semibold">Target Calories</h3>
            <div className="mb-4">
              <p className="text-4xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">
                {targetCalories}
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                calories/day
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              To {selectedGoal?.label.toLowerCase()}
            </p>
            
            {/* Share Button */}
            {shareResult && shareData && (
              <div className="mt-4">
                <ShareButton
                  onGenerateImage={handleGenerateImage}
                  shareData={shareData}
                  variant="secondary"
                  className="w-full"
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Macronutrient Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
      >
        <h3 className="mb-6 text-center text-lg font-semibold">
          Recommended Macronutrient Breakdown
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              name: "Protein",
              percentage: 25,
              color: "text-red-600 dark:text-red-400",
              bgColor: "bg-red-100 dark:bg-red-700/20",
              calories: round(targetCalories * 0.25),
              grams: round((targetCalories * 0.25) / 4),
            },
            {
              name: "Carbohydrates",
              percentage: 45,
              color: "text-blue-600 dark:text-blue-400",
              bgColor: "bg-blue-100 dark:bg-blue-700/20",
              calories: round(targetCalories * 0.45),
              grams: round((targetCalories * 0.45) / 4),
            },
            {
              name: "Fats",
              percentage: 30,
              color: "text-yellow-600 dark:text-yellow-400",
              bgColor: "bg-yellow-100 dark:bg-yellow-700/20",
              calories: round(targetCalories * 0.30),
              grams: round((targetCalories * 0.30) / 9),
            },
          ].map(({ name, percentage, color, bgColor, calories, grams }) => (
            <div
              key={name}
              className={`rounded-lg p-4 text-center ${bgColor}`}
            >
              <h4 className={`text-lg font-bold ${color}`}>{name}</h4>
              <p className="mt-1 text-sm font-semibold">{percentage}%</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {calories} calories
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {grams}g per day
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-8 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:from-blue-900/20 dark:to-purple-900/20"
      >
        <h3 className="mb-4 text-lg font-semibold text-center">
          💡 Quick Tips
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-600 dark:text-blue-400">
              For Weight Loss:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Create a moderate calorie deficit</li>
              <li>• Focus on protein to preserve muscle</li>
              <li>• Stay hydrated and get adequate sleep</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-emerald-600 dark:text-emerald-400">
              For Weight Gain:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Eat nutrient-dense, calorie-rich foods</li>
              <li>• Include healthy fats and complex carbs</li>
              <li>• Combine with strength training</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Hidden Shareable Card for Image Generation */}
      {shareResult && (
        <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">
          <ShareableResultCard
            ref={shareableCardRef}
            calculatorType="calories"
            result={{
              value: shareResult.value,
              unit: shareResult.unit
            }}
            subtitle={`Goal: ${shareResult.goal} | BMR: ${shareResult.bmr} | TDEE: ${shareResult.tdee}`}
          />
        </div>
      )}
    </div>
  );
}
