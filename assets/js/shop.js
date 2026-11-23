/* BeyondSure – Wellness store listing (shop.html)
   All product data comes from window.BS_SHOP (assets/js/products-data.js). */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plural = (n) => `${n} product${n === 1 ? '' : 's'}`;
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { PRODUCTS, CATEGORIES, BRANDS, productCard, cart, favs } = window.BS_SHOP;

  /* ------------------------------------------------------------------
     STATE
     ------------------------------------------------------------------ */
  const state = { q: '', cats: new Set(), brands: new Set(), inStock: false, sort: 'featured' };

  // ?category=hair-care opens the shop pre-filtered
  const catParam = new URLSearchParams(window.location.search).get('category');
  const fromParam = catParam ? CATEGORIES.find((c) => slug(c) === catParam.toLowerCase()) : null;
  if (fromParam) state.cats.add(fromParam);

  /* ------------------------------------------------------------------
     BUILD CONTROLS
     ------------------------------------------------------------------ */
  const checkList = (name, values, countOf) => values.map((v) => {
    const n = countOf(v);
    return `<label class="fd-check"><input type="checkbox" name="${name}" value="${esc(v)}"><span class="bys-bx"></span><span class="bys-tx">${esc(v)}</span><span class="fd-cnt${n ? '' : ' bys-zero'}">${n}</span></label>`;
  }).join('');
  $('#catList').innerHTML = checkList('cat', CATEGORIES, (c) => PRODUCTS.filter((p) => p.category === c).length);
  $('#brandList').innerHTML = checkList('brand', BRANDS, (b) => PRODUCTS.filter((p) => p.brand === b).length);
  $$('input[name="cat"]').forEach((i) => { i.checked = state.cats.has(i.value); });

  const sortDD = window.BS_enhanceSelect($('#sortSelect'), { align: 'right', minWidth: 190, anchor: '.fd-sort' });

  $('#availCount').textContent = plural(PRODUCTS.length);

  /* ------------------------------------------------------------------
     FILTER / SORT
     ------------------------------------------------------------------ */
  const matches = (p) => {
    if (state.cats.size && !state.cats.has(p.category)) return false;
    if (state.brands.size && !state.brands.has(p.brand)) return false;
    if (state.inStock && !p.inStock) return false;
    if (state.q) {
      const q = state.q.toLowerCase();
      if (![p.name, p.brand, p.category].some((t) => t.toLowerCase().includes(q))) return false;
    }
    return true;
  };

  const sorters = {
    featured: (a, b) => (b.inStock - a.inStock) || a.featured - b.featured, // sold-out items go last
    newest: (a, b) => b.addedOn.localeCompare(a.addedOn),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price
  };

  /* ------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------ */
  const render = () => {
    const list = PRODUCTS.filter(matches).sort(sorters[state.sort]);
    const n = list.length;

    $('#productGrid').innerHTML = list.map(productCard).join('');
    $('#emptyState').hidden = n > 0;
    $('#resultCount').textContent = plural(n);
    $('#sheetCount').textContent = plural(n);

    const parts = [];
    if (state.cats.size) parts.push([...state.cats].join(', '));
    if (state.brands.size) parts.push([...state.brands].join(', '));
    $('#resultSub').textContent = parts.length ? `In ${parts.join(' · ')}` : 'Showing all categories';

    // active filter tags
    const tags = [];
    if (state.q) tags.push(['q', `“${state.q}”`]);
    state.cats.forEach((c) => tags.push(['cat:' + c, c]));
    state.brands.forEach((b) => tags.push(['brand:' + b, b]));
    if (state.inStock) tags.push(['stock', 'In stock only']);
    $('#activeTags').innerHTML = tags.length
      ? tags.map(([k, label]) => `<span class="fd-tag">${esc(label)}<button type="button" data-remove="${esc(k)}" aria-label="Remove ${esc(label)}"><i class="bi bi-x-lg"></i></button></span>`).join('') +
        '<button type="button" class="fd-reset" data-reset>Clear all</button>'
      : '';

    const count = tags.filter(([k]) => k !== 'q').length;
    $('#filterBadge').textContent = count;
    $('#filterBadge').hidden = count === 0;
    $('#catCount').textContent = state.cats.size;
    $('#catCount').hidden = state.cats.size === 0;
    $('#brandCount').textContent = state.brands.size;
    $('#brandCount').hidden = state.brands.size === 0;
  };

  /* ------------------------------------------------------------------
     EVENTS
     ------------------------------------------------------------------ */
  const syncChecks = () => {
    $$('input[name="cat"]').forEach((i) => { i.checked = state.cats.has(i.value); });
    $$('input[name="brand"]').forEach((i) => { i.checked = state.brands.has(i.value); });
    $('#inStock').checked = state.inStock;
  };

  const resetAll = () => {
    state.q = ''; state.cats = new Set(); state.brands = new Set(); state.inStock = false;
    $('#qInput').value = '';
    syncChecks();
    render();
  };

  $('#filterForm').addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'cat') state.cats = new Set($$('input[name="cat"]:checked').map((i) => i.value));
    else if (t.name === 'brand') state.brands = new Set($$('input[name="brand"]:checked').map((i) => i.value));
    else if (t.id === 'inStock') state.inStock = t.checked;
    else return;
    render();
  });

  let qt;
  $('#qInput').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => { state.q = e.target.value.trim(); render(); }, 200); });
  $('#sortSelect').addEventListener('change', (e) => { state.sort = e.target.value; render(); });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-reset]')) { resetAll(); return; }

    const rm = e.target.closest('[data-remove]');
    if (rm) {
      const k = rm.dataset.remove;
      if (k === 'q') { state.q = ''; $('#qInput').value = ''; }
      else if (k.startsWith('cat:')) state.cats.delete(k.slice(4));
      else if (k.startsWith('brand:')) state.brands.delete(k.slice(6));
      else if (k === 'stock') state.inStock = false;
      syncChecks();
      render();
      return;
    }

    const add = e.target.closest('[data-add]');
    if (add) {
      const p = PRODUCTS.find((x) => x.id === add.dataset.add);
      cart.add(p.id, 1);
      toast(`${p.name} added to cart`);
      return;
    }

    const fav = e.target.closest('[data-fav]');
    if (fav) {
      const on = favs.toggle(fav.dataset.fav);
      fav.setAttribute('aria-pressed', String(on));
      toast(on ? 'Saved to wishlist' : 'Removed from wishlist');
    }
  });

  /* ------------------------------------------------------------------
     TOAST
     ------------------------------------------------------------------ */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }

  /* ------------------------------------------------------------------
     SHARED SITE BEHAVIOUR
     ------------------------------------------------------------------ */
  $$('[data-marquee]').forEach((track) => {
    const once = track.dataset.marquee.split('|').map((w) => `<span>${esc(w)}<b>✱</b></span>`).join('');
    track.innerHTML = once + once + once + once;
  });

  if (window.AOS) {
    AOS.init({
      duration: 750, easing: 'ease-out-cubic', once: true, offset: 40,
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });
  }

  const header = $('#siteHeader'), toTop = $('#toTop');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-sticky', y > 160);
    toTop.classList.toggle('is-visible', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  $('#year').textContent = new Date().getFullYear();

  cart.paint();
  sortDD.refresh();
  render();
})();
