"use client";
import React, { useId } from "react";

const InputField = ({
  label,
  value,
  onChange,
  type = "number",
  min = 0,
  step = 0.1,
  placeholder,
  id: inputIdProp,
  required,
  "aria-label": ariaLabel,
}) => {
  const generatedId = useId();
  const inputId = inputIdProp || `input-${generatedId}`;
  const labelId = `${inputId}-label`;
  const hasVisibleLabel = label && label.trim().length > 0;

  return (
    <div>
      {hasVisibleLabel && (
        <label
          htmlFor={inputId}
          id={labelId}
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        min={min}
        step={step}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : parseFloat(e.target.value))
        }
        placeholder={placeholder}
        required={required}
        aria-label={hasVisibleLabel ? undefined : ariaLabel}
        aria-labelledby={hasVisibleLabel ? labelId : undefined}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
      />
    </div>
  );
};

export default InputField;
