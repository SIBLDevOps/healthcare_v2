/* BeyondSure – shared helpers for the service sections
   (lab-tests/, medicines/, dental/, fitness/).
   Exposes window.BS_SVC. Each service folder has its own data + page script. */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const money = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const off = (price, mrp) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
  const param = (k) => new URLSearchParams(window.location.search).get(k);

  /* ---------------- storage (browser only) ---------------- */
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage unavailable */ } }
  };

  /* simple cart per service: { id: qty } */
  const makeCart = (key) => {
    const c = {
      get: () => store.get(key, {}),
      set(id, qty) { const x = c.get(); if (qty > 0) x[id] = qty; else delete x[id]; store.set(key, x); document.dispatchEvent(new CustomEvent('svc:cart', { detail: key })); },
      add(id, qty = 1) { c.set(id, (c.get()[id] || 0) + qty); },
      remove(id) { c.set(id, 0); },
      clear() { store.set(key, {}); document.dispatchEvent(new CustomEvent('svc:cart', { detail: key })); },
      has: (id) => !!c.get()[id],
      count: () => Object.values(c.get()).reduce((a, b) => a + b, 0)
    };
    return c;
  };

  /* orders / bookings: saved so the confirmation + tracking pages can show them */
  const orders = {
    save(service, data) {
      const all = store.get('bs_svc_orders', {});
      const id = service.slice(0, 3).toUpperCase() + Date.now().toString().slice(-7);
      all[id] = Object.assign({ id, service, createdAt: new Date().toISOString(), status: 0 }, data);
      store.set('bs_svc_orders', all);
      return id;
    },
    get: (id) => store.get('bs_svc_orders', {})[id] || null,
    update(id, patch) { const all = store.get('bs_svc_orders', {}); if (!all[id]) return; Object.assign(all[id], patch); store.set('bs_svc_orders', all); },
    list: (service) => Object.values(store.get('bs_svc_orders', {})).filter((o) => !service || o.service === service).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  };

  /* ---------------- toast ---------------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
  }

  /* ---------------- validation ---------------- */
  const valid = {
    name: (v) => v.trim().length >= 2,
    mobile: (v) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, '').slice(-10)) && v.replace(/\D/g, '').length >= 10,
    email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    pincode: (v) => /^[1-9]\d{5}$/.test(v.trim()),
    age: (v) => +v >= 1 && +v <= 110,
    required: (v) => v.trim().length > 0
  };
  /* checks every [data-validate] field inside a container; marks errors; returns true if all ok */
  function checkFields(container) {
    let ok = true, first = null;
    $$('[data-validate]', container).forEach((f) => {
      if (f.closest('[hidden]')) return;
      const rule = f.dataset.validate;
      const good = (valid[rule] || valid.required)(f.value || '');
      f.classList.toggle('is-invalid', !good);
      const msg = f.closest('.sv-field')?.querySelector('.sv-err');
      if (msg) msg.hidden = good;
      if (!good) { ok = false; first = first || f; }
    });
    if (first) first.focus();
    return ok;
  }
  document.addEventListener('input', (e) => {
    if (e.target.matches('[data-validate].is-invalid')) {
      e.target.classList.remove('is-invalid');
      const msg = e.target.closest('.sv-field')?.querySelector('.sv-err');
      if (msg) msg.hidden = true;
    }
  });

  /* pincode serviceability (sample rule: any valid Indian pincode is served) */
  const serviceable = (pin) => valid.pincode(pin);

  /* ---------------- dates + slots ---------------- */
  const DAY = 86400000;
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const fmtDate = (d, o = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(d).toLocaleDateString('en-IN', o);
  const fmtTime = (h, m = 0) => new Date(2000, 0, 1, h, m).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();

  /* date strip: returns html of n day buttons starting today (+startOffset) */
  function dateStrip(n = 7, startOffset = 0, selectedIdx = 0) {
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(today0().getTime() + (i + startOffset) * DAY);
      const label = i + startOffset === 0 ? 'Today' : i + startOffset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' });
      return `<button type="button" class="sv-day" data-date="${d.toISOString()}" aria-pressed="${i === selectedIdx}">
        <span>${label}</span><b>${d.getDate()}</b><small>${d.toLocaleDateString('en-IN', { month: 'short' })}</small></button>`;
    }).join('');
  }
  /* time slot buttons; slots = [{label, value, disabled}] */
  const slotButtons = (slots, selected) => slots.map((s) =>
    `<button type="button" class="sv-slot" data-slot="${esc(s.value)}" aria-pressed="${s.value === selected}" ${s.disabled ? 'disabled' : ''}>${esc(s.label)}${s.note ? `<small>${esc(s.note)}</small>` : ''}</button>`).join('');
  /* hours passed today are not bookable */
  const pastToday = (dateIso, hour) => new Date(dateIso).toDateString() === new Date().toDateString() && hour <= new Date().getHours() + 1;

  /* single-choice groups: clicking a [aria-pressed] button inside a group selects it */
  function pickGroup(container, selector, onPick) {
    container.addEventListener('click', (e) => {
      const b = e.target.closest(selector);
      if (!b || b.disabled || !container.contains(b)) return;
      $$(selector, container).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      onPick && onPick(b);
    });
  }

  /* ---------------- stepper (multi-step checkout) ----------------
     markup: .sv-steps-bar li[data-step], section.sv-step[data-step] (hidden except current)
     opts.validate(stepIndex) -> true/false ; opts.onShow(stepIndex) */
  function stepper(root, opts = {}) {
    const panes = $$('.sv-step', root), bars = $$('.sv-steps-bar li', root);
    let cur = 0;
    const show = (i) => {
      cur = i;
      panes.forEach((p, k) => { p.hidden = k !== i; });
      bars.forEach((b, k) => { b.classList.toggle('is-done', k < i); b.classList.toggle('is-current', k === i); b.setAttribute('aria-current', k === i ? 'step' : 'false'); });
      opts.onShow && opts.onShow(i);
      const top = root.getBoundingClientRect().top + window.scrollY - 100;
      if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    };
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-next]')) { if (!opts.validate || opts.validate(cur)) show(Math.min(cur + 1, panes.length - 1)); }
      else if (e.target.closest('[data-prev]')) show(Math.max(cur - 1, 0));
      else { const b = e.target.closest('.sv-steps-bar li.is-done'); if (b) show(bars.indexOf(b)); }
    });
    show(0);
    return { show, get current() { return cur; } };
  }

  /* ---------------- tracking timeline ---------------- */
  const timeline = (steps, done) => `<ol class="sv-timeline">${steps.map((s, i) =>
    `<li class="${i < done ? 'is-done' : i === done ? 'is-current' : ''}"><span class="sv-tl-dot">${i < done ? '<i class="bi bi-check-lg"></i>' : i + 1}</span><div><strong>${esc(s.title)}</strong><small>${esc(s.text)}</small></div></li>`).join('')}</ol>`;

  /* pseudo QR (decorative, made from the id) */
  function qrSvg(seed, size = 21) {
    let h = 0; for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#0b1b3f"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#0b1b3f"/>`;
    let cells = '';
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const inFinder = (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9);
      if (!inFinder && rnd() > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1" fill="#0b1b3f"/>`;
    }
    return `<svg viewBox="-1 -1 ${size + 2} ${size + 2}" class="sv-qr" role="img" aria-label="Check-in code ${esc(seed)}"><rect x="-1" y="-1" width="${size + 2}" height="${size + 2}" fill="#fff"/>${cells}${finder(0, 0)}${finder(size - 7, 0)}${finder(0, size - 7)}</svg>`;
  }

  /* ---------------- shared site behaviour ---------------- */
  function initSite() {
    $$('[data-marquee]').forEach((track) => {
      const once = track.dataset.marquee.split('|').map((w) => `<span>${esc(w)}<b>✱</b></span>`).join('');
      track.innerHTML = once + once + once + once;
    });
    if (window.AOS) {
      AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 30, disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches });
    }
    const header = $('#siteHeader'), toTop = $('#toTop');
    const onScroll = () => {
      const y = window.scrollY;
      header && header.classList.toggle('is-sticky', y > 160);
      toTop && toTop.classList.toggle('is-visible', y > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop && toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
    // header basket badge = wellness shop basket
    const n = Object.values(store.get('bs_cart', {})).reduce((a, b) => a + b, 0);
    $$('[data-cart-count]').forEach((el) => { el.textContent = n; el.hidden = n === 0; });
    // FAQ: only one open at a time per list
    $$('.sv-faq').forEach((list) => list.addEventListener('toggle', (e) => {
      if (e.target.open) $$('details', list).forEach((d) => { if (d !== e.target) d.open = false; });
    }, true));
  }

  /* FAQ html from [[q,a],...] */
  const faqHtml = (items) => items.map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${esc(q)}<i class="bi bi-plus-lg"></i></summary><p>${esc(a)}</p></details>`).join('');

  window.BS_SVC = { $, $$, esc, inr, money, off, param, store, makeCart, orders, toast, valid, checkFields, serviceable,
    DAY, today0, fmtDate, fmtTime, dateStrip, slotButtons, pastToday, pickGroup, stepper, timeline, qrSvg, initSite, faqHtml };
})();
