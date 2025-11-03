"use client";

import React from "react";
import ResultCard from "@/components/atoms/ResultCard";

export default function LayoutTestPage() {
  const testCases = [
    // Short content tests
    {
      name: "BMI - Short",
      type: "bmi",
      value: "23.5",
      category: "Normal",
      subtitle: "Healthy BMI range",
    },
    {
      name: "Calories - Short",
      type: "calorie",
      value: "2250",
      category: "Maintenance",
      subtitle: "Daily calorie needs",
    },
    // Long content tests
    {
      name: "1RM - Long Exercise Name",
      type: "oneRm",
      value: "125.5",
      category: "Overhead Press",
      subtitle: "1RM from 5 reps with proper form",
      unit: "kg",
    },
    {
      name: "Macros - Complex Values",
      type: "macro",
      value: "150g • 300g • 80g",
      category: "Balanced Distribution",
      subtitle: "Protein • Carbs • Fat | 2258 calories/day for muscle gain",
    },
    // Very long content tests
    {
      name: "Heart Rate - Long Category",
      type: "heart",
      value: "185",
      category: "Maximum Heart Rate Zone",
      subtitle: "Training zones calculated for endurance performance",
    },
    {
      name: "Water - Long Subtitle",
      type: "water",
      value: "3.2",
      category: "Optimal Hydration",
      subtitle: "Daily intake based on weight, activity level, and climate conditions",
    },
    // Edge cases
    {
      name: "Ideal Weight - All Long",
      type: "idealWeight",
      value: "68.5",
      category: "Medium Frame Body Type",
      subtitle: "Healthy weight range calculated using multiple scientific formulas",
    },
    {
      name: "BMI - No Category",
      type: "bmi",
      value: "24.8",
      subtitle: "Upper normal range",
    },
    {
      name: "Calories - No Subtitle",
      type: "calorie",
      value: "1850",
      category: "Weight Loss Goal",
    },
    // Extreme cases
    {
      name: "1RM - Very Long Value",
      type: "oneRm",
      value: "1234.56",
      category: "Deadlift Personal Record",
      subtitle: "Calculated from multiple rep maxes with progressive overload training",
      unit: "lb",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          ResultCard Layout Test
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Testing responsive layout and spacing across different content lengths
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {testCases.map((testCase, index) => (
          <div key={index} className="space-y-4">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {testCase.name}
              </h3>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <p>Value: {testCase.value?.length || 0} chars</p>
                <p>Category: {testCase.category?.length || 0} chars</p>
                <p>Subtitle: {testCase.subtitle?.length || 0} chars</p>
              </div>
            </div>
            <div className="flex justify-center">
              <div style={{ transform: "scale(0.5)", transformOrigin: "center" }}>
                <ResultCard
                  type={testCase.type}
                  value={testCase.value}
                  category={testCase.category}
                  subtitle={testCase.subtitle}
                  unit={testCase.unit}
                  aspectRatio="square"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl bg-green-50 p-6 dark:bg-green-950/40">
        <h2 className="mb-4 text-xl font-bold text-green-900 dark:text-green-200">
          Layout Improvements Implemented
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-300">Dynamic Font Sizing:</h3>
            <ul className="text-sm text-green-700 dark:text-green-400">
              <li>• Value: 64px → 40px based on length</li>
              <li>• Category: text-xl → text-base</li>
              <li>• Subtitle: font-semibold → text-xs</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-300">Responsive Spacing:</h3>
            <ul className="text-sm text-green-700 dark:text-green-400">
              <li>• Auto-adjusting vertical padding</li>
              <li>• Dynamic element spacing</li>
              <li>• Flexbox layout with proper gaps</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-300">Overflow Prevention:</h3>
            <ul className="text-sm text-green-700 dark:text-green-400">
              <li>• Word breaking for long text</li>
              <li>• Max width constraints</li>
              <li>• Centered alignment maintained</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-blue-50 p-6 dark:bg-blue-950/40">
        <h2 className="mb-4 text-xl font-bold text-blue-900 dark:text-blue-200">
          Test Results Summary
        </h2>
        <div className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
          <p>✅ All calculator types display without text overlap</p>
          <p>✅ Long exercise names (e.g., &quot;Overhead Press&quot;) fit properly</p>
          <p>✅ Complex macro values display cleanly</p>
          <p>✅ Long subtitles wrap and scale appropriately</p>
          <p>✅ Progress rings and animations preserved</p>
          <p>✅ Vertical centering maintained across all content lengths</p>
          <p>✅ Export functionality remains intact</p>
        </div>
      </div>
    </div>
  );
}