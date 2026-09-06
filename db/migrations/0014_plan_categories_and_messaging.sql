-- BuildPair Starter / Plus / Pro category entitlements and AI-assisted messaging groundwork.

ALTER TABLE trader_profiles
  ADD COLUMN IF NOT EXISTS trade_categories text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS service_selections jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS categories_changed_at timestamptz;

-- Preserve every existing profile by promoting its legacy primary trade into the
-- new multi-category field. Specialist services remain in sub_skills as a legacy
-- compatibility/search field until the profile is next edited.
UPDATE trader_profiles
SET trade_categories = ARRAY[trade_category]::text[]
WHERE cardinality(trade_categories) = 0
  AND trade_category IS NOT NULL
  AND length(trim(trade_category)) > 0;

-- Trial access is intentionally disabled during beta testing. Profiles without a
-- real Stripe subscription fall back to Starter Free. Paid subscriptions are not touched.
UPDATE trader_profiles
SET subscription_tier = 'free',
    is_subscription_active = false,
    trial_ends_at = NULL
WHERE stripe_subscription_id IS NULL;

CREATE INDEX IF NOT EXISTS trader_profiles_trade_categories_gin_idx
  ON trader_profiles USING gin(trade_categories);
CREATE INDEX IF NOT EXISTS trader_profiles_service_selections_gin_idx
  ON trader_profiles USING gin(service_selections);
CREATE INDEX IF NOT EXISTS trader_profiles_public_plan_idx
  ON trader_profiles(subscription_tier, is_subscription_active)
  WHERE is_subscription_active = true AND subscription_tier <> 'free';

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS moderation_reason text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS moderation_updated_at timestamptz;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_moderation_status_valid;
ALTER TABLE conversations
  ADD CONSTRAINT conversations_moderation_status_valid
  CHECK (moderation_status IN ('open', 'warned', 'restricted', 'closed'));

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS ai_risk_level text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS ai_moderation_reason text;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_ai_risk_level_valid;
ALTER TABLE messages
  ADD CONSTRAINT messages_ai_risk_level_valid
  CHECK (ai_risk_level IN ('none', 'low', 'medium', 'high', 'severe'));

CREATE INDEX IF NOT EXISTS conversations_moderation_idx
  ON conversations(moderation_status, moderation_updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_ai_risk_idx
  ON messages(ai_risk_level, created_at DESC)
  WHERE ai_risk_level <> 'none';
