-- Record how a job milestone was marked paid. This keeps beta external-payment
-- confirmations distinguishable from verified Stripe payments.
ALTER TABLE job_milestones
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_confirmed_by text REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE job_milestones
  DROP CONSTRAINT IF EXISTS milestone_payment_method_valid;
ALTER TABLE job_milestones
  ADD CONSTRAINT milestone_payment_method_valid
  CHECK (payment_method IS NULL OR payment_method IN ('stripe', 'customer_confirmed_external'));

CREATE INDEX IF NOT EXISTS milestones_payment_method_idx ON job_milestones(payment_method);
