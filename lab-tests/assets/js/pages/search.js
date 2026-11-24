/* Page: search.html – PHASE 7 search & select
   Left: filters (desktop) / bottom sheet (mobile). Center: results (Tests | Packages tabs).
   Right: selected tests panel (desktop) / sticky cart bar (mobile). Reads ?q= and ?category=. */
(function () {
  const { esc, money, debounce, skeleton, empty, error, testCard, packageCard, errMsg, param, toast } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'labtests', crumbs: [['Lab Tests', 'index.html'], ['Search tests', '']], showCartBar: true });
  if (!LT.guards.require(['location'])) return;
  document.body.classList.add('lt-has-selpanel');

  const st = { q: param('q') || '', cats: param('category') ? [param('category')] : [], sort: 'popularity', filters: { fasting: 'any', tat: 'any', priceMax: 2500, availability: 'any' }, tab: param('tab') === 'packages' ? 'packages' : 'tests', page: 1 };
  const s0 = LT.store.get();

  app.innerHTML = `<div class="lt-container">
    <div class="lt-page-head d-flex flex-wrap justify-content-between align-items-end gap-3"><div><h1>Search &amp; select tests</h1><p>Showing prices for <b>${esc(s0.location.area || s0.location.city)} ${esc(s0.location.pincode)}</b> · ${s0.mode === 'centre' ? 'Lab centre visit' : 'Home collection'}</p></div>
      <div class="lt-ministep"><span class="is-current"><b>1</b>Add tests</span><i class="bi bi-chevron-right"></i><span><b>2</b>Review cart</span><i class="bi bi-chevron-right"></i><span><b>3</b>Book</span></div></div>
    <div class="position-relative mb-3"><form class="lt-searchbox" role="search" data-form style="box-shadow:var(--lt-shadow-sm)"><i class="bi bi-search" aria-hidden="true"></i><label class="visually-hidden" for="ltSq">Search tests</label>
      <input id="ltSq" type="search" value="${esc(st.q)}" placeholder="Search tests, e.g. blood sugar, thyroid, vitamin" autocomplete="off" aria-controls="ltSs"><button class="btn lt-btn" type="submit">Search</button></form>
      <div class="lt-suggest" id="ltSs" hidden></div></div>
    <div class="lt-chiprow mb-3" data-chips role="group" aria-label="Categories"></div>
    <div class="row g-4">
      <div class="col-lg-3">
        <div class="offcanvas-lg offcanvas-bottom lt-filter-sheet" tabindex="-1" id="ltFilters" aria-labelledby="ltFiltersH">
          <div class="offcanvas-header d-lg-none"><h2 class="h5 mb-0" id="ltFiltersH">Sort &amp; Filter</h2><button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#ltFilters" aria-label="Close"></button></div>
          <div class="offcanvas-body"><div class="lt-card lt-filter-col w-100" data-filters></div></div>
          <div class="d-flex gap-2 p-3 border-top d-lg-none"><button type="button" class="btn lt-btn-outline flex-fill" data-reset>Reset All</button><button type="button" class="btn lt-btn flex-fill" data-apply>Apply Filters</button></div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div class="lt-tabs mb-0 border-0" role="tablist"><button role="tab" data-tab="tests" aria-selected="${st.tab === 'tests'}">Tests</button><button role="tab" data-tab="packages" aria-selected="${st.tab === 'packages'}">Packages</button></div>
          <div class="d-flex gap-2 align-items-center"><span class="small" data-count aria-live="polite"></span><button type="button" class="btn lt-btn-outline lt-btn-sm d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#ltFilters"><i class="bi bi-sliders"></i> Sort &amp; Filter</button></div>
        </div>
        <div class="lt-grid is-2" data-results style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))"></div>
        <div class="text-center mt-4" data-more hidden><button type="button" class="btn lt-btn-outline">Load more tests</button></div>
      </div>
      <div class="col-lg-3 d-none d-lg-block"><div class="lt-card lt-sel-panel" data-sel></div></div>
    </div></div>`;

  const $ = (q) => app.querySelector(q);

  /* ---------- filters ---------- */
  function filtersHtml() {
    const r = (name, val, label, cur) => `<label><input class="form-check-input" type="radio" name="${name}" value="${val}" ${cur === val ? 'checked' : ''}> ${label}</label>`;
    const f = st.filters;
    return `<h3>Sort by</h3><div class="lt-radio-list">${r('sort', 'popularity', 'Popularity <span class="lt-pill is-primary ms-1">Recommended</span>', st.sort)}${r('sort', 'price_asc', 'Price: low to high', st.sort)}${r('sort', 'price_desc', 'Price: high to low', st.sort)}${r('sort', 'fastest', 'Fastest report', st.sort)}</div>
      <h3>Fasting</h3><div class="lt-radio-list">${r('fasting', 'any', 'Any', f.fasting)}${r('fasting', 'yes', 'Fasting required', f.fasting)}${r('fasting', 'no', 'No fasting', f.fasting)}</div>
      <h3>Report time</h3><div class="lt-radio-list">${r('tat', 'any', 'Any time', f.tat)}${r('tat', '4', 'Within 4 hrs', f.tat)}${r('tat', '12', 'Within 12 hrs', f.tat)}${r('tat', '24', 'Within 24 hrs', f.tat)}</div>
      <h3><label for="ltPrice">Max price: <span data-pv>${money(f.priceMax)}</span></label></h3><input id="ltPrice" type="range" class="form-range" name="priceMax" min="100" max="2500" step="50" value="${f.priceMax}">
      <div class="d-flex justify-content-between small"><span>₹100</span><span>₹2,500</span></div>
      <h3>Availability</h3><div class="lt-radio-list">${r('availability', 'any', 'All tests', f.availability)}${r('availability', 'home', 'Home collection available', f.availability)}${r('availability', 'centre', 'Centre only', f.availability)}</div>
      <button type="button" class="btn lt-btn-ghost w-100 mt-3 d-none d-lg-flex" data-reset>Reset all filters</button>`;
  }
  const isSheet = () => window.matchMedia('(max-width: 991.98px)').matches;
  function readFilters() {
    const g = (n) => (app.querySelector(`[data-filters] input[name=${n}]:checked`) || {}).value;
    return { sort: g('sort') || 'popularity', filters: { fasting: g('fasting') || 'any', tat: g('tat') || 'any', priceMax: +$('#ltPrice').value, availability: g('availability') || 'any' } };
  }
  $('[data-filters]').innerHTML = filtersHtml();
  /* phones / tablets: the Sort & Filter bottom sheet lives inside the page content, which sits in its own layer
     (.lt-main > * { z-index: 1 }). While the sheet is open that layer is lifted (body.lt-filter-open, lab.css) so the
     sheet shows above the header and the mobile bottom app menu instead of behind them. */
  const sheet = $('#ltFilters');
  sheet.addEventListener('show.bs.offcanvas', () => document.body.classList.add('lt-filter-open'));
  sheet.addEventListener('hidden.bs.offcanvas', () => document.body.classList.remove('lt-filter-open'));
  $('[data-filters]').addEventListener('input', async (e) => {
    if (e.target.name === 'priceMax') $('[data-pv]').textContent = money(e.target.value);
    const f = readFilters();
    if (isSheet()) { const n = await LT.api.countTests({ q: st.q, category: st.cats, filters: f.filters }); app.querySelectorAll('[data-apply]').forEach((b) => { b.textContent = `Apply Filters (${n} Tests)`; }); }
    else { Object.assign(st, f, { page: 1 }); run(); }
  });
  app.addEventListener('click', (e) => {
    if (e.target.closest('[data-reset]')) {
      Object.assign(st, { sort: 'popularity', filters: { fasting: 'any', tat: 'any', priceMax: 2500, availability: 'any' }, page: 1 });
      $('[data-filters]').innerHTML = filtersHtml(); app.querySelectorAll('[data-apply]').forEach((b) => { b.textContent = 'Apply Filters'; }); run();
    }
    if (e.target.closest('[data-apply]')) { Object.assign(st, readFilters(), { page: 1 }); bootstrap.Offcanvas.getOrCreateInstance('#ltFilters').hide(); run(); }
  });

  /* ---------- chips ---------- */
  LT.api.getCategories().then((c) => {
    const chips = [{ key: 'all', label: 'All', icon: 'bi-grid' }].concat(c.chips).concat(c.categories.filter((x) => !c.chips.some((y) => y.key === x.key)).map((x) => ({ key: x.key, label: x.label, icon: x.icon })));
    const paint = () => { $('[data-chips]').innerHTML = chips.map((ch) => `<button type="button" class="lt-chip" data-chip="${ch.key}" aria-pressed="${ch.key === 'all' ? !st.cats.length : st.cats.includes(ch.key)}"><i class="bi ${ch.icon}"></i>${esc(ch.label)}</button>`).join(''); };
    paint();
    $('[data-chips]').onclick = (e) => {
      const b = e.target.closest('[data-chip]'); if (!b) return;
      const k = b.dataset.chip;
      st.cats = k === 'all' ? [] : st.cats.includes(k) ? st.cats.filter((x) => x !== k) : st.cats.concat(k);
      st.page = 1; paint(); run();
    };
  });

  /* ---------- tabs ---------- */
  app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { st.tab = b.dataset.tab; app.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', x === b)); run(); }; });

  /* ---------- results ---------- */
  let seq = 0;
  async function run(append) {
    const my = ++seq, box = $('[data-results]');
    if (!append) skeleton(box, 'card', 4);
    $('[data-more]').hidden = true;
    try {
      if (st.tab === 'packages') {
        const list = await LT.api.getPackages();
        if (my !== seq) return;
        const q = st.q.toLowerCase();
        const items = q ? list.filter((p) => (p.name + p.testsDetail.map((t) => t.name).join(' ')).toLowerCase().includes(q)) : list;
        $('[data-count]').textContent = items.length + ' packages';
        if (!items.length) return empty(box, { icon: 'search', title: `No packages found for “${esc(st.q)}”`, text: 'Try the Tests tab or a different word.', actions: [{ label: 'Clear search', onClick: () => { st.q = ''; $('#ltSq').value = ''; run(); } }] });
        box.innerHTML = items.map((p) => packageCard(p)).join('');
      } else {
        const r = await LT.api.searchTests({ q: st.q, category: st.cats, sort: st.sort, filters: st.filters, page: st.page });
        if (my !== seq) return;
        $('[data-count]').textContent = r.total + ' test' + (r.total === 1 ? '' : 's');
        if (!r.total) return empty(box, { icon: 'search', title: st.q ? `No tests found for “${esc(st.q)}”` : 'No tests match these filters', text: 'Check the spelling, clear filters, or upload your prescription and we will find the tests for you.',
          actions: [{ label: 'Upload prescription', href: url('prescription-upload.html') }, { label: 'Clear filters', onClick: () => { st.q = ''; st.cats = []; $('#ltSq').value = ''; app.querySelector('[data-reset]').click(); app.querySelector('[data-chip="all"]') && app.querySelector('[data-chip="all"]').click(); } }] });
        box.innerHTML = r.items.map((t) => testCard(t)).join('');
        $('[data-more]').hidden = r.page >= r.pages;
      }
      box.removeAttribute('aria-busy');
      LT.layout.syncAddButtons();
    } catch (e) { error(box, { text: errMsg(e), onRetry: () => run() }); }
  }
  $('[data-more] button').onclick = () => { st.page++; run(true); };

  /* ---------- search box: suggestions, recent, trending ---------- */
  const q = $('#ltSq'), sug = $('#ltSs');
  const TRENDING = ['CBC', 'Thyroid', 'Vitamin D', 'HbA1c', 'Lipid Profile'];
  const hl = (t, term) => esc(t).replace(new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
  function idle() {
    const rec = LT.store.get().recentSearches || [];
    sug.innerHTML = (rec.length ? '<div class="lt-suggest-h">Recent searches</div>' + rec.map((r) => `<button type="button" class="lt-suggest-item" data-term="${esc(r)}"><i class="bi bi-clock-history"></i><span>${esc(r)}</span></button>`).join('') : '') +
      '<div class="lt-suggest-h">Trending</div><div class="d-flex flex-wrap gap-2 p-2">' + TRENDING.map((t) => `<button type="button" class="lt-chip" data-term="${t}"><i class="bi bi-graph-up-arrow"></i>${t}</button>`).join('') + '</div>';
    sug.hidden = false;
  }
  const commit = (term) => {
    st.q = term.trim(); q.value = st.q; st.page = 1; sug.hidden = true;
    if (st.q) { const rec = [st.q].concat((LT.store.get().recentSearches || []).filter((x) => x.toLowerCase() !== st.q.toLowerCase())).slice(0, 5); LT.store.set({ recentSearches: rec }); }
    history.replaceState(null, '', 'search.html' + (st.q ? '?q=' + encodeURIComponent(st.q) : ''));
    run();
  };
  q.addEventListener('focus', () => { if (!q.value.trim()) idle(); });
  q.addEventListener('input', debounce(async () => {
    const term = q.value.trim();
    if (term.length < 2) { if (!term) { idle(); commit(''); } return; }
    const r = await LT.api.suggestTests(term);
    sug.innerHTML = [term].concat(r.terms.filter((t) => t !== term.toLowerCase())).map((t) => `<button type="button" class="lt-suggest-item" data-term="${esc(t)}"><i class="bi bi-search"></i><span>${hl(t, term)}</span></button>`).join('') +
      (r.items.length ? '<div class="lt-suggest-h">Tests &amp; packages</div>' + r.items.map((t) => `<a class="lt-suggest-item" href="${url(t.type === 'package' ? 'packages.html?open=' + t.id : 'test-detail.html?id=' + t.id)}"><i class="bi bi-${t.type === 'package' ? 'box2-heart' : 'droplet'}"></i><span>${hl(t.name, term)}</span><small>From ${money(t.fromPrice)}</small></a>`).join('') : '');
    sug.hidden = false;
  }, 250));
  sug.addEventListener('click', (e) => { const b = e.target.closest('[data-term]'); if (b) commit(b.dataset.term); });
  document.addEventListener('click', (e) => { if (!e.target.closest('[data-form]') && !e.target.closest('#ltSs')) sug.hidden = true; });
  $('[data-form]').addEventListener('submit', (e) => { e.preventDefault(); commit(q.value); });

  /* ---------- selected tests panel ---------- */
  async function renderSel() {
    const box = $('[data-sel]');
    const n = LT.cart.count();
    if (!n) { box.innerHTML = `<h2 class="h6 fw-bold">Selected tests</h2><div class="text-center py-3">${LT.ui.ILLU.cart.replace('<svg', '<svg style="width:120px;height:90px"')}<p class="small mb-0">Tap <b>Add</b> on any test to start your booking.</p></div>`; return; }
    try {
      const d = await LT.api.getCartDetails();
      box.innerHTML = `<div class="d-flex justify-content-between align-items-center"><h2 class="h6 fw-bold mb-0">Selected tests (${d.counts.total})</h2><a class="small fw-bold" href="${url('cart.html')}">Edit</a></div>
        <div class="lt-sel-list">${d.items.map((i) => `<div class="lt-sel-item"><span>${esc(i.name)}<small>From ${money(i.fromPrice)}</small></span><button type="button" data-add="${i.id}" data-keep-label="1" aria-label="Remove ${esc(i.name)}"><i class="bi bi-x-lg"></i></button></div>`).join('')}</div>
        <div class="lt-sumtotal"><span>Estimated total</span><b>From ${money(d.estimate)}</b>${d.mrp > d.estimate ? `<small class="text-success">You save ${money(d.mrp - d.estimate)} vs MRP</small>` : ''}</div>
        <a class="btn lt-btn w-100 mt-3" href="${url('cart.html')}">Continue to Review <i class="bi bi-arrow-right"></i></a>`;
    } catch (e) { error(box, { text: errMsg(e), onRetry: renderSel }); }
  }
  LT.store.subscribe(debounce(renderSel, 50));
  renderSel();
  run();
})();
