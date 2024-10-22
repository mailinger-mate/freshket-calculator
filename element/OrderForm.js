import { createElement } from "./create.js";
import { Order } from '../class/Order.js';
import { Money } from '../class/Money.js';

/**
 * @typedef Message 
 * @type {object}
 * @property {string} type
 * @typedef {Message & {
*  id: string,
*  quantity: number,
* }} SetOrderItemMessage
*/
export class OrderForm extends HTMLElement {
  searchParams = new URLSearchParams(location.search);
  order = new Order(this.searchParams.get('member'), this.searchParams.get('currency') || 'USD');
  form = createElement('form', { method: 'get', part: 'form' });
  fieldset = createElement('fieldset', { part: 'details' });
  inputMember = createElement('input', {
    value: this.order.memberId,
    part: 'member',
    name: 'member',
  });
  selectCurrency = createElement('select', {
    part: 'currency',
    name: 'currency',
  });
  thead = createElement('thead', { part: 'thead' }, [
    createElement('tr', null, [
      createElement('th', { textContent: document.body.dataset.textItem }),
      createElement('th', { textContent: document.body.dataset.textQuantity }),
      createElement('th', { textContent: document.body.dataset.textSubtotal }),
      createElement('th', { textContent: document.body.dataset.textTotal }),
    ])
  ]);
  tbody = createElement('tbody');
  tfoot = createElement('tfoot');
  table = createElement('table', { part: 'table' });
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.table.append(
      this.thead,
      this.tbody,
      this.tfoot,
    )
    this.inputMember.addEventListener('change', ({ target }) => {
      if (!target) return;
      this.order.memberId = target.value;
      this.render();
    });
    this.selectCurrency.addEventListener('change', ({ target }) => {
      if (!target) return;
      this.order.currency = target.value;
      this.render();
    });
    this.form.addEventListener('reset', () => {
      this.order.items = {};
      this.render();
    });
    this.fieldset.append(
      createElement('legend', { textContent: document.body.dataset.textDetails }),
      createElement('label', null, [
        document.body.dataset.textCurrency,
        this.selectCurrency
      ]),
      createElement('label', null, [
        document.body.dataset.textMember,
        this.inputMember
      ]),
    );
    this.form.append(
      this.fieldset,
      this.table,
      createElement('input', { type: 'submit' }),
      createElement('input', { type: 'reset' }),
    )
    this.shadowRoot.append(this.form);
  };

  renderSelectCurrency = async () => {
    const currencyOptions = document.createDocumentFragment();
    for (const [currency] of await Money.rates) {
      currencyOptions.appendChild(createElement('option', { value: currency, textContent: currency }));
    }
    this.selectCurrency.replaceChildren(currencyOptions);
    this.selectCurrency.value = this.order.currency;
  }
  renderTbody = async () => {
    const children = document.createDocumentFragment();
    const inventory = await Order.inventory;
    const discounts = await this.order.calculateDiscounts();

    for (const id in this.order.items) {
      const quantity = this.order.items[id];
      const price = inventory[id];
      if (quantity < 1 || !price) continue;

      const input = createElement('input', {
        type: 'number',
        part: 'quantity',
        name: id,
        value: quantity,
        min: 0
      });
      input.addEventListener('change', ({ target }) => {
        if (!target) return;
        console.log('change', target.value)
        if (!target.value) delete this.order.items[id];
        else this.order.items[id] = Number(target.value);
        this.render();
      });

      const subtotal = await price.exchange(this.order.currency, (amount) => amount * quantity);
      const discount = await discounts[id]?.sum(this.order.currency);
      const total = subtotal.derive(amount => amount + (discount?.amount || 0));

      children.appendChild(createElement('tr', null, [
        createElement('td', { textContent: id, part: 'item' }),
        createElement('td', null, [input]),
        createElement('td', null, discount?.amount && [
          createElement('s', { textContent: subtotal.toString() }),
        ]),
        createElement('td', { textContent: total.toString() }),
      ]));
    }
    this.tbody.replaceChildren(children);
  }

  renderTfoot = async () => {
    const totalDiscount = await this.order.calculateTotalDiscount();
    const subtotal = await this.order.calculateSubtotal();
    const total = await this.order.calculateTotal();

    this.tfoot.replaceChildren(
      createElement('tr', null, [
        createElement('th', { textContent: document.body.dataset.textTotal }),
        createElement('th', { textContent: this.order.getTotalQuantity() }),
        createElement('td', null, [
          createElement(totalDiscount.amount ? 's' : 'i', { textContent: subtotal.toString() }),
        ]),
        createElement('th', { textContent: total.toString() }),
      ]),
    );
  }

  render = async () => {
    await this.renderSelectCurrency();
    await this.renderTbody();
    await this.renderTfoot();
  }

  /** @param {MessageEvent<SetOrderItemMessage>} event */
  messageListener = ({ data }) => {
    if (data.type !== 'addOrderItem') return;
    const { id, quantity } = data;
    this.order.items[id] ||= 0;
    this.order.items[id] += quantity;
    this.render();
  };

  async connectedCallback() {
    this.render();
    const inventory = await Order.inventory;
    for (const id in inventory) {
      const quantity = +this.searchParams.get(id);
      if (quantity) this.order.items[id] = quantity;
    }
    window.addEventListener('message', this.messageListener);
  };

  disconnectedCallback() {
    window.removeEventListener('message', this.messageListener);
  };
};
