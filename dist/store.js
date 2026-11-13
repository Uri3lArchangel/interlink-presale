const products = [
  { id: 'tier1', name: 'Tier 1 Router', price: 120000 },
  { id: 'tier1-pro', name: 'Tier 1 Router Pro', price: 270000 },
  { id: 'tier2', name: 'Tier 2 Rooftop Node', price: 499999 },
  { id: 'tier2-pro', name: 'Tier 2 Rooftop Node Pro', price: 699999 },
  ...Array.from({ length: 5 }, (_, index) => ({
    id: 'power-' + (index + 1),
    name: 'Personal PowerBank (with fingerprint)',
    capacity: (index + 1) * 10000,
    price: 29000 + index * 10000,
    image: 'power-' + (index + 1)
  }))
];

const money = amount => '₦' + amount.toLocaleString('en-NG');
const capacity = item => item.capacity ? item.capacity.toLocaleString('en-NG') + ' mAh' : '';
const fullName = item => [item.name, capacity(item)].filter(Boolean).join(' · ');
const storageKey = 'interlink-presale-bag';
const dialog = document.querySelector('#checkout');
const title = document.querySelector('#panel-title');
const panel = document.querySelector('#panel');
const count = document.querySelector('#count');
const status = document.querySelector('#status');
let cart = {};
let toastTimer;
let paymentPending = false;

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  for (const { id } of products) {
    const quantity = saved?.[id];
    if (Number.isInteger(quantity) && quantity > 0 && quantity <= 99) cart[id] = quantity;
  }
} catch {
  // The bag still works for the current page when storage is unavailable.
}

function updateCount() {
  count.textContent = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
}

function saveCart() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  } catch {
    // Storage may be disabled in private browsing.
  }
  updateCount();
}

function changeQuantity(id, change) {
  const quantity = Math.max(0, Math.min(99, (cart[id] || 0) + change));
  if (quantity) cart[id] = quantity;
  else delete cart[id];
  saveCart();
}

function catalogCard(item) {
  const article = document.createElement('article');
  article.className = 'product';
  article.innerHTML = `
    <img src="${item.image || item.id}.webp" alt="${item.name} concept render" width="512" height="512" loading="lazy">
    <div class="details">
      <h3>${item.name}</h3>
      ${item.capacity ? '<p class="capacity">' + capacity(item) + '</p>' : ''}
      <p class="price">${money(item.price)}</p>
      <button class="add" aria-label="Add ${fullName(item)} to cart">Add to cart <span aria-hidden="true">+</span></button>
    </div>`;
  article.querySelector('button').addEventListener('click', () => {
    const capped = cart[item.id] === 99;
    changeQuantity(item.id, 1);
    status.hidden = false;
    status.textContent = capped ? 'Maximum quantity reached' : fullName(item) + ' added to cart';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { status.hidden = true; }, 2500);
  });
  return article;
}

function orderLines() {
  return products.filter(item => cart[item.id]).map(item => ({
    ...item,
    quantity: cart[item.id]
  }));
}

function subtotal(lines) {
  return lines.reduce((total, item) => total + item.quantity * item.price, 0);
}

function orderSummary(lines, editable) {
  return lines.map(item => `
    <div class="line">
      <div><strong>${fullName(item)}</strong><small>${item.quantity} × ${money(item.price)}</small></div>
      ${editable ? `<div class="stepper">
        <button data-id="${item.id}" data-change="-1" aria-label="Decrease ${fullName(item)}">−</button>
        <span>${item.quantity}</span>
        <button data-id="${item.id}" data-change="1" aria-label="Increase ${fullName(item)}" ${item.quantity === 99 ? 'disabled' : ''}>+</button>
      </div>` : `<strong>${money(item.quantity * item.price)}</strong>`}
    </div>`).join('') +
    '<div class="total"><span>Total</span><span>' + money(subtotal(lines)) + '</span></div>';
}

function showCart() {
  const lines = orderLines();
  title.textContent = 'Your cart';
  if (!lines.length) {
    panel.innerHTML = '<p class="panel-note">Your cart is empty.</p><button class="primary" id="continue">Continue shopping</button>';
    panel.querySelector('#continue').onclick = () => dialog.close();
    return;
  }
  panel.innerHTML = orderSummary(lines, true) + '<button class="primary" id="pay">Checkout <span aria-hidden="true">→</span></button>';
  for (const button of panel.querySelectorAll('[data-change]')) {
    button.onclick = () => {
      const { id, change } = button.dataset;
      changeQuantity(id, Number(change));
      showCart();
      const replacement = panel.querySelector(`[data-id="${id}"][data-change="${change}"]:enabled`);
      (replacement || panel.querySelector('button'))?.focus();
    };
  }
  panel.querySelector('#pay').onclick = showPayment;
}

// Replace this adapter with a server-created payment session and a verified result.
async function submitMockPayment() {
  return { reference: 'DEMO-' + crypto.randomUUID().slice(0, 8).toUpperCase() };
}

function showPayment() {
  const lines = orderLines();
  if (!lines.length) return showCart();
  title.textContent = 'Mock payment';
  panel.innerHTML = orderSummary(lines, false) + `
    <p class="panel-note">Demo checkout. No money will be charged.</p>
    <div class="actions"><button id="confirm" class="primary">Simulate payment</button>
    <button id="back" class="secondary">Back to cart</button></div>
    <p id="payment-status" role="status"></p>`;
  const confirm = panel.querySelector('#confirm');
  panel.querySelector('#back').onclick = showCart;
  confirm.focus();
  confirm.onclick = async () => {
    if (paymentPending) return;
    paymentPending = true;
    confirm.disabled = true;
    try {
      const { reference } = await submitMockPayment();
      cart = {};
      saveCart();
      title.textContent = 'Mock payment complete';
      panel.innerHTML = `
        <p class="panel-note">Test reference <strong>${reference}</strong></p>
        <p class="panel-note">Simulated total <strong>${money(subtotal(lines))}</strong></p>
        <button id="done" class="primary">Continue shopping</button>`;
      panel.querySelector('#done').onclick = () => dialog.close();
      panel.querySelector('#done').focus();
    } catch {
      panel.querySelector('#payment-status').textContent = 'Test payment failed. Try again.';
      confirm.disabled = false;
    } finally {
      paymentPending = false;
    }
  };
}

for (const item of products) {
  document.querySelector(item.capacity ? '#power-grid' : '#router-grid').append(catalogCard(item));
}
updateCount();
document.querySelector('#cart').onclick = () => {
  showCart();
  dialog.showModal();
};
document.querySelector('#close').onclick = () => dialog.close();
dialog.addEventListener('click', event => {
  if (event.target === dialog && event.clientX < dialog.getBoundingClientRect().left) dialog.close();
});

