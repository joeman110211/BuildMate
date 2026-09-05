-- BuildPair beta launch window: guarantee every unbilled trader at least 28 days
-- of lead access from first profile creation. This is intentionally idempotent.

UPDATE trader_profiles
SET trial_ends_at = GREATEST(
      COALESCE(trial_ends_at, created_at + interval '28 days'),
      created_at + interval '28 days'
    ),
    subscription_tier = CASE
      WHEN stripe_subscription_id IS NULL AND subscription_tier = 'free' THEN 'basic'::subscription_tier
      ELSE subscription_tier
    END,
    is_subscription_active = CASE
      WHEN stripe_subscription_id IS NULL THEN true
      ELSE is_subscription_active
    END,
    updated_at = now()
WHERE stripe_subscription_id IS NULL;
