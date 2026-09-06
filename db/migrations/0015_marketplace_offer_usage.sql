CREATE TABLE IF NOT EXISTS trader_job_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  trader_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, trader_id)
);

CREATE INDEX IF NOT EXISTS trader_job_offers_trader_month_idx
  ON trader_job_offers(trader_id, created_at DESC);
