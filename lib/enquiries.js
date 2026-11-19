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
  hmac.update(parts.filter((p) => p != null).join("|"));
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

async function checkIdempotencyKey(sql, key) {
  const rows = await sql`
    SELECT enquiry_id, payload_hash FROM enquiry_idempotency_keys
    WHERE idempotency_key = ${String(key)}
    LIMIT 1
  `;
  return rows[0] || null;
}

async function recordIdempotencyKey(sql, key, enquiryId, payloadHash) {
  const rows = await sql`
    INSERT INTO enquiry_idempotency_keys (idempotency_key, enquiry_id, payload_hash)
    VALUES (${String(key)}, ${String(enquiryId)}, ${String(payloadHash)})
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING enquiry_id, payload_hash
  `;
  return rows[0] || null;
}

async function checkRapidDuplicate(sql, fingerprint) {
  const cutoff = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
  const rows = await sql`
    SELECT 1 FROM enquiry_submission_fingerprints
    WHERE fingerprint = ${String(fingerprint)}
      AND created_at >= ${cutoff}::timestamptz
    LIMIT 1
  `;
  return rows.length > 0;
}

async function recordFingerprint(sql, fingerprint) {
  await sql`
    INSERT INTO enquiry_submission_fingerprints (fingerprint)
    VALUES (${String(fingerprint)})
    ON CONFLICT (fingerprint) DO NOTHING
  `;
}

async function cleanupOldFingerprints(sql) {
  const cutoff = new Date(Date.now() - DUPLICATE_WINDOW_MS * 3).toISOString();
  await sql`
    DELETE FROM enquiry_submission_fingerprints
    WHERE created_at < ${cutoff}::timestamptz
  `;
}

function hashPayload(payload) {
  const sorted = {};
  Object.keys(payload)
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

function shouldUseDb() {
  const { hasAny } = getDatabaseConfig();
  if (hasAny) return true;
  if (process.env.NODE_ENV === "production") {
    const err = new Error("Database is not configured for production.");
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

async function createEnquiryDb(payload, { idempotencyKey, fingerprintSecret } = {}) {
  const sql = getSql();
  const now = nowIso();
  const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");

  const record = normalizeRecord({
    ...payload,
    id,
    submittedAt: payload.submittedAt || now,
    status: "new",
    adminNotes: "",
    nextFollowUpAt: null,
    contactedAt: null,
    updatedAt: now,
  });
  const payloadHash = hashPayload(payload);

  // --- Atomic submission within a Neon transaction ---
  // All operations below run in a single database transaction. If any step
  // fails, the entire transaction rolls back, preventing partial state:
  //   - enquiry saved without idempotency key (duplicate slip-through)
  //   - fingerprint reserved but enquiry insert failed (false positive block)
  //   - idempotency key recorded but enquiry missing (orphaned key)
  try {
    return await sql.transaction(async (tx) => {
      // --- Idempotency: atomic check-and-claim ---
      // A single INSERT ... ON CONFLICT DO NOTHING ensures only one concurrent
      // request can claim the key. RETURNING tells us whether we won the race.
      if (idempotencyKey) {
        const claimed = await tx`
          INSERT INTO enquiry_idempotency_keys (idempotency_key, enquiry_id, payload_hash)
          VALUES (${String(idempotencyKey)}, ${String(id)}, ${String(payloadHash)})
          ON CONFLICT (idempotency_key) DO NOTHING
          RETURNING enquiry_id, payload_hash
        `;
        if (claimed[0]) {
          // We claimed the key: proceed to insert the enquiry below.
        } else {
          // Key already exists: check whether the payload matches.
          const existing = await tx`
            SELECT enquiry_id, payload_hash FROM enquiry_idempotency_keys
            WHERE idempotency_key = ${String(idempotencyKey)}
            LIMIT 1
          `;
          if (existing[0]) {
            if (existing[0].payload_hash === payloadHash) {
              // Same logical submission already accepted: return the original record.
              const rows = await tx`
                SELECT * FROM enquiries
                WHERE id = ${String(existing[0].enquiry_id)} AND deleted_at IS NULL
                LIMIT 1
              `;
              if (rows[0]) return rowToRecord(rows[0]);
            }
            // Same token, different payload: refuse to avoid silent overwrite.
            const err = new Error("Idempotency key reused with different payload.");
            err.code = "IDEMPOTENCY_CONFLICT";
            err.status = 409;
            throw err;
          }
        }
      }

      // --- Rapid identical-enquiry detection (10-minute window) ---
      if (fingerprintSecret) {
        const fingerprint = makeSubmissionFingerprint(
          fingerprintSecret,
          payload.email,
          payload.countryCode,
          payload.phoneNumber,
          payload.selectedServiceCategory,
          payload.primaryGoal,
        );
        const cutoff = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
        const dupRows = await tx`
          SELECT 1 FROM enquiry_submission_fingerprints
          WHERE fingerprint = ${String(fingerprint)}
            AND created_at >= ${cutoff}::timestamptz
          LIMIT 1
        `;
        if (dupRows.length > 0) {
          const err = new Error("Duplicate enquiry detected within the rate window.");
          err.code = "DUPLICATE_ENQUIRY";
          err.status = 429;
          throw err;
        }
      }

      // --- Insert the enquiry ---
      const rows = await tx`
        INSERT INTO enquiries (
          id, full_name, email, country_code, phone_number,
          selected_service_category, selected_service_category_label,
          primary_goal, primary_goal_category, coaching_preference,
          age_group, city, source, submitted_at, status,
          admin_notes, next_follow_up_at, contacted_at, created_at, updated_at, deleted_at
        ) VALUES (
          ${record.id}, ${record.fullName}, ${record.email}, ${record.countryCode}, ${record.phoneNumber},
          ${record.selectedServiceCategory}, ${record.selectedServiceCategoryLabel},
          ${record.primaryGoal}, ${record.primaryGoalCategory}, ${record.coachingPreference},
          ${record.ageGroup}, ${record.city}, ${record.source}, ${record.submittedAt}, ${record.status},
          ${record.adminNotes}, ${record.nextFollowUpAt}, ${record.contactedAt}, ${record.updatedAt}, ${record.updatedAt}, ${record.deletedAt || null}
        )
        RETURNING *
      `;
      const inserted = rowToRecord(rows[0]);

      // --- Record idempotency key (claim was already checked above) ---
      if (idempotencyKey) {
        await tx`
          INSERT INTO enquiry_idempotency_keys (idempotency_key, enquiry_id, payload_hash)
          VALUES (${String(idempotencyKey)}, ${String(inserted.id)}, ${String(payloadHash)})
          ON CONFLICT (idempotency_key) DO NOTHING
        `;
      }

      // --- Record fingerprint (renews window on conflict) ---
      if (fingerprintSecret) {
        const fingerprint = makeSubmissionFingerprint(
          fingerprintSecret,
          payload.email,
          payload.countryCode,
          payload.phoneNumber,
          payload.selectedServiceCategory,
          payload.primaryGoal,
        );
        await tx`
          INSERT INTO enquiry_submission_fingerprints (fingerprint)
          VALUES (${String(fingerprint)})
          ON CONFLICT (fingerprint) DO UPDATE SET created_at = EXCLUDED.created_at
        `;
        // Cleanup expired fingerprints (older than 3x duplicate window)
        await tx`
          DELETE FROM enquiry_submission_fingerprints
          WHERE created_at < ${new Date(Date.now() - DUPLICATE_WINDOW_MS * 3).toISOString()}::timestamptz
        `;
      }

      return inserted;
    });
  } catch (err) {
    // --- Graceful degradation when migration 003 has not been applied ---
    // The idempotency/fingerprint tables may not exist yet. In that case,
    // proceed with the enquiry insert alone (no duplicate protection) so the
    // public API remains operational. Log a clear warning so the operator
    // knows abuse protection is not active.
    const msg = String(err.message || err);
      if (msg.includes('relation "enquiry_idempotency_keys" does not exist') ||
        msg.includes('relation "enquiry_submission_fingerprints" does not exist') ||
        msg.includes('relation "enquiry_submission_fingerprints" does not exist')) {
        // eslint-disable-next-line no-console
        console.warn(
        "[enquiry] Anti-spam tables not found (migration 003 not applied). " +
        "Proceeding with unprotected insert. Apply migrations/003_add_idempotency.sql."
      );
      return await createEnquiryDbUnprotected(payload);
    }
    throw err;
  }
}

// Fallback insert used only when anti-spam tables are missing (pre-migration).
// No idempotency or duplicate protection is available in this mode.
async function createEnquiryDbUnprotected(payload) {
  const sql = getSql();
  const now = nowIso();
  const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
  const record = normalizeRecord({
    ...payload,
    id,
    submittedAt: payload.submittedAt || now,
    status: "new",
    adminNotes: "",
    nextFollowUpAt: null,
    contactedAt: null,
    updatedAt: now,
  });
  const rows = await sql`
    INSERT INTO enquiries (
      id, full_name, email, country_code, phone_number,
      selected_service_category, selected_service_category_label,
      primary_goal, primary_goal_category, coaching_preference,
      age_group, city, source, submitted_at, status,
      admin_notes, next_follow_up_at, contacted_at, created_at, updated_at, deleted_at
    ) VALUES (
      ${record.id}, ${record.fullName}, ${record.email}, ${record.countryCode}, ${record.phoneNumber},
      ${record.selectedServiceCategory}, ${record.selectedServiceCategoryLabel},
      ${record.primaryGoal}, ${record.primaryGoalCategory}, ${record.coachingPreference},
      ${record.ageGroup}, ${record.city}, ${record.source}, ${record.submittedAt}, ${record.status},
      ${record.adminNotes}, ${record.nextFollowUpAt}, ${record.contactedAt}, ${record.updatedAt}, ${record.updatedAt}, ${record.deletedAt || null}
    )
    RETURNING *
  `;
  return rowToRecord(rows[0]);
}

async function createEnquiryJson(payload, _options = {}) {
  const records = await readAllJsonRaw();
  const now = nowIso();
  const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
  const record = normalizeRecord({
    ...payload,
    id,
    submittedAt: payload.submittedAt || now,
    status: "new",
    adminNotes: "",
    nextFollowUpAt: null,
    contactedAt: null,
    updatedAt: now,
  });
  record.id = id;
  records.push(record);
  await writeAllJson(records);
  return record;
}

export async function createEnquiry(payload, { idempotencyKey, fingerprintSecret } = {}) {
  if (shouldUseDb()) return createEnquiryDb(payload, { idempotencyKey, fingerprintSecret });
  return createEnquiryJson(payload, { idempotencyKey, fingerprintSecret });
}

function buildWhereParts({ search = "", status = "all", category = "all", dateFrom = "", dateTo = "", trashed = false }) {
  const clauses = ["1=1"];
  const params = [];
  let i = 0;
  i += 1; clauses.push(`deleted_at ${trashed ? "IS NOT NULL" : "IS NULL"}`);
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
  return { where: clauses.join(" AND "), params, nextIndex: i };
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
    sql.query(countsQuery),
    sql.query(byCatQuery),
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

async function listEnquiriesJson({ search = "", status = "all", category = "all", dateFrom = "", dateTo = "", page = 1, pageSize = 20 } = {}) {
  const all = (await readAllJsonRaw()).map(normalizeRecord);
  const filtered = all.filter((r) => {
    if (status && status !== "all" && r.status !== status) return false;
    if (category && category !== "all" && r.selectedServiceCategory !== category) return false;
    if (!matchesSearch(r, search)) return false;
    if (!matchesDate(r, dateFrom, dateTo)) return false;
    return true;
  });
  filtered.sort((a, b) => {
    const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return tb - ta;
  });
  const total = filtered.length;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const start = (p - 1) * ps;
  const items = filtered.slice(start, start + ps);

  const counts = { total: all.length, new: 0, contacted: 0, consultation_scheduled: 0, closed: 0 };
  const byCategory = {};
  for (const r of all) {
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
  checkIdempotencyKey,
  recordIdempotencyKey,
  checkRapidDuplicate,
  recordFingerprint,
  cleanupOldFingerprints,
  createEnquiryDb,
  IDEMPOTENCY_WINDOW_MS,
  DUPLICATE_WINDOW_MS,
};
