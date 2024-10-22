import { Discount } from './Discount.js';
import { Money, Monies } from './Money.js';

export class Order {
  /** @type {string} Currency of the order */
  currency;
  /** @type {string | undefined} Member ID for the order */
  memberId;
  /** @type {Object<string, number>} Items in the order */
  items = {};
  /** @type {Promise<Object<string, Money>>} Items available to order */
  static inventory = Promise.resolve({
    red: new Money(50, 'THB'),
    green: new Money(40, 'THB'),
    blue: new Money(30, 'THB'),
    yellow: new Money(50, 'THB'),
    pink: new Money(80, 'THB'),
    purple: new Money(90, 'THB'),
    orange: new Money(120, 'THB'),
  });
  static discounts = Promise.resolve([
    new Discount('5%EVERY2', ['orange', 'pink', 'green'], async (order, items) => {
      /** @type {Object<string, Money>} */
      const discounts = {}
      const inventory = await Order.inventory;
      for (const id in order.items) {
        const quantity = order.items[id];
        const price = inventory[id];
        if (items.includes(id)) {
          console.log('discount')
          discounts[id] = new Money(-Math.floor(quantity / 2) * price.amount * 2 * 0.05, price.currency);
        }
      }
      return discounts;
    }),
    new Discount('10%MEMBER', ['*'], (order) => {
      /** @type {Object<string, Money>} */
      const discounts = {};
      if (order.memberId) for (const id in order.items) {
        discounts[id] = -0.1;
      }
      return discounts;
    })
  ]);
  /** Create an order
   * @param {string} memberId Member ID for the order
   * @param {string} currency Currency of the order
   * @param {Object<string, Money>} items Items in the order
   */
  constructor(memberId, currency, items = {}) {
    this.currency = currency;
    this.memberId = memberId;
    this.items = items;
  }
  /** Get total quantity of items in the order */
  getTotalQuantity() {
    let totalQuantity = 0;
    for (const id in this.items) {
      totalQuantity += this.items[id] || 0;
    }
    return totalQuantity;
  }
  /**
   * Calculate Monies from every Discount mapped to each order item.
   * 1. Map the Monies discounts per item
   * 2. Map the percentage discounts per item
   * 3. Push the Money discounts from the compounded percentage discounts per item
   * */
  async calculateDiscounts() {
    const inventory = await Order.inventory;
    /** @type {Object<string, Monies>} */
    const discounts = {};
    /** @type {Object<string, number[]>} */
    const percentages = {};
    for (const discount of await Order.discounts) {
      const values = await discount.calculate(this);
      for (const id in values) {
        if (!inventory[id]) continue;
        const value = values[id];
        if (value instanceof Money) {
          discounts[id] ||= new Monies();
          discounts[id].push(value);
        } else {
          percentages[id] ||= [];
          percentages[id].push(value);
        }
      }
    }
    for (const id in percentages) {
      const price = inventory[id];
      const quantity = this.items[id];
      if (!price || !quantity) continue;
      discounts[id] ||= new Monies();
      for (const percentage of percentages[id]) {
        const sum = await discounts[id].sum(this.currency);
        discounts[id].push(await price.exchange(this.currency, (amount) => 
          (amount * quantity + sum.amount) * percentage));
      }
    }
    return discounts;
  }
  /** Total discount on the order */
  async calculateTotalDiscount() {
    const discounts = await this.calculateDiscounts();
    const totalDiscount = new Money(0, this.currency);
    for (const id in discounts) {
      const sum = await discounts[id].sum(this.currency);
      totalDiscount.amount += sum.amount;
    }
    return totalDiscount;
  }
  /** Subtotal of the order */
  async calculateSubtotal() {
    const inventory = await Order.inventory;
    const subtotal = new Money(0, this.currency);
    for (const id in this.items) {
      const quantity = this.items[id];
      const price = inventory[id];
      if (!price) continue;
      const exchangedPrice = await price.exchange(this.currency);
      subtotal.amount += exchangedPrice.amount * quantity;
    }
    return subtotal;
  }
  /** Total of the order */
  async calculateTotal() {
    const subtotal = await this.calculateSubtotal();
    const totalDiscount = await this.calculateTotalDiscount();
    return subtotal.derive(amount => amount + totalDiscount.amount);
  }
}
