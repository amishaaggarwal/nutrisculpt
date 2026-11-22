import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { neon, neonConfig } from "@neondatabase/serverless";
import {
  ENQUIRY_CATEGORY_ALLOWLIST,
  ENQUIRY_SERVICE_OPTIONS,
  GOAL_ALLOWLIST,
} from "../constants/services.js";
import { isValidCalculatorSource } from "../lib/back-link-security.mjs";
import { getDatabaseConfig, __setSqlForTesting, __clearSqlForTesting } from "../lib/db.js";

// Configure local fixtures before importing the storage module, which reads
// the data path at import time. Keep this suite offline even with inherited credentials.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nutrisculpt-enq-test-"));
const tmpFile = path.join(tmpDir, "enquiries.json");
process.env.ENQUIRIES_DATA_PATH = tmpFile;
process.env.NODE_ENV = "test";
delete process.env.DATABASE_URL;
delete process.env.DATABASE_URL_POOLED;
neonConfig.fetchFunction = () => {
  throw new Error("Unexpected Neon access in the offline enquiry suite");
};

after(() => {
  fs.rmSync(tmpFile, { force: true });
  fs.rmSync(`${tmpFile}.${process.pid}.tmp`, { force: true });
  fs.rmdirSync(tmpDir);
});

const {
  STATUS_VALUES,
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
  IDEMPOTENCY_WINDOW_MS,
  DUPLICATE_WINDOW_MS,
} = await import("../lib/enquiries.js");

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

test("protected submissions require configured database storage", async () => {
  const email = "protected-submission-fixture@example.com";
  await assert.rejects(createEnquiry({ ...VALID_PAYLOAD, email }, {
    idempotencyKey: "fixture-key",
    fingerprintSecret: "fixture-secret",
  }), { code: "DB_CONFIG_MISSING" });
  assert.deepEqual((await listEnquiries({ search: email })).items, []);
});

test("createEnquiry leaves required-name validation to the route", async () => {
  // The route layer validates fullName; createEnquiry trusts payload. Verify
  // normalizeRecord does not crash on empty name and still stores safely.
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "" });
  assert.equal(created.fullName, "");
});

test("listEnquiries returns newest first", async () => {
  const fixture = { ...VALID_PAYLOAD, email: "order-fixture@example.com" };
  const older = await createEnquiry({ ...fixture, submittedAt: "2026-01-01T00:00:00Z" });
  const newer = await createEnquiry({ ...fixture, submittedAt: "2026-03-01T00:00:00Z" });

  const data = await listEnquiries({ search: fixture.email });
  assert.deepEqual(data.items.map((item) => item.id), [newer.id, older.id]);
});

test("listEnquiries supports status filter", async () => {
  const email = "status-filter-fixture@example.com";
  const newest = await createEnquiry({ ...VALID_PAYLOAD, email });
  await createClosedEnquiry({ email });
  const data = await listEnquiries({ status: "new", search: email });
  assert.deepEqual(data.items.map((item) => item.id), [newest.id]);
});

test("listEnquiries supports category filter", async () => {
  const email = "category-filter-fixture@example.com";
  const category = "metabolic-bone-health";
  const matching = await createEnquiry({ ...VALID_PAYLOAD, email, selectedServiceCategory: category });
  await createEnquiry({ ...VALID_PAYLOAD, email });
  const data = await listEnquiries({ category, search: email });
  assert.deepEqual(data.items.map((item) => item.id), [matching.id]);
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
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "Contacted User" });
  await updateEnquiry(created.id, { status: "contacted" });
  const result = await trashEnquiry(created.id);
  assert.equal(result, null, "contacted enquiry must not be trashed");
});

test("consultation_scheduled enquiry cannot move to Trash", async () => {
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "Consult User" });
  await updateEnquiry(created.id, { status: "consultation_scheduled" });
  const result = await trashEnquiry(created.id);
  assert.equal(result, null, "consultation_scheduled enquiry must not be trashed");
});

test("trashed enquiry appears in Trash listing", async () => {
  const email = "trash-listing-fixture@example.com";
  const toTrash = await createClosedEnquiry({ fullName: "Trashed One", email });
  const active = await createClosedEnquiry({ fullName: "Active One", email });
  await trashEnquiry(toTrash.id);

  // Direct read confirms the trashed state.
  const persisted = await readIncludingTrashed(toTrash.id);
  assert.ok(persisted.deletedAt, "deleted_at must be set on the trashed record");

  const trashed = await listEnquiries({ trashed: true, search: email });
  assert.equal(trashed.total, 1);
  assert.deepEqual(trashed.items.map((item) => item.id), [toTrash.id]);
  assert.equal(trashed.items[0].deletedAt, persisted.deletedAt);

  const activeListing = await listEnquiries({ search: email });
  assert.equal(activeListing.total, 1);
  assert.deepEqual(activeListing.items.map((item) => item.id), [active.id]);
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

test("active listing includes a closed enquiry again after restore", async () => {
  const email = "restore-listing-fixture@example.com";
  const alpha = await createClosedEnquiry({ email });
  await trashEnquiry(alpha.id);
  assert.deepEqual((await listEnquiries({ search: email })).items, []);
  await restoreEnquiry(alpha.id);
  const { items } = await listEnquiries({ search: email });
  assert.deepEqual(items.map((item) => item.id), [alpha.id]);
  assert.equal(items[0].status, "closed");
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
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "Contacted enquiry" });
  await updateEnquiry(created.id, { status: "contacted" });
  const result = await trashEnquiry(created.id);
  assert.equal(result, null, "contacted enquiry must not be trashed");
});

test("API action contract: consultation_scheduled enquiry rejected for trash", async () => {
  const created = await createEnquiry({ ...VALID_PAYLOAD, fullName: "Consultation enquiry" });
  await updateEnquiry(created.id, { status: "consultation_scheduled" });
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

test("hashPayload ignores submission time but distinguishes changed enquiry details", () => {
  const original = hashPayload(VALID_PAYLOAD);
  assert.equal(hashPayload({ ...VALID_PAYLOAD, submittedAt: "2026-03-01T00:00:00Z" }), original);
  assert.notEqual(hashPayload({ ...VALID_PAYLOAD, primaryGoal: "Improve mobility" }), original);
});

test("idempotency lasts 24 hours and the duplicate window lasts 10 minutes", () => {
  assert.equal(IDEMPOTENCY_WINDOW_MS, 24 * 60 * 60 * 1000);
  assert.equal(DUPLICATE_WINDOW_MS, 10 * 60 * 1000);
});

// ---------------------------------------------------------------------------
// Production Neon HTTP driver with an in-process response double. The driver
// builds and validates the real requests. The response double never executes SQL.
// ---------------------------------------------------------------------------

const FAKE_DB_URL = "postgresql://fixture:fixture@offline.invalid/enquiries";
const STORAGE_OPTIONS = { idempotencyKey: "fixture-key", fingerprintSecret: "fixture-secret" };
const STORAGE_ROW = {
  id: "stored-enquiry",
  full_name: "Jane Doe",
  email: "jane@example.com",
  status: "new",
  deleted_at: null,
  submitted_at: VALID_PAYLOAD.submittedAt,
  updated_at: VALID_PAYLOAD.updatedAt,
};

function useNeonHttpMock(t, respond) {
  const calls = [];
  const originalFetch = neonConfig.fetchFunction;
  process.env.DATABASE_URL = FAKE_DB_URL;
  __setSqlForTesting(neon(FAKE_DB_URL));
  neonConfig.fetchFunction = async (_url, request) => {
    const body = JSON.parse(request.body);
    calls.push({ body, headers: request.headers });
    return respond(body, calls.length);
  };
  t.after(() => {
    delete process.env.DATABASE_URL;
    __clearSqlForTesting();
    neonConfig.fetchFunction = originalFetch;
  });
  return calls;
}

function resultSet(columns = {}, rows = []) {
  const fields = Object.entries(columns).map(([name, dataTypeID]) => ({ name, dataTypeID }));
  return { fields, rows };
}

function outcomeResponse({ queries }, outcome, row = null, retryAfterSeconds = null) {
  const result = resultSet({ outcome: 25, enquiry: 3802, retry_after_seconds: 23 }, [
    [outcome, row === null ? null : JSON.stringify(row), retryAfterSeconds === null ? null : String(retryAfterSeconds)],
  ]);
  return Response.json({
    results: queries.map(({ query }) => /INSERT INTO enquiries\b/i.test(query) ? result : resultSet()),
  });
}

function databaseError(code, message) {
  return Response.json({ code, message }, { status: 400 });
}

test("createEnquiryDb uses one supported Neon batch with ordered transaction locks", async (t) => {
  const calls = useNeonHttpMock(t, (body) => outcomeResponse(body, "created", STORAGE_ROW));
  const created = await createEnquiryDb(VALID_PAYLOAD, STORAGE_OPTIONS);
  assert.equal(created.id, STORAGE_ROW.id);
  assert.equal(created.status, "new");
  assert.equal(created.replayed, undefined);

  assert.equal(calls.length, 1, "locks and writes must share one Neon batch");
  const [{ body: { queries }, headers }] = calls;
  assert.equal(headers["Neon-Batch-Isolation-Level"], "ReadCommitted");
  assert.equal(queries.length, 4);
  const [idempotencyLock, fingerprintLock, submission, cleanup] = queries;
  assert.match(idempotencyLock.query, /pg_advisory_xact_lock\(/i);
  assert.match(fingerprintLock.query, /pg_advisory_xact_lock\(/i);
  assert.notDeepEqual(idempotencyLock.params, fingerprintLock.params);
  assert.match(submission.query, /INSERT INTO enquiries\b/i);
  assert.match(submission.query, /INSERT INTO enquiry_idempotency_keys\b/i);
  assert.match(submission.query, /INSERT INTO enquiry_submission_fingerprints\b/i);
  assert.match(cleanup.query, /FOR UPDATE SKIP LOCKED/i);
  assert.doesNotMatch(cleanup.query, /DELETE FROM enquiries\b/i);
});

test("same-key overlapping submissions use the same locks and map a replay to the original record", async (t) => {
  const originalTimestamp = new Date(VALID_PAYLOAD.submittedAt).toISOString();
  const calls = useNeonHttpMock(t, (body) => outcomeResponse(
    body,
    body.queries[2].params.includes(originalTimestamp) ? "created" : "replay",
    STORAGE_ROW,
  ));

  const [first, replay] = await Promise.all([
    createEnquiryDb(VALID_PAYLOAD, STORAGE_OPTIONS),
    createEnquiryDb({ ...VALID_PAYLOAD, submittedAt: "2026-01-01T00:01:00Z" }, STORAGE_OPTIONS),
  ]);
  assert.equal(first.id, STORAGE_ROW.id);
  assert.equal(replay.id, first.id);
  assert.equal(replay.replayed, true);
  assert.equal(calls.length, 2);
  const [firstBatch, retryBatch] = calls.map(({ body }) => body.queries);
  assert.deepEqual(firstBatch.slice(0, 2), retryBatch.slice(0, 2));
  assert.ok(firstBatch[2].params.includes(hashPayload(VALID_PAYLOAD)));
  assert.ok(retryBatch[2].params.includes(hashPayload(VALID_PAYLOAD)));
});

test("same key and conflicting payload holds the same idempotency lock and reports a conflict", async (t) => {
  const calls = useNeonHttpMock(t, (body, call) =>
    outcomeResponse(body, call === 1 ? "created" : "conflict", call === 1 ? STORAGE_ROW : null),
  );
  const changed = { ...VALID_PAYLOAD, primaryGoal: "Improve mobility" };

  await createEnquiryDb(VALID_PAYLOAD, STORAGE_OPTIONS);
  await assert.rejects(createEnquiryDb(changed, STORAGE_OPTIONS), { code: "IDEMPOTENCY_CONFLICT" });
  assert.equal(calls.length, 2);
  const [original, conflict] = calls.map(({ body }) => body.queries);
  assert.deepEqual(original[0], conflict[0]);
  assert.notDeepEqual(original[1].params, conflict[1].params);
  assert.ok(conflict[2].params.includes(hashPayload(changed)));
});

test("different keys for matching contacts and goals share a fingerprint lock and report a remaining cooldown", async (t) => {
  const calls = useNeonHttpMock(t, (body) => body.queries[0].params[0] === STORAGE_OPTIONS.idempotencyKey
    ? outcomeResponse(body, "created", STORAGE_ROW)
    : outcomeResponse(body, "duplicate", null, 245),
  );
  const results = await Promise.allSettled([
    createEnquiryDb(VALID_PAYLOAD, STORAGE_OPTIONS),
    createEnquiryDb({ ...VALID_PAYLOAD, phoneNumber: "5551234" }, { ...STORAGE_OPTIONS, idempotencyKey: "another-key" }),
  ]);
  assert.equal(results[0].status, "fulfilled");
  assert.equal(results[1].status, "rejected");
  assert.equal(results[1].reason.code, "DUPLICATE_ENQUIRY");
  assert.equal(results[1].reason.retryAfterSeconds, 245);
  assert.equal(calls.length, 2);
  const [firstBatch, duplicateBatch] = calls.map(({ body }) => body.queries);
  assert.notDeepEqual(firstBatch[0].params, duplicateBatch[0].params);
  assert.deepEqual(firstBatch[1], duplicateBatch[1]);
});

test("a failed database batch propagates the error and retries the same lock keys", async (t) => {
  const calls = useNeonHttpMock(t, (body, call) => call === 1
    ? databaseError("23514", "enquiry violates a check constraint")
    : outcomeResponse(body, "created", STORAGE_ROW),
  );

  await assert.rejects(createEnquiryDb(VALID_PAYLOAD, STORAGE_OPTIONS), { code: "23514" });
  assert.equal(calls.length, 1, "failure must not trigger another insert outside the batch");
  const retry = await createEnquiryDb(VALID_PAYLOAD, STORAGE_OPTIONS);
  assert.equal(retry.id, STORAGE_ROW.id);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].body.queries.slice(0, 2), calls[1].body.queries.slice(0, 2));
});

for (const relation of ["enquiry_idempotency_keys", "enquiry_submission_fingerprints"]) {
  test(`missing ${relation} fails without a fallback write`, async (t) => {
    const calls = useNeonHttpMock(t, () => databaseError("42P01", `relation "${relation}" does not exist`));
    await assert.rejects(createEnquiryDb(VALID_PAYLOAD, STORAGE_OPTIONS), { code: "ENQUIRY_PROTECTION_UNAVAILABLE" });
    assert.equal(calls.length, 1);
  });
}

test("an unrelated missing relation remains a database error", async (t) => {
  const calls = useNeonHttpMock(t, () => databaseError("42P01", 'relation "enquiries" does not exist'));
  await assert.rejects(createEnquiryDb(VALID_PAYLOAD, STORAGE_OPTIONS), { code: "42P01" });
  assert.equal(calls.length, 1);
});

test("an empty database response cannot report that an enquiry was saved", async (t) => {
  useNeonHttpMock(t, ({ queries }) => Response.json({ results: queries.map(() => resultSet()) }));
  await assert.rejects(createEnquiryDb(VALID_PAYLOAD, STORAGE_OPTIONS));
});

test("the SQL expires keys and fingerprints and writes protection only for inserted enquiries", async (t) => {
  const calls = useNeonHttpMock(t, (body) => outcomeResponse(body, "created", STORAGE_ROW));
  await createEnquiryDb(VALID_PAYLOAD, STORAGE_OPTIONS);
  const [, , submission, cleanup] = calls[0].body.queries;

  assert.match(submission.query, /clock_timestamp\(\) AS checked_at/i);
  assert.match(submission.query, /k\.created_at > s\.checked_at - s\.key_window/i);
  assert.match(submission.query, /f\.created_at > s\.checked_at - s\.duplicate_window/i);
  assert.match(submission.query, /f\.created_at \+ s\.duplicate_window AS expires_at/i);
  assert.match(submission.query, /NOT EXISTS \(SELECT FROM existing_key\)\s+AND NOT EXISTS \(SELECT FROM recent_fingerprint\)/i);
  assert.match(submission.query, /SELECT s\.idempotency_key, i\.id, s\.payload_hash, s\.checked_at\s+FROM inserted i\b/i);
  assert.match(submission.query, /SELECT s\.fingerprint, s\.checked_at\s+FROM inserted\b/i);
  assert.match(submission.query, /ON CONFLICT \(idempotency_key\) DO UPDATE/i);
  assert.match(submission.query, /ON CONFLICT \(fingerprint\) DO UPDATE/i);
  assert.match(submission.query, /CEIL\(EXTRACT\(EPOCH FROM \(f\.expires_at - s\.checked_at\)\)\)/i);
  assert.deepEqual(submission.params.slice(3, 5), ["86400", "600"]);
  assert.deepEqual(cleanup.params, ["86400", "1800"]);
});

test("a replay returns the stored record even when it is in Trash", async (t) => {
  const deletedAt = "2026-01-01T00:04:00.000Z";
  useNeonHttpMock(t, (body) => outcomeResponse(body, "replay", {
    ...STORAGE_ROW,
    status: "closed",
    deleted_at: deletedAt,
  }));
  const replay = await createEnquiryDb(VALID_PAYLOAD, STORAGE_OPTIONS);
  assert.equal(replay.replayed, true);
  assert.equal(replay.id, STORAGE_ROW.id);
  assert.equal(replay.status, "closed");
  assert.equal(replay.deletedAt, deletedAt);
});

test("SQL calls without storage options issue no advisory lock queries", async (t) => {
  const calls = useNeonHttpMock(t, (body) => outcomeResponse(body, "created", STORAGE_ROW));
  const created = await createEnquiryDb(VALID_PAYLOAD);
  assert.equal(created.id, STORAGE_ROW.id);
  assert.equal(calls.length, 1);
  const { queries } = calls[0].body;
  assert.equal(queries.length, 2);
  assert.deepEqual(queries[0].params.slice(0, 3), [null, null, null]);
});

test("database listing binds all filters consistently across its SQL queries", async (t) => {
  const calls = useNeonHttpMock(t, ({ query }) => {
    if (/GROUP BY selected_service_category/i.test(query)) {
      return Response.json(resultSet({ category: 25, count: 23 }, [["metabolic-bone-health", "1"]]));
    }
    if (/COUNT\(\*\) FILTER/i.test(query)) {
      return Response.json(resultSet({ total: 23, closed: 23 }, [["1", "1"]]));
    }
    if (/COUNT\(\*\)/i.test(query)) {
      return Response.json(resultSet({ count: 23 }, [["1"]]));
    }
    return Response.json(resultSet({ id: 25, status: 25, deleted_at: 25 }, [
      ["trashed-id", "closed", "2026-01-01T00:00:00Z"],
    ]));
  });

  const list = await listEnquiries({
    search: "Fixture",
    status: "closed",
    category: "metabolic-bone-health",
    dateFrom: "2026-01-01",
    dateTo: "2026-03-01",
    page: 2,
    pageSize: 3,
    trashed: true,
  });

  const expectedFilters = ["closed", "metabolic-bone-health", "%fixture%", "2026-01-01", "2026-03-01T23:59:59.999Z"];
  assert.equal(calls.length, 4);
  for (const { body: { query, params } } of calls) {
    assert.match(query, /deleted_at IS NOT NULL/i);
    assert.match(query, /status = \$1 AND selected_service_category = \$2/i);
    const placeholders = new Set(Array.from(query.matchAll(/\$(\d+)/g), ([, index]) => Number(index)));
    assert.deepEqual([...placeholders], params.map((_, index) => index + 1));
    assert.deepEqual(params.slice(0, 5), expectedFilters);
    if (/ORDER BY/i.test(query)) {
      assert.match(query, /ORDER BY submitted_at DESC NULLS LAST, created_at DESC\s+LIMIT \$6 OFFSET \$7/i);
      assert.deepEqual(params.slice(5), ["3", "3"]);
    }
  }
  assert.deepEqual(list.items.map(({ id }) => id), ["trashed-id"]);
  assert.equal(list.items[0].deletedAt, "2026-01-01T00:00:00.000Z");
  assert.equal(list.total, 1);
  assert.equal(list.counts.closed, 1);
  assert.deepEqual(list.byCategory, { "metabolic-bone-health": 1 });
});

test("database lookup's tagged queries honor the includeTrashed switch", async (t) => {
  const calls = useNeonHttpMock(t, ({ query }) => Response.json(resultSet(
    { id: 25, status: 25, deleted_at: 25 },
    /deleted_at IS NULL/i.test(query) ? [] : [["trashed-id", "closed", "2026-01-01T00:00:00Z"]],
  )));

  assert.equal(await getEnquiryById("trashed-id"), null);
  const stored = await getEnquiryById("trashed-id", { includeTrashed: true });
  assert.equal(stored.id, "trashed-id");
  assert.equal(stored.deletedAt, "2026-01-01T00:00:00.000Z");
  assert.equal(calls.length, 2);
  for (const { body } of calls) assert.deepEqual(body.params, ["trashed-id"]);
});
