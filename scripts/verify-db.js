#!/usr/bin/env node
const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

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
  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing DATABASE_URL/DATABASE_URL_POOLED");
    process.exit(1);
  }
  const sql = neon(connectionString);

  try {
    // Test 1: Basic connection
    const conn = await sql`SELECT 1 as test`;
    console.log("✅ Connection test:", conn);

    // Test 2: Check table exists
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enquiries'`;
    console.log("✅ Table exists:", tables);

    // Test 3: Check columns
    const columns = await sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'enquiries' ORDER BY ordinal_position`;
    console.log("✅ Columns:", columns);

    // Test 4: Check indexes
    const indexes = await sql`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'enquiries' AND schemaname = 'public'`;
    console.log("✅ Indexes:", indexes);

    // Test 5: Read-only query
    const count = await sql`SELECT COUNT(*)::int as count FROM enquiries`;
    console.log("✅ Read query (count):", count);

    console.log("\n🎉 All connectivity tests passed!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();