"use client";

import React from "react";

/**
 * CircularProgress
 *
 * Renders a circular indicator with an optional centre label.
 *
 * Two modes:
 * - Label mode (label provided): the ring is decorative. The centre shows a
 *   short descriptive label (e.g. "BMI", "Estimate", "Reference") instead of a
 *   number, so the ring never implies a health, progress or achievement score.
 *   The arc is drawn at a constant fill and the graphic is hidden from
 *   assistive technology.
 * - Percentage mode (no label, numeric percentage provided): the centre shows
 *   "N%" and the graphic is exposed as an image with an accessible name. Use
 *   this only for a genuine, meaningful percentage.
 */
const CircularProgress = ({
  percentage = null,
  label = null,
  size = 60,
  strokeWidth = 6,
  color = "#00F5A0",
  decorative = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const hasPercentage = typeof percentage === "number" && isFinite(percentage);
  const hasLabel = typeof label === "string" && label.length > 0;
  const isDecorative = decorative || hasLabel || !hasPercentage;

  // Decorative rings use a constant fill so the arc never varies with an
  // arbitrary score. Percentage mode maps the real value onto the arc.
  const resolved = hasPercentage ? Math.max(0, Math.min(100, percentage)) : 100;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (resolved / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role={isDecorative ? "presentation" : "img"}
      aria-hidden={isDecorative ? true : undefined}
      aria-label={
        isDecorative ? undefined : `${Math.round(resolved)} percent`
      }
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-hidden="true"
        focusable="false"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center px-1 text-center text-[9px] font-bold leading-[1.05] tracking-tight"
        style={{ color }}
      >
        {hasLabel
          ? label
          : hasPercentage
            ? `${Math.round(resolved)}%`
            : null}
      </div>
    </div>
  );
};

export default CircularProgress;