export const TRADER_TRIAL_DAYS = 14;

export function trialEndsAt(from = new Date()) {
  return new Date(from.getTime() + TRADER_TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function hasActiveLeadAccess(profile: {
  isSubscriptionActive: boolean;
  trialEndsAt?: Date | string | null;
  stripeSubscriptionId?: string | null;
}) {
  if (!profile.isSubscriptionActive) return false;
  if (profile.stripeSubscriptionId) return true;
  if (!profile.trialEndsAt) return true;
  return new Date(profile.trialEndsAt).getTime() > Date.now();
}
