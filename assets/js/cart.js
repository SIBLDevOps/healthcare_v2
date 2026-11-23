/* BeyondSure – basket (cart.html)
   Reads the basket saved by the shop (localStorage "bs_cart") and the
   product data from window.BS_SHOP (assets/js/products-data.js). */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const plural = (n) => `${n} item${n === 1 ? '' : 's'}`;

  const { GST_RATE, MAX_QTY, cart, cartTotals, discount, productUrl, productImage } = window.BS_SHOP;

  /* ------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------ */
  const itemHtml = ({ p, qty }) => {
    const off = discount(p);
    const saved = (p.mrp - p.price) * qty;
    return `
      <li class="ct-item" data-id="${esc(p.id)}">
        <a class="ct-thumb" href="${productUrl(p)}" tabindex="-1" aria-hidden="true">
          ${productImage(p, '108px')}
          ${off ? `<span class="ct-off">${off}% OFF</span>` : ''}
        </a>
        <div class="ct-info">
          <div class="ct-info-top">
            <div class="ct-name-wrap">
              <h3 class="ct-name"><a href="${productUrl(p)}">${esc(p.name)}</a></h3>
              <span class="ct-sku">SKU: ${esc(p.sku || '—')}</span>
            </div>
            <div class="ct-line">
              <strong>${money(p.price * qty)}</strong>
              <small>${money(p.price)} each</small>
            </div>
          </div>
          ${off ? `<div class="ct-price-row"><span>MRP <s>${money(p.mrp)}</s></span><span class="ct-saved"><i class="bi bi-tag-fill"></i> Saved ${money(saved)}</span></div>` : ''}
          <div class="ct-actions">
            <div class="pd-qty ct-qty" role="group" aria-label="Quantity for ${esc(p.name)}">
              <button type="button" data-step="-1" aria-label="Decrease quantity" ${qty <= 1 ? 'disabled' : ''}><i class="bi bi-dash-lg"></i></button>
              <input type="number" value="${qty}" min="1"${Number.isFinite(MAX_QTY) ? ` max="${MAX_QTY}"` : ''} inputmode="numeric" aria-label="Quantity">
              <button type="button" data-step="1" aria-label="Increase quantity" ${qty >= MAX_QTY ? 'disabled' : ''}><i class="bi bi-plus-lg"></i></button>
            </div>
            <button type="button" class="ct-remove" data-remove><i class="bi bi-trash3"></i> Remove</button>
          </div>
        </div>
      </li>`;
  };

  const render = () => {
    const t = cartTotals();
    const has = t.lines.length > 0;

    $('#ctLayout').hidden = !has;
    $('#ctEmpty').hidden = has;
    $('#ctBar').hidden = !has;
    $('#ctCount').hidden = !has;
    if (!has) return;

    $('#ctCount').textContent = plural(t.items);
    $('#ctItemsCount').textContent = `(${t.lines.length})`;
    $('#ctItems').innerHTML = t.lines.map(itemHtml).join('');

    $('#ctRows').innerHTML = `
      <div><dt>Total MRP (${plural(t.items)})</dt><dd>${money(t.mrp)}</dd></div>
      ${t.discount > 0 ? `<div><dt>Product Discount</dt><dd class="ct-green">-${money(t.discount)}</dd></div>` : ''}
      <div><dt>Taxable Amount</dt><dd>${money(t.taxable)}</dd></div>
      <div><dt>Estimated Tax (GST ${Math.round(GST_RATE * 100)}%)</dt><dd>${money(t.tax)}</dd></div>
      <div><dt>Delivery Fee</dt><dd class="ct-green">FREE</dd></div>`;
    $('#ctTotal').textContent = money(t.total);
    $('#ctBarTotal').textContent = money(t.total);
    $('#ctGstNote').textContent = `Includes ${money(t.tax)} GST. Shipping is confirmed once you enter your delivery address.`;

    $('#ctSave').hidden = t.discount <= 0;
    $('span', $('#ctSave')).textContent = `You will save ${money(t.discount)} on this order!`;
  };

  /* ------------------------------------------------------------------
     EVENTS
     ------------------------------------------------------------------ */
  const itemOf = (el) => el.closest('.ct-item');

  $('#ctItems').addEventListener('click', (e) => {
    const li = itemOf(e.target);
    if (!li) return;
    const id = li.dataset.id;
    const step = e.target.closest('[data-step]');
    if (step) { cart.set(id, Math.max(1, (cart.get()[id] || 1) + Number(step.dataset.step))); render(); return; }
    if (e.target.closest('[data-remove]')) {
      const name = $('.ct-name', li).textContent;
      cart.remove(id);
      render();
      toast(`${name} removed from your basket`);
    }
  });

  $('#ctItems').addEventListener('change', (e) => {
    if (e.target.type !== 'number') return;
    const qty = Math.max(1, Math.min(MAX_QTY, parseInt(e.target.value, 10) || 1));
    cart.set(itemOf(e.target).dataset.id, qty);
    render();
  });

  // No coupons are published yet, so every code is checked and reported as not valid.
  $('#ctCoupon').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = $('#ctCode').value.trim().toUpperCase();
    const msg = $('#ctCouponMsg');
    msg.className = 'ct-coupon-msg is-error';
    msg.textContent = code ? `Coupon "${code}" is not valid or has expired.` : 'Please enter a coupon code.';
    $('#ctCode').focus();
  });
  $('#ctCode').addEventListener('input', () => { $('#ctCouponMsg').textContent = ''; });

  // basket changed in another tab
  window.addEventListener('storage', (e) => { if (e.key === 'bs_cart') { cart.paint(); render(); } });

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
  render();
})();
