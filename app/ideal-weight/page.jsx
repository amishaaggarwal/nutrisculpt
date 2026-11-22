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
  calculateIdealWeight,
  calculateAllIdealWeights,
  idealWeightHealthyRange,
} from "@/lib/calculators";

// Utility functions
const round = (value, digits = 1) => {
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

// Body frame types (for UI selection only — adjustments are not scientifically validated)
const FRAME_TYPES = [
  { value: "small", label: "Small Frame" },
  { value: "medium", label: "Medium Frame" },
  { value: "large", label: "Large Frame" },
];

export default function IdealWeightCalculator() {
  const [unitSystem, setUnitSystem] = useState("metric");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(25);
  const [frameType, setFrameType] = useState("medium");

  // Store both metric and imperial values
  const [height, setHeight] = useState({ cm: 170, ft: 5, in: 7 });

  // Share functionality
  const { shareableCardRef, generateImage, generateShareData, validateResultForPrivacy } = useShareableImage('ideal-weight');

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

  // Primary result: BMI-based weight-for-height reference (BMI = 22)
  const referenceWeight = useMemo(() => {
    return calculateIdealWeight({
      heightCm: height.cm,
      gender,
      formulaId: "bmi",
    });
  }, [height.cm, gender]);

  // Historical formulas for educational comparison only
  const historicalWeights = useMemo(() => {
    return calculateAllIdealWeights({
      heightCm: height.cm,
      gender,
      frameType,
    });
  }, [height.cm, gender, frameType]);

  // Remove the BMI method from historical list since it's the primary reference
  const historicalList = useMemo(() => {
    if (!historicalWeights) return {};
    const { bmi, average, ...rest } = historicalWeights;
    return rest;
  }, [historicalWeights]);

  // Healthy weight range (BMI 18.5-24.9)
  const healthyRange = useMemo(() => {
    return idealWeightHealthyRange(height.cm);
  }, [height.cm]);

  // Prepare share data for ideal weight results
  const shareResult = useMemo(() => {
    if (!referenceWeight || !healthyRange) return null;
    
    const rangeValue = unitSystem === 'metric'
      ? `${healthyRange.min.kg}-${healthyRange.max.kg} kg`
      : `${healthyRange.min.lb}-${healthyRange.max.lb} lbs`;

    return validateResultForPrivacy({
      value: rangeValue,
      unit: unitSystem === 'metric' ? 'kg' : 'lbs',
      healthyRange: rangeValue,
      referencePoint: round(referenceWeight, 1),
    }, ['height', 'age', 'gender']); // Exclude sensitive input data
  }, [referenceWeight, healthyRange, unitSystem, validateResultForPrivacy]);

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
          Ideal Weight Calculator
        </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Calculate your ideal body weight using multiple scientific formulas
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Example values shown — enter your own data for personalized results
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

          {/* Frame Type */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Body Frame</h3>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Frame Type
              </label>
              <select
                value={frameType}
                onChange={(e) => setFrameType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {FRAME_TYPES.map((frame) => (
                  <option key={frame.value} value={frame.value}>
                    {frame.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <p className="font-medium mb-2">How to determine your frame:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Small:</strong> Wrist circumference less than 6.25&quot; (men) or 5.5&quot; (women)</li>
                <li>• <strong>Medium:</strong> Wrist circumference 6.25-7&quot; (men) or 5.5-6.25&quot; (women)</li>
                <li>• <strong>Large:</strong> Wrist circumference over 7&quot; (men) or 6.25&quot; (women)</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results Section */}
      {referenceWeight && (
        <>
          {/* Primary Result: Healthy Weight Range (BMI 18.5–24.9) */}
          {healthyRange && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 rounded-xl bg-gradient-to-r from-emerald-100 to-blue-100 p-6 text-center shadow-lg dark:from-emerald-900/30 dark:to-blue-900/30"
            >
              <h3 className="mb-4 text-lg font-semibold">
                Weight-for-Height Reference Range
              </h3>
              <p className="text-5xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {unitSystem === "metric"
                  ? `${healthyRange.min.kg} - ${healthyRange.max.kg} kg`
                  : `${healthyRange.min.lb} - ${healthyRange.max.lb} lbs`}
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Population-level reference (BMI 18.5–24.9), not an individualized target
              </p>
            </motion.div>
          )}

          {/* BMI 22 reference point (educational) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
          >
            <h3 className="mb-4 text-center text-lg font-semibold">
              Middle of Reference Range (BMI 22)
            </h3>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-700 dark:text-gray-300">
                {unitSystem === "metric"
                  ? `${round(referenceWeight, 1)} kg`
                  : `${round(conversions.kgToLb(referenceWeight), 1)} lbs`}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Educational reference point only — not a prescribed target
              </p>
            </div>
          </motion.div>

          {/* Educational explanation */}
          <div className="mt-6">
            <ResultExplanation
              whatItMeans={
                <>
                  The weight-for-height reference range for your height is{" "}
                  {unitSystem === "metric"
                    ? `${healthyRange.min.kg} - ${healthyRange.max.kg} kg`
                    : `${healthyRange.min.lb} - ${healthyRange.max.lb} lbs`},
                  based on a healthy BMI of 18.5–24.9. The middle of this
                  range (BMI 22) corresponds to approximately{" "}
                  {unitSystem === "metric"
                    ? round(referenceWeight, 1)
                    : round(conversions.kgToLb(referenceWeight), 1)}{" "}
                  {unitSystem === "metric" ? "kg" : "lbs"}.
                </>
              }
              whyItMatters={
                <>
                  This is a population-based reference. Individual healthy
                  weight varies with body composition, muscle mass, bone
                  density, and other factors. Use it as a general guide, not
                  a prescribed target.
                </>
              }
              limitations={
                <>
                  Weight-for-height references do not account for individual
                  body composition or health circumstances. Historical
                  equations (Robinson, Miller, Devine, Hamwi) may produce
                  different numbers because they use different assumptions
                  and were derived from specific populations. They are shown
                  below for educational comparison only.
                </>
              }
            />
          </div>

          {/* Historical formula comparison (educational context only) */}
          {Object.keys(historicalList).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
            >
              <h3 className="mb-6 text-center text-lg font-semibold">
                Historical Estimation Formulas (Educational Context)
              </h3>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
                These historical equations are presented for educational
                comparison only. They are not scientifically validated
                individualized targets and should not be used as personal
                weight goals. They may disagree with the BMI-based reference
                because they were derived from different populations and
                use different formulas.
              </p>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(historicalList).map(([formula, result]) => (
                  <div
                    key={formula}
                    className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700/50"
                  >
                    <h5 className="mb-2 font-semibold capitalize text-xs">
                      {formula.charAt(0).toUpperCase() + formula.slice(1)}
                      Formula
                    </h5>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {unitSystem === "metric" ? result.kg : result.lb}
                      <span className="text-sm font-normal ml-1">
                        {unitSystem === "metric" ? "kg" : "lbs"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-8 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-6 dark:from-purple-900/20 dark:to-pink-900/20"
      >
        <h3 className="mb-4 text-lg font-semibold text-center">
          💡 Important Notes
        </h3>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium text-purple-600 dark:text-purple-400">
              About This Reference:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                • The primary reference uses a BMI of 22 (middle of the
                healthy range 18.5–24.9)
              </li>
              <li>
                • Historical formulas (Robinson, Miller, Devine, Hamwi) are
                shown for educational comparison only
              </li>
              <li>
                • Frame-size adjustments are not scientifically validated as
                individualized targets
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-pink-600 dark:text-pink-400">
              Remember:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Health is more than just weight</li>
              <li>• Focus on overall fitness and well-being</li>
              <li>• Consult healthcare professionals for personalized advice</li>
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
              Estimated ideal weight does not account fully for individual
              body composition, muscle mass or health status. Do not use this
              result as the sole measure of health or as a reason to pursue
              unnecessary weight changes.
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
                type="idealWeight"
                value={shareResult.value}
                category="Weight-for-height reference"
                subtitle={shareResult.referencePoint
                  ? `Middle reference (BMI 22): ${shareResult.referencePoint} ${shareResult.unit}`
                  : `Healthy range: ${shareResult.healthyRange}`}
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

      {/* Calculator Next Step */}
      <CalculatorNextStep
        heading="What's Next"
        description={
          <>
            The weight-for-height range is a population reference, not a
            prescribed individual weight target. Explore your broader fitness
            picture or learn to train independently.
          </>
        }
        source="calculator-ideal-weight"
        calculatorId="ideal-weight"
        showEnquiry={true}
        primaryCta={{
          label: "Explore Your Fitness & Health Snapshot",
          href: "/transformation",
        }}
        secondaryLinks={[
          {
            label: "Fitness Education & Independent Training",
            href: "/services/category/fitness-education-independence",
          },
        ]}
      />

      {/* Hidden Shareable Card for Image Generation */}
      {shareResult && (
        <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">
          <ResultCard
            ref={shareableCardRef}
            type="idealWeight"
            value={shareResult.value}
            category="Weight-for-height reference"
            subtitle={shareResult.referencePoint
              ? `Middle reference (BMI 22): ${shareResult.referencePoint} ${shareResult.unit}`
              : `Healthy range: ${shareResult.healthyRange}`}
          />
        </div>
      )}
    </div>
  );
}
