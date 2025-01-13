import { BRAND } from "@/constants";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";

const Header = ({ darkMode, toggleDarkMode }) => {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md dark:bg-gray-800">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <Image src="/logo.jpg" alt="Logo" width={40} height={40} />
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {BRAND}
          </h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className="flex cursor-pointer items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
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
        <nav className="hidden md:block">
          <ul className="hidden space-x-4 md:flex">
            <li>
              <a
                href="#services"
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                Services
              </a>
            </li>
            <li>
              <a
                href="#testimonials"
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                Testimonials
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
