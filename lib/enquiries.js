import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { getSql, getDatabaseConfig } from "./db.js";

const DATA_DIR = process.env.ENQUIRIES_DATA_PATH
  ? path.dirname(path.resolve(process.env.ENQUIRIES_DATA_PATH))
  : path.join(process.cwd(), "data");
const DATA_FILE = process.env.ENQUIRIES_DATA_PATH
  ? path.resolve(process.env.ENQUIRIES_DATA_PATH)
  : path.join(DATA_DIR, "enquiries.json");

export const STATUS_VALUES = ["new", "contacted", "consultation_scheduled", "closed"];
export const STATUS_LABELS = {
  new: "New",
  contacted: "Contacted",
  consultation_scheduled: "Consultation Scheduled",
  closed: "Closed",
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeStatus(value) {
  if (value == null) return "new";
  const v = String(value).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (STATUS_VALUES.includes(v)) return v;
  if (v === "consultation" || v === "scheduled" || v === "consultation_booked") return "consultation_scheduled";
  if (v === "in_progress" || v === "follow_up" || v === "followed_up" || v === "replied") return "contacted";
  if (v === "done" || v === "resolved" || v === "cancelled" || v === "canceled" || v === "lost") return "closed";
  if (v === "open" || v === "pending" || v === "received") return "new";
  return "new";
}

function safeString(v, max = 2000) {
  if (v == null) return "";
  return String(v).trim().slice(0, max);
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

// ---------------------------------------------------------------------------
// Contact normalization (Part 5)
// ---------------------------------------------------------------------------

function normalizeEmail(email) {
  if (!email) return "";
  return email.trim().toLowerCase();
}

function normalizePhone(countryCode, phoneNumber) {
  if (!phoneNumber) return "";
  const cc = (countryCode || "").trim();
  const digits = String(phoneNumber).replace(/\D/g, "");
  if (!digits) return "";
  return `${cc}${digits}`;
}

// Privacy-preserving fingerprint for duplicate detection.
// Uses HMAC-SHA256 with a secret so low-entropy values (phone numbers)
// cannot be reversed from the stored fingerprint.
function makeFingerprint(secret, ...parts) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(parts));
  return hmac.digest("hex");
}

// Build the duplicate-detection fingerprint from normalized contact +
// service category + goal, so substantially identical enquiries within the
// time window are detected without storing raw contact details.
function makeSubmissionFingerprint(secret, email, countryCode, phoneNumber, category, goal) {
  return makeFingerprint(secret, normalizeEmail(email), normalizePhone(countryCode, phoneNumber), category || "", goal || "");
}

// ---------------------------------------------------------------------------
// Server-side idempotency and duplicate detection (Part 3, 4)
// These require database tables: enquiry_idempotency_keys and
// enquiry_submission_fingerprints (see migrations/003_add_idempotency.sql).
// ---------------------------------------------------------------------------

const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const PROTECTION_TABLES = new Set(["enquiry_idempotency_keys", "enquiry_submission_fingerprints"]);

function hashPayload(payload) {
  const sorted = {};
  Object.keys(payload)
    .filter((key) => key !== "submittedAt")
    .sort()
    .forEach((key) => {
      sorted[key] = payload[key];
    });
  return crypto.createHash("sha256").update(JSON.stringify(sorted)).digest("hex");
}
function normalizeRecord(raw) {
  const submittedAt = raw.submittedAt || raw.submitted_at || raw.createdAt || raw.created_at || raw.date || null;
  const updatedAt = raw.updatedAt || raw.updated_at || submittedAt || nowIso();
  const status = normalizeStatus(raw.status || raw.enquiryStatus || raw.enquiry_status);
  const contactedAt = raw.contactedAt || raw.contacted_at || null;
  return {
    id: safeString(raw.id || "", 100),
    fullName: safeString(raw.fullName || raw.full_name || raw.name || "", 120),
    email: safeString(raw.email || "", 254).toLowerCase(),
    countryCode: safeString(raw.countryCode || raw.country_code || "", 5),
    phoneNumber: safeString(raw.phoneNumber || raw.phone_number || raw.contact || raw.phone || "", 30),
    selectedServiceCategory: safeString(raw.selectedServiceCategory || raw.selected_service_category || raw.serviceCategory || raw.category || "not-sure", 80) || "not-sure",
    selectedServiceCategoryLabel: safeString(raw.selectedServiceCategoryLabel || raw.selected_service_category_label || raw.serviceCategoryLabel || "", 120),
    primaryGoal: safeString(raw.primaryGoal || raw.primary_goal || raw.goals || raw.reason || raw.message || "", 500),
    primaryGoalCategory: safeString(raw.primaryGoalCategory || raw.primary_goal_category || "", 40),
    coachingPreference: safeString(raw.coachingPreference || raw.coaching_preference || "", 80),
    ageGroup: safeString(raw.ageGroup || raw.age_group || "", 40),
    city: safeString(raw.city || "", 120),
    source: safeString(raw.source || raw.entrySource || "direct", 40),
    submittedAt: toIsoOrNull(submittedAt),
    status,
    deletedAt: toIsoOrNull(raw.deletedAt || raw.deleted_at || null),
    adminNotes: safeString(raw.adminNotes || raw.admin_notes || "", 2000),
    nextFollowUpAt: toDateOnlyOrNull(raw.nextFollowUpAt || raw.next_follow_up_at),
    contactedAt: toIsoOrNull(contactedAt),
    updatedAt: toIsoOrNull(updatedAt) || nowIso(),
  };
}

function rowToRecord(row) {
  if (!row) return null;
  return normalizeRecord({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    countryCode: row.country_code,
    phoneNumber: row.phone_number,
    selectedServiceCategory: row.selected_service_category,
    selectedServiceCategoryLabel: row.selected_service_category_label,
    primaryGoal: row.primary_goal,
    primaryGoalCategory: row.primary_goal_category,
    coachingPreference: row.coaching_preference,
    ageGroup: row.age_group,
    city: row.city,
    source: row.source,
    submittedAt: row.submitted_at,
    status: row.status,
    deletedAt: row.deleted_at,
    adminNotes: row.admin_notes,
    nextFollowUpAt: row.next_follow_up_at,
    contactedAt: row.contacted_at,
    updatedAt: row.updated_at,
  });
}

function shouldUseDb(requireDatabase = false) {
  const { hasAny } = getDatabaseConfig();
  if (hasAny) return true;
  if (requireDatabase || process.env.NODE_ENV === "production") {
    const err = new Error("Database is required for this enquiry operation.");
    err.code = "DB_CONFIG_MISSING";
    throw err;
  }
  return false; // local dev fallback to JSON when DB not configured
}

async function ensureJsonStore() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]\n", "utf8");
  }
}

async function readAllJsonRaw() {
  await ensureJsonStore();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAllJson(records) {
  await ensureJsonStore();
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(records, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

function makeEnquiryRecord(payload) {
  const now = nowIso();
  return normalizeRecord({
    ...payload,
    id: crypto.randomUUID(),
    submittedAt: payload.submittedAt || now,
    status: "new",
    adminNotes: "",
    nextFollowUpAt: null,
    contactedAt: null,
    updatedAt: now,
  });
}

function isMissingProtectionTable(error) {
  if (error.code !== "42P01") return false;
  const relation = /^relation "([^"]+)" does not exist$/.exec(error.message)?.[1];
  return PROTECTION_TABLES.has(error.table) || PROTECTION_TABLES.has(relation);
}

async function createEnquiryDb(payload, { idempotencyKey, fingerprintSecret } = {}) {
  const sql = getSql();
  const record = makeEnquiryRecord(payload);
  const key = idempotencyKey ? String(idempotencyKey) : null;
  const payloadHash = key ? hashPayload(payload) : null;
  const fingerprint = fingerprintSecret
    ? makeSubmissionFingerprint(
      fingerprintSecret, record.email, record.countryCode, record.phoneNumber,
      record.selectedServiceCategory, record.primaryGoal,
    )
    : null;
  const keyWindowSeconds = IDEMPOTENCY_WINDOW_MS / 1000;
  const duplicateWindowSeconds = DUPLICATE_WINDOW_MS / 1000;

  let results;
  try {
    results = await sql.transaction((tx) => {
      const queries = [];
      // Lock in key-then-fingerprint order, in separate namespaces. The write
      // gets a fresh Read Committed snapshot after both lock waits finish.
      if (key) queries.push(tx`
        SELECT pg_advisory_xact_lock(17301, hashtext(${key}))
      `);
      if (fingerprint) queries.push(tx`
        SELECT pg_advisory_xact_lock(17302, hashtext(${fingerprint}))
      `);

      queries.push(tx`
        WITH submission AS MATERIALIZED (
          SELECT ${key}::text AS idempotency_key, ${payloadHash}::text AS payload_hash,
                 ${fingerprint}::text AS fingerprint, clock_timestamp() AS checked_at,
                 ${keyWindowSeconds}::integer * INTERVAL '1 second' AS key_window,
                 ${duplicateWindowSeconds}::integer * INTERVAL '1 second' AS duplicate_window
        ),
        existing_key AS (
          SELECT k.enquiry_id, k.payload_hash
          FROM enquiry_idempotency_keys k
          JOIN submission s USING (idempotency_key)
          WHERE k.created_at > s.checked_at - s.key_window
        ),
        recent_fingerprint AS (
          SELECT f.created_at + s.duplicate_window AS expires_at
          FROM enquiry_submission_fingerprints f
          JOIN submission s USING (fingerprint)
          WHERE f.created_at > s.checked_at - s.duplicate_window
        ),
        inserted AS (
          INSERT INTO enquiries (
            id, full_name, email, country_code, phone_number,
            selected_service_category, selected_service_category_label,
            primary_goal, primary_goal_category, coaching_preference,
            age_group, city, source, submitted_at, status,
            admin_notes, next_follow_up_at, contacted_at, created_at, updated_at, deleted_at
          )
          SELECT ${record.id}, ${record.fullName}, ${record.email}, ${record.countryCode}, ${record.phoneNumber},
                 ${record.selectedServiceCategory}, ${record.selectedServiceCategoryLabel},
                 ${record.primaryGoal}, ${record.primaryGoalCategory}, ${record.coachingPreference},
                 ${record.ageGroup}, ${record.city}, ${record.source}, ${record.submittedAt}::timestamptz, ${record.status},
                 ${record.adminNotes}, ${record.nextFollowUpAt}::date, ${record.contactedAt}::timestamptz,
                 s.checked_at, s.checked_at, ${record.deletedAt}::timestamptz
          FROM submission s
          WHERE NOT EXISTS (SELECT FROM existing_key)
            AND NOT EXISTS (SELECT FROM recent_fingerprint)
          RETURNING *
        ),
        saved_key AS (
          INSERT INTO enquiry_idempotency_keys (idempotency_key, enquiry_id, payload_hash, created_at)
          SELECT s.idempotency_key, i.id, s.payload_hash, s.checked_at
          FROM inserted i CROSS JOIN submission s
          WHERE s.idempotency_key IS NOT NULL
          ON CONFLICT (idempotency_key) DO UPDATE
          SET enquiry_id = EXCLUDED.enquiry_id, payload_hash = EXCLUDED.payload_hash,
              created_at = EXCLUDED.created_at
        ),
        saved_fingerprint AS (
          INSERT INTO enquiry_submission_fingerprints (fingerprint, created_at)
          SELECT s.fingerprint, s.checked_at
          FROM inserted CROSS JOIN submission s
          WHERE s.fingerprint IS NOT NULL
          ON CONFLICT (fingerprint) DO UPDATE SET created_at = EXCLUDED.created_at
        )
        SELECT CASE
                 WHEN k.enquiry_id IS NOT NULL AND k.payload_hash = s.payload_hash THEN 'replay'
                 WHEN k.enquiry_id IS NOT NULL THEN 'conflict'
                 WHEN f.expires_at IS NOT NULL THEN 'duplicate'
                 WHEN i.id IS NOT NULL THEN 'created'
               END AS outcome,
               CASE
                 WHEN i.id IS NOT NULL THEN to_jsonb(i)
                 WHEN k.payload_hash = s.payload_hash THEN to_jsonb(original)
               END AS enquiry,
               CEIL(EXTRACT(EPOCH FROM (f.expires_at - s.checked_at)))::int AS retry_after_seconds
        FROM submission s
        LEFT JOIN existing_key k ON TRUE
        LEFT JOIN recent_fingerprint f ON TRUE
        LEFT JOIN inserted i ON TRUE
        LEFT JOIN enquiries original ON original.id = k.enquiry_id
      `);

      // Reclaim a bounded number of expired rows after the submission write.
      // Skipping locked rows keeps maintenance from waiting on other writers.
      queries.push(tx`
        WITH removed_keys AS (
          DELETE FROM enquiry_idempotency_keys
          WHERE idempotency_key IN (
            SELECT idempotency_key FROM enquiry_idempotency_keys
            WHERE created_at <= statement_timestamp() - ${keyWindowSeconds}::integer * INTERVAL '1 second'
            ORDER BY created_at
            LIMIT 100 FOR UPDATE SKIP LOCKED
          )
        )
        DELETE FROM enquiry_submission_fingerprints
        WHERE fingerprint IN (
          SELECT fingerprint FROM enquiry_submission_fingerprints
          WHERE created_at <= statement_timestamp() - ${duplicateWindowSeconds * 3}::integer * INTERVAL '1 second'
          ORDER BY created_at
          LIMIT 100 FOR UPDATE SKIP LOCKED
        )
      `);
      return queries;
    }, { isolationLevel: "ReadCommitted" });
  } catch (error) {
    if (!isMissingProtectionTable(error)) throw error;
    throw Object.assign(new Error("Enquiry protection schema is unavailable.", { cause: error }), {
      code: "ENQUIRY_PROTECTION_UNAVAILABLE",
      status: 503,
    });
  }

  const result = results.at(-2)?.[0];
  if (result?.outcome === "conflict") {
    throw Object.assign(new Error("Idempotency key reused with different payload."), {
      code: "IDEMPOTENCY_CONFLICT",
      status: 409,
    });
  }
  if (result?.outcome === "duplicate") {
    throw Object.assign(new Error("Duplicate enquiry detected within the rate window."), {
      code: "DUPLICATE_ENQUIRY",
      status: 429,
      retryAfterSeconds: result.retry_after_seconds,
    });
  }
  if ((result?.outcome !== "created" && result?.outcome !== "replay") || !result.enquiry?.id) {
    throw new Error("Database did not return a saved enquiry.");
  }
  const saved = rowToRecord(result.enquiry);
  return result.outcome === "replay" ? { ...saved, replayed: true } : saved;
}

async function createEnquiryJson(payload) {
  const records = await readAllJsonRaw();
  const record = makeEnquiryRecord(payload);
  records.push(record);
  await writeAllJson(records);
  return record;
}

export async function createEnquiry(payload, options) {
  if (shouldUseDb(Boolean(options?.idempotencyKey || options?.fingerprintSecret))) {
    return createEnquiryDb(payload, options);
  }
  return createEnquiryJson(payload);
}

function buildWhereParts({ search = "", status = "all", category = "all", dateFrom = "", dateTo = "", trashed = false }) {
  const clauses = [trashed ? "deleted_at IS NOT NULL" : "deleted_at IS NULL"];
  const params = [];
  let i = 0;
  if (status && status !== "all") {
    i += 1; clauses.push(`status = $${i}`); params.push(status);
  }
  if (category && category !== "all") {
    i += 1; clauses.push(`selected_service_category = $${i}`); params.push(category);
  }
  if (search && String(search).trim()) {
    i += 1;
    const q = `%${String(search).trim().toLowerCase()}%`;
    clauses.push(`(LOWER(full_name) LIKE $${i} OR LOWER(email) LIKE $${i} OR LOWER(country_code || ' ' || phone_number) LIKE $${i} OR LOWER(phone_number) LIKE $${i})`);
    params.push(q);
  }
  if (dateFrom) {
    i += 1; clauses.push(`submitted_at >= $${i}::timestamptz`); params.push(dateFrom);
  }
  if (dateTo) {
    i += 1; clauses.push(`submitted_at <= $${i}::timestamptz`); params.push(`${dateTo}T23:59:59.999Z`);
  }
  return { where: clauses.join(" AND "), params };
}

async function listEnquiriesDb({ search = "", status = "all", category = "all", dateFrom = "", dateTo = "", page = 1, pageSize = 20, trashed = false } = {}) {
  const sql = getSql();
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (p - 1) * ps;
  const { where, params } = buildWhereParts({ search, status, category, dateFrom, dateTo, trashed });

  const itemsQuery = `
    SELECT * FROM enquiries
    WHERE ${where}
    ORDER BY submitted_at DESC NULLS LAST, created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  const totalQuery = `SELECT COUNT(*)::int AS count FROM enquiries WHERE ${where}`;
  const countsQuery = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'new')::int AS new,
      COUNT(*) FILTER (WHERE status = 'contacted')::int AS contacted,
      COUNT(*) FILTER (WHERE status = 'consultation_scheduled')::int AS consultation_scheduled,
      COUNT(*) FILTER (WHERE status = 'closed')::int AS closed
    FROM enquiries
    WHERE ${where}
  `;
  const byCatQuery = `SELECT selected_service_category AS category, COUNT(*)::int AS count FROM enquiries WHERE ${where} GROUP BY selected_service_category`;

  const [itemRows, totalRows, countRows, byCatRows] = await Promise.all([
    sql.query(itemsQuery, [...params, ps, offset]),
    sql.query(totalQuery, params),
    sql.query(countsQuery, params),
    sql.query(byCatQuery, params),
  ]);

  const items = itemRows.map(rowToRecord);
  const total = totalRows[0]?.count || 0;
  const c = countRows[0] || {};
  const counts = {
    total: c.total || 0,
    new: c.new || 0,
    contacted: c.contacted || 0,
    consultation_scheduled: c.consultation_scheduled || 0,
    closed: c.closed || 0,
  };
  const byCategory = {};
  for (const r of byCatRows) {
    if (r && r.category) byCategory[r.category] = r.count || 0;
  }
  return { items, total, page: p, pageSize: ps, totalPages: Math.max(1, Math.ceil(total / ps)), counts, byCategory };
}

function matchesSearch(record, q) {
  if (!q) return true;
  const hay = `${record.fullName} ${record.email} ${record.countryCode} ${record.phoneNumber}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function matchesDate(record, from, to) {
  if (!from && !to) return true;
  if (!record.submittedAt) return false;
  const t = new Date(record.submittedAt).getTime();
  if (Number.isNaN(t)) return false;
  if (from) {
    const f = new Date(from).getTime();
    if (!Number.isNaN(f) && t < f) return false;
  }
  if (to) {
    const e = new Date(`${to}T23:59:59.999Z`).getTime();
    if (!Number.isNaN(e) && t > e) return false;
  }
  return true;
}

async function listEnquiriesJson({ search = "", status = "all", category = "all", dateFrom = "", dateTo = "", page = 1, pageSize = 20, trashed = false } = {}) {
  const all = (await readAllJsonRaw()).map(normalizeRecord);
  const filtered = all.filter((r) => {
    if (Boolean(r.deletedAt) !== trashed) return false;
    if (status && status !== "all" && r.status !== status) return false;
    if (category && category !== "all" && r.selectedServiceCategory !== category) return false;
    if (!matchesSearch(r, search)) return false;
    if (!matchesDate(r, dateFrom, dateTo)) return false;
    return true;
  });
  filtered.sort((a, b) => {
    const ta = a.submittedAt ? Date.parse(a.submittedAt) : -Infinity;
    const tb = b.submittedAt ? Date.parse(b.submittedAt) : -Infinity;
    return tb - ta;
  });
  const total = filtered.length;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const start = (p - 1) * ps;
  const items = filtered.slice(start, start + ps);

  const counts = { total, new: 0, contacted: 0, consultation_scheduled: 0, closed: 0 };
  const byCategory = {};
  for (const r of filtered) {
    if (counts[r.status] != null) counts[r.status] += 1;
    byCategory[r.selectedServiceCategory] = (byCategory[r.selectedServiceCategory] || 0) + 1;
  }
  return { items, total, page: p, pageSize: ps, totalPages: Math.max(1, Math.ceil(total / ps)), counts, byCategory };
}

export async function listEnquiries(opts = {}) {
  if (shouldUseDb()) return listEnquiriesDb(opts);
  return listEnquiriesJson(opts);
}

export async function getEnquiryById(id, { includeTrashed = false } = {}) {
  if (shouldUseDb()) {
    const sql = getSql();
    let rows;
    if (includeTrashed) {
      rows = await sql`SELECT * FROM enquiries WHERE id = ${String(id)} LIMIT 1`;
    } else {
      rows = await sql`SELECT * FROM enquiries WHERE id = ${String(id)} AND deleted_at IS NULL LIMIT 1`;
    }
    return rows[0] ? rowToRecord(rows[0]) : null;
  }
  const all = (await readAllJsonRaw()).map(normalizeRecord);
  return all.find((r) => r.id === id && (includeTrashed || r.deletedAt == null)) || null;
}

async function updateEnquiryDb(id, updates) {
  const sql = getSql();
  const current = await getEnquiryById(id);
  if (!current) return null;
  const now = nowIso();

  let status = current.status;
  let contactedAt = current.contactedAt || null;
  if (updates.status != null) {
    const ns = normalizeStatus(updates.status);
    if (!STATUS_VALUES.includes(ns)) throw new Error("Invalid status");
    status = ns;
    if (ns === "contacted" && !current.contactedAt) contactedAt = now;
  }

  let adminNotes = current.adminNotes || "";
  if (Object.prototype.hasOwnProperty.call(updates, "adminNotes")) {
    adminNotes = safeString(updates.adminNotes || "", 2000);
  }

  let nextFollowUpAt = current.nextFollowUpAt || null;
  if (Object.prototype.hasOwnProperty.call(updates, "nextFollowUpAt")) {
    const v = updates.nextFollowUpAt;
    if (!v) nextFollowUpAt = null;
    else {
      const d = new Date(v);
      nextFollowUpAt = Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
  }

  const rows = await sql`
    UPDATE enquiries SET
      status = ${status},
      admin_notes = ${adminNotes},
      next_follow_up_at = ${nextFollowUpAt},
      contacted_at = ${contactedAt},
      updated_at = ${now}
    WHERE id = ${String(id)}
    RETURNING *
  `;
  return rows[0] ? rowToRecord(rows[0]) : null;
}

async function trashEnquiryDb(id) {
  const sql = getSql();
  const now = nowIso();
  const rows = await sql`
    UPDATE enquiries SET
      deleted_at = ${now},
      updated_at = ${now}
    WHERE id = ${String(id)}
      AND deleted_at IS NULL
      AND status = 'closed'
    RETURNING *
  `;
  return rows[0] ? rowToRecord(rows[0]) : null;
}

async function restoreEnquiryDb(id) {
  const sql = getSql();
  const now = nowIso();
  const rows = await sql`
    UPDATE enquiries SET
      deleted_at = NULL,
      updated_at = ${now}
    WHERE id = ${String(id)}
      AND deleted_at IS NOT NULL
    RETURNING *
  `;
  return rows[0] ? rowToRecord(rows[0]) : null;
}

async function deleteEnquiryPermanentlyDb(id) {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM enquiries
    WHERE id = ${String(id)}
      AND deleted_at IS NOT NULL
    RETURNING *
  `;
  return rows[0] ? rowToRecord(rows[0]) : null;
}

async function trashEnquiryJson(id) {
  const records = await readAllJsonRaw();
  const idx = records.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  const current = normalizeRecord(records[idx]);
  if (current.deletedAt != null || current.status !== "closed") return null;
  const now = nowIso();
  const next = { ...current, deletedAt: now, updatedAt: now };
  records[idx] = { ...records[idx], ...next, id: current.id || records[idx].id };
  await writeAllJson(records);
  return normalizeRecord(records[idx]);
}

async function restoreEnquiryJson(id) {
  const records = await readAllJsonRaw();
  const idx = records.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  const current = normalizeRecord(records[idx]);
  if (current.deletedAt == null) return null;
  const now = nowIso();
  const next = { ...current, deletedAt: null, updatedAt: now };
  records[idx] = { ...records[idx], ...next, id: current.id || records[idx].id };
  await writeAllJson(records);
  return normalizeRecord(records[idx]);
}

async function deleteEnquiryPermanentlyJson(id) {
  const records = await readAllJsonRaw();
  const idx = records.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  const current = normalizeRecord(records[idx]);
  if (current.deletedAt == null) return null;
  records.splice(idx, 1);
  await writeAllJson(records);
  return current;
}

async function updateEnquiryJson(id, updates) {
  const records = await readAllJsonRaw();
  const idx = records.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  const current = normalizeRecord(records[idx]);
  const now = nowIso();

  const next = { ...current };
  if (updates.status != null) {
    const ns = normalizeStatus(updates.status);
    if (!STATUS_VALUES.includes(ns)) throw new Error("Invalid status");
    next.status = ns;
    if (ns === "contacted" && !current.contactedAt) next.contactedAt = now;
    else next.contactedAt = current.contactedAt || null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "adminNotes")) {
    next.adminNotes = safeString(updates.adminNotes || "", 2000);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "nextFollowUpAt")) {
    const v = updates.nextFollowUpAt;
    if (!v) next.nextFollowUpAt = null;
    else {
      const d = new Date(v);
      next.nextFollowUpAt = Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
  }
  next.updatedAt = now;

  records[idx] = { ...records[idx], ...next };
  records[idx].id = current.id || records[idx].id;
  records[idx].status = next.status;
  records[idx].adminNotes = next.adminNotes;
  records[idx].nextFollowUpAt = next.nextFollowUpAt;
  records[idx].contactedAt = next.contactedAt;
  records[idx].updatedAt = next.updatedAt;
  await writeAllJson(records);
  return normalizeRecord(records[idx]);
}

export async function updateEnquiry(id, updates) {
  if (shouldUseDb()) return updateEnquiryDb(id, updates);
  return updateEnquiryJson(id, updates);
}

export async function trashEnquiry(id) {
  if (shouldUseDb()) return trashEnquiryDb(id);
  return trashEnquiryJson(id);
}

export async function restoreEnquiry(id) {
  if (shouldUseDb()) return restoreEnquiryDb(id);
  return restoreEnquiryJson(id);
}

export async function deleteEnquiryPermanently(id) {
  if (shouldUseDb()) return deleteEnquiryPermanentlyDb(id);
  return deleteEnquiryPermanentlyJson(id);
}

// Exposed for migration tooling (safe, no PII logging by callers required)
export async function __readLegacyJsonRecords() {
  return (await readAllJsonRaw()).map(normalizeRecord);
}

// Exposed for focused unit testing of anti-spam helpers.
export {
  normalizeEmail,
  normalizePhone,
  makeFingerprint,
  makeSubmissionFingerprint,
  hashPayload,
  createEnquiryDb,
  IDEMPOTENCY_WINDOW_MS,
  DUPLICATE_WINDOW_MS,
};
