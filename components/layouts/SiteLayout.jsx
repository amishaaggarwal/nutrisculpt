"use client";

import { useState, useEffect } from "react";
import Header from "@/components/atoms/Header";
import Footer from "@/components/atoms/Footer";

const SiteLayout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      setDarkMode(saved === "true");
    }
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((v) => {
      const newValue = !v;
      localStorage.setItem("darkMode", String(newValue));
      return newValue;
    });
  };

  return (
    <div className={mounted && darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gray-100 text-gray-800 transition-colors dark:bg-gray-900 dark:text-gray-200">
        <Header darkMode={mounted && darkMode} toggleDarkMode={toggleDarkMode} />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default SiteLayout;
