export const TRADER_TRIAL_DAYS = 14;

export const TRADER_WORK_TYPE_LIMITS = {
  free: 3,
  basic: 6,
  featured: 9,
} as const;

export type TraderWorkTypeTier = keyof typeof TRADER_WORK_TYPE_LIMITS;

export function traderWorkTypeLimit(profile?: {
  subscriptionTier?: TraderWorkTypeTier | null;
  stripeSubscriptionId?: string | null;
  isSubscriptionActive?: boolean | null;
}) {
  // Trial/new traders keep the three-slot onboarding allowance. Extra work-type
  // slots are a paid-plan benefit, not a side effect of the 14-day lead trial.
  if (!profile?.stripeSubscriptionId || profile.isSubscriptionActive === false) return TRADER_WORK_TYPE_LIMITS.free;
  return TRADER_WORK_TYPE_LIMITS[profile.subscriptionTier ?? 'free'];
}

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
