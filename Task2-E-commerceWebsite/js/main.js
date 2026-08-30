/* ==========================================================
   LumaCart — main.js
   Shared utilities used across every page:
   navbar behaviour, mobile menu, theme toggle, toast system,
   cart/wishlist badge counts, and navbar auth state.
   ========================================================== */

/* ---------- Storage keys (used across all scripts) ---------- */
const STORAGE_KEYS = {
  cart: "lumaCart",
  wishlist: "lumaWishlist",
  users: "lumaUsers",
  currentUser: "lumaCurrentUser",
  theme: "lumaTheme"
};

/* ---------- Generic storage helpers ---------- */
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- Theme ---------- */
function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  const isDark = saved === "dark";
  document.body.classList.toggle("dark-theme", isDark);
  updateThemeToggleIcon(isDark);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem(STORAGE_KEYS.theme, isDark ? "dark" : "light");
  updateThemeToggleIcon(isDark);
}

function updateThemeToggleIcon(isDark) {
  const btns = document.querySelectorAll("[data-theme-toggle]");
  btns.forEach((btn) => {
    btn.innerHTML = isDark ? sunIcon() : moonIcon();
    btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  });
}

function moonIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

function sunIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;
}

/* ---------- Mobile menu ---------- */
function initMobileMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  const overlay = document.querySelector("[data-menu-overlay]");
  if (!toggle || !menu) return;

  function open() {
    menu.classList.add("is-open");
    toggle.classList.add("is-active");
    if (overlay) overlay.classList.add("is-visible");
    document.body.classList.add("no-scroll");
    toggle.setAttribute("aria-expanded", "true");
  }
  function close() {
    menu.classList.remove("is-open");
    toggle.classList.remove("is-active");
    if (overlay) overlay.classList.remove("is-visible");
    document.body.classList.remove("no-scroll");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    menu.classList.contains("is-open") ? close() : open();
  });
  if (overlay) overlay.addEventListener("click", close);
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
}

/* ---------- Sticky navbar shadow on scroll ---------- */
function initNavbarScroll() {
  const nav = document.querySelector("[data-navbar]");
  if (!nav) return;
  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- Badge counts ---------- */
function updateBadgeCounts() {
  const cart = readStorage(STORAGE_KEYS.cart, []);
  const wishlist = readStorage(STORAGE_KEYS.wishlist, []);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = cartCount;
    el.classList.toggle("is-hidden", cartCount === 0);
  });
  document.querySelectorAll("[data-wishlist-count]").forEach((el) => {
    el.textContent = wishlistCount;
    el.classList.toggle("is-hidden", wishlistCount === 0);
  });
}

/* ---------- Auth state in navbar ---------- */
function updateAuthNav() {
  const currentUser = readStorage(STORAGE_KEYS.currentUser, null);
  const slots = document.querySelectorAll("[data-account-slot]");
  slots.forEach((slot) => {
    if (currentUser) {
      slot.innerHTML = `
        <div class="account-menu">
          <button class="account-trigger" data-account-trigger>Hi, ${escapeHtml(currentUser.firstName)}</button>
          <div class="account-dropdown">
            <span class="account-email">${escapeHtml(currentUser.email)}</span>
            <button class="account-logout" data-logout>Logout</button>
          </div>
        </div>`;
    } else {
      const inPages = window.location.pathname.includes("/pages/");
      const loginHref = inPages ? "login.html" : "pages/login.html";
      slot.innerHTML = `<a href="${loginHref}" class="icon-btn" aria-label="Account">${accountIcon()}</a>`;
    }
  });

  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
      showToast("You've been logged out");
      setTimeout(() => window.location.reload(), 600);
    });
  });

  document.querySelectorAll("[data-account-trigger]").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".account-menu").classList.toggle("is-open");
    });
  });
}

function accountIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Toast notifications ---------- */
function ensureToastContainer() {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = "default") {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));

  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

/* ---------- Newsletter (shared footer form) ---------- */
function initNewsletterForm() {
  const form = document.querySelector("[data-newsletter-form]");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input[type='email']");
    if (input && input.value.trim()) {
      showToast("You're on the list!", "success");
      form.reset();
    }
  });
}

/* ---------- Path helper: works whether on root or /pages/ ---------- */
function getPathPrefix() {
  return window.location.pathname.includes("/pages/") ? "../" : "";
}

/* ---------- Shared product card template ----------
   Used on the homepage, shop page and wishlist page.
   `prefix` is "" on index.html and "" inside pages/ (both
   link to product-details.html since it lives alongside). */
function productCardTemplate(product) {
  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );
  const wishActive = isInWishlist(product.id) ? "is-active" : "";
  const badgeHtml = product.badge
    ? `<span class="product-card__badge product-card__badge--${product.badge.toLowerCase()}">${product.badge}</span>`
    : "";
  const detailsHref = window.location.pathname.includes("/pages/")
    ? `product-details.html?id=${product.id}`
    : `pages/product-details.html?id=${product.id}`;

  return `
    <article class="product-card" data-product-card="${product.id}">
      <div class="product-card__visual">
        ${badgeHtml}
        <button class="product-card__wishlist ${wishActive}" data-wishlist-toggle="${product.id}" aria-label="Toggle wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0"><path d="M12 21s-6.7-4.35-9.3-8.1C1 10.1 1.6 6.6 4.5 5.1c2.3-1.2 4.8-.4 6 1.4l1.5 2 1.5-2c1.2-1.8 3.7-2.6 6-1.4 2.9 1.5 3.5 5 1.8 7.8C18.7 16.65 12 21 12 21Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <a href="${detailsHref}" class="product-card__emoji-link">
          <span class="product-card__emoji">${product.emoji}</span>
        </a>
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${product.category}</span>
        <a href="${detailsHref}" class="product-card__name">${product.name}</a>
        <div class="product-card__rating">
          <span class="stars">★ ${product.rating}</span>
          <span class="review-count">(${product.reviews})</span>
        </div>
        <div class="product-card__price-row">
          <span class="product-card__price">₹${product.price.toLocaleString("en-IN")}</span>
          <span class="product-card__original-price">₹${product.originalPrice.toLocaleString("en-IN")}</span>
          ${discount > 0 ? `<span class="product-card__discount">${discount}% off</span>` : ""}
        </div>
      </div>
      <button class="btn btn--primary btn--block product-card__add" data-add-to-cart="${product.id}">Add to Cart</button>
    </article>`;
}

function bindProductCardEvents(scope) {
  const root = scope || document;
  root.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart(Number(btn.dataset.addToCart), 1);
    });
  });
  root.querySelectorAll("[data-wishlist-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleWishlist(Number(btn.dataset.wishlistToggle));
    });
  });
}

/* ---------- Init on every page ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileMenu();
  initNavbarScroll();
  updateBadgeCounts();
  updateAuthNav();
  initNewsletterForm();

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", toggleTheme);
  });

  document.addEventListener("click", (e) => {
    document.querySelectorAll(".account-menu.is-open").forEach((menu) => {
      if (!menu.contains(e.target)) menu.classList.remove("is-open");
    });
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
});
