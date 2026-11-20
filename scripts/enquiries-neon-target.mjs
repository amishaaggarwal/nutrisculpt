import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const PROJECT_ID = "ancient-recipe-02752976";
const SOURCE_BRANCH_ID = "br-dawn-forest-a141h1n9";
const TEST_BRANCH_NAME = "nutrisculpt-03b3-schema-only";
const NEON_API = "https://console.neon.tech/api/v2";
const TABLES = ["enquiries", "enquiry_idempotency_keys", "enquiry_submission_fingerprints"];
const PROTECTION_TABLES = TABLES.slice(1);
const verifiedClients = new WeakSet();

export class TestTargetError extends Error {}

function requireTestEnv(name) {
  const value = process.env[name];
  if (!value?.trim()) throw new TestTargetError(`${name} is required in the test process environment.`);
  return value;
}

function readConfiguration() {
  const connectionString = requireTestEnv("TEST_DATABASE_URL");
  const projectId = requireTestEnv("TEST_NEON_PROJECT_ID");
  const branchId = requireTestEnv("TEST_NEON_BRANCH_ID");
  const host = requireTestEnv("TEST_NEON_ENDPOINT_HOST");
  const database = requireTestEnv("TEST_DATABASE_NAME");
  const apiKey = requireTestEnv("TEST_NEON_API_KEY");

  if (projectId !== PROJECT_ID) {
    throw new TestTargetError("TEST_NEON_PROJECT_ID must identify the approved NutriSculpt test project.");
  }
  if (!/^br-[a-z0-9-]+$/.test(branchId) || branchId === SOURCE_BRANCH_ID) {
    throw new TestTargetError("TEST_NEON_BRANCH_ID must identify the new test branch, distinct from the schema source.");
  }
  const endpointId = /^(ep-[a-z0-9-]+)\.(?:[a-z0-9-]+\.)+neon\.tech$/.exec(host)?.[1];
  if (!endpointId || endpointId.endsWith("-pooler")) {
    throw new TestTargetError("TEST_NEON_ENDPOINT_HOST must be the direct Neon compute hostname.");
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(database) || database === "." || database === "..") {
    throw new TestTargetError("TEST_DATABASE_NAME must be the approved Neon database name.");
  }

  let url;
  let databaseFromUrl;
  try {
    url = new URL(connectionString);
    databaseFromUrl = decodeURIComponent(url.pathname.slice(1));
  } catch {
    throw new TestTargetError("TEST_DATABASE_URL is not a valid PostgreSQL URL.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || url.hostname !== host ||
      !url.username || !url.password || (url.port && url.port !== "5432") ||
      url.hash || databaseFromUrl !== database) {
    throw new TestTargetError("TEST_DATABASE_URL must match the verified host and database and include test credentials.");
  }
  const sslMode = url.searchParams.get("sslmode");
  const channelBinding = url.searchParams.get("channel_binding");
  const optionNames = [...url.searchParams.keys()];
  if (!["require", "verify-full"].includes(sslMode) || (channelBinding !== null && channelBinding !== "require") ||
      optionNames.some((name) => !["sslmode", "channel_binding"].includes(name)) ||
      new Set(optionNames).size !== optionNames.length) {
    throw new TestTargetError("TEST_DATABASE_URL requires TLS and cannot contain routing overrides or duplicate options.");
  }
  return { connectionString, projectId, branchId, endpointId, host, database, apiKey };
}

async function readNeonMetadata(path, apiKey) {
  let response;
  try {
    response = await fetch(`${NEON_API}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new TestTargetError("Neon metadata verification could not reach the management API.");
  }
  if (!response.ok) throw new TestTargetError(`Neon metadata verification returned HTTP ${response.status}.`);
  try {
    return await response.json();
  } catch {
    throw new TestTargetError("Neon metadata verification returned invalid JSON.");
  }
}

async function verifyNeonMetadata({ projectId, branchId, endpointId, host, database, apiKey }) {
  const projectPath = `/projects/${projectId}`;
  const branchPath = `${projectPath}/branches/${branchId}`;
  const [branchResponse, endpointResponse, databaseResponse] = await Promise.all([
    readNeonMetadata(branchPath, apiKey),
    readNeonMetadata(`${projectPath}/endpoints/${endpointId}`, apiKey),
    readNeonMetadata(`${branchPath}/databases/${encodeURIComponent(database)}`, apiKey),
  ]);
  const branch = branchResponse?.branch;
  if (branch?.id !== branchId || branch.project_id !== projectId || branch.name !== TEST_BRANCH_NAME ||
      branch.default !== false || branch.protected || branch.parent_id ||
      branch.init_source !== "schema-only" || branch.current_state !== "ready") {
    throw new TestTargetError("Neon metadata did not confirm the approved, ready, non-default schema-only test branch.");
  }
  const endpoint = endpointResponse?.endpoint;
  if (endpoint?.id !== endpointId || endpoint.host !== host || endpoint.project_id !== projectId ||
      endpoint.branch_id !== branchId || endpoint.type !== "read_write" || endpoint.disabled) {
    throw new TestTargetError("The direct writable Neon endpoint does not match the approved test branch.");
  }
  const found = databaseResponse?.database;
  if (found?.name !== database || found.branch_id !== branchId) {
    throw new TestTargetError("Neon metadata did not confirm the approved database on the test branch.");
  }
}

function assertVerified(sql) {
  if (!verifiedClients.has(sql)) throw new TestTargetError("The database client has not passed test-target verification.");
}

async function getTables(sql) {
  const tables = await sql`
    SELECT c.relname AS name, c.relkind AS kind
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = ANY(${TABLES}::text[])
  `;
  if (tables.some(({ kind }) => kind !== "r")) {
    throw new TestTargetError("An enquiry relation on the isolated target is not an ordinary table.");
  }
  return new Set(tables.map(({ name }) => name));
}

async function assertEmptyTables(sql, tables) {
  for (const table of TABLES) {
    if (!tables.has(table)) continue;
    const [{ occupied }] = await sql.query(`SELECT EXISTS (SELECT 1 FROM public.${table}) AS occupied`);
    if (occupied) throw new TestTargetError(`The test target has rows in ${table}. Use an empty isolated target.`);
  }
}

export async function connectTestTarget() {
  const config = readConfiguration();
  await verifyNeonMetadata(config);
  const { connectionString, branchId, host, database } = config;
  const sql = neon(connectionString, { fetchOptions: { redirect: "error" } });
  try {
    const [identity] = await sql`
      SELECT pg_catalog.current_database() AS db, pg_catalog.current_schema() AS schema
    `;
    if (identity?.db !== database || identity.schema !== "public") {
      throw new TestTargetError("The connected database name or active schema does not match the approved target.");
    }
    await assertEmptyTables(sql, await getTables(sql));
  } catch (error) {
    if (error instanceof TestTargetError) throw error;
    throw new TestTargetError("The test database could not be reached or checked through its verified endpoint.");
  }
  verifiedClients.add(sql);
  return { sql, connectionString, branchId, host, database };
}

export async function confirmEmptyTestTarget(sql) {
  assertVerified(sql);
  await assertEmptyTables(sql, await getTables(sql));
}

const BASE_TYPES = {
  id: "text",
  full_name: "text",
  email: "text",
  country_code: "text",
  phone_number: "text",
  selected_service_category: "text",
  selected_service_category_label: "text",
  primary_goal: "text",
  primary_goal_category: "text",
  coaching_preference: "text",
  age_group: "text",
  city: "text",
  source: "text",
  submitted_at: "timestamp with time zone",
  status: "text",
  admin_notes: "text",
  next_follow_up_at: "date",
  contacted_at: "timestamp with time zone",
  created_at: "timestamp with time zone",
  updated_at: "timestamp with time zone",
};
const BASE_NULLABLE = new Set(["submitted_at", "next_follow_up_at", "contacted_at", "deleted_at"]);
const KEY_TYPES = {
  idempotency_key: "text",
  enquiry_id: "text",
  payload_hash: "text",
  created_at: "timestamp with time zone",
};
const FINGERPRINT_TYPES = {
  fingerprint: "text",
  created_at: "timestamp with time zone",
};

async function getColumns(sql, table) {
  const rows = await sql`
    SELECT a.attname AS name, pg_catalog.format_type(a.atttypid, a.atttypmod) AS type,
           a.attnotnull AS not_null, pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS default_value
    FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
    WHERE n.nspname = 'public' AND c.relname = ${table} AND a.attnum > 0 AND NOT a.attisdropped
  `;
  return new Map(rows.map((row) => [row.name, row]));
}

function assertColumns(table, columns, expected, nullable) {
  for (const [name, type] of Object.entries(expected)) {
    const column = columns.get(name);
    if (column?.type !== type || column.not_null !== !nullable.has(name)) {
      throw new TestTargetError(`The test schema has an incompatible ${table}.${name} column.`);
    }
  }
}

async function getConstraints(sql, table) {
  return sql`
    SELECT con.contype AS type, con.convalidated AS validated, con.condeferrable AS deferrable,
           con.confdeltype AS on_delete, ref.relname AS reference_table, ref_ns.nspname AS reference_schema,
           ARRAY(
             SELECT a.attname::text FROM unnest(con.conkey) WITH ORDINALITY k(num, ord)
             JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.num
             ORDER BY k.ord
           ) AS columns,
           ARRAY(
             SELECT a.attname::text FROM unnest(con.confkey) WITH ORDINALITY k(num, ord)
             JOIN pg_catalog.pg_attribute a ON a.attrelid = ref.oid AND a.attnum = k.num
             ORDER BY k.ord
           ) AS reference_columns
    FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_catalog.pg_class ref ON ref.oid = con.confrelid
    LEFT JOIN pg_catalog.pg_namespace ref_ns ON ref_ns.oid = ref.relnamespace
    WHERE n.nspname = 'public' AND c.relname = ${table} AND con.contype IN ('p', 'f')
  `;
}

function isSingleColumn(columns, expected) {
  return columns?.length === 1 && columns[0] === expected;
}

function assertPrimaryKey(constraints, table, column) {
  if (!constraints.some((key) => key.type === "p" && key.validated && !key.deferrable &&
    isSingleColumn(key.columns, column))) {
    throw new TestTargetError(`The test schema is missing the expected primary key on ${table}.`);
  }
}

async function getIndex(sql, table, indexName) {
  const [index] = await sql`
    SELECT pg_catalog.pg_get_indexdef(i.indexrelid, 1, true) AS indexed_column,
           i.indisvalid AND i.indisready AND NOT i.indisunique AND i.indnkeyatts = 1 AND i.indnatts = 1
             AND i.indpred IS NULL AND i.indexprs IS NULL AND am.amname = 'btree' AS usable
    FROM pg_catalog.pg_index i
    JOIN pg_catalog.pg_class c ON c.oid = i.indrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_class idx ON idx.oid = i.indexrelid
    JOIN pg_catalog.pg_am am ON am.oid = idx.relam
    WHERE n.nspname = 'public' AND c.relname = ${table} AND idx.relname = ${indexName}
  `;
  return index;
}

function assertIndex(index, name, column) {
  if (!index?.usable || index.indexed_column !== column) {
    throw new TestTargetError(`The test schema is missing a compatible ${name} index.`);
  }
}

async function applyMigrations(sql, files) {
  const statements = [];
  for (const file of files) {
    const migration = await readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8");
    statements.push(...migration.split(/;\s*\n/).map((statement) => statement.trim()).filter(Boolean));
  }
  await sql.transaction([sql`SET LOCAL lock_timeout = '5s'`, ...statements.map((statement) => sql.query(statement))]);
}

export async function ensureBaseSchema(sql) {
  assertVerified(sql);
  const tables = await getTables(sql);
  await assertEmptyTables(sql, tables);
  const migrations = [];
  if (!tables.has("enquiries")) {
    if (PROTECTION_TABLES.some((name) => tables.has(name))) {
      throw new TestTargetError("The isolated target has protection tables without the enquiries table.");
    }
    migrations.push("001_create_enquiries.sql", "002_add_deleted_at.sql");
  } else {
    const columns = await getColumns(sql, "enquiries");
    assertColumns("enquiries", columns, BASE_TYPES, BASE_NULLABLE);
    assertPrimaryKey(await getConstraints(sql, "enquiries"), "enquiries", "id");
    if (columns.has("deleted_at")) {
      assertColumns("enquiries", columns, { deleted_at: "timestamp with time zone" }, BASE_NULLABLE);
    }
    const index = await getIndex(sql, "enquiries", "enquiries_deleted_at_idx");
    if (index) assertIndex(index, "enquiries_deleted_at_idx", "deleted_at");
    if (!columns.has("deleted_at") || !index) migrations.push("002_add_deleted_at.sql");
  }
  if (migrations.length > 0) await applyMigrations(sql, migrations);
  assertColumns("enquiries", await getColumns(sql, "enquiries"), {
    ...BASE_TYPES, deleted_at: "timestamp with time zone",
  }, BASE_NULLABLE);
  assertPrimaryKey(await getConstraints(sql, "enquiries"), "enquiries", "id");
  assertIndex(await getIndex(sql, "enquiries", "enquiries_deleted_at_idx"), "enquiries_deleted_at_idx", "deleted_at");
}

export async function inspectProtectionSchema(sql) {
  assertVerified(sql);
  const tables = await getTables(sql);
  const installed = PROTECTION_TABLES.filter((name) => tables.has(name));
  if (installed.length === 0) return "absent";
  if (installed.length !== PROTECTION_TABLES.length) {
    throw new TestTargetError("The isolated target has a partial migration 003 schema.");
  }

  const [keyTable, fingerprintTable] = PROTECTION_TABLES;
  const noNullableColumns = new Set();
  for (const [table, types] of [[keyTable, KEY_TYPES], [fingerprintTable, FINGERPRINT_TYPES]]) {
    const columns = await getColumns(sql, table);
    assertColumns(table, columns, types, noNullableColumns);
    if (columns.size !== Object.keys(types).length || columns.get("created_at").default_value !== "now()") {
      throw new TestTargetError(`The test schema for ${table} differs from migration 003.`);
    }
  }
  const keys = await getConstraints(sql, keyTable);
  const fingerprints = await getConstraints(sql, fingerprintTable);
  assertPrimaryKey(keys, keyTable, "idempotency_key");
  assertPrimaryKey(fingerprints, fingerprintTable, "fingerprint");
  if (!keys.some((key) => key.type === "f" && key.validated && !key.deferrable && key.on_delete === "c" &&
    key.reference_schema === "public" && key.reference_table === "enquiries" &&
    isSingleColumn(key.columns, "enquiry_id") && isSingleColumn(key.reference_columns, "id"))) {
    throw new TestTargetError("The test schema is missing the immediate cascading enquiry foreign key.");
  }
  for (const [table, indexName, column] of [
    [keyTable, "enquiry_idempotency_keys_created_idx", "created_at"],
    [keyTable, "enquiry_idempotency_keys_enquiry_idx", "enquiry_id"],
    [fingerprintTable, "enquiry_submission_fingerprints_created_idx", "created_at"],
  ]) {
    assertIndex(await getIndex(sql, table, indexName), indexName, column);
  }
  return "ready";
}

export async function applyProtectionSchema(sql) {
  await inspectProtectionSchema(sql);
  await confirmEmptyTestTarget(sql);
  await applyMigrations(sql, ["003_add_idempotency.sql"]);
  if (await inspectProtectionSchema(sql) !== "ready") {
    throw new TestTargetError("Migration 003 did not create the expected test schema.");
  }
}
