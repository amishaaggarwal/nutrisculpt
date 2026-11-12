import { NextResponse } from "next/server";
import { ENQUIRY_CATEGORY_ALLOWLIST, ENQUIRY_SERVICE_OPTIONS } from "@/constants/services";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9][0-9\s()-]{5,20}$/;
const COUNTRY_CODE_RE = /^\+[0-9]{1,4}$/;
const AGE_GROUPS = new Set([
  "Under 18",
  "18–29",
  "30–44",
  "45–59",
  "60+",
  "Prefer not to say",
]);
const COACHING_OPTIONS = new Set([
  "In-person 1:1 coaching",
  "Online coaching",
  "Individualized workout plan",
  "Fitness assessment / consultation",
  "Not sure — I'd like guidance",
]);
const SOURCE_ALLOWLIST = new Set([
  "service-category",
  "homepage",
  "contact-section",
  "transformation",
  "direct",
  "other",
]);

const recentSubmissions = new Map();
const WINDOW_MS = 60_000;

function clean(value, max = 200) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    if (clean(body.website, 100)) {
      return NextResponse.json({ success: true });
    }

    const ip = getClientIp(request);
    const now = Date.now();
    const last = recentSubmissions.get(ip) || 0;
    if (now - last < WINDOW_MS) {
      return NextResponse.json(
        { error: "Please wait a moment before submitting again." },
        { status: 429 }
      );
    }

    const fullName = clean(body.fullName || body.name, 120);
    const email = clean(body.email, 254).toLowerCase();
    const countryCode = clean(body.countryCode, 5);
    const phoneNumber = clean(body.phoneNumber || body.contact, 30);
    const selectedCategory = clean(body.selectedServiceCategory || body.serviceCategory, 80);
    const primaryGoal = clean(body.primaryGoal || body.goals || body.reason, 500);
    const coachingPreference = clean(body.coachingPreference, 80);
    const ageGroup = clean(body.ageGroup, 40);
    const city = clean(body.city, 120);
    const requestedSource = clean(body.source || body.entrySource, 40);

    if (!fullName) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    const hasEmail = !!email;
    const hasPhone = !!phoneNumber;
    if (!hasEmail && !hasPhone) {
      return NextResponse.json(
        { error: "Please provide at least one contact method: email or phone number." },
        { status: 400 }
      );
    }
    if (hasEmail && !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (hasPhone) {
      if (!COUNTRY_CODE_RE.test(countryCode)) {
        return NextResponse.json({ error: "Please select a valid country code." }, { status: 400 });
      }
      if (!PHONE_RE.test(phoneNumber)) {
        return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
      }
    }

    const validCategory = ENQUIRY_CATEGORY_ALLOWLIST.has(selectedCategory)
      ? selectedCategory
      : "not-sure";
    const selectedCategoryLabel =
      ENQUIRY_SERVICE_OPTIONS.find((o) => o.value === validCategory)?.label ||
      "Not Sure Yet — Help Me Choose";

    if (!primaryGoal) {
      return NextResponse.json({ error: "Please tell us what you would like to achieve." }, { status: 400 });
    }
    if (primaryGoal.length > 500) {
      return NextResponse.json({ error: "Primary goal must be 500 characters or fewer." }, { status: 400 });
    }

    const safeCoachingPreference = COACHING_OPTIONS.has(coachingPreference)
      ? coachingPreference
      : "";
    const safeAgeGroup = AGE_GROUPS.has(ageGroup) ? ageGroup : "";
    const safeCity =
      safeCoachingPreference === "In-person 1:1 coaching" ? city : "";
    const safeSource = SOURCE_ALLOWLIST.has(requestedSource) ? requestedSource : "direct";

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || "";
    if (!GOOGLE_SCRIPT_URL) {
      return NextResponse.json(
        { error: "Enquiry service is not configured. Please try again later." },
        { status: 500 }
      );
    }

    const payload = {
      fullName,
      email: hasEmail ? email : "",
      countryCode: hasPhone ? countryCode : "",
      phoneNumber: hasPhone ? phoneNumber : "",
      selectedServiceCategory: validCategory,
      selectedServiceCategoryLabel: selectedCategoryLabel,
      primaryGoal,
      coachingPreference: safeCoachingPreference,
      ageGroup: safeAgeGroup,
      city: safeCity,
      source: safeSource,
      submittedAt: new Date().toISOString(),
      enquiryStatus: "new",
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "We couldn't save your enquiry. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.text();
    recentSubmissions.set(ip, now);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "We couldn't save your enquiry. Please try again." },
      { status: 500 }
    );
  }
}
