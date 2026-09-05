CREATE TABLE IF NOT EXISTS trader_profile_view_daily (
  trader_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  view_day date NOT NULL DEFAULT current_date,
  view_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY(trader_id, view_day),
  CONSTRAINT trader_profile_view_count_valid CHECK (view_count >= 0)
);
CREATE INDEX IF NOT EXISTS trader_profile_view_day_idx ON trader_profile_view_daily(view_day);
