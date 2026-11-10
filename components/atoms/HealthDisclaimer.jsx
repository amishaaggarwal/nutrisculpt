"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

/**
 * HealthDisclaimer - Reusable health disclaimer component
 *
 * Renders a compact, expandable "Important Information & Health Disclaimer"
 * section. Designed to match the NutriSculpt design system and the
 * existing ResultExplanation component pattern.
 *
 * The component shows:
 * - A universal health disclaimer (always rendered when provided)
 * - An optional calculator-specific caution
 *
 * Accessibility:
 * - Uses a <button> element for the toggle
 * - aria-expanded reflects open/closed state
 * - aria-controls links to the content region
 * - Keyboard operable (Enter / Space)
 *
 * Props:
 * - universalDisclaimer: string or React node (required)
 * - specificCaution: string or React node (optional)
 * - className: additional CSS classes
 */
const HealthDisclaimer = ({
  universalDisclaimer,
  specificCaution,
  className = "",
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => setExpanded((prev) => !prev);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  };

  return (
    <div
      className={`mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30 ${className}`}
    >
      {/* Toggle header */}
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="health-disclaimer-content"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="h-4 w-4 text-amber-600 dark:text-amber-400"
          />
          Important Information &amp; Health Disclaimer
        </span>
        <span className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`h-3 w-3 text-amber-600 transition-transform duration-200 dark:text-amber-400 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {/* Expandable content */}
      <motion.div
        id="health-disclaimer-content"
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="overflow-hidden"
      >
        <div className="space-y-3 border-t border-amber-200 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/60 dark:text-amber-200">
          {universalDisclaimer && (
            <p className="leading-relaxed">{universalDisclaimer}</p>
          )}
          {specificCaution && (
            <div className="mt-2 border-t border-amber-200 pt-2 dark:border-amber-800/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Calculator-specific caution
              </p>
              <p className="mt-1 leading-relaxed">{specificCaution}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HealthDisclaimer;