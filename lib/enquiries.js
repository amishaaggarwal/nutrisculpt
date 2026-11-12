import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

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
  // safe mapping for legacy/meaningful values
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

function normalizeRecord(raw) {
  const submittedAt = raw.submittedAt || raw.createdAt || raw.created_at || raw.date || null;
  const updatedAt = raw.updatedAt || raw.updated_at || submittedAt || nowIso();
  const status = normalizeStatus(raw.status || raw.enquiryStatus || raw.enquiry_status);
  const contactedAt = raw.contactedAt || raw.contacted_at || null;
  return {
    id: safeString(raw.id || "", 100),
    fullName: safeString(raw.fullName || raw.name || "", 120),
    email: safeString(raw.email || "", 254).toLowerCase(),
    countryCode: safeString(raw.countryCode || "", 5),
    phoneNumber: safeString(raw.phoneNumber || raw.contact || raw.phone || "", 30),
    selectedServiceCategory: safeString(raw.selectedServiceCategory || raw.serviceCategory || raw.category || "not-sure", 80) || "not-sure",
    selectedServiceCategoryLabel: safeString(raw.selectedServiceCategoryLabel || raw.serviceCategoryLabel || "", 120),
    primaryGoal: safeString(raw.primaryGoal || raw.goals || raw.reason || raw.message || "", 500),
    coachingPreference: safeString(raw.coachingPreference || "", 80),
    ageGroup: safeString(raw.ageGroup || "", 40),
    city: safeString(raw.city || "", 120),
    source: safeString(raw.source || raw.entrySource || "direct", 40),
    submittedAt: submittedAt ? safeString(submittedAt, 40) : null,
    status,
    adminNotes: safeString(raw.adminNotes || raw.admin_notes || "", 2000),
    nextFollowUpAt: raw.nextFollowUpAt || raw.next_follow_up_at || null,
    contactedAt: contactedAt ? safeString(contactedAt, 40) : null,
    updatedAt: safeString(updatedAt, 40),
  };
}

async function ensureStore() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]\n", "utf8");
  }
}

async function readAllRaw() {
  await ensureStore();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(records) {
  await ensureStore();
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(records, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

export async function createEnquiry(payload) {
  const records = await readAllRaw();
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
  await writeAll(records);
  return record;
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

export async function listEnquiries({ search = "", status = "all", category = "all", dateFrom = "", dateTo = "", page = 1, pageSize = 20 } = {}) {
  const all = (await readAllRaw()).map(normalizeRecord);
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

export async function getEnquiryById(id) {
  const all = (await readAllRaw()).map(normalizeRecord);
  return all.find((r) => r.id === id) || null;
}

export async function updateEnquiry(id, updates) {
  const records = await readAllRaw();
  const idx = records.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  const current = normalizeRecord(records[idx]);
  const now = nowIso();

  const next = { ...current };
  if (updates.status != null) {
    const ns = normalizeStatus(updates.status);
    if (!STATUS_VALUES.includes(ns)) throw new Error("Invalid status");
    next.status = ns;
    if (ns === "contacted" && !current.contactedAt) {
      next.contactedAt = now;
    } else {
      next.contactedAt = current.contactedAt || null;
    }
  }
  if (Object.prototype.hasOwnProperty.call(updates, "adminNotes")) {
    next.adminNotes = safeString(updates.adminNotes || "", 2000);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "nextFollowUpAt")) {
    const v = updates.nextFollowUpAt;
    if (!v) {
      next.nextFollowUpAt = null;
    } else {
      const d = new Date(v);
      next.nextFollowUpAt = Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
  }
  next.updatedAt = now;

  // Preserve original submitted visitor answers/fields; only admin fields + updatedAt changed
  records[idx] = { ...records[idx], ...next };
  // ensure we don't drop unknown original fields but do keep normalized admin fields
  records[idx].id = current.id || records[idx].id;
  records[idx].status = next.status;
  records[idx].adminNotes = next.adminNotes;
  records[idx].nextFollowUpAt = next.nextFollowUpAt;
  records[idx].contactedAt = next.contactedAt;
  records[idx].updatedAt = next.updatedAt;
  await writeAll(records);
  return normalizeRecord(records[idx]);
}
