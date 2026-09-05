import { createClerkClient } from '@clerk/backend';
import { z } from 'zod';
import { assertRateLimit } from '@/lib/rate-limit';
import { authenticatedUserId, ensureDbUser, jsonError } from '@/lib/server';
import { getSql } from '@/lib/sql';

const schema = z.object({ confirmation: z.literal('DELETE MY ACCOUNT') });

export async function POST(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    await ensureDbUser(userId);
    await assertRateLimit(request, 'account-delete', 3, 3600, userId);
    schema.parse(await request.json());

    await getSql()`SELECT buildpair_delete_account(${userId})`;

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) throw new Error('CLERK_SECRET_KEY is not configured');
    const clerk = createClerkClient({ secretKey });
    await clerk.users.deleteUser(userId);

    return Response.json({ deleted: true });
  } catch (error) { return jsonError(error); }
}
