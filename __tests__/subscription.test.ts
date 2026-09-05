import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasActiveLeadAccess, paymentsEnabled, trialEndsAt, TRADER_TRIAL_DAYS } from '@/lib/subscription';

describe('trader lead access', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('creates a trial exactly 28 days after the start date', () => {
    const start = new Date('2026-09-04T12:00:00.000Z');
    expect(TRADER_TRIAL_DAYS).toBe(28);
    expect(trialEndsAt(start).toISOString()).toBe('2026-10-02T12:00:00.000Z');
  });

  it('keeps beta traders active after the trial while payments are disabled', () => {
    vi.stubEnv('BUILDPAIR_PAYMENTS_ENABLED', 'off');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-01-01T12:00:00.000Z'));
    expect(paymentsEnabled()).toBe(false);
    expect(hasActiveLeadAccess({
      isSubscriptionActive: false,
      createdAt: '2026-09-04T12:00:00.000Z',
      trialEndsAt: '2026-10-02T12:00:00.000Z',
      stripeSubscriptionId: null,
    })).toBe(true);
  });

  it('enforces trial expiry once payments are deliberately enabled', () => {
    vi.stubEnv('BUILDPAIR_PAYMENTS_ENABLED', 'true');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-03T12:00:00.000Z'));
    expect(paymentsEnabled()).toBe(true);
    expect(hasActiveLeadAccess({
      isSubscriptionActive: true,
      createdAt: '2026-09-04T12:00:00.000Z',
      trialEndsAt: '2026-10-02T12:00:00.000Z',
      stripeSubscriptionId: null,
    })).toBe(false);
  });

  it('keeps a paid Stripe subscriber active after the trial date', () => {
    vi.stubEnv('BUILDPAIR_PAYMENTS_ENABLED', 'enabled');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T12:00:00.000Z'));
    expect(hasActiveLeadAccess({
      isSubscriptionActive: true,
      trialEndsAt: '2026-10-02T12:00:00.000Z',
      stripeSubscriptionId: 'sub_test_123',
    })).toBe(true);
  });
});
