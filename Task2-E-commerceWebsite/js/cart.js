/* ==========================================================
   LumaCart — cart.js
   Cart mutation helpers (usable from any page) plus the
   full render logic for pages/cart.html
   ========================================================== */

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 99;

/* ---------- Core helpers (used by every page) ---------- */
function getCart() {
  return readStorage(STORAGE_KEYS.cart, []);
}

function saveCart(cart) {
  writeStorage(STORAGE_KEYS.cart, cart);
  updateBadgeCounts();
}

function addToCart(productId, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  saveCart(cart);
  showToast("Added to cart", "success");
}

function updateCartQuantity(productId, quantity) {
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter((item) => item.productId !== productId);
  } else {
    const item = cart.find((i) => i.productId === productId);
    if (item) item.quantity = quantity;
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.productId !== productId);
  saveCart(cart);
  showToast("Removed from cart");
}

function getCartTotals() {
  const cart = getCart();
  let subtotal = 0;
  let savings = 0;

  cart.forEach((item) => {
    const product = getProductById(item.productId);
    if (!product) return;
    subtotal += product.price * item.quantity;
    savings += (product.originalPrice - product.price) * item.quantity;
  });

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  return { subtotal, savings, shipping, total };
}

/* ---------- Cart page rendering ---------- */
function renderCartPage() {
  const listEl = document.querySelector("[data-cart-list]");
  if (!listEl) return; // not on the cart page

  const cart = getCart();
  const emptyState = document.querySelector("[data-cart-empty]");
  const layout = document.querySelector("[data-cart-layout]");

  if (cart.length === 0) {
    if (layout) layout.classList.add("is-hidden");
    if (emptyState) emptyState.classList.remove("is-hidden");
    return;
  }

  if (layout) layout.classList.remove("is-hidden");
  if (emptyState) emptyState.classList.add("is-hidden");

  listEl.innerHTML = cart
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return "";
      const subtotal = product.price * item.quantity;
      return `
        <article class="cart-item" data-cart-item="${product.id}">
          <div class="cart-item__visual">
            <span>${product.emoji}</span>
          </div>
          <div class="cart-item__info">
            <span class="cart-item__category">${product.category}</span>
            <a href="product-details.html?id=${product.id}" class="cart-item__name">${product.name}</a>
            <span class="cart-item__price">₹${product.price.toLocaleString("en-IN")}</span>
          </div>
          <div class="cart-item__qty">
            <button class="qty-btn" data-qty-decrease="${product.id}" aria-label="Decrease quantity">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" data-qty-increase="${product.id}" aria-label="Increase quantity">+</button>
          </div>
          <div class="cart-item__subtotal">₹${subtotal.toLocaleString("en-IN")}</div>
          <button class="cart-item__remove" data-remove="${product.id}" aria-label="Remove item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>
          </button>
        </article>`;
    })
    .join("");

  bindCartItemEvents();
  renderCartSummary();
}

function bindCartItemEvents() {
  document.querySelectorAll("[data-qty-increase]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.qtyIncrease);
      const item = getCart().find((i) => i.productId === id);
      updateCartQuantity(id, (item ? item.quantity : 0) + 1);
      renderCartPage();
    });
  });
  document.querySelectorAll("[data-qty-decrease]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.qtyDecrease);
      const item = getCart().find((i) => i.productId === id);
      updateCartQuantity(id, (item ? item.quantity : 0) - 1);
      renderCartPage();
    });
  });
  document.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeFromCart(Number(btn.dataset.remove));
      renderCartPage();
    });
  });
}

function renderCartSummary() {
  const { subtotal, savings, shipping, total } = getCartTotals();
  const subtotalEl = document.querySelector("[data-summary-subtotal]");
  const savingsEl = document.querySelector("[data-summary-savings]");
  const shippingEl = document.querySelector("[data-summary-shipping]");
  const totalEl = document.querySelector("[data-summary-total]");

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString("en-IN")}`;
  if (savingsEl) savingsEl.textContent = `− ₹${savings.toLocaleString("en-IN")}`;
  if (shippingEl) shippingEl.textContent = shipping === 0 ? "FREE" : `₹${shipping}`;
  if (totalEl) totalEl.textContent = `₹${total.toLocaleString("en-IN")}`;
}

document.addEventListener("DOMContentLoaded", renderCartPage);
