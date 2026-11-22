import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { ENQUIRY_CATEGORY_ALLOWLIST } from "../constants/services.js";
import { makeSubmissionFingerprint } from "../lib/enquiries.js";
import { runExpiryTests, runRollbackTests, runSubmissionTests } from "./enquiries-neon-cases.mjs";
import { runConcurrencyTests, startTestApi } from "./enquiries-neon-http.mjs";
import {
  applyProtectionSchema,
  confirmEmptyTestTarget,
  connectTestTarget,
  ensureBaseSchema,
  inspectProtectionSchema,
  TestTargetError,
} from "./enquiries-neon-target.mjs";

function createFixtures(fingerprintSecret) {
  const runId = randomBytes(12).toString("hex");
  const names = new Set();
  const keys = new Set();
  const fingerprints = new Set();
  let nextNumber = 0;
  const clean = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";

  function fingerprint(payload) {
    const category = clean(payload.selectedServiceCategory || payload.serviceCategory, 80);
    return makeSubmissionFingerprint(
      fingerprintSecret,
      clean(payload.email, 254),
      clean(payload.countryCode, 5),
      clean(payload.phoneNumber || payload.contact, 30),
      ENQUIRY_CATEGORY_ALLOWLIST.has(category) ? category : "not-sure",
      clean(payload.primaryGoal || payload.goals || payload.reason, 500),
    );
  }

  function track(payload) {
    const name = clean(payload.fullName || payload.name, 120);
    assert.ok(name.startsWith(`03B3 ${runId} `), "Every API fixture must use the current run's synthetic name");
    names.add(name);
    const key = clean(payload.idempotencyKey, Infinity);
    if (key) keys.add(key);
    fingerprints.add(fingerprint(payload));
    return payload;
  }

  function make(label, overrides = {}) {
    const number = ++nextNumber;
    return track({
      idempotencyKey: `03b3-${runId}-${number}`,
      fullName: `03B3 ${runId} ${number} ${label}`,
      email: `${number}@nutrisculpt-${runId}.invalid`,
      selectedServiceCategory: "not-sure",
      primaryGoal: "Synthetic enquiry integration test",
      source: "direct",
      ...overrides,
    });
  }

  function withKey(payload) {
    return track({ ...payload, idempotencyKey: `03b3-${runId}-${++nextNumber}` });
  }

  async function cleanup(sql) {
    if (!names.size) return;
    const [tables] = await sql`
      SELECT to_regclass('public.enquiry_idempotency_keys') IS NOT NULL AS has_keys,
             to_regclass('public.enquiry_submission_fingerprints') IS NOT NULL AS has_fingerprints
    `;
    await sql.transaction((tx) => {
      const statements = [];
      if (tables.has_keys && keys.size) statements.push(tx`
        DELETE FROM public.enquiry_idempotency_keys WHERE idempotency_key = ANY(${[...keys]}::text[])
      `);
      if (tables.has_fingerprints && fingerprints.size) statements.push(tx`
        DELETE FROM public.enquiry_submission_fingerprints WHERE fingerprint = ANY(${[...fingerprints]}::text[])
      `);
      if (names.size) statements.push(tx`
        DELETE FROM public.enquiries WHERE full_name = ANY(${[...names]}::text[])
      `);
      return statements;
    });
  }

  return { runId, fingerprint, track, make, withKey, cleanup };
}

async function assertNoEnquiry(sql, payload) {
  const rows = await sql`SELECT id FROM public.enquiries WHERE full_name = ${payload.fullName}`;
  assert.equal(rows.length, 0, "Rejected request must leave no enquiry row");
}

async function runIpTests({ sql, api, openApi, fixtures, check }) {
  const header = "x-03b3-ingress-client-ip";
  await check("HTTP/IP without trusted configuration ignores forwarding headers", async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const reply = await api.submit(fixtures.make("untrusted header"), {
        [header]: "192.0.2.10",
        "x-forwarded-for": "192.0.2.10",
        "x-real-ip": "192.0.2.10",
      });
      assert.equal(reply.status, 200);
    }
  });

  await check("HTTP/IP trusted header allows five, rejects the sixth and keeps other buckets independent", async () => {
    const limitedApi = await openApi({ trustedIpHeader: header });
    try {
      const firstSentAt = performance.now();
      const first = await limitedApi.submit(fixtures.make("trusted IP"), { [header]: "192.0.2.10" });
      const firstReturnedAt = performance.now();
      assert.equal(first.status, 200);
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const reply = await limitedApi.submit(fixtures.make("trusted IP"), { [header]: "192.0.2.10" });
        assert.equal(reply.status, 200);
      }
      const blocked = fixtures.make("rate limited");
      const blockedSentAt = performance.now();
      const response = await limitedApi.submit(blocked, { [header]: "192.0.2.10", "x-forwarded-for": "192.0.2.11" });
      const blockedReturnedAt = performance.now();
      assert.equal(response.status, 429);
      const seconds = Number(response.headers.get("retry-after"));
      assert.ok(Number.isInteger(seconds) && seconds > 0 && seconds <= 300);
      assert.ok(seconds >= Math.ceil((firstSentAt + 300_000 - blockedReturnedAt) / 1_000));
      assert.ok(seconds <= Math.ceil((firstReturnedAt + 300_000 - blockedSentAt) / 1_000));
      await assertNoEnquiry(sql, blocked);
      const differentIp = await limitedApi.submit(fixtures.make("different IP"), { [header]: "192.0.2.11" });
      assert.equal(differentIp.status, 200);
      const invalidList = await limitedApi.submit(fixtures.make("forwarded list"), { [header]: "192.0.2.10, 192.0.2.11" });
      assert.equal(invalidList.status, 200);
    } finally {
      await limitedApi.close();
    }
  });
}

function describeError(error) {
  const code = /^[A-Z0-9_]{1,45}$/.test(error?.code) ? ` (${error.code})` : "";
  return error instanceof TestTargetError ? error.message : `Check failed${code}`;
}

async function main() {
  const [mode, ...extraArguments] = process.argv.slice(2);
  if (!new Set(["--setup", "--test"]).has(mode) || extraArguments.length) {
    console.error("Use --setup for isolated schema checks or --test for the integration scenarios.");
    process.exitCode = 1;
    return;
  }

  const { sql, connectionString, branchId, host, database } = await connectTestTarget();
  console.info(`Verified isolated Neon target ${branchId} at ${host}/${database}`);
  const fingerprintSecret = randomBytes(32).toString("hex");
  const fixtures = createFixtures(fingerprintSecret);
  let passed = 0;
  let failed = 0;
  let api;

  async function check(label, run) {
    try {
      const result = await run();
      passed += 1;
      console.info(`PASS ${label}`);
      return result;
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${label}. ${describeError(error)}`);
      throw error;
    }
  }

  async function openApi(options = {}) {
    const server = await startTestApi({ connectionString, fingerprintSecret, ...options });
    return {
      ...server,
      submit(payload, headers) {
        return server.submit(fixtures.track(payload), headers);
      },
    };
  }

  try {
    if (mode === "--setup") {
      await check("base migrations 001 and 002", () => ensureBaseSchema(sql));
      if (await inspectProtectionSchema(sql) === "absent") {
        api = await openApi();
        await check("HTTP before 003 returns 503 and writes no enquiry", async () => {
          const payload = fixtures.make("before migration 003");
          const response = await api.submit(payload);
          assert.equal(response.status, 503);
          assert.equal(response.body?.error, "Enquiry submissions are temporarily unavailable. Please try again later.");
          await assertNoEnquiry(sql, payload);
        });
      } else {
        console.info("SKIP pre-003 HTTP check because the protection schema is already present");
      }
      await check("migration 003 and protection catalog validation", () => applyProtectionSchema(sql));
      await check("migration 003 rerun preserves the expected schema", () => applyProtectionSchema(sql));
    } else {
      await check("isolated protection schema is ready", async () => {
        if (await inspectProtectionSchema(sql) !== "ready") {
          throw new TestTargetError("Run the guarded --setup against this test branch first.");
        }
      });
      api = await openApi({ webhook: true });
      await runSubmissionTests({ sql, api, fixtures, check });
      const concurrency = await runConcurrencyTests({ sql, connectionString, api, fixtures, check });
      if (concurrency) console.info(`Observed contention ${JSON.stringify(concurrency)}`);
      await runRollbackTests({ sql, api, fixtures, check });
      await runExpiryTests({ sql, api, fixtures, check });
      await runIpTests({ sql, api, openApi, fixtures, check });
    }
  } finally {
    try {
      await api?.close();
    } finally {
      try {
        if (api) await check("remove only this run's fixtures", () => fixtures.cleanup(sql));
        await check("isolated enquiry tables are empty after teardown", () => confirmEmptyTestTarget(sql));
      } finally {
        console.info(`${passed} checks passed, ${failed} failed`);
      }
    }
  }
}

main().catch((error) => {
  console.error(describeError(error));
  process.exitCode = 1;
});
