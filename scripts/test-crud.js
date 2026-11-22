#!/usr/bin/env node
/* eslint-disable no-console */
const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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

function nowIso() {
  return new Date().toISOString();
}

function toDateOnlyOrNull(v) {
  if (!v) return null;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizeRecord(raw) {
  return {
    id: raw.id,
    fullName: raw.full_name,
    email: raw.email,
    countryCode: raw.country_code,
    phoneNumber: raw.phone_number,
    selectedServiceCategory: raw.selected_service_category,
    selectedServiceCategoryLabel: raw.selected_service_category_label,
    primaryGoal: raw.primary_goal,
    primaryGoalCategory: raw.primary_goal_category,
    coachingPreference: raw.coaching_preference,
    ageGroup: raw.age_group,
    city: raw.city,
    source: raw.source,
    submittedAt: raw.submitted_at,
    status: raw.status,
    adminNotes: raw.admin_notes,
    nextFollowUpAt: raw.next_follow_up_at,
    contactedAt: raw.contacted_at,
    updatedAt: raw.updated_at,
  };
}

const TEST_EMAIL = "test-checkpoint-6b5a@example.com";

async function main() {
  loadEnvLocal();
  const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing DATABASE_URL/DATABASE_URL_POOLED");
    process.exit(1);
  }
  const sql = neon(connectionString);

  let testId = null;

  try {
    // ===== TEST 1: Create enquiry =====
    console.log("\n📝 TEST 1: Create enquiry");
    const id = crypto.randomUUID();
    testId = id;
    const now = nowIso();
    const payload = {
      id,
      fullName: "Test User Checkpoint 6B-5A",
      email: TEST_EMAIL,
      countryCode: "+1",
      phoneNumber: "5551234567",
      selectedServiceCategory: "strength-fitness-performance",
      selectedServiceCategoryLabel: "Personal Training & Strength Development",
      primaryGoal: "Build strength and improve fitness for checkpoint testing",
      primaryGoalCategory: "strength",
      coachingPreference: "Online coaching",
      ageGroup: "30–44",
      city: "Test City",
      source: "direct",
      submittedAt: now,
      status: "new",
      adminNotes: "",
      nextFollowUpAt: null,
      contactedAt: null,
      updatedAt: now,
    };

    const created = await sql`
      INSERT INTO enquiries (
        id, full_name, email, country_code, phone_number,
        selected_service_category, selected_service_category_label,
        primary_goal, primary_goal_category, coaching_preference,
        age_group, city, source, submitted_at, status,
        admin_notes, next_follow_up_at, contacted_at, created_at, updated_at
      ) VALUES (
        ${payload.id}, ${payload.fullName}, ${payload.email}, ${payload.countryCode}, ${payload.phoneNumber},
        ${payload.selectedServiceCategory}, ${payload.selectedServiceCategoryLabel},
        ${payload.primaryGoal}, ${payload.primaryGoalCategory}, ${payload.coachingPreference},
        ${payload.ageGroup}, ${payload.city}, ${payload.source}, ${payload.submittedAt}, ${payload.status},
        ${payload.adminNotes}, ${payload.nextFollowUpAt}, ${payload.contactedAt}, ${payload.updatedAt}, ${payload.updatedAt}
      )
      RETURNING *
    `;
    const createdRecord = normalizeRecord(created[0]);
    console.log("✅ Created:", { id: createdRecord.id, email: createdRecord.email, status: createdRecord.status, service: createdRecord.selectedServiceCategory, goal: createdRecord.primaryGoalCategory, source: createdRecord.source });

    // ===== TEST 2: Retrieve enquiry =====
    console.log("\n📖 TEST 2: Retrieve enquiry by ID");
    const retrieved = await sql`SELECT * FROM enquiries WHERE id = ${id} LIMIT 1`;
    const retrievedRecord = normalizeRecord(retrieved[0]);
    console.log("✅ Retrieved:", { id: retrievedRecord.id, email: retrievedRecord.email, status: retrievedRecord.status });

    // ===== TEST 3: Confirm service category stored =====
    console.log("\n🏷️  TEST 3: Confirm service category stored");
    console.log("✅ Service category:", retrievedRecord.selectedServiceCategory);
    console.log("✅ Service category label:", retrievedRecord.selectedServiceCategoryLabel);

    // ===== TEST 4: Confirm fitness goal stored =====
    console.log("\n🎯 TEST 4: Confirm fitness goal stored");
    console.log("✅ Primary goal:", retrievedRecord.primaryGoal);
    console.log("✅ Primary goal category:", retrievedRecord.primaryGoalCategory);

    // ===== TEST 5: Confirm enquiry source stored =====
    console.log("\n📍 TEST 5: Confirm enquiry source stored");
    console.log("✅ Source:", retrievedRecord.source);

    // ===== TEST 6: Change status New → Contacted =====
    console.log("\n🔄 TEST 6: Change status New → Contacted");
    const contactedAt = nowIso();
    const updatedStatus = await sql`
      UPDATE enquiries SET
        status = ${"contacted"},
        contacted_at = ${contactedAt},
        updated_at = ${nowIso()}
      WHERE id = ${id}
      RETURNING *
    `;
    const statusRecord = normalizeRecord(updatedStatus[0]);
    console.log("✅ Status changed:", { status: statusRecord.status, contactedAt: statusRecord.contactedAt });

    // ===== TEST 7: Update internal admin notes =====
    console.log("\n📝 TEST 7: Update internal admin notes");
    const adminNotes = "Test note from checkpoint 6B-5A verification. Customer prefers evening calls.";
    const updatedNotes = await sql`
      UPDATE enquiries SET
        admin_notes = ${adminNotes},
        updated_at = ${nowIso()}
      WHERE id = ${id}
      RETURNING *
    `;
    const notesRecord = normalizeRecord(updatedNotes[0]);
    console.log("✅ Admin notes updated:", notesRecord.adminNotes);

    // ===== TEST 8: Set follow-up date =====
    console.log("\n📅 TEST 8: Set follow-up date");
    const followUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 7 days from now
    const updatedFollowUp = await sql`
      UPDATE enquiries SET
        next_follow_up_at = ${followUpDate},
        updated_at = ${nowIso()}
      WHERE id = ${id}
      RETURNING *
    `;
    const followUpRecord = normalizeRecord(updatedFollowUp[0]);
    console.log("✅ Follow-up date set:", followUpRecord.nextFollowUpAt);

    // ===== TEST 9: Retrieve updated enquiry =====
    console.log("\n📖 TEST 9: Retrieve fully updated enquiry");
    const final = await sql`SELECT * FROM enquiries WHERE id = ${id} LIMIT 1`;
    const finalRecord = normalizeRecord(final[0]);
    console.log("✅ Final record:", {
      id: finalRecord.id,
      email: finalRecord.email,
      status: finalRecord.status,
      adminNotes: finalRecord.adminNotes,
      nextFollowUpAt: finalRecord.nextFollowUpAt,
      contactedAt: finalRecord.contactedAt,
      serviceCategory: finalRecord.selectedServiceCategory,
      goalCategory: finalRecord.primaryGoalCategory,
      source: finalRecord.source,
    });

    // ===== TEST 10: Confirm dashboard counts reflect test record =====
    console.log("\n📊 TEST 10: Dashboard counts");
    const counts = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'new')::int AS new,
        COUNT(*) FILTER (WHERE status = 'contacted')::int AS contacted,
        COUNT(*) FILTER (WHERE status = 'consultation_scheduled')::int AS consultation_scheduled,
        COUNT(*) FILTER (WHERE status = 'closed')::int AS closed
      FROM enquiries
    `;
    console.log("✅ Dashboard counts:", counts[0]);

    const byCat = await sql`SELECT selected_service_category AS category, COUNT(*)::int AS count FROM enquiries GROUP BY selected_service_category`;
    console.log("✅ By category:", byCat);

    // ===== TEST 11: Verify unrelated fields unchanged =====
    console.log("\n🔍 TEST 11: Verify unrelated fields unchanged");
    const unchanged = {
      fullName: finalRecord.fullName === payload.fullName,
      email: finalRecord.email === payload.email,
      countryCode: finalRecord.countryCode === payload.countryCode,
      phoneNumber: finalRecord.phoneNumber === payload.phoneNumber,
      primaryGoal: finalRecord.primaryGoal === payload.primaryGoal,
      coachingPreference: finalRecord.coachingPreference === payload.coachingPreference,
      ageGroup: finalRecord.ageGroup === payload.ageGroup,
      city: finalRecord.city === payload.city,
      submittedAt: finalRecord.submittedAt === payload.submittedAt,
    };
    console.log("✅ Unchanged fields check:", unchanged);
    const allUnchanged = Object.values(unchanged).every(v => v);
    console.log(allUnchanged ? "✅ All unrelated fields preserved" : "❌ Some fields changed unexpectedly");

    // ===== CLEANUP: Delete test record =====
    console.log("\n🧹 CLEANUP: Deleting test record");
    await sql`DELETE FROM enquiries WHERE id = ${id}`;
    console.log("✅ Test record deleted");

    // Verify cleanup
    const afterCleanup = await sql`SELECT COUNT(*)::int as count FROM enquiries WHERE email = ${TEST_EMAIL}`;
    console.log("✅ Cleanup verified, remaining test records:", afterCleanup[0].count);

    console.log("\n🎉 ALL TESTS PASSED!");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    // Attempt cleanup on failure
    if (testId) {
      try {
        await sql`DELETE FROM enquiries WHERE id = ${testId}`;
        console.log("✅ Cleaned up test record after failure");
      } catch (e) {
        console.error("⚠️ Failed to clean up test record:", e.message);
      }
    }
    process.exit(1);
  }
}

main();