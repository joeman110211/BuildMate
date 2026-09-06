import { createHash } from 'node:crypto';
import { HttpError } from '@/lib/server';
import { getSql } from '@/lib/sql';

function fingerprint(request: Request, scope: string, userId?: string | null) {
  if (userId) {
    // An authenticated user must not be able to evade limits by rotating
    // User-Agent or forwarding headers. Identity is the stable abuse boundary.
    return `${scope}:user:${createHash('sha256').update(userId).digest('hex').slice(0, 32)}`;
  }

  const realIp = request.headers.get('x-real-ip')?.trim() ?? '';
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const agent = request.headers.get('user-agent') ?? '';
  const source = `${scope}|${realIp || forwarded || 'unknown'}|${agent}`;
  return `${scope}:anon:${createHash('sha256').update(source).digest('hex').slice(0, 32)}`;
}

export async function assertRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
  userId?: string | null,
) {
  const sql = getSql();
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs).toISOString();
  const bucketKey = fingerprint(request, scope, userId);

  const rows = await sql`
    INSERT INTO api_rate_limits(bucket_key, window_start, request_count)
    VALUES (${bucketKey}, ${windowStart}::timestamptz, 1)
    ON CONFLICT (bucket_key, window_start)
    DO UPDATE SET request_count = api_rate_limits.request_count + 1
    RETURNING request_count AS "requestCount"
  ` as unknown as { requestCount: number }[];

  const count = Number(rows[0]?.requestCount ?? 1);
  if (count > limit) throw new HttpError(429, 'Too many requests. Please try again shortly.');

  // Opportunistic cleanup keeps the table small without requiring another service.
  if (Math.random() < 0.01) {
    void sql`DELETE FROM api_rate_limits WHERE window_start < now() - interval '2 days'`.catch(() => undefined);
  }

  return { remaining: Math.max(0, limit - count), limit, windowSeconds };
}
