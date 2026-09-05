import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) throw new Error('DATABASE_URL_UNPOOLED is required. Use the direct Neon URL, not the -pooler host.');

const migrationsDir = resolve('db/migrations');
const migrationFiles = (await readdir(migrationsDir))
  .filter((file) => /^\d+.*\.sql$/i.test(file))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

if (!migrationFiles.length) throw new Error('No SQL migrations found in db/migrations.');

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: true } });
await client.connect();

try {
  await client.query('BEGIN');
  await client.query(`
    CREATE TABLE IF NOT EXISTS buildmate_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const appliedResult = await client.query('SELECT filename FROM buildmate_migrations');
  const applied = new Set(appliedResult.rows.map((row) => row.filename));
  let appliedCount = 0;

  for (const filename of migrationFiles) {
    if (applied.has(filename)) {
      console.log(`Skipping already applied migration: ${filename}`);
      continue;
    }

    const sql = await readFile(resolve(migrationsDir, filename), 'utf8');
    if (!sql.trim()) {
      console.log(`Skipping empty migration: ${filename}`);
      continue;
    }

    console.log(`Applying migration: ${filename}`);
    await client.query(sql);
    await client.query('INSERT INTO buildmate_migrations(filename) VALUES ($1)', [filename]);
    appliedCount += 1;
  }

  await client.query('COMMIT');
  console.log(appliedCount ? `Applied ${appliedCount} BuildPair migration(s).` : 'Database is already up to date.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
