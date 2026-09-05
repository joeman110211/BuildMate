import { createClerkClient, verifyToken } from '@clerk/backend';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { users } from '@/db/schema';
import { getSql } from '@/lib/sql';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type AccountMode = 'customer' | 'trader';

export type AccountModes = {
  customerEnabled: boolean;
  traderEnabled: boolean;
  activeMode: AccountMode | null;
};

function bootstrapAdminIds() {
  return new Set((process.env.ADMIN_CLERK_USER_IDS ?? '').split(',').map((value) => value.trim()).filter(Boolean));
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

export async function accountAccess(userId: string) {
  const rows = await getSql()`
    SELECT is_admin AS "isAdmin", is_suspended AS "isSuspended", suspension_reason AS "suspensionReason"
    FROM users WHERE id = ${userId} LIMIT 1
  ` as { isAdmin: boolean; isSuspended: boolean; suspensionReason: string }[];
  const row = rows[0];
  return {
    isAdmin: Boolean(row?.isAdmin || bootstrapAdminIds().has(userId)),
    isSuspended: Boolean(row?.isSuspended),
    suspensionReason: row?.suspensionReason ?? '',
  };
}

export async function accountModes(userId: string): Promise<AccountModes> {
  const rows = await getSql()`
    SELECT
      customer_enabled AS "customerEnabled",
      trader_enabled AS "traderEnabled",
      active_mode AS "activeMode"
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  ` as Array<{ customerEnabled: boolean; traderEnabled: boolean; activeMode: AccountMode | null }>;
  const row = rows[0];
  return {
    customerEnabled: Boolean(row?.customerEnabled),
    traderEnabled: Boolean(row?.traderEnabled),
    activeMode: row?.activeMode ?? null,
  };
}

async function assertAccountActive(userId: string) {
  const access = await accountAccess(userId);
  if (access.isSuspended) throw new HttpError(403, access.suspensionReason ? `Account suspended: ${access.suspensionReason}` : 'Account suspended');
  return access;
}

export async function ensureDbUser(userId: string) {
  const db = getDb();
  const existing = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (existing) {
    await assertAccountActive(userId);
    return existing;
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error('CLERK_SECRET_KEY is not configured');
  const clerk = createClerkClient({ secretKey });
  const identity = await clerk.users.getUser(userId);
  const [created] = await db.insert(users).values({
    id: userId,
    email: identity.primaryEmailAddress?.emailAddress ?? null,
    phone: identity.primaryPhoneNumber?.phoneNumber ?? null,
  }).onConflictDoNothing().returning();
  const user = created ?? await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new Error('Unable to synchronize user');
  await assertAccountActive(userId);
  return user;
}

export async function requireRole(request: Request, role: AccountMode) {
  const id = await authenticatedUserId(request);
  const user = await ensureDbUser(id);
  const modes = await accountModes(id);
  const enabled = role === 'customer' ? modes.customerEnabled : modes.traderEnabled;
  if (!enabled) throw new HttpError(403, `${role} account required`);
  return { ...user, ...modes };
}

export async function requireAdmin(request: Request) {
  const id = await authenticatedUserId(request);
  const user = await ensureDbUser(id);
  const access = await accountAccess(id);
  if (!access.isAdmin) throw new HttpError(403, 'Administrator access required');
  return { user, access };
}

function providerCategory(error: unknown) {
  if (!error || typeof error !== 'object') return 'unknown';
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  const name = 'name' in error ? String((error as { name?: unknown }).name ?? '') : '';
  if (/^(22|23|42|08)/.test(code)) return 'database';
  if (/Stripe/i.test(name)) return 'stripe';
  if (/Clerk/i.test(name)) return 'auth';
  return 'application';
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
  }
  if (error && typeof error === 'object' && 'issues' in error) {
    return Response.json(
      { error: 'Invalid request', details: (error as { issues: unknown }).issues },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const errorId = randomUUID();
  const candidate = error as { name?: unknown; code?: unknown; stack?: unknown } | null;
  const event = {
    event: 'buildpair_api_error',
    errorId,
    category: providerCategory(error),
    name: candidate?.name ? String(candidate.name).slice(0, 120) : 'UnknownError',
    code: candidate?.code ? String(candidate.code).slice(0, 80) : undefined,
    // Full stacks stay out of production logs because provider/database stacks can
    // contain request values. Local/dev logs retain the stack for debugging.
    stack: process.env.NODE_ENV === 'production' ? undefined : candidate?.stack,
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(event));
  return Response.json(
    { error: 'Internal server error', errorId },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  );
}
