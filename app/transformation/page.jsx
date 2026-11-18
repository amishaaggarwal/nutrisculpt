"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import InputField from "@/components/atoms/InputField";
import ResultExplanation from "@/components/atoms/ResultExplanation";
import HealthDisclaimer from "@/components/atoms/HealthDisclaimer";
import {
  GOAL_TO_SERVICE_MAP,
  GOAL_LABELS,
  ENQUIRY_SERVICE_OPTIONS,
  ENQUIRY_CATEGORY_ALLOWLIST,
  SERVICE_CATEGORIES,
} from "@/constants/services";
import { isValidCalculatorSource } from "@/lib/back-link-security";

function TransformationForm() {
  const [form, setForm] = useState({
    gender: "",
    age: "",
    height: "",
    weight: "",
    activity: "",
    primaryGoal: "",
    aerobicActivity: "",
    aerobicIntensity: "",
    strengthFrequency: "",
    waistCircumference: "",
    healthConsiderations: "no",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedServiceCategory, setSelectedServiceCategory] = useState("");

  // Resolve referral source: preserve calculator origin if present in URL
  const searchParams = useSearchParams();
  const urlSource = searchParams.get("source") || "";
  const resolvedSource = isValidCalculatorSource(urlSource)
    ? urlSource
    : "transformation";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((e) => ({ ...e, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    // Required fields for core calculations
    if (!form.age || form.age < 1) newErrors.age = "Please enter your age";
    if (!form.height || form.height < 50) newErrors.height = "Please enter a valid height (cm)";
    if (!form.weight || form.weight < 20) newErrors.weight = "Please enter a valid weight (kg)";
    if (!form.gender) newErrors.gender = "Please select the equation input needed for this estimate.";
    if (!form.activity) newErrors.activity = "Please select your general activity level.";
    // Optional fields - only validate if provided
    if (form.waistCircumference && (form.waistCircumference < 40 || form.waistCircumference > 200)) {
      newErrors.waistCircumference = "Please enter a valid waist circumference (40-200 cm)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const suggestedCategory = GOAL_TO_SERVICE_MAP[form.primaryGoal] || "not-sure";
      setSelectedServiceCategory(suggestedCategory);
      setSubmitted(true);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setErrors({});
    setSelectedServiceCategory("");
  };

  // Activity level options with improved descriptions
  const ACTIVITY_LEVELS = [
    { value: "sedentary", label: "Sedentary", description: "Mostly seated, minimal everyday movement" },
    { value: "light", label: "Lightly active", description: "Some daily movement and light activity" },
    { value: "moderate", label: "Moderately active", description: "Regular movement and exercise" },
    { value: "active", label: "Very active", description: "Substantial daily movement or frequent training" },
    { value: "veryActive", label: "Extremely active", description: "Exceptionally high daily physical activity" },
  ];

  // Primary goal options
  const GOAL_OPTIONS = [
    { value: "strength", label: "Build strength and general fitness" },
    { value: "health", label: "Improve health-focused fitness" },
    { value: "function", label: "Move better and improve daily function" },
    { value: "athletic", label: "Improve athletic conditioning" },
    { value: "independent", label: "Learn to train independently" },
    { value: "unsure", label: "Not sure yet" },
  ];

  // Aerobic activity duration options
  const AEROBIC_DURATION_OPTIONS = [
    { value: "none", label: "None" },
    { value: "lt75", label: "Less than 75 minutes" },
    { value: "75_149", label: "75–149 minutes" },
    { value: "150_299", label: "150–299 minutes" },
    { value: "gte300", label: "300 minutes or more" },
    { value: "unsure", label: "Not sure" },
  ];

  // Aerobic intensity options
  const AEROBIC_INTENSITY_OPTIONS = [
    { value: "moderate", label: "Mostly moderate" },
    { value: "vigorous", label: "Mostly vigorous" },
    { value: "mixed", label: "A mixture" },
    { value: "unsure", label: "Not sure" },
  ];

  // Strength training frequency options
  const STRENGTH_FREQUENCY_OPTIONS = [
    { value: "0", label: "0 days" },
    { value: "1", label: "1 day" },
    { value: "2", label: "2 days" },
    { value: "3_4", label: "3–4 days" },
    { value: "5_plus", label: "5 or more days" },
    { value: "unsure", label: "Not sure" },
  ];

  // Health considerations options
  const HEALTH_CONSIDERATIONS_OPTIONS = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "prefer_not", label: "Prefer not to say" },
  ];

  const h = form.height ? form.height / 100 : 0;
  const bmi = form.height && form.weight ? form.weight / (h * h) : 0;
  const idealWeightMin = h > 0 ? 18.5 * h * h : 0;
  const idealWeightMax = h > 0 ? 24.9 * h * h : 0;
  const hasGender = form.gender === "male" || form.gender === "female";
  const hasActivity = !!form.activity;
  const bmr = hasGender && form.age && form.height && form.weight
    ? form.gender === "male"
      ? 10 * (form.weight || 0) + 6.25 * (form.height || 0) - 5 * (form.age || 0) + 5
      : 10 * (form.weight || 0) + 6.25 * (form.height || 0) - 5 * (form.age || 0) - 161
    : 0;
  const activityFactor = hasActivity
    ? {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9,
      }[form.activity]
    : 0;
  const maintenanceCalories = bmr > 0 && activityFactor > 0 ? Math.round(bmr * activityFactor) : 0;
  // Example macronutrient distribution: 25% protein, 45% carbs, 30% fat
  const protein = maintenanceCalories > 0 ? Math.round((maintenanceCalories * 0.25) / 4) : 0;
  const carbs = maintenanceCalories > 0 ? Math.round((maintenanceCalories * 0.45) / 4) : 0;
  const fat = maintenanceCalories > 0 ? Math.round((maintenanceCalories * 0.3) / 9) : 0;
  const estimatedMaxHR = form.age ? 220 - form.age : 0;
  const waterIntake = form.weight ? form.weight * 0.033 : 0;
  // Heart rate zones using standard percentage ranges
  const hrZones = [
    {
      name: "Very Light",
      intensity: "Recovery / Warm-up",
      minPct: 50,
      maxPct: 60,
      min: estimatedMaxHR > 0 ? Math.round(estimatedMaxHR * 0.5) : 0,
      max: estimatedMaxHR > 0 ? Math.round(estimatedMaxHR * 0.6) : 0,
    },
    {
      name: "Light",
      intensity: "Aerobic Base",
      minPct: 60,
      maxPct: 70,
      min: estimatedMaxHR > 0 ? Math.round(estimatedMaxHR * 0.6) : 0,
      max: estimatedMaxHR > 0 ? Math.round(estimatedMaxHR * 0.7) : 0,
    },
    {
      name: "Moderate",
      intensity: "Aerobic Fitness",
      minPct: 70,
      maxPct: 80,
      min: estimatedMaxHR > 0 ? Math.round(estimatedMaxHR * 0.7) : 0,
      max: estimatedMaxHR > 0 ? Math.round(estimatedMaxHR * 0.8) : 0,
    },
    {
      name: "Vigorous",
      intensity: "Lactate Threshold",
      minPct: 80,
      maxPct: 90,
      min: estimatedMaxHR > 0 ? Math.round(estimatedMaxHR * 0.8) : 0,
      max: estimatedMaxHR > 0 ? Math.round(estimatedMaxHR * 0.9) : 0,
    },
    {
      name: "Very Vigorous",
      intensity: "VO₂ Max Effort",
      minPct: 90,
      maxPct: 100,
      min: estimatedMaxHR > 0 ? Math.round(estimatedMaxHR * 0.9) : 0,
      max: estimatedMaxHR,
    },
  ];

  // Waist-to-height ratio (optional)
  const waistToHeightRatioRaw = form.waistCircumference && form.height
    ? form.waistCircumference / form.height
    : null;
  const waistToHeightRatio = waistToHeightRatioRaw != null
    ? waistToHeightRatioRaw.toFixed(2)
    : null;

  // Moderate and vigorous heart rate ranges (from zones)
  const moderateHRRange = estimatedMaxHR > 0
    ? { min: Math.round(estimatedMaxHR * 0.5), max: Math.round(estimatedMaxHR * 0.7) }
    : null;
  const vigorousHRRange = estimatedMaxHR > 0
    ? { min: Math.round(estimatedMaxHR * 0.7), max: Math.round(estimatedMaxHR * 0.85) }
    : null;

  // Physical activity comparison helpers
  const getAerobicComparison = () => {
    const { aerobicActivity, aerobicIntensity, age } = form;
    if (!aerobicActivity || aerobicActivity === "unsure" || !age) {
      return { text: "Your answers don't provide enough detail for a reliable comparison.", type: "neutral" };
    }
    if (aerobicActivity === "none") {
      return { text: "Your reported activity may be below the general adult recommendation.", type: "below" };
    }
    if (aerobicIntensity === "moderate" || aerobicIntensity === "vigorous") {
      if (aerobicActivity === "lt75") {
        return { text: "Your reported activity may be below the general adult recommendation.", type: "below" };
      }
      if (aerobicActivity === "75_149") {
        if (aerobicIntensity === "vigorous") {
          return { text: "Your reported activity range meets the minimum general adult vigorous recommendation.", type: "meets" };
        }
        return { text: "Your reported activity may be below the general adult recommendation.", type: "below" };
      }
      if (aerobicActivity === "150_299") {
        return { text: "Your reported activity range is consistent with the general adult aerobic activity recommendation.", type: "meets" };
      }
      if (aerobicActivity === "gte300") {
        return { text: "Your reported activity range exceeds the minimum general adult aerobic activity recommendation.", type: "exceeds" };
      }
    }
    if (aerobicIntensity === "mixed" || aerobicIntensity === "unsure") {
      return { text: "Without knowing the intensity breakdown, a precise comparison isn't possible.", type: "neutral" };
    }
    return { text: "Your answers don't provide enough detail for a reliable comparison.", type: "neutral" };
  };

  const getStrengthComparison = () => {
    const { strengthFrequency } = form;
    if (!strengthFrequency || strengthFrequency === "unsure") {
      return { text: "Your answers don't provide enough detail for a reliable comparison.", type: "neutral" };
    }
    if (strengthFrequency === "0" || strengthFrequency === "1") {
      return { text: "General guidance suggests muscle-strengthening activities on at least two days per week.", type: "below" };
    }
    if (strengthFrequency === "2" || strengthFrequency === "3_4" || strengthFrequency === "5_plus") {
      return { text: "Your reported frequency is consistent with the general recommendation of at least two days per week.", type: "meets" };
    }
    return { text: "Your answers don't provide enough detail for a reliable comparison.", type: "neutral" };
  };

  const aerobicComparison = getAerobicComparison();
  const strengthComparison = getStrengthComparison();

  // BMI category for adults (standard classification)
  const getBMICategory = () => {
    if (!bmi || !form.age || form.age < 18) return null;
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Healthy weight";
    if (bmi < 30) return "Overweight";
    if (bmi < 35) return "Obesity Class 1";
    if (bmi < 40) return "Obesity Class 2";
    return "Obesity Class 3";
  };

  const bmiCategory = getBMICategory();

  // Waist-to-height ratio interpretation (NICE adult guidance, BMI < 35)
  const getWaistToHeightInterpretation = () => {
    if (!waistToHeightRatioRaw) return null;
    if (!bmi || !form.age || form.age < 18)
      return { category: null, note: "Not interpreted for children or when BMI is unavailable." };
    if (bmi >= 35) return { category: null, bmiNote: true };
    if (waistToHeightRatioRaw >= 0.60) return { category: "High central adiposity" };
    if (waistToHeightRatioRaw >= 0.50) return { category: "Increased central adiposity" };
    if (waistToHeightRatioRaw >= 0.40) return { category: "Lower central-adiposity category" };
    return { category: null, note: "Below the commonly referenced 0.40 central-adiposity reference point." };
  };

  const waistInterpretation = getWaistToHeightInterpretation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
        Start Your Transformation
      </h1>
      
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          {/* Section One: Basic Details */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Basic Details</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Enter a few basic details to explore your estimated fitness-related metrics.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              <div>
                <label
                  htmlFor="transformation-age"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Age (years)
                </label>
                <input
                  id="transformation-age"
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  min="1"
                  max="120"
                  placeholder="e.g., 30"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  aria-invalid={errors.age ? "true" : "false"}
                  aria-describedby={errors.age ? "age-error" : undefined}
                />
                {errors.age && (
                  <p id="age-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.age}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="transformation-height"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Height (cm)
                </label>
                <input
                  id="transformation-height"
                  type="number"
                  name="height"
                  value={form.height}
                  onChange={handleChange}
                  min="50"
                  max="250"
                  placeholder="e.g., 175"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  aria-invalid={errors.height ? "true" : "false"}
                  aria-describedby={errors.height ? "height-error" : undefined}
                />
                {errors.height && (
                  <p id="height-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.height}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="transformation-weight"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Weight (kg)
                </label>
                <input
                  id="transformation-weight"
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  min="20"
                  max="300"
                  placeholder="e.g., 70"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  aria-invalid={errors.weight ? "true" : "false"}
                  aria-describedby={errors.weight ? "weight-error" : undefined}
                />
                {errors.weight && (
                  <p id="weight-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.weight}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="transformation-gender"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Equation-Specific Sex Input
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Used for formulas that require a sex-related coefficient (e.g., calorie estimation).
                </p>
                <select
                  id="transformation-gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">Select the equation input</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && (
                  <p id="gender-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>

            <div>
                <label
                  htmlFor="transformation-activity"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  General Activity Level
                </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This helps estimate your daily energy requirements. Choose the option closest to your overall lifestyle.
              </p>
                <select
                  id="transformation-activity"
                  name="activity"
                  value={form.activity}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">Select your activity level</option>
                  {ACTIVITY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label} — {level.description}
                    </option>
                  ))}
                </select>
                {errors.activity && (
                  <p id="activity-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.activity}
                  </p>
                )}
            </div>
          </div>

          {/* Section Two: Fitness Goals & Activity */}
          <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Fitness Goals & Activity</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              <div>
                <label
                  htmlFor="transformation-goal"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  What would you like to work on?
                </label>
                <select
                  id="transformation-goal"
                  name="primaryGoal"
                  value={form.primaryGoal}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">Select a goal</option>
                  {GOAL_OPTIONS.map((goal) => (
                    <option key={goal.value} value={goal.value}>
                      {goal.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="transformation-aerobic"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  How much aerobic activity do you usually do each week?
                </label>
                <select
                  id="transformation-aerobic"
                  name="aerobicActivity"
                  value={form.aerobicActivity}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">Select duration</option>
                  {AEROBIC_DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="transformation-intensity"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Typical intensity
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Moderate: brisk walking or cycling at an easy-to-moderate pace. Vigorous: running or similar activities requiring considerably more effort.
                </p>
                <select
                  id="transformation-intensity"
                  name="aerobicIntensity"
                  value={form.aerobicIntensity}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">Select intensity</option>
                  {AEROBIC_INTENSITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="transformation-strength"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  How many days per week do you perform strength-training exercises?
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Examples include weights, resistance bands, bodyweight exercises and other muscle-strengthening activities.
                </p>
                <select
                  id="transformation-strength"
                  name="strengthFrequency"
                  value={form.strengthFrequency}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">Select frequency</option>
                  {STRENGTH_FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section Three: Additional Details (Optional) */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add More Details (Optional)</h2>
                <span className="text-gray-500 dark:text-gray-400">Click to expand</span>
              </summary>
              <div className="mt-4 space-y-6">
                <div>
                <label
                  htmlFor="transformation-waist"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Waist Circumference (cm)
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Use a flexible tape around your waist, without compressing the skin. Measure after breathing out normally.
                </p>
                <input
                  id="transformation-waist"
                  type="number"
                  name="waistCircumference"
                    value={form.waistCircumference}
                    onChange={handleChange}
                    min="40"
                    max="200"
                    placeholder="e.g., 85"
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    aria-invalid={errors.waistCircumference ? "true" : "false"}
                    aria-describedby={errors.waistCircumference ? "waist-error" : undefined}
                  />
                  {errors.waistCircumference && (
                    <p id="waist-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.waistCircumference}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Do you have any health-related considerations or exercise restrictions that may affect your exercise needs?
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Some fitness estimates may not apply to everyone. You do not need to share a diagnosis or medical history here.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {HEALTH_CONSIDERATIONS_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center">
                        <input
                          type="radio"
                          name="healthConsiderations"
                          value={opt.value}
                          checked={form.healthConsiderations === opt.value}
                          onChange={handleChange}
                          className="mr-2 h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full sm:w-auto rounded bg-blue-600 px-8 py-3 font-bold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              View My Fitness Snapshot
            </button>
          </div>
        </form>
      ) : (
        // Results section - redesigned Fitness & Health Snapshot
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Fitness & Health Snapshot</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Explore your estimated fitness-related metrics, understand general reference values, and discover areas you may want to work on.
              </p>
            </div>
            <button
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Adjust Inputs
            </button>
          </div>

          {/* Section 1: Body Measurements */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </span>
              Body Measurements
            </h3>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
              {/* BMI Card */}
              <div className="rounded-xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Body Mass Index</h4>
                    <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{bmi > 0 ? bmi.toFixed(1) : "—"}</p>
                    {bmiCategory && <p className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400">{bmiCategory}</p>}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1 bg-gray-50 dark:bg-gray-900/50 rounded">kg/m²</span>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  BMI is a screening measure of weight relative to height. It does not directly measure body fat or overall fitness.
                </p>
              </div>

              {/* Weight-for-Height Reference Card */}
              <div className="rounded-xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Weight-for-Height Reference</h4>
                    <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {idealWeightMin > 0 ? `${idealWeightMin.toFixed(1)} – ${idealWeightMax.toFixed(1)} kg` : "—"}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1 bg-gray-50 dark:bg-gray-900/50 rounded">BMI 18.5–24.9</span>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Population-level reference based on BMI 18.5–24.9. Not an individualized target.
                </p>
              </div>

              {/* Waist-to-Height Ratio Card */}
              <div className="rounded-xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Waist-to-Height Ratio</h4>
                    <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                      {waistToHeightRatio ? waistToHeightRatio : "—"}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1 bg-gray-50 dark:bg-gray-900/50 rounded">ratio</span>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {!waistToHeightRatio
                    ? "Optional. Provide waist circumference to calculate."
                    : waistInterpretation?.bmiNote
                      ? "Shown for reference. This NICE classification is intended for adults with BMI below 35 and may not provide an additional useful interpretation at higher BMI values."
                      : waistInterpretation?.category
                        ? `${waistInterpretation.category}. NICE guidance applies to adults with BMI below 35. Not a diagnosis.`
                        : waistInterpretation?.note
                          ? `${waistInterpretation.note} NICE guidance applies to adults with BMI below 35. Not a diagnosis.`
                          : "Measures central adiposity. NICE guidance applies to adults with BMI below 35. Not a diagnosis."}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Physical Activity */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </span>
              Physical Activity
            </h3>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {/* Aerobic Activity Card */}
              <div className="rounded-xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Aerobic Activity</h4>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {form.aerobicActivity
                    ? AEROBIC_DURATION_OPTIONS.find(o => o.value === form.aerobicActivity)?.label
                    : "Not provided"}
                </p>
                {form.aerobicIntensity && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Intensity: {AEROBIC_INTENSITY_OPTIONS.find(o => o.value === form.aerobicIntensity)?.label}</p>}
                <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Comparison:</strong> {aerobicComparison.text}
                  </p>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  WHO adult guideline: 150–300 min moderate or 75–150 min vigorous per week. Based on approximate ranges; not exact.
                </p>
              </div>

              {/* Strength Training Card */}
              <div className="rounded-xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Strength Training</h4>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {form.strengthFrequency
                    ? STRENGTH_FREQUENCY_OPTIONS.find(o => o.value === form.strengthFrequency)?.label
                    : "Not provided"}
                </p>
                <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Comparison:</strong> {strengthComparison.text}
                  </p>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  General guidance: muscle-strengthening activities on &gt;&gt;2 days/week. Frequency alone doesn&apos;t guarantee all guideline requirements.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Energy & Nutrition */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </span>
              Energy & Nutrition
            </h3>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
              {/* Calories Card */}
              <div className="rounded-xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Daily Maintenance Calories</h4>
                <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">{maintenanceCalories > 0 ? maintenanceCalories : "—"} kcal/day</p>
                {maintenanceCalories > 0 ? (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Mifflin–St Jeor × activity factor. Estimated maintenance, not a dietary prescription.</p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Please provide your equation-specific input and activity level to calculate maintenance calories.</p>
                )}
              </div>

              {/* Macronutrients Card */}
              <div className="rounded-xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Example Macronutrient Distribution</h4>
                {maintenanceCalories > 0 ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Protein</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">{protein}g ({(protein*4/maintenanceCalories*100).toFixed(0)}%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Carbohydrates</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{carbs}g ({(carbs*4/maintenanceCalories*100).toFixed(0)}%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Fat</span>
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">{fat}g ({(fat*9/maintenanceCalories*100).toFixed(0)}%)</span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Macronutrient distribution requires a valid maintenance calorie estimate.</p>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Illustrative 25/45/30 split. Individual needs vary by goals and preferences.</p>
              </div>

              {/* Hydration Card */}
              <div className="rounded-xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">General Hydration Estimate</h4>
                <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{waterIntake > 0 ? waterIntake.toFixed(1) : "—"} L/day</p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">~33 ml/kg body weight. Needs vary with activity, climate, health. Medical conditions may require individualized guidance.</p>
              </div>
            </div>
          </div>

          {/* Section 4: Exercise Intensity */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </span>
              Exercise Intensity
            </h3>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
              {/* Max HR Card */}
              <div className="rounded-xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Maximum Heart Rate</h4>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{estimatedMaxHR > 0 ? `${estimatedMaxHR} bpm` : "—"}</p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Based on 220 − age. Population-level prediction; actual max HR varies significantly.</p>
              </div>

              {/* Moderate Intensity Card */}
              <div className="rounded-xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700 border-l-4 border-emerald-500">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Moderate Intensity</h4>
                <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {moderateHRRange ? `${moderateHRRange.min} – ${moderateHRRange.max} bpm` : "—"}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Talk Test: Talking is possible, but singing comfortably may be difficult.</p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">~50–70% of estimated max HR.</p>
              </div>

              {/* Vigorous Intensity Card */}
              <div className="rounded-xl bg-white p-5 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700 border-l-4 border-red-500">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Vigorous Intensity</h4>
                <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                  {vigorousHRRange ? `${vigorousHRRange.min} – ${vigorousHRRange.max} bpm` : "—"}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Talk Test: Speaking more than a few words may require pausing for breath.</p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">~70–85% of estimated max HR.</p>
              </div>
            </div>
          </div>

          {/* Educational explanation */}
          <div className="mt-6">
            <ResultExplanation
              whatItMeans={
                <>
                  Your Fitness & Health Snapshot summarizes estimated metrics across four areas. 
                  <strong>Body Measurements:</strong> Your BMI of {bmi > 0 ? bmi.toFixed(1) : "—"} 
                  {bmiCategory ? `(${bmiCategory})` : ""} is a screening measure, not a direct measure of body fat or fitness. 
                  Your weight-for-height reference range of {idealWeightMin > 0 ? `${idealWeightMin.toFixed(1)}–${idealWeightMax.toFixed(1)} kg` : "—"} 
                  is based on the adult BMI interval 18.5–24.9. 
                  {waistToHeightRatio ? `Your waist-to-height ratio of ${waistToHeightRatio} ` : "Waist-to-height ratio was not calculated (optional waist measurement not provided)."}
                  <strong>Physical Activity:</strong> Your reported aerobic activity ({form.aerobicActivity ? AEROBIC_DURATION_OPTIONS.find(o => o.value === form.aerobicActivity)?.label.toLowerCase() : "not provided"}) 
                  and strength training frequency ({form.strengthFrequency ? STRENGTH_FREQUENCY_OPTIONS.find(o => o.value === form.strengthFrequency)?.label.toLowerCase() : "not provided"}) 
                  are compared with general adult guidelines. 
                  <strong>Energy & Nutrition:</strong> Estimated daily maintenance calories of {maintenanceCalories > 0 ? maintenanceCalories : "not available"} kcal/day 
                  (Mifflin–St Jeor × activity factor). {maintenanceCalories > 0 ? `Example macronutrient distribution of ${protein}g protein / ${carbs}g carbs / ${fat}g fat (25%/45%/30% split).` : "Macronutrient distribution requires a valid maintenance calorie estimate."} General hydration estimate of {waterIntake > 0 ? waterIntake.toFixed(1) : "not available"} L/day. 
                  <strong>Exercise Intensity:</strong> Estimated max HR {estimatedMaxHR > 0 ? estimatedMaxHR + " bpm" : "—"} (220 − age), 
                  moderate range {moderateHRRange ? moderateHRRange.min + "–" + moderateHRRange.max + " bpm" : "—"}, 
                  vigorous range {vigorousHRRange ? vigorousHRRange.min + "–" + vigorousHRRange.max + " bpm" : "—"}.
                </>
              }
              whyItMatters={
                <>
                  These estimates work together to give you a general picture. Body measurements provide context for weight-related metrics. 
                  Physical activity comparison helps identify areas to focus on. Energy estimates offer a reference for nutrition planning. 
                  Exercise intensity ranges help structure training. The Talk Test is a practical way to gauge intensity without a monitor: 
                  at moderate intensity you can talk but not sing comfortably; at vigorous intensity you may only manage a few words before pausing for breath.
                </>
              }
              limitations={
                <>
                  <strong>Body Measurements:</strong> BMI and weight-for-height are population-level screening references, not individualized targets. 
                  They do not account for body composition, muscle mass, bone density, or individual health status. 
                  Adult references are not appropriate for children/adolescents, pregnant/postpartum individuals, older adults with sarcopenia/frailty, 
                  athletes with high muscle mass, or conditions affecting fluid balance. 
                  Waist-to-height ratio: NICE guidance (ratio &gt;=0.5) applies to adults with BMI &lt;35; it is not a diagnosis of cardiovascular disease or diabetes.
                  <br /><br />
                  <strong>Physical Activity:</strong> Comparisons use approximate duration ranges and broad intensity categories. 
                  Exact moderate-equivalent minutes are not calculated when intensity breakdown is unavailable. 
                  Strength frequency alone doesn&apos;t confirm all guideline requirements (muscle groups, effort matter). 
                  Age-specific guidance for minors/older adults is not implemented here.
                  <br /><br />
                  <strong>Energy & Nutrition:</strong> Calorie estimate uses Mifflin–St Jeor (1990) with population-average activity multipliers. 
                  Not a weight-loss/gain prescription. Macronutrient split (25/45/30%) is illustrative only. 
                  Hydration (~33 ml/kg) is a rough approximation; heart failure, kidney disease, or fluid restrictions require medical guidance.
                  <br /><br />
                  <strong>Exercise Intensity:</strong> Max HR (220 - age) is a population prediction; actual varies significantly. 
                  Zone percentages are general ranges, not measured thresholds. 
                  Cardiovascular conditions, heart-rate-altering medications (e.g., beta blockers), pregnancy, 
                  and individualized exercise restrictions may make standard ranges inappropriate. 
                  <strong>Exercise safety:</strong> Stop and seek urgent care for chest pain/pressure, fainting/severe dizziness, 
                  unusual severe breathlessness, or other concerning symptoms. Contacting NutriSculpt does not replace emergency care.
                </>
              }
            />
          </div>

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
                  factors. These values should be treated as a starting
                  reference, not fixed targets. Health Notice: If you have an
                  existing medical condition, metabolic disorder, are taking
                  medication, are pregnant, or have specific dietary or exercise
                  restrictions, consult a qualified healthcare professional
                  before making changes to your diet, hydration or exercise
                  routine. Remember: Your fitness journey is individual. Use
                  these results as a starting point and adjust your approach
                  based on your body&apos;s response and professional guidance.
                </>
              }
              specificCaution={
                <>
                  This transformation summary combines multiple general
                  estimates. It is not a personalized medical or dietary
                  prescription. Do not use these numbers as the sole basis for
                  significant dietary or exercise changes — especially if you
                  have heart conditions, kidney disease, diabetes, eating
                  disorder history, or are recovering from injury. A qualified
                  healthcare professional or certified trainer can help tailor
                  these general targets to your specific needs.
                </>
              }
            />
          </div>

          {/* Goal-Based Service Integration CTA */}
          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm dark:border-blue-800 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">What Would You Like to Work On Next?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your snapshot is a starting point. Explore coaching options that align with your goals, or speak with us about the support you&apos;re looking for.
            </p>

            <div className="space-y-4">
              {/* Selected Goal */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Your selected goal:</p>
                <p className="mt-1 text-gray-900 dark:text-white">{form.primaryGoal ? GOAL_LABELS[form.primaryGoal] : "Not selected"}</p>
              </div>

              {/* Suggested Service Category */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggested NutriSculpt service:</p>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    {(() => {
                      const category = ENQUIRY_SERVICE_OPTIONS.find((o) => o.value === selectedServiceCategory);
                      return (
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{category?.label || "Select a category"}</p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {selectedServiceCategory !== "not-sure"
                              ? SERVICE_CATEGORIES.find((c) => c.slug === selectedServiceCategory)?.shortDescription || ""
                              : "Let us help you find the right coaching approach for your needs."}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  <select
                    value={selectedServiceCategory}
                    onChange={(e) => setSelectedServiceCategory(e.target.value)}
                    className="flex-shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  >
                    {ENQUIRY_SERVICE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href={`/expert-connect?category=${encodeURIComponent(selectedServiceCategory)}&goal=${encodeURIComponent(form.primaryGoal)}&source=${encodeURIComponent(resolvedSource)}&back=${encodeURIComponent("/transformation")}`}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3 font-bold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Connect to an Expert
                </Link>
                {selectedServiceCategory !== "not-sure" && (
                  <Link
                    href={`/services/category/${selectedServiceCategory}?source=${encodeURIComponent(resolvedSource)}`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Explore This Service
                  </Link>
                )}
                {selectedServiceCategory === "not-sure" && (
                  <Link
                    href="/#services"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    View All Services
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      </div>
  );
}

export default function Transformation() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10">Loading...</div>}>
      <TransformationForm />
    </Suspense>
  );
}
