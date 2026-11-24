/* Lab Tests – lab side-bar (new booking flow, like a price-comparison store).
   Opens after Add on the FIRST test of a booking (no lab chosen yet; layout.js handleAdd):
     "Choose a lab" : only the labs near the user that do this test, as small cards
                      (logo, name, rating, price per person, x members) – sortable.
   "Select" saves the lab for the booking and closes the side-bar; the user stays on the same page and every
   added test card shows the lab name (top-right). Later tests use this lab – it is changed on
   compare-labs.html (selected lab first, other labs below) -> location -> slot -> pay.
   LT.labPicker.open(itemId, { prevLabId })   open the side-bar for one item
   LT.labPicker.confirmLab(lab)               shared "Select & Continue" (partial-lab popup, centre choice,
                                              saves the lab, goes to the next step). Used by compare-labs.js. */
window.LT = window.LT || {};

(function () {
  const U = () => LT.ui;
  const esc = (s) => U().esc(s), money = (n) => U().money(n);
  const url = (p) => LT.layout.url(p);
  const first = (n) => String(n || '').split(' ')[0];
  let el = null, oc = null, st = {}, labsData = null;

  /* ---------- shell (one offcanvas, reused) ---------- */
  function shell() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'offcanvas offcanvas-end lt-lp'; el.tabIndex = -1; el.id = 'ltLabPicker'; el.setAttribute('aria-labelledby', 'ltLpTitle');
    el.innerHTML = `<div class="offcanvas-header lt-lp-head">
        <div class="lt-lp-htxt"><h2 id="ltLpTitle">Choose a lab</h2><small data-lp-sub></small></div>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button></div>
      <div class="offcanvas-body lt-lp-body" data-lp-body></div>`;
    document.body.appendChild(el);
    oc = new bootstrap.Offcanvas(el);
    el.addEventListener('click', onClick);
    el.addEventListener('hidden.bs.offcanvas', () => { LT.layout.refresh(); if (LT.page && LT.page.onCartChange) LT.page.onCartChange(); if (st.after) { const f = st.after; st.after = null; f(); } });
  }
  const $ = (q) => el.querySelector(q);
  const body = () => $('[data-lp-body]');

  /* ---------- open ---------- */
  function open(itemId, o) {
    o = o || {};
    shell();
    st = { itemId, prevLabId: o.prevLabId || null, sort: 'recommended' };
    oc.show();
    render();
  }

  /* ---------- "Choose a lab" ---------- */
  async function render() {
    const s = LT.store.get();
    $('#ltLpTitle').textContent = 'Choose a lab';
    $('[data-lp-sub]').innerHTML = `<i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ${esc(s.location.area || s.location.city)} ${esc(s.location.pincode)} · ${s.mode === 'centre' ? 'Lab centre visit' : 'Home collection'}`;
    U().skeleton(body(), 'block', 3);
    try { labsData = await LT.api.getLabsForItem(st.itemId); }
    catch (e) { return U().error(body(), { text: U().errMsg(e), onRetry: render }); }
    const d = labsData, it = d.item, pkg = it.type === 'package', centre = s.mode === 'centre';
    const okCount = d.labs.filter((l) => l.itemOffer.offered).length;
    const who = d.members.map((m) => `<span class="lt-lp-who">${U().avatar(m.name, LT.members.color(m.id), 'sm')}${esc(first(m.name))}</span>`).join('');
    const sorts = [['recommended', 'Recommended'], ['price', 'Lowest price'], ['fastest', 'Fastest report'], ['rating', 'Top rated']].concat(centre ? [['nearest', 'Nearest']] : []);
    body().innerHTML = `<div class="lt-lp-item">
        <span class="lt-lp-item-ico" aria-hidden="true"><i class="bi bi-${pkg ? 'box2-heart' : 'droplet-half'}"></i></span>
        <div class="lt-lp-item-txt"><b>${esc(it.name)}</b><small>${pkg ? (it.tests || []).length + ' tests · ' : ''}${it.parameters} parameter${it.parameters > 1 ? 's' : ''} · ${it.fastingHours ? it.fastingHours + ' hrs fasting' : 'No fasting'}</small>
          ${who ? `<div class="lt-lp-whorow d-none"><span>For</span>${who}<small class="lt-lp-whonote">Add family members in your cart</small></div>` : ''}</div></div>
      ${!okCount ? (it.centreOnly && !centre
        ? `<div class="lt-alert is-warn"><i class="bi bi-hospital"></i><div><strong>This test needs a lab centre visit.</strong> Labs cannot collect it at home.<div class="lt-alert-acts"><button type="button" class="btn lt-btn btn-sm" data-switch-mode="centre">Switch to Lab Centre</button></div></div></div>`
        : `<div class="lt-alert is-warn"><i class="bi bi-exclamation-triangle"></i><div><strong>No lab near you does this ${pkg ? 'package' : 'test'} right now.</strong> Try another location or mode.</div></div>`) : ''}
      ${okCount ? `<div class="lt-lp-sortrow"><span class="lt-lp-count"><b>${okCount}</b> lab${okCount > 1 ? 's' : ''} offer this ${pkg ? 'package' : 'test'}</span>
        <div class="lt-lp-sort" role="group" aria-label="Sort labs">${sorts.map(([k, l]) => `<button type="button" class="lt-chip" data-lp-sort="${k}" aria-pressed="${st.sort === k}">${l}</button>`).join('')}</div></div>` : ''}
      <div class="lt-lp-labs" data-lp-labs></div>
      <p class="lt-lp-note"><i class="bi bi-info-circle" aria-hidden="true"></i> Prices are per person and include the lab discount. Your other tests will use the lab you select. You can compare and change it before booking.</p>`;
    paint();
  }

  /* small lab card: logo · name + rating (+ x members / cart line) · price + Select */
  function card(l) {
    const d = labsData, o = l.itemOffer, prev = st.prevLabId === l.id;
    const pct = o.offered && o.mrp > o.price ? Math.round(((o.mrp - o.price) / o.mrp) * 100) : 0;
    const lines = o.offered ? [
      d.persons > 1 ? `<span><i class="bi bi-people" aria-hidden="true"></i>${money(o.price)} × ${d.persons} = <b>${money(o.total)}</b></span>` : '',
      d.cartCount > 1 ? `<span><i class="bi bi-cart3" aria-hidden="true"></i>Cart here <b>${money(l.quote.total)}</b>${l.missingTests.length ? ` <em>· ${l.missingTests.length} n/a</em>` : ''}</span>` : ''
    ].filter(Boolean).join('') : '';
    return `<article class="lt-lp-lab ${o.offered ? '' : 'is-na'} ${prev ? 'is-prev' : ''}" ${prev ? 'aria-label="' + esc(l.name) + ', your earlier lab"' : ''}>
      ${U().labLogo(l, 'sm')}
      <div class="lt-lp-lab-id"><h3>${esc(l.name)}</h3>
        <div class="lt-lp-lab-meta">${U().rating(l.rating, l.reviews)}${prev ? '<span class="lt-lp-prev">Earlier lab</span>' : ''}</div>
        ${lines ? `<div class="lt-lp-lines">${lines}</div>` : ''}</div>
      <div class="lt-lp-side">${o.offered
        ? `<div class="lt-lp-price"><b>${money(o.price)}</b>${pct ? `<span><del>${money(o.mrp)}</del><em>${pct}%</em></span>` : ''}</div>
           <button type="button" class="btn lt-btn lt-btn-sm" data-lp-pick="${l.id}" aria-label="Select ${esc(l.name)}">Select</button>`
        : '<span class="lt-lp-na">Not available</span>'}</div>
    </article>`;
  }
  function paint() {
    const d = labsData;
    let ok = d.labs.filter((l) => l.itemOffer.offered); // labs that don't do this test are not listed
    const by = { price: (a, b) => a.itemOffer.price - b.itemOffer.price, fastest: (a, b) => a.itemOffer.tat - b.itemOffer.tat, rating: (a, b) => b.rating - a.rating, nearest: (a, b) => a.distanceKm - b.distanceKm };
    if (by[st.sort]) ok = ok.slice().sort(by[st.sort]);
    $('[data-lp-labs]').innerHTML = ok.map(card).join('');
    el.querySelectorAll('[data-lp-sort]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lpSort === st.sort));
  }

  /* Select: save the lab for this booking, close the side-bar and stay on the same page – the test
     cards now show the lab name (top-right). Later tests use this lab; change it on Compare labs. */
  function pickLab(id) {
    const l = labsData.labs.find((x) => x.id === id); if (!l) return;
    const s = LT.store.get();
    LT.store.set({ lab: Object.assign({}, s.lab, { id, method: 'choose', centreId: l.nearestCentre ? l.nearestCentre.id : null }) });
    st.after = () => U().toast(l.name + ' selected for your tests. Compare or change it from your cart.', 'success', { action: 'Compare labs', onAction: () => { location.href = url('compare-labs.html'); } });
    oc.hide();
  }

  /* ---------- shared: Select & Continue ---------- */
  function partialPopup(l, have, miss) {
    return new Promise((resolve) => {
      let go = false;
      const md = U().modal.open({
        title: 'This lab offers only ' + have.length + ' of your ' + (have.length + miss.length) + ' tests',
        body: `<div class="lt-part">
            <div class="lt-part-lab">${U().labLogo(l, 'sm')}<div><b>${esc(l.name)}</b><small>${have.length} test${have.length > 1 ? 's' : ''} available · ${miss.length} not available</small></div></div>
            <div class="lt-part-cols">
              <div class="lt-part-col is-ok"><h4><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Available here</h4><ul>${have.map((x) => `<li><span>${esc(x.name)}</span><b>${money(x.total)}</b></li>`).join('')}</ul></div>
              <div class="lt-part-col is-na"><h4><i class="bi bi-x-circle-fill" aria-hidden="true"></i> Not available here</h4><ul>${miss.map((x) => `<li><span>${esc(x.name)}</span></li>`).join('')}</ul></div>
            </div>
            <p class="lt-part-note"><i class="bi bi-info-circle" aria-hidden="true"></i> If you continue, the test${miss.length > 1 ? 's' : ''} not available here will be removed from this booking. You can book ${miss.length > 1 ? 'them' : 'it'} later with another lab.</p></div>`,
        footer: '<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn lt-btn" data-go>Continue with ' + have.length + ' test' + (have.length > 1 ? 's' : '') + ' <i class="bi bi-arrow-right"></i></button>',
        onClose: () => resolve(go)
      });
      md.el.classList.add('lt-part-modal');
      md.$('[data-go]').onclick = () => { go = true; md.close(); };
    });
  }
  function pickCentre(l) {
    return new Promise((resolve) => {
      let v = null;
      const md = U().modal.open({
        title: 'Choose a centre', sub: l.name + ' has ' + l.centres.length + ' centres near you',
        body: `<div class="d-grid gap-2" role="radiogroup" aria-label="Lab centres">${l.centres.map((c, i) => `<label class="lt-opt"><input class="lt-opt-input" type="radio" name="lpcc" value="${c.id}" ${i ? '' : 'checked'}><span class="lt-opt-card"><span class="lt-opt-check"><i class="bi bi-check"></i></span><span class="lt-opt-body"><h3>${esc(c.name)} ${i ? '' : '<span class="lt-pill is-success ms-1">Nearest</span>'}</h3><p>${esc(c.address)} · ${c.distanceKm} km · ${esc(c.hours)}</p></span></span></label>`).join('')}</div>`,
        footer: '<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn lt-btn" data-ok>Use this centre</button>',
        onClose: () => resolve(v)
      });
      md.$('[data-ok]').onclick = () => { v = md.$('input[name=lpcc]:checked').value; md.close(); };
    });
  }
  /* l: { id, name, centres, nearestCentre, items:[{id, name, offered, total}] } */
  async function confirmLab(l) {
    const have = l.items.filter((x) => x.offered), miss = l.items.filter((x) => !x.offered);
    if (!have.length) { U().toast(l.name + ' does not offer any of your tests.', 'warning'); return false; }
    if (miss.length && !(await partialPopup(l, have, miss))) return false;
    const sNow = LT.store.get();
    let centreId = l.nearestCentre ? l.nearestCentre.id : null;
    if (sNow.mode === 'centre' && (l.centres || []).length > 1) { centreId = await pickCentre(l); if (!centreId) return false; }
    if (miss.length) miss.forEach((x) => LT.cart.remove(x.id));
    const s2 = LT.store.get(), changed = sNow.lab.id && sNow.lab.id !== l.id;
    LT.store.set({ lab: Object.assign({}, s2.lab, { id: l.id, method: 'choose', centreId }), slot: changed || miss.length ? LT.store.defaults().slot : s2.slot });
    LT.layout.flash(l.name + ' selected' + (miss.length ? ' · ' + miss.length + ' unavailable test' + (miss.length > 1 ? 's' : '') + ' removed' : '') + '. Now confirm ' + (sNow.mode === 'centre' ? 'your centre.' : 'the collection address.'));
    location.href = url('location.html');
    return true;
  }

  /* ---------- events ---------- */
  function onClick(e) {
    const t = e.target;
    const so = t.closest('[data-lp-sort]'); if (so) { st.sort = so.dataset.lpSort; return paint(); }
    const pk = t.closest('[data-lp-pick]'); if (pk) return pickLab(pk.dataset.lpPick);
  }

  LT.labPicker = { open, confirmLab, partialPopup };
})();
