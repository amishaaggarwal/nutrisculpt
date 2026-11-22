import assert from "node:assert/strict";

const GENERIC_SAVE_ERROR = "We couldn't save your enquiry. Please try again.";
const DUPLICATE_WINDOW_SECONDS = 600;

function fixtureEmail(payload) {
  const email = payload.email.trim().toLowerCase();
  assert.match(email, /@[^@]*\.invalid$/);
  return email;
}

async function clock(sql) {
  const [row] = await sql`SELECT EXTRACT(EPOCH FROM clock_timestamp())::float8 AS epoch`;
  return row.epoch;
}

async function readEnquiries(sql, payload) {
  return sql`
    SELECT id, full_name, email, country_code, phone_number, primary_goal, status,
           submitted_at::text AS submitted_at, created_at::text AS created_at, deleted_at::text AS deleted_at,
           EXTRACT(EPOCH FROM created_at)::float8 AS created_epoch
    FROM public.enquiries
    WHERE email = ${fixtureEmail(payload)}
    ORDER BY created_at, id
  `;
}

async function readKey(sql, payload) {
  const [key] = await sql`
    SELECT idempotency_key, enquiry_id, payload_hash, created_at::text AS created_at
    FROM public.enquiry_idempotency_keys
    WHERE idempotency_key = ${payload.idempotencyKey}
  `;
  return key;
}

async function readFingerprint(sql, fingerprint) {
  const [row] = await sql`
    SELECT fingerprint, created_at::text AS created_at, EXTRACT(EPOCH FROM created_at)::float8 AS created_epoch
    FROM public.enquiry_submission_fingerprints WHERE fingerprint = ${fingerprint}
  `;
  return row;
}

async function readState(sql, fixtures, payload) {
  const [enquiries, key, fingerprint] = await Promise.all([
    readEnquiries(sql, payload),
    readKey(sql, payload),
    readFingerprint(sql, fixtures.fingerprint(payload)),
  ]);
  return { enquiries, key, fingerprint };
}

function assertAccepted(response) {
  assert.equal(response.status, 200);
  assert.equal(response.body?.success, true);
  assert.match(response.body.id, /^[0-9a-f-]{36}$/i);
  return response.body.id;
}

async function assertPersisted(sql, fixtures, payload, id) {
  const state = await readState(sql, fixtures, payload);
  const enquiry = state.enquiries.find((row) => row.id === id);
  assert.ok(enquiry, "The API must return an ID that exists in PostgreSQL");
  assert.equal(state.key?.enquiry_id, id);
  assert.match(state.key.payload_hash, /^[0-9a-f]{64}$/);
  assert.equal(state.fingerprint?.fingerprint, fixtures.fingerprint(payload));
  assert.match(state.fingerprint.fingerprint, /^[0-9a-f]{64}$/);
  assert.equal(state.key.created_at, enquiry.created_at);
  assert.equal(state.fingerprint.created_at, enquiry.created_at);
  return { ...state, enquiry };
}

async function assertDuplicate(sql, api, payload, fingerprint) {
  const before = await clock(sql);
  const response = await api.submit(payload);
  const after = await clock(sql);
  const retryAfter = response.headers.get("Retry-After");
  assert.equal(response.status, 429);
  assert.deepEqual(response.body, {
    error: "A similar enquiry was recently submitted. Please wait before sending again.",
  });
  assert.match(retryAfter ?? "", /^\d+$/);
  const seconds = Number(retryAfter);
  const expiration = fingerprint.created_epoch + DUPLICATE_WINDOW_SECONDS;
  assert.ok(seconds >= Math.max(1, Math.ceil(expiration - after)));
  assert.ok(seconds <= Math.ceil(expiration - before));
  assert.equal(await readKey(sql, payload), undefined, "A duplicate must not reserve its key");
  return seconds;
}

async function ageFingerprint(sql, fixtures, payload, minutes) {
  const fingerprint = fixtures.fingerprint(payload);
  const [row] = await sql`
    UPDATE public.enquiry_submission_fingerprints
    SET created_at = clock_timestamp() - ${minutes}::int * INTERVAL '1 minute'
    WHERE fingerprint = ${fingerprint}
    RETURNING fingerprint, created_at::text AS created_at, EXTRACT(EPOCH FROM created_at)::float8 AS created_epoch
  `;
  assert.ok(row, "Expected a fixture fingerprint to advance");
  return row;
}

async function ageKey(sql, payload, id) {
  const [row] = await sql`
    UPDATE public.enquiry_idempotency_keys
    SET created_at = clock_timestamp() - INTERVAL '25 hours'
    WHERE idempotency_key = ${payload.idempotencyKey} AND enquiry_id = ${id}
    RETURNING idempotency_key
  `;
  assert.ok(row, "Expected a fixture key to advance");
}

export async function runSubmissionTests({ sql, api, fixtures, check }) {
  await check("Initial submission, retry and conflict match persisted rows", async () => {
    const original = fixtures.make("submission");
    const formattedEmail = ` ${original.email.toUpperCase()} `;
    const before = await clock(sql);
    const webhookCalls = api.webhookCalls();
    const first = await api.submit({ ...original, email: formattedEmail });
    const enquiryId = assertAccepted(first);
    assert.equal(first.body.data, "fixture-forwarded");
    const after = await clock(sql);
    const saved = await assertPersisted(sql, fixtures, original, enquiryId);
    assert.equal(saved.enquiries.length, 1);
    assert.equal(saved.enquiry.email, fixtureEmail(original));
    assert.equal(saved.enquiry.full_name, original.fullName);
    assert.equal(saved.enquiry.primary_goal, original.primaryGoal);
    assert.equal(saved.enquiry.status, "new");
    assert.ok(saved.enquiry.submitted_at);
    assert.ok(saved.enquiry.created_epoch >= before && saved.enquiry.created_epoch <= after);

    const replay = await api.submit(original);
    assert.equal(assertAccepted(replay), enquiryId);
    assert.equal(replay.body.data, "");
    assert.equal(api.webhookCalls(), webhookCalls + 1, "Only the original submission can forward");

    const changed = { ...original, primaryGoal: `${original.primaryGoal} changed` };
    const conflict = await api.submit(changed);
    assert.equal(conflict.status, 409);
    assert.equal(conflict.body?.success, undefined);
    assert.deepEqual(await readState(sql, fixtures, original), {
      enquiries: saved.enquiries, key: saved.key, fingerprint: saved.fingerprint,
    });
    assert.equal(await readFingerprint(sql, fixtures.fingerprint(changed)), undefined);
    assert.equal(api.webhookCalls(), webhookCalls + 1);
  });

  await check("Normalized duplicates use remaining cooldown without renewing it", async () => {
    const original = fixtures.make("normalized", { countryCode: "+1", phoneNumber: "2025550142" });
    const enquiryId = assertAccepted(await api.submit(original));
    const fingerprint = await ageFingerprint(sql, fixtures, original, 2);
    const originalState = await readState(sql, fixtures, original);
    const formatted = { ...original, email: ` ${original.email.toUpperCase()} `, phoneNumber: "202-555-0142" };
    assert.equal(fixtures.fingerprint(formatted), fingerprint.fingerprint);
    const webhookCalls = api.webhookCalls();
    const first = await assertDuplicate(sql, api, fixtures.withKey(formatted, "duplicate-one"), fingerprint);
    const second = await assertDuplicate(sql, api, fixtures.withKey(formatted, "duplicate-two"), fingerprint);
    assert.ok(first < DUPLICATE_WINDOW_SECONDS);
    assert.ok(second <= first);
    assert.deepEqual(await readState(sql, fixtures, original), originalState);
    assert.deepEqual(originalState.enquiries.map((row) => row.id), [enquiryId]);
    assert.equal(api.webhookCalls(), webhookCalls);
  });

  await check("Returning contact can submit distinct goals and calling codes", async () => {
    const original = fixtures.make("returning", { countryCode: "+1", phoneNumber: "2025550173" });
    const changedGoal = fixtures.withKey({ ...original, primaryGoal: `${original.primaryGoal} changed` }, "goal");
    const changedCountry = fixtures.withKey({ ...original, countryCode: "+44" }, "country");
    const submitted = [];
    for (const payload of [original, changedGoal, changedCountry]) {
      const id = assertAccepted(await api.submit(payload));
      await assertPersisted(sql, fixtures, payload, id);
      submitted.push(id);
    }
    assert.equal(new Set(submitted).size, 3);
    assert.deepEqual(new Set((await readEnquiries(sql, original)).map((row) => row.id)), new Set(submitted));
  });
}

const FAULTS = {
  enquiry: { table: "enquiries", operation: "INSERT", column: "email" },
  key: { table: "enquiry_idempotency_keys", operation: "INSERT", column: "idempotency_key" },
  fingerprint: { table: "enquiry_submission_fingerprints", operation: "INSERT", column: "fingerprint" },
  foreign_key: { table: "enquiry_idempotency_keys", operation: "INSERT", column: "idempotency_key" },
  cleanup: { table: "enquiry_submission_fingerprints", operation: "DELETE", column: "fingerprint" },
};

async function withFixtureFault(sql, runId, stage, value, run) {
  assert.match(runId, /^[a-f0-9]{8,32}$/);
  assert.match(value, /^[a-zA-Z0-9@._+-]+$/);
  const { table, operation, column } = FAULTS[stage];
  const name = `ns_it_${runId}_${stage}`;
  const row = operation === "DELETE" ? "OLD" : "NEW";
  const action = stage === "foreign_key"
    ? `NEW.enquiry_id := 'ns-it-missing-${runId}'; RETURN NEW;`
    : "RAISE EXCEPTION 'controlled 03B-3 fixture failure' USING ERRCODE = '23514';";

  // Names are generated from a validated run ID and fixed stage. Each trigger
  // matches only its fixture's exact contact, key or fingerprint.
  await sql.transaction([
    sql.query(`CREATE FUNCTION public.${name}() RETURNS trigger LANGUAGE plpgsql AS $fault$
      BEGIN ${action} END; $fault$`),
    sql.query(`CREATE TRIGGER ${name} BEFORE ${operation} ON public.${table}
      FOR EACH ROW WHEN (${row}.${column} = '${value}') EXECUTE FUNCTION public.${name}()`),
  ]);
  try {
    await run();
  } finally {
    await sql.transaction([
      sql.query(`DROP TRIGGER ${name} ON public.${table}`),
      sql.query(`DROP FUNCTION public.${name}()`),
    ]);
  }
}

export async function runRollbackTests({ sql, api, fixtures, check }) {
  await check("PostgreSQL rejects an orphan idempotency key with SQLSTATE 23503", async () => {
    const payload = fixtures.make("fk-probe");
    await assert.rejects(async () => sql`
      INSERT INTO public.enquiry_idempotency_keys (idempotency_key, enquiry_id, payload_hash)
      VALUES (${payload.idempotencyKey}, ${`ns-it-missing-${fixtures.runId}`}, ${"0".repeat(64)})
    `, { code: "23503" });
    assert.equal(await readKey(sql, payload), undefined);
  });

  for (const stage of Object.keys(FAULTS)) {
    await check(`Failure at ${stage} rolls back the API submission and permits a retry`, async () => {
      const payload = fixtures.make(`rollback-${stage.replaceAll("_", "-")}`);
      let value = payload.idempotencyKey;
      let expired;
      if (stage === "enquiry") value = fixtureEmail(payload);
      if (stage === "fingerprint") value = fixtures.fingerprint(payload);
      if (stage === "cleanup") {
        expired = fixtures.make("cleanup-fault-marker");
        assertAccepted(await api.submit(expired));
        value = (await ageFingerprint(sql, fixtures, expired, 31)).fingerprint;
      }
      const webhookCalls = api.webhookCalls();
      await withFixtureFault(sql, fixtures.runId, stage, value, async () => {
        const failure = await api.submit(payload);
        assert.equal(failure.status, 500);
        assert.deepEqual(failure.body, { error: GENERIC_SAVE_ERROR });
        assert.deepEqual(await readState(sql, fixtures, payload), {
          enquiries: [], key: undefined, fingerprint: undefined,
        });
        assert.equal(api.webhookCalls(), webhookCalls);
        if (expired) assert.ok(await readFingerprint(sql, value));
      });

      const id = assertAccepted(await api.submit(payload));
      const state = await assertPersisted(sql, fixtures, payload, id);
      assert.equal(state.enquiries.length, 1);
      assert.equal(api.webhookCalls(), webhookCalls + 1);
      if (expired) assert.equal(await readFingerprint(sql, value), undefined);
    });
  }
}

export async function runExpiryTests({ sql, api, fixtures, check }) {
  await check("Ten-minute fingerprint expiry permits a fresh acceptance and restarts the window", async () => {
    const original = fixtures.make("fingerprint-expiry");
    const originalId = assertAccepted(await api.submit(original));
    const expired = await ageFingerprint(sql, fixtures, original, 11);
    assertAccepted(await api.submit(fixtures.make("unrelated-retention-probe")));
    assert.deepEqual(await readFingerprint(sql, expired.fingerprint), expired);

    const fresh = fixtures.withKey(original, "fingerprint-reuse");
    const freshId = assertAccepted(await api.submit(fresh));
    assert.notEqual(freshId, originalId);
    const state = await assertPersisted(sql, fixtures, fresh, freshId);
    assert.equal(state.enquiries.length, 2);
    assert.ok(state.fingerprint.created_epoch > expired.created_epoch);
    await assertDuplicate(sql, api, fixtures.withKey(original, "fingerprint-renewal-duplicate"), state.fingerprint);
    assert.equal(assertAccepted(await api.submit(original)), originalId);
    assert.deepEqual(await readFingerprint(sql, expired.fingerprint), state.fingerprint);
  });

  await check("Expired idempotency key can point to a new enquiry without overwriting the old one", async () => {
    const original = fixtures.make("idempotency-expiry");
    const originalId = assertAccepted(await api.submit(original));
    const state = await assertPersisted(sql, fixtures, original, originalId);
    const changed = { ...original, primaryGoal: `${original.primaryGoal} new request` };
    assert.equal((await api.submit(changed)).status, 409);
    await ageKey(sql, original, originalId);
    const newId = assertAccepted(await api.submit(changed));
    assert.notEqual(newId, originalId);
    const latest = await assertPersisted(sql, fixtures, changed, newId);
    assert.equal(latest.enquiries.length, 2);
    assert.deepEqual(latest.enquiries.find((row) => row.id === originalId), state.enquiry);
    assert.equal(assertAccepted(await api.submit(changed)), newId);
    assert.equal((await api.submit(original)).status, 409);
  });

  await check("Retention cleanup removes aged keys and fingerprints while preserving enquiries", async () => {
    const old = fixtures.make("cleanup-expiry");
    const oldId = assertAccepted(await api.submit(old));
    const live = fixtures.make("cleanup-live");
    assertAccepted(await api.submit(live));
    const liveState = await readState(sql, fixtures, live);
    await ageKey(sql, old, oldId);
    const expired = await ageFingerprint(sql, fixtures, old, 31);

    assertAccepted(await api.submit(fixtures.make("cleanup-expiry-trigger")));
    assert.equal(await readKey(sql, old), undefined);
    assert.equal(await readFingerprint(sql, expired.fingerprint), undefined);
    assert.deepEqual((await readEnquiries(sql, old)).map((row) => row.id), [oldId]);
    assert.deepEqual(await readState(sql, fixtures, live), liveState);
  });

  await check("Trash preserves replays and permanent deletion cascades the fixture key", async () => {
    const payload = fixtures.make("trash-expiry");
    const id = assertAccepted(await api.submit(payload));
    const initial = await assertPersisted(sql, fixtures, payload, id);
    const email = fixtureEmail(payload);
    const trashFixture = () => sql`
      UPDATE public.enquiries SET deleted_at = clock_timestamp(), status = 'closed'
      WHERE id = ${id} AND email = ${email} AND deleted_at IS NULL RETURNING id
    `;

    assert.deepEqual(await trashFixture(), [{ id }]);
    assert.equal(assertAccepted(await api.submit(payload)), id);
    assert.ok((await readEnquiries(sql, payload))[0].deleted_at);
    assert.deepEqual(await readKey(sql, payload), initial.key);

    assert.deepEqual(await sql`
      UPDATE public.enquiries SET deleted_at = NULL
      WHERE id = ${id} AND email = ${email} AND deleted_at IS NOT NULL RETURNING id
    `, [{ id }]);
    assert.equal(assertAccepted(await api.submit(payload)), id);
    assert.equal((await readEnquiries(sql, payload))[0].deleted_at, null);

    assert.deepEqual(await trashFixture(), [{ id }]);
    assert.deepEqual(await sql`
      DELETE FROM public.enquiries
      WHERE id = ${id} AND email = ${email} AND deleted_at IS NOT NULL AND status = 'closed' RETURNING id
    `, [{ id }]);
    assert.deepEqual(await readEnquiries(sql, payload), []);
    assert.equal(await readKey(sql, payload), undefined);
    assert.deepEqual(await readFingerprint(sql, initial.fingerprint.fingerprint), initial.fingerprint);
    await assertDuplicate(sql, api, payload, initial.fingerprint);
  });
}
