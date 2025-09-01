
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import InputField from "@/components/atoms/InputField";
import UnitToggle from "@/components/pages/bmi/UnitToggle";

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

// Activity levels for TDEE calculation
const ACTIVITY_LEVELS = [
  { value: 1.2, label: "Sedentary", description: "Little to no exercise" },
  { value: 1.375, label: "Lightly Active", description: "Light exercise 1-3 days/week" },
  { value: 1.55, label: "Moderately Active", description: "Moderate exercise 3-5 days/week" },
  { value: 1.725, label: "Very Active", description: "Hard exercise 6-7 days/week" },
  { value: 1.9, label: "Extremely Active", description: "Very hard exercise, physical job" },
];

// Macro distribution presets
const MACRO_PRESETS = [
  { name: "Balanced", protein: 25, carbs: 45, fat: 30 },
  { name: "High Protein", protein: 35, carbs: 35, fat: 30 },
  { name: "Low Carb", protein: 30, carbs: 20, fat: 50 },
  { name: "Keto", protein: 25, carbs: 5, fat: 70 },
  { name: "High Carb", protein: 20, carbs: 60, fat: 20 },
  { name: "Custom", protein: 25, carbs: 45, fat: 30 },
];

// Calorie calculation utilities
const calorieUtils = {
  calculateBMR: (weight, height, age, gender) => {
    if (gender === "male") {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  },
  calculateTDEE: (bmr, activityLevel) => {
    return bmr * activityLevel;
  },
};

export default function MacroCalculator() {
  const [unitSystem, setUnitSystem] = useState("metric");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(25);
  const [activityLevel, setActivityLevel] = useState(1.375);
  const [calories, setCalories] = useState(2000);
  const [useCalculatedCalories, setUseCalculatedCalories] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState("Balanced");
  const [customMacros, setCustomMacros] = useState({ protein: 25, carbs: 45, fat: 30 });

  // Store both metric and imperial values
  const [weight, setWeight] = useState({ kg: 70, lb: 154.3 });
  const [height, setHeight] = useState({ cm: 170, ft: 5, in: 7 });

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

  // Calculate TDEE
  const calculatedCalories = useMemo(() => {
    const bmr = calorieUtils.calculateBMR(weight.kg, height.cm, age, gender);
    const tdee = calorieUtils.calculateTDEE(bmr, activityLevel);
    return round(tdee);
  }, [weight.kg, height.cm, age, gender, activityLevel]);

  // Get current macro percentages
  const currentMacros = useMemo(() => {
    if (selectedPreset === "Custom") {
      return customMacros;
    }
    return MACRO_PRESETS.find(preset => preset.name === selectedPreset) || MACRO_PRESETS[0];
  }, [selectedPreset, customMacros]);

  // Calculate macro breakdown
  const macroBreakdown = useMemo(() => {
    const totalCalories = useCalculatedCalories ? calculatedCalories : calories;
    
    return {
      protein: {
        percentage: currentMacros.protein,
        calories: round(totalCalories * (currentMacros.protein / 100)),
        grams: round((totalCalories * (currentMacros.protein / 100)) / 4),
      },
      carbs: {
        percentage: currentMacros.carbs,
        calories: round(totalCalories * (currentMacros.carbs / 100)),
        grams: round((totalCalories * (currentMacros.carbs / 100)) / 4),
      },
      fat: {
        percentage: currentMacros.fat,
        calories: round(totalCalories * (currentMacros.fat / 100)),
        grams: round((totalCalories * (currentMacros.fat / 100)) / 9),
      },
    };
  }, [calculatedCalories, calories, useCalculatedCalories, currentMacros]);

  const handleMacroChange = (macro, value) => {
    setCustomMacros(prev => ({
      ...prev,
      [macro]: value
    }));
  };

  const totalPercentage = currentMacros.protein + currentMacros.carbs + currentMacros.fat;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 text-center"
      >
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Macro Calculator
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Calculate your daily macronutrient needs for optimal nutrition
        </p>
      </motion.div>

      {/* Calorie Source Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-6 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
      >
        <h3 className="mb-4 text-lg font-semibold text-center">Calorie Target</h3>
        <div className="flex justify-center gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="calorieSource"
              checked={useCalculatedCalories}
              onChange={() => setUseCalculatedCalories(true)}
              className="mr-2 h-4 w-4 text-blue-600"
            />
            <span className="text-sm font-medium">Calculate from body stats</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="calorieSource"
              checked={!useCalculatedCalories}
              onChange={() => setUseCalculatedCalories(false)}
              className="mr-2 h-4 w-4 text-blue-600"
            />
            <span className="text-sm font-medium">Enter manually</span>
          </label>
        </div>
      </motion.div>

      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
      >
        {useCalculatedCalories ? (
          <>
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

                {/* Height */}
                {unitSystem === "metric" ? (
                  <InputField
                    label="Height (cm)"
                    value={height.cm}
                    onChange={(value) => handleHeightChange(value, "cm")}
                    type="number"
                    placeholder="170"
                    min="1"
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
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Level */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Activity Level</h3>
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
                <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950/40">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Calculated Daily Calories: {calculatedCalories}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto">
            <InputField
              label="Daily Calorie Target"
              value={calories}
              onChange={setCalories}
              type="number"
              placeholder="2000"
              min="1"
            />
          </div>
        )}

        {/* Macro Preset Selection */}
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold text-center">Macro Distribution</h3>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Choose Preset
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {MACRO_PRESETS.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name} ({preset.protein}% / {preset.carbs}% / {preset.fat}%)
                </option>
              ))}
            </select>
          </div>

          {/* Custom Macro Inputs */}
          {selectedPreset === "Custom" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <InputField
                label="Protein %"
                value={customMacros.protein}
                onChange={(value) => handleMacroChange("protein", value)}
                type="number"
                min="1"
                max="100"
                placeholder="25"
              />
              <InputField
                label="Carbohydrates %"
                value={customMacros.carbs}
                onChange={(value) => handleMacroChange("carbs", value)}
                type="number"
                min="1"
                max="100"
                placeholder="45"
              />
              <InputField
                label="Fat %"
                value={customMacros.fat}
                onChange={(value) => handleMacroChange("fat", value)}
                type="number"
                min="1"
                max="100"
                placeholder="30"
              />
            </div>
          )}

          {selectedPreset === "Custom" && totalPercentage !== 100 && (
            <div className="mt-4 rounded-lg bg-amber-100 p-3 text-center dark:bg-amber-900/30">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Total: {totalPercentage}% (should equal 100%)
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Results Section */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Protein */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <div className="text-center">
            <h3 className="mb-4 text-lg font-semibold">Protein</h3>
            <div className="mb-4">
              <p className="text-4xl font-extrabold tracking-tight text-red-600 dark:text-red-400">
                {macroBreakdown.protein.grams}g
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {macroBreakdown.protein.calories} calories ({macroBreakdown.protein.percentage}%)
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-red-600 h-2 rounded-full dark:bg-red-400" 
                style={{ width: `${macroBreakdown.protein.percentage}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Carbohydrates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <div className="text-center">
            <h3 className="mb-4 text-lg font-semibold">Carbohydrates</h3>
            <div className="mb-4">
              <p className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                {macroBreakdown.carbs.grams}g
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {macroBreakdown.carbs.calories} calories ({macroBreakdown.carbs.percentage}%)
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2 rounded-full dark:bg-blue-400" 
                style={{ width: `${macroBreakdown.carbs.percentage}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Fat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <div className="text-center">
            <h3 className="mb-4 text-lg font-semibold">Fat</h3>
            <div className="mb-4">
              <p className="text-4xl font-extrabold tracking-tight text-yellow-600 dark:text-yellow-400">
                {macroBreakdown.fat.grams}g
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {macroBreakdown.fat.calories} calories ({macroBreakdown.fat.percentage}%)
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-yellow-600 h-2 rounded-full dark:bg-yellow-400" 
                style={{ width: `${macroBreakdown.fat.percentage}%` }}
              ></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Meal Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
      >
        <h3 className="mb-6 text-center text-lg font-semibold">
          Daily Meal Distribution (3 meals)
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {["Breakfast", "Lunch", "Dinner"].map((meal, index) => (
            <div key={meal} className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
              <h4 className="mb-3 text-center font-semibold">{meal}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Protein:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {round(macroBreakdown.protein.grams / 3)}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Carbs:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {round(macroBreakdown.carbs.grams / 3)}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fat:</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    {round(macroBreakdown.fat.grams / 3)}g
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                  <div className="flex justify-between font-semibold">
                    <span>Calories:</span>
                    <span>{round((useCalculatedCalories ? calculatedCalories : calories) / 3)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-8 rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 p-6 dark:from-emerald-900/20 dark:to-blue-900/20"
      >
        <h3 className="mb-4 text-lg font-semibold text-center">
          🥗 Macro Guidelines
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <h4 className="font-medium text-red-600 dark:text-red-400">
              Protein Sources:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Lean meats, fish, eggs</li>
              <li>• Greek yogurt, cottage cheese</li>
              <li>• Legumes, quinoa</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-600 dark:text-blue-400">
              Carbohydrate Sources:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Whole grains, oats</li>
              <li>• Fruits, vegetables</li>
              <li>• Sweet potatoes, rice</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-600 dark:text-yellow-400">
              Healthy Fat Sources:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Avocados, nuts, seeds</li>
              <li>• Olive oil, fatty fish</li>
              <li>• Coconut, nut butters</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
