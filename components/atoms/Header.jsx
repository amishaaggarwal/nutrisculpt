"use client";

import { BRAND } from "@/constants";
import {
  faBars,
  faMoon,
  faSun,
  faXmark,
  faCalculator,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

const calculatorMenuItems = [
  { label: "BMI Calculator", href: "/bmi" },
  { label: "Calorie Calculator", href: "/calories" },
  { label: "Macro Calculator", href: "/macros" },
  { label: "1RM Calculator", href: "/one-rm" },
  { label: "Ideal Weight", href: "/ideal-weight" },
  { label: "Water Intake", href: "/water-intake" },
  { label: "Heart Rate Zones", href: "/heart-rate" },
];

const Header = ({ darkMode, toggleDarkMode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const closeMobile = () => setMobileOpen(false);
  const closeDropdown = () => setIsDropdownOpen(false);

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
    <header className="sticky top-0 z-50 bg-white shadow-md dark:bg-gray-800">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/logo.jpeg" alt="Logo" width={40} height={40} />
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {BRAND}
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <nav className="hidden md:block">
            <ul className="hidden space-x-4 md:flex">
              <li>
                <Link
                  href="/#services"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/#testimonials"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Testimonials
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Contact
                </Link>
              </li>
              <li className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsDropdownOpen(!isDropdownOpen);
                    }
                  }}
                  className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:text-blue-600 dark:focus:text-blue-400"
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
                  <div className="absolute left-0 top-full mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-700 dark:ring-gray-600 z-50">
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="calculator-menu"
                    >
                      {calculatorMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeDropdown}
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
              </li>
            </ul>
          </nav>

          <button
            onClick={toggleDarkMode}
            className="flex cursor-pointer items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            <FontAwesomeIcon
              icon={darkMode ? faSun : faMoon}
              size="lg"
              className={`${darkMode ? "text-yellow-300" : "text-gray-600"}`}
            />
            <span className="hidden sm:block">
              {darkMode ? "Light Mode" : "Dark Mode"}
            </span>
          </button>

          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} size="lg" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:hidden">
          <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <ul className="flex flex-col space-y-3">
              <li>
                <Link
                  href="/#services"
                  onClick={closeMobile}
                  className="block rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/#testimonials"
                  onClick={closeMobile}
                  className="block rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Testimonials
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  onClick={closeMobile}
                  className="block rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Contact
                </Link>
              </li>
              <li>
                <div className="px-2 py-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    <FontAwesomeIcon icon={faCalculator} className="h-4 w-4" />
                    Calculators
                  </div>
                  <ul className="ml-4 space-y-2">
                    {calculatorMenuItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={closeMobile}
                          className="block rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
