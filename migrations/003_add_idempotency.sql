-- NutriSculpt anti-spam: idempotency keys and submission fingerprints.
-- Idempotent, non-destructive. Existing enquiries are preserved.

-- Idempotency keys: one row per accepted submission key. The UNIQUE constraint
-- on idempotency_key provides atomic dedup under concurrent requests.
CREATE TABLE IF NOT EXISTS enquiry_idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  payload_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS enquiry_idempotency_keys_created_idx
  ON enquiry_idempotency_keys (created_at);

-- Submission fingerprints: privacy-preserving HMAC of normalized contact +
-- category + goal, used to detect rapid identical enquiries within a window.
-- Raw email/phone are NOT stored here.
CREATE TABLE IF NOT EXISTS enquiry_submission_fingerprints (
  fingerprint TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS enquiry_submission_fingerprints_created_idx
  ON enquiry_submission_fingerprints (created_at);
