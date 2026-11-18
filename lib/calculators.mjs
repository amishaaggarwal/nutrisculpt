// Pure calculation helpers shared by the calculators and their tests.
// These are deliberately free of React/DOM code so they can be tested
// deterministically with `node --test`.

export const round = (value, digits = 1) => {
  if (!Number.isFinite(value)) return NaN;
  const p = Math.pow(10, digits);
  return Math.round(value * p) / p;
};

// Conversion constants (exact definitions used by the calculators).
export const KG_PER_LB = 2.20462;
export const FL_OZ_PER_L = 33.814;
export const CUPS_PER_L = 4.227;

export const kgToLb = (kg) => kg * KG_PER_LB;
export const lbToKg = (lb) => lb / KG_PER_LB;
export const literToOz = (liters) => liters * FL_OZ_PER_L;
export const literToCups = (liters) => liters * CUPS_PER_L;
export const ozToLiter = (oz) => oz / FL_OZ_PER_L;
export const cupsToLiter = (cups) => cups / CUPS_PER_L;

// ---------------------------------------------------------------------------
// Hydration
//
// Reference values are population Adequate Intakes (AI) for total water from
// all beverages and food (Institute of Medicine, 2004). They describe a
// population, not an individual prescription. About 81% of total water in the
// U.S. survey data came from beverages.
// ---------------------------------------------------------------------------

export const ADULT_WATER_AI = {
  male: 3.7,
  female: 2.7,
  pregnancy: 3.0,
  lactation: 3.8,
};

export const BEVERAGE_SHARE = 0.81;
export const WEIGHT_BASED_ML_PER_KG = 35;

export function waterReferenceFor({ sex, pregnant = false, breastfeeding = false }) {
  if (pregnant) {
    return { total: ADULT_WATER_AI.pregnancy, basis: "pregnancy" };
  }
  if (breastfeeding) {
    return { total: ADULT_WATER_AI.lactation, basis: "lactation" };
  }
  return {
    total: sex === "male" ? ADULT_WATER_AI.male : ADULT_WATER_AI.female,
    basis: sex === "male" ? "adult male" : "adult female",
  };
}

export function weightBasedEstimate(weightKg) {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  return (weightKg * WEIGHT_BASED_ML_PER_KG) / 1000;
}

// Convert one unrounded litre value into every displayed unit, rounding each
// only once so the units stay mathematically consistent.
export function waterUnits(liters) {
  if (!Number.isFinite(liters) || liters <= 0) return null;
  return {
    liters: round(liters, 1),
    ml: round(liters * 1000, 0),
    oz: round(literToOz(liters), 0),
    cups: round(literToCups(liters), 1),
  };
}

// ---------------------------------------------------------------------------
// Heart rate
// ---------------------------------------------------------------------------

export const MAX_HR_METHODS = [
  {
    id: "standard",
    name: "Standard (220 − age)",
    short: "220 − age",
    formula: (age) => 220 - age,
    genders: ["male", "female"],
    note: "Widely used but has a large individual standard deviation.",
  },
  {
    id: "tanaka",
    name: "Tanaka (208 − 0.7 × age)",
    short: "Tanaka",
    formula: (age) => 208 - 0.7 * age,
    genders: ["male", "female"],
    note: "Often fits older adults better than 220 − age.",
  },
  {
    id: "gulati",
    name: "Gulati (206 − 0.88 × age)",
    short: "Gulati",
    formula: (age) => 206 - 0.88 * age,
    genders: ["female"],
    note: "Derived in women; not validated for men.",
  },
];

export function methodById(methodId) {
  return MAX_HR_METHODS.find((m) => m.id === methodId) || null;
}

export function predictMaxHR({ methodId, age, sex }) {
  const method = methodById(methodId);
  if (!method) return null;
  if (!method.genders.includes(sex)) return null;
  if (!Number.isFinite(age) || age <= 0) return null;
  const value = method.formula(age);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

export function computeHrZones({ maxHR, restingHR, zones }) {
  if (!Number.isFinite(maxHR) || !Number.isFinite(restingHR)) return null;
  if (maxHR <= restingHR) return null;
  const reserve = maxHR - restingHR;
  return zones.map((zone) => ({
    ...zone,
    maxHR: {
      min: Math.round((zone.percentage.min / 100) * maxHR),
      max: Math.round((zone.percentage.max / 100) * maxHR),
    },
    karvonen: {
      min: Math.round(restingHR + (zone.percentage.min / 100) * reserve),
      max: Math.round(restingHR + (zone.percentage.max / 100) * reserve),
    },
  }));
}

export function validateHeartRateInputs({
  age,
  restingHR,
  maxHR,
  useCustomMaxHR,
  methodId,
  sex,
}) {
  const errors = {};

  if (!Number.isFinite(age) || age < 10 || age > 120) {
    errors.age = "Enter an age between 10 and 120.";
  }

  if (!Number.isFinite(restingHR) || restingHR < 30 || restingHR > 120) {
    errors.restingHR = "Enter a resting heart rate between 30 and 120 bpm.";
  }

  const method = methodById(methodId);
  let predicted = null;

  if (useCustomMaxHR) {
    if (!Number.isFinite(maxHR) || maxHR < 120 || maxHR > 250) {
      errors.maxHR = "Enter a measured maximum heart rate between 120 and 250 bpm.";
    }
  } else if (method && !method.genders.includes(sex)) {
    errors.method = `${method.short} is validated for ${method.genders.join(" / ")} only. Choose another method.`;
  }

  predicted = useCustomMaxHR
    ? Number.isFinite(maxHR)
      ? maxHR
      : null
    : predictMaxHR({ methodId, age, sex });

  if (
    Number.isFinite(restingHR) &&
    Number.isFinite(predicted) &&
    predicted <= restingHR
  ) {
    errors.reserve = "Maximum heart rate must be higher than resting heart rate.";
  }

  return { valid: Object.keys(errors).length === 0, errors, predicted };
}

// ---------------------------------------------------------------------------
// One-repetition maximum
// ---------------------------------------------------------------------------

export const ONE_RM_FORMULAS = [
  {
    id: "brzycki",
    name: "Brzycki",
    formula: (weight, reps) => (weight * 36) / (37 - reps),
    note: "Widely used; most stable at low repetitions.",
  },
  {
    id: "epley",
    name: "Epley",
    formula: (weight, reps) => weight * (1 + reps / 30),
    note: "Common alternative; tends to read slightly higher at low reps.",
  },
  {
    id: "lander",
    name: "Lander",
    formula: (weight, reps) => weight / (1.013 - 0.0267123 * reps),
    note: "Validated in several submaximal studies.",
  },
  {
    id: "lombardi",
    name: "Lombardi",
    formula: (weight, reps) => weight * Math.pow(reps, 0.1),
    note: "Simple power-law model.",
  },
  {
    id: "mayhew",
    name: "Mayhew",
    formula: (weight, reps) => (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps)),
    note: "Exponential model; can read high at very low reps.",
  },
  {
    id: "oconnor",
    name: "O'Conner",
    formula: (weight, reps) => weight * (1 + 0.025 * reps),
    note: "Linear model; tends to underestimate at higher reps.",
  },
  {
    id: "wathan",
    name: "Wathan",
    formula: (weight, reps) => (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps)),
    note: "Exponential model; often performs well across a wide range.",
  },
];

export const PRIMARY_ONE_RM_ID = "brzycki";
export const ONE_RM_RELIABLE_MAX_REPS = 10;

export function estimateOneRM(weight, reps, formulaId = PRIMARY_ONE_RM_ID) {
  if (!Number.isFinite(weight) || weight <= 0) return null;
  if (!Number.isFinite(reps) || reps < 1) return null;
  const formula = ONE_RM_FORMULAS.find((f) => f.id === formulaId);
  if (!formula) return null;
  if (formula.id === "brzycki" && reps >= 37) return null;
  const value = formula.formula(weight, reps);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function estimateAllOneRM(weight, reps) {
  if (!Number.isFinite(weight) || weight <= 0) return null;
  if (!Number.isFinite(reps) || reps < 1) return null;
  const out = {};
  for (const formula of ONE_RM_FORMULAS) {
    const value = estimateOneRM(weight, reps, formula.id);
    if (value !== null) out[formula.id] = value;
  }
  return out;
}

export function oneRmReliability(reps) {
  if (!Number.isFinite(reps) || reps < 1) return null;
  if (reps <= ONE_RM_RELIABLE_MAX_REPS) {
    return {
      level: "good",
      label: "Good reliability",
      note: "Estimates are generally more dependable at 10 repetitions or fewer.",
    };
  }
  if (reps <= 15) {
    return {
      level: "reduced",
      label: "Reduced reliability",
      note: "Beyond 10 repetitions, prediction error increases noticeably.",
    };
  }
  return {
    level: "low",
    label: "Low reliability",
    note: "Above 15 repetitions, treat the estimate as a rough indication only.",
  };
}

// ---------------------------------------------------------------------------
// Body Mass Index (BMI)
//
// BMI = weight (kg) / height (m)^2. Classification thresholds follow the WHO
// adult categories: underweight < 18.5, normal 18.5–24.9, overweight
// 25–29.9, obese ≥ 30. The healthy weight range is derived from a BMI of
// 18.5–24.9 for a given height.
// ---------------------------------------------------------------------------

export const BMI_CATEGORIES = [
  { min: 0, max: 18.5, label: "Underweight", category: "underweight", color: "text-amber-500" },
  { min: 18.5, max: 25, label: "Normal", category: "normal", color: "text-emerald-600" },
  { min: 25, max: 30, label: "Overweight", category: "overweight", color: "text-orange-600" },
  { min: 30, max: Infinity, label: "Obese", category: "obese", color: "text-rose-600" },
];

export function calculateBMI(weightKg, heightCm) {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  if (!Number.isFinite(heightCm) || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const value = weightKg / (heightM * heightM);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function classifyBMI(bmi) {
  if (!Number.isFinite(bmi) || bmi <= 0) {
    return { label: "—", category: "unknown", color: "text-gray-500" };
  }
  for (const category of BMI_CATEGORIES) {
    if (bmi >= category.min && bmi < category.max) {
      if (category.label === "Obese") {
        let obesityClass;
        if (bmi < 35) {
          obesityClass = { label: "Class I", note: "Moderately obese" };
        } else if (bmi < 40) {
          obesityClass = { label: "Class II", note: "Severely obese" };
        } else {
          obesityClass = { label: "Class III", note: "Very severely obese" };
        }
        return { ...category, obesityClass };
      }
      return category;
    }
  }
  return BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
}

export function bmiHealthyRange(heightCm) {
  if (!Number.isFinite(heightCm) || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const minKg = 18.5 * heightM * heightM;
  const maxKg = 24.9 * heightM * heightM;
  return {
    min: { kg: round(minKg, 1), lb: round(kgToLb(minKg), 1) },
    max: { kg: round(maxKg, 1), lb: round(kgToLb(maxKg), 1) },
  };
}

// ---------------------------------------------------------------------------
// Weight-for-Height Reference (Ideal Weight)
//
// Estimation formulas (height in inches above 5 ft = 60 in):
//   Robinson: men 52 + 1.9×(in−60), women 49 + 1.7×(in−60)
//   Miller:   men 56.2 + 1.41×(in−60), women 53.1 + 1.36×(in−60)
//   Devine:   men 50 + 2.3×(in−60),  women 45.5 + 2.3×(in−60)
//   Hamwi:    men 48 + 2.7×(in−60),  women 45.5 + 2.2×(in−60)
//   BMI:      22 × height(m)^2 (middle of healthy BMI range)
// Frame adjustments: small −10%, medium 0%, large +10% (applied to all but BMI).
// ---------------------------------------------------------------------------

export const IDEAL_WEIGHT_FORMULAS = {
  robinson: (heightCm, gender) => {
    const heightInches = heightCm / 2.54;
    return gender === "male" ? 52 + 1.9 * (heightInches - 60) : 49 + 1.7 * (heightInches - 60);
  },
  miller: (heightCm, gender) => {
    const heightInches = heightCm / 2.54;
    return gender === "male" ? 56.2 + 1.41 * (heightInches - 60) : 53.1 + 1.36 * (heightInches - 60);
  },
  devine: (heightCm, gender) => {
    const heightInches = heightCm / 2.54;
    return gender === "male" ? 50 + 2.3 * (heightInches - 60) : 45.5 + 2.3 * (heightInches - 60);
  },
  hamwi: (heightCm, gender) => {
    const heightInches = heightCm / 2.54;
    return gender === "male" ? 48 + 2.7 * (heightInches - 60) : 45.5 + 2.2 * (heightInches - 60);
  },
  bmi: (heightCm) => {
    const heightM = heightCm / 100;
    return 22 * heightM * heightM;
  },
};

export const FRAME_ADJUSTMENTS = {
  small: 0.9,
  medium: 1.0,
  large: 1.1,
};

export function calculateIdealWeight({ heightCm, gender, formulaId, frameType = "medium" }) {
  if (!Number.isFinite(heightCm) || heightCm < 100) return null;
  const formula = IDEAL_WEIGHT_FORMULAS[formulaId];
  if (!formula) return null;
  let result = formulaId === "bmi" ? formula(heightCm) : formula(heightCm, gender);
  if (!Number.isFinite(result) || result <= 0) return null;
  if (formulaId !== "bmi") {
    const adjustment = FRAME_ADJUSTMENTS[frameType] ?? 1.0;
    result = result * adjustment;
  }
  return result;
}

export function calculateAllIdealWeights({ heightCm, gender, frameType = "medium" }) {
  if (!Number.isFinite(heightCm) || heightCm < 100) return null;
  const results = {};
  for (const [formulaId, formula] of Object.entries(IDEAL_WEIGHT_FORMULAS)) {
    let result = formulaId === "bmi" ? formula(heightCm) : formula(heightCm, gender);
    if (!Number.isFinite(result) || result <= 0) continue;
    if (formulaId !== "bmi") {
      const adjustment = FRAME_ADJUSTMENTS[frameType] ?? 1.0;
      result = result * adjustment;
    }
    results[formulaId] = {
      kg: round(result, 1),
      lb: round(kgToLb(result), 1),
    };
  }
  const valid = Object.values(results).filter((r) => r.kg > 0);
  if (valid.length > 0) {
    const avgKg = valid.reduce((sum, r) => sum + r.kg, 0) / valid.length;
    results.average = {
      kg: round(avgKg, 1),
      lb: round(kgToLb(avgKg), 1),
    };
  }
  return results;
}

export function idealWeightHealthyRange(heightCm) {
  return bmiHealthyRange(heightCm);
}

// ---------------------------------------------------------------------------
// Daily Calorie Calculator (Mifflin–St Jeor)
//
// BMR (men)   = 10×weight + 6.25×height − 5×age + 5
// BMR (women) = 10×weight + 6.25×height − 5×age − 161
// TDEE = BMR × activity factor
// Target calories = TDEE + goal adjustment (−500, −250, 0, +250, +500 kcal/day)
// ---------------------------------------------------------------------------

export const ACTIVITY_LEVELS = [
  { value: 1.2, label: "Sedentary", description: "Little to no exercise" },
  { value: 1.375, label: "Lightly Active", description: "Light exercise 1-3 days/week" },
  { value: 1.55, label: "Moderately Active", description: "Moderate exercise 3-5 days/week" },
  { value: 1.725, label: "Very Active", description: "Hard exercise 6-7 days/week" },
  { value: 1.9, label: "Extremely Active", description: "Very hard exercise, physical job" },
];

export const CALORIE_GOALS = [
  { value: -500, label: "Lose Weight", description: "Moderate deficit" },
  { value: -250, label: "Mild Weight Loss", description: "Small deficit" },
  { value: 0, label: "Maintain Weight", description: "Current weight" },
  { value: 250, label: "Mild Weight Gain", description: "Small surplus" },
  { value: 500, label: "Gain Weight", description: "Moderate surplus" },
];

export function calculateBMR(weightKg, heightCm, age, gender) {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  if (!Number.isFinite(heightCm) || heightCm <= 0) return null;
  if (!Number.isFinite(age) || age < 1 || age > 120) return null;
  if (gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function calculateTDEE(bmr, activityLevel) {
  if (!Number.isFinite(bmr) || bmr <= 0) return null;
  if (!Number.isFinite(activityLevel) || activityLevel <= 0) return null;
  return bmr * activityLevel;
}

export function calculateTargetCalories(tdee, goalAdjustment) {
  if (!Number.isFinite(tdee) || tdee <= 0) return null;
  if (!Number.isFinite(goalAdjustment)) return null;
  return tdee + goalAdjustment;
}

// ---------------------------------------------------------------------------
// Macronutrient Calculator
//
// Energy density: protein 4 kcal/g, carbohydrates 4 kcal/g, fat 9 kcal/g.
// Grams = (total calories × percentage / 100) ÷ calories per gram.
// ---------------------------------------------------------------------------

export const MACRO_PRESETS = [
  { name: "Balanced", protein: 25, carbs: 45, fat: 30 },
  { name: "High Protein", protein: 35, carbs: 35, fat: 30 },
  { name: "Low Carb", protein: 30, carbs: 20, fat: 50 },
  { name: "Keto", protein: 25, carbs: 5, fat: 70 },
  { name: "High Carb", protein: 20, carbs: 60, fat: 20 },
];

export const CALORIES_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };

export function calculateMacros(totalCalories, percentages) {
  if (!Number.isFinite(totalCalories) || totalCalories <= 0) return null;
  const protein = percentages?.protein ?? 0;
  const carbs = percentages?.carbs ?? 0;
  const fat = percentages?.fat ?? 0;
  const out = {};
  for (const [macro, pct] of [["protein", protein], ["carbs", carbs], ["fat", fat]]) {
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return null;
    const kcal = totalCalories * (pct / 100);
    out[macro] = {
      percentage: pct,
      calories: round(kcal, 0),
      grams: round(kcal / CALORIES_PER_GRAM[macro], 0),
    };
  }
  return out;
}