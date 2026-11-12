"use client";

import React, { useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ENQUIRY_CATEGORY_ALLOWLIST,
  ENQUIRY_SERVICE_OPTIONS,
} from "@/constants/services";

const AGE_GROUPS = [
  "Under 18",
  "18–29",
  "30–44",
  "45–59",
  "60+",
  "Prefer not to say",
];

const COACHING_OPTIONS = [
  "In-person 1:1 coaching",
  "Online coaching",
  "Individualized workout plan",
  "Fitness assessment / consultation",
  "Not sure — I'd like guidance",
];

const COUNTRY_CODES = [
  { value: "+1", label: "+1 (US/Canada)" },
  { value: "+44", label: "+44 (UK)" },
  { value: "+91", label: "+91 (India)" },
  { value: "+61", label: "+61 (Australia)" },
  { value: "+971", label: "+971 (UAE)" },
  { value: "+65", label: "+65 (Singapore)" },
  { value: "+27", label: "+27 (South Africa)" },
  { value: "+234", label: "+234 (Nigeria)" },
  { value: "+254", label: "+254 (Kenya)" },
  { value: "+86", label: "+86 (China)" },
  { value: "+81", label: "+81 (Japan)" },
  { value: "+49", label: "+49 (Germany)" },
  { value: "+33", label: "+33 (France)" },
  { value: "+55", label: "+55 (Brazil)" },
  { value: "+52", label: "+52 (Mexico)" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9][0-9\s()-]{5,20}$/;
const SOURCE_ALLOWLIST = new Set([
  "service-category",
  "homepage",
  "contact-section",
  "transformation",
  "direct",
  "other",
]);

function ExpertConnectForm() {
  const searchParams = useSearchParams();
  const backHref = searchParams.get("back") || "/#services";
  const rawCategory = searchParams.get("category") || "";
  const rawSource = searchParams.get("source") || "";

  const initialCategory = ENQUIRY_CATEGORY_ALLOWLIST.has(rawCategory)
    ? rawCategory
    : "not-sure";
  const source = SOURCE_ALLOWLIST.has(rawSource)
    ? rawSource
    : initialCategory !== "not-sure"
      ? "service-category"
      : "direct";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    countryCode: "+91",
    phoneNumber: "",
    selectedServiceCategory: initialCategory,
    primaryGoal: "",
    coachingPreference: "",
    ageGroup: "",
    city: "",
    under18Guardian: false,
    privacyConsent: false,
    website: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const showCity = form.coachingPreference === "In-person 1:1 coaching";
  const showUnder18Notice = form.ageGroup === "Under 18";

  const canSubmit = useMemo(() => !loading, [loading]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setError("");
  };

  const validate = () => {
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = "Full name is required.";

    const hasEmail = !!form.email.trim();
    const hasPhone = !!form.phoneNumber.trim();
    if (!hasEmail && !hasPhone) {
      errors.contact =
        "Please provide at least one contact method: email or phone number.";
    }
    if (hasEmail && !EMAIL_RE.test(form.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (hasPhone && !PHONE_RE.test(form.phoneNumber.trim())) {
      errors.phoneNumber = "Please enter a valid phone number.";
    }

    if (!form.selectedServiceCategory) {
      errors.selectedServiceCategory = "Please select a service category.";
    }

    const goal = form.primaryGoal.trim();
    if (!goal) errors.primaryGoal = "Please tell us what you would like to achieve.";
    if (goal.length > 500) errors.primaryGoal = "Primary goal must be 500 characters or fewer.";

    if (showUnder18Notice && !form.under18Guardian) {
      errors.under18Guardian =
        "Please confirm that a parent or guardian is submitting this enquiry and using their contact information.";
    }
    if (!form.privacyConsent) {
      errors.privacyConsent = "Please confirm we may use your details to respond to your enquiry.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        countryCode: form.phoneNumber.trim() ? form.countryCode : "",
        phoneNumber: form.phoneNumber.trim(),
        selectedServiceCategory: form.selectedServiceCategory,
        primaryGoal: form.primaryGoal.trim(),
        coachingPreference: form.coachingPreference,
        ageGroup: form.ageGroup,
        city: showCity ? form.city.trim() : "",
        source,
        privacyConsent: form.privacyConsent,
        website: form.website,
      };

      const response = await fetch("/api/expert-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        setError(data?.error || "We couldn't save your enquiry. Please try again.");
        return;
      }

      setSubmitted(true);
      setForm((prev) => ({
        ...prev,
        fullName: "",
        email: "",
        phoneNumber: "",
        primaryGoal: "",
        coachingPreference: "",
        ageGroup: "",
        city: "",
        under18Guardian: false,
        privacyConsent: false,
        website: "",
      }));
    } catch (err) {
      setError("We couldn't save your enquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900";
  const labelClass = "mb-1 block text-sm font-medium text-gray-800 dark:text-gray-200";
  const errorClass = "mt-1 text-sm text-red-600 dark:text-red-400";

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-900">
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Let&apos;s Talk About Your Goals
          </h1>
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/20">
            <p className="font-medium text-green-800 dark:text-green-300">
              Your enquiry has been received. We&apos;ll review your information and get back to you using the contact details you provided.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/#services"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Back to Services
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Back to Homepage
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link href={backHref} className="text-blue-600 hover:underline dark:text-blue-400">
            ← Back
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Let&apos;s Talk About Your Goals
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Tell us a little about yourself and what you&apos;re working toward. We&apos;ll use this information to understand how NutriSculpt may be able to help.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
            </div>

            <div>
              <label htmlFor="fullName" className={labelClass}>Full Name <span className="text-red-600">*</span></label>
              <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} className={inputClass} required autoComplete="name" />
              {fieldErrors.fullName && <p className={errorClass}>{fieldErrors.fullName}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className={labelClass}>Email address</label>
                <input id="email" type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} autoComplete="email" />
                {fieldErrors.email && <p className={errorClass}>{fieldErrors.email}</p>}
              </div>
              <div>
                <label htmlFor="phoneNumber" className={labelClass}>Phone number</label>
                <div className="flex gap-2">
                  <select name="countryCode" value={form.countryCode} onChange={handleChange} className={`${inputClass} w-36`} aria-label="Country code">
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <input id="phoneNumber" type="tel" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} className={inputClass} placeholder="Phone number" autoComplete="tel-national" />
                </div>
                {fieldErrors.phoneNumber && <p className={errorClass}>{fieldErrors.phoneNumber}</p>}
              </div>
            </div>
            <p className="-mt-2 text-sm text-gray-500 dark:text-gray-400">Please provide at least one contact method (email or phone).</p>
            {fieldErrors.contact && <p className={errorClass}>{fieldErrors.contact}</p>}

            <div>
              <label htmlFor="selectedServiceCategory" className={labelClass}>Interested Service Category <span className="text-red-600">*</span></label>
              <select id="selectedServiceCategory" name="selectedServiceCategory" value={form.selectedServiceCategory} onChange={handleChange} className={inputClass} required>
                {ENQUIRY_SERVICE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {fieldErrors.selectedServiceCategory && <p className={errorClass}>{fieldErrors.selectedServiceCategory}</p>}
            </div>

            <div>
              <label htmlFor="primaryGoal" className={labelClass}>What would you like to achieve? <span className="text-red-600">*</span></label>
              <textarea
                id="primaryGoal"
                name="primaryGoal"
                value={form.primaryGoal}
                onChange={handleChange}
                className={inputClass}
                rows={4}
                maxLength={500}
                required
                placeholder="Tell us what you want to improve, achieve or learn. For example: build strength, improve daily movement, work toward a pull-up, or understand which exercises suit your goals."
              />
              <div className="mt-1 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>One or two sentences is helpful.</span>
                <span>{form.primaryGoal.length}/500</span>
              </div>
              {fieldErrors.primaryGoal && <p className={errorClass}>{fieldErrors.primaryGoal}</p>}
            </div>

            <div>
              <label htmlFor="coachingPreference" className={labelClass}>How would you prefer to work with us?</label>
              <select id="coachingPreference" name="coachingPreference" value={form.coachingPreference} onChange={handleChange} className={inputClass}>
                <option value="">Select an option (optional)</option>
                {COACHING_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {showCity && (
              <div>
                <label htmlFor="city" className={labelClass}>Which city are you based in?</label>
                <input id="city" name="city" value={form.city} onChange={handleChange} className={inputClass} autoComplete="address-level2" />
              </div>
            )}

            <div>
              <label htmlFor="ageGroup" className={labelClass}>Age Group</label>
              <select id="ageGroup" name="ageGroup" value={form.ageGroup} onChange={handleChange} className={inputClass}>
                <option value="">Select an option (optional)</option>
                {AGE_GROUPS.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            {showUnder18Notice && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                <p className="mb-3">
                  For enquiries involving people under 18, a parent or guardian should submit this form and provide their own contact information. Please do not enter a minor&apos;s direct contact details.
                </p>
                <label className="flex items-start gap-2">
                  <input type="checkbox" name="under18Guardian" checked={form.under18Guardian} onChange={handleChange} className="mt-1" />
                  <span>I am a parent/guardian submitting this enquiry and using my contact information.</span>
                </label>
                {fieldErrors.under18Guardian && <p className={errorClass}>{fieldErrors.under18Guardian}</p>}
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
              <p>
                This is an initial coaching enquiry. For health-focused coaching, additional screening or medical guidance may be needed before beginning exercise.
              </p>
              <label className="mt-3 flex items-start gap-2">
                <input type="checkbox" name="privacyConsent" checked={form.privacyConsent} onChange={handleChange} className="mt-1" required />
                <span>
                  I agree that NutriSculpt may use the details I provide to review and respond to this enquiry. Please avoid sharing medical diagnoses, medication lists, medical reports, or other unnecessary sensitive health information.
                </span>
              </label>
              {fieldErrors.privacyConsent && <p className={errorClass}>{fieldErrors.privacyConsent}</p>}
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-gray-800 sm:w-auto"
            >
              {loading ? "Sending..." : "Send My Enquiry"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ExpertConnect() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10">Loading...</div>}>
      <ExpertConnectForm />
    </Suspense>
  );
}
