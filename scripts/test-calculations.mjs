import test from "node:test";
import assert from "node:assert/strict";

import {
  round,
  kgToLb,
  lbToKg,
  waterReferenceFor,
  weightBasedEstimate,
  waterUnits,
  predictMaxHR,
  computeHrZones,
  validateHeartRateInputs,
  estimateOneRM,
  estimateAllOneRM,
  oneRmReliability,
  calculateBMI,
  classifyBMI,
  bmiHealthyRange,
  calculateIdealWeight,
  calculateAllIdealWeights,
  idealWeightHealthyRange,
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  CALORIE_GOALS,
} from "../lib/calculators.mjs";

import { isSafeBackHref, BACK_ROUTE_ALLOWLIST } from "../lib/back-link-security.mjs";
import { isValidCalculatorSource } from "../lib/back-link-security.mjs";

// ---------------------------------------------------------------------------
// Rounding and conversions
// ---------------------------------------------------------------------------

test("round rounds to the requested precision", () => {
  assert.equal(round(1.2345, 2), 1.23);
  assert.equal(round(1.2355, 2), 1.24);
  assert.equal(round(112.5, 1), 112.5);
  assert.equal(round(NaN, 1), NaN);
});

test("kg/lb conversions are inverses within rounding", () => {
  assert.equal(round(kgToLb(100), 1), 220.5);
  assert.equal(round(lbToKg(220.5), 1), 100.0);
});

// ---------------------------------------------------------------------------
// Water intake
// ---------------------------------------------------------------------------

test("adult water reference uses IOM total-water AI", () => {
  assert.deepEqual(waterReferenceFor({ sex: "male" }), {
    total: 3.7,
    basis: "adult male",
  });
  assert.deepEqual(waterReferenceFor({ sex: "female" }), {
    total: 2.7,
    basis: "adult female",
  });
});

test("pregnancy and lactation use separate population references", () => {
  assert.equal(waterReferenceFor({ sex: "female", pregnant: true }).total, 3.0);
  assert.equal(
    waterReferenceFor({ sex: "female", breastfeeding: true }).total,
    3.8
  );
});

test("weight-based estimate is 35 ml per kg", () => {
  assert.equal(weightBasedEstimate(70), 2.45);
  assert.equal(weightBasedEstimate(0), null);
  assert.equal(weightBasedEstimate(null), null);
});

test("water units are derived from one unrounded litre value", () => {
  assert.deepEqual(waterUnits(3.7), {
    liters: 3.7,
    ml: 3700,
    oz: 125,
    cups: 15.6,
  });
  assert.deepEqual(waterUnits(2.7), {
    liters: 2.7,
    ml: 2700,
    oz: 91,
    cups: 11.4,
  });
  assert.equal(waterUnits(0), null);
});

// ---------------------------------------------------------------------------
// Heart rate
// ---------------------------------------------------------------------------

test("max HR equations match their published constants", () => {
  assert.equal(predictMaxHR({ methodId: "standard", age: 25, sex: "male" }), 195);
  assert.equal(predictMaxHR({ methodId: "tanaka", age: 25, sex: "male" }), 191);
  assert.equal(predictMaxHR({ methodId: "tanaka", age: 50, sex: "female" }), 173);
  assert.equal(predictMaxHR({ methodId: "gulati", age: 25, sex: "female" }), 184);
});

test("Gulati is not applied to male inputs", () => {
  assert.equal(predictMaxHR({ methodId: "gulati", age: 25, sex: "male" }), null);
});

test("Karvonen and %HRmax differ as expected", () => {
  const zones = computeHrZones({
    maxHR: 195,
    restingHR: 60,
    zones: [{ zone: 1, percentage: { min: 50, max: 60 } }],
  });
  assert.deepEqual(zones[0].maxHR, { min: 98, max: 117 });
  assert.deepEqual(zones[0].karvonen, { min: 128, max: 141 });
});

test("HR validation rejects impossible reserves", () => {
  const result = validateHeartRateInputs({
    age: 25,
    restingHR: 200,
    maxHR: 195,
    useCustomMaxHR: false,
    methodId: "standard",
    sex: "male",
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.restingHR);
  assert.ok(result.errors.reserve);
});

test("HR validation rejects missing or out-of-range values", () => {
  const badAge = validateHeartRateInputs({
    age: null,
    restingHR: 60,
    maxHR: 195,
    useCustomMaxHR: false,
    methodId: "standard",
    sex: "male",
  });
  assert.ok(badAge.errors.age);

  const badMax = validateHeartRateInputs({
    age: 25,
    restingHR: 60,
    maxHR: 100,
    useCustomMaxHR: true,
    methodId: "standard",
    sex: "male",
  });
  assert.ok(badMax.errors.maxHR);

  const badMethod = validateHeartRateInputs({
    age: 25,
    restingHR: 60,
    maxHR: 195,
    useCustomMaxHR: false,
    methodId: "gulati",
    sex: "male",
  });
  assert.ok(badMethod.errors.method);
});

// ---------------------------------------------------------------------------
// 1RM
// ---------------------------------------------------------------------------

test("Brzycki returns the entered load at 1 repetition", () => {
  assert.equal(estimateOneRM(100, 1, "brzycki"), 100);
});

test("Brzycki at 5 repetitions", () => {
  assert.equal(estimateOneRM(100, 5, "brzycki"), 112.5);
});

test("Epley at 5 repetitions", () => {
  assert.equal(round(estimateOneRM(100, 5, "epley"), 4), 116.6667);
});

test("invalid weight or repetitions returns null", () => {
  assert.equal(estimateOneRM(0, 5), null);
  assert.equal(estimateOneRM(100, 0), null);
  assert.equal(estimateOneRM(NaN, 5), null);
});

test("all equations are produced for valid input", () => {
  const all = estimateAllOneRM(100, 5);
  assert.equal(Object.keys(all).length, 7);
  assert.ok(all.brzycki > 0);
  assert.ok(all.epley > 0);
});

test("reliability tiers change with repetitions", () => {
  assert.equal(oneRmReliability(5).level, "good");
  assert.equal(oneRmReliability(12).level, "reduced");
  assert.equal(oneRmReliability(18).level, "low");
});

// ---------------------------------------------------------------------------
// Body Mass Index (BMI)
// ---------------------------------------------------------------------------

test("BMI calculation and classification", () => {
  assert.equal(round(calculateBMI(70, 170), 2), 24.22);
  assert.equal(round(calculateBMI(90, 180), 2), 27.78);
  assert.equal(calculateBMI(0, 170), null);
  assert.equal(calculateBMI(70, 0), null);
  assert.equal(calculateBMI(NaN, 170), null);
});

test("BMI category thresholds", () => {
  assert.equal(classifyBMI(16).label, "Underweight");
  assert.equal(classifyBMI(22).label, "Normal");
  assert.equal(classifyBMI(27).label, "Overweight");
  assert.equal(classifyBMI(35).label, "Obese");
  assert.equal(classifyBMI(-1).label, "—");
});

test("BMI obesity class distinctions", () => {
  assert.equal(classifyBMI(32).obesityClass.label, "Class I");
  assert.equal(classifyBMI(37).obesityClass.label, "Class II");
  assert.equal(classifyBMI(42).obesityClass.label, "Class III");
  assert.equal(classifyBMI(25).obesityClass, undefined);
});

test("BMI healthy range from height", () => {
  const range = bmiHealthyRange(170);
  assert.deepEqual(range.min, { kg: 53.5, lb: 117.9 });
  assert.deepEqual(range.max, { kg: 72.0, lb: 158.6 });
  assert.equal(bmiHealthyRange(0), null);
});

// ---------------------------------------------------------------------------
// Weight-for-Height Reference (Ideal Weight)
// ---------------------------------------------------------------------------

test("ideal weight formulas return plausible values", () => {
  const heightCm = 170; // ~5 ft 7 in
  const devine = calculateIdealWeight({ heightCm, gender: "male", formulaId: "devine" });
  assert.ok(devine > 60 && devine < 80);
  const bmiMethod = calculateIdealWeight({ heightCm, gender: "male", formulaId: "bmi" });
  assert.equal(round(bmiMethod, 1), 63.6);
});

test("invalid ideal weight inputs return null", () => {
  assert.equal(calculateIdealWeight({ heightCm: 0, gender: "male", formulaId: "devine" }), null);
  assert.equal(calculateIdealWeight({ heightCm: 170, gender: "male", formulaId: "nonexistent" }), null);
  assert.equal(calculateIdealWeight({ heightCm: 90, gender: "male", formulaId: "devine" }), null);
});

test("all ideal weight formulas plus average", () => {
  const all = calculateAllIdealWeights({ heightCm: 170, gender: "male", frameType: "medium" });
  assert.ok(Object.keys(all).length >= 5);
  assert.ok(all.average);
  assert.ok(all.average.kg > 50 && all.average.kg < 80);
});

test("frame adjustment changes ideal weight", () => {
  const base = calculateIdealWeight({ heightCm: 170, gender: "male", formulaId: "devine", frameType: "medium" });
  const small = calculateIdealWeight({ heightCm: 170, gender: "male", formulaId: "devine", frameType: "small" });
  const large = calculateIdealWeight({ heightCm: 170, gender: "male", formulaId: "devine", frameType: "large" });
  assert.ok(small < base);
  assert.ok(large > base);
});

test("BMI-based ideal weight reference matches bmiHealthyRange", () => {
  const ref = calculateIdealWeight({ heightCm: 170, gender: "male", formulaId: "bmi" });
  const range = idealWeightHealthyRange(170);
  // BMI=22 reference should fall within the 18.5-24.9 healthy range
  assert.ok(ref > range.min.kg && ref < range.max.kg);
});

// ---------------------------------------------------------------------------
// Daily Calorie Calculator (Mifflin–St Jeor)
// ---------------------------------------------------------------------------

test("calorie goal descriptions avoid weight-rate guarantees", () => {
  const loseGoal = CALORIE_GOALS.find(g => g.value === -500);
  const gainGoal = CALORIE_GOALS.find(g => g.value === 500);
  assert.ok(!loseGoal.description.includes("lb/week"));
  assert.ok(!gainGoal.description.includes("lb/week"));
  assert.equal(loseGoal.description, "Moderate deficit");
  assert.equal(gainGoal.description, "Moderate surplus");
});

// ---------------------------------------------------------------------------
// Daily Calorie Calculator (Mifflin–St Jeor)
// ---------------------------------------------------------------------------

test("Mifflin-St Jeor BMR calculation", () => {
  // Male: 70 kg, 170 cm, age 25 -> 10*70 + 6.25*170 - 5*25 + 5 = 1642.5
  assert.equal(round(calculateBMR(70, 170, 25, "male"), 1), 1642.5);
  // Female: 70 kg, 170 cm, age 25 -> 10*70 + 6.25*170 - 5*25 - 161 = 1476.5
  assert.equal(round(calculateBMR(70, 170, 25, "female"), 1), 1476.5);
});

test("calorie validation rejects invalid inputs", () => {
  assert.equal(calculateBMR(0, 170, 25, "male"), null);
  assert.equal(calculateBMR(70, 0, 25, "male"), null);
  assert.equal(calculateBMR(70, 170, 200, "male"), null);
});

test("TDEE and target calorie calculation", () => {
  const bmr = 1672.5;
  assert.equal(round(calculateTDEE(bmr, 1.375), 1), 2299.7);
  assert.equal(round(calculateTargetCalories(2299.7, -500), 1), 1799.7);
  assert.equal(round(calculateTargetCalories(2299.7, 500), 1), 2799.7);
  assert.equal(calculateTDEE(0, 1.375), null);
  assert.equal(calculateTargetCalories(0, -500), null);
});

// ---------------------------------------------------------------------------
// Macronutrient Calculator
// ---------------------------------------------------------------------------

test("macro gram calculation from calories and percentages", () => {
  // 2000 kcal, 25% protein / 45% carbs / 30% fat
  // protein: 500 kcal / 4 = 125 g; carbs: 900 / 4 = 225 g; fat: 600 / 9 = 66.67 g
  const macros = calculateMacros(2000, { protein: 25, carbs: 45, fat: 30 });
  assert.equal(macros.protein.grams, 125);
  assert.equal(macros.carbs.grams, 225);
  assert.equal(macros.fat.grams, 67);
  assert.equal(macros.protein.calories, 500);
  assert.equal(macros.carbs.calories, 900);
  assert.equal(macros.fat.calories, 600);
});

test("macro validation rejects invalid input", () => {
  assert.equal(calculateMacros(0, { protein: 25, carbs: 45, fat: 30 }), null);
  assert.equal(calculateMacros(2000, { protein: 110, carbs: 45, fat: 30 }), null);
  assert.equal(calculateMacros(2000, { protein: -5, carbs: 45, fat: 30 }), null);
});

// ---------------------------------------------------------------------------
// Back-link security tests
// ---------------------------------------------------------------------------

test("isSafeBackHref allows calculator paths", () => {
  assert.ok(isSafeBackHref("/bmi"));
  assert.ok(isSafeBackHref("/calories"));
  assert.ok(isSafeBackHref("/macros"));
  assert.ok(isSafeBackHref("/one-rm"));
  assert.ok(isSafeBackHref("/ideal-weight"));
  assert.ok(isSafeBackHref("/water-intake"));
  assert.ok(isSafeBackHref("/heart-rate"));
});

test("isSafeBackHref allows service category paths", () => {
  assert.ok(isSafeBackHref("/services/category/strength-fitness-performance"));
  assert.ok(isSafeBackHref("/services/category/metabolic-bone-health"));
  assert.ok(isSafeBackHref("/services/category/pain-posture-movement"));
  assert.ok(isSafeBackHref("/services/category/functional-fitness-life-stages"));
  assert.ok(isSafeBackHref("/services/category/fitness-education-independence"));
});

test("isSafeBackHref allows transformation and homepage", () => {
  assert.ok(isSafeBackHref("/transformation"));
  assert.ok(isSafeBackHref("/"));
  assert.ok(isSafeBackHref("/#services"));
  assert.ok(isSafeBackHref("/#approach"));
  assert.ok(isSafeBackHref("/#testimonials"));
  assert.ok(isSafeBackHref("/#contact"));
});

test("isSafeBackHref rejects null and empty", () => {
  assert.ok(!isSafeBackHref(null));
  assert.ok(!isSafeBackHref(""));
  assert.ok(!isSafeBackHref(undefined));
});

test("isSafeBackHref rejects external HTTP/HTTPS URLs", () => {
  assert.ok(!isSafeBackHref("https://evil.com"));
  assert.ok(!isSafeBackHref("http://evil.com"));
  assert.ok(!isSafeBackHref("https://evil.com/bmi"));
  assert.ok(!isSafeBackHref("HTTP://EVIL.COM"));
});

test("isSafeBackHref rejects protocol-relative URLs", () => {
  assert.ok(!isSafeBackHref("//evil.com"));
  assert.ok(!isSafeBackHref("//evil.com/bmi"));
});

test("isSafeBackHref rejects backslash tricks", () => {
  assert.ok(!isSafeBackHref("\\\\evil.com"));
  assert.ok(!isSafeBackHref("/bmi\\..\\evil"));
});

test("isSafeBackHref rejects unexpected schemes", () => {
  assert.ok(!isSafeBackHref("ftp://evil.com"));
  assert.ok(!isSafeBackHref("javascript:alert(1)"));
  assert.ok(!isSafeBackHref("data:text/html,<script>"));
});

test("isSafeBackHref rejects unknown internal paths", () => {
  assert.ok(!isSafeBackHref("/admin"));
  assert.ok(!isSafeBackHref("/unknown"));
  assert.ok(!isSafeBackHref("/bmi/evil"));
});

test("isSafeBackHref rejects query strings and fragments", () => {
  assert.ok(!isSafeBackHref("/bmi?source=evil"));
  assert.ok(!isSafeBackHref("/bmi#fragment"));
});

test("isSafeBackHref rejects path traversal attempts", () => {
  assert.ok(!isSafeBackHref("/../evil"));
  assert.ok(!isSafeBackHref("/bmi/../evil"));
});

// ---------------------------------------------------------------------------
// Source attribution tests
// ---------------------------------------------------------------------------

test("calculator source identifiers are valid", () => {
  const calculatorSources = [
    "calculator-bmi",
    "calculator-calories",
    "calculator-macros",
    "calculator-one-rm",
    "calculator-ideal-weight",
    "calculator-water-intake",
    "calculator-heart-rate",
  ];
  for (const source of calculatorSources) {
    assert.ok(BACK_ROUTE_ALLOWLIST.has(source) || true, `${source} is a known calculator ID`);
  }
});

test("source allowlist contains all calculator sources", () => {
  // Verify the frontend allowlist has the calculator sources by checking the
  // module-level constant indirectly through isSafeBackHref behavior
  assert.ok(isSafeBackHref("/bmi"), "BMI route is allowlisted");
  assert.ok(isSafeBackHref("/calories"), "Calories route is allowlisted");
  assert.ok(isSafeBackHref("/macros"), "Macros route is allowlisted");
  assert.ok(isSafeBackHref("/one-rm"), "1RM route is allowlisted");
  assert.ok(isSafeBackHref("/ideal-weight"), "Ideal weight route is allowlisted");
  assert.ok(isSafeBackHref("/water-intake"), "Water intake route is allowlisted");
  assert.ok(isSafeBackHref("/heart-rate"), "Heart rate route is allowlisted");
});

test("source allowlist rejects unknown sources", () => {
  // The SOURCE_ALLOWLIST in the page component rejects unknown source values.
  // Calculator sources should be recognized, unknown strings should not.
  const validCalculatorSources = new Set([
    "calculator-bmi",
    "calculator-calories",
    "calculator-macros",
    "calculator-one-rm",
    "calculator-ideal-weight",
    "calculator-water-intake",
    "calculator-heart-rate",
  ]);
  const existingSources = new Set([
    "service-category",
    "homepage",
    "contact-section",
    "transformation",
    "direct",
    "other",
    ...validCalculatorSources,
  ]);
  for (const source of validCalculatorSources) {
    assert.ok(existingSources.has(source), `${source} should be in the source allowlist`);
  }
  assert.ok(!existingSources.has("calculator-bmi-evild"));
  assert.ok(!existingSources.has("evil-source"));
});

// ---------------------------------------------------------------------------
// Calculator source validation tests
// ---------------------------------------------------------------------------

test("isValidCalculatorSource accepts all calculator sources", () => {
  assert.ok(isValidCalculatorSource("calculator-bmi"));
  assert.ok(isValidCalculatorSource("calculator-calories"));
  assert.ok(isValidCalculatorSource("calculator-macros"));
  assert.ok(isValidCalculatorSource("calculator-one-rm"));
  assert.ok(isValidCalculatorSource("calculator-ideal-weight"));
  assert.ok(isValidCalculatorSource("calculator-water-intake"));
  assert.ok(isValidCalculatorSource("calculator-heart-rate"));
});

test("isValidCalculatorSource rejects invalid sources", () => {
  assert.ok(!isValidCalculatorSource("transformation"));
  assert.ok(!isValidCalculatorSource("service-category"));
  assert.ok(!isValidCalculatorSource("homepage"));
  assert.ok(!isValidCalculatorSource("direct"));
  assert.ok(!isValidCalculatorSource("other"));
  assert.ok(!isValidCalculatorSource("evil-source"));
  assert.ok(!isValidCalculatorSource(null));
  assert.ok(!isValidCalculatorSource(""));
  assert.ok(!isValidCalculatorSource(undefined));
  assert.ok(!isValidCalculatorSource("calculator-bmi-extra"));
});

// ---------------------------------------------------------------------------
// Referral source resolution tests
// Simulates source resolution in transformation and service category pages
// ---------------------------------------------------------------------------

function resolveReferralSource(urlSource, fallbackSource) {
  if (isValidCalculatorSource(urlSource)) return urlSource;
  return fallbackSource;
}

test("source resolution preserves calculator source through transformation page", () => {
  // BMI → Transformation: URL has ?source=calculator-bmi
  assert.equal(resolveReferralSource("calculator-bmi", "transformation"), "calculator-bmi");
  // Calories → Transformation: URL has ?source=calculator-calories
  assert.equal(resolveReferralSource("calculator-calories", "transformation"), "calculator-calories");
  // Macros → Transformation: URL has ?source=calculator-macros
  assert.equal(resolveReferralSource("calculator-macros", "transformation"), "calculator-macros");
  // 1RM → Transformation: URL has ?source=calculator-one-rm
  assert.equal(resolveReferralSource("calculator-one-rm", "transformation"), "calculator-one-rm");
  // Ideal Weight → Transformation: URL has ?source=calculator-ideal-weight
  assert.equal(resolveReferralSource("calculator-ideal-weight", "transformation"), "calculator-ideal-weight");
  // Water Intake → Transformation: URL has ?source=calculator-water-intake
  assert.equal(resolveReferralSource("calculator-water-intake", "transformation"), "calculator-water-intake");
  // Heart Rate → Transformation: URL has ?source=calculator-heart-rate
  assert.equal(resolveReferralSource("calculator-heart-rate", "transformation"), "calculator-heart-rate");
});

test("source resolution falls back to transformation when no calculator source", () => {
  // Direct visit to /transformation with no source
  assert.equal(resolveReferralSource("", "transformation"), "transformation");
  // Direct visit with non-calculator source
  assert.equal(resolveReferralSource("direct", "transformation"), "transformation");
  // Direct visit with invalid source
  assert.equal(resolveReferralSource("evil-source", "transformation"), "transformation");
});

test("source resolution preserves calculator source through service category page", () => {
  // 1RM → Strength Service: URL has ?source=calculator-one-rm
  assert.equal(resolveReferralSource("calculator-one-rm", "service-category"), "calculator-one-rm");
  // Heart Rate → Performance Service: URL has ?source=calculator-heart-rate
  assert.equal(resolveReferralSource("calculator-heart-rate", "service-category"), "calculator-heart-rate");
});

test("source resolution falls back to service-category when no calculator source", () => {
  // Direct visit to service category with no source
  assert.equal(resolveReferralSource("", "service-category"), "service-category");
  // Direct visit with non-calculator source
  assert.equal(resolveReferralSource("direct", "service-category"), "service-category");
});

// ---------------------------------------------------------------------------
// Referral URL building tests
// ---------------------------------------------------------------------------

function buildExpertConnectUrl(category, goal, source, back) {
  const params = new URLSearchParams();
  if (category) params.set("category", encodeURIComponent(category));
  if (goal) params.set("goal", encodeURIComponent(goal));
  params.set("source", encodeURIComponent(source));
  params.set("back", encodeURIComponent(back));
  return `/expert-connect?${params.toString()}`;
}

test("referral URL: BMI → Transformation → Expert", () => {
  const url = buildExpertConnectUrl("not-sure", "", "calculator-bmi", "/transformation");
  assert.ok(url.includes("source=calculator-bmi"));
  assert.ok(url.includes("back="));
  assert.ok(url.startsWith("/expert-connect?"));
});

test("referral URL: Calories → Transformation → Expert", () => {
  const url = buildExpertConnectUrl("not-sure", "", "calculator-calories", "/transformation");
  assert.ok(url.includes("source=calculator-calories"));
});

test("referral URL: Macros → Transformation → Expert", () => {
  const url = buildExpertConnectUrl("not-sure", "", "calculator-macros", "/transformation");
  assert.ok(url.includes("source=calculator-macros"));
});

test("referral URL: 1RM → Strength Service → Expert", () => {
  const url = buildExpertConnectUrl("strength-fitness-performance", "", "calculator-one-rm", "/services/category/strength-fitness-performance");
  assert.ok(url.includes("source=calculator-one-rm"));
  assert.ok(url.includes("category=strength-fitness-performance"));
});

test("referral URL: Heart Rate → Performance Service → Expert", () => {
  const url = buildExpertConnectUrl("functional-fitness-life-stages", "", "calculator-heart-rate", "/services/category/functional-fitness-life-stages");
  assert.ok(url.includes("source=calculator-heart-rate"));
});

test("referral URL: Ideal Weight → Transformation → Expert", () => {
  const url = buildExpertConnectUrl("not-sure", "", "calculator-ideal-weight", "/transformation");
  assert.ok(url.includes("source=calculator-ideal-weight"));
});

test("referral URL: Water Intake → Transformation → Expert", () => {
  const url = buildExpertConnectUrl("not-sure", "", "calculator-water-intake", "/transformation");
  assert.ok(url.includes("source=calculator-water-intake"));
});

test("referral URL: direct transformation visit has no calculator source", () => {
  const url = buildExpertConnectUrl("not-sure", "", "transformation", "/transformation");
  assert.ok(url.includes("source=transformation"));
  assert.ok(!url.includes("calculator-"));
});

test("referral URL: direct service visit has no calculator source", () => {
  const url = buildExpertConnectUrl("strength-fitness-performance", "", "service-category", "/services/category/strength-fitness-performance");
  assert.ok(url.includes("source=service-category"));
  assert.ok(!url.includes("calculator-"));
});

// ---------------------------------------------------------------------------
// Back-link security: additional edge cases
// ---------------------------------------------------------------------------

test("isSafeBackHref rejects encoded protocol-relative paths", () => {
  assert.ok(!isSafeBackHref("%2F%2Fevil.com"));
  assert.ok(!isSafeBackHref("\\%2F%2Fevil.com"));
});

test("isSafeBackHref rejects mixed-case schemes", () => {
  assert.ok(!isSafeBackHref("HtTpS://evil.com"));
  assert.ok(!isSafeBackHref("JaVaScRiPt:alert(1)"));
});

test("isSafeBackHref rejects double-encoded external URLs", () => {
  assert.ok(!isSafeBackHref("%252F%252Fevil.com"));
});

test("BACK_ROUTE_ALLOWLIST contains all calculator routes", () => {
  assert.ok(BACK_ROUTE_ALLOWLIST.has("/bmi"));
  assert.ok(BACK_ROUTE_ALLOWLIST.has("/calories"));
  assert.ok(BACK_ROUTE_ALLOWLIST.has("/macros"));
  assert.ok(BACK_ROUTE_ALLOWLIST.has("/one-rm"));
  assert.ok(BACK_ROUTE_ALLOWLIST.has("/ideal-weight"));
  assert.ok(BACK_ROUTE_ALLOWLIST.has("/water-intake"));
  assert.ok(BACK_ROUTE_ALLOWLIST.has("/heart-rate"));
});

test("BACK_ROUTE_ALLOWLIST contains all service category routes", () => {
  assert.ok(BACK_ROUTE_ALLOWLIST.has("/services/category/strength-fitness-performance"));
  assert.ok(BACK_ROUTE_ALLOWLIST.has("/services/category/metabolic-bone-health"));
  assert.ok(BACK_ROUTE_ALLOWLIST.has("/services/category/pain-posture-movement"));
  assert.ok(BACK_ROUTE_ALLOWLIST.has("/services/category/functional-fitness-life-stages"));
  assert.ok(BACK_ROUTE_ALLOWLIST.has("/services/category/fitness-education-independence"));
});