CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('customer', 'trader'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'featured'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_status AS ENUM ('open', 'quoted', 'in_progress', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE quote_status AS ENUM ('pending', 'accepted', 'declined', 'withdrawn'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'void', 'overdue'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('requires_payment', 'processing', 'paid', 'failed', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE milestone_status AS ENUM ('pending', 'completed', 'paid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text,
  phone text,
  role user_role,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trader_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  trade_category text NOT NULL,
  sub_skills text[] NOT NULL DEFAULT ARRAY[]::text[],
  bio text NOT NULL DEFAULT '',
  radius_miles integer NOT NULL DEFAULT 10 CHECK (radius_miles BETWEEN 1 AND 150),
  qualifications text[] NOT NULL DEFAULT ARRAY[]::text[],
  external_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  photos text[] NOT NULL DEFAULT ARRAY[]::text[],
  self_certified boolean NOT NULL DEFAULT false CHECK (self_certified = true),
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  is_subscription_active boolean NOT NULL DEFAULT false,
  stripe_subscription_id text,
  stripe_customer_id text,
  stripe_account_id text,
  stripe_charges_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trader_directory_trade_idx ON trader_profiles(trade_category, subscription_tier);

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_trader_id text REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  category text NOT NULL,
  property_type text NOT NULL,
  urgency text NOT NULL,
  description text NOT NULL,
  ai_generated_spec text,
  budget_range text NOT NULL,
  status job_status NOT NULL DEFAULT 'open',
  accepted_quote_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_customer_idx ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS jobs_target_trader_idx ON jobs(target_trader_id);
CREATE INDEX IF NOT EXISTS jobs_status_category_idx ON jobs(status, category);

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  trader_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  labor_cost integer NOT NULL CHECK (labor_cost >= 0),
  materials_cost integer NOT NULL CHECK (materials_cost >= 0),
  vat_amount integer NOT NULL DEFAULT 0 CHECK (vat_amount >= 0),
  deposit_amount integer NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  total_amount integer NOT NULL,
  payment_terms text NOT NULL,
  notes text,
  status quote_status NOT NULL DEFAULT 'pending',
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, trader_id),
  CHECK (total_amount = labor_cost + materials_cost + vat_amount),
  CHECK (deposit_amount <= total_amount)
);
CREATE INDEX IF NOT EXISTS quotes_trader_idx ON quotes(trader_id);

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_accepted_quote_id_fkey;
ALTER TABLE jobs ADD CONSTRAINT jobs_accepted_quote_id_fkey FOREIGN KEY (accepted_quote_id) REFERENCES quotes(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS job_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  status milestone_status NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS milestones_job_idx ON job_milestones(job_id);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  milestone_id uuid REFERENCES job_milestones(id) ON DELETE RESTRICT,
  customer_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  trader_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount integer NOT NULL CHECK (amount > 0),
  platform_fee integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'gbp',
  stripe_payment_intent_id text NOT NULL UNIQUE,
  status payment_status NOT NULL DEFAULT 'requires_payment',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS payments_job_idx ON payments(job_id);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  customer_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  trader_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  verified_completion boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, customer_id)
);
CREATE INDEX IF NOT EXISTS reviews_trader_idx ON reviews(trader_id);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  trader_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  customer_id text REFERENCES users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  items jsonb NOT NULL,
  subtotal integer NOT NULL,
  vat_amount integer NOT NULL DEFAULT 0,
  deposit_amount integer NOT NULL DEFAULT 0,
  total_amount integer NOT NULL,
  notes text,
  due_at timestamptz,
  status invoice_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(trader_id, invoice_number),
  CHECK (subtotal >= 0 AND vat_amount >= 0 AND deposit_amount >= 0),
  CHECK (total_amount = subtotal + vat_amount),
  CHECK (deposit_amount <= total_amount)
);
CREATE INDEX IF NOT EXISTS invoices_customer_idx ON invoices(customer_id);

CREATE OR REPLACE FUNCTION accept_job_quote(p_quote_id uuid, p_customer_id text) RETURNS void AS $$
DECLARE
  selected_quote quotes%ROWTYPE;
  selected_job jobs%ROWTYPE;
BEGIN
  SELECT * INTO selected_quote FROM quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote not found'; END IF;
  SELECT * INTO selected_job FROM jobs WHERE id = selected_quote.job_id AND customer_id = p_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF selected_job.status NOT IN ('open', 'quoted') THEN RAISE EXCEPTION 'Job already awarded'; END IF;

  UPDATE quotes SET status = CASE WHEN id = p_quote_id THEN 'accepted'::quote_status ELSE 'declined'::quote_status END, updated_at = now()
    WHERE job_id = selected_job.id;
  UPDATE jobs SET status = 'in_progress', accepted_quote_id = p_quote_id, updated_at = now() WHERE id = selected_job.id;

  IF selected_quote.deposit_amount > 0 THEN
    INSERT INTO job_milestones(job_id, quote_id, title, amount) VALUES (selected_job.id, p_quote_id, 'Deposit', selected_quote.deposit_amount);
    IF selected_quote.total_amount > selected_quote.deposit_amount THEN
      INSERT INTO job_milestones(job_id, quote_id, title, amount) VALUES (selected_job.id, p_quote_id, 'Final balance', selected_quote.total_amount - selected_quote.deposit_amount);
    END IF;
  ELSE
    INSERT INTO job_milestones(job_id, quote_id, title, amount) VALUES (selected_job.id, p_quote_id, 'Full payment', selected_quote.total_amount);
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_verified_review() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM jobs j
    JOIN quotes q ON q.id = j.accepted_quote_id
    WHERE j.id = NEW.job_id
      AND j.customer_id = NEW.customer_id
      AND q.trader_id = NEW.trader_id
      AND j.status = 'completed'
      AND EXISTS (
        SELECT 1 FROM job_milestones m
        WHERE m.job_id = j.id AND m.status = 'paid' AND m.title <> 'Deposit'
      )
  ) THEN
    RAISE EXCEPTION 'Review requires an accepted quote and a paid milestone';
  END IF;
  NEW.verified_completion := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS verify_review_before_insert ON reviews;
CREATE TRIGGER verify_review_before_insert
BEFORE INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION enforce_verified_review();
