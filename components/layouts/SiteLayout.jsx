"use client";

import { useState } from "react";
import Header from "@/components/atoms/Header";
import Footer from "@/components/atoms/Footer";

const SiteLayout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode((v) => !v);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-gray-100 text-gray-800 transition-colors dark:bg-gray-900 dark:text-gray-200">
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default SiteLayout;
