"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

/**
 * ResultExplanation - Reusable educational explanation component
 *
 * Renders a compact, expandable "What do these results mean?" section
 * directly inside a calculator result card. Designed to match the
 * NutriSculpt design system (typography, colors, spacing, dark mode).
 *
 * Accessibility:
 * - Uses a <button> element for the toggle
 * - aria-expanded reflects open/closed state
 * - aria-controls links to the content region
 * - Keyboard operable (Enter / Space)
 *
 * Props:
 * - title: string (default "What do these results mean?")
 * - summary: short one-line description shown when collapsed
 * - whatItMeans: string or React node
 * - whyItMatters: string or React node
 * - limitations: string or React node (optional)
 * - className: additional CSS classes
 */
const ResultExplanation = ({
  title = "What do these results mean?",
  summary,
  whatItMeans,
  whyItMatters,
  limitations,
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
      className={`mt-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40 ${className}`}
    >
      {/* Toggle header */}
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="result-explanation-content"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
          <FontAwesomeIcon
            icon={faInfoCircle}
            className="h-4 w-4 text-blue-600 dark:text-blue-400"
          />
          {title}
        </span>
        <span className="flex items-center gap-2">
          {summary && (
            <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:inline">
              {summary}
            </span>
          )}
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`h-3 w-3 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {/* Expandable content */}
      <motion.div
        id="result-explanation-content"
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="overflow-hidden"
      >
        <div className="space-y-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
          {whatItMeans && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                What this means
              </h4>
              <p className="leading-relaxed">{whatItMeans}</p>
            </div>
          )}
          {whyItMatters && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Why it matters
              </h4>
              <p className="leading-relaxed">{whyItMatters}</p>
            </div>
          )}
          {limitations && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Important considerations
              </h4>
              <p className="leading-relaxed">{limitations}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResultExplanation;