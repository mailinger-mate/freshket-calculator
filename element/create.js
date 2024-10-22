/** Create HTML Element
 * @template {keyof HTMLElementTagNameMap} TagName
 * @template {HTMLElementTagNameMap[tagName]} Constructor
 * @param {TagName} tagName
 * @param {Constructor} attributes
 * @param {Node[]} nodes
 * @returns {Constructor}
 */
export function createElement(
  tagName,
  attributes,
  nodes
) {
  const element = document.createElement(tagName);
  if (nodes) for (let index = nodes.length - 1; index >= 0; index--) {
    const node = nodes[index];
    if (node) element.prepend(node);
  }
  if (attributes) {
    const { dataset, ...rest } = attributes;
    for (const key in dataset) {
      element.dataset[key] = dataset[key];
    }
    return Object.assign(element, rest);
  }
  return element;
}