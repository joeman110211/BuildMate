import { createClerkClient } from '@clerk/backend';
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

function redactServerError(value: string) {
  return value
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer [redacted]')
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, 'postgres://[redacted]@')
    .replace(/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9_]+\b/g, '[redacted-key]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]');
}

function productionErrorId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizedOrigin(value: string | undefined) {
  if (!value?.trim()) return null;
  try { return new URL(value.trim()).origin; } catch { return null; }
}

function clerkAuthorizedParties() {
  const origins = new Set<string>();
  for (const value of [
    process.env.APP_URL,
    process.env.EXPO_PUBLIC_API_URL,
    process.env.BUILDPAIR_PUBLIC_ORIGIN,
    'https://staging.buildpair.co.uk',
    'https://www.buildpair.co.uk',
    'https://buildpair.co.uk',
  ]) {
    const origin = normalizedOrigin(value);
    if (origin) origins.add(origin);
  }
  return [...origins];
}

export async function authenticatedUserId(request: Request) {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!secretKey) throw new Error('CLERK_SECRET_KEY is not configured');
  if (!publishableKey) throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not configured');

  const clerk = createClerkClient({ secretKey, publishableKey });
  try {
    const state = await clerk.authenticateRequest(request, {
      acceptsToken: 'session_token',
      authorizedParties: clerkAuthorizedParties(),
    });

    if (!state.isAuthenticated) {
      console.warn('[buildpair-auth] Clerk request was not authenticated', {
        status: state.status,
        reason: state.reason,
        message: state.message ? redactServerError(state.message) : null,
      });
      throw new HttpError(401, 'Invalid authentication token');
    }

    const auth = state.toAuth();
    if (!auth.userId) throw new HttpError(401, 'Invalid authentication token');
    return auth.userId;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.warn('[buildpair-auth] Clerk request authentication failed', {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? redactServerError(error.message) : undefined,
    });
    throw new HttpError(401, 'Invalid authentication token');
  }
}

export async function accountAccess(userId: string) {
  const rows = await getSql()`
    SELECT is_admin AS "isAdmin", is_suspended AS "isSuspended", suspension_reason AS "suspensionReason",
           coalesce(is_deleted, false) AS "isDeleted"
    FROM users WHERE id = ${userId} LIMIT 1
  ` as { isAdmin: boolean; isSuspended: boolean; suspensionReason: string; isDeleted: boolean }[];
  const row = rows[0];
  return {
    isAdmin: Boolean(row?.isAdmin || bootstrapAdminIds().has(userId)),
    isSuspended: Boolean(row?.isSuspended),
    isDeleted: Boolean(row?.isDeleted),
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
  ` as { customerEnabled: boolean; traderEnabled: boolean; activeMode: AccountMode | null }[];
  const row = rows[0];
  return {
    customerEnabled: Boolean(row?.customerEnabled),
    traderEnabled: Boolean(row?.traderEnabled),
    activeMode: row?.activeMode ?? null,
  };
}

async function assertAccountActive(userId: string) {
  const access = await accountAccess(userId);
  if (access.isDeleted) throw new HttpError(410, 'This BuildPair account has been deleted');
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

  // The Clerk session has already been verified above. The Clerk user id is
  // enough to establish the local BuildPair account; optional identity fields
  // can be synchronized separately without blocking a user's first login.
  const [created] = await db.insert(users).values({ id: userId }).onConflictDoNothing().returning();
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

export function jsonError(error: unknown) {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  if (error && typeof error === 'object' && 'issues' in error) {
    return Response.json({ error: 'Invalid request', details: (error as { issues: unknown }).issues }, { status: 400 });
  }

  const errorId = productionErrorId();
  if (error instanceof Error) {
    console.error('[buildpair-api]', {
      errorId,
      name: error.name,
      message: redactServerError(error.message),
      stack: redactServerError(error.stack ?? ''),
    });
  } else {
    console.error('[buildpair-api]', { errorId, type: typeof error });
  }

  return Response.json({ error: 'Internal server error', errorId }, { status: 500 });
}
