import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { getSql, getDatabaseConfig } from "@/lib/db";

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

async function createEnquiryDb(payload) {
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
      admin_notes, next_follow_up_at, contacted_at, created_at, updated_at
    ) VALUES (
      ${record.id}, ${record.fullName}, ${record.email}, ${record.countryCode}, ${record.phoneNumber},
      ${record.selectedServiceCategory}, ${record.selectedServiceCategoryLabel},
      ${record.primaryGoal}, ${record.primaryGoalCategory}, ${record.coachingPreference},
      ${record.ageGroup}, ${record.city}, ${record.source}, ${record.submittedAt}, ${record.status},
      ${record.adminNotes}, ${record.nextFollowUpAt}, ${record.contactedAt}, ${record.updatedAt}, ${record.updatedAt}
    )
    RETURNING *
  `;
  return rowToRecord(rows[0]);
}

async function createEnquiryJson(payload) {
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

export async function createEnquiry(payload) {
  if (shouldUseDb()) return createEnquiryDb(payload);
  return createEnquiryJson(payload);
}

function buildWhereParts({ search = "", status = "all", category = "all", dateFrom = "", dateTo = "" }) {
  const clauses = ["1=1"];
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
  return { where: clauses.join(" AND "), params, nextIndex: i };
}

async function listEnquiriesDb({ search = "", status = "all", category = "all", dateFrom = "", dateTo = "", page = 1, pageSize = 20 } = {}) {
  const sql = getSql();
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (p - 1) * ps;
  const { where, params } = buildWhereParts({ search, status, category, dateFrom, dateTo });

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
  `;
  const byCatQuery = `SELECT selected_service_category AS category, COUNT(*)::int AS count FROM enquiries GROUP BY selected_service_category`;

  const [itemRows, totalRows, countRows, byCatRows] = await Promise.all([
    sql(itemsQuery, [...params, ps, offset]),
    sql(totalQuery, params),
    sql(countsQuery),
    sql(byCatQuery),
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

export async function getEnquiryById(id) {
  if (shouldUseDb()) {
    const sql = getSql();
    const rows = await sql`SELECT * FROM enquiries WHERE id = ${String(id)} LIMIT 1`;
    return rows[0] ? rowToRecord(rows[0]) : null;
  }
  const all = (await readAllJsonRaw()).map(normalizeRecord);
  return all.find((r) => r.id === id) || null;
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

// Exposed for migration tooling (safe, no PII logging by callers required)
export async function __readLegacyJsonRecords() {
  return (await readAllJsonRaw()).map(normalizeRecord);
}
