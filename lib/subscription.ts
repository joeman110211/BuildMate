export const TRADER_TRIAL_DAYS = 28;

const enabledValues = new Set(['1', 'true', 'on', 'enabled']);

/**
 * Payments are deliberately opt-in. Merely adding Stripe keys must never turn
 * billing on for real users; BUILDPAIR_PAYMENTS_ENABLED is the release switch.
 */
export function paymentsEnabled() {
  return enabledValues.has((process.env.BUILDPAIR_PAYMENTS_ENABLED ?? '').trim().toLowerCase());
}

export function trialEndsAt(from: Date | string = new Date()) {
  const startedAt = from instanceof Date ? from : new Date(from);
  return new Date(startedAt.getTime() + TRADER_TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function effectiveTrialEndsAt(profile: {
  createdAt?: Date | string | null;
  trialEndsAt?: Date | string | null;
}) {
  const createdMinimum = profile.createdAt ? trialEndsAt(profile.createdAt).getTime() : null;
  const storedEnd = profile.trialEndsAt ? new Date(profile.trialEndsAt).getTime() : null;
  const effectiveEnd = createdMinimum != null && storedEnd != null
    ? Math.max(createdMinimum, storedEnd)
    : createdMinimum ?? storedEnd;
  return effectiveEnd == null ? null : new Date(effectiveEnd);
}

export function hasActiveLeadAccess(profile: {
  isSubscriptionActive: boolean;
  createdAt?: Date | string | null;
  trialEndsAt?: Date | string | null;
  stripeSubscriptionId?: string | null;
}) {
  // Private beta: while billing is disabled, a real trader profile has lead
  // access regardless of an expired trial. Suspension/moderation is enforced
  // separately at the account layer. This avoids a day-29 cliff.
  if (!paymentsEnabled()) return true;

  if (!profile.isSubscriptionActive) return false;
  if (profile.stripeSubscriptionId) return true;

  const effectiveEnd = effectiveTrialEndsAt(profile);
  if (!effectiveEnd) return true;
  return effectiveEnd.getTime() > Date.now();
}

export function paidTierRequired() {
  return paymentsEnabled();
}
