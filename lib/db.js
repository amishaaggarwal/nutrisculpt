import { neon } from "@neondatabase/serverless";

let _sql;

function pickConnectionString() {
  // Prefer pooled for serverless app queries. Fall back to direct if pooled missing.
  return process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL || "";
}

export function getDatabaseConfig() {
  const pooled = process.env.DATABASE_URL_POOLED || "";
  const direct = process.env.DATABASE_URL || "";
  const connectionString = pickConnectionString();
  return {
    hasPooled: !!pooled,
    hasDirect: !!direct,
    hasAny: !!connectionString,
    preferred: pooled ? "DATABASE_URL_POOLED" : direct ? "DATABASE_URL" : "none",
  };
}

export function getSql() {
  if (_sql) return _sql;
  const connectionString = pickConnectionString();
  if (!connectionString) {
    const err = new Error("Database is not configured. Set DATABASE_URL_POOLED or DATABASE_URL.");
    err.code = "DB_CONFIG_MISSING";
    throw err;
  }
  _sql = neon(connectionString);
  return _sql;
}

export async function dbQuery(strings, ...values) {
  const sql = getSql();
  return sql(strings, ...values);
}
