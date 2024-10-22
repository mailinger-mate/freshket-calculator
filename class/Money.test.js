import { expect, test, describe, vi } from 'vitest';
import { Money } from './Money.js';

describe('Money', () => {
  test('constructor()', () => {
    expect(new Money(100, 'USD')).toEqual({
      amount: 100,
      currency: 'USD'
    });
  });
  test('rates', async () => {
    expect(await Money.rates).toEqual(new Map([
      ['USD', 1],
      ['EUR', expect.any(Number)],
      ['THB', expect.any(Number)],
      ['JPY', expect.any(Number)],
    ]));
  });
  test('derive()', () => {
    expect(new Money(100, 'JPY').derive(amount => amount * 2)).toEqual({
      amount: 200,
      currency: 'JPY'
    });
  });
  test('exchange()', async () => {
    const rates = await Money.rates;
    expect(await new Money(100, 'USD').exchange('EUR', (amount => amount * 3))).toEqual({
      amount: 100 * 3 * rates.get('EUR'),
      currency: 'EUR',
    });
  });
  test('toString()', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(new Money(100, 'USD').toString()).toEqual('$100.00');
    expect(new Money(100, 'EUR').toString()).toEqual('€100.00');
    expect(new Money(100, 'JPY').toString()).toEqual('¥100');
  });
})