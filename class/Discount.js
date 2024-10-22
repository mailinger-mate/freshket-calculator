import { Money } from './Money.js';
import { Order } from './Order.js';
/**
 * @typedef {import('./Money.js').Money} Money
 * @callback CalculateDiscounts Discount callback for order items
 * @param {Order} order Order to discount
 * @param {string[]} items
 * @returns {Promise<Object<string, Money | number>>} Discount per item
 *//**
* @template {string} ItemId
* @class Discount on an order
*/
export class Discount {
  /** @type {string} Discount ID */
  id;
  /** @type {string[]} Items discount applies to */
  items;
  /** @type {CalculateDiscounts<ItemId>} Calculate discounts for order */
  calculate;
  /**
   * @param {string} id
   * @param {string[]} items
   * @param {CalculateDiscounts<ItemId>} calculate
   */
  constructor(id, items, calculate) {
    this.id = id;
    this.items = items;
    this.calculate = (order) => order && calculate(order, this.items)
  }
  includes(id) {
    if (this.items.includes('*')) return true;
    return this.items.includes(id);
  }
}