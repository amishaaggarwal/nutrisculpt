"use client";

import React, { useState } from "react";
import Link from "next/link";
import ResultExplanation from "@/components/atoms/ResultExplanation";
import HealthDisclaimer from "@/components/atoms/HealthDisclaimer";

export default function Transformation() {
  const [form, setForm] = useState({
    gender: "male",
    age: 25,
    height: 170,
    weight: 70,
    activity: "moderate",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const h = form.height / 100;
  const bmi = form.weight / (h * h);
  const idealWeight = 22 * h * h;
  const bmr =
    form.gender === "male"
      ? 10 * form.weight + 6.25 * form.height - 5 * form.age + 5
      : 10 * form.weight + 6.25 * form.height - 5 * form.age - 161;
  const activityFactor = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  }[form.activity];
  const calories = bmr * activityFactor;
  const protein = form.weight * 2;
  const carbs = (calories * 0.45) / 4;
  const fat = (calories * 0.25) / 9;
  const maxHR = 220 - form.age;
  const waterIntake = form.weight * 0.033;
  const zones = [
    { name: "Zone 1", min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6) },
    { name: "Zone 2", min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7) },
    { name: "Zone 3", min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8) },
    { name: "Zone 4", min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9) },
    { name: "Zone 5", min: Math.round(maxHR * 0.9), max: maxHR },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
        Start Your Transformation
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
          <input type="number" name="age" value={form.age} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Height (cm)</label>
          <input type="number" name="height" value={form.height} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight (kg)</label>
          <input type="number" name="weight" value={form.weight} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Activity Level</label>
          <select name="activity" value={form.activity} onChange={handleChange} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="sedentary">Sedentary</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="active">Active</option>
            <option value="veryActive">Very Active</option>
          </select>
        </div>
        <button type="submit" className="rounded bg-blue-600 px-6 py-2 font-bold text-white">
          Submit
        </button>
      </form>

      {submitted && (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h2 className="text-xl font-bold">Ideal Weight</h2>
            <p className="mt-2 text-emerald-600 dark:text-emerald-400">
              {idealWeight.toFixed(1)} kg
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h2 className="text-xl font-bold">Water Intake</h2>
            <p className="mt-2 text-blue-600 dark:text-blue-400">
              {waterIntake.toFixed(1)} liters/day
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h2 className="text-xl font-bold">Calories</h2>
            <p className="mt-2 text-purple-600 dark:text-purple-400">
              {Math.round(calories)} kcal/day
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h2 className="text-xl font-bold">Macros</h2>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              Protein: {Math.round(protein)}g | Carbs: {Math.round(carbs)}g | Fat: {Math.round(fat)}g
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h2 className="text-xl font-bold">Heart Rate Zones</h2>
            <ul className="mt-2 space-y-1 text-gray-700 dark:text-gray-300">
              {zones.map((z) => (
                <li key={z.name}>
                  {z.name}: {z.min} - {z.max} bpm
                </li>
              ))}
            </ul>
          </div>

          {/* Educational explanation */}
          <div className="mt-6">
            <ResultExplanation
              whatItMeans={
                <>
                  Your transformation plan summarizes all your key health and
                  fitness metrics in one place. Your{" "}
                  <span className="font-semibold">ideal weight</span> of{" "}
                  {idealWeight.toFixed(1)} kg is a general target based on your
                  height. Your{" "}
                  <span className="font-semibold">
                    {Math.round(calories)} kcal/day
                  </span>{" "}
                  calorie target covers your basal metabolic rate adjusted for
                  your activity level, and your macronutrient split supports
                  that goal. Your daily{" "}
                  <span className="font-semibold">
                    {waterIntake.toFixed(1)} L
                  </span>{" "}
                  hydration target and{" "}
                  <span className="font-semibold">
                    {zones.length} heart rate training zones
                  </span>{" "}
                  (max HR {maxHR} bpm) round out the picture.
                </>
              }
              whyItMatters={
                <>
                  These numbers work together. Calories fuel your body, protein
                  supports muscle repair, carbohydrates provide energy, fats
                  aid hormone function, water maintains performance and
                  recovery, and training in the right heart rate zones
                  maximizes your effort. Use this summary as a starting point
                  for building consistent daily habits.
                </>
              }
              limitations={
                <>
                  All values here are general estimates based on standard
                  formulas. They do not account for individual metabolism,
                  body composition, medical conditions, genetics, or daily
                  variation. Your ideal weight, calorie needs, and heart rate
                  zones are starting references — not fixed targets. Adjust
                  based on how your body responds over time.
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

          <div className="flex justify-center">
            <Link
              href="/expert-connect"
              className="rounded bg-green-600 px-8 py-3 text-center font-bold text-white shadow transition hover:bg-green-700"
            >
              Connect to an expert
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
