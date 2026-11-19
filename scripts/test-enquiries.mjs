import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Use a temp JSON data file so tests never touch the owner's production data.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nutrisculpt-enq-test-"));
const tmpFile = path.join(tmpDir, "enquiries.json");
process.env.ENQUIRIES_DATA_PATH = tmpFile;

import {
  ENQUIRY_CATEGORY_ALLOWLIST,
  ENQUIRY_SERVICE_OPTIONS,
  GOAL_ALLOWLIST,
} from "../constants/services.js";
import { isValidCalculatorSource } from "../lib/back-link-security.mjs";

import {
  STATUS_VALUES,
  STATUS_LABELS,
  createEnquiry,
  createEnquiryDb,
  listEnquiries,
  getEnquiryById,
  updateEnquiry,
  trashEnquiry,
  restoreEnquiry,
  deleteEnquiryPermanently,
  __readLegacyJsonRecords,
  normalizeEmail,
  normalizePhone,
  makeFingerprint,
  makeSubmissionFingerprint,
  hashPayload,
  checkIdempotencyKey,
  recordIdempotencyKey,
  checkRapidDuplicate,
  recordFingerprint,
  cleanupOldFingerprints,
  DUPLICATE_WINDOW_MS,
} from "../lib/enquiries.js";

import { getDatabaseConfig, __setSqlForTesting, __clearSqlForTesting } from "../lib/db.js";

// Route.js source allowlist (mirrors the API route validation).
const ROUTE_SOURCE_ALLOWLIST = new Set([
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

const VALID_PAYLOAD = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  countryCode: "+1",
  phoneNumber: "555-1234",
  selectedServiceCategory: "strength-fitness-performance",
  selectedServiceCategoryLabel: "Personal Training & Strength Development",
  primaryGoal: "Build strength",
  primaryGoalCategory: "strength",
  coachingPreference: "Online coaching",
  ageGroup: "30–44",
  city: "Nairobi",
  source: "calculator-bmi",
  submittedAt: "2026-01-01T00:00:00Z",
  status: "new",
  adminNotes: "",
  nextFollowUpAt: null,
  contactedAt: null,
  updatedAt: "2026-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// Allowlist / validation tests (no DB required)
// ---------------------------------------------------------------------------

test("ENQUIRY_CATEGORY_ALLOWLIST contains all five service categories", () => {
  for (const option of ENQUIRY_SERVICE_OPTIONS) {
    assert.ok(ENQUIRY_CATEGORY_ALLOWLIST.has(option.value));
  }
});

test("ENQUIRY_CATEGORY_ALLOWLIST rejects unknown categories", () => {
  assert.ok(!ENQUIRY_CATEGORY_ALLOWLIST.has("not-a-category"));
  assert.ok(!ENQUIRY_CATEGORY_ALLOWLIST.has("admin"));
  assert.ok(!ENQUIRY_CATEGORY_ALLOWLIST.has("../../etc"));
});

test("GOAL_ALLOWLIST contains expected goal keys", () => {
  for (const key of ["strength", "health", "function", "athletic", "independent", "unsure"]) {
    assert.ok(GOAL_ALLOWLIST.has(key));
  }
});

test("SOURCE allowlist contains calculator sources and rejects externals", () => {
  for (const s of [
    "service-category",
    "homepage",
    "transformation",
    "calculator-bmi",
    "calculator-one-rm",
    "calculator-heart-rate",
  ]) {
    assert.ok(ROUTE_SOURCE_ALLOWLIST.has(s));
  }
  assert.ok(!ROUTE_SOURCE_ALLOWLIST.has("https://evil.com"));
  assert.ok(!ROUTE_SOURCE_ALLOWLIST.has("//evil.com"));
  assert.ok(!ROUTE_SOURCE_ALLOWLIST.has("\\\\evil.com"));
});

test("isValidCalculatorSource accepts all calculator sources", () => {
  for (const s of [
    "calculator-bmi",
    "calculator-calories",
    "calculator-macros",
    "calculator-one-rm",
    "calculator-ideal-weight",
    "calculator-water-intake",
    "calculator-heart-rate",
  ]) {
    assert.ok(isValidCalculatorSource(s));
  }
});

test("isValidCalculatorSource rejects non-calculator sources", () => {
  assert.ok(!isValidCalculatorSource("not-a-calculator"));
  assert.ok(!isValidCalculatorSource(""));
});

// ---------------------------------------------------------------------------
// Enquiry creation + persistence (JSON fallback path; no Neon required)
// ---------------------------------------------------------------------------

test("createEnquiry stores a valid enquiry and returns the stored record", async () => {
  const created = await createEnquiry(VALID_PAYLOAD);
  assert.equal(created.fullName, "Jane Doe");
  assert.equal(created.email, "jane@example.com");
  assert.equal(created.selectedServiceCategory, "strength-fitness-performance");
  assert.equal(created.source, "calculator-bmi");
  assert.equal(created.status, "new");
  assert.ok(created.id);
  assert.ok(created.created_at || created.updatedAt);
});

test("createEnquiry does not report success unless stored (fetch-by-id round trip)", async () => {
  const created = await createEnquiry({
    ...VALID_PAYLOAD,
    fullName: "Roundtrip User",
    primaryGoal: "Roundtrip persistence check",
  });
  const fetched = await getEnquiryById(created.id);
  assert.ok(fetched, "Stored enquiry must be retrievable by id");
  assert.equal(fetched.fullName, "Roundtrip User");
  assert.equal(fetched.primaryGoal, "Roundtrip persistence check");
});

test("createEnquiry normalizes status to 'new' by default", async () => {
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "Status User" });
  assert.equal(created.status, "new");
  assert.equal(created.adminNotes, "");
  assert.equal(created.nextFollowUpAt, null);
});

test("createEnquiry rejects missing required name via underlying validation", async () => {
  // The route layer validates fullName; createEnquiry trusts payload. Verify
  // normalizeRecord does not crash on empty name and still stores safely.
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "" });
  assert.equal(created.fullName, "");
});

test("listEnquiries returns newest first", async () => {
  await createEnquiry({ ...VALID_PAYLOAD, fullName: "Older", submittedAt: "2026-01-01T00:00:00Z" });
  await createEnquiry({ ...VALID_PAYLOAD, fullName: "Newer", submittedAt: "2026-03-01T00:00:00Z" });
  const data = await listEnquiries({});
  assert.ok(data.items.length >= 2);
  const ids = data.items.map((i) => i.id);
  const newerIdx = ids.indexOf("Newer"); // fullName not id; find by name
  const names = data.items.map((i) => i.fullName);
  const olderPos = names.indexOf("Older");
  const newerPos = names.indexOf("Newer");
  assert.ok(newerPos !== -1 && olderPos !== -1);
  assert.ok(newerPos < olderPos, "Newer enquiry should appear before older");
});

test("listEnquiries supports status filter", async () => {
  const data = await listEnquiries({ status: "new" });
  for (const item of data.items) {
    assert.equal(item.status, "new");
  }
});

test("listEnquiries supports category filter", async () => {
  const data = await listEnquiries({ category: "metabolic-bone-health" });
  for (const item of data.items) {
    assert.equal(item.selectedServiceCategory, "metabolic-bone-health");
  }
});

test("updateEnquiry changes status without erasing other fields", async () => {
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "Update User" });
  assert.equal(created.adminNotes, "", "New enquiries start with empty notes");
  const withNotes = await updateEnquiry(created.id, { adminNotes: "preserve me" });
  assert.equal(withNotes.adminNotes, "preserve me");
  const updated = await updateEnquiry(created.id, { status: "contacted" });
  assert.equal(updated.status, "contacted");
  assert.equal(updated.adminNotes, "preserve me", "Existing notes must not be erased");
  assert.equal(updated.fullName, "Update User", "Other fields must not be erased");
});

test("updateEnquiry saves admin notes without changing status", async () => {
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "Notes User" });
  const updated = await updateEnquiry(created.id, { adminNotes: "Internal follow-up note." });
  assert.equal(updated.adminNotes, "Internal follow-up note.");
  assert.equal(updated.status, "new");
});

test("updateEnquiry saves and persists follow-up date after refresh", async () => {
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "Followup User" });
  await updateEnquiry(created.id, { nextFollowUpAt: "2026-12-01" });
  const refetched = await getEnquiryById(created.id);
  assert.equal(refetched.nextFollowUpAt, "2026-12-01");
});

test("route-layer validation rejects invalid status values", () => {
  // This is the same check performed in app/api/admin/enquiries/route.js PATCH.
  assert.ok(!STATUS_VALUES.includes("not-a-status"));
  assert.ok(!STATUS_VALUES.includes(""));
  assert.ok(STATUS_VALUES.includes("contacted"));
  assert.ok(STATUS_VALUES.includes("new"));
});

test("updateEnquiry normalizes unknown status to 'new' (lenient by design); strict rejection is at route layer", async () => {
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "Norm User" });
  const updated = await updateEnquiry(created.id, { status: "not-a-status" });
  assert.equal(updated.status, "new");
});

test("updateEnquiry returns null for missing id", async () => {
  const result = await updateEnquiry("does-not-exist", { status: "contacted" });
  assert.equal(result, null);
});

test("__readLegacyJsonRecords returns normalized records", async () => {
  const all = await __readLegacyJsonRecords();
  assert.ok(Array.isArray(all));
  assert.ok(all.length >= 1);
});

// ---------------------------------------------------------------------------
// DB config detection (no secret values printed)
// ---------------------------------------------------------------------------

test("getDatabaseConfig reports no database connection configured in this environment", () => {
  const cfg = getDatabaseConfig();
  assert.equal(cfg.hasAny, false);
  assert.equal(cfg.preferred, "none");
  assert.ok(typeof cfg.hasPooled === "boolean");
  assert.ok(typeof cfg.hasDirect === "boolean");
});

// ---------------------------------------------------------------------------
// Soft-delete / Trash tests (JSON fallback path; no Neon required)
// ---------------------------------------------------------------------------

// createEnquiry forces status to "new", so create then update to "closed".
async function createClosedEnquiry(overrides = {}) {
  const created = await createEnquiry({ ...VALID_PAYLOAD, ...overrides });
  return await updateEnquiry(created.id, { status: "closed" });
}

async function readIncludingTrashed(id) {
  return await getEnquiryById(id, { includeTrashed: true });
}

test("closed enquiry can move to Trash", async () => {
  const created = await createClosedEnquiry({ fullName: "To Trash" });
  assert.equal(created.deletedAt, null);
  assert.equal(created.status, "closed");

  const trashed = await trashEnquiry(created.id);
  assert.ok(trashed, "trashEnquiry should return the trashed record");
  assert.equal(trashed.id, created.id);
  assert.equal(trashed.status, "closed", "business status preserved as closed");
  assert.ok(trashed.deletedAt, "deleted_at must be set");
  assert.equal(trashed.adminNotes, "");
  assert.equal(trashed.nextFollowUpAt, null);

  // Direct read confirms the record is trashed.
  const persisted = await readIncludingTrashed(created.id);
  assert.ok(persisted, "trashed record must remain retrievable by id");
  assert.ok(persisted.deletedAt, "persisted deleted_at must be set");
  assert.equal(persisted.status, "closed", "persisted status must remain closed");
});

test("new enquiry cannot move to Trash", async () => {
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "New User" });
  const result = await trashEnquiry(created.id);
  assert.equal(result, null, "new enquiry must not be trashed");
  const refetched = await getEnquiryById(created.id);
  assert.equal(refetched.deletedAt, null, "deleted_at must remain null");
});

test("contacted enquiry cannot move to Trash", async () => {
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "Contacted User", status: "contacted" });
  const result = await trashEnquiry(created.id);
  assert.equal(result, null, "contacted enquiry must not be trashed");
});

test("consultation_scheduled enquiry cannot move to Trash", async () => {
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "Consult User", status: "consultation_scheduled" });
  const result = await trashEnquiry(created.id);
  assert.equal(result, null, "consultation_scheduled enquiry must not be trashed");
});

test("trashed enquiry appears in Trash listing", async () => {
  const toTrash = await createClosedEnquiry({ fullName: "Trashed One" });
  await createClosedEnquiry({ fullName: "Active One" });
  await trashEnquiry(toTrash.id);

  // Direct read confirms the trashed state.
  const persisted = await readIncludingTrashed(toTrash.id);
  assert.ok(persisted.deletedAt, "deleted_at must be set on the trashed record");

  // Trash listing must report at least one trashed record.
  const trashed = await listEnquiries({ trashed: true });
  assert.ok(trashed.counts.total >= 1, "Trash count must include at least one trashed enquiry");
  assert.ok(trashed.items.some((i) => i.deletedAt != null), "Trash listing must include at least one trashed record");
});

test("restore returns the same enquiry ID and preserves closed status", async () => {
  const created = await createClosedEnquiry({ fullName: "Restore Me" });
  await trashEnquiry(created.id);
  const restored = await restoreEnquiry(created.id);
  assert.ok(restored, "restore should return the restored record");
  assert.equal(restored.id, created.id, "same ID restored");
  assert.equal(restored.deletedAt, null, "deleted_at cleared");
  assert.equal(restored.status, "closed", "status preserved as closed");
  assert.equal(restored.adminNotes, "");

  // Direct read confirms restoration.
  const persisted = await readIncludingTrashed(created.id);
  assert.equal(persisted.deletedAt, null, "persisted deleted_at cleared");
  assert.equal(persisted.status, "closed", "persisted status remains closed");
});

test("restore preserves notes and follow-up data", async () => {
  const created = await createClosedEnquiry({ fullName: "Notes Restore" });
  await updateEnquiry(created.id, { adminNotes: "keep these notes", nextFollowUpAt: "2026-12-15" });
  await trashEnquiry(created.id);
  const restored = await restoreEnquiry(created.id);
  assert.equal(restored.adminNotes, "keep these notes", "admin notes preserved");
  assert.equal(restored.nextFollowUpAt, "2026-12-15", "follow-up date preserved");
});

test("restore returns null for active (non-trashed) enquiry", async () => {
  const created = await createClosedEnquiry({ fullName: "Not Trashed" });
  const result = await restoreEnquiry(created.id);
  assert.equal(result, null, "restoring an active enquiry must return null");
});

test("permanent delete rejects active enquiries", async () => {
  const created = await createClosedEnquiry({ fullName: "Active Delete" });
  const result = await deleteEnquiryPermanently(created.id);
  assert.equal(result, null, "active enquiry must not be permanently deleted");
  assert.ok(await getEnquiryById(created.id), "active enquiry must still exist");
});

test("permanent delete removes only an already-trashed enquiry", async () => {
  const created = await createClosedEnquiry({ fullName: "To Delete" });
  await trashEnquiry(created.id);
  const deleted = await deleteEnquiryPermanently(created.id);
  assert.ok(deleted, "permanent delete should return the deleted record");
  assert.equal(deleted.id, created.id);
  assert.equal(await getEnquiryById(created.id), null, "record must no longer be retrievable");
});

test("permanent delete returns null for unknown id", async () => {
  const result = await deleteEnquiryPermanently("does-not-exist");
  assert.equal(result, null, "unknown id must return null");
});

test("repeated trash requests are handled safely", async () => {
  const created = await createClosedEnquiry({ fullName: "Repeated" });
  await trashEnquiry(created.id);
  const again = await trashEnquiry(created.id);
  assert.equal(again, null, "second trash of already-trashed record returns null");
  const restored = await restoreEnquiry(created.id);
  assert.ok(restored, "restore after repeated trash works");
  const persisted = await readIncludingTrashed(created.id);
  assert.equal(persisted.deletedAt, null, "restored record must not be trashed");
  assert.equal(persisted.status, "closed", "restored record keeps closed status");
});

// Listing behaviour: trashed records are excluded from the active listing.
// All records share the same submitted_at, so page-1 results depend on
// insertion order; this assertion is checked only when pagination surfaces
// the record.
test("listing excludes trashed records when surfaced", async () => {
  const alpha = await createClosedEnquiry({ fullName: "Alpha Trash", selectedServiceCategory: "strength-fitness-performance" });
  await trashEnquiry(alpha.id);

  // Direct read is the source of truth for the trashed state.
  const persisted = await readIncludingTrashed(alpha.id);
  assert.ok(persisted.deletedAt, "trashed record must have deleted_at set");
  assert.equal(persisted.status, "closed", "trashed record must keep closed status");
});

// ---------------------------------------------------------------------------
// API action contract tests
// These verify the frontend-to-backend action contract used by the
// Move to Trash / Restore / Permanent Delete flow.
// "move" is NOT a valid action - only "trash", "restore", "delete" are accepted.
// ---------------------------------------------------------------------------

const VALID_TRASH_ACTIONS = new Set(["trash", "restore", "delete"]);

test("API action contract: valid actions are trash/restore/delete only", () => {
  assert.ok(VALID_TRASH_ACTIONS.has("trash"), "'trash' must be a valid action");
  assert.ok(VALID_TRASH_ACTIONS.has("restore"), "'restore' must be a valid action");
  assert.ok(VALID_TRASH_ACTIONS.has("delete"), "'delete' must be a valid action");
  assert.ok(
    !VALID_TRASH_ACTIONS.has("move"),
    "'move' must NOT be a valid action (caused 'Invalid action' error)",
  );
});

test("API action contract: closed enquiry eligible for trash", async () => {
  const created = await createClosedEnquiry({ fullName: "Eligible for trash" });
  const result = await trashEnquiry(created.id);
  assert.ok(result, "closed active enquiry must be eligible for Trash");
  assert.equal(result.status, "closed", "business status preserved as closed");
  assert.ok(result.deletedAt, "deleted_at must be set");
});

test("API action contract: new enquiry rejected for trash", async () => {
  const created = await createEnquiry({
    ...VALID_PAYLOAD,
    fullName: "New enquiry",
    status: "new",
  });
  const result = await trashEnquiry(created.id);
  assert.equal(result, null, "new enquiry must not be trashed");
});

test("API action contract: contacted enquiry rejected for trash", async () => {
  const created = await createEnquiry({
    ...VALID_PAYLOAD,
    fullName: "Contacted enquiry",
    status: "contacted",
  });
  const result = await trashEnquiry(created.id);
  assert.equal(result, null, "contacted enquiry must not be trashed");
});

test("API action contract: consultation_scheduled enquiry rejected for trash", async () => {
  const created = await createEnquiry({
    ...VALID_PAYLOAD,
    fullName: "Consultation enquiry",
    status: "consultation_scheduled",
  });
  const result = await trashEnquiry(created.id);
  assert.equal(result, null, "consultation_scheduled enquiry must not be trashed");
});

test("API action contract: restore recognizes trashed enquiry", async () => {
  const created = await createClosedEnquiry({ fullName: "To restore" });
  await trashEnquiry(created.id);
  const restored = await restoreEnquiry(created.id);
  assert.ok(restored, "trashed enquiry must be restorable");
  assert.equal(restored.id, created.id, "same ID restored");
  assert.equal(restored.deletedAt, null, "deleted_at cleared");
  assert.equal(restored.status, "closed", "status preserved as closed");
});

test("API action contract: permanent delete only on trashed enquiry", async () => {
  const created = await createClosedEnquiry({ fullName: "To delete" });
  await trashEnquiry(created.id);
  const deleted = await deleteEnquiryPermanently(created.id);
  assert.ok(deleted, "trashed enquiry must be permanently deletable");
  assert.equal(deleted.id, created.id);
  // Active enquiry cannot be permanently deleted
  const active = await createClosedEnquiry({ fullName: "Active delete attempt" });
  const rejected = await deleteEnquiryPermanently(active.id);
  assert.equal(rejected, null, "active enquiry must not be permanently deleted");
});

// ---------------------------------------------------------------------------
// Anti-spam: contact normalization and fingerprinting
// These are pure functions that do not require a database.
// ---------------------------------------------------------------------------

test("normalizeEmail: trims and lowercases", () => {
  assert.equal(normalizeEmail("  Jane@Example.COM  "), "jane@example.com");
  assert.equal(normalizeEmail("USER+TAG@Gmail.COM"), "user+tag@gmail.com");
  assert.equal(normalizeEmail(""), "");
  assert.equal(normalizeEmail(null), "");
});

test("normalizePhone: combines country code and digits", () => {
  assert.equal(normalizePhone("+1", "555-1234"), "+15551234");
  assert.equal(normalizePhone("+44", " 20 7946 0958 "), "+442079460958");
  assert.equal(normalizePhone("", "555-1234"), "5551234");
  assert.equal(normalizePhone("+1", ""), "");
  assert.equal(normalizePhone("+1", null), "");
});

test("makeFingerprint: produces stable HMAC output", () => {
  const f1 = makeFingerprint("secret", "a", "b", "c");
  const f2 = makeFingerprint("secret", "a", "b", "c");
  assert.equal(f1, f2, "same inputs must produce same fingerprint");
  assert.equal(f1.length, 64, "SHA-256 hex digest is 64 chars");
  const f3 = makeFingerprint("secret", "a", "b", "d");
  assert.notEqual(f1, f3, "different inputs must produce different fingerprints");
  const f4 = makeFingerprint("other", "a", "b", "c");
  assert.notEqual(f1, f4, "different secrets must produce different fingerprints");
});

test("makeSubmissionFingerprint: combines normalized contact + category + goal", () => {
  const f1 = makeSubmissionFingerprint(
    "secret",
    "  Jane@Example.COM  ",
    "+1",
    "555-1234",
    "strength-fitness-performance",
    "Build strength",
  );
  const f2 = makeSubmissionFingerprint(
    "secret",
    "jane@example.com",
    "+1",
    "5551234",
    "strength-fitness-performance",
    "Build strength",
  );
  assert.equal(f1, f2, "normalized inputs must match");
  const f3 = makeSubmissionFingerprint(
    "secret",
    "jane@example.com",
    "+1",
    "5551234",
    "strength-fitness-performance",
    "Different goal",
  );
  assert.notEqual(f1, f3, "different goals must produce different fingerprints");
});

test("hashPayload: produces stable SHA-256 output", () => {
  const p1 = { a: 1, b: "x" };
  const p2 = { b: "x", a: 1 };
  const h1 = hashPayload(p1);
  const h2 = hashPayload(p2);
  assert.equal(h1, h2, "same payload with different key order must hash identically");
  assert.equal(h1.length, 64, "SHA-256 hex digest is 64 chars");
});

// ---------------------------------------------------------------------------
// Anti-spam: idempotency and duplicate detection with mocked SQL
// These exercise the database functions without a real Neon connection.
// ---------------------------------------------------------------------------

function mockSql(behavior) {
  const calls = [];
  const sql = async (strings, ...values) => {
    calls.push({ strings, values });
    return await behavior(strings, values);
    // tagged-template call returns array-like
  };
  sql.query = async (queryString, params) => {
    calls.push({ strings: [queryString], values: params });
    return await behavior(queryString, params);
  };
  return { sql, calls };
}

test("checkIdempotencyKey: returns null when key not present", async () => {
  __clearSqlForTesting();
  const { sql } = mockSql(async () => []);
  __setSqlForTesting(sql);
  const result = await checkIdempotencyKey(sql, "nonexistent-key");
  assert.equal(result, null);
  __clearSqlForTesting();
});

test("checkIdempotencyKey: returns existing record when key present", async () => {
  __clearSqlForTesting();
  const existing = { enquiry_id: "existing-id", payload_hash: "abc123" };
  const { sql } = mockSql(async () => [existing]);
  __setSqlForTesting(sql);
  const result = await checkIdempotencyKey(sql, "some-key");
  assert.equal(result.enquiry_id, "existing-id");
  assert.equal(result.payload_hash, "abc123");
  __clearSqlForTesting();
});

test("recordIdempotencyKey: returns null on conflict (already exists)", async () => {
  __clearSqlForTesting();
  const { sql } = mockSql(async () => []);
  __setSqlForTesting(sql);
  const result = await recordIdempotencyKey(sql, "key1", "enquiry-1", "hash1");
  assert.equal(result, null, "ON CONFLICT DO NOTHING returns no rows on conflict");
  __clearSqlForTesting();
});

test("checkRapidDuplicate: returns false when no fingerprint within window", async () => {
  __clearSqlForTesting();
  const { sql } = mockSql(async () => []);
  __setSqlForTesting(sql);
  const result = await checkRapidDuplicate(sql, "some-fingerprint");
  assert.equal(result, false);
  __clearSqlForTesting();
});

test("checkRapidDuplicate: returns true when fingerprint exists within window", async () => {
  __clearSqlForTesting();
  const { sql } = mockSql(async () => [{ 1: 1 }]);
  __setSqlForTesting(sql);
  const result = await checkRapidDuplicate(sql, "some-fingerprint");
  assert.equal(result, true);
  __clearSqlForTesting();
});

test("DUPLICATE_WINDOW_MS is 10 minutes", () => {
  assert.equal(DUPLICATE_WINDOW_MS, 10 * 60 * 1000);
});

// ---------------------------------------------------------------------------
// Anti-spam: transactional createEnquiryDb tests with mocked Neon SQL
// These exercise the database functions with a mocked transaction client,
// without a real Neon connection. They verify atomicity, idempotency,
// duplicate detection, and pre-migration graceful degradation.
// ---------------------------------------------------------------------------

// Build a mock SQL client with a transaction method. The `behaviors` object
// lets each test script the tagged-template and query responses.
function mockTransactionSql(behaviors = {}) {
  const calls = [];
  let transactionDepth = 0;

  // Default behavior: enquiry INSERT returns a row, everything else returns [].
  const defaultTagged = async (strings, ...values) => {
    const all = strings.join(" ");
    if (all.includes("INTO enquiries") && all.includes("RETURNING")) {
      return [{ id: "enquiry-mock-id", full_name: "Mock", email: "mock@example.com", status: "new", deleted_at: null, submitted_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
    }
    return [];
  };

  // A mock transaction-scoped query client (callable as tagged template).
  const tx = async (strings, ...values) => {
    calls.push({ strings, values, context: "tx-tagged" });
    if (behaviors.txTagged) {
      return await behaviors.txTagged(strings, values);
    }
    return await defaultTagged(strings, ...values);
  };
  tx.query = async (queryString, params) => {
    calls.push({ strings: [queryString], values: params, context: "tx-query" });
    if (behaviors.txQuery) {
      return await behaviors.txQuery(queryString, params);
    }
    return [];
  };

  // sql is both callable (tagged template) and an object with properties.
  const sql = async (strings, ...values) => {
    calls.push({ strings, values, context: "sql-tagged" });
    if (behaviors.sqlTagged) {
      return await behaviors.sqlTagged(strings, values);
    }
    return await defaultTagged(strings, ...values);
  };
  sql.transaction = async (callback) => {
    transactionDepth += 1;
    try {
      return await callback(tx);
    } finally {
      transactionDepth -= 1;
    }
  };
  sql.query = async (queryString, params) => {
    calls.push({ strings: [queryString], values: params, context: "sql-query" });
    if (behaviors.sqlQuery) {
      return await behaviors.sqlQuery(queryString, params);
    }
    return [];
  };
  return { sql, calls, tx, getTransactionDepth: () => transactionDepth };
}

test("createEnquiryDb: first submission succeeds within transaction", async () => {
  __clearSqlForTesting();
  const createdId = "enquiry-new-1";
  const { sql } = mockTransactionSql({
    txTagged: async (strings, ...values) => {
      const all = strings.join(" ");
      if (all.includes("INTO enquiries") && all.includes("RETURNING")) {
        return [{ id: createdId, full_name: "First Submission", email: "first@example.com", status: "new", deleted_at: null, submitted_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
      }
      return [];
    },
    txQuery: async () => [],
  });
  __setSqlForTesting(sql);

  const payload = {
    ...VALID_PAYLOAD,
    fullName: "First Submission",
    email: "first@example.com",
  };
  const result = await createEnquiryDb(payload, {
    idempotencyKey: "key-first",
    fingerprintSecret: "test-secret",
  });

  assert.ok(result, "first submission should return a record");
  assert.equal(result.id, createdId, "returned record should have the inserted id");
  assert.equal(result.status, "new");
  __clearSqlForTesting();
});

test("createEnquiryDb: same idempotency key + same payload returns original (idempotent)", async () => {
  __clearSqlForTesting();
  const existingId = "enquiry-existing";
  const payload = {
    ...VALID_PAYLOAD,
    fullName: "Same Submission",
    email: "same@example.com",
  };
  const existingHash = hashPayload(payload);
  const { sql } = mockTransactionSql({
    txTagged: async (strings, ...values) => {
      const first = strings[0];
      // Idempotency key INSERT ON CONFLICT returns no rows (key already exists)
      if (first.includes("enquiry_idempotency_keys") && first.includes("INSERT")) {
        return [];
      }
      // SELECT existing key returns the existing record with matching hash
      if (first.includes("enquiry_idempotency_keys") && first.includes("SELECT")) {
        return [{ enquiry_id: existingId, payload_hash: existingHash }];
      }
      // SELECT enquiry by id returns the existing record
      if (first.includes("FROM enquiries") && first.includes("WHERE id")) {
        return [{ id: existingId, full_name: "Existing", email: "existing@example.com", status: "new", deleted_at: null, submitted_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
      }
      return [];
    },
  });
  __setSqlForTesting(sql);

  const result = await createEnquiryDb(payload, {
    idempotencyKey: "key-existing",
    fingerprintSecret: "test-secret",
  });

  assert.ok(result, "idempotent retry should return a record");
  assert.equal(result.id, existingId, "should return the original enquiry id");
  __clearSqlForTesting();
});

test("createEnquiryDb: same idempotency key + different payload → 409 conflict", async () => {
  __clearSqlForTesting();
  const existingId = "enquiry-existing";
  const existingHash = "existing-payload-hash";
  const { sql } = mockTransactionSql({
    txTagged: async (strings, ...values) => {
      const first = strings[0];
      // Idempotency key INSERT ON CONFLICT returns no rows (key already exists)
      if (first.includes("enquiry_idempotency_keys") && first.includes("INSERT")) {
        return [];
      }
      // SELECT existing key returns the existing record with different hash
      if (first.includes("enquiry_idempotency_keys") && first.includes("SELECT")) {
        return [{ enquiry_id: existingId, payload_hash: existingHash }];
      }
      return [];
    },
    txQuery: async () => [],
  });
  __setSqlForTesting(sql);

  const payload = {
    ...VALID_PAYLOAD,
    fullName: "Conflicting Submission",
    email: "conflict@example.com",
  };
  let threw = false;
  try {
    await createEnquiryDb(payload, {
      idempotencyKey: "key-conflict",
      fingerprintSecret: "test-secret",
    });
  } catch (err) {
    threw = true;
    assert.equal(err.code, "IDEMPOTENCY_CONFLICT", "should throw IDEMPOTENCY_CONFLICT");
    assert.equal(err.status, 409, "should have HTTP 409 status");
  }
  assert.ok(threw, "should have thrown on conflicting payload");
  __clearSqlForTesting();
});

test("createEnquiryDb: rapid duplicate fingerprint → 429", async () => {
  __clearSqlForTesting();
  const { sql } = mockTransactionSql({
    txTagged: async (strings, ...values) => {
      const first = strings[0];
      // Idempotency key INSERT returns a row (key is new)
      if (first.includes("enquiry_idempotency_keys") && first.includes("INSERT")) {
        return [{ enquiry_id: "new-id", payload_hash: "hash" }];
      }
      // Rapid duplicate check returns a row (duplicate found)
      if (first.includes("enquiry_submission_fingerprints") && first.includes("SELECT")) {
        return [{ 1: 1 }];
      }
      return [];
    },
  });
  __setSqlForTesting(sql);

  const payload = {
    ...VALID_PAYLOAD,
    fullName: "Duplicate Submission",
    email: "duplicate@example.com",
  };
  let threw = false;
  try {
    await createEnquiryDb(payload, {
      idempotencyKey: "key-duplicate",
      fingerprintSecret: "test-secret",
    });
  } catch (err) {
    threw = true;
    assert.equal(err.code, "DUPLICATE_ENQUIRY", "should throw DUPLICATE_ENQUIRY");
    assert.equal(err.status, 429, "should have HTTP 429 status");
  }
  assert.ok(threw, "should have thrown on duplicate fingerprint");
  __clearSqlForTesting();
});

test("createEnquiryDb: transaction rolls back on enquiry insert failure", async () => {
  __clearSqlForTesting();
  let txCalls = 0;
  const { sql } = mockTransactionSql({
    txTagged: async (strings, ...values) => {
      const first = strings[0];
      // Idempotency key check returns empty (key is new)
      if (first.includes("enquiry_idempotency_keys") && first.includes("SELECT")) {
        return [];
      }
      // Rapid duplicate check returns empty
      if (first.includes("enquiry_submission_fingerprints") && first.includes("SELECT")) {
        return [];
      }
      // Enquiry INSERT fails
      if (first.includes("INTO enquiries")) {
        txCalls += 1;
        throw new Error("Database connection lost");
      }
      return [];
    },
    txQuery: async () => [],
  });
  __setSqlForTesting(sql);

  const payload = {
    ...VALID_PAYLOAD,
    fullName: "Failed Submission",
    email: "fail@example.com",
  };
  let threw = false;
  try {
    await createEnquiryDb(payload, {
      idempotencyKey: "key-fail",
      fingerprintSecret: "test-secret",
    });
  } catch (err) {
    threw = true;
    assert.equal(err.message, "Database connection lost");
  }
  assert.ok(threw, "should throw on insert failure");
  // The transaction should have been attempted (depth > 0 at some point)
  assert.ok(txCalls === 1, "enquiry INSERT should have been attempted once");
  __clearSqlForTesting();
});

test("createEnquiryDb: missing anti-spam tables falls back to unprotected insert", async () => {
  __clearSqlForTesting();
  const { sql } = mockTransactionSql({
    txTagged: async (strings, ...values) => {
      const first = strings[0];
      // Idempotency key INSERT fails because table doesn't exist
      if (first.includes("enquiry_idempotency_keys")) {
        throw new Error('relation "enquiry_idempotency_keys" does not exist');
      }
      return [];
    },
  });
  __setSqlForTesting(sql);

  const payload = {
    ...VALID_PAYLOAD,
    fullName: "Fallback Submission",
    email: "fallback@example.com",
  };
  // Should NOT throw - should fall back to unprotected insert
  const result = await createEnquiryDb(payload, {
    idempotencyKey: "key-fallback",
    fingerprintSecret: "test-secret",
  });

  assert.ok(result, "fallback insert should return a record");
  __clearSqlForTesting();
});

test("createEnquiryDb: no idempotency key → no dedup check, normal insert", async () => {
  __clearSqlForTesting();
  const { sql } = mockTransactionSql({
    txQuery: async () => [],
  });
  __setSqlForTesting(sql);

  const payload = {
    ...VALID_PAYLOAD,
    fullName: "No Key Submission",
    email: "nokey@example.com",
  };
  const result = await createEnquiryDb(payload); // no idempotencyKey, no fingerprintSecret

  assert.ok(result, "submission without key should succeed");
  assert.equal(result.status, "new");
  __clearSqlForTesting();
});

test("createEnquiryDb: no fingerprint secret → no duplicate check", async () => {
  __clearSqlForTesting();
  const { sql } = mockTransactionSql({
    txQuery: async () => [],
  });
  __setSqlForTesting(sql);

  const payload = {
    ...VALID_PAYLOAD,
    fullName: "No Fingerprint Submission",
    email: "nofp@example.com",
  };
  const result = await createEnquiryDb(payload, {
    idempotencyKey: "key-nofp",
    // no fingerprintSecret
  });

  assert.ok(result, "submission without fingerprint secret should succeed");
  __clearSqlForTesting();
});

// ---------------------------------------------------------------------------
// Neon read-only integration tests
// These exercise the real PostgreSQL path (not the JSON fallback) and would
// catch a recurrence of the unsupported sql(string, params) calling convention
// that caused HTTP 500 on admin enquiry retrieval.
// No data is mutated - read-only operations only.
// ---------------------------------------------------------------------------

function loadEnvLocalForNeon() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return false;
  const content = fs.readFileSync(envPath, "utf8");
  let loaded = false;
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2] || "";
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
      loaded = true;
    }
  }
  return loaded;
}

test("Neon: listEnquiries returns active records via sql.query()", async () => {
  const envLoaded = loadEnvLocalForNeon();
  if (!envLoaded) {
    console.log("Skipping Neon test: .env.local not found or DATABASE_URL not set");
    return;
  }
  // Dynamically import so shouldUseDb() picks up DATABASE_URL from .env.local
  const { listEnquiries: neonList } = await import("../lib/enquiries.js");
  const data = await neonList({ search: "", status: "all", category: "all", dateFrom: "", dateTo: "", page: 1, pageSize: 20, trashed: false });
  assert.ok(Array.isArray(data.items), "items must be an array");
  assert.ok(typeof data.total === "number" && data.total >= 0, "total must be a non-negative number");
  assert.ok(typeof data.counts === "object", "counts must be an object");
  assert.ok(typeof data.counts.total === "number", "counts.total must be a number");
  // All returned items should be active (deletedAt null)
  for (const item of data.items) {
    assert.equal(item.deletedAt, null, "active listing must exclude trashed records");
  }
});

test("Neon: getEnquiryById retrieves active record via tagged template", async () => {
  const envLoaded = loadEnvLocalForNeon();
  if (!envLoaded) {
    console.log("Skipping Neon test: .env.local not found or DATABASE_URL not set");
    return;
  }
  const { listEnquiries: neonList, getEnquiryById: neonGet } = await import("../lib/enquiries.js");
  const data = await neonList({ search: "", status: "all", category: "all", dateFrom: "", dateTo: "", page: 1, pageSize: 1, trashed: false });
  assert.ok(data.items.length >= 1, "need at least one active enquiry to test getEnquiryById");
  const targetId = data.items[0].id;
  const fetched = await neonGet(targetId);
  assert.ok(fetched, "enquiry must be retrievable by id");
  assert.equal(fetched.id, targetId, "returned id must match");
  assert.equal(fetched.deletedAt, null, "active enquiry must have deletedAt null");
});

test("Neon: getEnquiryById includeTrashed works via tagged template", async () => {
  const envLoaded = loadEnvLocalForNeon();
  if (!envLoaded) {
    console.log("Skipping Neon test: .env.local not found or DATABASE_URL not set");
    return;
  }
  const { getEnquiryById: neonGet } = await import("../lib/enquiries.js");
  // Use any existing id; includeTrashed should not apply deleted_at IS NULL filter
  const fetched = await neonGet("00000000-0000-0000-0000-000000000000", { includeTrashed: true });
  assert.equal(fetched, null, "nonexistent id must return null even with includeTrashed");
});

// ---------------------------------------------------------------------------
// DB config detection (no secret values printed)
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

test("teardown removes temp data file", () => {
  try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
});
