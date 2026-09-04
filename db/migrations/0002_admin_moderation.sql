ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason text NOT NULL DEFAULT '';

ALTER TABLE moderation_reports ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT '';
ALTER TABLE moderation_reports ADD COLUMN IF NOT EXISTS resolved_by text REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_suspension_idx ON users(is_suspended) WHERE is_suspended = true;
CREATE INDEX IF NOT EXISTS moderation_reports_subject_idx ON moderation_reports(subject_user_id, created_at);
