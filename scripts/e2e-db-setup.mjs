import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import pg from 'pg';

if (process.env.CI !== 'true' || process.env.BUILDPAIR_E2E_MODE !== '1' || process.env.VERCEL_ENV) {
  throw new Error('E2E database setup is restricted to non-Vercel CI runs');
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required for E2E setup');

const client = new pg.Client({ connectionString, ssl: false });
await client.connect();

try {
  const migrationsDir = resolve('db/migrations');
  const migrationFiles = (await readdir(migrationsDir))
    .filter((file) => /^\d+.*\.sql$/i.test(file))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  for (const filename of migrationFiles) {
    const sql = await readFile(resolve(migrationsDir, filename), 'utf8');
    if (sql.trim()) {
      console.log(`E2E applying ${filename}`);
      await client.query(sql);
    }
  }

  await client.query(`
    INSERT INTO users(id, email, role, customer_enabled, trader_enabled, active_mode)
    VALUES
      ('e2e-customer', 'customer@example.invalid', 'customer', true, false, 'customer'),
      ('e2e-trader', 'trader@example.invalid', 'trader', false, true, 'trader')
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      customer_enabled = EXCLUDED.customer_enabled,
      trader_enabled = EXCLUDED.trader_enabled,
      active_mode = EXCLUDED.active_mode,
      updated_at = now()
  `);

  await client.query(`
    INSERT INTO trader_profiles(
      user_id, business_name, trade_category, sub_skills, bio, radius_miles,
      postcode, location_label, latitude, longitude, qualifications,
      external_links, photos, self_certified, subscription_tier,
      is_subscription_active, trial_ends_at
    )
    VALUES (
      'e2e-trader', 'BuildPair E2E Tiling', 'Tiling', ARRAY['Bathrooms', 'Floors'],
      'A deterministic integration-test trader profile used only inside ephemeral CI databases.',
      50, 'TW18 4AB', 'Spelthorne', 51.4335, -0.5155, ARRAY['CI fixture'],
      '{}'::jsonb, ARRAY[]::text[], true, 'basic', true, now() + interval '28 days'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      trade_category = EXCLUDED.trade_category,
      sub_skills = EXCLUDED.sub_skills,
      bio = EXCLUDED.bio,
      radius_miles = EXCLUDED.radius_miles,
      postcode = EXCLUDED.postcode,
      location_label = EXCLUDED.location_label,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      self_certified = true,
      subscription_tier = 'basic',
      is_subscription_active = true,
      trial_ends_at = now() + interval '28 days',
      updated_at = now()
  `);

  console.log('E2E database ready');
} finally {
  await client.end();
}
