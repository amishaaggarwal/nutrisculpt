"use client";

import { BRAND } from "@/constants";
import {
  faBars,
  faMoon,
  faSun,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const Header = ({ darkMode, toggleDarkMode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md dark:bg-gray-800">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/logo.jpg" alt="Logo" width={40} height={40} />
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
              <li>
                <Link
                  href="/bmi"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  BMI Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/calories"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Calorie Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/macros"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Macro Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/one-rm"
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  1RM Calculator
                </Link>
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
                <Link
                  href="/bmi"
                  onClick={closeMobile}
                  className="block rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  BMI Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/calories"
                  onClick={closeMobile}
                  className="block rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Calorie Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/macros"
                  onClick={closeMobile}
                  className="block rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Macro Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/one-rm"
                  onClick={closeMobile}
                  className="block rounded px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  1RM Calculator
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
