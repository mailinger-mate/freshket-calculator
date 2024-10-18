/**
 * @typedef ItemMap
 * @type {Map<string, number>} Order items
 * 
 * @callback getDiscount Discount callback for order items
 * @param {Order} order Order items 
 * @returns {Promise<ItemMap>} Discount per item
 */

class Price {
  amount;
  currency;
  constructor(amount, currency) {
    this.amount = amount;
    this.currency = currency;
  }
}

class Item {
  /** @type {string} Item name */
  id;
  /** @type {Price} Item price */
  price;
  /**
   * Create an item
   * @param {string} id Item name
   * @param {Price} price Item price
   */
  constructor(id, price) {
    this.id = id;
    this.price = price;
  }
}

/**
 * Customers can get 10% on Total, if customers have a member card
 * @type {getDiscount}
 */
async function getPct10Member(order) {
  /** @type {ItemMap} */
  const discounts = new Map();
  if (!order.memberId) return discounts;
  const items = await Order.items;
  for (const [id, quantity] of order.items) {
    const item = items.find(item => item.id === id);
    discounts.set(id, item.price.amount * quantity * 0.1);
  }
  return discounts;
}
/**
 * Order doubles of Orange, Pink or Green sets will get a 5% discount for each bundles
 * @type {getDiscount}
 */
async function getPct5DoubleOrangePinkGreen(order) {
  /** @type {ItemMap} */
  const discounts = new Map();
  const items = await Order.items;
  for (const [id, quantity] of order.items) {
    const item = items.find(item => item.id === id);
    switch (item.id) {
      case 'orange':
      case 'pink':
      case 'green': {
        discounts.set(item, Math.floor(quantity / 2) * item.price.amount * 2 * 0.05);
        break;
      }
    }
  }
  return discounts
}

class Order {
  /** @type {string | undefined} Member ID for the order */
  memberId;
  /** @type {ItemMap} Items in the order */
  items = new Map();
  /** @type {Promise<Item[]>} Items available to order */
  static items = Promise.resolve([
    new Item('red', new Price(50, 'THB')),
    new Item('green', new Price(40, 'THB')),
    new Item('blue', new Price(30, 'THB')),
    new Item('yellow', new Price(50, 'THB')),
    new Item('pink', new Price(80, 'THB')),
    new Item('purple', new Price(90, 'THB')),
    new Item('orange', new Price(120, 'THB')),
  ]);
  /** @type {Promise<getDiscount[]>} Discounts available on orders */
  static discounts = Promise.resolve([
    getPct10Member,
    getPct5DoubleOrangePinkGreen,
  ]);
  constructor(memberId) {
    this.memberId = memberId;
  }
  // /**
  //  * Add to or subtract from the quantity of an item
  //  * @param {Item} item 
  //  * @param {number} quantity 
  //  */
  // async setItem(id, quantity) {
  //   const item = (await Order.items).find(item => item.id === id);
  //   if (!item) return;
  //   if (!Number.isSafeInteger(quantity)) return this.items.set(item, 0);
  //   const current = this.items.get(item) || 0;
  //   this.items.set(item, current + quantity);
  // }
  /** Discount on each item */
  async getDiscounts() {
    /** @type {ItemMap} */
    const discounts = new Map();
    for (const getDiscount of await Order.discounts) {
      for (const [id, amount] of await getDiscount(this)) {
        const current = discounts.get(id) || 0;
        discounts.set(id, current + amount);
      }
    }
    return discounts;
  }
  /** Total discount on the order */
  async getTotalDiscount() {
    let totalDiscounts = 0;
    for (const [_, amount] of await this.getDiscounts()) {
      totalDiscounts += amount;
    }
    return totalDiscounts;
  }
  /** Total of the order */
  async getTotal() {
    let total = 0;
    const items = await Order.items;
    for (const [id, quantity] of this.items) {
      const item = items.find(item => item.id === id);
      if (!item) continue;
      total += item.price.amount * quantity;
    }
    return total - await this.getTotalDiscount();
  }
}

(async () => {
  const order = new Order('member');
  // await order.setItem(green, 2);
  order.items.set('green', 2)
  console.log(await order.getTotalDiscount(), await order.getTotal())
})();

