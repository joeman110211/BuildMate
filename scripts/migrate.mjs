import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) throw new Error('DATABASE_URL_UNPOOLED is required. Use the direct Neon URL, not the -pooler host.');

const sql = await readFile(resolve('db/migrations/0000_buildmate_initial.sql'), 'utf8');
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: true } });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  console.log('BuildMate migration applied successfully.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
