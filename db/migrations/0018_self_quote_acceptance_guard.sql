-- Defense in depth for any legacy/beta self-quote rows that predate 0017.
CREATE OR REPLACE FUNCTION accept_job_quote(p_quote_id uuid, p_customer_id text) RETURNS void AS $$
DECLARE
  selected_quote quotes%ROWTYPE;
  selected_job jobs%ROWTYPE;
BEGIN
  SELECT * INTO selected_quote FROM quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote not found'; END IF;
  SELECT * INTO selected_job FROM jobs WHERE id = selected_quote.job_id AND customer_id = p_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF selected_quote.trader_id = p_customer_id THEN RAISE EXCEPTION 'A BuildPair account cannot accept its own quote'; END IF;
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
