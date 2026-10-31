"use client";

import React, { useState } from "react";

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
  const zones = [
    { name: "Zone 1", min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6) },
    { name: "Zone 2", min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7) },
    { name: "Zone 3", min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8) },
    { name: "Zone 4", min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9) },
    { name: "Zone 5", min: Math.round(maxHR * 0.9), max: maxHR },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Start Your Transformation</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow">
        <div>
          <label className="block text-sm font-medium">Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange} className="w-full rounded border p-2">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Age</label>
          <input type="number" name="age" value={form.age} onChange={handleChange} className="w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Height (cm)</label>
          <input type="number" name="height" value={form.height} onChange={handleChange} className="w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Weight (kg)</label>
          <input type="number" name="weight" value={form.weight} onChange={handleChange} className="w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Activity Level</label>
          <select name="activity" value={form.activity} onChange={handleChange} className="w-full rounded border p-2">
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
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">Ideal Weight</h2>
            <p>{idealWeight.toFixed(1)} kg</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">Calories</h2>
            <p>{Math.round(calories)} kcal/day</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">Macros</h2>
            <p>Protein: {Math.round(protein)}g | Carbs: {Math.round(carbs)}g | Fat: {Math.round(fat)}g</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold">Heart Rate Zones</h2>
            <ul>
              {zones.map((z) => (
                <li key={z.name}>{z.name}: {z.min} - {z.max} bpm</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
