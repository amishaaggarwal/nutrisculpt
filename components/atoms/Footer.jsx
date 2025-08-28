"use client";

import { BRAND } from "@/constants";

const Footer = () => {
  return (
    <footer className="bg-gray-800 py-4 text-center text-gray-200 dark:bg-gray-900">
      <p>
        &copy; {new Date().getFullYear()} {BRAND}. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
