#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2] || "";
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_POOLED;
  if (!connectionString) {
    console.error("Missing DATABASE_URL/DATABASE_URL_POOLED. Cannot initialize schema.");
    process.exit(1);
  }
  const sql = neon(connectionString);
  const migrationPath = path.join(process.cwd(), "migrations", "001_create_enquiries.sql");
  const ddl = fs.readFileSync(migrationPath, "utf8");
  const statements = ddl
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await sql`${sql.unsafe(stmt)}`;
  }
  console.log(`Schema initialized (${statements.length} statements).`);
}

main().catch((err) => {
  console.error("Schema initialization failed:", err && err.message ? err.message : err);
  process.exit(1);
});
