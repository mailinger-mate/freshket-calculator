import { expect, test, describe } from 'vitest';
import { Money, Monies } from './Money.js';
import { Order } from './Order.js';

describe('Order', async () => {
  const inventory = await Order.inventory;
  const discounts = await Order.discounts;
  const currency = 'THB';
  const memberId = 'member';
  const items = { red: 7, green: 6, blue: 3, yellow: 0, pink: 5, purple: 7, orange: 2 };
  test('Constructor arguments as properties', () => {
    const order = new Order(memberId, currency, items);
    expect(order).toEqual({
      currency,
      memberId,
      items
    });
  });
  test('Inventory of red, green, blue, yellow, pink, purple and orange', () => {
    expect(inventory).toEqual({
      red: new Money(50, 'THB'),
      green: new Money(40, 'THB'),
      blue: new Money(30, 'THB'),
      yellow: new Money(50, 'THB'),
      pink: new Money(80, 'THB'),
      purple: new Money(90, 'THB'),
      orange: new Money(120, 'THB'),
    });
  })
  test('5% discount on doubles of orange, pink and green', async () => {
    const discount5PctEvery2 = discounts.find(discount => discount.id === '5%EVERY2');
    const values = await discount5PctEvery2.calculate(new Order(memberId, 'THB', items ));
    expect(values).toEqual({
      green: new Money(-12, 'THB'),
      pink: new Money(-16, 'THB'),
      orange: new Money(-12, 'THB'),
    });
  });
  test('10% discount for members', async () => {
    const discount10PctMember = discounts.find(discount => discount.id === '10%MEMBER');
    const values = await discount10PctMember.calculate(new Order(memberId, currency, items ));
    for (const id in values) {
      expect(values[id]).toEqual(-0.1);
    }
  });
  test('No discount for non members', async () => {
    const discount10PctMember = discounts.find(discount => discount.id === '10%MEMBER');
    const values = await discount10PctMember.calculate(new Order(null, currency, items ));
    expect(values).toEqual({});
  });
  test('Discounts', async () => {
    const values = await new Order(memberId, currency, items).calculateDiscounts();
    expect(values).toEqual({
      red: new Monies(new Money(-35, 'THB')),
      green: new Monies(new Money(-12, 'THB'), new Money(-22.8, 'THB')),
      blue: new Monies(new Money(-9, 'THB')),
      pink: new Monies(new Money(-16, 'THB'), new Money(-38.4, 'THB')),
      purple: new Monies(new Money(-63, 'THB')),
      orange: new Monies(new Money(-12, 'THB'), new Money(-22.8, 'THB')),
    });
  });
  test('Total quantity', () => {
    const totalQuantity = new Order(memberId, currency, items).getTotalQuantity();
    expect(totalQuantity).toEqual(30);
  });
  test('Total discount', async () => {
    const totalDiscount = await new Order(memberId, currency, items).calculateTotalDiscount();
    expect(totalDiscount).toEqual(new Money(-231, 'THB'));
  });
  test('Subtotal', async () => {
    const subtotal = await new Order(memberId, currency, items).calculateSubtotal();
    expect(subtotal).toEqual(new Money(1950, 'THB'));
  });
  test('Total', async () => {
    const total = await new Order(memberId, currency, items).calculateTotal();
    expect(total).toEqual(new Money(1719, 'THB'));
  });
})