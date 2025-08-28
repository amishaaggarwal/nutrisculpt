import React from "react";

const Gauge = ({ value }) => {
  // Clamp the BMI value to stay within the 10-50 range
  const clampedValue = Math.max(10, Math.min(50, value));

  // Calculate the angle. The range is 180 degrees.
  // The center (0 degrees) is now at a BMI of 25.
  const angle = -90 + ((clampedValue - 0) / 50) * 180;
  return (
    <div className="relative mx-auto h-40 w-80">
      <svg viewBox="0 0 200 120" className="h-full w-full">
        <defs>
          <linearGradient id="bmiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="37%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="60%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>
        {/* Main arc */}
        <path
          d="M20 100 A80 80 0 0 1 180 100"
          stroke="url(#bmiGradient)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        {/* BMI markers */}
        <g className="fill-gray-600 text-xs">
          <text x="25" y="115" textAnchor="middle">
            0
          </text>
          <text x="45" y="65" textAnchor="middle">
            10
          </text>
          <text x="70" y="45" textAnchor="middle">
            18.5
          </text>
          <text x="100" y="36" textAnchor="middle">
            25
          </text>
          <text x="120" y="40" textAnchor="middle">
            30
          </text>
          <text x="155" y="65" textAnchor="middle">
            40
          </text>
          <text x="175" y="115" textAnchor="middle">
            50
          </text>
        </g>
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="20"
          stroke="#111827"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${angle.toFixed(2)}, 100, 100)`}
        />
        {/* Center dot */}
        <circle cx="100" cy="100" r="4" fill="#111827" />
      </svg>
    </div>
  );
};

export default Gauge;
