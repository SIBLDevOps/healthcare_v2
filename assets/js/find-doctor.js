/* BeyondSure – Find & Book a Doctor (find-doctor.html) */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');
  const plural = (n) => `${n} doctor${n === 1 ? '' : 's'}`;
  const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

  /* ------------------------------------------------------------------
     DATA – shared with doctor-profile.html (see assets/js/doctors-data.js)
     ------------------------------------------------------------------ */
  const { SPECIALTIES, DOCTORS, profileUrl } = window.BS_DATA;
  const FEE_MAX = 2000;

  /* ------------------------------------------------------------------
     STATE + STORAGE
     ------------------------------------------------------------------ */
  const state = { q: '', specs: new Set(), avail: '', maxFee: FEE_MAX, langs: new Set(), exp: 0, sort: 'relevance', view: 'list' };

  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage unavailable */ } }
  };
  let favs = store.get('bs_fav_doctors', []);
  state.view = store.get('bs_fd_view', 'list') === 'grid' ? 'grid' : 'list';

  /* ------------------------------------------------------------------
     DATES
     ------------------------------------------------------------------ */
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = (iso) => (iso ? Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / 86400000) : null);
  const fmtSlot = (iso) => {
    const d = new Date(iso);
    const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    const diff = dayDiff(iso);
    if (diff === 0) return `Today, ${time}`;
    if (diff === 1) return `Tomorrow, ${time}`;
    return `${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
  };

  /* ------------------------------------------------------------------
     BUILD CONTROLS
     ------------------------------------------------------------------ */
  $('#specSelect').insertAdjacentHTML('beforeend', SPECIALTIES.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join(''));

  /* ------------------------------------------------------------------
     THEMED DROPDOWN – shared component (assets/js/dropdown.js)
     ------------------------------------------------------------------ */
  const enhanceSelect = window.BS_enhanceSelect;

  const specDD = enhanceSelect($('#specSelect'), { search: true, searchPlaceholder: 'Search specialty', minWidth: 260 });
  const sortDD = enhanceSelect($('#sortSelect'), { align: 'right', minWidth: 190, anchor: '.fd-sort' });

  $('#specList').innerHTML = SPECIALTIES.map((s) =>
    `<label class="fd-check" data-name="${esc(s.toLowerCase())}"><input type="checkbox" name="spec" value="${esc(s)}"><span class="bys-bx"></span><span class="bys-tx">${esc(s)}</span></label>`
  ).join('') + '<p class="fd-no-match" id="specNoMatch" hidden>No specialization found.</p>';

  // find within specialization list
  $('#specFind').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    let shown = 0;
    $$('#specList .fd-check').forEach((l) => { const ok = !q || l.dataset.name.includes(q); l.hidden = !ok; if (ok) shown++; });
    $('#specNoMatch').hidden = shown > 0;
  });

  /* Language filter – English + the 22 scheduled Indian languages.
     Searchable by English name or native script; shows how many doctors speak each one. */
  const LANGUAGES = [
    ['English', 'English'], ['Hindi', 'हिन्दी'], ['Marathi', 'मराठी'],
    ['Assamese', 'অসমীয়া'], ['Bengali', 'বাংলা'], ['Bodo', 'बड़ो'], ['Dogri', 'डोगरी'],
    ['Gujarati', 'ગુજરાતી'], ['Kannada', 'ಕನ್ನಡ'], ['Kashmiri', 'كٲشُر'], ['Konkani', 'कोंकणी'],
    ['Maithili', 'मैथिली'], ['Malayalam', 'മലയാളം'], ['Manipuri', 'ꯃꯩꯇꯩꯂꯣꯟ'], ['Nepali', 'नेपाली'],
    ['Odia', 'ଓଡ଼ିଆ'], ['Punjabi', 'ਪੰਜਾਬੀ'], ['Sanskrit', 'संस्कृतम्'], ['Santali', 'ᱥᱟᱱᱛᱟᱲᱤ'],
    ['Sindhi', 'سنڌي'], ['Tamil', 'தமிழ்'], ['Telugu', 'తెలుగు'], ['Urdu', 'اردو']
  ];
  // any language a doctor speaks that is not in the list above is still offered
  DOCTORS.forEach((d) => d.langs.forEach((l) => { if (!LANGUAGES.some(([n]) => n === l)) LANGUAGES.push([l, l]); }));
  const langDocs = (l) => DOCTORS.filter((d) => d.langs.includes(l)).length;

  $('#langList').innerHTML = LANGUAGES.map(([name, native]) => {
    const n = langDocs(name);
    return `<label class="fd-check" data-name="${esc((name + ' ' + native).toLowerCase())}">
      <input type="checkbox" name="lang" value="${esc(name)}"><span class="bys-bx"></span>
      <span class="bys-tx">${esc(name)}${native !== name ? ` <span class="fd-native">${esc(native)}</span>` : ''}</span>
      <span class="fd-cnt${n ? '' : ' bys-zero'}" title="${n} doctor${n === 1 ? '' : 's'}">${n}</span>
    </label>`;
  }).join('') + '<p class="fd-no-match" id="langNoMatch" hidden>No language found.</p>';

  const filterLangList = () => {
    const q = $('#langFind').value.trim().toLowerCase();
    let shown = 0;
    $$('#langList .fd-check').forEach((l) => { const ok = !q || l.dataset.name.includes(q); l.hidden = !ok; if (ok) shown++; });
    $('#langNoMatch').hidden = shown > 0;
  };
  $('#langFind').addEventListener('input', filterLangList);
  // Enter in the search box selects the first matching language
  $('#langFind').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const first = $$('#langList .fd-check').find((l) => !l.hidden);
    if (first) { const i = first.querySelector('input'); i.checked = !i.checked; i.dispatchEvent(new Event('change', { bubbles: true })); }
  });

  /* ------------------------------------------------------------------
     FILTER / SORT
     ------------------------------------------------------------------ */
  const matches = (d) => {
    if (state.specs.size && !state.specs.has(d.specialty)) return false;
    if (d.fee > state.maxFee) return false;
    if (state.langs.size && ![...state.langs].some((l) => d.langs.includes(l))) return false;
    if (d.exp < state.exp) return false;
    if (state.avail === 'today' && dayDiff(d.nextSlot) !== 0) return false;
    if (state.avail === 'tomorrow' && dayDiff(d.nextSlot) !== 1) return false;
    if (state.q) {
      const q = state.q.toLowerCase();
      if (!(d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q))) return false;
    }
    return true;
  };

  const slotTime = (d) => (d.nextSlot ? new Date(d.nextSlot).getTime() : Infinity);
  const sorters = {
    relevance: (a, b) => (slotTime(a) === Infinity) - (slotTime(b) === Infinity) || a.name.localeCompare(b.name),
    available: (a, b) => slotTime(a) - slotTime(b),
    'fee-asc': (a, b) => a.fee - b.fee,
    'fee-desc': (a, b) => b.fee - a.fee,
    experience: (a, b) => b.exp - a.exp || a.name.localeCompare(b.name)
  };

  /* ------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------ */
  const avatar = (d) => `<a class="fd-avatar ${d.color}" href="${profileUrl(d)}" aria-label="${esc(d.name)} profile">${esc(d.initials)}<span class="bys-tick" title="Verified"><i class="bi bi-check-lg"></i></span></a>`;

  const card = (d, i) => {
    const fav = favs.includes(d.id);
    const slot = d.nextSlot
      ? `<div class="fd-slot bys-ok"><i class="bi bi-calendar2-check"></i> ${esc(fmtSlot(d.nextSlot))}</div>`
      : `<div class="fd-slot bys-none"><i class="bi bi-calendar2-x"></i> No open slots right now</div>`;
    const cta = d.nextSlot
      ? `<a class="bys-btn-brand" href="${profileUrl(d)}"><i class="bi bi-camera-video"></i> Book Video Consult</a>`
      : `<a class="bys-btn-brand-outline" href="${profileUrl(d)}">Check Availability</a>`;
    return `
      <article class="fd-card" style="animation-delay:${i * 80}ms">
        <div class="fd-c-main">
          ${avatar(d)}
          <div class="fd-info">
            <div class="fd-name-row">
              <h3><a href="${profileUrl(d)}">${esc(d.name)}</a></h3>
              <span class="fd-verified"><i class="bi bi-patch-check-fill"></i> Verified</span>
            </div>
            <p class="fd-spec-line">${esc(d.specialty)} <span>· ${esc(d.degree)}</span></p>
            <ul class="fd-facts">
              <li><i class="bi bi-briefcase"></i>${d.exp} yrs experience</li>
              <li><i class="bi bi-translate"></i>${esc(d.langs.join(', '))}</li>
              <li><i class="bi bi-camera-video"></i>Video consultation</li>
            </ul>
            ${slot}
          </div>
        </div>
        <div class="fd-c-side">
          <div class="fd-price"><small>Consultation fee</small><strong>${d.feeFrom ? '<em>from</em> ' : ''}${inr(d.fee)}</strong></div>
          ${cta}
        </div>
        <button type="button" class="fd-fav" data-fav="${d.id}" aria-pressed="${fav}" aria-label="${fav ? 'Remove from' : 'Save to'} favourites: ${esc(d.name)}"><i class="bi bi-heart"></i></button>
      </article>`;
  };

  const tagList = () => {
    const t = [];
    if (state.q) t.push(['q', `“${state.q}”`]);
    state.specs.forEach((s) => t.push(['spec:' + s, s]));
    if (state.avail) t.push(['avail', state.avail === 'today' ? 'Available today' : 'Available tomorrow']);
    if (state.maxFee < FEE_MAX) t.push(['fee', 'Up to ' + inr(state.maxFee)]);
    state.langs.forEach((l) => t.push(['lang:' + l, l]));
    if (state.exp) t.push(['exp', `${state.exp}+ yrs exp`]);
    return t;
  };

  // below 992px (tablet + mobile) cards always use the stacked "grid" card layout;
  // the saved list/grid choice applies on desktop only (the toggle is hidden below 992px)
  const narrowMq = window.matchMedia('(max-width: 991.98px)');
  const applyView = () => { $('#doctorList').dataset.view = narrowMq.matches ? 'grid' : state.view; };
  narrowMq.addEventListener('change', applyView);

  const render = () => {
    const list = DOCTORS.filter(matches).sort(sorters[state.sort]);
    const n = list.length;

    const listEl = $('#doctorList');
    applyView();
    listEl.innerHTML = list.map(card).join('');
    $('#emptyState').hidden = n > 0;

    $('#resultCount').textContent = `${plural(n)} found`;
    $('#resultSub').textContent = state.specs.size ? [...state.specs].join(', ') : 'Showing all specialties';
    $('#sheetCount').textContent = plural(n);

    const tags = tagList();
    $('#activeTags').innerHTML = tags.length
      ? tags.map(([k, label]) => `<span class="fd-tag">${esc(label)}<button type="button" data-remove="${esc(k)}" aria-label="Remove ${esc(label)}"><i class="bi bi-x-lg"></i></button></span>`).join('') +
        '<button type="button" class="fd-reset" data-reset>Clear all</button>'
      : '';

    const count = tags.filter(([k]) => k !== 'q').length;
    $('#filterBadge').textContent = count;
    $('#filterBadge').hidden = count === 0;
    $('#specCount').textContent = state.specs.size;
    $('#specCount').hidden = state.specs.size === 0;
    $('#langCount').textContent = state.langs.size;
    $('#langCount').hidden = state.langs.size === 0;

    $$('.fd-view button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.view === state.view));
  };

  /* ------------------------------------------------------------------
     STATE <-> CONTROLS
     ------------------------------------------------------------------ */
  const syncUrl = () => {
    const url = new URL(window.location.href);
    if (state.specs.size === 1) url.searchParams.set('specialty', slug([...state.specs][0]));
    else url.searchParams.delete('specialty');
    try { history.replaceState(null, '', url); } catch (e) { /* ignore */ }
  };

  const setFeeUi = () => {
    const r = $('#feeRange');
    r.value = state.maxFee;
    const pct = ((state.maxFee - r.min) / (r.max - r.min)) * 100;
    r.style.setProperty('--pct', pct + '%');
    $('#feeOut').textContent = inr(state.maxFee);
  };

  const setSpecs = (arr) => {
    state.specs = new Set(arr);
    $$('input[name="spec"]').forEach((i) => { i.checked = state.specs.has(i.value); });
    $('#specSelect').value = state.specs.size === 1 ? [...state.specs][0] : '';
    specDD.refresh();
    syncUrl();
  };

  const resetAll = () => {
    state.q = ''; state.avail = ''; state.maxFee = FEE_MAX; state.langs = new Set(); state.exp = 0;
    $('#qInput').value = '';
    $$('input[name="avail"]').forEach((i) => { i.checked = i.value === ''; });
    $$('input[name="lang"]').forEach((i) => { i.checked = false; });
    $('#langFind').value = ''; filterLangList();
    $$('input[name="exp"]').forEach((i) => { i.checked = i.value === '0'; });
    setFeeUi();
    setSpecs([]);
    render();
  };

  // filter panel changes
  $('#filterForm').addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'spec') setSpecs($$('input[name="spec"]:checked').map((i) => i.value));
    else if (t.name === 'avail') state.avail = t.value;
    else if (t.name === 'lang') state.langs = new Set($$('input[name="lang"]:checked').map((i) => i.value));
    else if (t.name === 'exp') state.exp = Number(t.value);
    else return;
    render();
  });

  $('#feeRange').addEventListener('input', (e) => { state.maxFee = Number(e.target.value); setFeeUi(); render(); });

  // hero search
  const qInput = $('#qInput');
  let qt;
  qInput.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(() => { state.q = qInput.value.trim(); render(); }, 200); });
  $('#specSelect').addEventListener('change', (e) => { setSpecs(e.target.value ? [e.target.value] : []); render(); });
  $('#heroSearch').addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = qInput.value.trim();
    render();
    $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // sort + view
  $('#sortSelect').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  $$('.fd-view button').forEach((b) => b.addEventListener('click', () => { state.view = b.dataset.view; store.set('bs_fd_view', state.view); render(); }));

  // tags + resets (delegated, buttons appear in several places)
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-reset]')) { resetAll(); return; }
    const rm = e.target.closest('[data-remove]');
    if (!rm) return;
    const k = rm.dataset.remove;
    if (k === 'q') { state.q = ''; qInput.value = ''; }
    else if (k.startsWith('spec:')) { const s = k.slice(5); setSpecs([...state.specs].filter((x) => x !== s)); }
    else if (k === 'avail') { state.avail = ''; $$('input[name="avail"]').forEach((i) => { i.checked = i.value === ''; }); }
    else if (k === 'fee') { state.maxFee = FEE_MAX; setFeeUi(); }
    else if (k.startsWith('lang:')) { const l = k.slice(5); state.langs.delete(l); const i = $(`input[name="lang"][value="${CSS.escape(l)}"]`); if (i) i.checked = false; }
    else if (k === 'exp') { state.exp = 0; $$('input[name="exp"]').forEach((i) => { i.checked = i.value === '0'; }); }
    render();
  });

  // favourites
  $('#doctorList').addEventListener('click', (e) => {
    const b = e.target.closest('.fd-fav');
    if (!b) return;
    const id = b.dataset.fav;
    favs = favs.includes(id) ? favs.filter((f) => f !== id) : favs.concat(id);
    store.set('bs_fav_doctors', favs);
    const on = favs.includes(id);
    b.setAttribute('aria-pressed', on);
    b.setAttribute('aria-label', b.getAttribute('aria-label').replace(/^(Remove from|Save to)/, on ? 'Remove from' : 'Save to'));
  });

  /* ------------------------------------------------------------------
     INIT (supports find-doctor.html?specialty=ent-specialist)
     ------------------------------------------------------------------ */
  const param = new URLSearchParams(window.location.search).get('specialty');
  const fromParam = param ? SPECIALTIES.find((s) => slug(s) === param.toLowerCase()) : null;
  setFeeUi();
  setSpecs(fromParam ? [fromParam] : []);
  render();

  /* ------------------------------------------------------------------
     SHARED SITE BEHAVIOUR
     ------------------------------------------------------------------ */
  $$('[data-marquee]').forEach((track) => {
    const once = track.dataset.marquee.split('|').map((w) => `<span>${esc(w)}<b>✱</b></span>`).join('');
    track.innerHTML = once + once + once + once;
  });

  if (window.AOS) {
    AOS.init({ duration: 750, easing: 'ease-out-cubic', once: true, offset: 40,
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches });
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
})();
