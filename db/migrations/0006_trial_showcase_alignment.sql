-- Idempotent production-alignment migration.
-- Some early BuildPair databases were created before these fields/tables were
-- tracked consistently. Keep this safe to run whether 0005 has already run or not.

ALTER TABLE trader_profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

CREATE TABLE IF NOT EXISTS trader_profile_showcase (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  template text NOT NULL DEFAULT 'classic',
  colour_theme text NOT NULL DEFAULT 'burnt_orange',
  cover_photo_url text,
  profile_image_url text,
  logo_url text,
  years_experience integer NOT NULL DEFAULT 0,
  year_established integer,
  service_areas text[] NOT NULL DEFAULT ARRAY[]::text[],
  before_after_projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trader_showcase_template_valid CHECK (template IN ('classic', 'portfolio', 'modern')),
  CONSTRAINT trader_showcase_colour_valid CHECK (colour_theme IN ('burnt_orange', 'navy', 'forest', 'charcoal', 'burgundy')),
  CONSTRAINT trader_showcase_experience_valid CHECK (years_experience BETWEEN 0 AND 80),
  CONSTRAINT trader_showcase_established_valid CHECK (year_established IS NULL OR year_established BETWEEN 1900 AND 2100)
);
