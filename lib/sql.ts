import { neon } from '@neondatabase/serverless';

// BuildPair uses the Neon helper as a tagged-template query function and expects row arrays.
// Neon's public return type also includes transaction/result variants, which makes ordinary
// SELECT/INSERT/UPDATE row access unnecessarily ambiguous throughout API handlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlRow = Record<string, any>;
type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<SqlRow[]>;

let cached: ReturnType<typeof neon> | undefined;

export function getSql(): SqlTag {
  if (cached) return cached as unknown as SqlTag;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');
  cached = neon(connectionString);
  return cached as unknown as SqlTag;
}
