import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { cp, mkdir, mkdtemp, realpath, rm } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { Client, neonConfig } from "@neondatabase/serverless";

const scriptPath = fileURLToPath(import.meta.url);
const repository = path.resolve(path.dirname(scriptPath), "..");
const workerVariable = "NUTRISCULPT_NEON_HTTP_TEST_WORKER";
const nextFiles = [
  "app/api/expert-connect/route.js",
  "constants/services.js",
  "lib/db.js",
  "lib/enquiries.js",
  "jsconfig.json",
  "package.json",
];
const keyLockNamespace = 17301;
const fingerprintLockNamespace = 17302;
const contentionRequests = 8;

async function listenOnLoopback(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  return server.address().port;
}

function stopServer(server) {
  if (!server?.listening) return Promise.resolve();
  return new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  });
}

async function copyRoute(directory) {
  for (const file of nextFiles) {
    const destination = path.join(directory, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(repository, file), destination, { force: false, errorOnExist: true });
  }
}

function workerEnv(directory, connectionString, fingerprintSecret, trustedIpHeader, webhookUrl) {
  const env = {};
  for (const name of ["PATH", "SYSTEMROOT", "SYSTEMDRIVE", "WINDIR", "COMSPEC", "TEMP", "TMP", "TMPDIR"]) {
    if (process.env[name]) env[name] = process.env[name];
  }
  return {
    ...env,
    [workerVariable]: directory,
    DATABASE_URL: connectionString,
    ENQUIRY_FINGERPRINT_SECRET: fingerprintSecret,
    ENQUIRY_TRUSTED_IP_HEADER: trustedIpHeader ?? "",
    GOOGLE_APPS_SCRIPT_URL: webhookUrl,
    NEXT_TELEMETRY_DISABLED: "1",
  };
}

function normalizedConnectionString(value) {
  const url = new URL(value);
  // Neon appends its own application_name when constructing the HTTP headers.
  url.searchParams.delete("application_name");
  return url.href;
}

function waitForWorker(child) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error("Timed out starting the loopback Next API.")), 45_000);
    function finish(error, port) {
      clearTimeout(timer);
      child.off("message", onMessage);
      child.off("exit", onExit);
      child.off("error", onError);
      if (error) reject(error);
      else resolve(port);
    }
    function onMessage(message) {
      if (Number.isInteger(message?.port) && message.port > 0) finish(null, message.port);
      else finish(new Error(`Could not start the loopback Next API (${message?.failure ?? "unknown error"}).`));
    }
    function onExit() {
      finish(new Error("The loopback Next API exited before startup."));
    }
    function onError() {
      finish(new Error("Could not launch the loopback Next API process."));
    }
    child.once("message", onMessage);
    child.once("exit", onExit);
    child.once("error", onError);
  });
}

async function stopWorker(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve) => {
    const timer = setTimeout(() => child.kill(), 5_000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    if (child.connected) child.send("close", () => {});
    else child.kill();
  });
}

/** Start the real Next route in a private environment with only the verified test URL. */
export async function startTestApi({ connectionString, fingerprintSecret, trustedIpHeader, webhook = false }) {
  assert.ok(connectionString && fingerprintSecret, "The loopback API requires test-only database and fingerprint configuration.");
  const requestedRoot = path.join(repository, ".next");
  await mkdir(requestedRoot, { recursive: true });
  const artifactRoot = await realpath(requestedRoot);
  assert.equal(artifactRoot, path.join(await realpath(repository), ".next"), "The validation artifact root must remain in the repository.");
  const directory = await mkdtemp(path.join(artifactRoot, "neon-http-test-"));
  let webhookCount = 0;
  let webhookServer;
  let child;

  async function close() {
    await stopWorker(child);
    await stopServer(webhookServer);
    if (path.dirname(directory) === artifactRoot && await realpath(directory).catch(() => null) === directory) {
      await rm(directory, { recursive: true, maxRetries: 3, force: true });
    }
  }

  try {
    await copyRoute(directory);
    let webhookUrl = "";
    if (webhook) {
      webhookServer = createServer((request, response) => {
        if (request.method !== "POST" || request.url !== "/fixture-webhook") {
          response.writeHead(404).end();
          return;
        }
        request.resume();
        request.once("end", () => {
          webhookCount += 1;
          response.writeHead(200, { "content-type": "text/plain" }).end("fixture-forwarded");
        });
      });
      webhookUrl = `http://127.0.0.1:${await listenOnLoopback(webhookServer)}/fixture-webhook`;
    }

    child = fork(scriptPath, [], {
      cwd: directory,
      env: workerEnv(directory, connectionString, fingerprintSecret, trustedIpHeader, webhookUrl),
      execArgv: [],
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    });
    const port = await waitForWorker(child);

    async function submit(payload, headers = {}) {
      const response = await fetch(`http://127.0.0.1:${port}/api/expert-connect`, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45_000),
      });
      const body = await response.json().catch(() => null);
      return { status: response.status, body, headers: response.headers };
    }

    assert.equal((await submit(null)).status, 400, "The loopback route must respond before database tests start.");
    return { submit, webhookCalls: () => webhookCount, close };
  } catch (error) {
    await close();
    throw error;
  }
}

async function waitForAdvisoryWaiters(sql, namespace, value, expected, completed) {
  const deadline = performance.now() + 15_000;
  let peak = 0;
  while (performance.now() < deadline) {
    assert.equal(completed(), 0, "A request finished while its expected advisory lock was still held.");
    const [row] = await sql`
      SELECT COUNT(DISTINCT pid)::int AS waiting
      FROM pg_locks
      WHERE locktype = 'advisory' AND NOT granted AND objsubid = 2
        AND database = (SELECT oid FROM pg_database WHERE datname = current_database())
        AND classid::bigint = ${namespace}
        AND objid::bigint = (hashtext(${value})::bigint & 4294967295::bigint)
    `;
    peak = Math.max(peak, row.waiting);
    if (peak >= expected) return peak;
    await delay(80);
  }
  assert.fail(`Expected ${expected} PostgreSQL backends waiting on a test advisory lock. Observed ${peak}.`);
}

async function submitWhileLocked({ sql, connectionString, api, contenders, namespace, value, independent = [] }) {
  // The HTTP driver is intentionally non-interactive. A separate WebSocket
  // session holds the lock while real application HTTP requests queue behind it.
  const holder = new Client({ connectionString, connectionTimeoutMillis: 10_000, query_timeout: 15_000 });
  holder.on("error", () => {}); // Query and assertion failures are reported by the case.
  let transactionStarted = false;
  let pending;
  try {
    await holder.connect();
    const { rows: [identity] } = await holder.query("SELECT current_database() AS name, pg_is_in_recovery() AS replica");
    assert.equal(identity.name, decodeURIComponent(new URL(connectionString).pathname.slice(1)), "The lock holder connected to a different database.");
    assert.equal(identity.replica, false, "The lock holder must use the test read-write compute.");
    await holder.query("BEGIN");
    transactionStarted = true;
    await holder.query("SELECT pg_advisory_xact_lock($1::integer, hashtext($2))", [namespace, value]);

    let completed = 0;
    pending = Promise.allSettled(contenders.map(async (payload) => {
      try {
        return { payload, response: await api.submit(payload) };
      } finally {
        completed += 1;
      }
    }));

    const observed = await waitForAdvisoryWaiters(sql, namespace, value, contenders.length, () => completed);
    const independentResults = await Promise.allSettled(independent.map(async (payload) => ({
      payload,
      response: await api.submit(payload),
    })));
    assert.equal(completed, 0, "A contender finished before its held lock was released.");
    await holder.query("COMMIT");
    transactionStarted = false;
    const results = await pending;
    return { observed, responses: answeredRequests(results), independentResults: answeredRequests(independentResults) };
  } finally {
    if (transactionStarted) await holder.query("ROLLBACK").catch(() => {});
    await holder.end().catch(() => {});
    if (pending) await pending;
  }
}

function answeredRequests(results) {
  return results.map((result) => {
    assert.equal(result.status, "fulfilled", "A concurrent request did not return an HTTP response.");
    return result.value;
  });
}

function responseIds(results, expectedStatus) {
  return results.map(({ response }) => {
    assert.equal(response.status, expectedStatus, "Unexpected classification from a concurrent enquiry.");
    assert.equal(response.body?.success, true, "Accepted response must mark the enquiry successful.");
    assert.equal(typeof response.body.id, "string", "Accepted response must return the persisted enquiry ID.");
    assert.ok(response.body.id.length > 0, "Accepted response must return a nonempty enquiry ID.");
    return response.body.id;
  });
}

async function assertConcurrentRows(sql, fixtures, attempted, accepted) {
  const emails = [...new Set(attempted.map(({ payload }) => payload.email.trim().toLowerCase()))];
  const keys = [...new Set(attempted.map(({ payload }) => payload.idempotencyKey))];
  const fingerprints = [...new Set(attempted.map(({ payload }) => fixtures.fingerprint(payload)))];
  const [enquiries, keyRows, fingerprintRows] = await Promise.all([
    sql`SELECT id, email, primary_goal FROM enquiries WHERE email = ANY(${emails}::text[])`,
    sql`SELECT idempotency_key, enquiry_id FROM enquiry_idempotency_keys WHERE idempotency_key = ANY(${keys}::text[])`,
    sql`SELECT fingerprint FROM enquiry_submission_fingerprints WHERE fingerprint = ANY(${fingerprints}::text[])`,
  ]);

  assert.equal(enquiries.length, accepted.length, "A concurrent case saved an unexpected number of enquiries.");
  assert.equal(keyRows.length, accepted.length, "A concurrent case saved an unexpected number of idempotency keys.");
  assert.equal(fingerprintRows.length, accepted.length, "A concurrent case saved an unexpected number of fingerprints.");
  for (const { payload, response } of accepted) {
    const enquiry = enquiries.find(({ id }) => id === response.body.id);
    assert.equal(enquiry?.email, payload.email.trim().toLowerCase(), "The response ID must refer to the winning stored payload.");
    assert.equal(enquiry.primary_goal, payload.primaryGoal.trim(), "The winning enquiry goal must remain intact.");
    assert.ok(keyRows.some((row) => row.idempotency_key === payload.idempotencyKey && row.enquiry_id === enquiry.id), "The winning key must refer to the persisted enquiry.");
    assert.ok(fingerprintRows.some((row) => row.fingerprint === fixtures.fingerprint(payload)), "The winning normalized fingerprint must exist.");
  }
}

function assertRejections(results, status) {
  assert.ok(results.every(({ response }) => response.status === status), `Expected every losing request to return ${status}.`);
  if (status === 429) {
    for (const { response } of results) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      assert.ok(Number.isInteger(retryAfter) && retryAfter > 0 && retryAfter <= 600, "A fingerprint conflict must report a remaining cooldown.");
    }
  }
}

export async function runConcurrencyTests({ sql, connectionString, api, fixtures, check }) {
  assert.equal(typeof globalThis.WebSocket, "function", "Concurrency verification requires Node 22+ WebSocket support.");
  const options = { sql, connectionString, api };
  const count = contentionRequests;
  const observations = [];

  observations.push(await check("concurrency A · same key and payload", async () => {
    const payload = fixtures.make("same-key");
    const { observed, responses } = await submitWhileLocked({
      ...options, contenders: Array(count).fill(payload), namespace: keyLockNamespace, value: payload.idempotencyKey,
    });
    assert.equal(new Set(responseIds(responses, 200)).size, 1, "Same-key retries returned different enquiry IDs.");
    await assertConcurrentRows(sql, fixtures, responses, responses.slice(0, 1));
    return { scenario: "same key and payload", sent: count, blockedBackends: observed, persisted: 1 };
  }));

  observations.push(await check("concurrency B · different keys and matching fingerprint", async () => {
    const payload = fixtures.make("same-fingerprint");
    const contenders = Array.from({ length: count }, (_, index) => fixtures.withKey(payload, `fingerprint-${index}`));
    const { observed, responses } = await submitWhileLocked({
      ...options, contenders, namespace: fingerprintLockNamespace, value: fixtures.fingerprint(payload),
    });
    const accepted = responses.filter(({ response }) => response.status === 200);
    assert.equal(accepted.length, 1, "Exactly one request sharing the fingerprint must be accepted.");
    responseIds(accepted, 200);
    assertRejections(responses.filter(({ response }) => response.status !== 200), 429);
    await assertConcurrentRows(sql, fixtures, responses, accepted);
    return { scenario: "different keys and matching fingerprint", sent: count, blockedBackends: observed, persisted: 1 };
  }));

  observations.push(await check("concurrency C · same key and different payloads", async () => {
    const original = fixtures.make("same-key-conflict");
    const contenders = Array.from({ length: count }, (_, index) => ({
      ...fixtures.make(`conflict-${index}`), idempotencyKey: original.idempotencyKey,
    }));
    const { observed, responses } = await submitWhileLocked({
      ...options, contenders, namespace: keyLockNamespace, value: original.idempotencyKey,
    });
    const accepted = responses.filter(({ response }) => response.status === 200);
    assert.equal(accepted.length, 1, "Exactly one of the concurrent conflicting payloads must be accepted.");
    responseIds(accepted, 200);
    assertRejections(responses.filter(({ response }) => response.status !== 200), 409);
    await assertConcurrentRows(sql, fixtures, responses, accepted);
    return { scenario: "same key and different payloads", sent: count, blockedBackends: observed, persisted: 1 };
  }));

  observations.push(await check("concurrency D · unrelated enquiries complete while a lock is held", async () => {
    const blocked = fixtures.make("independent-blocked");
    const independent = Array.from({ length: count }, (_, index) => fixtures.make(`independent-${index}`));
    const { observed, responses, independentResults } = await submitWhileLocked({
      ...options, contenders: [blocked], namespace: keyLockNamespace, value: blocked.idempotencyKey, independent,
    });
    const all = [...responses, ...independentResults];
    assert.equal(new Set(responseIds(all, 200)).size, count + 1, "Independent enquiries must keep separate IDs.");
    await assertConcurrentRows(sql, fixtures, all, all);
    return { scenario: "independent enquiries", sent: count + 1, blockedBackends: observed, completedDuringHold: count, persisted: count + 1 };
  }));

  observations.push(await check("concurrency E · hash collision only adds contention", async () => {
    const prefix = `${fixtures.runId}:collision:`;
    const [collision] = await sql`
      WITH candidates AS (
        SELECT ${prefix}::text || value::text AS test_key
        FROM generate_series(1, 250000) AS value
      )
      SELECT MIN(test_key) AS first_key, MAX(test_key) AS second_key
      FROM candidates
      GROUP BY hashtext(test_key)
      HAVING COUNT(*) > 1
      LIMIT 1
    `;
    assert.ok(collision && collision.first_key !== collision.second_key, "Could not produce two distinct synthetic keys with the same PostgreSQL hash.");
    const contenders = [collision.first_key, collision.second_key].map((key, index) => ({
      ...fixtures.make(`collision-${index}`), idempotencyKey: key,
    }));
    const { observed, responses } = await submitWhileLocked({
      ...options, contenders, namespace: keyLockNamespace, value: collision.first_key,
    });
    assert.equal(new Set(responseIds(responses, 200)).size, 2, "Colliding key hashes must not collapse unrelated enquiries.");
    await assertConcurrentRows(sql, fixtures, responses, responses);
    return { scenario: "different keys with matching hash", sent: 2, blockedBackends: observed, persisted: 2 };
  }));

  observations.push(await check("concurrency E · equal hash inputs in separate lock namespaces", async () => {
    const independent = fixtures.make("different-lock-namespace");
    const fingerprint = fixtures.fingerprint(independent);
    const blocked = { ...fixtures.make("different-lock-namespace-blocked"), idempotencyKey: fingerprint };
    const { observed, responses, independentResults } = await submitWhileLocked({
      ...options, contenders: [blocked], namespace: keyLockNamespace, value: fingerprint, independent: [independent],
    });
    const all = [...responses, ...independentResults];
    assert.equal(new Set(responseIds(all, 200)).size, 2, "Each lock namespace must allow its own unrelated enquiry.");
    await assertConcurrentRows(sql, fixtures, all, all);
    return { scenario: "equal inputs across lock namespaces", sent: 2, blockedBackends: observed, completedDuringHold: 1, persisted: 2 };
  }));

  return observations;
}

async function runWorker() {
  const connectionString = process.env.DATABASE_URL;
  const databaseUrl = new URL(connectionString);
  const allowedSqlEndpoint = neonConfig.fetchEndpoint(databaseUrl.hostname, Number(databaseUrl.port || 443), {});
  const allowedConnection = normalizedConnectionString(connectionString);
  const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (resource, options) => {
    const url = new URL(resource instanceof Request ? resource.url : resource);
    const headers = new Headers(options?.headers ?? (resource instanceof Request ? resource.headers : undefined));
    const databaseHeader = headers.get("Neon-Connection-String");
    const permittedSql = url.href === allowedSqlEndpoint && databaseHeader && normalizedConnectionString(databaseHeader) === allowedConnection;
    const permittedWebhook = webhookUrl && url.href === webhookUrl;
    if (!permittedSql && !permittedWebhook) throw new Error("Network destination is outside the approved test environment.");
    return originalFetch(resource, { ...options, redirect: "error" });
  };

  const { default: next } = await import("next");
  const app = next({ dev: true, dir: process.env[workerVariable], hostname: "127.0.0.1", quiet: true });
  const server = createServer(app.getRequestHandler());
  const stop = async () => {
    await stopServer(server);
    await app.close();
    process.exit(0);
  };
  process.on("message", (message) => { if (message === "close") void stop(); });
  process.once("disconnect", stop);
  await app.prepare();
  const port = await listenOnLoopback(server);
  process.send({ port });
}

if (process.send && process.argv[1] === scriptPath && process.env[workerVariable]) {
  await runWorker().catch((error) => {
    process.send({ failure: /^[a-z0-9_-]+$/i.test(error.code ?? "") ? error.code : "initialization error" }, () => process.exit(1));
  });
}
