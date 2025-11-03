"use client";

import React, { useState, useEffect } from "react";
import ResultCard from "@/components/atoms/ResultCard";

export default function TaglineTestPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [inputValues, setInputValues] = useState({});

  // Simulate state changes that might trigger the issue
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    // Simulate input value changes
    setInputValues({
      bmi: Math.random() * 10 + 20,
      calories: Math.random() * 1000 + 1500,
      water: Math.random() * 2 + 2
    });
  };

  // Auto-refresh every 3 seconds to test state changes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const testCases = [
    {
      name: "BMI Calculator",
      type: "bmi",
      value: inputValues.bmi?.toFixed(1) || "24.2",
      category: "Normal",
      subtitle: "Healthy BMI range",
    },
    {
      name: "Calorie Calculator", 
      type: "calorie",
      value: Math.round(inputValues.calories || 2250).toString(),
      category: "Maintenance",
      subtitle: "Daily calorie needs",
    },
    {
      name: "Macro Calculator",
      type: "macro", 
      value: "150g • 300g • 80g",
      category: "Balanced",
      subtitle: "Protein • Carbs • Fat | 2258 calories/day",
    },
    {
      name: "Water Calculator",
      type: "water",
      value: inputValues.water?.toFixed(1) || "2.8",
      category: "Optimal",
      subtitle: "Daily hydration goal",
    },
    {
      name: "Heart Rate Calculator",
      type: "heart",
      value: "185",
      category: "Max Heart Rate",
      subtitle: "Training zones calculated",
    },
    {
      name: "Ideal Weight Calculator",
      type: "idealWeight", 
      value: "68.5",
      category: "Medium Frame",
      subtitle: "Healthy weight range",
    },
    {
      name: "1RM Calculator",
      type: "oneRm",
      value: "125",
      category: "Bench Press", 
      subtitle: "1RM from 5 reps",
      unit: "kg",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Tagline Consistency Test
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Testing that NOURISHING BODIES • SCULPTING GREATNESS always appears as text, never as a line
        </p>
        <div className="mt-4 flex justify-center space-x-4">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manual Refresh (Refresh Key: {refreshKey})
          </button>
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
            Auto-refreshing every 3 seconds
          </div>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {testCases.map((testCase, index) => (
          <div key={`${testCase.type}-${refreshKey}-${index}`} className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {testCase.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Value: {testCase.value}
              </p>
            </div>
            <div className="flex justify-center">
              <div style={{ transform: "scale(0.6)", transformOrigin: "center" }}>
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
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded p-2">
                <p className="font-semibold">Expected Footer:</p>
                <p>Calculated with NutriSculpt Fitness Calculator</p>
                <p className="font-bold text-green-600">NOURISHING BODIES • SCULPTING GREATNESS</p>
                <p className="text-red-600 mt-1">❌ Should NOT show horizontal line</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl bg-blue-50 p-6 dark:bg-blue-950/40">
        <h2 className="mb-4 text-xl font-bold text-blue-900 dark:text-blue-200">
          Tagline Rendering Fixes Applied
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">Structure Changes:</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-400">
              <li>• Changed from space-y to flex layout</li>
              <li>• Added explicit border-0 class</li>
              <li>• Wrapped tagline in span element</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">Style Fixes:</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-400">
              <li>• Explicit border style override</li>
              <li>• Higher z-index for text elements</li>
              <li>• Pointer events disabled on footer</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">Consistency:</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-400">
              <li>• Same fixes in both ResultCard components</li>
              <li>• Static rendering not tied to state</li>
              <li>• Preserved all animations and styling</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-green-50 p-6 dark:bg-green-950/40">
        <h2 className="mb-4 text-xl font-bold text-green-900 dark:text-green-200">
          Test Instructions
        </h2>
        <div className="space-y-2 text-sm text-green-700 dark:text-green-400">
          <p>✅ Verify tagline appears as text in all calculator cards</p>
          <p>✅ Check that no horizontal lines replace the tagline text</p>
          <p>✅ Confirm tagline persists through state changes and refreshes</p>
          <p>✅ Test in both light and dark modes</p>
          <p>✅ Verify gradient text effects work properly</p>
          <p>✅ Ensure footer spacing remains consistent</p>
        </div>
      </div>
    </div>
  );
}