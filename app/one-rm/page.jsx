
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import InputField from "@/components/atoms/InputField";
import UnitToggle from "@/components/pages/bmi/UnitToggle";
import ShareButton from "@/components/atoms/ShareButton";
import ResultCard from "@/components/atoms/ResultCard";
import ResultExplanation from "@/components/atoms/ResultExplanation";
import HealthDisclaimer from "@/components/atoms/HealthDisclaimer";
import { useShareableImage } from "@/hooks/useShareableImage";
import CalculatorNextStep from "@/components/atoms/CalculatorNextStep";
import {
  round,
  kgToLb,
  lbToKg,
  ONE_RM_FORMULAS,
  PRIMARY_ONE_RM_ID,
  estimateOneRM,
  estimateAllOneRM,
  oneRmReliability,
} from "@/lib/calculators.mjs";

// Training percentage ranges.
//
// Repetition ranges are approximate population means from a 2023 meta-regression
// (Nuzzo et al., Sports Medicine) and the long-standing repetition-maximum table.
// They describe what is often achievable, not what a given person will achieve.
// The same relative load does not guarantee a fixed training outcome.
const TRAINING_PERCENTAGES = [
  { percentage: 50, reps: "20–30+", purpose: "Endurance / technique", color: "text-green-600 dark:text-green-400" },
  { percentage: 60, reps: "15–22", purpose: "Muscular Endurance", color: "text-emerald-600 dark:text-emerald-400" },
  { percentage: 70, reps: "11–16", purpose: "Hypertrophy range", color: "text-blue-600 dark:text-blue-400" },
  { percentage: 80, reps: "8–11", purpose: "Strength", color: "text-purple-600 dark:text-purple-400" },
  { percentage: 90, reps: "4–6", purpose: "Maximal strength", color: "text-orange-600 dark:text-orange-400" },
  { percentage: 95, reps: "2–3", purpose: "Maximal strength", color: "text-red-600 dark:text-red-400" },
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
      setWeight({ kg: value, lb: round(kgToLb(value), 1) });
    } else {
      setWeight({ kg: round(lbToKg(value), 1), lb: value });
    }
  };

  const weightKg = weight.kg;
  const weightValid = Number.isFinite(weightKg) && weightKg > 0;
  const repsValid = Number.isFinite(reps) && reps >= 1 && reps <= 20;
  const inputsValid = weightValid && repsValid;

  const reliability = useMemo(
    () => (repsValid ? oneRmReliability(reps) : null),
    [repsValid, reps]
  );

  // Primary estimate: Brzycki. The other six equations remain available as
  // educational comparison; the unweighted average is not a validated method
  // and is no longer presented as the recommended value.
  const oneRMResults = useMemo(() => {
    if (!inputsValid) return null;

    const all = estimateAllOneRM(weightKg, reps);
    const primaryValue = estimateOneRM(weightKg, reps, PRIMARY_ONE_RM_ID);
    if (!all || primaryValue === null) return null;

    const format = (value) => ({
      kg: round(value, 1),
      lb: round(kgToLb(value), 1),
    });

    const equations = {};
    for (const formula of ONE_RM_FORMULAS) {
      const value = all[formula.id];
      if (value !== undefined) {
        equations[formula.id] = {
          ...format(value),
          name: formula.name,
          note: formula.note,
        };
      }
    }

    const values = Object.values(all);
    const spread =
      values.length > 1
        ? { min: Math.min(...values), max: Math.max(...values) }
        : null;

    return {
      primary: { ...format(primaryValue), method: PRIMARY_ONE_RM_ID },
      equations,
      spread: spread
        ? { min: format(spread.min), max: format(spread.max) }
        : null,
    };
  }, [inputsValid, weightKg, reps]);

  // Calculate training weights based on the primary estimate.
  const trainingWeights = useMemo(() => {
    if (!oneRMResults) return [];

    return TRAINING_PERCENTAGES.map(({ percentage, reps: repRange, purpose, color }) => {
      const weightKgAtLoad = (oneRMResults.primary.kg * percentage) / 100;
      return {
        percentage,
        reps: repRange,
        purpose,
        color,
        weight: {
          kg: round(weightKgAtLoad, 1),
          lb: round(kgToLb(weightKgAtLoad), 1),
        },
      };
    });
  }, [oneRMResults]);

  // Prepare share data for 1RM results
  const shareResult = useMemo(() => {
    if (!oneRMResults) return null;

    return validateResultForPrivacy({
      value: oneRMResults.primary[unitSystem === 'metric' ? 'kg' : 'lb'],
      unit: unitSystem === 'metric' ? 'kg' : 'lb',
      exercise: exercise,
      repsUsed: reps,
      method: PRIMARY_ONE_RM_ID,
    }, ['weight']); // Exclude sensitive input data
  }, [oneRMResults, unitSystem, exercise, reps, validateResultForPrivacy]);

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

        {!weightValid && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            Enter a weight greater than 0.
          </p>
        )}
        {!repsValid && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            Enter a repetition count between 1 and 20.
          </p>
        )}

        {/* Disclaimer */}
        <div className="mt-6">
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/40">
            <p>
              <strong>Safety Note:</strong> This is an estimate, not a measurement. Always warm up
              properly, use proper form, and consider a spotter for heavy lifts. Beginners may
              benefit more from submaximal training and supervision than from maximal testing. Start
              conservatively and progress gradually.
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

        {!oneRMResults ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>Enter a valid weight and repetition count to calculate your 1RM.</p>
          </div>
        ) : (
          <>
            {/* Primary result */}
            <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 p-6 text-center dark:from-blue-900/30 dark:to-purple-900/30">
              <h4 className="mb-2 text-lg font-semibold">Primary Estimate (Brzycki)</h4>
              <p className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                {unitSystem === "metric" ? oneRMResults.primary.kg : oneRMResults.primary.lb}
                <span className="text-lg font-normal ml-1">
                  {unitSystem === "metric" ? "kg" : "lbs"}
                </span>
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {reps === 1
                  ? "Recorded load for 1 repetition (not necessarily a true maximal attempt)"
                  : `From ${reps} repetitions`}
              </p>
              {reliability && (
                <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                  {reliability.label}: {reliability.note}
                </p>
              )}
            </div>

            {/* Equation comparison */}
            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(oneRMResults.equations).map(([id, result]) => (
                <div
                  key={id}
                  className={`rounded-lg p-4 text-center ${
                    id === PRIMARY_ONE_RM_ID
                      ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950/40"
                      : "bg-gray-50 dark:bg-gray-700/50"
                  }`}
                >
                  <h5 className="mb-2 font-semibold">
                    {result.name}
                    {id === PRIMARY_ONE_RM_ID && (
                      <span className="ml-1 text-xs font-normal text-blue-600 dark:text-blue-400">
                        (primary)
                      </span>
                    )}
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

            {oneRMResults.spread && (
              <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                Equation spread:{" "}
                {unitSystem === "metric" ? oneRMResults.spread.min.kg : oneRMResults.spread.min.lb}
                –
                {unitSystem === "metric" ? oneRMResults.spread.max.kg : oneRMResults.spread.max.lb}{" "}
                {unitSystem === "metric" ? "kg" : "lbs"} across the seven equations. This is a
                descriptive comparison, not a confidence interval.
              </p>
            )}
          </>
        )}
      </motion.div>

      {/* Educational explanation */}
      {oneRMResults && (
        <div className="mt-6">
          <ResultExplanation
            whatItMeans={
              <>
                Your estimated <span className="font-semibold">one-repetition maximum (1RM)</span> is
                an estimate of the maximum weight you could lift once for {exercise} with proper
                form. The primary estimate uses the <span className="font-semibold">Brzycki</span>{" "}
                equation applied to the weight you lifted (
                {unitSystem === "metric" ? oneRMResults.primary.kg : oneRMResults.primary.lb}{" "}
                {unitSystem === "metric" ? "kg" : "lbs"}) and the{" "}
                <span className="font-semibold">{reps} repetitions</span> performed. The other six
                equations are shown for comparison only.
              </>
            }
            whyItMatters={
              <>
                A 1RM estimate helps you set training weights and track strength over time.
                Different relative loads are often used for different emphases, but the same load
                does not guarantee a specific outcome for every person or exercise.
              </>
            }
            limitations={
              <>
                Estimated 1RM values are predictions, not measurements. Accuracy depends on the
                exercise, testing conditions, technique, fatigue and training experience, and
                estimates become less reliable above about 10 repetitions. Different equations give
                different results; the spread is descriptive, not a confidence interval. At 1
                repetition the value is the load you recorded, not necessarily a true maximal
                attempt. These estimates are for programming education only — they are not a reason
                to attempt an unsafe maximum lift. Beginners may benefit more from submaximal
                training and supervision.
              </>
            }
          />
        </div>
      )}

      {/* Training Percentages */}
      {oneRMResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <h3 className="mb-2 text-center text-lg font-semibold">
            Training Weight Percentages
          </h3>
          <p className="mb-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Loads are calculated from the primary (Brzycki) estimate. Repetition ranges are
            approximate population means, not guarantees; the leg press allows more repetitions
            than the bench press at the same relative load.
          </p>

          <div className="space-y-3">
            {trainingWeights.map(({ percentage, reps: repRange, purpose, color, weight }) => (
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
                      ≈ {repRange} reps to failure
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

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Loads are a percentage of an estimated 1RM. Actual repetitions you can complete vary
            with exercise, fatigue, technique and individual physiology. Hypertrophy can occur
            across a wide range of loads, and no single percentage is required for it.
          </p>
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
              <li>• Hypertrophy also occurs at other loads</li>
              <li>• Moderate rest (60-90 sec)</li>
              <li>• Higher training volume</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 rounded-lg bg-red-100 p-4 dark:bg-red-900/30">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Important:</strong> Never attempt a true 1RM without proper preparation,
            spotters and experience. These calculations are for programming education only. If you
            are new to strength training, or have pain, injury or a medical limitation, seek
            qualified supervision rather than maximal testing.
          </p>
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
              This is an estimated strength value, not a recommendation to attempt a maximum lift.
              Accuracy depends on the exercise, testing conditions, technique, fatigue and training
              experience, and is reduced above about 10 repetitions. Beginners may benefit more
              from submaximal training and supervision. Do not attempt maximal lifts if you are
              injured, experiencing pain or medically advised against strenuous exercise.
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
                type="oneRm"
                value={shareResult.value}
                category={shareResult.exercise}
                subtitle={`Brzycki estimate from ${shareResult.repsUsed} reps`}
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

      {/* Calculator Next Step */}
      <CalculatorNextStep
        heading="What's Next"
        description={
          <>
            An estimated 1RM can support strength-training discussions and help
            you set training weights. Explore strength coaching or athletic
            performance programs.
          </>
        }
        source="calculator-one-rm"
        calculatorId="one-rm"
        showEnquiry={true}
        primaryCta={{
          label: "Explore Strength Coaching",
          href: "/services/category/strength-fitness-performance",
        }}
        secondaryLinks={[
          {
            label: "Athletic Performance & Conditioning",
            href: "/services/category/functional-fitness-life-stages",
          },
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
            type="oneRm"
            value={shareResult.value}
            category={shareResult.exercise}
            subtitle={`Brzycki estimate from ${shareResult.repsUsed} reps`}
            unit={shareResult.unit}
          />
        </div>
      )}
    </div>
  );
}
