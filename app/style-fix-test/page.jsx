"use client";

import React, { useState, useEffect } from "react";
import ResultCard from "@/components/atoms/ResultCard";

export default function StyleFixTestPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [consoleWarnings, setConsoleWarnings] = useState([]);
  const [inputValues, setInputValues] = useState({
    bmi: 24.2,
    calories: 2250,
    water: 2.8,
    heartRate: 150,
    weight: 68.5,
    oneRm: 125
  });

  // Monitor console warnings
  useEffect(() => {
    const originalWarn = console.warn;
    const warnings = [];
    
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('style property') || message.includes('background')) {
        warnings.push({
          message,
          timestamp: new Date().toLocaleTimeString()
        });
        setConsoleWarnings([...warnings]);
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  // Simulate dynamic value changes that trigger re-renders
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setInputValues({
      bmi: Math.random() * 10 + 20,
      calories: Math.random() * 1000 + 1500,
      water: Math.random() * 2 + 2,
      heartRate: Math.random() * 50 + 120,
      weight: Math.random() * 20 + 60,
      oneRm: Math.random() * 50 + 100
    });
  };

  // Auto-refresh to test continuous re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const testCases = [
    {
      name: "BMI Calculator",
      type: "bmi",
      value: inputValues.bmi.toFixed(1),
      category: "Normal",
      subtitle: "Healthy BMI range",
      description: "Tests gradient text in footer"
    },
    {
      name: "Calorie Calculator", 
      type: "calorie",
      value: Math.round(inputValues.calories).toString(),
      category: "Maintenance",
      subtitle: "Daily calorie needs",
      description: "Tests background animations"
    },
    {
      name: "Water Calculator",
      type: "water",
      value: inputValues.water.toFixed(1),
      category: "Optimal Hydration",
      subtitle: "Daily intake goal",
      description: "Tests category badge gradients"
    },
    {
      name: "Heart Rate Calculator",
      type: "heart",
      value: Math.round(inputValues.heartRate).toString(),
      category: "Training Zone",
      subtitle: "Aerobic range",
      description: "Tests pulse animations"
    },
    {
      name: "Ideal Weight Calculator",
      type: "idealWeight", 
      value: inputValues.weight.toFixed(1),
      category: "Medium Frame",
      subtitle: "Healthy range",
      description: "Tests corner element gradients"
    },
    {
      name: "1RM Calculator",
      type: "oneRm",
      value: Math.round(inputValues.oneRm).toString(),
      category: "Bench Press", 
      subtitle: "Personal record",
      unit: "kg",
      description: "Tests logo background gradients"
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Style Property Conflict & Tagline Fix Test
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Testing React style property fixes and consistent tagline rendering
        </p>
        
        {/* Console Warning Monitor */}
        <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-2">Console Warning Monitor</h3>
          <div className="flex items-center justify-between">
            <div className={`px-3 py-1 rounded text-sm font-medium ${
              consoleWarnings.length === 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {consoleWarnings.length === 0 
                ? '✅ No style property warnings detected' 
                : `❌ ${consoleWarnings.length} warnings detected`}
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Force Re-render (Key: {refreshKey})
            </button>
          </div>
          
          {consoleWarnings.length > 0 && (
            <div className="mt-4 max-h-32 overflow-y-auto">
              <h4 className="font-medium text-red-800 mb-2">Recent Warnings:</h4>
              {consoleWarnings.slice(-5).map((warning, index) => (
                <div key={index} className="text-xs text-red-700 bg-red-50 p-2 rounded mb-1">
                  <span className="font-mono">{warning.timestamp}</span>: {warning.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {testCases.map((testCase, index) => (
          <div key={`${testCase.type}-${refreshKey}-${index}`} className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {testCase.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {testCase.description}
              </p>
              <p className="text-xs text-gray-500">
                Value: {testCase.value} | Renders: {refreshKey + 1}
              </p>
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
            
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded p-2">
                <p className="font-semibold text-green-600">✅ Expected:</p>
                <p>"NOURISHING BODIES • SCULPTING GREATNESS"</p>
                <p className="font-semibold text-red-600 mt-1">❌ Should NOT:</p>
                <p>Show horizontal line or console warnings</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* Style Property Fixes */}
        <div className="rounded-xl bg-blue-50 p-6 dark:bg-blue-950/40">
          <h2 className="mb-4 text-xl font-bold text-blue-900 dark:text-blue-200">
            Style Property Fixes Applied
          </h2>
          <div className="space-y-3 text-sm text-blue-700 dark:text-blue-400">
            <div>
              <h3 className="font-semibold">Background Property Conflicts:</h3>
              <ul className="ml-4 space-y-1">
                <li>• Replaced <code>background</code> with <code>backgroundImage</code></li>
                <li>• Fixed pulse wave animations</li>
                <li>• Fixed logo gradient backgrounds</li>
                <li>• Fixed category badge gradients</li>
                <li>• Fixed corner element gradients</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">BackgroundClip Conflicts:</h3>
              <ul className="ml-4 space-y-1">
                <li>• Used Tailwind classes for gradient text</li>
                <li>• Separated background and clip properties</li>
                <li>• Fixed tagline gradient rendering</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tagline Rendering Fixes */}
        <div className="rounded-xl bg-green-50 p-6 dark:bg-green-950/40">
          <h2 className="mb-4 text-xl font-bold text-green-900 dark:text-green-200">
            Tagline Rendering Fixes
          </h2>
          <div className="space-y-3 text-sm text-green-700 dark:text-green-400">
            <div>
              <h3 className="font-semibold">Static Rendering:</h3>
              <ul className="ml-4 space-y-1">
                <li>• Tagline not tied to result state</li>
                <li>• Persistent container structure</li>
                <li>• No conditional rendering</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Layout Protection:</h3>
              <ul className="ml-4 space-y-1">
                <li>• Explicit border controls</li>
                <li>• Higher z-index for text</li>
                <li>• Tailwind gradient classes</li>
                <li>• Consistent padding/margins</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-yellow-50 p-6 dark:bg-yellow-950/40">
        <h2 className="mb-4 text-xl font-bold text-yellow-900 dark:text-yellow-200">
          Test Validation Checklist
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Console Warnings:</h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
              <li>✅ No "style property during rerender" warnings</li>
              <li>✅ No "conflicting property" warnings</li>
              <li>✅ No background/backgroundClip conflicts</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Tagline Rendering:</h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
              <li>✅ Text always visible, never horizontal line</li>
              <li>✅ Gradient effects work properly</li>
              <li>✅ Consistent across all calculator types</li>
              <li>✅ Survives state changes and re-renders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}