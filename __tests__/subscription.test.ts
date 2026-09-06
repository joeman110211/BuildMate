import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasActiveLeadAccess, traderWorkTypeLimit, trialEndsAt, TRADER_TRIAL_DAYS, TRADER_WORK_TYPE_LIMITS } from '@/lib/subscription';

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

describe('trader work-type plan limits', () => {
  it('uses the 3, 6, 9 plan ladder', () => {
    expect(TRADER_WORK_TYPE_LIMITS).toEqual({ free: 3, basic: 6, featured: 9 });
  });

  it('keeps new and trial traders at three work types', () => {
    expect(traderWorkTypeLimit()).toBe(3);
    expect(traderWorkTypeLimit({ subscriptionTier: 'basic', isSubscriptionActive: true, stripeSubscriptionId: null })).toBe(3);
  });

  it('unlocks six work types for an active paid Basic subscriber', () => {
    expect(traderWorkTypeLimit({ subscriptionTier: 'basic', isSubscriptionActive: true, stripeSubscriptionId: 'sub_basic' })).toBe(6);
  });

  it('unlocks nine work types for an active paid Featured subscriber', () => {
    expect(traderWorkTypeLimit({ subscriptionTier: 'featured', isSubscriptionActive: true, stripeSubscriptionId: 'sub_featured' })).toBe(9);
  });

  it('drops a cancelled paid plan back to three work types', () => {
    expect(traderWorkTypeLimit({ subscriptionTier: 'featured', isSubscriptionActive: false, stripeSubscriptionId: 'sub_cancelled' })).toBe(3);
  });
});
