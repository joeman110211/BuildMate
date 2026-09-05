export const TRADER_TRIAL_DAYS = 14;

export function trialEndsAt(from: Date | string = new Date()) {
  const startedAt = from instanceof Date ? from : new Date(from);
  return new Date(startedAt.getTime() + TRADER_TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function hasActiveLeadAccess(profile: {
  isSubscriptionActive: boolean;
  createdAt?: Date | string | null;
  trialEndsAt?: Date | string | null;
  stripeSubscriptionId?: string | null;
}) {
  if (!profile.isSubscriptionActive) return false;
  if (profile.stripeSubscriptionId) return true;

  const createdMinimum = profile.createdAt ? trialEndsAt(profile.createdAt).getTime() : null;
  const storedEnd = profile.trialEndsAt ? new Date(profile.trialEndsAt).getTime() : null;
  const effectiveEnd = createdMinimum != null && storedEnd != null
    ? Math.max(createdMinimum, storedEnd)
    : createdMinimum ?? storedEnd;

  // Existing beta accounts may already have been granted a longer stored trial.
  // Honour that commitment while new accounts use the 14-day product rule.
  if (effectiveEnd == null) return true;
  return effectiveEnd > Date.now();
}
