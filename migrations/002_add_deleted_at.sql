-- NutriSculpt soft-delete: add deleted_at column to enquiries (idempotent, non-destructive)
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
CREATE INDEX IF NOT EXISTS enquiries_deleted_at_idx ON enquiries (deleted_at);
