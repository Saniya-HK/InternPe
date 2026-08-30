/* ==========================================================
   LumaCart — products.js
   Category grid + homepage product rails + the full
   search / filter / sort logic for pages/products.html
   ========================================================== */

/* ---------- Category grid (homepage) ---------- */
function renderCategoryGrid() {
  const grid = document.querySelector("[data-categories-grid]");
  if (!grid) return;
  const prefix = getPathPrefix();

  grid.innerHTML = CATEGORIES.map((cat) => {
    const count = PRODUCTS.filter((p) => p.category === cat.name).length;
    return `
      <a class="category-card" href="${prefix}pages/products.html?category=${encodeURIComponent(cat.name)}">
        <span class="category-card__icon">${cat.emoji}</span>
        <span class="category-card__name">${cat.name}</span>
        <span class="category-card__count">${count} items</span>
      </a>`;
  }).join("");
}

/* ---------- Homepage rails ---------- */
function renderBestSellers() {
  const grid = document.querySelector("[data-bestsellers-grid]");
  if (!grid) return;
  const items = PRODUCTS.filter((p) => p.isBestSeller).slice(0, 8);
  grid.innerHTML = items.map(productCardTemplate).join("");
  bindProductCardEvents(grid);
}

function renderNewArrivals() {
  const grid = document.querySelector("[data-newarrivals-grid]");
  if (!grid) return;
  const items = PRODUCTS.filter((p) => p.isNew);
  grid.innerHTML = items.map(productCardTemplate).join("");
  bindProductCardEvents(grid);
}

/* ---------- Shop page (products.html) ---------- */
let shopState = {
  search: "",
  category: "All",
  price: "All",
  sort: "featured"
};

function matchesPriceRange(price, range) {
  switch (range) {
    case "under-500":
      return price < 500;
    case "500-1000":
      return price >= 500 && price <= 1000;
    case "1000-2500":
      return price > 1000 && price <= 2500;
    case "above-2500":
      return price > 2500;
    default:
      return true;
  }
}

function getFilteredProducts() {
  let result = PRODUCTS.filter((p) => {
    const term = shopState.search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term);

    const matchesCategory = shopState.category === "All" || p.category === shopState.category;
    const matchesPrice = matchesPriceRange(p.price, shopState.price);

    return matchesSearch && matchesCategory && matchesPrice;
  });

  switch (shopState.sort) {
    case "price-low":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      result.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      result.sort((a, b) => (b.isNew === a.isNew ? 0 : b.isNew ? 1 : -1));
      break;
    case "name-az":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break; // "featured" keeps original order
  }

  return result;
}

function renderShopGrid() {
  const grid = document.querySelector("[data-shop-grid]");
  if (!grid) return;

  const results = getFilteredProducts();
  const countEl = document.querySelector("[data-result-count]");
  const emptyState = document.querySelector("[data-shop-empty]");

  if (countEl) {
    countEl.textContent = `${results.length} product${results.length === 1 ? "" : "s"}`;
  }

  if (results.length === 0) {
    grid.innerHTML = "";
    grid.classList.add("is-hidden");
    if (emptyState) emptyState.classList.remove("is-hidden");
    return;
  }

  grid.classList.remove("is-hidden");
  if (emptyState) emptyState.classList.add("is-hidden");

  grid.innerHTML = results.map(productCardTemplate).join("");
  bindProductCardEvents(grid);
}

function initShopPage() {
  const grid = document.querySelector("[data-shop-grid]");
  if (!grid) return; // not on the shop page

  const params = new URLSearchParams(window.location.search);
  if (params.get("category")) shopState.category = params.get("category");
  if (params.get("search")) shopState.search = params.get("search");
  if (params.get("sort")) shopState.sort = params.get("sort");

  const searchInput = document.querySelector("[data-search-input]");
  const categorySelect = document.querySelector("[data-category-select]");
  const priceSelect = document.querySelector("[data-price-select]");
  const sortSelect = document.querySelector("[data-sort-select]");
  const clearBtn = document.querySelector("[data-clear-filters]");

  if (searchInput) searchInput.value = shopState.search;
  if (categorySelect) categorySelect.value = shopState.category;
  if (sortSelect) sortSelect.value = shopState.sort;

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      shopState.search = e.target.value;
      renderShopGrid();
    });
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      shopState.category = e.target.value;
      renderShopGrid();
    });
  }
  if (priceSelect) {
    priceSelect.addEventListener("change", (e) => {
      shopState.price = e.target.value;
      renderShopGrid();
    });
  }
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      shopState.sort = e.target.value;
      renderShopGrid();
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      shopState = { search: "", category: "All", price: "All", sort: "featured" };
      if (searchInput) searchInput.value = "";
      if (categorySelect) categorySelect.value = "All";
      if (priceSelect) priceSelect.value = "All";
      if (sortSelect) sortSelect.value = "featured";
      renderShopGrid();
    });
  }

  renderShopGrid();
}

document.addEventListener("DOMContentLoaded", () => {
  renderCategoryGrid();
  renderBestSellers();
  renderNewArrivals();
  initShopPage();
});
