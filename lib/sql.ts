import { neon } from '@neondatabase/serverless';

let cached: ReturnType<typeof neon> | undefined;

export function getSql() {
  if (cached) return cached;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');
  cached = neon(connectionString);
  return cached;
}
