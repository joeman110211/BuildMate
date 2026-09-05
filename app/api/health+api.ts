import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';

export async function GET() {
  const startedAt = Date.now();

  if (!process.env.DATABASE_URL) {
    return Response.json(
      {
        status: 'error',
        service: 'buildpair-api',
        database: 'unavailable',
        reason: 'database_url_missing',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }

  try {
    const db = getDb();
    await db.execute(sql`select 1`);

    return Response.json({
      status: 'ok',
      service: 'buildpair-api',
      database: 'ok',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        status: 'error',
        service: 'buildpair-api',
        database: 'unavailable',
        reason: 'database_connection_failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
