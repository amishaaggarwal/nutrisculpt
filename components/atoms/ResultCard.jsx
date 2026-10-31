"use client";

import React, { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import CircularProgress from "./CircularProgress";

const CALCULATOR_CONFIGS = {
  bmi: { icon: "⚖️", label: "BMI", color: "#00F5A0", maxValue: 40, unit: null },
  calorie: {
    icon: "🔥",
    label: "CALORIES",
    color: "#FF6B35",
    maxValue: 3000,
    unit: "kcal/day",
  },
  tdee: {
    icon: "🔥",
    label: "TDEE",
    color: "#FF6B35",
    maxValue: 3000,
    unit: "kcal/day",
  },
  bmr: {
    icon: "🔥",
    label: "BMR",
    color: "#FF6B35",
    maxValue: 2500,
    unit: "kcal/day",
  },
  macro: {
    icon: "🥗",
    label: "MACROS",
    color: "#00D9FF",
    maxValue: 100,
    unit: "g",
  },
  water: {
    icon: "💧",
    label: "WATER",
    color: "#00D9FF",
    maxValue: 4,
    unit: "L/day",
  },
  heart: {
    icon: "❤️",
    label: "HEART RATE",
    color: "#EF4444",
    maxValue: 200,
    unit: "bpm",
  },
  idealWeight: {
    icon: "🎯",
    label: "IDEAL WEIGHT",
    color: "#8B5CF6",
    maxValue: 100,
    unit: "kg",
  },
  oneRm: {
    icon: "💪",
    label: "1RM",
    color: "#F59E0B",
    maxValue: 200,
    unit: null,
  },
};

const getColorByType = (type, value) => {
  const val = parseFloat(value);
  const colorMaps = {
    bmi:
      val < 18.5
        ? "#3B82F6"
        : val < 25
        ? "#00F5A0"
        : val < 30
        ? "#F59E0B"
        : "#EF4444",
    calorie: val < 1500 ? "#3B82F6" : val < 2500 ? "#00F5A0" : "#F59E0B",
    tdee: val < 1500 ? "#3B82F6" : val < 2500 ? "#00F5A0" : "#F59E0B",
    bmr: val < 1200 ? "#3B82F6" : val < 2000 ? "#00F5A0" : "#F59E0B",
    water: val < 2 ? "#F59E0B" : val < 3.5 ? "#00F5A0" : "#3B82F6",
    heart: val < 100 ? "#3B82F6" : val < 160 ? "#00F5A0" : "#EF4444",
  };
  return colorMaps[type] || CALCULATOR_CONFIGS[type]?.color || "#00F5A0";
};

const getProgress = (type, value) => {
  const config = CALCULATOR_CONFIGS[type];
  if (!config) return 75;
  if (type === "macro" || type === "idealWeight") return 75;
  return Math.min((parseFloat(value) / config.maxValue) * 100, 100);
};

const ResultCard = forwardRef(
  (
    {
      type = "bmi",
      value,
      category,
      subtitle,
      aspectRatio = "square",
      className = "",
      unit = null,
      ...props
    },
    ref
  ) => {
    const config = CALCULATOR_CONFIGS[type] || CALCULATOR_CONFIGS.bmi;
    const progressPercentage = getProgress(type, value);
    const currentColor = getColorByType(type, value);
    const [progress, setProgress] = useState(0);
    const displayUnit = unit || config.unit;

    useEffect(() => {
      const timer = setTimeout(() => setProgress(progressPercentage), 300);
      return () => clearTimeout(timer);
    }, [progressPercentage]);

    return (
      <div
        ref={ref}
        data-shareable-card
        className={`relative w-80 h-80 ${className}`}
        style={{
          backgroundColor: "#0f172a",
          border: "1px solid #374151",
          borderRadius: "20px",
        }}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 h-16">
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: currentColor }}
            >
              <Image
                src="/logo.jpeg"
                alt="NutriSculpt Logo"
                width={14}
                height={14}
                className="rounded object-cover"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-bold text-white truncate">NutriSculpt</h1>
              <p className="text-xs text-gray-400 truncate">{config.label}</p>
            </div>
          </div>

          <div
            className="px-2 py-1 rounded-lg text-sm flex-shrink-0"
            style={{
              background: `${currentColor}20`,
              border: `1px solid ${currentColor}`,
            }}
          >
            {config.icon}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col items-center justify-center px-4 h-48">
          {/* Value */}
          <div className="text-center mb-3">
            <div
              className={`${
                type === "macro" ? "text-xl" : "text-3xl"
              } font-black leading-none`}
              style={{ color: currentColor }}
            >
              {value}
            </div>
            {displayUnit && (
              <div
                className="text-xs font-medium mt-1"
                style={{ color: currentColor }}
              >
                {displayUnit}
              </div>
            )}
          </div>

          {/* Circular Progress */}
          <div className="mb-3">
            <CircularProgress
              percentage={progressPercentage}
              size={50}
              strokeWidth={5}
              color={currentColor}
            />
          </div>

          {/* Category */}
          {category && (
            <div
              className="px-3 py-1 rounded-lg text-xs font-bold text-white text-center mb-2 max-w-full"
              style={{ background: currentColor }}
            >
              <div className="truncate">{category}</div>
            </div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <div
              className="px-2 py-1 rounded text-xs text-center text-slate-300 max-w-full"
              style={{
                background: `${currentColor}10`,
                border: `1px solid ${currentColor}30`,
              }}
            >
              <div className="truncate">{subtitle}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center px-4">
          <div className="text-xs font-bold text-center" style={{ color: currentColor }}>
            NOURISHING BODIES • SCULPTING GREATNESS
          </div>
        </div>
      </div>
    );
  }
);

ResultCard.displayName = "ResultCard";

export default ResultCard;
