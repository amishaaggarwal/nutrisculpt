"use client";

import { BRAND } from "@/constants";
import { useState, useEffect } from "react";

const Footer = () => {
  const [year, setYear] = useState(2024);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-gray-800 py-4 text-center text-gray-200 dark:bg-gray-900">
      <p>
        &copy; {year} {BRAND}. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
