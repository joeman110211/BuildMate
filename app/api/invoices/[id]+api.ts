import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { invoices } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';

export async function PATCH(request: Request, { id }: { id: string }) {
  try {
    const trader = await requireRole(request, 'trader');
    const { action } = await request.json() as { action?: 'paid' | 'void' };
    if (action !== 'paid' && action !== 'void') throw new HttpError(400, 'Unsupported invoice action');

    const db = getDb();
    const current = await db.query.invoices.findFirst({ where: and(eq(invoices.id, id), eq(invoices.traderId, trader.id)) });
    if (!current) throw new HttpError(404, 'Invoice not found');
    if (current.status === 'void') throw new HttpError(409, 'A void invoice cannot be changed');
    if (current.status === 'paid' && action !== 'paid') throw new HttpError(409, 'A paid invoice cannot be voided');

    const [updated] = await db.update(invoices).set({ status: action, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.traderId, trader.id))).returning();
    return Response.json(updated);
  } catch (error) { return jsonError(error); }
}
