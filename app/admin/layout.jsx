import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isAdminConfigured, verifySessionToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  if (!isAdminConfigured()) {
    // allow login page to show configuration message, but block dashboard usage generally via page checks
  }
  return <>{children}</>;
}

export async function getAdminSession() {
  if (!isAdminConfigured()) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get("ns_admin_session")?.value;
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  const payload = verifySessionToken(token, secret);
  if (!payload) return null;
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  if (!adminEmail || payload.sub !== adminEmail) return null;
  return payload;
}
