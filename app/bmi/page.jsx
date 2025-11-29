"use client";

import Gauge from "@/components/pages/bmi/Gauge";
import InputField from "@/components/atoms/InputField";
import React, { useMemo, useState } from "react";
import BMICategories from "@/components/pages/bmi/BMICategories";
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
  cmToFtIn: (cm) => {
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inches = round(totalInches % 12, 1);
    return { ft, in: inches };
  },
  ftInToCm: (ft, inches) => round((ft * 12 + inches) * 2.54, 1),
};

// BMI calculation and classification
const bmiUtils = {
  calculate: (weightKg, heightCm) => {
    const heightM = heightCm / 100;
    return heightM > 0 ? weightKg / (heightM * heightM) : 0;
  },
  classify: (bmi) => {
    if (!isFinite(bmi) || bmi <= 0)
      return { label: "—", color: "text-gray-500" };
    if (bmi < 18.5) return { label: "Underweight", color: "text-amber-500" };
    if (bmi < 25) return { label: "Normal", color: "text-emerald-600" };
    if (bmi < 30) return { label: "Overweight", color: "text-orange-600" };
    return { label: "Obese", color: "text-rose-600" };
  },
  getHealthyRange: (heightCm, isMetric) => {
    const heightM = heightCm / 100;
    if (heightM <= 0) return "—";

    const minKg = 18.5 * heightM * heightM;
    const maxKg = 24.9 * heightM * heightM;

    if (isMetric) {
      return `${round(minKg, 1)}kg - ${round(maxKg, 1)}kg`;
    }
    return `${conversions.kgToLb(minKg)}lb - ${conversions.kgToLb(maxKg)}lb`;
  },
};

export default function BmiCalculator() {
  const [unitSystem, setUnitSystem] = useState("metric");

  // Store both metric and imperial values
  const [weight, setWeight] = useState({ kg: 70, lb: 154.3 });
  const [height, setHeight] = useState({ cm: 170, ft: 5, in: 7 });

  // Share functionality
  const { shareableCardRef, generateImage, generateShareData, validateResultForPrivacy } = useShareableImage('bmi');

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

  // Calculate BMI and classification
  const bmi = useMemo(
    () => bmiUtils.calculate(weight.kg, height.cm),
    [weight.kg, height.cm]
  );
  const { label, color } = bmiUtils.classify(bmi);
  const healthyWeightRange = bmiUtils.getHealthyRange(
    height.cm,
    unitSystem === "metric"
  );

  // Prepare share data for BMI results
  const shareResult = useMemo(() => {
    if (!isFinite(bmi) || bmi <= 0) return null;
    
    return validateResultForPrivacy({
      value: round(bmi, 1),
      category: label,
      healthyRange: healthyWeightRange
    }, ['weight', 'height']); // Exclude sensitive input data
  }, [bmi, label, healthyWeightRange, validateResultForPrivacy]);

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
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Body Mass Index Calculator
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Calculate your BMI and get instant health classification
        </p>
      </div>

      {/* Input Form */}
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
        {/* Unit System Selector */}
        <div className="mb-6 flex justify-center">
          <UnitToggle unitSystem={unitSystem} onUnitChange={setUnitSystem} />
        </div>

        {/* Input Fields */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-1 md:grid-cols-2">
          {unitSystem === "metric" ? (
            <>
              <InputField
                label="Weight (kg)"
                value={weight.kg}
                onChange={(value) => handleWeightChange(value, "kg")}
              />
              <InputField
                label="Height (cm)"
                value={height.cm}
                onChange={(value) => handleHeightChange(value, "cm")}
              />
            </>
          ) : (
            <>
              <InputField
                label="Weight (lb)"
                value={weight.lb}
                onChange={(value) => handleWeightChange(value, "lb")}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Height
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label=""
                    value={height.ft}
                    onChange={(value) => handleHeightChange(value, "ft")}
                    placeholder="Feet"
                  />
                  <InputField
                    label=""
                    value={height.in}
                    onChange={(value) => handleHeightChange(value, "in")}
                    placeholder="Inches"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-inset ring-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/40">
            <p>
              BMI is a screening tool and does not diagnose body fatness or
              health. It may not be accurate for athletes, elderly, or pregnant
              women. Consult a healthcare professional for personalized advice.
            </p>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* BMI Result */}
        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          <div className="text-center">
            <h3 className="mb-4 text-lg font-semibold">Your BMI Result</h3>
            <div className="mb-4">
              <p className="text-5xl font-extrabold tracking-tight">
                {isFinite(bmi) && bmi > 0 ? round(bmi, 1) : "—"}
              </p>
              <p className={`mt-2 text-lg font-semibold ${color}`}>{label}</p>
            </div>

            <div className="mb-6">
              <Gauge value={bmi} />
            </div>

            <div className="text-left">
              <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Healthy weight range for your height:
              </h4>
              <p className="text-lg font-semibold text-emerald-600">
                {healthyWeightRange}
              </p>
            </div>

            {/* Share Button */}
            {shareResult && shareData && (
              <div className="mt-6 text-center">
                <ShareButton
                  onGenerateImage={handleGenerateImage}
                  shareData={shareData}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* BMI Categories */}
        <div className="rounded-xl bg-white p-4 sm:p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          <h3 className="mb-4 text-lg font-semibold">BMI Categories</h3>
          <BMICategories />
        </div>
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
                type="bmi"
                value={shareResult.value}
                category={shareResult.category}
                subtitle={`Healthy range: ${shareResult.healthyRange}`}
                aspectRatio="square"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden Shareable Card for Image Generation */}
      {shareResult && (
        <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">
          <ResultCard
            ref={shareableCardRef}
            type="bmi"
            value={shareResult.value}
            category={shareResult.category}
            subtitle={`Healthy range: ${shareResult.healthyRange}`}
          />
        </div>
      )}
    </div>
  );
}
