/* ==========================================================
   LumaCart — checkout.js
   Renders the order summary, validates the checkout form,
   and simulates placing an order (no real payment gateway).
   ========================================================== */

function renderCheckoutSummary() {
  const listEl = document.querySelector("[data-checkout-items]");
  if (!listEl) return; // not on the checkout page

  const cart = getCart();

  if (cart.length === 0) {
    const page = document.querySelector("[data-checkout-page]");
    if (page) {
      page.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">🛍️</span>
          <h2>Your cart is empty</h2>
          <p>Add a few essentials before checking out.</p>
          <a href="products.html" class="btn btn--primary">Shop LumaCart</a>
        </div>`;
    }
    return;
  }

  listEl.innerHTML = cart
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return "";
      return `
        <div class="checkout-item">
          <span class="checkout-item__emoji">${product.emoji}</span>
          <div class="checkout-item__info">
            <span class="checkout-item__name">${product.name}</span>
            <span class="checkout-item__qty">Qty: ${item.quantity}</span>
          </div>
          <span class="checkout-item__price">₹${(product.price * item.quantity).toLocaleString("en-IN")}</span>
        </div>`;
    })
    .join("");

  const { subtotal, shipping, total } = getCartTotals();
  document.querySelector("[data-checkout-subtotal]").textContent = `₹${subtotal.toLocaleString("en-IN")}`;
  document.querySelector("[data-checkout-shipping]").textContent = shipping === 0 ? "FREE" : `₹${shipping}`;
  document.querySelector("[data-checkout-total]").textContent = `₹${total.toLocaleString("en-IN")}`;
}

function generateOrderNumber() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `LC${random}`;
}

function initCheckoutForm() {
  const form = document.querySelector("[data-checkout-form]");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const requiredFields = form.querySelectorAll("[required]");
    let valid = true;
    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        setFieldError(field, "This field is required");
        valid = false;
      } else {
        setFieldError(field, "");
      }
    });

    const email = form.querySelector("[name='email']");
    if (email && email.value.trim() && !isValidEmail(email.value.trim())) {
      setFieldError(email, "Enter a valid email address");
      valid = false;
    }

    if (!valid) return;

    const orderNumber = generateOrderNumber();
    const confirmation = document.querySelector("[data-order-confirmation]");
    const checkoutMain = document.querySelector("[data-checkout-main]");

    if (confirmation && checkoutMain) {
      checkoutMain.classList.add("is-hidden");
      confirmation.classList.remove("is-hidden");
      confirmation.querySelector("[data-order-number]").textContent = `Order #${orderNumber}`;
    }

    writeStorage(STORAGE_KEYS.cart, []);
    updateBadgeCounts();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCheckoutSummary();
  initCheckoutForm();
});
