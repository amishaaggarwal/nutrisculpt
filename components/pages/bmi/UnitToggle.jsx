import React from "react";

const UnitToggle = ({ unitSystem, onUnitChange }) => (
  <div className="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
    {[
      { key: "metric", label: "Metric", fullLabel: "Metric (kg, cm)" },
      { key: "imperial", label: "Imperial", fullLabel: "Imperial (lb, ft/in)" },
    ].map(({ key, label, fullLabel }) => (
      <button
        key={key}
        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
          unitSystem === key
            ? "bg-white text-gray-900 shadow dark:bg-gray-900 dark:text-white"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        }`}
        onClick={() => onUnitChange(key)}
        title={fullLabel}
      >
        <span className="sm:hidden">{label}</span>
        <span className="hidden sm:inline">{fullLabel}</span>
      </button>
    ))}
  </div>
);

export default UnitToggle;
