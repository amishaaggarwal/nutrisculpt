"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ENQUIRY_SERVICE_OPTIONS } from "@/constants/services";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "consultation_scheduled", label: "Consultation Scheduled" },
  { value: "closed", label: "Closed" },
];

const STATUS_STYLES = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  contacted: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  consultation_scheduled: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  closed: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

const FIVE_CATEGORIES = ENQUIRY_SERVICE_OPTIONS.filter((o) => o.value !== "not-sure");
const CATEGORY_LABELS = Object.fromEntries(ENQUIRY_SERVICE_OPTIONS.map((o) => [o.value, o.label]));

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
function fmtDateShort(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}
function preview(text, n = 80) {
  if (!text) return "—";
  const t = String(text).trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}
function isOverdue(dateStr, status) {
  if (!dateStr || status === "closed") return false;
  const d = new Date(`${dateStr}T23:59:59`);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

export default function DashboardClient({ adminEmail }) {
  const router = useRouter();
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 1, counts: { total: 0, new: 0, contacted: 0, consultation_scheduled: 0 }, byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [editStatus, setEditStatus] = useState("new");
  const [editNotes, setEditNotes] = useState("");
  const [editFollowUp, setEditFollowUp] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", String(page));
      params.set("pageSize", "20");
      const res = await fetch(`/api/admin/enquiries?${params.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) { router.replace("/admin/login"); return; }
      if (!res.ok) { setError(json.error || "Failed to load enquiries."); return; }
      setData(json);
    } catch {
      setError("Failed to load enquiries.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, dateFrom, dateTo, page, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (selected) {
      setEditStatus(selected.status || "new");
      setEditNotes(selected.adminNotes || "");
      setEditFollowUp(selected.nextFollowUpAt || "");
      setSaveMsg(""); setSaveErr("");
    }
  }, [selected]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  };

  const saveDetails = async () => {
    if (!selected) return;
    setSaving(true); setSaveMsg(""); setSaveErr("");
    try {
      const res = await fetch("/api/admin/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, status: editStatus, adminNotes: editNotes, nextFollowUpAt: editFollowUp || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) { router.replace("/admin/login"); return; }
      if (!res.ok) { setSaveErr(json.error || "Unable to save changes."); return; }
      setSaveMsg("Changes saved.");
      setSelected(json.enquiry);
      fetchData();
    } catch {
      setSaveErr("Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const categoryCounts = useMemo(() => {
    const bc = data.byCategory || {};
    return FIVE_CATEGORIES.map((c) => ({ ...c, count: bc[c.value] || 0 }));
  }, [data.byCategory]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">NutriSculpt Enquiry Manager</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Signed in as {adminEmail}</p>
          </div>
          <button onClick={onLogout} className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
            Sign out
          </button>
        </div>

        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Summary (all-time totals)</p>
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total Enquiries", value: data.counts?.total ?? 0 },
            { label: "New Enquiries", value: data.counts?.new ?? 0 },
            { label: "Contacted", value: data.counts?.contacted ?? 0 },
            { label: "Consultations Scheduled", value: data.counts?.consultation_scheduled ?? 0 },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <form onSubmit={onSearchSubmit} className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label htmlFor="search" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
              <div className="flex gap-2">
                <input id="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Name, email or phone" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900" />
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Search</button>
              </div>
            </div>
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select id="status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Service category</label>
              <select id="category" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                <option value="all">All categories</option>
                {ENQUIRY_SERVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="from" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">From date</label>
              <input id="from" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
            </div>
            <div>
              <label htmlFor="to" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">To date</label>
              <input id="to" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
            </div>
          </form>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300" role="alert">{error}</div>}

        <div className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {loading ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">Loading enquiries...</div>
          ) : data.items.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-white">No enquiries found</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">New submissions from the Connect to an Expert form will appear here.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      {["Client", "Contact", "Service", "Primary goal", "Received", "Status", ""].map((h) => (
                        <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.items.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{e.fullName || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {e.email || (e.phoneNumber ? `${e.countryCode || ""} ${e.phoneNumber}`.trim() : "—")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{CATEGORY_LABELS[e.selectedServiceCategory] || e.selectedServiceCategoryLabel || e.selectedServiceCategory || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs">{preview(e.primaryGoal)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{fmtDateShort(e.submittedAt)}</td>
                        <td className="px-4 py-3 text-sm"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[e.status] || STATUS_STYLES.new}`}>{STATUS_OPTIONS.find(s=>s.value===e.status)?.label || "New"}</span></td>
                        <td className="px-4 py-3 text-sm"><button onClick={() => setSelected(e)} className="font-medium text-blue-600 hover:underline dark:text-blue-400">View Details</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 md:hidden">
                {data.items.map((e) => (
                  <div key={e.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{e.fullName || "—"}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{fmtDateShort(e.submittedAt)}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[e.status] || STATUS_STYLES.new}`}>{STATUS_OPTIONS.find(s=>s.value===e.status)?.label || "New"}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{CATEGORY_LABELS[e.selectedServiceCategory] || e.selectedServiceCategoryLabel || "—"}</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{preview(e.primaryGoal, 60)}</p>
                    <button onClick={() => setSelected(e)} className="mt-3 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">View Details</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row">
                <p className="text-sm text-gray-600 dark:text-gray-400">Showing {data.items.length} of {data.total} enquiries</p>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200">Previous</button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Page {data.page} of {data.totalPages}</span>
                  <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200">Next</button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Service interest overview</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Enquiries by service category (all-time, based on submitted categories).</p>
          <div className="mt-4 space-y-3">
            {categoryCounts.map((c) => {
              const max = Math.max(1, ...categoryCounts.map((x) => x.count));
              const pct = Math.round((c.count / max) * 100);
              return (
                <div key={c.value}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-800 dark:text-gray-200">{c.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{c.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button className="absolute inset-0 bg-black/40" aria-label="Close details" onClick={() => setSelected(null)} />
          <div className="relative h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-xl dark:bg-gray-800 sm:p-6" role="dialog" aria-modal="true" aria-label="Enquiry details">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enquiry details</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Received {fmtDate(selected.submittedAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Close</button>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div><dt className="font-medium text-gray-500 dark:text-gray-400">Full name</dt><dd className="text-gray-900 dark:text-white">{selected.fullName || "—"}</dd></div>
              <div><dt className="font-medium text-gray-500 dark:text-gray-400">Service category</dt><dd className="text-gray-900 dark:text-white">{CATEGORY_LABELS[selected.selectedServiceCategory] || selected.selectedServiceCategoryLabel || selected.selectedServiceCategory || "—"}</dd></div>
              <div><dt className="font-medium text-gray-500 dark:text-gray-400">Email</dt><dd className="text-gray-900 dark:text-white">{selected.email ? <a className="text-blue-600 hover:underline dark:text-blue-400" href={`mailto:${selected.email}`}>{selected.email}</a> : "—"}</dd></div>
              <div><dt className="font-medium text-gray-500 dark:text-gray-400">Phone</dt><dd className="text-gray-900 dark:text-white">{selected.phoneNumber ? <a className="text-blue-600 hover:underline dark:text-blue-400" href={`tel:${(selected.countryCode||"")}${selected.phoneNumber}`.replace(/[^+\d]/g, "")}>{`${selected.countryCode || ""} ${selected.phoneNumber}`.trim()}</a> : "—"}</dd></div>
              <div><dt className="font-medium text-gray-500 dark:text-gray-400">Coaching preference</dt><dd className="text-gray-900 dark:text-white">{selected.coachingPreference || "—"}</dd></div>
              <div><dt className="font-medium text-gray-500 dark:text-gray-400">Age group</dt><dd className="text-gray-900 dark:text-white">{selected.ageGroup || "—"}</dd></div>
              <div><dt className="font-medium text-gray-500 dark:text-gray-400">City/location</dt><dd className="text-gray-900 dark:text-white">{selected.city || "—"}</dd></div>
              <div><dt className="font-medium text-gray-500 dark:text-gray-400">Enquiry source</dt><dd className="text-gray-900 dark:text-white">{selected.source || "—"}</dd></div>
              <div><dt className="font-medium text-gray-500 dark:text-gray-400">Submitted</dt><dd className="text-gray-900 dark:text-white">{fmtDate(selected.submittedAt)}</dd></div>
              <div><dt className="font-medium text-gray-500 dark:text-gray-400">Last updated</dt><dd className="text-gray-900 dark:text-white">{fmtDate(selected.updatedAt)}</dd></div>
              {selected.contactedAt && <div className="sm:col-span-2"><dt className="font-medium text-gray-500 dark:text-gray-400">First contacted</dt><dd className="text-gray-900 dark:text-white">{fmtDate(selected.contactedAt)}</dd></div>}
              <div className="sm:col-span-2"><dt className="font-medium text-gray-500 dark:text-gray-400">Primary goal / message</dt><dd className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-900 dark:bg-gray-900/40 dark:text-white">{selected.primaryGoal || "—"}</dd></div>
            </dl>

            <div className="mt-6 border-t border-gray-200 pt-5 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Follow-up management</h3>
              <div className="mt-3 grid gap-4">
                <div>
                  <label htmlFor="d-status" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select id="d-status" value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Status is managed manually and does not imply emails were sent or bookings made.</p>
                </div>
                <div>
                  <label htmlFor="d-followup" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Next follow-up date (optional)</label>
                  <input id="d-followup" type="date" value={editFollowUp} onChange={(e) => setEditFollowUp(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                  {isOverdue(editFollowUp, editStatus) && <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">This follow-up date is overdue.</p>}
                </div>
                <div>
                  <label htmlFor="d-notes" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Private internal notes</label>
                  <textarea id="d-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} maxLength={2000} rows={5} placeholder="Internal notes (visible only to authorized administrators). Avoid sensitive medical information." className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                  <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400"><span>Not shown publicly or sent in emails.</span><span>{editNotes.length}/2000</span></div>
                </div>
                {saveErr && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{saveErr}</div>}
                {saveMsg && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">{saveMsg}</div>}
                <div className="flex gap-3">
                  <button onClick={saveDetails} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button>
                  <button onClick={() => setSelected(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Back to list</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
