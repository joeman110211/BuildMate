-- BuildPair beta jobs can complete outside Stripe while payments are disabled.
-- Future jobs created after payments are enabled set requires_platform_payment=true
-- and continue to require a paid non-deposit milestone before a verified review.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS requires_platform_payment boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION enforce_verified_review() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM jobs j
    JOIN quotes q ON q.id = j.accepted_quote_id
    WHERE j.id = NEW.job_id
      AND j.customer_id = NEW.customer_id
      AND q.trader_id = NEW.trader_id
      AND j.status = 'completed'
      AND (
        j.requires_platform_payment = false
        OR EXISTS (
          SELECT 1
          FROM job_milestones m
          WHERE m.job_id = j.id
            AND m.status = 'paid'
            AND m.title <> 'Deposit'
        )
      )
  ) THEN
    RAISE EXCEPTION 'Review requires a completed accepted job and, when required, a paid milestone';
  END IF;

  NEW.verified_completion := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS verify_review_before_insert ON reviews;
CREATE TRIGGER verify_review_before_insert
BEFORE INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION enforce_verified_review();
