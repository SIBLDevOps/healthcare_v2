/* Page: select-lab.html – PHASE 11 Select lab (user chooses the lab)
   Sort, filters, lab cards, compare (max 3), list/map (centre mode), centre chooser,
   detail drawer, partial-coverage modal, no-lab empty state.
   Changing the lab re-prices and clears the slot. */
(function () {
  const { esc, money, hours, toast, modal, skeleton, empty, error, labLogo, rating, amenities, busy, errMsg, priceBlock } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'labtests', stepper: 'lab', title: 'Select your lab' });
  if (!LT.guards.require(['location', 'cart', 'members'])) return;
  const s0 = LT.store.get();
  const centre = s0.mode === 'centre';
  let opt = 'choose', labs = [], compare = [], view = 'list', sort = 'recommended', filters = {}, pref = s0.lab.preference || 'value', auto = null;

  const nTests = s0.selectedMemberIds.reduce((t, m) => t + (s0.assignments[m] || []).length, 0);
  app.innerHTML = `
     <div class="lt-container">
        <div class="lt-page-head"><h1>Select your lab</h1><p>Prices below are exact totals for your members and tests at each lab.</p>
      <div class="lt-ctxchips"><span class="lt-pill"><i class="bi bi-geo-alt-fill text-primary"></i>${esc(s0.location.area || s0.location.city)} ${esc(s0.location.pincode)}</span><span class="lt-pill"><i class="bi bi-${centre ? 'hospital' : 'house-heart'} text-primary"></i>${centre ? 'Lab centre visit' : 'Home collection'}</span><span class="lt-pill"><i class="bi bi-people text-primary"></i>${s0.selectedMemberIds.length} member${s0.selectedMemberIds.length > 1 ? 's' : ''} | ${nTests} test${nTests > 1 ? 's' : ''}</span></div></div>
    <div class="row g-4 mt-1"><div class="col-lg-9" data-main></div><aside class="col-lg-3"><div class="lt-aside" data-aside></div></aside></div></div>
    <button type="button" class="btn lt-btn lt-fab" data-compare hidden><i class="bi bi-layout-three-columns"></i> Compare (<span>0</span>)</button>`;
  const $ = (q) => app.querySelector(q);
  const main = $('[data-main]');

  async function loadLabs() {
    const s = LT.store.get();
    labs = await LT.api.getEligibleLabs(s.cart, s.selectedMemberIds, s.assignments, s.mode, s.location.pincode);
    return labs;
  }

  /* facility icons with a proper tooltip (hover, keyboard focus or tap on phones) instead of the plain browser title */
  const amenTips = (list) => amenities(list).replace(/<i class="([^"]+)" title="([^"]*)" aria-label="[^"]*"><\/i>/g,
    (m, cls, name) => `<span class="lt-amen-tip" tabindex="0" role="img" aria-label="${name}" data-tip="${name}"><i class="${cls}" aria-hidden="true"></i></span>`);

  /* keep the tooltip on screen: near the left / right edge it anchors to that side instead of centring */
  const tipEdge = (e) => {
    const t = e.target.closest && e.target.closest('.lt-amen-tip'); if (!t) return;
    const r = t.getBoundingClientRect(), half = ((t.dataset.tip || '').length * 6.6 + 22) / 2, c = r.left + r.width / 2, vw = document.documentElement.clientWidth;
    t.classList.toggle('is-start', c - half < 8);
    t.classList.toggle('is-end', c - half >= 8 && c + half > vw - 8);
  };
  app.addEventListener('mouseover', tipEdge);
  app.addEventListener('focusin', tipEdge);

  /* ---------- lab card ---------- */
  function labCard(l, o) {
    o = o || {};
    const s = LT.store.get(), sel = s.lab.id === l.id;
    const c = l.nearestCentre;
    return `<article class="lt-lab ${sel ? 'is-selected' : ''} ${o.best ? 'is-best' : ''}" data-lab="${l.id}" id="lab-${l.id}">
      ${o.best ? '<span class="lt-ribbon"><i class="bi bi-award-fill"></i> Best match</span>' : ''}
      ${sel ? '<span class="lt-opt-check" style="background:var(--lt-primary);border-color:var(--lt-primary)"><i class="bi bi-check"></i></span>' : ''}
      <div class="lt-lab-head">${labLogo(l)}<div class="flex-grow-1"><h3 class="lt-lab-name">${esc(l.name)}</h3><div class="d-flex flex-wrap gap-2 align-items-center mt-1">${rating(l.rating, l.reviews)}<span class="lt-badges">${l.badges.map((b) => `<span class="${b === 'Flagship' ? 'is-flag' : ''}">${esc(b)}</span>`).join('')}</span></div>
        <div class="d-flex flex-wrap gap-1 mt-2">${(l.tags || []).map((t) => `<span class="lt-pill is-success"><i class="bi bi-${t === 'Lowest price' ? 'tag' : t === 'Fastest report' ? 'lightning' : 'star'}"></i>${t}</span>`).join('')}${l.deltaVsCheapest > 0 ? `<span class="lt-pill">+${money(l.deltaVsCheapest)} vs cheapest</span>` : ''}</div></div></div>
      <div class="lt-lab-grid">
        <div><i class="bi bi-clock-history"></i><span>Reports in<b>${l.quote.tatHours <= 6 ? 'Express ' + l.quote.tatHours + ' hrs' : hours(l.quote.tatHours)}</b></span></div>
        <div><i class="bi bi-calendar-check"></i><span>Earliest slot<b>${esc(l.earliestSlot.label)}</b></span></div>
        ${centre && c ? `<div><i class="bi bi-geo-alt"></i><span>${c.distanceKm} km away<b class="${c.openNow ? 'text-success' : 'text-danger'}">${c.openNow ? 'Open now' : 'Closed'} · ${esc(c.hours)}</b></span></div>` : `<div><i class="bi bi-house-heart"></i><span>Home collection<b class="${l.quote.collectionCharge ? '' : 'text-success'}">${l.quote.collectionCharge ? money(l.quote.collectionCharge) : 'FREE'}</b></span></div>`}
        <div><i class="bi bi-${l.coverage === 'full' ? 'check2-circle text-success' : 'exclamation-triangle text-danger'}"></i><span>Tests<b class="${l.coverage === 'full' ? 'text-success' : 'text-danger'}">${l.coverage === 'full' ? 'All tests available' : 'Missing: ' + l.missingTests.map((m) => esc(m.name)).join(', ')}</b></span></div>
      </div>
      ${centre && c ? `<p class="small mb-3"><i class="bi bi-pin-map"></i> ${esc(c.address)} ${amenTips(c.amenities)}${l.centres.length > 1 ? ` <span class="lt-pill ms-1">${l.centres.length} centres</span>` : ''}</p>` : ''}
      ${o.why ? `<div class="lt-why"><i class="bi bi-lightbulb"></i><div><b>Why this lab</b><br>${esc(o.why)}</div></div>` : ''}
      <div class="lt-lab-foot"><div class="lt-lab-price">${priceBlock(l.quote.total, l.quote.mrp + l.quote.collectionCharge)}<small class="lt-muted">Total for ${s.selectedMemberIds.length} member${s.selectedMemberIds.length > 1 ? 's' : ''}${l.quote.collectionCharge ? ' incl. collection' : ''}</small></div>
        <div class="lt-lab-acts">${o.compareBox ? `<label class="lt-compare-cb"><input class="form-check-input" type="checkbox" data-cmp="${l.id}" ${compare.includes(l.id) ? 'checked' : ''}> Compare</label>` : ''}
          <button type="button" class="btn lt-btn-ghost lt-btn-sm" data-detail="${l.id}">View details</button>
          ${o.best ? `<button type="button" class="btn lt-btn-outline lt-btn-sm" data-change>Change lab</button><button type="button" class="btn lt-btn lt-btn-sm" data-select="${l.id}" data-method="auto">${sel ? '<i class="bi bi-check2"></i> Confirmed' : 'Confirm this lab'}</button>` : `<button type="button" class="btn ${sel ? 'lt-btn' : 'lt-btn-outline'} lt-btn-sm" data-select="${l.id}" data-method="${o.method || 'choose'}">${sel ? '<i class="bi bi-check2"></i> Selected' : 'Select'}</button>`}</div></div></article>`;
  }

  /* ---------- Option A ---------- */
  function optionA() {
    main.innerHTML = `
      <div class="lt-card lt-lab-toolbar mb-3">
        <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div class="d-flex flex-wrap gap-2 align-items-center justify-content-between justify-content-lg-start flex-shrink-0">
            <div class="d-flex gap-2 align-items-center">
              <label class="small fw-bold" for="ltSort">Sort</label>
              <select id="ltSort" class="form-select form-select-sm" style="width:auto;min-height:40px">
                <option value="recommended">Recommended</option>
                <option value="price">Price: low to high</option>
                <option value="rating">Rating</option>
                <option value="fastest">Fastest report</option>
                ${centre ? '<option value="nearest">Nearest</option>' : ''}
              </select>
            </div>
            ${centre ? '<div class="lt-seg" style="width:auto" role="tablist" aria-label="View"><button role="tab" data-view="list" aria-selected="true"><i class="bi bi-list"></i> List</button><button role="tab" data-view="map" aria-selected="false"><i class="bi bi-map"></i> Map</button></div>' : ''}
          </div>
          <div class="lt-chiprow mt-3 mt-lg-0" role="group" aria-label="Filters">
            ${[['nabl', 'NABL / CAP'], ['tat24', 'Report within 24 h'], centre ? ['open', 'Open now'] : null, ['r4', 'Rating 4+'], !centre ? ['free', 'Free collection'] : null].filter(Boolean).map(([k, l]) => `<button type="button" class="lt-chip" data-filter="${k}" aria-pressed="${!!filters[k]}">${l}</button>`).join('')}
          </div>
        </div>
      </div>
      <div data-mapbox hidden></div>
      <div data-list></div>`;
    $('#ltSort').value = sort;
    $('#ltSort').onchange = (e) => { sort = e.target.value; paintA(); };
    main.querySelectorAll('[data-filter]').forEach((b) => { b.onclick = () => { filters[b.dataset.filter] = !filters[b.dataset.filter]; b.setAttribute('aria-pressed', filters[b.dataset.filter]); paintA(); }; });
    main.querySelectorAll('[data-view]').forEach((b) => { b.onclick = () => { view = b.dataset.view; main.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-selected', x === b)); paintA(); }; });
    skeleton(main.querySelector('[data-list]'), 'block', 3);
    loadLabs().then(paintA).catch((e) => error(main.querySelector('[data-list]'), { text: errMsg(e), onRetry: optionA }));
  }
  function paintA() {
    const box = main.querySelector('[data-list]');
    if (!labs.length) return noLab(box);
    let list = labs.slice();
    if (filters.nabl) list = list.filter((l) => l.accredited);
    if (filters.tat24) list = list.filter((l) => l.quote.tatHours <= 24);
    if (filters.open) list = list.filter((l) => l.openNow);
    if (filters.r4) list = list.filter((l) => l.rating >= 4);
    if (filters.free) list = list.filter((l) => !l.quote.collectionCharge);
    const by = { price: (a, b) => a.quote.total - b.quote.total, rating: (a, b) => b.rating - a.rating, fastest: (a, b) => a.quote.tatHours - b.quote.tatHours, nearest: (a, b) => a.distanceKm - b.distanceKm };
    if (by[sort]) list.sort(by[sort]);
    const mb = main.querySelector('[data-mapbox]');
    mb.hidden = view !== 'map';
    if (view === 'map') {
      mb.innerHTML = `<div class="lt-map mb-3" role="img" aria-label="Map of partner lab centres"><span class="lt-map-label"><i class="bi bi-geo-alt-fill text-primary"></i> ${esc(LT.store.get().location.area || '')} ${esc(LT.store.get().location.pincode)}</span>
        <span class="lt-pin is-me" style="left:44%;top:50%"><i class="bi bi-person-circle"></i><span>You</span></span>
        ${list.flatMap((l) => l.centres.map((c) => `<button type="button" class="lt-pin" style="left:${c.x}%;top:${c.y}%" data-pin="${l.id}" aria-label="${esc(c.name)}"><i class="bi bi-geo-alt-fill"></i><span>${esc(l.initials)} · ${money(l.quote.total)}</span></button>`)).join('')}</div>`;
      mb.querySelectorAll('[data-pin]').forEach((p) => { p.onclick = () => { mb.querySelectorAll('[data-pin]').forEach((x) => x.classList.toggle('is-active', x === p)); const card = document.getElementById('lab-' + p.dataset.pin); if (card) { card.classList.add('is-hl'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => card.classList.remove('is-hl'), 1600); } }; });
    }
    box.innerHTML = list.length ? list.map((l) => labCard(l, { compareBox: true })).join('') : '';
    if (!list.length) empty(box, { icon: 'lab', title: 'No labs match these filters', text: 'Try removing a filter.', actions: [{ label: 'Clear filters', onClick: () => { filters = {}; optionA(); } }] });
    paintCompare();
  }
  function noLab(box) {
    empty(box, {
      icon: 'lab', title: 'No eligible lab for this booking', text: 'No partner lab near you can do these tests in ' + (centre ? 'a centre visit' : 'home collection') + '. Try changing tests, mode or location.',
      actions: [{ label: 'Change tests', href: url('cart.html') }, { label: 'Change mode', onClick: () => LT.layout.switchMode() }, { label: 'Change location', href: url('index.html?setup=location') }]
    });
  }

  /* ---------- Option B ---------- */
  async function select(id, method) {
    const l = labs.find((x) => x.id === id);
    if (!l) return;
    if (l.coverage === 'partial') {
      const md = modal.open({
        title: 'Some tests are not available at this lab', body: `<p>${esc(l.name)} doesn't offer:</p><ul class="lt-checklist mb-3">${l.missingTests.map((m) => `<li><i class="bi bi-x-circle-fill text-danger"></i>${esc(m.name)}</li>`).join('')}</ul><p class="small mb-0">You can remove these tests and continue, or pick a lab that has everything.</p>`,
        footer: '<button type="button" class="btn lt-btn-outline" data-other>Choose another lab</button><button type="button" class="btn lt-btn" data-rm>Remove unavailable tests &amp; continue</button>'
      });
      md.$('[data-other]').onclick = () => md.close();
      md.$('[data-rm]').onclick = async () => { md.close(); l.missingTests.forEach((m) => LT.cart.remove(m.id)); toast(l.missingTests.length + ' unavailable test' + (l.missingTests.length > 1 ? 's' : '') + ' removed'); await loadLabs(); finishSelect(id, method); };
      return;
    }
    finishSelect(id, method);
  }
  function finishSelect(id, method) {
    const s = LT.store.get(), l = labs.find((x) => x.id === id);
    const changed = s.lab.id && s.lab.id !== id;
    const pickCentre = (cid) => {
      LT.store.set({ lab: { id, method, centreId: cid || (l.nearestCentre ? l.nearestCentre.id : null), preference: pref }, labOption: opt, slot: changed ? LT.store.defaults().slot : s.slot, address: s.address });
      if (s.slot.start && changed) toast('Lab changed. Please pick a new slot.', 'warning'); else toast(l.name + ' selected');
      repaint();
    };
    if (centre && l.centres.length > 1) {
      const md = modal.open({ title: 'Choose a centre', sub: l.name + ' has ' + l.centres.length + ' centres near you', body: `<div class="d-grid gap-2" role="radiogroup">${l.centres.map((c, i) => `<label class="lt-opt"><input class="lt-opt-input" type="radio" name="cc" value="${c.id}" ${i ? '' : 'checked'}><span class="lt-opt-card"><span class="lt-opt-check"><i class="bi bi-check"></i></span><span class="lt-opt-body"><h3>${esc(c.name)} ${i ? '' : '<span class="lt-pill is-success ms-1">Nearest</span>'}</h3><p>${esc(c.address)} · ${c.distanceKm} km · ${esc(c.hours)}</p></span></span></label>`).join('')}</div>`, footer: '<button type="button" class="btn lt-btn" data-ok>Use this centre</button>' });
      md.$('[data-ok]').onclick = () => { const v = md.$('input[name=cc]:checked').value; md.close(); pickCentre(v); };
    } else pickCentre();
  }
  function repaint() { paintA(); updateBar(); }

  function updateBar() {
    const s = LT.store.get(), l = labs.find((x) => x.id === s.lab.id);
    LT.layout.renderAside($('[data-aside]'), { after: () => setBar(l) });
    setBar(l);
  }
  const setBar = (l) => LT.layout.setAction({ text: l ? `<b>${money(l.quote.total)}</b>${esc(l.name)}` : '<b>No lab selected</b>Select or confirm a lab', label: 'Continue <i class="bi bi-arrow-right"></i>', disabled: !l, hint: l ? 'Next: ' + (centre ? 'confirm your centre' : 'collection address') : 'Select a lab to continue', onClick: () => { location.href = url('location.html'); } });

  /* ---------- compare ---------- */
  function paintCompare() { const b = $('[data-compare]'); b.hidden = compare.length < 1 || opt !== 'choose'; b.querySelector('span').textContent = compare.length; }
  function compareModal() {
    const list = labs.filter((l) => compare.includes(l.id));
    const rows = [['Total price', (l) => `<b>${money(l.quote.total)}</b>`], ['Rating', (l) => rating(l.rating, l.reviews)], ['Accreditation', (l) => l.badges.join(', ')], ['Report time', (l) => hours(l.quote.tatHours)], ['Earliest slot', (l) => esc(l.earliestSlot.label)],
    [centre ? 'Distance' : 'Collection charge', (l) => (centre ? l.distanceKm + ' km' : l.quote.collectionCharge ? money(l.quote.collectionCharge) : '<span class="text-success fw-bold">FREE</span>')], ['Tests available', (l) => (l.coverage === 'full' ? '<span class="text-success fw-bold">All</span>' : '<span class="text-danger">Missing ' + l.missingTests.map((m) => esc(m.name)).join(', ') + '</span>')], ['Cancellation', (l) => '<small>' + esc(l.cancellationPolicy) + '</small>']];
    const md = modal.open({ title: 'Compare labs', size: 'xl', body: `<div class="lt-table-wrap"><table class="lt-table lt-compare-table"><thead><tr><th scope="col"></th>${list.map((l) => `<th scope="col"><div class="d-flex gap-2 align-items-center">${labLogo(l, 'sm')}<span class="text-wrap">${esc(l.name)}</span></div></th>`).join('')}</tr></thead><tbody>${rows.map(([k, f]) => `<tr><th scope="row">${k}</th>${list.map((l) => `<td>${f(l)}</td>`).join('')}</tr>`).join('')}<tr><th></th>${list.map((l) => `<td><button type="button" class="btn lt-btn lt-btn-sm" data-pick="${l.id}">Select</button></td>`).join('')}</tr></tbody></table></div>` });
    md.el.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) { md.close(); select(b.dataset.pick, 'choose'); } });
  }

  /* ---------- detail drawer ---------- */
  async function detail(id) {
    const el = document.createElement('div');
    el.className = 'offcanvas offcanvas-end lt-drawer'; el.tabIndex = -1; el.setAttribute('aria-label', 'Lab details');
    el.innerHTML = '<div class="offcanvas-header"><h2 class="h5 mb-0">Lab details</h2><button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button></div><div class="offcanvas-body" data-b></div>';
    document.body.appendChild(el); const oc = new bootstrap.Offcanvas(el); oc.show(); el.addEventListener('hidden.bs.offcanvas', () => el.remove());
    const b = el.querySelector('[data-b]'); skeleton(b, 'block', 3);
    try {
      const l = await LT.api.getLab(id);
      b.innerHTML = `<div class="d-flex gap-3 align-items-center">${labLogo(l)}<div><h3 class="h5 fw-bold mb-1">${esc(l.name)}</h3>${rating(l.rating, l.reviews)}</div></div>
        <div class="lt-badges mt-2">${l.badges.map((x) => `<span>${esc(x)}</span>`).join('')}</div><p class="mt-3">${esc(l.about)}</p>
        <h4 class="h6 fw-bold mt-4">Centres</h4>${l.centres.map((c) => `<div class="lt-card p-3 mb-2"><b class="lt-ink">${esc(c.name)}</b><small class="d-block">${esc(c.address)}</small><small class="d-block">${esc(c.hours)} · ${c.distanceKm} km · ${amenities(c.amenities)}</small></div>`).join('')}
        <h4 class="h6 fw-bold mt-4">Tests &amp; prices</h4><div class="lt-table-wrap"><table class="lt-table"><tbody>${l.prices.map((p) => `<tr><td>${esc(p.name)}</td><td class="text-end"><b>${money(p.price)}</b> <del class="small lt-muted">${money(p.mrp)}</del></td></tr>`).join('')}</tbody></table></div>
        <h4 class="h6 fw-bold mt-4">Sample report</h4><div class="lt-card p-3 d-flex gap-3 align-items-center">${LT.ui.ILLU.report.replace('<svg', '<svg style="width:80px;height:60px"')}<div class="small">Clear, colour-coded report with reference ranges and a doctor's note. <button type="button" class="lt-linkbtn" onclick="LT.ui.toast('Demo: sample report preview','info')">Preview</button></div></div>
        <h4 class="h6 fw-bold mt-4">Reviews</h4>${l.reviewsList.map((r) => `<div class="border-bottom py-2"><b class="lt-ink">${esc(r.name)}</b> <span class="text-warning">${'★'.repeat(r.rating)}</span><p class="small mb-0">${esc(r.text)}</p></div>`).join('')}
        <h4 class="h6 fw-bold mt-4">Policies</h4><p class="small">${esc(l.cancellationPolicy)}</p>
        <div class="lt-drawer-foot"><b class="lt-ink fs-5">${money(l.quote.total)}</b><button type="button" class="btn lt-btn" data-sel>Select this lab</button></div>`;
      b.querySelector('[data-sel]').onclick = () => { oc.hide(); select(id, 'choose'); };
    } catch (e) { error(b, { text: errMsg(e) }); }
  }

  /* ---------- events ---------- */
  function switchOpt() { LT.store.set({ labOption: 'choose' }); optionA(); paintCompare(); }
  app.addEventListener('click', (e) => {
    const sb = e.target.closest('[data-select]'); if (sb) return select(sb.dataset.select, sb.dataset.method);
    const d = e.target.closest('[data-detail]'); if (d) return detail(d.dataset.detail);
    if (e.target.closest('[data-compare]')) return compareModal();
  });
  app.addEventListener('change', (e) => {
    if (e.target.matches('[data-cmp]')) {
      const id = e.target.dataset.cmp;
      if (e.target.checked && compare.length >= 3) { e.target.checked = false; return toast('You can compare up to 3 labs', 'warning'); }
      compare = e.target.checked ? compare.concat(id) : compare.filter((x) => x !== id); paintCompare();
    }
  });
  switchOpt(opt);
  loadLabs().then(updateBar).catch(() => updateBar());
})();
