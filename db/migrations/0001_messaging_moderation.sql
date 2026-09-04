CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trader_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, customer_id, trader_id),
  CHECK (customer_id <> trader_id)
);
CREATE INDEX IF NOT EXISTS conversations_customer_idx ON conversations(customer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS conversations_trader_idx ON conversations(trader_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS messages_unread_idx ON messages(conversation_id, read_at) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS moderation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_user_id text REFERENCES users(id) ON DELETE SET NULL,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  review_id uuid REFERENCES reviews(id) ON DELETE SET NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'fraud', 'abuse_or_harassment', 'unsafe_content', 'other')),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK (subject_user_id IS NOT NULL OR message_id IS NOT NULL OR review_id IS NOT NULL OR job_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS moderation_reports_status_idx ON moderation_reports(status, created_at);
CREATE INDEX IF NOT EXISTS moderation_reports_reporter_idx ON moderation_reports(reporter_id, created_at);
