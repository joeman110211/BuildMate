-- Saved job searches advertise their own postcode/radius matching.
-- Store geocoded search centres so alert evaluation can enforce that contract server-side.
ALTER TABLE saved_job_searches
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

CREATE INDEX IF NOT EXISTS saved_job_searches_location_idx
  ON saved_job_searches(latitude, longitude)
  WHERE enabled = true AND latitude IS NOT NULL AND longitude IS NOT NULL;
