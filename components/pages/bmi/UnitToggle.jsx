import React from "react";

const UnitToggle = ({ unitSystem, onUnitChange }) => (
  <div className="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
    {[
      { key: "metric", label: "Metric (kg, cm)" },
      { key: "imperial", label: "Imperial (lb, ft/in)" },
    ].map(({ key, label }) => (
      <button
        key={key}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
          unitSystem === key
            ? "bg-white text-gray-900 shadow dark:bg-gray-900 dark:text-white"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        }`}
        onClick={() => onUnitChange(key)}
      >
        {label}
      </button>
    ))}
  </div>
);

export default UnitToggle;
