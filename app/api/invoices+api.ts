import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { invoices } from '@/db/schema';
import { sendInvoiceEmail } from '@/lib/invoice-email';
import { jsonError, requireRole } from '@/lib/server';
import { invoiceSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    return Response.json(await getDb().select().from(invoices).where(eq(invoices.traderId, trader.id)).orderBy(desc(invoices.createdAt)));
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const payload = invoiceSchema.parse(await request.json());
    const { sendNow, dueAt, customerId, jobId, ...invoiceFields } = payload;
    const subtotal = invoiceFields.items.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPrice), 0);
    const totalAmount = subtotal + invoiceFields.vatAmount;
    const db = getDb();
    const [invoice] = await db.insert(invoices).values({
      ...invoiceFields,
      traderId: trader.id,
      customerId: customerId ?? null,
      jobId: jobId ?? null,
      dueAt: dueAt ? new Date(dueAt) : null,
      subtotal,
      totalAmount,
      status: 'draft',
    }).returning();
    if (!invoice) throw new Error('Invoice could not be created');

    let savedInvoice = invoice;
    let deliveryWarning: string | undefined;
    let deliveryId: string | undefined;
    if (sendNow) {
      const delivery = await sendInvoiceEmail({
        invoiceNumber: payload.invoiceNumber,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        items: payload.items,
        subtotal,
        vatAmount: payload.vatAmount,
        depositAmount: payload.depositAmount,
        totalAmount,
        dueAt: dueAt ? new Date(dueAt) : null,
        notes: payload.notes,
      });
      if (!delivery.ok) {
        deliveryWarning = delivery.reason === 'not_configured'
          ? 'Invoice saved as a draft because email delivery is not configured'
          : 'Invoice saved as a draft because the email provider rejected delivery';
      } else {
        deliveryId = delivery.id;
        const [sentInvoice] = await db.update(invoices).set({ status: 'sent', updatedAt: new Date() }).where(eq(invoices.id, invoice.id)).returning();
        savedInvoice = sentInvoice ?? invoice;
      }
    }
    return Response.json({ ...savedInvoice, deliveryWarning, deliveryId }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
