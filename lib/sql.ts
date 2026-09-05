import { neon } from '@neondatabase/serverless';
import pg from 'pg';

type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>;

let cached: SqlTag | undefined;
let e2ePool: pg.Pool | undefined;

function localE2eDatabaseEnabled() {
  return process.env.CI === 'true' && process.env.BUILDPAIR_E2E_MODE === '1' && !process.env.VERCEL_ENV;
}

function postgresTag(pool: pg.Pool): SqlTag {
  return async (strings, ...values) => {
    let text = strings[0] ?? '';
    for (let index = 0; index < values.length; index += 1) {
      text += `$${index + 1}${strings[index + 1] ?? ''}`;
    }
    const result = await pool.query(text, values);
    return result.rows;
  };
}

export function getSql(): SqlTag {
  if (cached) return cached;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');

  if (localE2eDatabaseEnabled()) {
    e2ePool ??= new pg.Pool({ connectionString, ssl: false });
    cached = postgresTag(e2ePool);
    return cached;
  }

  cached = neon(connectionString) as unknown as SqlTag;
  return cached;
}
