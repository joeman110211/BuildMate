import { describe, expect, it } from 'vitest';
import { normalizeUkMobile } from '@/lib/phone';

describe('UK mobile normalisation', () => {
  it('accepts local, international without plus and E.164 formats', () => {
    expect(normalizeUkMobile('07911 123456')).toBe('+447911123456');
    expect(normalizeUkMobile('447911123456')).toBe('+447911123456');
    expect(normalizeUkMobile('+447911123456')).toBe('+447911123456');
  });

  it('accepts harmless separators', () => {
    expect(normalizeUkMobile('07911-123-456')).toBe('+447911123456');
    expect(normalizeUkMobile('0044 7911 123456')).toBe('+447911123456');
  });

  it('rejects invalid or non-UK mobile numbers', () => {
    expect(() => normalizeUkMobile('020 7946 0000')).toThrow();
    expect(() => normalizeUkMobile('+12015550100')).toThrow();
  });
});
