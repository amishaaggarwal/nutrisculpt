import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/admin-auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
  res.headers.set("Cache-Control", "no-store, private");
  return res;
}
