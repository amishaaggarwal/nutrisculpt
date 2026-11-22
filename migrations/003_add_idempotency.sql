-- NutriSculpt anti-spam: idempotency keys and submission fingerprints.
-- Idempotent, non-destructive. Existing enquiries are preserved.

-- Idempotency keys expire 24 hours after an accepted submission. The app
-- inserts the parent enquiry and records the key in the same transaction.
CREATE TABLE IF NOT EXISTS enquiry_idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  payload_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS enquiry_idempotency_keys_created_idx
  ON enquiry_idempotency_keys (created_at);
CREATE INDEX IF NOT EXISTS enquiry_idempotency_keys_enquiry_idx
  ON enquiry_idempotency_keys (enquiry_id);

-- Submission fingerprints: privacy-preserving HMAC of normalized contact +
-- category + goal, used to detect rapid identical enquiries within a window.
-- Timestamps only change when an enquiry is accepted. Raw contact details
-- are not stored here.
CREATE TABLE IF NOT EXISTS enquiry_submission_fingerprints (
  fingerprint TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS enquiry_submission_fingerprints_created_idx
  ON enquiry_submission_fingerprints (created_at);
