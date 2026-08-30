/* ==========================================================
   LumaCart — wishlist.js
   Wishlist mutation helpers (usable from any page) plus the
   full render logic for pages/wishlist.html
   ========================================================== */

function getWishlist() {
  return readStorage(STORAGE_KEYS.wishlist, []);
}

function saveWishlist(list) {
  writeStorage(STORAGE_KEYS.wishlist, list);
  updateBadgeCounts();
}

function isInWishlist(productId) {
  return getWishlist().includes(productId);
}

function toggleWishlist(productId) {
  let list = getWishlist();
  if (list.includes(productId)) {
    list = list.filter((id) => id !== productId);
    saveWishlist(list);
    showToast("Removed from wishlist");
  } else {
    list.push(productId);
    saveWishlist(list);
    showToast("Added to wishlist", "success");
  }
  refreshWishlistButtons();
  return list.includes(productId);
}

function refreshWishlistButtons() {
  document.querySelectorAll("[data-wishlist-toggle]").forEach((btn) => {
    const id = Number(btn.dataset.wishlistToggle);
    btn.classList.toggle("is-active", isInWishlist(id));
  });
}

/* ---------- Wishlist page rendering ---------- */
function renderWishlistPage() {
  const gridEl = document.querySelector("[data-wishlist-grid]");
  if (!gridEl) return; // not on the wishlist page

  const list = getWishlist();
  const emptyState = document.querySelector("[data-wishlist-empty]");

  if (list.length === 0) {
    gridEl.classList.add("is-hidden");
    if (emptyState) emptyState.classList.remove("is-hidden");
    return;
  }

  gridEl.classList.remove("is-hidden");
  if (emptyState) emptyState.classList.add("is-hidden");

  const products = list.map(getProductById).filter(Boolean);
  gridEl.innerHTML = products.map((p) => productCardTemplate(p)).join("");
  bindProductCardEvents(gridEl);

  /* On this page specifically, removing a wishlist item should
     drop its card immediately rather than just losing the
     "active" heart state. */
  gridEl.querySelectorAll("[data-wishlist-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setTimeout(renderWishlistPage, 0);
    });
  });
}

document.addEventListener("DOMContentLoaded", renderWishlistPage);
