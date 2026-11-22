import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  listEnquiries,
  updateEnquiry,
  trashEnquiry,
  restoreEnquiry,
  deleteEnquiryPermanently,
  STATUS_VALUES,
} from "@/lib/enquiries";
import { ENQUIRY_CATEGORY_ALLOWLIST } from "@/constants/services";

const TRASH_ACTIONS = new Set(["trash", "restore", "delete"]);

export async function GET(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const category = searchParams.get("category") || "all";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const trashed = searchParams.get("trashed") === "1";

  if (!trashed && status !== "all" && !STATUS_VALUES.includes(status)) {
    return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
  }
  if (category !== "all" && !ENQUIRY_CATEGORY_ALLOWLIST.has(category)) {
    return NextResponse.json({ error: "Invalid category filter." }, { status: 400 });
  }

  const data = await listEnquiries({
    search,
    status,
    category,
    dateFrom,
    dateTo,
    page,
    pageSize,
    trashed,
  });
  const res = NextResponse.json(data);
  res.headers.set("Cache-Control", "no-store, private");
  return res;
}

export async function PATCH(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.id) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const updates = {};
  if (body.status != null) {
    if (!STATUS_VALUES.includes(String(body.status))) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (Object.prototype.hasOwnProperty.call(body, "adminNotes")) {
    if (typeof body.adminNotes !== "string" || body.adminNotes.length > 2000) {
      return NextResponse.json({ error: "Invalid notes." }, { status: 400 });
    }
    updates.adminNotes = body.adminNotes;
  }
  if (Object.prototype.hasOwnProperty.call(body, "nextFollowUpAt")) {
    const v = body.nextFollowUpAt;
    if (v !== null && v !== "" && typeof v !== "string") {
      return NextResponse.json({ error: "Invalid follow-up date." }, { status: 400 });
    }
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return NextResponse.json({ error: "Invalid follow-up date." }, { status: 400 });
    }
    updates.nextFollowUpAt = v || null;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates provided." }, { status: 400 });
  }
  const updated = await updateEnquiry(String(body.id), updates);
  if (!updated) {
    return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
  }
  const res = NextResponse.json({ success: true, enquiry: updated });
  res.headers.set("Cache-Control", "no-store, private");
  return res;
}

export async function DELETE(request) {
  const auth = requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.id || typeof body.id !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const action = body.action;
  if (!action || !TRASH_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }
  const id = String(body.id);

  let result;
  if (action === "trash") {
    result = await trashEnquiry(id);
    if (!result) {
      return NextResponse.json(
        { error: "Enquiry not found or not eligible for Trash (must be active and Closed)." },
        { status: 400 },
      );
    }
    const res = NextResponse.json({ success: true, action: "trashed", enquiry: result });
    res.headers.set("Cache-Control", "no-store, private");
    return res;
  }
  if (action === "restore") {
    result = await restoreEnquiry(id);
    if (!result) {
      return NextResponse.json({ error: "Enquiry not found or not in Trash." }, { status: 400 });
    }
    const res = NextResponse.json({ success: true, action: "restored", enquiry: result });
    res.headers.set("Cache-Control", "no-store, private");
    return res;
  }
  // action === "delete"
  result = await deleteEnquiryPermanently(id);
  if (!result) {
    return NextResponse.json({ error: "Enquiry not found or not in Trash." }, { status: 400 });
  }
  const res = NextResponse.json({ success: true, action: "deleted", enquiry: result });
  res.headers.set("Cache-Control", "no-store, private");
  return res;
}
