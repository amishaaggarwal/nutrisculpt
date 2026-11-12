import crypto from "crypto";

const ITERATIONS = 210000;
const KEYLEN = 32;
const DIGEST = "sha256";

function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString("base64");
  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    if (!stored || typeof stored !== "string") return false;
    const parts = stored.split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const expected = parts[3];
    if (!iterations || !salt || !expected) return false;
    const hash = crypto.pbkdf2Sync(password, salt, iterations, KEYLEN, DIGEST).toString("base64");
    return timingSafeEqualStr(hash, expected);
  } catch {
    return false;
  }
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSessionToken(email, secret, ttlSeconds = 60 * 60 * 8) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: email.toLowerCase(), iat: now, exp: now + ttlSeconds };
  const body = base64url(JSON.stringify(payload));
  const sig = sign(body, secret);
  return `${body}.${sig}`;
}

export function verifySessionToken(token, secret) {
  try {
    if (!token || !secret) return null;
    const [body, sig] = String(token).split(".");
    if (!body || !sig) return null;
    const expected = sign(body, secret);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload || !payload.sub || !payload.exp) return null;
    if (Math.floor(Date.now() / 1000) >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isAdminConfigured() {
  return !!(process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH);
}

export function getSessionFromRequest(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const i = c.indexOf("=");
      if (i === -1) return [c.trim(), ""];
      return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1).trim())];
    })
  );
  const token = cookies.ns_admin_session;
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  const payload = verifySessionToken(token, secret);
  if (!payload) return null;
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  if (!adminEmail || payload.sub !== adminEmail) return null;
  return payload;
}

export function requireAdmin(request) {
  if (!isAdminConfigured()) {
    return { ok: false, status: 503, error: "Admin authentication is not configured." };
  }
  const session = getSessionFromRequest(request);
  if (!session) {
    return { ok: false, status: 401, error: "Unauthorized." };
  }
  return { ok: true, session };
}

export const SESSION_COOKIE_NAME = "ns_admin_session";
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}
