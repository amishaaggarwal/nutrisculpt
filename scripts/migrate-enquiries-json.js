#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { neon } = require("@neondatabase/serverless");

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2] || "";
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function safeString(v, max = 2000) {
  if (v == null) return "";
  return String(v).trim().slice(0, max);
}
function normalizeStatus(value) {
  if (value == null) return "new";
  const v = String(value).trim().toLowerCase().replace(/[\s-]+/g, "_");
  const allowed = ["new", "contacted", "consultation_scheduled", "closed"];
  if (allowed.includes(v)) return v;
  if (["consultation", "scheduled", "consultation_booked"].includes(v)) return "consultation_scheduled";
  if (["in_progress", "follow_up", "followed_up", "replied"].includes(v)) return "contacted";
  if (["done", "resolved", "cancelled", "canceled", "lost"].includes(v)) return "closed";
  if (["open", "pending", "received"].includes(v)) return "new";
  return "new";
}
function toIsoOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function toDateOnlyOrNull(v) {
  if (!v) return null;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
function normalize(raw) {
  const submittedAt = raw.submittedAt || raw.submitted_at || raw.createdAt || raw.created_at || raw.date || null;
  const updatedAt = raw.updatedAt || raw.updated_at || submittedAt || new Date().toISOString();
  const id = safeString(raw.id || "", 100) || (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex"));
  return {
    id,
    full_name: safeString(raw.fullName || raw.full_name || raw.name || "", 120),
    email: safeString(raw.email || "", 254).toLowerCase(),
    country_code: safeString(raw.countryCode || raw.country_code || "", 5),
    phone_number: safeString(raw.phoneNumber || raw.phone_number || raw.contact || raw.phone || "", 30),
    selected_service_category: safeString(raw.selectedServiceCategory || raw.selected_service_category || raw.serviceCategory || raw.category || "not-sure", 80) || "not-sure",
    selected_service_category_label: safeString(raw.selectedServiceCategoryLabel || raw.selected_service_category_label || raw.serviceCategoryLabel || "", 120),
    primary_goal: safeString(raw.primaryGoal || raw.primary_goal || raw.goals || raw.reason || raw.message || "", 500),
    primary_goal_category: safeString(raw.primaryGoalCategory || raw.primary_goal_category || "", 40),
    coaching_preference: safeString(raw.coachingPreference || raw.coaching_preference || "", 80),
    age_group: safeString(raw.ageGroup || raw.age_group || "", 40),
    city: safeString(raw.city || "", 120),
    source: safeString(raw.source || raw.entrySource || "direct", 40),
    submitted_at: toIsoOrNull(submittedAt),
    status: normalizeStatus(raw.status || raw.enquiryStatus || raw.enquiry_status),
    admin_notes: safeString(raw.adminNotes || raw.admin_notes || "", 2000),
    next_follow_up_at: toDateOnlyOrNull(raw.nextFollowUpAt || raw.next_follow_up_at),
    contacted_at: toIsoOrNull(raw.contactedAt || raw.contacted_at),
    updated_at: toIsoOrNull(updatedAt) || new Date().toISOString(),
  };
}

async function main() {
  loadEnvLocal();
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const execute = args.has("--execute");
  if (!dryRun && !execute) {
    console.log("Usage: node scripts/migrate-enquiries-json.js --dry-run | --execute");
    console.log("  --dry-run  Validate and report without writing to database.");
    console.log("  --execute  Import records (requires DB schema initialized). Safe to rerun (skips existing IDs).");
    process.exit(1);
  }

  const jsonPath = process.env.ENQUIRIES_DATA_PATH
    ? path.resolve(process.env.ENQUIRIES_DATA_PATH)
    : path.join(process.cwd(), "data", "enquiries.json");

  if (!fs.existsSync(jsonPath)) {
    console.log("No legacy enquiries JSON file found. Nothing to import.");
    process.exit(0);
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch {
    console.error("Legacy enquiries JSON is invalid or unreadable.");
    process.exit(1);
  }
  if (!Array.isArray(parsed)) {
    console.error("Legacy enquiries JSON must be an array.");
    process.exit(1);
  }

  const records = parsed.map(normalize);
  const summary = { total: records.length, imported: 0, skipped_existing: 0, failed: 0 };
  console.log(`Legacy records found: ${records.length}`);

  if (dryRun) {
    console.log("Dry run complete. No database changes made.");
    console.log(JSON.stringify(summary));
    return;
  }

  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_POOLED;
  if (!connectionString) {
    console.error("Missing database connection. Set DATABASE_URL or DATABASE_URL_POOLED.");
    process.exit(1);
  }
  const sql = neon(connectionString);

  for (const r of records) {
    try {
      const existing = await sql`SELECT 1 FROM enquiries WHERE id = ${r.id} LIMIT 1`;
      if (existing && existing.length) {
        summary.skipped_existing += 1;
        continue;
      }
      await sql`
        INSERT INTO enquiries (
          id, full_name, email, country_code, phone_number,
          selected_service_category, selected_service_category_label,
          primary_goal, primary_goal_category, coaching_preference,
          age_group, city, source, submitted_at, status,
          admin_notes, next_follow_up_at, contacted_at, created_at, updated_at
        ) VALUES (
          ${r.id}, ${r.full_name}, ${r.email}, ${r.country_code}, ${r.phone_number},
          ${r.selected_service_category}, ${r.selected_service_category_label},
          ${r.primary_goal}, ${r.primary_goal_category}, ${r.coaching_preference},
          ${r.age_group}, ${r.city}, ${r.source}, ${r.submitted_at}, ${r.status},
          ${r.admin_notes}, ${r.next_follow_up_at}, ${r.contacted_at}, ${r.updated_at}, ${r.updated_at}
        )
      `;
      summary.imported += 1;
    } catch (e) {
      summary.failed += 1;
      // no PII in logs
      console.error(`Failed to import record id=${r.id || "(no-id)"}: ${e && e.message ? e.message : "unknown error"}`);
    }
  }

  console.log("Import complete.");
  console.log(JSON.stringify(summary));
  if (summary.failed > 0) process.exitCode = 2;
}

main().catch((err) => {
  console.error("Migration failed:", err && err.message ? err.message : err);
  process.exit(1);
});
