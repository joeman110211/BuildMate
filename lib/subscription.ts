export const TRADER_TRIAL_DAYS = 28;

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
  const endsAt = profile.trialEndsAt ? new Date(profile.trialEndsAt) : profile.createdAt ? trialEndsAt(profile.createdAt) : null;
  if (!endsAt) return true;
  return endsAt.getTime() > Date.now();
}
