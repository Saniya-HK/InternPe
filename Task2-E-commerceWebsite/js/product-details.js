/* ==========================================================
   LumaCart — product-details.js
   Reads ?id= from the URL and renders the full product
   details page, including quantity control and related items.
   ========================================================== */

let currentQuantity = 1;
let currentProduct = null;

function initProductDetailsPage() {
  const root = document.querySelector("[data-product-details]");
  if (!root) return; // not on this page

  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));
  currentProduct = getProductById(id);

  if (!currentProduct) {
    root.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon">🔍</span>
        <h2>Product not found</h2>
        <p>The item you're looking for may have been removed.</p>
        <a href="products.html" class="btn btn--primary">Back to Shop</a>
      </div>`;
    return;
  }

  document.title = `${currentProduct.name} — LumaCart`;
  renderProductDetails();
  renderRelatedProducts();
}

function renderProductDetails() {
  const p = currentProduct;
  const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);

  document.querySelector("[data-detail-emoji]").textContent = p.emoji;
  document.querySelector("[data-detail-category]").textContent = p.category;
  document.querySelector("[data-detail-name]").textContent = p.name;
  document.querySelector("[data-detail-rating]").textContent = `★ ${p.rating}`;
  document.querySelector("[data-detail-reviews]").textContent = `(${p.reviews} reviews)`;
  document.querySelector("[data-detail-description]").textContent = p.description;
  document.querySelector("[data-detail-price]").textContent = `₹${p.price.toLocaleString("en-IN")}`;
  document.querySelector("[data-detail-original-price]").textContent = `₹${p.originalPrice.toLocaleString("en-IN")}`;

  const discountEl = document.querySelector("[data-detail-discount]");
  if (discountEl) discountEl.textContent = discount > 0 ? `${discount}% off` : "";

  const badgeEl = document.querySelector("[data-detail-badge]");
  if (badgeEl) {
    if (p.badge) {
      badgeEl.textContent = p.badge;
      badgeEl.classList.remove("is-hidden");
    } else {
      badgeEl.classList.add("is-hidden");
    }
  }

  const wishBtn = document.querySelector("[data-detail-wishlist]");
  if (wishBtn) {
    wishBtn.dataset.wishlistToggle = p.id;
    wishBtn.classList.toggle("is-active", isInWishlist(p.id));
    wishBtn.addEventListener("click", () => toggleWishlist(p.id));
  }

  document.querySelector("[data-qty-value]").textContent = currentQuantity;

  const decreaseBtn = document.querySelector("[data-detail-qty-decrease]");
  const increaseBtn = document.querySelector("[data-detail-qty-increase]");
  if (decreaseBtn) {
    decreaseBtn.addEventListener("click", () => {
      if (currentQuantity > 1) {
        currentQuantity -= 1;
        document.querySelector("[data-qty-value]").textContent = currentQuantity;
      }
    });
  }
  if (increaseBtn) {
    increaseBtn.addEventListener("click", () => {
      currentQuantity += 1;
      document.querySelector("[data-qty-value]").textContent = currentQuantity;
    });
  }

  const addBtn = document.querySelector("[data-detail-add-to-cart]");
  if (addBtn) {
    addBtn.addEventListener("click", () => addToCart(p.id, currentQuantity));
  }

  const buyBtn = document.querySelector("[data-detail-buy-now]");
  if (buyBtn) {
    buyBtn.addEventListener("click", () => {
      addToCart(p.id, currentQuantity);
      window.location.href = "checkout.html";
    });
  }
}

function renderRelatedProducts() {
  const grid = document.querySelector("[data-related-grid]");
  if (!grid || !currentProduct) return;

  const related = PRODUCTS.filter(
    (p) => p.category === currentProduct.category && p.id !== currentProduct.id
  ).slice(0, 4);

  const fallback = related.length
    ? related
    : PRODUCTS.filter((p) => p.id !== currentProduct.id).slice(0, 4);

  grid.innerHTML = fallback.map(productCardTemplate).join("");
  bindProductCardEvents(grid);
}

document.addEventListener("DOMContentLoaded", initProductDetailsPage);
