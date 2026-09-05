-- BuildPair marketplace/business suite
-- Adds verification, favourites, availability, variations, timeline, notifications,
-- saved searches, project stories, emergency-job support and server-side rate limiting.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS is_emergency boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_start_at timestamptz;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS scope text,
  ADD COLUMN IF NOT EXISTS exclusions text,
  ADD COLUMN IF NOT EXISTS duration_days integer,
  ADD COLUMN IF NOT EXISTS warranty_months integer,
  ADD COLUMN IF NOT EXISTS proposed_start_at timestamptz;

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quote_duration_valid;
ALTER TABLE quotes ADD CONSTRAINT quote_duration_valid CHECK (duration_days IS NULL OR duration_days BETWEEN 1 AND 3650);
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quote_warranty_valid;
ALTER TABLE quotes ADD CONSTRAINT quote_warranty_valid CHECK (warranty_months IS NULL OR warranty_months BETWEEN 0 AND 240);

CREATE TABLE IF NOT EXISTS trader_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_type text NOT NULL,
  name text NOT NULL,
  issuer text,
  reference_number text,
  document_url text,
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'submitted',
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trader_credential_status_valid CHECK (status IN ('submitted','verified','rejected','expired'))
);
CREATE INDEX IF NOT EXISTS trader_credentials_trader_idx ON trader_credentials(trader_id, status);
CREATE INDEX IF NOT EXISTS trader_credentials_expiry_idx ON trader_credentials(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS saved_traders (
  customer_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trader_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(customer_id, trader_id),
  CONSTRAINT saved_trader_not_self CHECK (customer_id <> trader_id)
);
CREATE INDEX IF NOT EXISTS saved_traders_customer_idx ON saved_traders(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trader_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'available',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trader_availability_window_valid CHECK (ends_at > starts_at),
  CONSTRAINT trader_availability_status_valid CHECK (status IN ('available','busy','unavailable'))
);
CREATE INDEX IF NOT EXISTS trader_availability_trader_idx ON trader_availability(trader_id, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS job_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  trader_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  amount_delta integer NOT NULL DEFAULT 0,
  duration_delta_days integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT job_variation_status_valid CHECK (status IN ('pending','accepted','declined','withdrawn')),
  CONSTRAINT job_variation_duration_valid CHECK (duration_delta_days BETWEEN -365 AND 365)
);
CREATE INDEX IF NOT EXISTS job_variations_job_idx ON job_variations(job_id, created_at DESC);

CREATE TABLE IF NOT EXISTS job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  actor_id text REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_events_job_idx ON job_events(job_id, created_at ASC);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  href text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, read_at, created_at DESC);

CREATE TABLE IF NOT EXISTS saved_job_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  keywords text,
  postcode text,
  radius_miles integer NOT NULL DEFAULT 15,
  emergency_only boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_job_search_radius_valid CHECK (radius_miles BETWEEN 1 AND 150)
);
CREATE INDEX IF NOT EXISTS saved_job_searches_trader_idx ON saved_job_searches(trader_id, enabled);

CREATE TABLE IF NOT EXISTS trader_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  location_label text,
  summary text NOT NULL,
  before_photos text[] NOT NULL DEFAULT ARRAY[]::text[],
  after_photos text[] NOT NULL DEFAULT ARRAY[]::text[],
  duration_days integer,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trader_story_duration_valid CHECK (duration_days IS NULL OR duration_days BETWEEN 1 AND 3650)
);
CREATE INDEX IF NOT EXISTS trader_stories_trader_idx ON trader_stories(trader_id, created_at DESC);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  PRIMARY KEY(bucket_key, window_start),
  CONSTRAINT api_rate_limit_count_valid CHECK (request_count >= 1)
);
CREATE INDEX IF NOT EXISTS api_rate_limits_window_idx ON api_rate_limits(window_start);

CREATE INDEX IF NOT EXISTS jobs_emergency_idx ON jobs(is_emergency, status, category) WHERE is_emergency = true;
CREATE INDEX IF NOT EXISTS quotes_start_idx ON quotes(proposed_start_at) WHERE proposed_start_at IS NOT NULL;
