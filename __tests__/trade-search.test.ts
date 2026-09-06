import { describe, expect, it } from 'vitest';
import { searchTraders } from '@/lib/trade-search';
import type { TraderProfile } from '@/types';

function trader(overrides: Partial<TraderProfile>): TraderProfile {
  return {
    id: overrides.id ?? 'trader',
    userId: overrides.userId ?? 'user',
    businessName: overrides.businessName ?? 'Local Trade Co',
    tradeCategory: overrides.tradeCategory ?? 'General Building',
    subSkills: overrides.subSkills ?? [],
    bio: overrides.bio ?? 'Experienced local tradesperson covering domestic projects and repairs.',
    radiusMiles: overrides.radiusMiles ?? 25,
    externalLinks: overrides.externalLinks ?? {},
    photos: overrides.photos ?? [],
    subscriptionTier: overrides.subscriptionTier ?? 'basic',
    isSubscriptionActive: overrides.isSubscriptionActive ?? true,
    averageRating: overrides.averageRating ?? 4.5,
    reviewCount: overrides.reviewCount ?? 10,
    ...overrides,
  };
}

const traders = [
  trader({ id: 'tiler', businessName: 'Precision Tile Co', tradeCategory: 'Tiling', subSkills: ['Bathrooms', 'Wet rooms', 'Kitchen splashbacks'] }),
  trader({ id: 'plumber', businessName: 'Flow Plumbing', tradeCategory: 'Plumbing', subSkills: ['Leaks', 'Sinks', 'Showers', 'Bathrooms'] }),
  trader({ id: 'bathroom', businessName: 'Complete Bathrooms', tradeCategory: 'Bathroom Fitting', subSkills: ['Full bathroom refits', 'Showers', 'Bathroom tiling'] }),
  trader({ id: 'kitchen', businessName: 'Kitchen Works', tradeCategory: 'Kitchen Fitting', subSkills: ['Cabinets', 'Worktops', 'Kitchen sinks'] }),
  trader({ id: 'heating', businessName: 'Warm Home Heating', tradeCategory: 'Heating & Gas', subSkills: ['Boilers', 'Central heating', 'Radiators'] }),
  trader({ id: 'roofer', businessName: 'Dry Roofs', tradeCategory: 'Roofing', subSkills: ['Roof repairs', 'Roof leaks', 'Flat roofs'] }),
  trader({ id: 'electrician', businessName: 'Bright Spark', tradeCategory: 'Electrical', subSkills: ['Sockets', 'Lighting', 'Rewires'] }),
];

describe('related trade search', () => {
  it('matches tiler wording to tiling businesses', () => {
    expect(searchTraders(traders, 'tiler')[0]?.id).toBe('tiler');
  });

  it('matches bathroom problems across relevant trades', () => {
    const ids = searchTraders(traders, 'bathroom').map((item) => item.id);
    expect(ids).toContain('bathroom');
    expect(ids).toContain('tiler');
    expect(ids).toContain('plumber');
  });

  it('matches sink to plumbing and kitchen fitting', () => {
    const ids = searchTraders(traders, 'sink').map((item) => item.id);
    expect(ids).toContain('plumber');
    expect(ids).toContain('kitchen');
  });

  it('matches kitchen to fitting and tiling work', () => {
    const ids = searchTraders(traders, 'kitchen').map((item) => item.id);
    expect(ids).toContain('kitchen');
    expect(ids).toContain('tiler');
  });

  it('matches boiler to heating trades', () => {
    expect(searchTraders(traders, 'boiler')[0]?.id).toBe('heating');
  });

  it('matches roof leak to roofers', () => {
    expect(searchTraders(traders, 'roof leak')[0]?.id).toBe('roofer');
  });

  it('does not return unrelated traders for nonsense', () => {
    expect(searchTraders(traders, 'spaceship engine repair')).toEqual([]);
  });
});
