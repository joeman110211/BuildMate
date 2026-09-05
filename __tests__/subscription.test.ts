import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasActiveLeadAccess, trialEndsAt, TRADER_TRIAL_DAYS } from '@/lib/subscription';

describe('trader trial access', () => {
  afterEach(() => vi.useRealTimers());

  it('creates a trial exactly 14 days after the start date', () => {
    const start = new Date('2026-09-04T12:00:00.000Z');
    expect(TRADER_TRIAL_DAYS).toBe(14);
    expect(trialEndsAt(start).toISOString()).toBe('2026-09-18T12:00:00.000Z');
  });

  it('keeps an active unbilled trader inside the 14-day window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T12:00:00.000Z'));
    expect(hasActiveLeadAccess({
      isSubscriptionActive: true,
      createdAt: '2026-09-04T12:00:00.000Z',
      trialEndsAt: '2026-09-18T12:00:00.000Z',
      stripeSubscriptionId: null,
    })).toBe(true);
  });

  it('honours a longer trial already granted to an existing beta account', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-25T12:00:00.000Z'));
    expect(hasActiveLeadAccess({
      isSubscriptionActive: true,
      createdAt: '2026-09-04T12:00:00.000Z',
      trialEndsAt: '2026-10-02T12:00:00.000Z',
      stripeSubscriptionId: null,
    })).toBe(true);
  });

  it('removes unbilled lead access after the 14-day trial expires', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-19T12:00:00.000Z'));
    expect(hasActiveLeadAccess({
      isSubscriptionActive: true,
      createdAt: '2026-09-04T12:00:00.000Z',
      trialEndsAt: '2026-09-18T12:00:00.000Z',
      stripeSubscriptionId: null,
    })).toBe(false);
  });

  it('keeps a paid Stripe subscriber active after the trial date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T12:00:00.000Z'));
    expect(hasActiveLeadAccess({
      isSubscriptionActive: true,
      trialEndsAt: '2026-09-18T12:00:00.000Z',
      stripeSubscriptionId: 'sub_test_123',
    })).toBe(true);
  });
});
