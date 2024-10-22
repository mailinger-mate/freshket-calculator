/** 
 * @callback derive Derive callback
 * @param {number} amount Amount to derive
 * @returns {number} Derived amount
 */
export class Money {
  /** @type {number} Amount of money */
  amount;
  /** @type {string} Currency of money */
  currency;
  static rates = Promise.resolve(new Map([
    ['USD', 1],
    ['EUR', 0.85],
    ['THB', 30],
    ['JPY', 100],
  ]));
  /**
   * Create Money instance based on an amount and currency.
   * @param {number} amount 
   * @param {string} currency 
   */
  constructor(amount, currency) {
    this.amount = amount.toFixed(2) * 1;
    this.currency = currency;
  }
  /**
   * Derive to new amount and same currency.
   * @param {derive} callback
   * @returns {Money} 
   */
  derive(callback) {
    return new Money(callback(this.amount), this.currency);
  }
  /**
   * Exchange to new currency.
   * @param {string} currency
   * @param {derive | undefined} derive
   * @returns {Promise<Money>}
   */
  async exchange(currency, derive = amount => amount) {
    const rates = await Money.rates;
    if (this.currency === currency) return new Money(derive(this.amount), currency);
    else return new Money(derive(this.amount / rates.get(this.currency) * rates.get(currency)), currency);
  }
  /**
   * Convert to string.
   * @returns {string} Formatted string of the amount and currency.
   */
  toString() {
    return new Intl.NumberFormat(navigator.language, { style: 'currency', currency: this.currency }).format(this.amount);
  }
}

/**
 * Array of Price instances.
 * @extends {Array<Money>}
 */
export class Monies extends Array {
  constructor(...items) {
    super(...items);
  }
  /**
   * Calculate the sum of the monies in the array.
   * @param {string} currency Currency to calculate the sum in.
   * @returns {Promise<Money>}
   */
  async sum(currency) {
    const rates = await Money.rates;
    const sum = new Money(0, currency);

    for (const money of this) {
      if (money.currency === currency) sum.amount += money.amount;
      else sum.amount += (money.amount / rates.get(money.currency) * rates.get(currency)).toFixed(2) * 1;
    }

    return sum;
  }
}