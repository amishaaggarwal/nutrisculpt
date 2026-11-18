// Safe return-link validation for the expert-connect page.
// Prevents open redirects to arbitrary external URLs.

export const BACK_ROUTE_ALLOWLIST = new Set([
  "/",
  "/#services",
  "/#approach",
  "/#testimonials",
  "/#contact",
  "/bmi",
  "/calories",
  "/macros",
  "/one-rm",
  "/ideal-weight",
  "/water-intake",
  "/heart-rate",
  "/transformation",
  "/expert-connect",
  "/services/category/strength-fitness-performance",
  "/services/category/metabolic-bone-health",
  "/services/category/pain-posture-movement",
  "/services/category/functional-fitness-life-stages",
  "/services/category/fitness-education-independence",
]);

export function isSafeBackHref(value) {
  if (!value || typeof value !== "string") return false;

  // Reject any scheme-based URLs (http://, https://, ftp://, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) return false;

  // Reject protocol-relative URLs (//external)
  if (value.startsWith("//")) return false;

  // Reject backslash-based tricks
  if (value.includes("\\")) return false;

  // Only allow exact matches from the allowlist
  return BACK_ROUTE_ALLOWLIST.has(value);
}

// Calculator source identifiers recognized across the site.
// Used to preserve attribution through intermediate pages.
export const CALCULATOR_SOURCE_ALLOWLIST = new Set([
  "calculator-bmi",
  "calculator-calories",
  "calculator-macros",
  "calculator-one-rm",
  "calculator-ideal-weight",
  "calculator-water-intake",
  "calculator-heart-rate",
]);

export function isValidCalculatorSource(value) {
  if (!value || typeof value !== "string") return false;
  return CALCULATOR_SOURCE_ALLOWLIST.has(value);
}
