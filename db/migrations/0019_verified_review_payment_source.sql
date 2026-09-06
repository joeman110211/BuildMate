-- Keep reviews possible for completed BuildPair jobs while reserving the
-- verified-completion badge for payment that BuildPair can independently verify.
CREATE OR REPLACE FUNCTION enforce_verified_review() RETURNS trigger AS $$
DECLARE
  relationship_ok boolean;
  has_paid_stage boolean;
  has_verified_payment boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM jobs j
    JOIN quotes q ON q.id = j.accepted_quote_id
    WHERE j.id = NEW.job_id
      AND j.customer_id = NEW.customer_id
      AND q.trader_id = NEW.trader_id
      AND j.status = 'completed'
      AND j.customer_id <> q.trader_id
  ) INTO relationship_ok;

  IF NOT relationship_ok THEN
    RAISE EXCEPTION 'Review requires a completed BuildPair job with an accepted quote';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM job_milestones m
    WHERE m.job_id = NEW.job_id
      AND m.status = 'paid'
      AND m.title <> 'Deposit'
  ) INTO has_paid_stage;

  IF NOT has_paid_stage THEN
    RAISE EXCEPTION 'Review requires a completed paid milestone';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM job_milestones m
    WHERE m.job_id = NEW.job_id
      AND m.status = 'paid'
      AND m.title <> 'Deposit'
      AND m.payment_method = 'stripe'
  ) INTO has_verified_payment;

  NEW.verified_completion := has_verified_payment;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Correct any beta/test rows that were called verified solely because a customer
-- manually confirmed an off-platform payment.
UPDATE reviews r
SET verified_completion = false
WHERE verified_completion = true
  AND NOT EXISTS (
    SELECT 1 FROM job_milestones m
    WHERE m.job_id = r.job_id
      AND m.status = 'paid'
      AND m.title <> 'Deposit'
      AND m.payment_method = 'stripe'
  );
