import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';

export async function GET() {
  const startedAt = Date.now();

  try {
    const db = getDb();
    await db.execute(sql`select 1`);

    return Response.json({
      status: 'ok',
      service: 'buildmate-api',
      database: 'ok',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        status: 'error',
        service: 'buildmate-api',
        database: 'unavailable',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
