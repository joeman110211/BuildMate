import { describe, expect, it } from 'vitest';
import { jobSchema, quoteSchema, traderProfileSchema } from '@/lib/validation';

const validJob = {
  title: 'Retile main bathroom walls',
  category: 'Tiling' as const,
  propertyType: 'House' as const,
  postcode: 'TW18 4AB',
  urgency: 'Within 2 weeks' as const,
  description: 'Remove the old wall tiles, prepare the substrate and fit new porcelain tiles around the bath and shower area.',
  budgetRange: '£1,500–£5,000' as const,
  photos: [],
};

describe('marketplace validation', () => {
  it('accepts a valid customer job', () => {
    expect(jobSchema.parse(validJob)).toMatchObject({ category: 'Tiling', postcode: 'TW18 4AB' });
  });

  it('rejects an unrealistically short job description', () => {
    expect(jobSchema.safeParse({ ...validJob, description: 'Tile it please' }).success).toBe(false);
  });

  it('rejects a quote where the deposit consumes the whole total', () => {
    const result = quoteSchema.safeParse({
      jobId: '10000000-0000-4000-8000-000000000001',
      laborCost: 100000,
      materialsCost: 50000,
      vatAmount: 0,
      depositAmount: 150000,
      paymentTerms: 'Balance on completion',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a sensible staged quote', () => {
    const result = quoteSchema.safeParse({
      jobId: '10000000-0000-4000-8000-000000000001',
      laborCost: 100000,
      materialsCost: 50000,
      vatAmount: 0,
      depositAmount: 30000,
      paymentTerms: '£300 deposit with the balance due on completion',
    });
    expect(result.success).toBe(true);
  });

  it('requires traders to self-certify before a profile can be saved', () => {
    const profile = {
      businessName: 'Example Tiling',
      tradeCategory: 'Tiling' as const,
      subSkills: ['Bathrooms'],
      bio: 'Experienced wall and floor tiler covering domestic bathroom and flooring projects across Surrey and West London.',
      radiusMiles: 25,
      postcode: 'TW18 4AB',
      qualifications: [],
      externalLinks: {},
      photos: [],
      selfCertified: false,
    };
    expect(traderProfileSchema.safeParse(profile).success).toBe(false);
  });
});
