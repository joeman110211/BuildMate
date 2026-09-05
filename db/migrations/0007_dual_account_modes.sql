ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trader_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_mode user_role;

UPDATE users
SET customer_enabled = true
WHERE role = 'customer' AND customer_enabled = false;

UPDATE users
SET trader_enabled = true
WHERE role = 'trader' AND trader_enabled = false;

UPDATE users
SET active_mode = role
WHERE active_mode IS NULL AND role IS NOT NULL;
