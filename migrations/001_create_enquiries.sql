-- NutriSculpt enquiries schema (idempotent, non-destructive)
CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL DEFAULT '',
  phone_number TEXT NOT NULL DEFAULT '',
  selected_service_category TEXT NOT NULL DEFAULT 'not-sure',
  selected_service_category_label TEXT NOT NULL DEFAULT '',
  primary_goal TEXT NOT NULL DEFAULT '',
  primary_goal_category TEXT NOT NULL DEFAULT '',
  coaching_preference TEXT NOT NULL DEFAULT '',
  age_group TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'direct',
  submitted_at TIMESTAMPTZ NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT NOT NULL DEFAULT '',
  next_follow_up_at DATE NULL,
  contacted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS enquiries_submitted_at_idx ON enquiries (submitted_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries (status);
CREATE INDEX IF NOT EXISTS enquiries_category_idx ON enquiries (selected_service_category);
CREATE INDEX IF NOT EXISTS enquiries_updated_at_idx ON enquiries (updated_at DESC);
