import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { invoices } from '@/db/schema';
import { HttpError, jsonError, requireRole } from '@/lib/server';

export async function PATCH(request: Request, { id }: { id: string }) {
  try {
    const trader = await requireRole(request, 'trader');
    const { action } = await request.json() as { action?: 'send' | 'paid' | 'void' };
    if (action !== 'send' && action !== 'paid' && action !== 'void') throw new HttpError(400, 'Unsupported invoice action');

    const db = getDb();
    const current = await db.query.invoices.findFirst({ where: and(eq(invoices.id, id), eq(invoices.traderId, trader.id)) });
    if (!current) throw new HttpError(404, 'Invoice not found');
    if (current.status === 'void') throw new HttpError(409, 'A void invoice cannot be changed');
    if (current.status === 'paid' && action !== 'paid') throw new HttpError(409, 'A paid invoice cannot be changed');

    if (action === 'send') {
      if (current.status !== 'draft') throw new HttpError(409, 'Only draft invoices can be sent');
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.INVOICE_FROM_EMAIL;
      if (!apiKey || !from) throw new HttpError(503, 'Invoice email delivery is not configured');

      const money = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value / 100);
      const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
      const rows = current.items.map((item) => `<tr><td>${escape(item.description)}</td><td>${item.quantity}</td><td>${money(item.unitPrice)}</td><td>${money(Math.round(item.quantity * item.unitPrice))}</td></tr>`).join('');
      const dueText = current.dueAt ? current.dueAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : null;
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [current.customerEmail], subject: `BuildMate invoice ${current.invoiceNumber}`, html: `<h1>Invoice ${escape(current.invoiceNumber)}</h1><p>For ${escape(current.customerName)}</p><table cellpadding="8" border="1" cellspacing="0"><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><p>Subtotal: ${money(current.subtotal)}<br>VAT: ${money(current.vatAmount)}<br><strong>Total: ${money(current.totalAmount)}</strong><br>Deposit: ${money(current.depositAmount)}${dueText ? `<br><strong>Due: ${escape(dueText)}</strong>` : ''}</p>${current.notes ? `<p>${escape(current.notes)}</p>` : ''}<p>Sent securely via BuildMate.</p>` }) });
      if (!response.ok) throw new HttpError(502, 'The email provider rejected delivery');

      const [sent] = await db.update(invoices).set({ status: 'sent', updatedAt: new Date() })
        .where(and(eq(invoices.id, id), eq(invoices.traderId, trader.id), eq(invoices.status, 'draft'))).returning();
      return Response.json(sent ?? current);
    }

    const [updated] = await db.update(invoices).set({ status: action, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.traderId, trader.id))).returning();
    return Response.json(updated);
  } catch (error) { return jsonError(error); }
}
