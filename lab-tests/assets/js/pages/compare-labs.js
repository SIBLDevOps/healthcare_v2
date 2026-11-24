/* Page: compare-labs.html – PHASE 11 (new flow) Compare labs = the "Lab" step.
   Reached from the cart ("Continue" / "Change lab"), the step bar, or the "Compare labs" toast after picking a lab.
   Top    : the lab the user selected (or our best match): "Tests & prices" drop-down (open / close, like an
            FAQ) with every test, who it is for (member names) and its price, then a footer row: total + Select & Continue.
   Below  : the same tests at the other labs – "All 3 tests" / "2 of 3 tests" cards, each with its own
            test drop-down and "Select & Continue". A partial lab asks first (popup: Cancel stays here,
            Continue removes the missing tests). Next: location.html -> slot -> summary & pay. */
(function () {
  const { esc, money, skeleton, empty, error, labLogo, rating, errMsg, avatar } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'labtests', stepper: 'lab', title: 'Compare labs', crumbs: [['Lab Tests', 'index.html'], ['Lab cart', 'cart.html'], ['Compare labs', '']] });
  if (!LT.guards.require(['location', 'cart', 'members'])) return;
  const s0 = LT.store.get(), centre = s0.mode === 'centre';
  const first = (n) => String(n || '').split(' ')[0];
  const wide = () => window.matchMedia('(min-width: 992px)').matches;
  let data = null, cur = null, sort = 'price', filters = {};

  const nTests = s0.cart.length; // distinct tests / packages (each can be for several members)
  app.innerHTML = `<div class="lt-container lt-cmp">
      <div class="lt-page-head"><h1>Compare lab prices</h1><p>Your selected lab first, then the same tests at other labs. Open a list to see every test, who it is for and its price.</p>
        <div class="lt-ctxchips"><span class="lt-pill"><i class="bi bi-geo-alt-fill text-primary"></i>${esc(s0.location.area || s0.location.city)} ${esc(s0.location.pincode)}</span><span class="lt-pill"><i class="bi bi-${centre ? 'hospital' : 'house-heart'} text-primary"></i>${centre ? 'Lab centre visit' : 'Home collection'}</span><span class="lt-pill"><i class="bi bi-people text-primary"></i>${s0.selectedMemberIds.length} member${s0.selectedMemberIds.length > 1 ? 's' : ''} · ${nTests} test${nTests > 1 ? 's' : ''}</span>
          <a class="lt-pill lt-pill-link" href="${url('search.html')}"><i class="bi bi-plus-lg text-primary"></i>Add more tests</a><a class="lt-pill lt-pill-link" href="${url('cart.html')}"><i class="bi bi-pencil text-primary"></i>Edit tests</a></div></div>
      <section class="lt-cmp-sec" data-current aria-label="Your selected lab"></section>
      <section class="lt-cmp-sec" aria-labelledby="cmpOthH" data-others>
        <div class="lt-cmp-bar"><h2 id="cmpOthH">Compare with other labs <span class="lt-cmp-n" data-n></span></h2>
          <div class="lt-cmp-tools">
            <label class="visually-hidden" for="cmpSort">Sort labs</label>
            <select id="cmpSort" class="form-select form-select-sm"><option value="price">Price: low to high</option><option value="best">Best match</option><option value="tests">Most tests available</option><option value="fastest">Fastest report</option><option value="rating">Top rated</option>${centre ? '<option value="nearest">Nearest</option>' : ''}</select>
            <div class="lt-chiprow" role="group" aria-label="Filters">${[['all', 'All tests available'], ['nabl', 'NABL / CAP'], ['tat24', 'Report within 24 h'], !centre ? ['free', 'Free collection'] : null].filter(Boolean).map(([k, l]) => `<button type="button" class="lt-chip" data-filter="${k}" aria-pressed="false">${l}</button>`).join('')}</div>
          </div></div>
        <div class="lt-cmp-grid" data-list></div>
      </section>
    </div>`;
  const $ = (q) => app.querySelector(q);

  /* ---------- helpers ---------- */
  const full = (l) => l.offeredCount === l.totalCount;
  const cov = (l) => (full(l) ? `<span class="lt-cmp-cov is-full"><i class="bi bi-check2-circle" aria-hidden="true"></i>All ${l.totalCount} test${l.totalCount > 1 ? 's' : ''}</span>` : `<span class="lt-cmp-cov is-part"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i>${l.offeredCount} of ${l.totalCount} tests</span>`);
  const badges = (l) => `<span class="lt-badges">${l.badges.map((b) => `<span class="${b === 'Flagship' ? 'is-flag' : ''}">${esc(b)}</span>`).join('')}</span>`;
  /* who gets the test: avatar + first name chips */
  const who = (i) => (i.members && i.members.length ? `<span class="lt-cmp-mems" aria-label="For ${i.members.map((m) => esc(m.name)).join(', ')}">${i.members.map((m) => `<span class="lt-cmp-mem">${avatar(m.name, LT.members.color(m.id), 'sm')}${esc(first(m.name))}</span>`).join('')}</span>` : '');
  /* one test row inside a drop-down */
  const row = (i) => `<li class="lt-cmp-row ${i.offered ? '' : 'is-na'}">
      <span class="lt-cmp-row-ico" aria-hidden="true"><i class="bi bi-${i.offered ? 'check-circle-fill' : 'x-circle-fill'}"></i></span>
      <div class="lt-cmp-row-main"><b>${esc(i.name)}</b>${who(i)}</div>
      <div class="lt-cmp-row-price">${i.offered
        ? `<b>${money(i.total)}</b>${i.persons > 1 ? `<small>${money(i.price)} × ${i.persons}</small>` : i.mrp > i.price ? `<del>${money(i.mrp)}</del>` : ''}`
        : '<em>Not available</em>'}</div></li>`;
  /* the FAQ-style open / close test list */
  const memberNames = () => data.members.map((m) => esc(first(m.name))).join(', ');
  function testsDrop(l, o) {
    const miss = l.items.filter((i) => !i.offered);
    const sub = full(l)
      ? `${l.totalCount} test${l.totalCount > 1 ? 's' : ''}${data.members.length ? ' · for ' + memberNames() : ''}`
      : `<span class="text-danger">${miss.map((i) => esc(i.short || i.name)).join(', ')} not available</span>`;
    return `<details class="lt-acc ${o.cls || ''}" ${o.open ? 'open' : ''}>
      <summary class="lt-acc-sum"><span class="lt-acc-ico" aria-hidden="true"><i class="bi bi-list-check"></i></span>
        <span class="lt-acc-txt"><b>${o.title}</b><small>${sub}</small></span>
        ${o.amount != null ? `<span class="lt-acc-amt">${money(o.amount)}</span>` : ''}
        <span class="lt-acc-chev" aria-hidden="true"><i class="bi bi-chevron-down"></i></span></summary>
      <div class="lt-acc-body"><ul class="lt-cmp-rows">${l.items.map(row).join('')}</ul></div></details>`;
  }
  /* price difference with the selected lab (only when both cover the same tests) */
  const diff = (l) => {
    if (!cur || l.id === cur.id || l.offeredCount !== cur.offeredCount) return '';
    const d = l.quote.total - cur.quote.total;
    return d < 0 ? `<span class="lt-cmp-diff is-less"><i class="bi bi-arrow-down" aria-hidden="true"></i>${money(-d)} less than your lab</span>` : d > 0 ? `<span class="lt-cmp-diff"><i class="bi bi-arrow-up" aria-hidden="true"></i>${money(d)} more than your lab</span>` : '<span class="lt-cmp-diff">Same price as your lab</span>';
  };

  /* ---------- selected lab (top) ---------- */
  function paintCurrent() {
    const box = $('[data-current]'), l = cur, mine = !!data.selectedId, q = l.quote;
    const missN = l.totalCount - l.offeredCount;
    box.innerHTML = `<article class="lt-cmp-cur ${full(l) ? '' : 'is-partial'}">
      <span class="lt-cmp-ribbon"><i class="bi bi-${mine ? 'check-circle-fill' : 'award-fill'}" aria-hidden="true"></i>${mine ? 'Your selected lab' : 'Best match for your tests'}</span>
      <p class="lt-cmp-curnote"><i class="bi bi-info-circle" aria-hidden="true"></i> ${mine ? 'The lab you chose when you added your tests. Want a different one? Pick it from the labs below.' : 'No lab chosen yet – this lab does the most of your tests at the best value. Or pick one below.'}</p>
      <div class="lt-cmp-head">${labLogo(l)}<div class="min-w-0"><h2>${esc(l.name)}</h2><div class="lt-cmp-meta">${rating(l.rating, l.reviews)}${badges(l)}</div></div>${cov(l)}</div>
      ${testsDrop(l, { title: 'Tests &amp; prices', amount: q.price, open: wide(), cls: 'is-cur' })}
      ${missN ? `<p class="lt-cmp-warn"><i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i> ${missN} of your tests ${missN > 1 ? 'are' : 'is'} not done at this lab. Pick a lab below that has everything, or continue without ${missN > 1 ? 'them' : 'it'}.</p>` : ''}
      <div class="lt-cmp-foot is-cur"><div class="lt-cmp-total"><small>${full(l) ? 'Total payable' : 'Total for ' + l.offeredCount + ' test' + (l.offeredCount > 1 ? 's' : '')}${!centre && q.collectionCharge ? ' · incl. ' + money(q.collectionCharge) + ' collection' : !centre ? ' · free home collection' : ''}</small>
          <b>${money(q.total)}</b>${q.mrp > q.price ? `<del>${money(q.mrp + q.collectionCharge)}</del><span class="lt-cmp-diff is-less">You save ${money(q.mrp - q.price)}</span>` : ''}
          ${data.members.length ? `<span class="lt-cmp-for"><i class="bi bi-people" aria-hidden="true"></i> For ${memberNames()}</span>` : ''}</div>
        <div class="lt-cmp-go"><button type="button" class="btn lt-btn" data-sel="${l.id}">Select &amp; Continue <i class="bi bi-arrow-right" aria-hidden="true"></i></button>
          <small class="lt-cmp-next">Next: ${centre ? 'confirm your lab centre' : 'collection address'}, then date &amp; time</small></div></div>
    </article>`;
  }

  /* ---------- other labs ---------- */
  function paintList() {
    const box = $('[data-list]');
    let list = data.labs.filter((l) => l.id !== cur.id);
    if (filters.all) list = list.filter(full);
    if (filters.nabl) list = list.filter((l) => l.accredited);
    if (filters.tat24) list = list.filter((l) => l.quote.tatHours <= 24);
    if (filters.free) list = list.filter((l) => !l.quote.collectionCharge);
    const by = {
      best: (a, b) => (b.offeredCount - a.offeredCount) || (b.score - a.score),
      price: (a, b) => (b.offeredCount === a.offeredCount ? a.quote.total - b.quote.total : b.offeredCount - a.offeredCount),
      tests: (a, b) => (b.offeredCount - a.offeredCount) || (a.quote.total - b.quote.total),
      fastest: (a, b) => a.quote.tatHours - b.quote.tatHours, rating: (a, b) => b.rating - a.rating, nearest: (a, b) => a.distanceKm - b.distanceKm
    };
    list.sort(by[sort] || by.price);
    $('[data-n]').textContent = '(' + list.length + ')';
    if (!list.length) {
      return empty(box, data.labs.length > 1
        ? { icon: 'lab', title: 'No labs match these filters', text: 'Try removing a filter.', actions: [{ label: 'Clear filters', onClick: () => { filters = {}; app.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', 'false')); paintList(); } }] }
        : { icon: 'lab', title: 'No other lab near you does these tests', text: 'Your selected lab is the only partner lab for these tests here.' });
    }
    box.innerHTML = list.map((l) => `<article class="lt-cmp-card ${full(l) ? '' : 'is-partial'}" id="cmp-${l.id}">
        <div class="lt-cmp-head">${labLogo(l, 'sm')}<div class="min-w-0"><h3>${esc(l.name)}</h3><div class="lt-cmp-meta">${rating(l.rating, l.reviews)}${badges(l)}</div></div>${cov(l)}</div>
        ${testsDrop(l, { title: full(l) ? 'Tests &amp; prices' : l.offeredCount + ' of ' + l.totalCount + ' tests available', open: false })}
        <div class="lt-cmp-foot"><div class="lt-cmp-total"><small>${full(l) ? 'Total payable' : 'Total for ' + l.offeredCount + ' test' + (l.offeredCount > 1 ? 's' : '')}</small>
            <b>${money(l.quote.total)}</b>${l.quote.mrp > l.quote.price ? `<del>${money(l.quote.mrp + l.quote.collectionCharge)}</del>` : ''}${diff(l)}</div>
          <button type="button" class="btn ${full(l) ? 'lt-btn' : 'lt-btn-outline'}" data-sel="${l.id}">Select &amp; Continue</button></div>
      </article>`).join('');
  }

  /* ---------- load ---------- */
  async function load() {
    skeleton($('[data-current]'), 'block', 1); skeleton($('[data-list]'), 'block', 2);
    try { data = await LT.api.compareSelection(); }
    catch (e) { return error($('[data-current]'), { text: errMsg(e), onRetry: load }); }
    if (!data.labs.length) {
      $('[data-list]').innerHTML = '';
      $('[data-others]').hidden = true;
      return empty($('[data-current]'), {
        icon: 'lab', title: 'No lab near you does these tests', text: 'No partner lab near ' + esc(s0.location.pincode) + ' can do these tests in ' + (centre ? 'a centre visit' : 'home collection') + '. Try changing tests, mode or location.',
        actions: [{ label: 'Change tests', href: url('cart.html') }, { label: 'Change mode', onClick: () => LT.layout.switchMode() }, { label: 'Change location', href: url('index.html?setup=location') }]
      });
    }
    /* top: the lab chosen in the side-bar; else the best match (most tests, then best score) */
    cur = data.labs.find((l) => l.id === data.selectedId) || data.labs.slice().sort((a, b) => (b.offeredCount - a.offeredCount) || (b.score - a.score))[0];
    paintCurrent(); paintList();
  }

  /* ---------- events ---------- */
  $('#cmpSort').onchange = (e) => { sort = e.target.value; paintList(); };
  app.addEventListener('click', async (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) { filters[f.dataset.filter] = !filters[f.dataset.filter]; f.setAttribute('aria-pressed', filters[f.dataset.filter]); return paintList(); }
    const b = e.target.closest('[data-sel]');
    if (b) {
      const l = data.labs.find((x) => x.id === b.dataset.sel); if (!l) return;
      b.disabled = true;
      const went = await LT.labPicker.confirmLab(l); // partial popup: Cancel stays on this page
      if (!went) b.disabled = false;
    }
  });
  load();
})();
