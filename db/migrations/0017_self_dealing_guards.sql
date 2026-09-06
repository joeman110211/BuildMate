-- Prevent dual-mode and same-account self-dealing.
-- Constraints are NOT VALID so existing beta/test rows do not block deployment;
-- PostgreSQL still enforces them for all new and updated rows.

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_customer_not_target_trader;
ALTER TABLE jobs ADD CONSTRAINT jobs_customer_not_target_trader
  CHECK (target_trader_id IS NULL OR customer_id <> target_trader_id) NOT VALID;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_customer_not_trader;
ALTER TABLE reviews ADD CONSTRAINT reviews_customer_not_trader
  CHECK (customer_id <> trader_id) NOT VALID;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_customer_not_trader;
ALTER TABLE payments ADD CONSTRAINT payments_customer_not_trader
  CHECK (customer_id <> trader_id) NOT VALID;

ALTER TABLE job_variations DROP CONSTRAINT IF EXISTS job_variations_customer_not_trader;
ALTER TABLE job_variations ADD CONSTRAINT job_variations_customer_not_trader
  CHECK (customer_id <> trader_id) NOT VALID;

CREATE OR REPLACE FUNCTION prevent_self_quote() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.id = NEW.job_id
      AND j.customer_id = NEW.trader_id
  ) THEN
    RAISE EXCEPTION 'A BuildPair account cannot quote its own job';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_self_quote_before_write ON quotes;
CREATE TRIGGER prevent_self_quote_before_write
BEFORE INSERT OR UPDATE OF job_id, trader_id ON quotes
FOR EACH ROW EXECUTE FUNCTION prevent_self_quote();
