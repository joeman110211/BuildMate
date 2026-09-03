import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let cached: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (cached) return cached;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');
  cached = drizzle(neon(connectionString), { schema });
  return cached;
}
