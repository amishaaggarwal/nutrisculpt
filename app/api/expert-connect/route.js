import { createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { ENQUIRY_CATEGORY_ALLOWLIST, ENQUIRY_SERVICE_OPTIONS, GOAL_ALLOWLIST } from "@/constants/services";
import { createEnquiry } from "@/lib/enquiries";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9][0-9\s()-]{5,20}$/;
const COUNTRY_CODE_RE = /^\+[0-9]{1,4}$/;
const IDEMPOTENCY_KEY_RE = /^[\x21-\x7e]{1,128}$/;
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
  "calculator-bmi",
  "calculator-calories",
  "calculator-macros",
  "calculator-one-rm",
  "calculator-ideal-weight",
  "calculator-water-intake",
  "calculator-heart-rate",
]);

const IP_WINDOW_MS = 5 * 60 * 1000;
const IP_MAX_SUBMISSIONS = 5;
const IP_MAX_TRACKED_CLIENTS = 10_000;
const ipHashKey = randomBytes(32);
const ipSubmissions = new Map();

function clean(value, max = 200) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function getClientIpKey(request) {
  // Set this to a header the ingress always overwrites with one client IP.
  const trustedHeader = process.env.ENQUIRY_TRUSTED_IP_HEADER?.trim();
  const ip = trustedHeader ? request.headers.get(trustedHeader)?.trim() : null;
  if (!ip || !isIP(ip)) return null;
  return createHmac("sha256", ipHashKey).update(ip).digest("hex");
}

function getIpRetryAfterSeconds(ipKey, now) {
  const windowStart = now - IP_WINDOW_MS;
  // Map order follows each client's last counted request.
  for (const [key, entries] of ipSubmissions) {
    if (entries.at(-1) > windowStart) break;
    ipSubmissions.delete(key);
  }

  const entries = ipSubmissions.get(ipKey)?.filter((time) => time > windowStart) ?? [];
  if (entries.length >= IP_MAX_SUBMISSIONS) {
    return Math.ceil((entries[0] + IP_WINDOW_MS - now) / 1000);
  }

  ipSubmissions.delete(ipKey);
  if (ipSubmissions.size === IP_MAX_TRACKED_CLIENTS) {
    ipSubmissions.delete(ipSubmissions.keys().next().value);
  }
  ipSubmissions.set(ipKey, [...entries, now]);
  return 0;
}

function unavailableResponse() {
  return NextResponse.json(
    { error: "Enquiry submissions are temporarily unavailable. Please try again later." },
    { status: 503 },
  );
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    // Honeypot: any value in the hidden website field indicates a bot.
    if (clean(body.website, 100)) {
      return NextResponse.json(
        { error: "We couldn't submit your enquiry. Please try again." },
        { status: 400 }
      );
    }

    const ipKey = getClientIpKey(request);
    const ipRetryAfter = ipKey ? getIpRetryAfterSeconds(ipKey, performance.now()) : 0;
    if (ipRetryAfter) {
      return NextResponse.json(
        { error: "Please wait a moment before submitting again." },
        {
          status: 429,
          headers: { "Retry-After": String(ipRetryAfter) },
        },
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
    const rawGoalCategory = clean(body.primaryGoalCategory, 40);
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";

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
    const selectedServiceCategoryLabel =
      ENQUIRY_SERVICE_OPTIONS.find((o) => o.value === validCategory)?.label ||
      "Not Sure Yet — Help Me Choose";

    if (!primaryGoal) {
      return NextResponse.json({ error: "Please tell us what you would like to achieve." }, { status: 400 });
    }
    if (primaryGoal.length > 500) {
      return NextResponse.json({ error: "Primary goal must be 500 characters or fewer." }, { status: 400 });
    }
    if (!IDEMPOTENCY_KEY_RE.test(idempotencyKey)) {
      return NextResponse.json({ error: "A valid submission key is required." }, { status: 400 });
    }

    const safeCoachingPreference = COACHING_OPTIONS.has(coachingPreference)
      ? coachingPreference
      : "";
    const safeAgeGroup = AGE_GROUPS.has(ageGroup) ? ageGroup : "";
    const safeCity =
      safeCoachingPreference === "In-person 1:1 coaching" ? city : "";
    const safeSource = SOURCE_ALLOWLIST.has(requestedSource) ? requestedSource : "direct";
    const validGoalCategory = GOAL_ALLOWLIST.has(rawGoalCategory) ? rawGoalCategory : "";

    const submittedAt = new Date().toISOString();
    const payload = {
      fullName,
      email: hasEmail ? email : "",
      countryCode: hasPhone ? countryCode : "",
      phoneNumber: hasPhone ? phoneNumber : "",
      selectedServiceCategory: validCategory,
      selectedServiceCategoryLabel,
      primaryGoal,
      primaryGoalCategory: validGoalCategory,
      coachingPreference: safeCoachingPreference,
      ageGroup: safeAgeGroup,
      city: safeCity,
      source: safeSource,
      submittedAt,
      status: "new",
    };

    const fingerprintSecret = process.env.ENQUIRY_FINGERPRINT_SECRET || process.env.ADMIN_SESSION_SECRET;
    if (!fingerprintSecret) return unavailableResponse();

    let created;
    try {
      created = await createEnquiry(payload, {
        idempotencyKey,
        fingerprintSecret,
      });
    } catch (err) {
      // Idempotency conflict: same key, different payload → 409.
      if (err.code === "IDEMPOTENCY_CONFLICT") {
        return NextResponse.json(
          { error: "An enquiry from this form was saved with different details. Submit again if you want to send a separate enquiry." },
          { status: 409 },
        );
      }
      // Rapid duplicate: identical enquiry within the window → 429.
      if (err.code === "DUPLICATE_ENQUIRY") {
        return NextResponse.json(
          { error: "A similar enquiry was recently submitted. Please wait before sending again." },
          {
            status: 429,
            headers: { "Retry-After": String(err.retryAfterSeconds) },
          },
        );
      }
      if (err.code === "ENQUIRY_PROTECTION_UNAVAILABLE" || err.code === "DB_CONFIG_MISSING") {
        return unavailableResponse();
      }
      return NextResponse.json(
        { error: "We couldn't save your enquiry. Please try again." },
        { status: 500 },
      );
    }

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || "";
    let data = "";
    if (GOOGLE_SCRIPT_URL && !created.replayed) {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            enquiryStatus: "new",
          }),
        });
        if (response.ok) {
          data = await response.text();
        }
      } catch {
        // Local enquiry is the source of truth for the admin dashboard.
      }
    }

    return NextResponse.json({ success: true, data, id: created.id });
  } catch {
    return NextResponse.json(
      { error: "We couldn't save your enquiry. Please try again." },
      { status: 500 }
    );
  }
}
