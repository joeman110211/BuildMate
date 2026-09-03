import { createClerkClient, verifyToken } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function authenticatedUserId(request: Request) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Authentication required');
  const token = header.slice(7);
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY is not configured');
  const payload = await verifyToken(token, { secretKey });
  if (!payload.sub) throw new HttpError(401, 'Invalid authentication token');
  return payload.sub;
}

export async function ensureDbUser(userId: string) {
  const db = getDb();
  const existing = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (existing) return existing;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY is not configured');
  const clerk = createClerkClient({ secretKey });
  const identity = await clerk.users.getUser(userId);
  const [created] = await db.insert(users).values({
    id: userId,
    email: identity.primaryEmailAddress?.emailAddress ?? null,
    phone: identity.primaryPhoneNumber?.phoneNumber ?? null,
  }).onConflictDoNothing().returning();
  if (created) return created;
  const raced = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!raced) throw new Error('Unable to synchronize user');
  return raced;
}

export async function requireRole(request: Request, role: 'customer' | 'trader') {
  const id = await authenticatedUserId(request);
  const user = await ensureDbUser(id);
  if (user.role !== role) throw new HttpError(403, `${role} account required`);
  return user;
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  if (error && typeof error === 'object' && 'issues' in error) {
    return Response.json({ error: 'Invalid request', details: (error as { issues: unknown }).issues }, { status: 400 });
  }
  console.error(error);
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}
