import { neon } from '@neondatabase/serverless';
import pg from 'pg';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-http';
import { drizzle as nodeDrizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

type Database = ReturnType<typeof neonDrizzle<typeof schema>>;
let cached: Database | undefined;
let e2ePool: pg.Pool | undefined;

function localE2eDatabaseEnabled() {
  return process.env.CI === 'true' && process.env.BUILDPAIR_E2E_MODE === '1' && !process.env.VERCEL_ENV;
}

export function getDb() {
  if (cached) return cached;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');

  if (localE2eDatabaseEnabled()) {
    e2ePool ??= new pg.Pool({ connectionString, ssl: false });
    cached = nodeDrizzle(e2ePool, { schema }) as unknown as Database;
    return cached;
  }

  cached = neonDrizzle(neon(connectionString), { schema });
  return cached;
}
