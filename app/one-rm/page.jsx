
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
};

// 1RM Calculation formulas
const oneRMFormulas = {
  epley: (weight, reps) => weight * (1 + reps / 30),
  brzycki: (weight, reps) => weight * (36 / (37 - reps)),
  lander: (weight, reps) => weight / (1.013 - 0.0267123 * reps),
  lombardi: (weight, reps) => weight * Math.pow(reps, 0.1),
  mayhew: (weight, reps) => (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps)),
  oConner: (weight, reps) => weight * (1 + 0.025 * reps),
  wathan: (weight, reps) => (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps)),
};

// Training percentage ranges
const TRAINING_PERCENTAGES = [
  { percentage: 50, reps: "20+", purpose: "Endurance", color: "text-green-600 dark:text-green-400" },
  { percentage: 60, reps: "15-20", purpose: "Muscular Endurance", color: "text-emerald-600 dark:text-emerald-400" },
  { percentage: 70, reps: "12-15", purpose: "Hypertrophy", color: "text-blue-600 dark:text-blue-400" },
  { percentage: 80, reps: "8-12", purpose: "Strength", color: "text-purple-600 dark:text-purple-400" },
  { percentage: 90, reps: "3-6", purpose: "Power", color: "text-orange-600 dark:text-orange-400" },
  { percentage: 95, reps: "1-3", purpose: "Max Strength", color: "text-red-600 dark:text-red-400" },
];

// Exercise categories
const EXERCISE_CATEGORIES = [
  "Squat",
  "Bench Press",
  "Deadlift",
  "Overhead Press",
  "Row",
  "Pull-up/Chin-up",
  "Other"
];

export default function OneRMCalculator() {
  const [unitSystem, setUnitSystem] = useState("metric");
  const [exercise, setExercise] = useState("Bench Press");
  const [reps, setReps] = useState(5);
  
  // Store both metric and imperial values
  const [weight, setWeight] = useState({ kg: 80, lb: 176.4 });

  // Share functionality
  const { shareableCardRef, generateImage, generateShareData, validateResultForPrivacy } = useShareableImage('one-rm');

  // Weight handlers
  const handleWeightChange = (value, unit) => {
    if (unit === "kg") {
      setWeight({ kg: value, lb: conversions.kgToLb(value) });
    } else {
      setWeight({ kg: conversions.lbToKg(value), lb: value });
    }
  };

  // Calculate 1RM using different formulas
  const oneRMResults = useMemo(() => {
    const weightKg = weight.kg;
    if (!weightKg || !reps || reps < 1) return {};

    const results = {};
    Object.entries(oneRMFormulas).forEach(([formula, calculate]) => {
      try {
        const result = calculate(weightKg, reps);
        results[formula] = {
          kg: round(result, 1),
          lb: round(conversions.kgToLb(result), 1),
        };
      } catch {
        results[formula] = { kg: 0, lb: 0 };
      }
    });

    // Calculate average
    const validResults = Object.values(results).filter(r => r.kg > 0);
    if (validResults.length > 0) {
      const avgKg = validResults.reduce((sum, r) => sum + r.kg, 0) / validResults.length;
      results.average = {
        kg: round(avgKg, 1),
        lb: round(conversions.kgToLb(avgKg), 1),
      };
    }

    return results;
  }, [weight.kg, reps]);

  // Calculate training weights based on average 1RM
  const trainingWeights = useMemo(() => {
    if (!oneRMResults.average) return [];

    return TRAINING_PERCENTAGES.map(({ percentage, reps, purpose, color }) => {
      const weightKg = (oneRMResults.average.kg * percentage) / 100;
      return {
        percentage,
        reps,
        purpose,
        color,
        weight: {
          kg: round(weightKg, 1),
          lb: round(conversions.kgToLb(weightKg), 1),
        },
      };
    });
  }, [oneRMResults.average]);

  // Prepare share data for 1RM results
  const shareResult = useMemo(() => {
    if (!oneRMResults.average) return null;
    
    return validateResultForPrivacy({
      value: oneRMResults.average[unitSystem === 'metric' ? 'kg' : 'lb'],
      unit: unitSystem === 'metric' ? 'kg' : 'lb',
      exercise: exercise,
      repsUsed: reps
    }, ['weight']); // Exclude sensitive input data
  }, [oneRMResults.average, unitSystem, exercise, reps, validateResultForPrivacy]);

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
          One Rep Max Calculator
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Calculate your 1RM and training percentages for strength programming
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

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Exercise Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Exercise
            </label>
            <select
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {EXERCISE_CATEGORIES.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>

          {/* Weight Input */}
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
            placeholder={unitSystem === "metric" ? "80" : "176"}
            min="1"
          />

          {/* Reps Input */}
          <InputField
            label="Reps Performed"
            value={reps}
            onChange={setReps}
            type="number"
            placeholder="5"
            min="1"
            max="20"
          />
        </div>

        {/* Disclaimer */}
        <div className="mt-6">
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/40">
            <p>
              <strong>Safety Note:</strong> These calculations are estimates. Always warm up properly, use proper form, and consider having a spotter when attempting heavy lifts. Start conservatively and progress gradually.
            </p>
          </div>
        </div>
      </motion.div>

      {/* 1RM Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
      >
        <h3 className="mb-6 text-center text-lg font-semibold">
          Estimated 1RM Results
        </h3>
        
        {oneRMResults.average ? (
          <>
            {/* Average Result - Highlighted */}
            <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 p-6 text-center dark:from-blue-900/30 dark:to-purple-900/30">
              <h4 className="mb-2 text-lg font-semibold">Recommended 1RM</h4>
              <p className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                {unitSystem === "metric" ? oneRMResults.average.kg : oneRMResults.average.lb}
                <span className="text-lg font-normal ml-1">
                  {unitSystem === "metric" ? "kg" : "lbs"}
                </span>
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Average of all formulas
              </p>
              

            </div>

            {/* Individual Formula Results */}
            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(oneRMResults)
                .filter(([formula]) => formula !== "average")
                .map(([formula, result]) => (
                <div
                  key={formula}
                  className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700/50"
                >
                  <h5 className="mb-2 font-semibold capitalize">
                    {formula}
                  </h5>
                  <p className="text-xl font-bold">
                    {unitSystem === "metric" ? result.kg : result.lb}
                    <span className="text-sm font-normal ml-1">
                      {unitSystem === "metric" ? "kg" : "lbs"}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>Enter weight and reps to calculate your 1RM</p>
          </div>
        )}
      </motion.div>

      {/* Training Percentages */}
      {oneRMResults.average && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <h3 className="mb-6 text-center text-lg font-semibold">
            Training Weight Percentages
          </h3>
          
          <div className="space-y-3">
            {trainingWeights.map(({ percentage, reps, purpose, color, weight }) => (
              <div
                key={percentage}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${color}`}>
                      {percentage}%
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">{purpose}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {reps} reps
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">
                    {unitSystem === "metric" ? weight.kg : weight.lb}
                    <span className="text-sm font-normal ml-1">
                      {unitSystem === "metric" ? "kg" : "lbs"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-8 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 p-6 dark:from-orange-900/20 dark:to-red-900/20"
      >
        <h3 className="mb-4 text-lg font-semibold text-center">
          💪 Training Tips
        </h3>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-600 dark:text-blue-400">
              For Strength:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Focus on 80-95% 1RM range</li>
              <li>• 3-6 reps per set</li>
              <li>• Longer rest periods (3-5 min)</li>
              <li>• Progressive overload weekly</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-purple-600 dark:text-purple-400">
              For Hypertrophy:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Train at 65-80% 1RM</li>
              <li>• 8-15 reps per set</li>
              <li>• Moderate rest (60-90 sec)</li>
              <li>• Higher training volume</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 rounded-lg bg-red-100 p-4 dark:bg-red-900/30">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Important:</strong> Never attempt a true 1RM without proper preparation, spotters, and experience. These calculations are for programming purposes only.
          </p>
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
          <div className="flex justify-center px-2 sm:px-4">
            <div className="w-full max-w-xs sm:max-w-sm transform hover:scale-105 transition-transform duration-300">
              <ResultCard
                type="oneRm"
                value={shareResult.value}
                category={shareResult.exercise}
                subtitle={`1RM from ${shareResult.repsUsed} reps`}
                aspectRatio="square"
                unit={shareResult.unit}
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
            type="oneRm"
            value={shareResult.value}
            category={shareResult.exercise}
            subtitle={`1RM from ${shareResult.repsUsed} reps`}
            unit={shareResult.unit}
          />
        </div>
      )}
    </div>
  );
}
