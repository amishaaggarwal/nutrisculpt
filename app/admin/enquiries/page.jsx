import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isAdminConfigured, verifySessionToken } from "@/lib/admin-auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "NutriSculpt Enquiry Manager" };

async function getSession() {
  if (!isAdminConfigured()) return { configured: false, session: null };
  const cookieStore = await cookies();
  const token = cookieStore.get("ns_admin_session")?.value;
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  const payload = verifySessionToken(token, secret);
  if (!payload) return { configured: true, session: null };
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  if (!adminEmail || payload.sub !== adminEmail) return { configured: true, session: null };
  return { configured: true, session: payload };
}

export default async function AdminEnquiriesPage() {
  const { configured, session } = await getSession();
  if (!configured) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
        <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-800 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin configuration required</h1>
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            The enquiry dashboard cannot be enabled because administrator authentication is not fully configured.
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
            <li>Set <code>ADMIN_SESSION_SECRET</code> to a strong random secret.</li>
            <li>Set <code>ADMIN_EMAIL</code> to the authorized administrator email.</li>
            <li>Set <code>ADMIN_PASSWORD_HASH</code> (generate with <code>node scripts/generate-admin-hash.js &quot;your-password&quot;</code>).</li>
          </ul>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Configure these server-side environment variables and restart the application. No dashboard data is exposed.</p>
        </div>
      </div>
    );
  }
  if (!session) {
    redirect("/admin/login");
  }
  return <DashboardClient adminEmail={session.sub} />;
}
