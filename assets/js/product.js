/* BeyondSure – product detail (product.html?id=...)
   All product data comes from window.BS_SHOP (assets/js/products-data.js). */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const LOGIN = 'https://teleconsult.bysure.in/login';

  const { PRODUCTS, DEFAULTS, PAYMENT_NOTE, MAX_QTY, discount, inr, cart, favs, productImage, productCard } = window.BS_SHOP;
  const money = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ------------------------------------------------------------------
     FIND THE PRODUCT
     ------------------------------------------------------------------ */
  const id = new URLSearchParams(window.location.search).get('id');
  const p = PRODUCTS.find((x) => x.id === id);

  if (!p) {
    $('#pdBody').hidden = true;
    $('#pdMissing').hidden = false;
    $('#crumbCat').textContent = 'Not found';
    $('#crumbCat').nextElementSibling.hidden = true;
    $('#crumbName').hidden = true;
  } else {
    document.title = `${p.name} – BeyondSure Shop`;
    $('#crumbCat').textContent = p.category;
    $('#crumbCat').href = `shop.html?category=${slug(p.category)}`;
    $('#crumbName').textContent = p.name;

    const off = discount(p);

    /* ---------------- gallery (Save / wishlist button sits on the image) ---------------- */
    const saved = favs.has(p.id);
    $('#pdGallery').innerHTML = `
      <div class="pd-media${p.inStock ? '' : ' is-out'}">
        ${productImage(p, '(max-width: 991.98px) 440px, 460px', true)}
        ${off ? `<span class="sp-off">${off}% off</span>` : ''}
        ${p.inStock ? '' : '<span class="sp-unavail"><i class="bi bi-exclamation-triangle"></i> Temporarily unavailable</span>'}
        <button type="button" class="pd-save" id="saveBtn" aria-pressed="${saved}" aria-label="${saved ? 'Remove from' : 'Save to'} wishlist" title="${saved ? 'Saved' : 'Save'}"><i class="bi bi-heart"></i></button>
      </div>`;

    /* ---------------- buy box ---------------- */
    $('#pdInfo').innerHTML = `
      <a class="pd-brand" href="shop.html">${esc(p.brand)}</a>
      <h1 class="pd-name" id="pdName">${esc(p.name)}</h1>
      <div class="pd-rating">
        <span class="pd-stars" aria-hidden="true"><i class="bi bi-star"></i><i class="bi bi-star"></i><i class="bi bi-star"></i><i class="bi bi-star"></i><i class="bi bi-star"></i></span>
        ${p.reviews ? `${p.rating} · ${p.reviews} reviews` : 'No reviews yet'}
      </div>

      <div class="pd-price-row">
        <strong class="pd-price">${money(p.price)}</strong>
        ${off ? `<s>${inr(p.mrp)}</s><span class="pd-off">${off}% off</span>` : ''}
      </div>
      <p class="pd-tax">Inclusive of all taxes.</p>

      <p class="pd-short">${esc(p.short)}</p>

      <ul class="pd-meta">
        ${p.size ? `<li><i class="bi bi-box-seam"></i> Pack size <b>${esc(p.size)}</b></li>` : ''}
        <li><i class="bi bi-tag"></i> Category <b>${esc(p.category)}</b></li>
        <li class="${p.inStock ? 'bys-ok' : 'bys-out'}"><i class="bi ${p.inStock ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i> ${p.inStock ? 'In stock' : 'Temporarily unavailable'}</li>
      </ul>

      <div class="pd-buy">
        <div class="pd-qty" role="group" aria-label="Quantity">
          <button type="button" data-qty="-1" aria-label="Decrease quantity" ${p.inStock ? '' : 'disabled'}><i class="bi bi-dash-lg"></i></button>
          <input type="number" id="qty" value="1" min="1"${Number.isFinite(MAX_QTY) ? ` max="${MAX_QTY}"` : ''} inputmode="numeric" aria-label="Quantity" ${p.inStock ? '' : 'disabled'}>
          <button type="button" data-qty="1" aria-label="Increase quantity" ${p.inStock ? '' : 'disabled'}><i class="bi bi-plus-lg"></i></button>
        </div>
        <button type="button" class="bys-btn-brand-outline pd-add" id="addBtn" ${p.inStock ? '' : 'disabled'}><i class="bi bi-bag-plus"></i> Add to cart</button>
        ${p.inStock
          ? `<a class="bys-btn-brand pd-buynow" href="${LOGIN}">Buy it now <i class="bi bi-arrow-right"></i></a>`
          : '<span class="bys-btn-brand pd-buynow is-disabled" aria-disabled="true">Unavailable</span>'}
      </div>

      <div class="pd-pay">
        <span class="dp-ic"><i class="bi bi-shield-lock"></i></span>
        <div><strong>Payment &amp; Security</strong><p>${esc(PAYMENT_NOTE)}</p></div>
      </div>`;

    /* ---------------- tabs ---------------- */
    const list = (arr) => `<ul class="pd-list">${arr.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
    const specs = [['Brand', p.brand], ['Category', p.category], ...(p.size ? [['Pack size', p.size]] : []), ...(p.specs || [])];
    const tabs = [
      ['desc', 'Description', (p.description || [p.short]).map((t) => `<p>${esc(t)}</p>`).join('')],
      ['spec', 'Specifications', `<dl class="pd-specs">${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`],
      ['use', 'How To Use', list(p.howToUse || DEFAULTS.howToUse)],
      ['care', 'Care Information', list(p.care || DEFAULTS.care)],
      ['ship', 'Delivery and Shipping', list(DEFAULTS.shipping)]
    ];
    $('#pdTabs').innerHTML = tabs.map(([k, label], i) =>
      `<button type="button" role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${label}</button>`).join('');
    $('#pdPanels').innerHTML = tabs.map(([k, , html], i) =>
      `<div class="pd-panel" role="tabpanel" id="panel-${k}" aria-labelledby="tab-${k}" tabindex="0" ${i === 0 ? '' : 'hidden'}>${html}</div>`).join('');

    const tabBtns = $$('#pdTabs [role="tab"]');
    const showTab = (btn, focus) => {
      tabBtns.forEach((b) => { const on = b === btn; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; $('#' + b.getAttribute('aria-controls')).hidden = !on; });
      if (focus) btn.focus();
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };
    $('#pdTabs').addEventListener('click', (e) => { const b = e.target.closest('[role="tab"]'); if (b) showTab(b); });
    $('#pdTabs').addEventListener('keydown', (e) => {
      const i = tabBtns.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); showTab(tabBtns[(i + 1) % tabBtns.length], true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); showTab(tabBtns[(i - 1 + tabBtns.length) % tabBtns.length], true); }
    });

    /* ---------------- key benefits ---------------- */
    if (p.benefits && p.benefits.length) {
      $('#pdBenefits').innerHTML = p.benefits.map((b) => {
        const [title, ...rest] = b.split(':');
        return `<li><span class="pd-tick"><i class="bi bi-check-lg"></i></span><div>${rest.length ? `<strong>${esc(title)}</strong><p>${esc(rest.join(':').trim())}</p>` : `<p>${esc(b)}</p>`}</div></li>`;
      }).join('');
    } else {
      $('#benefitsWrap').hidden = true;
    }

    /* ---------------- related products ---------------- */
    const related = PRODUCTS.filter((x) => x.id !== p.id)
      .sort((a, b) => (b.category === p.category) - (a.category === p.category) || (b.inStock - a.inStock) || a.featured - b.featured)
      .slice(0, 4);
    $('#relatedGrid').innerHTML = related.map(productCard).join('');

    /* ---------------- buy box actions ---------------- */
    const qty = $('#qty');
    // at least 1; upper limit only if MAX_QTY is set (no limit for now)
    const clampQty = () => { qty.value = Math.max(1, Math.min(MAX_QTY, parseInt(qty.value, 10) || 1)); };
    $$('[data-qty]').forEach((b) => b.addEventListener('click', () => { qty.value = (parseInt(qty.value, 10) || 1) + Number(b.dataset.qty); clampQty(); }));
    qty.addEventListener('change', clampQty);

    $('#addBtn').addEventListener('click', () => {
      clampQty();
      cart.add(p.id, Number(qty.value));
      toast(`${qty.value} × ${p.name} added to cart`);
    });

    $('#saveBtn').addEventListener('click', (e) => {
      const on = favs.toggle(p.id);
      e.currentTarget.setAttribute('aria-pressed', String(on));
      e.currentTarget.setAttribute('aria-label', `${on ? 'Remove from' : 'Save to'} wishlist`);
      e.currentTarget.title = on ? 'Saved' : 'Save';
      toast(on ? 'Saved to wishlist' : 'Removed from wishlist');
    });
  }

  // add / save on related product cards
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { const x = PRODUCTS.find((q) => q.id === add.dataset.add); cart.add(x.id, 1); toast(`${x.name} added to cart`); return; }
    const fav = e.target.closest('[data-fav]');
    if (fav) { const on = favs.toggle(fav.dataset.fav); fav.setAttribute('aria-pressed', String(on)); toast(on ? 'Saved to wishlist' : 'Removed from wishlist'); }
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
})();
