"use client";

import { BRAND } from "@/constants";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faCalculator } from "@fortawesome/free-solid-svg-icons";

const calculatorMenuItems = [
  { label: "BMI Calculator", href: "/bmi" },
  { label: "Calorie Calculator", href: "/calories" },
  { label: "Macro Calculator", href: "/macros" },
  { label: "1RM Calculator", href: "/one-rm" },
  { label: "Ideal Weight", href: "/ideal-weight" },
  { label: "Water Intake", href: "/water-intake" },
  { label: "Heart Rate Zones", href: "/heart-rate" },
];

const Footer = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <footer className="bg-gray-800 py-8 text-gray-200 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Calculator Dropdown Menu */}
        <div className="mb-6 flex justify-center">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="Calculator menu"
            >
              <FontAwesomeIcon icon={faCalculator} className="h-4 w-4" />
              Calculators
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`h-3 w-3 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute bottom-full left-1/2 mb-2 w-56 -translate-x-1/2 transform rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-700 dark:ring-gray-600">
                <div
                  className="py-1"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="calculator-menu"
                >
                  {calculatorMenuItems.map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:bg-gray-600"
                      role="menuitem"
                      tabIndex={isDropdownOpen ? 0 : -1}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} {BRAND}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
