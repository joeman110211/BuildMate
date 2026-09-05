CREATE OR REPLACE FUNCTION buildpair_delete_account(p_user_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users SET deletion_requested_at = now() WHERE id = p_user_id;

  DELETE FROM notifications WHERE user_id = p_user_id;
  DELETE FROM saved_traders WHERE customer_id = p_user_id OR trader_id = p_user_id;
  DELETE FROM trader_availability WHERE trader_id = p_user_id;
  DELETE FROM trader_credentials WHERE trader_id = p_user_id;
  DELETE FROM saved_job_searches WHERE trader_id = p_user_id;
  DELETE FROM trader_stories WHERE trader_id = p_user_id;
  DELETE FROM trader_profile_view_daily WHERE trader_id = p_user_id;
  DELETE FROM conversations WHERE customer_id = p_user_id OR trader_id = p_user_id;

  UPDATE job_variations
  SET title = 'Account-deleted variation',
      description = 'Variation details removed following account deletion.'
  WHERE customer_id = p_user_id OR trader_id = p_user_id;

  UPDATE jobs
  SET title = CASE WHEN status = 'completed' THEN 'Completed BuildPair job' ELSE 'Removed BuildPair job' END,
      description = 'Job details removed following account deletion.',
      ai_generated_spec = NULL,
      photos = ARRAY[]::text[],
      postcode = NULL,
      location_label = NULL,
      latitude = NULL,
      longitude = NULL,
      status = CASE WHEN status IN ('open','quoted') THEN 'cancelled'::job_status ELSE status END,
      updated_at = now()
  WHERE customer_id = p_user_id;

  UPDATE jobs SET target_trader_id = NULL, updated_at = now()
  WHERE target_trader_id = p_user_id AND status IN ('open','quoted');

  DELETE FROM trader_profiles WHERE user_id = p_user_id;

  UPDATE users
  SET email = NULL,
      phone = NULL,
      role = NULL,
      customer_enabled = false,
      trader_enabled = false,
      active_mode = NULL,
      is_deleted = true,
      deleted_at = now(),
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;
