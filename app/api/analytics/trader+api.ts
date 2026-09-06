import { getSql } from '@/lib/sql';
import { HttpError, jsonError, requireRole } from '@/lib/server';

export async function GET(request: Request) {
  try {
    const trader = await requireRole(request, 'trader');
    const sql = getSql();
    const plans = await sql`
      SELECT subscription_tier AS "subscriptionTier", is_subscription_active AS "isSubscriptionActive"
      FROM trader_profiles
      WHERE user_id = ${trader.id}
      LIMIT 1
    ` as unknown as { subscriptionTier: 'free' | 'basic' | 'featured'; isSubscriptionActive: boolean }[];
    const plan = plans[0];
    if (!plan) throw new HttpError(409, 'Complete your trader profile first');
    if (plan.subscriptionTier !== 'featured' || !plan.isSubscriptionActive) {
      throw new HttpError(402, 'BuildPair Pro is required for advanced business analytics');
    }

    const rows = await sql`
      SELECT
        coalesce((SELECT sum(view_count) FROM trader_profile_view_daily WHERE trader_id = ${trader.id} AND view_day >= current_date - 29), 0)::int AS "profileViews30d",
        coalesce((SELECT sum(view_count) FROM trader_profile_view_daily WHERE trader_id = ${trader.id} AND view_day BETWEEN current_date - 59 AND current_date - 30), 0)::int AS "profileViewsPrevious30d",
        (SELECT count(*) FROM saved_traders WHERE trader_id = ${trader.id})::int AS "savedByHomeowners",
        (SELECT count(*) FROM jobs WHERE target_trader_id = ${trader.id})::int AS "directLeads",
        (SELECT count(*) FROM quotes WHERE trader_id = ${trader.id})::int AS "quotesSent",
        (SELECT count(*) FROM quotes WHERE trader_id = ${trader.id} AND status = 'accepted')::int AS "quotesWon",
        coalesce((SELECT avg(total_amount) FROM quotes WHERE trader_id = ${trader.id}), 0)::int AS "averageQuote",
        coalesce((SELECT sum(q.total_amount) FROM quotes q JOIN jobs j ON j.accepted_quote_id = q.id WHERE q.trader_id = ${trader.id}), 0)::bigint AS "wonJobValue",
        (SELECT count(*) FROM jobs j JOIN quotes q ON j.accepted_quote_id = q.id WHERE q.trader_id = ${trader.id} AND j.status = 'completed')::int AS "completedJobs",
        coalesce((SELECT avg(rating) FROM reviews WHERE trader_id = ${trader.id} AND verified_completion = true), 0)::float AS "averageRating",
        (SELECT count(*) FROM reviews WHERE trader_id = ${trader.id} AND verified_completion = true)::int AS "reviewCount",
        coalesce((SELECT avg(extract(epoch from (q.created_at - j.created_at)) / 3600.0) FROM quotes q JOIN jobs j ON j.id = q.job_id WHERE q.trader_id = ${trader.id}), 0)::float AS "averageQuoteResponseHours",
        (SELECT count(*) FROM saved_job_searches WHERE trader_id = ${trader.id} AND enabled = true)::int AS "activeSavedSearches",
        (SELECT count(*) FROM trader_credentials WHERE trader_id = ${trader.id} AND status = 'verified' AND (expires_at IS NULL OR expires_at > now()))::int AS "verifiedCredentials"
    ` as unknown as Array<Record<string, unknown>>;
    const metrics = rows[0] ?? {};
    const sent = Number(metrics.quotesSent ?? 0);
    const won = Number(metrics.quotesWon ?? 0);
    return Response.json({ ...metrics, quoteWinRate: sent ? Math.round((won / sent) * 1000) / 10 : 0 });
  } catch (error) { return jsonError(error); }
}
