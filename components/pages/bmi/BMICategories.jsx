import React from "react";

// BMI categories for reference
const BMI_CATEGORIES = [
  {
    label: "Underweight",
    range: "< 18.5",
    color: "amber",
    bgClass: "bg-amber-100 dark:bg-amber-700/20",
    textClass: "text-amber-600",
  },
  {
    label: "Normal weight",
    range: "18.5 - 24.9",
    color: "emerald",
    bgClass: "bg-emerald-100 dark:bg-emerald-700/20",
    textClass: "text-emerald-600",
  },
  {
    label: "Overweight",
    range: "25.0 - 29.9",
    color: "orange",
    bgClass: "bg-orange-100 dark:bg-orange-700/20",
    textClass: "text-orange-600",
  },
  {
    label: "Obese",
    range: "≥ 30.0",
    color: "rose",
    bgClass: "bg-red-100 dark:bg-red-700/30",
    textClass: "text-rose-600",
  },
];

const BMICategories = () => (
  <div className="space-y-3">
    {BMI_CATEGORIES.map(({ label, range, bgClass, textClass }) => (
      <div
        key={label}
        className={`flex items-center justify-between p-3 rounded-lg ${bgClass} w-full`}
      >
        <span className="font-medium">{label}</span>
        <span className={`${textClass} font-semibold`}>{range}</span>
      </div>
    ))}
  </div>
);

export default BMICategories;
