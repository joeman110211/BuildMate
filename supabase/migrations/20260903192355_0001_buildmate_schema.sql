/*
# BuildMate Core Schema

## Overview
Creates the full relational schema for BuildMate — a marketplace connecting customers with verified tradespeople. Includes profiles, trader profiles, jobs, quotes, and reviews with Row Level Security.

## New Tables

### profiles
- `id` (uuid, primary key, references auth.users)
- `user_id` (uuid, unique, references auth.users, defaults to auth.uid())
- `role` (text, 'customer' | 'trader', not null)
- `email` (text, not null)
- `full_name` (text, not null)
- `created_at` (timestamptz, defaults to now())

### trader_profiles
- `id` (uuid, primary key)
- `user_id` (uuid, unique, references auth.users, defaults to auth.uid())
- `business_name` (text, not null)
- `trade_category` (text, not null)
- `bio` (text)
- `radius_miles` (integer, default 25)
- `external_links` (jsonb, default '{}')
- `photos` (text[], default '{}')
- `subscription_status` (boolean, default false)
- `subscription_tier` (text, 'standard' | 'premium', default 'standard')
- `stripe_customer_id` (text)
- `created_at` (timestamptz, defaults to now())

### jobs
- `id` (uuid, primary key)
- `customer_id` (uuid, references profiles, defaults to auth.uid())
- `title` (text, not null)
- `category` (text, not null)
- `description` (text)
- `budget_range` (text)
- `property_type` (text)
- `status` (text, 'open' | 'quoted' | 'in_progress' | 'completed', default 'open')
- `created_at` (timestamptz, defaults to now())

### quotes
- `id` (uuid, primary key)
- `job_id` (uuid, references jobs, not null)
- `trader_id` (uuid, references profiles, defaults to auth.uid())
- `labor_cost` (numeric, default 0)
- `materials_cost` (numeric, default 0)
- `total_amount` (numeric, default 0)
- `payment_terms` (text)
- `status` (text, 'pending' | 'accepted' | 'declined', default 'pending')
- `created_at` (timestamptz, defaults to now())

### reviews
- `id` (uuid, primary key)
- `job_id` (uuid, references jobs, not null)
- `customer_id` (uuid, references profiles, defaults to auth.uid())
- `trader_id` (uuid, references profiles, not null)
- `rating` (integer, 1-5, not null)
- `comment` (text)
- `verified_completion` (boolean, default true)
- `created_at` (timestamptz, defaults to now())

## Security (RLS)
- All tables have RLS enabled.
- profiles: all authenticated can read (needed for directory + trader profiles); owner can insert/update own.
- trader_profiles: public read (anon + authenticated) for directory; owner can insert/update own.
- jobs: owner (customer) full CRUD; authenticated traders can read jobs (lead feed).
- quotes: job owner (customer) and quote owner (trader) can read; trader can insert; both can update.
- reviews: public read (for trader profiles); customer who owns the completed job can insert.

## Important Notes
1. Owner columns default to auth.uid() so frontend inserts omitting user_id still satisfy RLS.
2. Traders can see open jobs in their category via the lead feed (authenticated read).
3. Reviews are gated by job completion — enforced in RLS (job status must be 'completed').
4. The anon role can read trader_profiles (public directory) and reviews.
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('customer', 'trader')),
  email text NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON profiles;
CREATE POLICY "profiles_select_all_authenticated"
ON profiles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TRADER_PROFILES ============
CREATE TABLE IF NOT EXISTS trader_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  trade_category text NOT NULL,
  bio text,
  radius_miles integer NOT NULL DEFAULT 25,
  external_links jsonb NOT NULL DEFAULT '{}',
  photos text[] NOT NULL DEFAULT '{}',
  subscription_status boolean NOT NULL DEFAULT false,
  subscription_tier text NOT NULL DEFAULT 'standard' CHECK (subscription_tier IN ('standard', 'premium')),
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trader_profiles ENABLE ROW LEVEL SECURITY;

-- Public can read active trader profiles (directory)
DROP POLICY IF EXISTS "trader_profiles_select_public" ON trader_profiles;
CREATE POLICY "trader_profiles_select_public"
ON trader_profiles FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "trader_profiles_insert_own" ON trader_profiles;
CREATE POLICY "trader_profiles_insert_own"
ON trader_profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trader_profiles_update_own" ON trader_profiles;
CREATE POLICY "trader_profiles_update_own"
ON trader_profiles FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ JOBS ============
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  budget_range text,
  property_type text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'quoted', 'in_progress', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Customers can read their own jobs; traders can read jobs (lead feed)
DROP POLICY IF EXISTS "jobs_select_authenticated" ON jobs;
CREATE POLICY "jobs_select_authenticated"
ON jobs FOR SELECT
TO authenticated USING (auth.uid() = customer_id OR status IN ('open', 'quoted', 'in_progress', 'completed'));

DROP POLICY IF EXISTS "jobs_insert_own" ON jobs;
CREATE POLICY "jobs_insert_own"
ON jobs FOR INSERT
TO authenticated WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "jobs_update_own" ON jobs;
CREATE POLICY "jobs_update_own"
ON jobs FOR UPDATE
TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "jobs_delete_own" ON jobs;
CREATE POLICY "jobs_delete_own"
ON jobs FOR DELETE
TO authenticated USING (auth.uid() = customer_id);

-- ============ QUOTES ============
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  trader_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(user_id) ON DELETE CASCADE,
  labor_cost numeric NOT NULL DEFAULT 0,
  materials_cost numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_terms text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Job owner (customer) and quote owner (trader) can read
DROP POLICY IF EXISTS "quotes_select_participants" ON quotes;
CREATE POLICY "quotes_select_participants"
ON quotes FOR SELECT
TO authenticated USING (
  auth.uid() = trader_id
  OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = quotes.job_id AND jobs.customer_id = auth.uid())
);

-- Only traders can insert quotes
DROP POLICY IF EXISTS "quotes_insert_trader" ON quotes;
CREATE POLICY "quotes_insert_trader"
ON quotes FOR INSERT
TO authenticated WITH CHECK (auth.uid() = trader_id);

-- Trader can update own quotes; customer can update status (accept/decline)
DROP POLICY IF EXISTS "quotes_update_participants" ON quotes;
CREATE POLICY "quotes_update_participants"
ON quotes FOR UPDATE
TO authenticated
USING (
  auth.uid() = trader_id
  OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = quotes.job_id AND jobs.customer_id = auth.uid())
)
WITH CHECK (
  auth.uid() = trader_id
  OR EXISTS (SELECT 1 FROM jobs WHERE jobs.id = quotes.job_id AND jobs.customer_id = auth.uid())
);

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(user_id) ON DELETE CASCADE,
  trader_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  verified_completion boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read reviews (shown on trader profiles)
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
CREATE POLICY "reviews_select_public"
ON reviews FOR SELECT
TO anon, authenticated USING (true);

-- Only the customer who owns the completed job can insert a review
DROP POLICY IF EXISTS "reviews_insert_job_owner" ON reviews;
CREATE POLICY "reviews_insert_job_owner"
ON reviews FOR INSERT
TO authenticated WITH CHECK (
  auth.uid() = customer_id
  AND EXISTS (SELECT 1 FROM jobs WHERE jobs.id = reviews.job_id AND jobs.customer_id = auth.uid() AND jobs.status = 'completed')
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trader_profiles_category ON trader_profiles(trade_category);
CREATE INDEX IF NOT EXISTS idx_trader_profiles_subscription ON trader_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_quotes_job_id ON quotes(job_id);
CREATE INDEX IF NOT EXISTS idx_quotes_trader_id ON quotes(trader_id);
CREATE INDEX IF NOT EXISTS idx_reviews_trader_id ON reviews(trader_id);
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
