import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { jobs, quotes, traderProfiles } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';
import { getSql } from '@/lib/sql';
import { hasActiveLeadAccess } from '@/lib/subscription';
import { quoteSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const rows = await getDb().select().from(quotes).where(eq(quotes.traderId, trader.id));
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const db = getDb();
    const profile = await db.query.traderProfiles.findFirst({ where: eq(traderProfiles.userId, trader.id) });
    if (!profile) throw new HttpError(409, 'Complete your trader profile before quoting');

    const payload = quoteSchema.parse(await request.json());
    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, payload.jobId) });
    if (!job || !['open', 'quoted'].includes(job.status)) throw new HttpError(409, 'This job is not open for quotes');
    if (job.targetTraderId && job.targetTraderId !== trader.id) throw new HttpError(403, 'This direct lead belongs to another tradesperson');
    if (!hasActiveLeadAccess(profile) || profile.subscriptionTier === 'free') throw new HttpError(402, 'An active lead subscription is required to send quotes');
    if (!job.targetTraderId && profile.subscriptionTier !== 'featured') throw new HttpError(402, 'Featured subscription required to quote open marketplace jobs');

    const totalAmount = payload.laborCost + payload.materialsCost + payload.vatAmount;
    const validUntil = payload.validUntil ? new Date(payload.validUntil) : null;
    const [quote] = await db.insert(quotes).values({ ...payload, totalAmount, traderId: trader.id, validUntil })
      .onConflictDoUpdate({ target: [quotes.jobId, quotes.traderId], set: { ...payload, status: 'pending', totalAmount, updatedAt: new Date(), validUntil } }).returning();
    await db.update(jobs).set({ status: 'quoted', updatedAt: new Date() }).where(eq(jobs.id, payload.jobId));

    const conversations = await getSql()`
      INSERT INTO conversations(job_id, customer_id, trader_id)
      VALUES (${payload.jobId}, ${job.customerId}, ${trader.id})
      ON CONFLICT (job_id, customer_id, trader_id)
      DO UPDATE SET updated_at = now()
      RETURNING id
    ` as { id: string }[];

    return Response.json({ ...quote, conversationId: conversations[0]?.id ?? null }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
