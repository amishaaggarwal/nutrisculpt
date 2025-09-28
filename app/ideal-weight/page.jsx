
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import InputField from "@/components/atoms/InputField";
import UnitToggle from "@/components/pages/bmi/UnitToggle";
import ShareButton from "@/components/atoms/ShareButton";
import ShareableResultCard from "@/components/atoms/ShareableResultCard";
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
  cmToFtIn: (cm) => {
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inches = round(totalInches % 12, 1);
    return { ft, in: inches };
  },
  ftInToCm: (ft, inches) => round((ft * 12 + inches) * 2.54, 1),
};

// Ideal weight calculation formulas
const idealWeightFormulas = {
  robinson: (heightCm, gender) => {
    const heightInches = heightCm / 2.54;
    if (gender === "male") {
      return 52 + 1.9 * (heightInches - 60);
    } else {
      return 49 + 1.7 * (heightInches - 60);
    }
  },
  miller: (heightCm, gender) => {
    const heightInches = heightCm / 2.54;
    if (gender === "male") {
      return 56.2 + 1.41 * (heightInches - 60);
    } else {
      return 53.1 + 1.36 * (heightInches - 60);
    }
  },
  devine: (heightCm, gender) => {
    const heightInches = heightCm / 2.54;
    if (gender === "male") {
      return 50 + 2.3 * (heightInches - 60);
    } else {
      return 45.5 + 2.3 * (heightInches - 60);
    }
  },
  hamwi: (heightCm, gender) => {
    const heightInches = heightCm / 2.54;
    if (gender === "male") {
      return 48 + 2.7 * (heightInches - 60);
    } else {
      return 45.5 + 2.2 * (heightInches - 60);
    }
  },
  bmi: (heightCm) => {
    const heightM = heightCm / 100;
    const idealBMI = 22; // Middle of healthy BMI range
    return idealBMI * heightM * heightM;
  },
};

// Body frame types
const FRAME_TYPES = [
  { value: "small", label: "Small Frame", adjustment: -0.9 },
  { value: "medium", label: "Medium Frame", adjustment: 1.0 },
  { value: "large", label: "Large Frame", adjustment: 1.1 },
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

  // Calculate ideal weights using different formulas
  const idealWeights = useMemo(() => {
    const heightCm = height.cm;
    if (!heightCm || heightCm < 100) return {};

    const frameAdjustment = FRAME_TYPES.find(f => f.value === frameType)?.adjustment || 1.0;
    
    const results = {};
    Object.entries(idealWeightFormulas).forEach(([formula, calculate]) => {
      try {
        let result;
        if (formula === "bmi") {
          result = calculate(heightCm);
        } else {
          result = calculate(heightCm, gender);
        }
        
        // Apply frame adjustment (except for BMI method)
        if (formula !== "bmi") {
          result = result * frameAdjustment;
        }
        
        results[formula] = {
          kg: round(result, 1),
          lb: round(conversions.kgToLb(result), 1),
        };
      } catch (error) {
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
  }, [height.cm, gender, frameType]);

  // Calculate healthy weight range
  const healthyRange = useMemo(() => {
    const heightM = height.cm / 100;
    if (heightM <= 0) return null;

    const minKg = 18.5 * heightM * heightM;
    const maxKg = 24.9 * heightM * heightM;

    return {
      min: { kg: round(minKg, 1), lb: round(conversions.kgToLb(minKg), 1) },
      max: { kg: round(maxKg, 1), lb: round(conversions.kgToLb(maxKg), 1) },
    };
  }, [height.cm]);

  // Prepare share data for ideal weight results
  const shareResult = useMemo(() => {
    if (!idealWeights.average || !healthyRange) return null;
    
    return validateResultForPrivacy({
      value: idealWeights.average[unitSystem === 'metric' ? 'kg' : 'lb'],
      unit: unitSystem === 'metric' ? 'kg' : 'lbs',
      frameType: FRAME_TYPES.find(f => f.value === frameType)?.label || 'Medium Frame',
      healthyRange: unitSystem === 'metric' 
        ? `${healthyRange.min.kg}-${healthyRange.max.kg} kg`
        : `${healthyRange.min.lb}-${healthyRange.max.lb} lbs`
    }, ['height', 'age', 'gender']); // Exclude sensitive input data
  }, [idealWeights.average, healthyRange, unitSystem, frameType, validateResultForPrivacy]);

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
                <li>• <strong>Small:</strong> Wrist circumference less than 6.25" (men) or 5.5" (women)</li>
                <li>• <strong>Medium:</strong> Wrist circumference 6.25-7" (men) or 5.5-6.25" (women)</li>
                <li>• <strong>Large:</strong> Wrist circumference over 7" (men) or 6.25" (women)</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results Section */}
      {idealWeights.average && (
        <>
          {/* Average Result - Highlighted */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 rounded-xl bg-gradient-to-r from-emerald-100 to-blue-100 p-6 text-center shadow-lg dark:from-emerald-900/30 dark:to-blue-900/30"
          >
            <h3 className="mb-4 text-lg font-semibold">Recommended Ideal Weight</h3>
            <p className="text-5xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {unitSystem === "metric" ? idealWeights.average.kg : idealWeights.average.lb}
              <span className="text-lg font-normal ml-2">
                {unitSystem === "metric" ? "kg" : "lbs"}
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Average of all formulas
            </p>
            
            {/* Share Button */}
            {shareResult && shareData && (
              <div className="mt-4">
                <ShareButton
                  onGenerateImage={handleGenerateImage}
                  shareData={shareData}
                  variant="secondary"
                  className="mx-auto"
                />
              </div>
            )}
          </motion.div>

          {/* Individual Formula Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
          >
            <h3 className="mb-6 text-center text-lg font-semibold">
              Formula Breakdown
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(idealWeights)
                .filter(([formula]) => formula !== "average")
                .map(([formula, result]) => (
                <div
                  key={formula}
                  className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700/50"
                >
                  <h5 className="mb-2 font-semibold capitalize">
                    {formula === "bmi" ? "BMI Method" : `${formula.charAt(0).toUpperCase() + formula.slice(1)} Formula`}
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

          {/* Healthy Weight Range */}
          {healthyRange && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
            >
              <h3 className="mb-4 text-center text-lg font-semibold">
                Healthy Weight Range (BMI 18.5-24.9)
              </h3>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {unitSystem === "metric" 
                    ? `${healthyRange.min.kg} - ${healthyRange.max.kg} kg`
                    : `${healthyRange.min.lb} - ${healthyRange.max.lb} lbs`
                  }
                </p>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium text-purple-600 dark:text-purple-400">
              About These Calculations:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• These formulas provide estimates based on height and gender</li>
              <li>• Individual results may vary based on muscle mass and bone density</li>
              <li>• Frame size adjustments help personalize results</li>
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

      {/* Hidden Shareable Card for Image Generation */}
      {shareResult && (
        <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">
          <ShareableResultCard
            ref={shareableCardRef}
            calculatorType="ideal-weight"
            result={{
              value: shareResult.value,
              unit: shareResult.unit,
              category: shareResult.frameType
            }}
            subtitle={`Healthy range: ${shareResult.healthyRange}`}
          />
        </div>
      )}
    </div>
  );
}
