import { NextResponse } from "next/server";
import {
  isAdminConfigured,
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/admin-auth";

export async function POST(request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin authentication is not configured. Please set ADMIN_SESSION_SECRET, ADMIN_EMAIL, and ADMIN_PASSWORD_HASH." },
      { status: 503 }
    );
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const configuredEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const configuredHash = String(process.env.ADMIN_PASSWORD_HASH || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const emailOk = email === configuredEmail;
  const passOk = verifyPassword(password, configuredHash);
  if (!emailOk || !passOk) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = createSessionToken(email, process.env.ADMIN_SESSION_SECRET);
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  res.headers.set("Cache-Control", "no-store, private");
  return res;
}
