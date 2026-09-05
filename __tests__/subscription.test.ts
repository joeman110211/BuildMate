import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasActiveLeadAccess, trialEndsAt, TRADER_TRIAL_DAYS } from '@/lib/subscription';

describe('trader beta access', () => {
  afterEach(() => vi.useRealTimers());

  it('creates a trial exactly 28 days after the start date', () => {
    const start = new Date('2026-09-04T12:00:00.000Z');
    expect(TRADER_TRIAL_DAYS).toBe(28);
    expect(trialEndsAt(start).toISOString()).toBe('2026-10-02T12:00:00.000Z');
  });

  it('keeps an active unbilled trader inside the 28-day window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-25T12:00:00.000Z'));
    expect(hasActiveLeadAccess({
      isSubscriptionActive: true,
      createdAt: '2026-09-04T12:00:00.000Z',
      trialEndsAt: '2026-10-02T12:00:00.000Z',
      stripeSubscriptionId: null,
    })).toBe(true);
  });

  it('does not let an old 14-day stored date shorten the beta window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-25T12:00:00.000Z'));
    expect(hasActiveLeadAccess({
      isSubscriptionActive: true,
      createdAt: '2026-09-04T12:00:00.000Z',
      trialEndsAt: '2026-09-18T12:00:00.000Z',
      stripeSubscriptionId: null,
    })).toBe(true);
  });

  it('removes unbilled lead access after the 28-day beta window expires', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-03T12:00:00.000Z'));
    expect(hasActiveLeadAccess({
      isSubscriptionActive: true,
      createdAt: '2026-09-04T12:00:00.000Z',
      trialEndsAt: '2026-10-02T12:00:00.000Z',
      stripeSubscriptionId: null,
    })).toBe(false);
  });

  it('keeps a paid Stripe subscriber active after the trial date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T12:00:00.000Z'));
    expect(hasActiveLeadAccess({
      isSubscriptionActive: true,
      trialEndsAt: '2026-10-02T12:00:00.000Z',
      stripeSubscriptionId: 'sub_test_123',
    })).toBe(true);
  });
});
