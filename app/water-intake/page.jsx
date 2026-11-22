
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import InputField from "@/components/atoms/InputField";
import UnitToggle from "@/components/pages/bmi/UnitToggle";
import ShareButton from "@/components/atoms/ShareButton";
import ResultCard from "@/components/atoms/ResultCard";
import ResultExplanation from "@/components/atoms/ResultExplanation";
import HealthDisclaimer from "@/components/atoms/HealthDisclaimer";
import { useShareableImage } from "@/hooks/useShareableImage";
import CalculatorNextStep from "@/components/atoms/CalculatorNextStep";
import {
  round,
  kgToLb,
  lbToKg,
  BEVERAGE_SHARE,
  waterReferenceFor,
  weightBasedEstimate,
  waterUnits,
} from "@/lib/calculators.mjs";

// Activity and climate influence fluid needs, but the reference value is not
// changed by a fixed amount: sweat losses vary too much for that to be honest.
const ACTIVITY_LEVELS = [
  { value: 1.0, label: "Sedentary", description: "Little to no exercise", note: "Reference values already cover typical daily activity." },
  { value: 1.2, label: "Light Activity", description: "Light exercise 1-3 days/week", note: "Exercise raises fluid needs; drink to thirst around activity." },
  { value: 1.4, label: "Moderate Activity", description: "Moderate exercise 3-5 days/week", note: "Plan fluids around longer or harder sessions." },
  { value: 1.6, label: "High Activity", description: "Hard exercise 6-7 days/week", note: "Higher sweat losses; monitor thirst and urine colour." },
  { value: 1.8, label: "Very High Activity", description: "Very hard exercise, physical job", note: "Substantially higher losses; individual assessment may be needed." },
];

const CLIMATE_CONDITIONS = [
  { value: 1.0, label: "Temperate", description: "Normal temperature & humidity", note: "No additional climate adjustment is applied." },
  { value: 1.2, label: "Hot Climate", description: "High temperature or humidity", note: "Heat increases sweat losses; increase fluids and monitor thirst." },
  { value: 1.4, label: "Very Hot/Humid", description: "Extreme heat or humidity", note: "High sweat losses; follow thirst and local heat guidance." },
  { value: 1.1, label: "Cold Climate", description: "Low temperature", note: "Cold can blunt thirst; drink regularly even without thirst." },
];

// Health conditions are shown as cautions, not as automatic fluid adjustments.
// Prescribed fluid restrictions always take priority over a calculator.
const HEALTH_CONDITIONS = [
  {
    id: "fever",
    label: "Fever",
    severity: "caution",
    caution: "Fever increases fluid losses. Drink to thirst and seek medical advice if you cannot keep fluids down.",
  },
  {
    id: "vomiting",
    label: "Vomiting/Diarrhea",
    severity: "urgent",
    caution: "Vomiting or diarrhoea can cause significant fluid and electrolyte loss. Seek medical advice, especially for children and older adults; oral rehydration may be needed.",
  },
  {
    id: "bladderInfection",
    label: "Bladder Infection",
    severity: "caution",
    caution: "Follow your clinician's advice on fluid intake during a urinary infection.",
  },
  {
    id: "heartDisease",
    label: "Heart Disease",
    severity: "medical",
    caution: "Some heart conditions require a prescribed fluid restriction. Do not use this estimate; follow your healthcare provider's fluid allowance.",
  },
  {
    id: "kidneyDisease",
    label: "Kidney Disease",
    severity: "medical",
    caution: "Fluid needs vary widely in kidney disease and may be restricted. Do not use this estimate; follow your healthcare provider's advice.",
  },
];

export default function WaterIntakeCalculator() {
  const [unitSystem, setUnitSystem] = useState("metric");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(25);
  const [activityLevel, setActivityLevel] = useState(1.0);
  const [climateCondition, setClimateCondition] = useState(1.0);
  const [isPregnant, setIsPregnant] = useState(false);
  const [isBreastfeeding, setIsBreastfeeding] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);

  // Share functionality
  const { shareableCardRef, generateImage, generateShareData, validateResultForPrivacy } = useShareableImage('water-intake');

  // Store both metric and imperial values
  const [weight, setWeight] = useState({ kg: 70, lb: 154.3 });

  // Weight handlers
  const handleWeightChange = (value, unit) => {
    if (unit === "kg") {
      setWeight({ kg: value, lb: round(kgToLb(value), 1) });
    } else {
      setWeight({ kg: round(lbToKg(value), 1), lb: value });
    }
  };

  // Handle health condition selection
  const handleConditionChange = (conditionId) => {
    setSelectedConditions(prev =>
      prev.includes(conditionId)
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  const isAdult = Number.isFinite(age) && age >= 18;

  // Population reference total water (IOM 2004). This is a reference for a
  // population, not an individual prescription.
  const reference = useMemo(() => {
    if (!isAdult) return null;
    return waterReferenceFor({
      sex: gender,
      pregnant: isPregnant,
      breastfeeding: isBreastfeeding,
    });
  }, [isAdult, gender, isPregnant, isBreastfeeding]);

  // Separate rough weight-based heuristic (35 ml/kg). Kept deliberately apart
  // from the reference value because the two methods estimate different things.
  const weightEstimate = useMemo(() => {
    if (!isAdult) return null;
    return weightBasedEstimate(weight.kg);
  }, [isAdult, weight.kg]);

  const referenceUnits = useMemo(
    () => (reference ? waterUnits(reference.total) : null),
    [reference]
  );

  const beverageLiters = reference ? reference.total * BEVERAGE_SHARE : null;
  const beverageUnits = useMemo(() => waterUnits(beverageLiters), [beverageLiters]);

  const weightUnits = useMemo(() => waterUnits(weightEstimate), [weightEstimate]);

  // Optional example only: spread drinks across a 16-hour waking day.
  const hourlyExample = useMemo(() => {
    if (!beverageUnits) return null;
    return {
      ml: round(beverageUnits.ml / 16, 0),
      oz: round(beverageUnits.oz / 16, 1),
    };
  }, [beverageUnits]);

  const selectedConditionData = useMemo(
    () => HEALTH_CONDITIONS.filter((c) => selectedConditions.includes(c.id)),
    [selectedConditions]
  );

  const hasMedicalRestriction = selectedConditionData.some(
    (c) => c.severity === "medical"
  );

  // Share only display-safe, non-identifying values.
  const shareResult = useMemo(() => {
    if (!reference || !referenceUnits || hasMedicalRestriction) return null;

    return validateResultForPrivacy(
      {
        value: referenceUnits.liters,
        unit: "L/day",
        alternativeUnits: `${referenceUnits.ml} ml | ${referenceUnits.oz} fl oz | ${referenceUnits.cups} cups`,
      },
      [
        "weight",
        "age",
        "gender",
        "activityLevel",
        "climateCondition",
        "selectedConditions",
        "isPregnant",
        "isBreastfeeding",
      ]
    );
  }, [reference, referenceUnits, hasMedicalRestriction, validateResultForPrivacy]);

  const shareData = useMemo(() => {
    if (!shareResult) return null;
    return generateShareData(shareResult);
  }, [shareResult, generateShareData]);

  const handleGenerateImage = async () => {
    if (!shareResult) throw new Error('No results to share');
    return await generateImage();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 text-center"
      >
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Daily Water Intake Calculator
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Calculate your personalized daily water intake needs
        </p>
      </motion.div>

      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
      >
        {/* Unit System Selector */}
        <div className="mb-6 flex justify-center">
          <UnitToggle unitSystem={unitSystem} onUnitChange={setUnitSystem} />
        </div>

        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            {/* Gender Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gender
              </label>
              <div className="flex gap-4">
                {["male", "female"].map((g) => (
                  <label key={g} className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={(e) => setGender(e.target.value)}
                      className="mr-2 h-4 w-4 text-blue-600"
                    />
                    <span className="capitalize text-sm font-medium">
                      {g}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age */}
            <InputField
              label="Age"
              value={age}
              onChange={setAge}
              type="number"
              placeholder="25"
              min="1"
              max="120"
            />

            {/* Weight */}
            <InputField
              label={`Weight (${unitSystem === "metric" ? "kg" : "lbs"})`}
              value={unitSystem === "metric" ? weight.kg : weight.lb}
              onChange={(value) =>
                handleWeightChange(
                  value,
                  unitSystem === "metric" ? "kg" : "lb"
                )
              }
              type="number"
              placeholder={unitSystem === "metric" ? "70" : "154"}
              min="1"
            />

            {/* Special Conditions for Women */}
            {gender === "female" && (
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={(e) => setIsPregnant(e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">Pregnant</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isBreastfeeding}
                    onChange={(e) => setIsBreastfeeding(e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">Breastfeeding</span>
                </label>
              </div>
            )}
          </div>

          {/* Activity & Environment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Activity & Environment</h3>
            
            {/* Activity Level */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {ACTIVITY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Climate Condition */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Climate Condition
              </label>
              <select
                value={climateCondition}
                onChange={(e) => setClimateCondition(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {CLIMATE_CONDITIONS.map((climate) => (
                  <option key={climate.value} value={climate.value}>
                    {climate.label} - {climate.description}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Activity and climate change your needs but are not used to alter the reference
              value, because sweat losses vary too much for a fixed adjustment.
            </p>
          </div>
        </div>

        {/* Health Conditions */}
        <div className="mt-6">
          <h3 className="mb-4 text-lg font-semibold">Health Conditions</h3>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Select any conditions that apply. These are shown as safety cautions and do not
            change the calculated estimate.
          </p>
          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
            {HEALTH_CONDITIONS.map((condition) => (
              <label key={condition.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(condition.id)}
                  onChange={() => handleConditionChange(condition.id)}
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                <span className="text-sm font-medium">{condition.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6">
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/40">
            <p>
              <strong>Medical Disclaimer:</strong> This calculator provides adult population
              reference values, not an individual prescription. Needs vary with body size, activity,
              climate and health. If you have heart or kidney disease, are pregnant or breastfeeding,
              or have a prescribed fluid restriction, follow your healthcare provider.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Results Section */}
      {!isAdult ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <div className="text-center">
            <h3 className="mb-3 text-lg font-semibold">
              {Number.isFinite(age) ? "Not available for this age" : "Age required"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {Number.isFinite(age)
                ? "This calculator provides adult reference values. Children and adolescents have different hydration needs, and adult weight-based rules should not be applied to them. Please consult a healthcare professional for age-appropriate guidance."
                : "Enter your age to see the adult hydration reference."}
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          {selectedConditionData.length > 0 && (
            <div className="mt-8 space-y-3">
              {selectedConditionData.map((condition) => (
                <div
                  key={condition.id}
                  className={`rounded-lg p-4 text-sm ring-1 ring-inset ${
                    condition.severity === "medical"
                      ? "bg-red-50 text-red-900 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/40"
                      : "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/40"
                  }`}
                >
                  <strong>{condition.label}:</strong> {condition.caution}
                </div>
              ))}
            </div>
          )}

          {hasMedicalRestriction ? (
            <div className="mt-8 rounded-xl bg-red-50 p-6 text-center ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:ring-red-900/40">
              <h3 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-200">
                General estimate not shown
              </h3>
              <p className="text-sm text-red-800 dark:text-red-300">
                Because a heart or kidney condition is selected, a general hydration estimate may
                not be safe to use. Follow your healthcare provider&apos;s prescribed fluid
                allowance.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {/* Population reference */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
            >
              <div className="text-center">
                <h3 className="mb-4 text-lg font-semibold">Reference Total Water</h3>
                <p className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                  {referenceUnits.liters}L
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {referenceUnits.ml} ml · {referenceUnits.oz} fl oz · {referenceUnits.cups} cups
                </p>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Total water from all beverages and food (adult population reference). This is not
                  an individual prescription.
                </p>
              </div>
            </motion.div>

            {/* Weight-based heuristic */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
            >
              <div className="text-center">
                <h3 className="mb-4 text-lg font-semibold">Weight-Based Estimate</h3>
                <p className="text-4xl font-extrabold tracking-tight text-cyan-600 dark:text-cyan-400">
                  {weightUnits ? `${weightUnits.liters}L` : "—"}
                </p>
                {weightUnits && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {weightUnits.ml} ml · {weightUnits.oz} fl oz · {weightUnits.cups} cups
                  </p>
                )}
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Rough heuristic of about 35 ml per kg of body weight. A starting reference, not a
                  requirement.
                </p>
              </div>
            </motion.div>

            {/* Optional hourly example */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
            >
              <div className="text-center">
                <h3 className="mb-4 text-lg font-semibold">Optional Hourly Example</h3>
                <p className="text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {hourlyExample ? hourlyExample.ml : "—"}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">ml per waking hour</p>
                {hourlyExample && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {hourlyExample.oz} fl oz per hour
                  </p>
                )}
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Example only. Fluid needs are not tied to a fixed hourly schedule; drink to thirst.
                </p>
              </div>
            </motion.div>

            {/* Bottles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
            >
              <div className="text-center">
                <h3 className="mb-4 text-lg font-semibold">Bottles (Example)</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {beverageUnits ? round(beverageUnits.liters / 0.5, 1) : "—"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">500 ml bottles</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {beverageUnits ? round(beverageUnits.oz / 16.9, 1) : "—"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">16.9 fl oz bottles</p>
                  </div>
                </div>
              </div>
            </motion.div>
            </div>
          )}
        </>
      )}

      {/* Educational explanation */}
      <div className="mt-6">
        <ResultExplanation
          whatItMeans={
            <>
              The <span className="font-semibold">reference total water</span> is{" "}
              {referenceUnits.liters} L/day ({referenceUnits.ml} ml) from all beverages and food,
              an adult population reference. About {beverageUnits.liters} L/day comes from drinks.
              A separate rough weight-based estimate is{" "}
              {weightUnits ? `${weightUnits.liters} L/day` : "not available"}. These are different
              reference systems and should not be added together.
            </>
          }
          whyItMatters={
            <>
              Adequate hydration supports circulation, temperature regulation, digestion and
              physical performance. For most healthy adults, thirst and normal drinking habits are
              sufficient to maintain hydration. The reference value is a useful sanity check, not a
              daily quota.
            </>
          }
          limitations={
            <>
              Hydration needs vary substantially with body size, sweating, climate, activity, diet
              and health. Very active people or those in hot climates may need more. Older adults
              may have a blunted thirst response, so regular fluids matter even without thirst.
              People with heart or kidney disease, or prescribed fluid restrictions, must follow
              their healthcare provider rather than this estimate. Drinking much more than your
              body needs — especially during prolonged exercise — can cause exercise-associated
              hyponatremia (low blood sodium), which can be serious.
            </>
          }
        />
      </div>

      {/* Hyponatremia warning */}
      <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-900 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/40">
        <p>
          <strong>Do not overdrink.</strong> Drinking far more fluid than your body needs, especially
          during prolonged exercise, can cause exercise-associated hyponatremia (low blood sodium),
          which can be serious. Drink according to thirst and replace sweat losses rather than
          forcing a fixed volume.
        </p>
      </div>

      {/* Hydration Schedule */}
      {isAdult && !hasMedicalRestriction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
        >
          <h3 className="mb-2 text-center text-lg font-semibold">
            Optional Hydration Schedule Example
          </h3>
          <p className="mb-6 text-center text-xs text-gray-500 dark:text-gray-400">
            An example of spreading drinks across the day. It is not a physiological requirement.
          </p>
          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {[
              { time: "Wake Up", amount: round(beverageUnits.ml * 0.15), description: "Start your day" },
              { time: "Morning", amount: round(beverageUnits.ml * 0.25), description: "Pre-lunch" },
              { time: "Afternoon", amount: round(beverageUnits.ml * 0.35), description: "Peak hours" },
              { time: "Evening", amount: round(beverageUnits.ml * 0.25), description: "Before dinner" },
            ].map(({ time, amount, description }) => (
              <div key={time} className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950/40">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200">{time}</h4>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{amount}ml</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">{description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-8 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 p-6 dark:from-cyan-900/20 dark:to-blue-900/20"
      >
        <h3 className="mb-4 text-lg font-semibold text-center">
          💧 Hydration Tips
        </h3>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <h4 className="font-medium text-cyan-600 dark:text-cyan-400">
              Stay Consistent:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Sip throughout the day</li>
              <li>• Don&apos;t wait until you&apos;re thirsty</li>
              <li>• Set hourly reminders</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-600 dark:text-blue-400">
              Quality Matters:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Choose clean, filtered water</li>
              <li>• Limit sugary drinks</li>
              <li>• Herbal teas count too</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-indigo-600 dark:text-indigo-400">
              Monitor Signs:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Urine should be pale yellow</li>
              <li>• Check for thirst and fatigue</li>
              <li>• Adjust for activity and weather</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Health Disclaimer */}
      <div className="mt-6">
        <HealthDisclaimer
          universalDisclaimer={
            <>
              The results provided are estimates based on general population
              formulas and the information you have entered. They are
              intended for general educational and fitness guidance, not as a
              substitute for professional medical advice. Individual
              requirements may vary depending on age, body composition,
              activity level, lifestyle, health status and other personal
              factors. These values should be treated as a starting reference,
              not fixed targets. Health Notice: If you have an existing medical
              condition, metabolic disorder, are taking medication, are
              pregnant, or have specific dietary or exercise restrictions,
              consult a qualified healthcare professional before making
              changes to your diet, hydration or exercise routine. Remember:
              Your fitness journey is individual. Use these results as a
              starting point and adjust your approach based on your body&apos;s
              response and professional guidance.
            </>
          }
          specificCaution={
<>
              Hydration requirements vary with activity, climate, sweating and
              individual health. People with kidney disease, heart conditions
              or prescribed fluid restrictions must follow their healthcare
              professional&apos;s fluid recommendations rather than relying on
              this estimate. Drinking far more than the body needs, especially during
              prolonged exercise, can cause exercise-associated hyponatremia, which
              can be serious.
            </>
          }
        />
      </div>

      {/* Enhanced Interactive Result Card Preview */}
      {shareResult && (
        <div className="mt-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your Shareable Result
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Interactive fitness-inspired result card with animations
            </p>
          </div>
          <div className="flex justify-center px-2 sm:px-4">
            <div className="w-full max-w-xs sm:max-w-sm transform hover:scale-105 transition-transform duration-300">
              <ResultCard
                type="water"
                value={shareResult.value}
                category="General Estimate"
                subtitle={shareResult.alternativeUnits}
                aspectRatio="square"
              />
            </div>
          </div>
          <div className="text-center mt-6">
            <ShareButton
              onGenerateImage={handleGenerateImage}
              shareData={shareData}
              variant="secondary"
              className="mx-auto"
            />
          </div>
        </div>
      )}

      {/* Calculator Next Step */}
      <CalculatorNextStep
        heading="What's Next"
        description={
          <>
            Hydration is only one consideration in overall exercise preparation
            and daily wellbeing. Explore your broader fitness picture.
          </>
        }
        source="calculator-water-intake"
        calculatorId="water-intake"
        showEnquiry={true}
        primaryCta={{
          label: "Explore Your Fitness & Health Snapshot",
          href: "/transformation",
        }}
      />

      {/* Hidden Shareable Card for Image Generation */}
      {shareResult && (
        <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">
          <ResultCard
            ref={shareableCardRef}
            type="water"
            value={shareResult.value}
            category="General Estimate"
            subtitle={shareResult.alternativeUnits}
          />
        </div>
      )}
    </div>
  );
}
