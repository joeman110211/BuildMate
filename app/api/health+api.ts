import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';

function releaseSha() {
  return process.env.BUILDPAIR_BUILD_SHA?.trim() || null;
}

export async function GET() {
  const startedAt = Date.now();

  if (!process.env.DATABASE_URL) {
    return Response.json(
      {
        status: 'error',
        service: 'buildpair-api',
        database: 'unavailable',
        releaseSha: releaseSha(),
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
      releaseSha: releaseSha(),
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        status: 'error',
        service: 'buildpair-api',
        database: 'unavailable',
        releaseSha: releaseSha(),
        reason: 'database_connection_failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
