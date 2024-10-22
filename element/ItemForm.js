import { createElement } from "./create.js";
import { Order } from '../class/Order.js';

export class ItemForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.article = createElement('article');
    this.h1 = createElement('h1');
    this.form = createElement('form');

    this.input = createElement('input', {
      type: 'number',
      min: 1,
      value: 1,
      part: 'quantity',
    });
    this.button = createElement('button', {
      type: 'button',
      textContent: '+'
    });
    this.button.addEventListener('click', this.addItem);

    this.form.append(
      this.input,
      this.button,
    );
    this.ulDiscount = createElement('ul', { part: 'discounts' });
    this.em = createElement('em', { part: 'price' });
    this.article.append(
      this.h1,
      createElement('slot'),
      this.ulDiscount,
      this.em,
      this.form
    );
    this.shadowRoot.appendChild(this.article);
  }
  addItem = async () => {
    window.postMessage({ type: 'addOrderItem', id: this.id, quantity: Number(this.input.value) }, '*');
    this.input.value = 1;
  }
  async connectedCallback() {
    const inventory = await Order.inventory;
    const id = this.shadowRoot.host.dataset.id;
    const price = inventory[id];
    if (!price) return;

    this.id = id;
    this.price = price;
    this.h1.textContent = id;
    this.em.textContent = this.price.toString();

    const discounts = await Order.discounts;
    const availableDiscounts = discounts.filter(discount => discount.includes(id));

    this.ulDiscount.append(
      ...availableDiscounts.map(discount =>
        createElement('li', {
          textContent: discount.id,
          part: 'discount',
        })
      )
    );
  }
}