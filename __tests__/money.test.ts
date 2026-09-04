import { describe, expect, it } from 'vitest';
import { calculateQuote, formatMoney, poundsToPence } from '@/lib/money';

describe('money helpers', () => {
  it('converts pounds to integer pennies without floating point leakage', () => {
    expect(poundsToPence('19.99')).toBe(1999);
    expect(poundsToPence('£1,234.56')).toBe(123456);
  });

  it('calculates VAT and totals', () => {
    expect(calculateQuote(10000, 2500, 0.2)).toEqual({ net: 12500, vatAmount: 2500, totalAmount: 15000 });
  });

  it('formats GBP', () => {
    expect(formatMoney(1999)).toContain('19.99');
  });
});
