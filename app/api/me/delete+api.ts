import { createClerkClient } from '@clerk/backend';
import { z } from 'zod';
import { assertRateLimit } from '@/lib/rate-limit';
import { authenticatedUserId, jsonError } from '@/lib/server';
import { getSql } from '@/lib/sql';

const schema = z.object({ confirmation: z.literal('DELETE MY ACCOUNT') });

export async function POST(request: Request) {
  try {
    const userId = await authenticatedUserId(request);
    await assertRateLimit(request, 'account-delete', 3, 3600, userId);
    schema.parse(await request.json());

    // The database scrub is deliberately idempotent. Do not call ensureDbUser()
    // here: if Clerk deletion failed after the database scrub on a previous
    // attempt, the user must still be able to retry and finish deleting the
    // remaining Clerk identity instead of being trapped behind is_deleted.
    await getSql()`SELECT buildpair_delete_account(${userId})`;

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) throw new Error('CLERK_SECRET_KEY is not configured');
    const clerk = createClerkClient({ secretKey });
    await clerk.users.deleteUser(userId);

    return Response.json({ deleted: true });
  } catch (error) { return jsonError(error); }
}
