ALTER TABLE trader_profiles ADD COLUMN IF NOT EXISTS postcode text;
ALTER TABLE trader_profiles ADD COLUMN IF NOT EXISTS location_label text;
ALTER TABLE trader_profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE trader_profiles ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS postcode text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location_label text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS longitude double precision;
