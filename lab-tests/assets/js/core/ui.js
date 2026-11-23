/* Lab Tests – UI helpers shared by every page.
   LT.ui.toast(msg, type, opts)       LT.ui.confirm({title, body, ok, cancel, danger}) -> Promise<bool>
   LT.ui.modal.open({...})            Bootstrap modal wrapper (bottom sheet on mobile)
   LT.ui.skeleton(el, kind, n)        LT.ui.empty(el, {...})     LT.ui.error(el, {text, onRetry})
   LT.ui.money(n)  LT.ui.date(d)  LT.ui.debounce(fn, ms)  LT.ui.esc(s)  LT.ui.param(k)
   LT.ui.authModal() -> Promise<user> (shared OTP login, OTP = 123456)
   Card renderers: testCard, packageCard, priceBlock, statusChip, reportChip, avatar */
window.LT = window.LT || {};

(function () {
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  const date = (d, o) => new Date(d).toLocaleDateString('en-IN', o || { day: 'numeric', month: 'short', year: 'numeric' });
  const time = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  const debounce = (fn, ms) => { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; };
  const param = (k) => new URLSearchParams(location.search).get(k);
  const hours = (h) => (h >= 24 && h % 24 === 0 ? h / 24 + (h === 24 ? ' day' : ' days') : h + ' hrs');
  const initials = (n) => String(n || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const isMobile = () => window.matchMedia('(max-width: 767.98px)').matches;

  /* ---------- toast ---------- */
  function toast(msg, type, opts) {
    opts = opts || {};
    let wrap = $('#ltToasts');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'ltToasts'; wrap.className = 'lt-toasts'; wrap.setAttribute('aria-live', 'polite'); document.body.appendChild(wrap); }
    const icon = { success: 'check-circle-fill', danger: 'x-octagon-fill', warning: 'exclamation-triangle-fill', info: 'info-circle-fill' }[type || 'success'];
    const el = document.createElement('div');
    el.className = 'lt-toast is-' + (type || 'success');
    el.setAttribute('role', type === 'danger' ? 'alert' : 'status');
    el.innerHTML = `<i class="bi bi-${icon}" aria-hidden="true"></i><span>${esc(msg)}</span>${opts.action ? `<button type="button" class="lt-toast-act">${esc(opts.action)}</button>` : ''}<button type="button" class="lt-toast-x" aria-label="Dismiss"><i class="bi bi-x"></i></button>`;
    wrap.appendChild(el);
    const close = () => { el.classList.add('is-out'); setTimeout(() => el.remove(), 220); };
    el.querySelector('.lt-toast-x').onclick = close;
    if (opts.action) el.querySelector('.lt-toast-act').onclick = () => { opts.onAction && opts.onAction(); close(); };
    setTimeout(close, opts.duration || (opts.action ? 5000 : 3000));
  }

  /* ---------- modal ---------- */
  function openModal(o) {
    const el = document.createElement('div');
    el.className = 'modal fade lt-modal' + (o.sheet === false ? '' : ' lt-sheet');
    el.tabIndex = -1;
    el.setAttribute('aria-modal', 'true'); el.setAttribute('role', 'dialog');
    const tid = 'ltm' + Math.random().toString(36).slice(2, 7);
    el.setAttribute('aria-labelledby', tid);
    el.innerHTML = `<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable ${o.size ? 'modal-' + o.size : ''}"><div class="modal-content">
      ${o.title !== false ? `<div class="modal-header"><div><h2 class="modal-title" id="${tid}">${o.title || ''}</h2>${o.sub ? `<p class="lt-modal-sub">${o.sub}</p>` : ''}</div>${o.static ? '' : '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>'}</div>` : ''}
      <div class="modal-body">${o.body || ''}</div>${o.footer ? `<div class="modal-footer">${o.footer}</div>` : ''}</div></div>`;
    document.body.appendChild(el);
    const m = new bootstrap.Modal(el, { backdrop: o.static ? 'static' : true, keyboard: !o.static });
    el.addEventListener('hidden.bs.modal', () => { o.onClose && o.onClose(); m.dispose(); el.remove(); });
    if (o.onOpen) el.addEventListener('shown.bs.modal', () => o.onOpen(el), { once: true });
    m.show();
    return { el, modal: m, close: () => m.hide(), $: (s) => el.querySelector(s), $$: (s) => [...el.querySelectorAll(s)] };
  }
  function confirm(o) {
    return new Promise((resolve) => {
      let ok = false;
      const md = openModal({
        title: o.title, body: `<div class="lt-confirm">${o.icon ? `<span class="lt-confirm-ico ${o.danger ? 'is-danger' : ''}"><i class="bi bi-${o.icon}"></i></span>` : ''}<div>${o.body || ''}</div></div>`, size: o.size || null,
        footer: `${o.cancel === false ? '' : `<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">${o.cancel || 'Cancel'}</button>`}<button type="button" class="btn ${o.danger ? 'lt-btn-danger' : 'lt-btn'}" data-ok>${o.ok || 'OK'}</button>`,
        onClose: () => resolve(ok), static: o.static
      });
      md.$('[data-ok]').onclick = () => { ok = true; md.close(); };
    });
  }

  /* ---------- states ---------- */
  const SKEL = {
    card: '<div class="lt-skel-card"><div class="lt-skel" style="width:30%;height:18px"></div><div class="lt-skel" style="width:80%;height:20px"></div><div class="lt-skel" style="width:95%"></div><div class="lt-skel" style="width:60%"></div><div class="d-flex justify-content-between mt-3"><div class="lt-skel" style="width:35%;height:28px"></div><div class="lt-skel" style="width:25%;height:38px;border-radius:12px"></div></div></div>',
    row: '<div class="lt-skel-card d-flex gap-3 align-items-center"><div class="lt-skel" style="width:52px;height:52px;border-radius:50%;flex:none"></div><div class="flex-grow-1"><div class="lt-skel" style="width:50%;height:18px"></div><div class="lt-skel" style="width:80%"></div></div></div>',
    tile: '<div class="lt-skel-card text-center"><div class="lt-skel mx-auto" style="width:48px;height:48px;border-radius:14px"></div><div class="lt-skel mx-auto mt-2" style="width:70%"></div></div>',
    block: '<div class="lt-skel-card"><div class="lt-skel" style="width:40%;height:22px"></div><div class="lt-skel" style="height:120px;border-radius:12px"></div></div>'
  };
  function skeleton(el, kind, n, cls) {
    if (!el) return;
    el.innerHTML = Array.from({ length: n || 3 }, () => `<div class="${cls || ''}">${SKEL[kind] || kind}</div>`).join('');
    el.setAttribute('aria-busy', 'true');
  }
  const ILLU = {
    search: '<svg viewBox="0 0 160 120" aria-hidden="true"><ellipse cx="80" cy="108" rx="52" ry="7" fill="#dbe7fd"/><rect x="34" y="20" width="76" height="80" rx="12" fill="#fff" stroke="#c3d6fb" stroke-width="3"/><rect x="46" y="36" width="44" height="6" rx="3" fill="#dbe7fd"/><rect x="46" y="50" width="52" height="6" rx="3" fill="#dbe7fd"/><rect x="46" y="64" width="34" height="6" rx="3" fill="#dbe7fd"/><circle cx="104" cy="70" r="20" fill="#f1f5fe" stroke="#1964ee" stroke-width="5"/><path d="M118 85l16 16" stroke="#1964ee" stroke-width="7" stroke-linecap="round"/></svg>',
    cart: '<svg viewBox="0 0 160 120" aria-hidden="true"><ellipse cx="80" cy="108" rx="52" ry="7" fill="#dbe7fd"/><rect x="58" y="18" width="18" height="70" rx="9" fill="#fff" stroke="#1964ee" stroke-width="3"/><rect x="58" y="58" width="18" height="30" rx="9" fill="#e5484d" opacity=".85"/><rect x="86" y="30" width="18" height="58" rx="9" fill="#fff" stroke="#1964ee" stroke-width="3"/><rect x="86" y="64" width="18" height="24" rx="9" fill="#12a150" opacity=".85"/><rect x="44" y="84" width="74" height="12" rx="6" fill="#1964ee"/></svg>',
    doc: '<svg viewBox="0 0 160 120" aria-hidden="true"><ellipse cx="80" cy="108" rx="52" ry="7" fill="#dbe7fd"/><path d="M48 14h48l18 18v66a8 8 0 01-8 8H48a8 8 0 01-8-8V22a8 8 0 018-8z" fill="#fff" stroke="#c3d6fb" stroke-width="3"/><path d="M96 14v18h18" fill="#dbe7fd"/><text x="54" y="56" font-family="Georgia" font-style="italic" font-size="22" fill="#1964ee">Rx</text><rect x="54" y="66" width="44" height="5" rx="2.5" fill="#dbe7fd"/><rect x="54" y="78" width="32" height="5" rx="2.5" fill="#dbe7fd"/></svg>',
    calendar: '<svg viewBox="0 0 160 120" aria-hidden="true"><ellipse cx="80" cy="108" rx="52" ry="7" fill="#dbe7fd"/><rect x="38" y="22" width="84" height="76" rx="12" fill="#fff" stroke="#c3d6fb" stroke-width="3"/><rect x="38" y="22" width="84" height="20" rx="10" fill="#1964ee"/><g fill="#dbe7fd">' + [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${50 + c * 17}" y="${50 + r * 11}" width="11" height="7" rx="2"/>`).join('')).join('') + '</g><circle cx="118" cy="88" r="16" fill="#12a150"/><path d="M110 88l6 6 10-11" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
    people: '<svg viewBox="0 0 160 120" aria-hidden="true"><ellipse cx="80" cy="108" rx="52" ry="7" fill="#dbe7fd"/><circle cx="62" cy="44" r="16" fill="#c3d6fb"/><path d="M34 98c0-18 12-30 28-30s28 12 28 30z" fill="#c3d6fb"/><circle cx="102" cy="50" r="13" fill="#1964ee"/><path d="M80 98c0-15 10-25 22-25s22 10 22 25z" fill="#1964ee"/></svg>',
    lab: '<svg viewBox="0 0 160 120" aria-hidden="true"><ellipse cx="80" cy="108" rx="52" ry="7" fill="#dbe7fd"/><path d="M66 16h28v8h-4v26l24 42a8 8 0 01-7 12H53a8 8 0 01-7-12l24-42V24h-4z" fill="#fff" stroke="#1964ee" stroke-width="3"/><path d="M58 80h44l9 16H49z" fill="#1964ee" opacity=".25"/><circle cx="74" cy="88" r="4" fill="#1964ee"/><circle cx="88" cy="82" r="3" fill="#1964ee"/></svg>',
    report: '<svg viewBox="0 0 160 120" aria-hidden="true"><ellipse cx="80" cy="108" rx="52" ry="7" fill="#dbe7fd"/><rect x="42" y="14" width="76" height="90" rx="10" fill="#fff" stroke="#c3d6fb" stroke-width="3"/><polyline points="52,70 66,58 78,66 92,44 108,52" stroke="#1964ee" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="52" y="80" width="56" height="5" rx="2.5" fill="#dbe7fd"/><rect x="52" y="28" width="30" height="6" rx="3" fill="#1964ee"/></svg>',
    map: '<svg viewBox="0 0 160 120" aria-hidden="true"><ellipse cx="80" cy="108" rx="52" ry="7" fill="#dbe7fd"/><path d="M30 30l32-10 36 12 32-10v72l-32 10-36-12-32 10z" fill="#fff" stroke="#c3d6fb" stroke-width="3"/><path d="M80 34c-11 0-19 8-19 19 0 14 19 33 19 33s19-19 19-33c0-11-8-19-19-19z" fill="#e5484d"/><circle cx="80" cy="53" r="7" fill="#fff"/></svg>'
  };
  function empty(el, o) {
    if (!el) return;
    el.removeAttribute('aria-busy');
    el.innerHTML = `<div class="lt-empty">${ILLU[o.icon] || ILLU.search}<h3>${esc(o.title)}</h3>${o.text ? `<p>${o.text}</p>` : ''}<div class="lt-empty-acts">${(o.actions || []).map((a, i) =>
      a.href ? `<a class="btn ${i ? 'lt-btn-outline' : 'lt-btn'}" href="${a.href}">${a.label}</a>` : `<button type="button" class="btn ${i ? 'lt-btn-outline' : 'lt-btn'}" data-empty-act="${i}">${a.label}</button>`).join('')}</div></div>`;
    (o.actions || []).forEach((a, i) => { const b = el.querySelector(`[data-empty-act="${i}"]`); if (b && a.onClick) b.onclick = a.onClick; });
  }
  function error(el, o) {
    if (!el) return;
    el.removeAttribute('aria-busy');
    el.innerHTML = `<div class="lt-error" role="alert"><i class="bi bi-wifi-off"></i><div><strong>Couldn't load this</strong><p>${esc(o.text || 'Something went wrong.')}</p></div>${o.onRetry ? '<button type="button" class="btn lt-btn-outline btn-sm">Retry</button>' : ''}</div>`;
    if (o.onRetry) el.querySelector('button').onclick = o.onRetry;
  }
  /* run a promise while a button shows a spinner */
  async function busy(btn, fn) {
    if (!btn) return fn();
    const html = btn.innerHTML; btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span class="ms-2">' + (btn.dataset.busy || 'Please wait…') + '</span>';
    try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = html; }
  }
  const errMsg = (e) => (e && (e.userMessage || e.message)) || 'Something went wrong.';

  /* ---------- small renderers ---------- */
  const CAT = { 'Blood Tests': 'blood', Diabetes: 'diabetes', 'Heart Health': 'blood', Thyroid: 'imaging', Liver: 'metabolism', Kidney: 'bone', Hormones: 'imaging', Vitamins: 'metabolism', Infection: 'blood', Imaging: 'imaging', 'Health Package': 'bone' };
  const tag = (cat) => `<span class="lt-tag" data-c="${CAT[cat] || 'diabetes'}">${esc(cat)}</span>`;
  function priceBlock(price, mrp, opts) {
    opts = opts || {};
    const pct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    return `<div class="lt-price">${opts.from ? '<small class="lt-price-from text-light">From</small>' : ''}<span class="lt-price-now">${money(price)}</span>${pct ? `<del class="lt-price-mrp">${money(mrp)}</del><span class="lt-save">Save ${pct}%</span>` : ''}</div>`;
  }
  const addBtn = (id, opts) => {
    const added = LT.cart && LT.cart.has(id);
    return `<button type="button" class="btn lt-add ${added ? 'is-added' : ''} ${opts && opts.block ? 'w-100' : ''}" data-add="${id}" aria-pressed="${added}">${added ? '<i class="bi bi-check2"></i> Added' : '<i class="bi bi-plus-lg"></i> Add'}</button>`;
  };
  function testCard(t, opts) {
    opts = opts || {};
    const mode = LT.store.get().mode;
    const delivery = t.centreOnly ? '<span class="lt-deliv is-centre"><i class="bi bi-hospital"></i> Centre only</span>' : t.tatHours <= 6 ? '<span class="lt-deliv is-fast"><i class="bi bi-lightning-charge"></i> Express ' + t.tatHours + ' hrs</span>' : '<span class="lt-deliv"><i class="bi bi-house-heart"></i> Home collection</span>';
    return `<article class="lt-tcard ${opts.compact ? 'is-compact' : ''}">
      <div class="lt-tcard-top">${tag(t.category)}${delivery}</div>
      <h3 class="lt-tcard-name"><a href="${LT.layout.url(t.type === 'package' ? 'packages.html?open=' + t.id : 'test-detail.html?id=' + t.id)}">${esc(t.name)}</a></h3>
      <p class="lt-tcard-desc">${esc(t.description)}</p>
      <ul class="lt-meta">
        <li><i class="bi bi-cup-hot"></i>${t.fastingHours ? t.fastingHours + ' hrs fasting' : 'No fasting'}</li>
        <li><i class="bi bi-clock-history"></i>Report in ${hours(t.tatHours)}</li>
        <li><i class="bi bi-list-check"></i>${t.parameters} parameter${t.parameters > 1 ? 's' : ''}</li>
      </ul>
      ${t.centreOnly && mode === 'home' ? `<div class="lt-warnchip"><i class="bi bi-exclamation-triangle"></i> Needs a centre visit. <button type="button" class="lt-linkbtn" data-switch-mode="centre">Switch to Lab Centre</button></div>` : ''}
      <div class="lt-tcard-foot">${priceBlock(t.fromPrice, t.mrp, { from: true })}${addBtn(t.id)}</div>
    </article>`;
  }
  function packageCard(p, opts) {
    opts = opts || {};
    const top = p.testsDetail.slice(0, 3).map((t) => `<li><i class="bi bi-check2-circle"></i>${esc(t.short || t.name)}</li>`).join('');
    return `<article class="lt-pcard">
      <div class="lt-pcard-head"><span class="lt-tag" data-c="bone">${esc(p.lifeLabel)}</span>${p.badge ? `<span class="lt-badge-new">${esc(p.badge)}</span>` : ''}</div>
      <h3 class="lt-pcard-name">${esc(p.name)}</h3>
      <p class="lt-pcard-sub"><i class="bi bi-list-check"></i> ${p.parameters} parameters · ${p.tests.length} tests</p>
      <ul class="lt-pcard-list">${top}</ul>
      <button type="button" class="lt-linkbtn" data-pkg-open="${p.id}">View all ${p.tests.length} tests <i class="bi bi-chevron-right"></i></button>
      <ul class="lt-meta mt-2"><li><i class="bi bi-cup-hot"></i>${p.fastingHours ? p.fastingHours + ' hrs fasting' : 'No fasting'}</li><li><i class="bi bi-clock-history"></i>${hours(p.tatHours)}</li></ul>
      <div class="lt-tcard-foot">${priceBlock(p.fromPrice, p.mrp, { from: true })}${addBtn(p.id)}</div>
    </article>`;
  }
  const STATUS = {
    PENDING_PAYMENT: ['Payment pending', 'muted', 'hourglass'], BOOKED: ['Booked', 'primary', 'bookmark-check'], CONFIRMED: ['Confirmed', 'primary', 'patch-check'],
    TECH_ASSIGNED: ['Technician Assigned', 'info', 'person-badge'], ON_THE_WAY: ['On the way', 'info', 'bicycle'], SAMPLE_COLLECTED: ['Sample Collected', 'warn', 'droplet-half'],
    VISIT_DONE: ['Visit Done', 'warn', 'hospital'], RECEIVED: ['Sample Received', 'warn', 'box-seam'], PROCESSING: ['Processing', 'warn', 'gear'],
    REPORT_READY: ['Report Ready', 'success', 'file-earmark-medical'], COMPLETED: ['Completed', 'success', 'check2-all'], CANCELLED: ['Cancelled', 'danger', 'x-circle'],
    SUBMITTED: ['Submitted', 'primary', 'send-check'], UNDER_REVIEW: ['Under review', 'info', 'hourglass-split'], NEEDS_CLARIFICATION: ['Needs clarification', 'danger', 'question-circle'],
    TESTS_IDENTIFIED: ['Tests identified', 'warn', 'list-check'], USER_CONFIRMED: ['Confirmed by you', 'success', 'person-check'], CONVERTED: ['Booked', 'success', 'calendar-check'],
    REJECTED: ['Rejected', 'danger', 'x-octagon'], EXPIRED: ['Expired', 'muted', 'clock'], NEW: ['New', 'primary', 'bell'],
    pending: ['Pending', 'warn', 'hourglass-split'], approved: ['Approved', 'success', 'patch-check'], rejected: ['Rejected', 'danger', 'x-octagon'], needs_info: ['Needs info', 'info', 'question-circle']
  };
  const statusChip = (s) => { const x = STATUS[s] || [s, 'muted', 'circle']; return `<span class="lt-status is-${x[1]}"><i class="bi bi-${x[2]}" aria-hidden="true"></i>${esc(x[0])}</span>`; };
  const reportChip = (p) => {
    const m = { normal: ['Normal', 'check-circle-fill'], borderline: ['Borderline', 'exclamation-circle-fill'], abnormal: [p.dir === 'low' ? 'Low' : 'High', p.dir === 'low' ? 'arrow-down-circle-fill' : 'arrow-up-circle-fill'] }[p.status] || ['Normal', 'check-circle-fill'];
    return `<span class="lt-rchip is-${p.status}"><i class="bi bi-${m[1]}" aria-hidden="true"></i>${m[0]}${p.status === 'borderline' && p.dir ? ' ' + (p.dir === 'low' ? 'low' : 'high') : ''}</span>`;
  };
  const avatar = (name, color, size) => `<span class="lt-avatar ${size ? 'is-' + size : ''}" style="${color ? '--av:' + color : ''}" aria-hidden="true">${esc(initials(name))}</span>`;
  const labLogo = (l, size) => `<span class="lt-lablogo ${size ? 'is-' + size : ''}" style="--lc:${l.color}" aria-hidden="true">${esc(l.initials)}</span>`;
  const rating = (r, n) => `<span class="lt-rating"><i class="bi bi-star-fill" aria-hidden="true"></i>${r.toFixed(1)}${n != null ? `<small>(${Number(n).toLocaleString('en-IN')})</small>` : ''}</span>`;
  const sourceChips = (sources) => (sources || []).map((s) => `<span class="lt-src is-${s}"><i class="bi bi-${{ prescription: 'file-earmark-medical', manual: 'hand-index', package: 'box2-heart' }[s] || 'dot'}"></i>${{ prescription: 'Prescription', manual: 'Manual', package: 'Package' }[s] || s}</span>`).join('');
  const AMEN = { parking: ['p-circle', 'Parking'], wheelchair: ['person-wheelchair', 'Wheelchair access'], ac: ['snow', 'Air conditioned'], wifi: ['wifi', 'Wi-Fi'], cafe: ['cup-hot', 'Cafe'] };
  const amenities = (list) => `<span class="lt-amen">${(list || []).map((a) => `<i class="bi bi-${(AMEN[a] || ['dot'])[0]}" title="${(AMEN[a] || ['', a])[1]}" aria-label="${(AMEN[a] || ['', a])[1]}"></i>`).join('')}</span>`;

  /* ---------- shared auth modal (mobile -> OTP 123456 -> name for new users) ---------- */
  function authModal(opts) {
    opts = opts || {};
    return new Promise((resolve, reject) => {
      let done = false, timer = null, mobile = '', mode = opts.mode === 'register' ? 'register' : 'login';
      const today = new Date(), maxDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
      const md = openModal({
        title: mode === 'register' ? 'Create your account' : 'Login to continue', sub: opts.reason || 'We use your mobile number to keep your bookings and reports safe.', size: null,
        body: `<div data-step="form">
            <div class="lt-auth-tabs" role="tablist" aria-label="Login or register">
              <button type="button" role="tab" data-tab="login">Login</button><button type="button" role="tab" data-tab="register">Register</button></div>
            <div class="lt-alert is-info lt-auth-new" data-newnote hidden><i class="bi bi-person-plus"></i><div>This number is not registered yet. Add your details to create your account.</div></div>
            <div data-reg hidden>
              <div class="mb-3"><label class="form-label" for="ltAuthName">Full name <span class="req">*</span></label><input id="ltAuthName" class="form-control" placeholder="As on your ID proof" autocomplete="name" maxlength="50"><div class="lt-field-err" data-err="name" hidden></div></div>
              <div class="row g-3 mb-3">
                <div class="col-sm-6"><label class="form-label" for="ltAuthDob">Date of birth <span class="req">*</span></label><input id="ltAuthDob" type="date" class="form-control" max="${maxDob}"><div class="lt-field-err" data-err="dob" hidden></div></div>
                <div class="col-sm-6"><span class="form-label d-block">Gender <span class="req">*</span></span><div class="lt-segpills" role="radiogroup" aria-label="Gender">${[['female', 'Female'], ['male', 'Male'], ['other', 'Other']].map(([k, l]) => `<input type="radio" name="ltAuthG" id="ltAuthG${k}" value="${k}"><label for="ltAuthG${k}">${l}</label>`).join('')}</div><div class="lt-field-err" data-err="g" hidden></div></div>
              </div>
            </div>
            <label class="form-label" for="ltAuthMob">Mobile number <span class="req" data-reg hidden>*</span></label>
            <div class="input-group lt-input-group"><span class="input-group-text">+91</span><input id="ltAuthMob" class="form-control" inputmode="numeric" maxlength="10" placeholder="10-digit mobile number" autocomplete="tel-national"></div>
            <div class="lt-field-err" data-err="mob" hidden></div>
            <div data-reg hidden>
              <div class="mt-3"><label class="form-label" for="ltAuthEmail">Email <span class="lt-badge-opt">Optional</span></label><input id="ltAuthEmail" type="email" class="form-control" placeholder="For reports and invoices" autocomplete="email"><div class="lt-field-err" data-err="email" hidden></div></div>
              <div class="form-check mt-3"><input class="form-check-input" type="checkbox" id="ltAuthConsent"><label class="form-check-label small" for="ltAuthConsent">I agree to the Terms and allow BeyondSure to share my samples and reports with the partner lab.</label></div>
              <div class="lt-field-err" data-err="ok" hidden></div>
            </div>
            <p class="lt-hint mt-2" data-demohint><i class="bi bi-info-circle"></i> Demo account: <button type="button" class="lt-linkbtn" data-fill>9876543210</button> · OTP is always <b>123456</b></p>
            <button type="button" class="btn lt-btn w-100 mt-3" data-send data-busy="Sending OTP…">Get OTP</button>
            <p class="lt-auth-switch" data-switchtxt></p>
          </div>
          <div data-step="otp" hidden>
            <p class="mb-2">Enter the 6-digit code sent to <b data-mob></b> <button type="button" class="lt-linkbtn" data-edit>Change</button></p>
            <label class="visually-hidden" for="ltAuthOtp">OTP</label>
            <input id="ltAuthOtp" class="form-control lt-otp" inputmode="numeric" maxlength="6" placeholder="••••••" autocomplete="one-time-code">
            <div class="lt-field-err" data-err="otp" hidden></div>
            <div class="d-flex justify-content-between align-items-center mt-2 small"><span data-timer class="text-muted"></span><button type="button" class="lt-linkbtn" data-resend disabled>Resend OTP</button></div>
            <button type="button" class="btn lt-btn w-100 mt-3" data-verify data-busy="Verifying…">Verify &amp; Continue</button>
          </div>`,
        onClose: () => { clearInterval(timer); if (!done) reject(new Error('cancelled')); },
        onOpen: (el) => { if (opts.mobile) el.querySelector('#ltAuthMob').value = opts.mobile; el.querySelector(mode === 'register' ? '#ltAuthName' : '#ltAuthMob').focus(); }
      });
      md.el.classList.add('lt-auth-modal');
      const showErr = (k, msg) => { const e = md.$(`[data-err="${k}"]`); if (!e) return !msg; e.textContent = msg || ''; e.hidden = !msg; return !msg; };
      const setMode = (m, isNew) => {
        mode = m;
        md.$$('[data-tab]').forEach((b) => { const on = b.dataset.tab === m; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
        md.$$('[data-reg]').forEach((x) => { x.hidden = m !== 'register'; });
        md.$('[data-newnote]').hidden = !isNew;
        md.$('[data-demohint]').hidden = m === 'register';
        md.$('.modal-title').textContent = m === 'register' ? 'Create your account' : 'Login to continue';
        md.$('[data-send]').textContent = m === 'register' ? 'Register & Get OTP' : 'Get OTP';
        md.$('[data-switchtxt]').innerHTML = m === 'register' ? 'Already have an account? <button type="button" class="lt-linkbtn" data-tabto="login">Log in</button>' : 'New to BeyondSure? <button type="button" class="lt-linkbtn" data-tabto="register">Create an account</button>';
        ['name', 'dob', 'g', 'email', 'ok', 'mob'].forEach((k) => showErr(k));
      };
      setMode(mode);
      md.el.addEventListener('click', (e) => {
        const t = e.target.closest('[data-tab], [data-tabto]'); if (!t) return;
        setMode(t.dataset.tab || t.dataset.tabto);
        md.$(mode === 'register' ? '#ltAuthName' : '#ltAuthMob').focus();
      });
      const startTimer = () => {
        let left = 30; const btn = md.$('[data-resend]'), lab = md.$('[data-timer]');
        btn.disabled = true; clearInterval(timer);
        const tick = () => { lab.textContent = left > 0 ? 'Resend in 00:' + String(left).padStart(2, '0') : ''; if (left-- <= 0) { clearInterval(timer); btn.disabled = false; } };
        tick(); timer = setInterval(tick, 1000);
      };
      /* registration details -> profile for the "Self" member */
      const profile = () => {
        const name = md.$('#ltAuthName').value.trim(), dob = md.$('#ltAuthDob').value, g = (md.$('input[name=ltAuthG]:checked') || {}).value, email = md.$('#ltAuthEmail').value.trim();
        const age = dob ? LT.matching.age(dob) : null;
        let ok = true;
        ok = showErr('name', !name ? 'Enter your full name.' : !/^[A-Za-z][A-Za-z .']{1,48}$/.test(name) ? 'Use letters only (2-50 characters).' : '') && ok;
        ok = showErr('dob', !dob ? 'Enter your date of birth.' : new Date(dob) > new Date() ? 'Date of birth cannot be in the future.' : age < 18 ? 'You must be 18 or older. Add children as family members later.' : age > 110 ? 'Please check the date of birth.' : '') && ok;
        ok = showErr('g', !g ? 'Choose your gender.' : '') && ok;
        ok = showErr('email', email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email address.' : '') && ok;
        ok = showErr('ok', !md.$('#ltAuthConsent').checked ? 'Please accept the terms to continue.' : '') && ok;
        return ok ? { name, dob, gender: g, email } : null;
      };
      md.$('[data-fill]').onclick = () => { md.$('#ltAuthMob').value = '9876543210'; };
      md.$('#ltAuthMob').addEventListener('keydown', (e) => { if (e.key === 'Enter') md.$('[data-send]').click(); });
      md.$('#ltAuthOtp').addEventListener('keydown', (e) => { if (e.key === 'Enter') md.$('[data-verify]').click(); });
      md.$('[data-send]').onclick = async (e) => {
        mobile = md.$('#ltAuthMob').value.replace(/\D/g, '');
        const p = mode === 'register' ? profile() : true;
        const mobOk = showErr('mob', !/^[6-9]\d{9}$/.test(mobile) ? 'Enter a valid 10-digit mobile number starting with 6-9.' : '');
        if (!p || !mobOk) return;
        let chk;
        try { chk = await busy(e.currentTarget, () => LT.api.checkMobile(mobile)); } catch (er) { return showErr('mob', errMsg(er)); }
        if (mode === 'login' && !chk.registered) { setMode('register', true); md.$('#ltAuthName').focus(); return; }
        if (mode === 'register' && chk.registered) return showErr('mob', 'This number is already registered. Please log in instead.') || md.$('[data-switchtxt] .lt-linkbtn').focus();
        try { await busy(e.currentTarget, () => LT.api.sendOtp(mobile)); } catch (er) { return showErr('mob', errMsg(er)); }
        md.$('[data-step="form"]').hidden = true; md.$('[data-step="otp"]').hidden = false; md.$('[data-mob]').textContent = '+91 ' + mobile;
        md.$('#ltAuthOtp').value = ''; md.$('#ltAuthOtp').focus(); startTimer(); toast('OTP sent. Demo OTP: 123456', 'info');
      };
      md.$('[data-edit]').onclick = () => { md.$('[data-step="form"]').hidden = false; md.$('[data-step="otp"]').hidden = true; };
      md.$('[data-resend]').onclick = async () => { await LT.api.sendOtp(mobile); startTimer(); toast('A new OTP has been sent.', 'info'); };
      md.$('[data-verify]').onclick = async (e) => {
        const otp = md.$('#ltAuthOtp').value.trim();
        if (!/^\d{6}$/.test(otp)) return showErr('otp', 'Enter the 6-digit OTP.');
        let res;
        try { res = await busy(e.currentTarget, () => LT.api.verifyOtp(mobile, otp, mode === 'register' ? profile() : '')); } catch (er) { return showErr('otp', errMsg(er)); }
        if (res.needName) { md.$('[data-edit]').click(); setMode('register', true); return; }
        if (!res.ok) { showErr('otp', res.message); if (res.locked) e.currentTarget.disabled = true; return; }
        done = true; md.close(); toast(mode === 'register' ? 'Welcome to BeyondSure, ' + res.user.name.split(' ')[0] + '! Your account is ready.' : 'Welcome back, ' + res.user.name.split(' ')[0] + '!'); resolve(res.user);
      };
    });
  }
  const requireLogin = (reason) => (LT.store.get().user.loggedIn ? Promise.resolve(LT.store.get().user) : authModal({ reason }));

  LT.ui = {
    $, $$, esc, money, date, time, debounce, param, hours, initials, isMobile, toast, confirm, modal: { open: openModal }, skeleton, empty, error, busy, errMsg,
    tag, priceBlock, addBtn, testCard, packageCard, statusChip, reportChip, avatar, labLogo, rating, sourceChips, amenities, authModal, requireLogin, ILLU
  };
})();

/* ---------- booking documents: printable invoice + calendar (.ics) ---------- */
(function () {
  const { esc, money } = LT.ui;
  const fmtSlot = (b) => { const s = new Date(b.slot.start), e = new Date(b.slot.end), t = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(); return s.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + t(s) + ' - ' + t(e); };
  LT.ui.fmtSlot = fmtSlot;
  /* Tax invoice – same design as the BeyondSure invoice PDF (logo + company | TAX INVOICE + status,
     Billed to / Service & collection boxes, test table, instructions + payment summary, footer). */
  LT.ui.invoice = function (b) {
    const w = window.open('', '_blank', 'width=900,height=1000');
    if (!w) return LT.ui.toast('Allow pop-ups to view the invoice', 'warning');
    const rs = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const d = (x, o) => new Date(x).toLocaleDateString('en-IN', Object.assign({ day: '2-digit', month: 'short', year: 'numeric' }, o || {}));
    const tm = (x) => new Date(x).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    const created = new Date(b.createdAt), fy = created.getMonth() >= 3 ? created.getFullYear() : created.getFullYear() - 1;
    const invNo = 'SH' + String(fy).slice(-2) + String(fy + 1).slice(-2) + 'DG' + (b.id.replace(/\D/g, '').slice(-6) || '000001').padStart(6, '0');
    const user = LT.store.get().user || {};
    const self = (LT.db && LT.db.all ? LT.db.all('members') : []).find((m) => m.owner === user.mobile && m.relationship === 'Self') || {};
    const home = b.mode === 'home';
    const addr = home && b.address ? [b.address.house, b.address.street, b.address.landmark, b.address.area, b.address.city, b.address.state, b.address.pincode].filter(Boolean).join(', ') : '';
    const st = String(b.payment.status || '').toLowerCase(), cancelled = b.status === 'CANCELLED';
    const badge = cancelled ? ['REFUND ' + (b.cancel && b.cancel.refundPct ? 'INITIATED' : 'NOT APPLICABLE'), 'warn'] : st.includes('refund') ? ['REFUND INITIATED', 'warn'] : st === 'paid' || st === 'success' ? ['PAID', ''] : ['PAY AT ' + (home ? 'COLLECTION' : 'CENTRE'), 'warn'];
    const paid = !badge[1];
    let n = 0;
    const rows = b.membersView.map((m) => m.tests.map((t) => `<tr><td class="num">${++n}</td>
        <td><b class="tname">${esc(t.name)}</b><div class="tmeta"><span class="chip">${home ? 'Home Collection' : 'Lab Visit'}</span><span>Partner: ${esc(b.lab.name)} &bull; Code: ${esc(String(t.id).toUpperCase())}</span></div></td>
        <td><b class="serif">${esc(m.name)}</b><div class="muted">Relation: ${esc(m.relationship || '-')}</div></td>
        <td class="amt">${rs(t.price)}</td></tr>`).join('')).join('');
    const sub = b.membersView.reduce((s, m) => s + m.tests.reduce((x, t) => x + (t.price || 0), 0), 0);
    const sumRow = (k, v, cls) => `<div class="srow ${cls || ''}"><span>${k}</span><b>${v}</b></div>`;
    const fast = b.fastingHours ? `Please observe ${b.fastingHours}-12 hours fasting before your scheduled tests.` : 'No fasting is needed for your scheduled tests.';
    w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tax Invoice ${esc(invNo)}</title><style>
      @page{size:A4;margin:12mm}*{box-sizing:border-box}
      body{margin:0;background:#eef1f6;font-family:Arial,Helvetica,sans-serif;color:#1f2a44;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .page{max-width:860px;margin:24px auto;background:#fff;padding:40px 44px 34px;box-shadow:0 10px 40px -18px rgba(11,27,63,.35)}
      .hd{display:flex;justify-content:space-between;gap:24px;padding-bottom:16px;border-bottom:2.5px solid #1d4fb8}
      .co img{height:38px;width:auto;display:block;margin-bottom:6px}.co b{font-size:14px}.co p{margin:3px 0 0;color:#6b7488;font-size:13px;line-height:1.55}
      .ttl{text-align:right;flex:none}.ttl h1{margin:4px 0 12px;font-family:"Times New Roman",Times,serif;font-size:30px;font-weight:700;color:#1d4fb8;letter-spacing:.3px}
      .ttl .no{font-weight:700;font-size:14.5px;margin-bottom:6px}.ttl .meta{color:#6b7488;font-size:13px;line-height:1.6}.ttl .meta b{color:#6b7488}
      .badge{display:inline-block;margin-top:10px;padding:6px 14px;border-radius:3px;background:#e8f8ef;border:1px solid #b9e8cc;color:#0e8a50;font-size:11.5px;font-weight:700;letter-spacing:.1em}
      .badge.warn{background:#fff4db;border-color:#f3d48a;color:#9a5b00}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:34px}
      .box{border:1px solid #dfe5f0;border-radius:7px;background:#f8fafc;padding:16px 16px 14px}
      .box h3{margin:0 0 12px;padding-bottom:9px;border-bottom:1px solid #e3e8f0;font-size:11px;letter-spacing:.11em;color:#5b6474;text-transform:uppercase}
      .big{font-size:15px;font-weight:700;margin:0 0 6px}.muted{color:#6b7488;font-size:13px;line-height:1.5}
      .kv{display:grid;grid-template-columns:116px 1fr;gap:7px 10px;margin-top:10px;font-family:"Times New Roman",Times,serif;font-size:13.5px}.kv span{color:#6b7488;font-weight:700}.kv b{color:#1f2a44}
      table{width:100%;border-collapse:collapse;margin-top:18px}
      thead th{background:#f2f5fa;border-top:1px solid #dfe5f0;border-bottom:2px solid #d5dcea;padding:14px 12px;font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;color:#3b4560;text-align:left}
      thead th:first-child{width:44px}thead th:nth-child(3){width:190px}thead th:last-child{width:130px}
      thead th:last-child,td.amt{text-align:right}tbody td{padding:15px 12px;border-bottom:1px solid #e6eaf2;vertical-align:top;font-size:13.5px}
      td.num{color:#98a1b2;font-weight:700;width:40px}.tname{font-size:14.5px}.serif{font-family:"Times New Roman",Times,serif;font-size:14px}td.amt{font-weight:700;font-size:14.5px;white-space:nowrap}
      .tmeta{display:inline-flex;align-items:center;gap:8px;margin-top:6px;padding:2px 9px 2px 2px;border:1px solid #e3e8f0;border-radius:3px;background:#f8fafc;color:#6b7488;font-size:11.5px}
      .chip{flex:none;white-space:nowrap;padding:3px 8px;border:1px solid #b9e8cc;border-radius:3px;background:#e8f8ef;color:#0e8a50;font-weight:700;font-size:11px}
      thead th:nth-child(3){width:170px}
      ul{margin:0;padding-left:18px;color:#3b4560;font-size:13px;line-height:1.6}li{margin-bottom:6px}
      .srow{display:flex;justify-content:space-between;gap:12px;padding:9px 0;font-family:"Times New Roman",Times,serif;font-size:13.5px}.srow span{color:#6b7488;font-weight:700}
      .srow.minus b{color:#0e8a50}.srow.total{margin-top:4px;border-top:2.5px solid #1d4fb8;padding-top:12px}.srow.total span,.srow.total b{color:#1d4fb8;font-size:16px}.srow.total b{font-size:17px}
      .ft{margin-top:30px;padding-top:18px;border-top:1px solid #e6eaf2;text-align:center;color:#98a1b2;font-size:12.5px;line-height:2}.ft b{color:#6b7488}
      .acts{display:flex;justify-content:center;gap:10px;margin:0 auto 30px}.acts button{padding:11px 20px;border-radius:999px;border:1.5px solid #1964ee;background:#1964ee;color:#fff;font-size:14px;font-weight:700;cursor:pointer}.acts button.o{background:#fff;color:#1964ee}
      @media print{body{background:#fff}.page{box-shadow:none;margin:0;padding:0;max-width:none}.acts{display:none}}
      @media (max-width:680px){.page{margin:0;padding:22px 16px}.hd{flex-direction:column;gap:14px}.ttl{text-align:left}.grid{grid-template-columns:1fr;gap:16px;margin-top:22px}thead{display:none}
        tbody tr{display:grid;grid-template-columns:28px 1fr auto;gap:4px 8px;padding:12px 0;border-bottom:1px solid #e6eaf2}tbody td{border:0;padding:0}tbody td:nth-child(3){grid-column:2/4}td.amt{grid-column:3;grid-row:1}.kv{grid-template-columns:100px 1fr}.tmeta{flex-wrap:wrap}}
    </style></head><body>
    <div class="page">
      <header class="hd"><div class="co"><img src="https://teleconsult.bysure.in/images/beyondsure-logo_light.png" alt="BeyondSure"><b>BeyondSure Private Limited</b><p>203, Shivam Square, 4 Sahar Road, Andheri (E), Mumbai 400069, Maharashtra, India</p><p>Email: support@shrigodahealthcare.com</p></div>
        <div class="ttl"><h1>TAX INVOICE</h1><div class="no">Invoice #: ${esc(invNo)}</div><div class="meta">Date: <b>${d(b.createdAt)}</b></div><div class="meta">Order Ref: <b>${esc(b.id)}</b></div><span class="badge ${badge[1]}">PAYMENT STATUS: ${badge[0]}</span></div></header>
      <div class="grid">
        <section class="box"><h3>Billed to (customer details)</h3><p class="big">${esc(user.name || self.name || 'Customer')}</p>${addr ? `<div class="muted">${esc(addr)}</div>` : ''}
          <div class="kv">${self.email ? `<span>Email:</span><b>${esc(self.email)}</b>` : ''}<span>Mobile:</span><b>+91 ${esc(user.mobile || self.mobile || '-')}</b></div></section>
        <section class="box"><h3>Service &amp; collection details</h3><p class="big">${esc(b.lab.name)}</p>
          <div class="kv"><span>Service Type:</span><b>${home ? 'Home collection' : 'Lab centre visit'}</b>${!home && b.centre ? `<span>Centre:</span><b>${esc(b.centre.name)}</b>` : ''}<span>${home ? 'Collection Slot:' : 'Visit Slot:'}</span><b>${d(b.slot.start)} (${tm(b.slot.start)})</b>${b.payment.method ? `<span>Payment:</span><b>${esc(b.payment.method)}${b.payment.id ? ' &bull; ' + esc(b.payment.id) : ''}</b>` : ''}</div></section>
      </div>
      <table><thead><tr><th>#</th><th>Test / Package description</th><th>Patient details</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="grid">
        <section class="box"><h3>Patient instructions &amp; guidelines</h3><ul><li>${fast}</li><li>${home ? 'The Phlebotomist will verify your identity before sample collection.' : 'Carry a photo ID for each member and reach the centre 10 minutes early.'}</li><li>Digital lab test reports will be available on the BeyondSure app/portal once verified by pathologists.</li></ul></section>
        <section class="box"><h3>Payment summary</h3>
          ${sumRow('Subtotal', rs(sub))}${b.bill.coupon ? sumRow('Coupon ' + esc(b.bill.couponCode || ''), '- ' + rs(b.bill.coupon), 'minus') : ''}${sumRow('Collection Charge', b.bill.collection ? rs(b.bill.collection) : 'FREE')}${sumRow('Taxes (diagnostics exempt)', rs(0))}
          ${sumRow(paid ? 'Total Amount Paid' : 'Total Amount', rs(b.bill.total), 'total')}${cancelled && b.cancel && b.cancel.refundAmount ? sumRow('Refund (' + b.cancel.refundPct + '%)', rs(b.cancel.refundAmount), 'minus') : ''}</section>
      </div>
      <footer class="ft">This is a computer-generated tax invoice and does not require a physical signature.<br>Thank you for choosing <b>BeyondSure Healthcare</b> for your diagnostic and health needs.</footer>
    </div>
    <div class="acts"><button type="button" onclick="window.print()">Print / Save as PDF</button><button type="button" class="o" onclick="window.close()">Close</button></div>
    </body></html>`);
    w.document.close();
  };
  LT.ui.ics = function (b) {
    const f = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const where = b.mode === 'home' && b.address ? `${b.address.house}, ${b.address.area}, ${b.address.city}` : b.centre ? `${b.centre.name}, ${b.centre.address}` : '';
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BeyondSure//Lab Tests//EN', 'BEGIN:VEVENT', 'UID:' + b.id + '@bysure.in', 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(b.slot.start), 'DTEND:' + f(b.slot.end),
      'SUMMARY:' + (b.mode === 'home' ? 'Home sample collection' : 'Lab visit') + ' – ' + b.lab.name, 'LOCATION:' + where.replace(/,/g, '\,'), 'DESCRIPTION:Booking ' + b.id + '. Tests: ' + b.membersView.map((m) => m.name + ' (' + m.tests.map((t) => t.name).join('; ') + ')').join(' | ').replace(/,/g, '\,'),
      'BEGIN:VALARM', 'TRIGGER:-PT12H', 'ACTION:DISPLAY', 'DESCRIPTION:Lab test tomorrow – check fasting instructions', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = b.id + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    LT.ui.toast('Calendar file downloaded');
  };
  LT.ui.share = async function (title, text, link) {
    if (navigator.share) { try { await navigator.share({ title, text, url: link }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(link); LT.ui.toast('Link copied to clipboard'); } catch (e) { LT.ui.toast('Copy this link: ' + link, 'info', { duration: 6000 }); }
  };
})();

/* ---------- themed form controls: site dropdown for <select>, themed calendar for date inputs ----------
   Every select.form-select uses the site's own dropdown (../assets/js/dropdown.js – same as Find a Doctor
   and Shop). Every input[type=date] gets a calendar panel in the same style. The real controls stay in the
   page (hidden) and keep firing "change"/"input", so page code keeps reading .value as before. */
(function () {
  const esc = LT.ui.esc;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? new Date(v + 'T00:00:00') : null);
  const nice = (v) => { const d = parse(v); return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; };
  let seq = 0;

  /* ----- dropdowns ----- */
  function enhanceSelect(sel) {
    if (!window.BS_enhanceSelect || sel.classList.contains('dd-native') || sel.closest('.dd-panel')) return;
    const small = sel.classList.contains('form-select-sm');
    const inlineWidth = sel.style.width;
    const dd = window.BS_enhanceSelect(sel, { search: sel.options.length > 8, searchPlaceholder: 'Search', minWidth: 200 });
    const wrap = sel.nextElementSibling;
    if (!wrap || !wrap.classList.contains('dd')) return;
    wrap.classList.add('lt-dd'); if (small) wrap.classList.add('is-sm'); if (inlineWidth === 'auto') wrap.classList.add('is-auto');
    const btn = wrap.querySelector('.dd-btn');
    const sync = () => { btn.disabled = sel.disabled; wrap.classList.toggle('is-invalid', sel.classList.contains('is-invalid')); };
    sync();
    new MutationObserver(sync).observe(sel, { attributes: true, attributeFilter: ['class', 'disabled'] });
    sel._dd = dd;
    /* keep the button text right if page code changes .value directly */
    const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    Object.defineProperty(sel, 'value', { configurable: true, get() { return desc.get.call(this); }, set(v) { desc.set.call(this, v); dd.refresh(); } });
    /* options loaded later (e.g. family members): rebuild the themed list */
    const optObs = new MutationObserver(() => {
      optObs.disconnect(); delete sel.value; delete sel._dd;
      const listId = btn.getAttribute('aria-controls'), list = listId && document.getElementById(listId);
      if (list && list.closest('.dd-panel')) list.closest('.dd-panel').remove();
      const lbl = document.querySelector('label[for="' + btn.id + '"]'); if (lbl && sel.id) lbl.htmlFor = sel.id;
      wrap.remove(); sel.classList.remove('dd-native'); sel.removeAttribute('aria-hidden'); sel.removeAttribute('tabindex');
      if (small) sel.classList.add('form-select-sm'); if (inlineWidth) sel.style.width = inlineWidth;
      enhanceSelect(sel);
    });
    optObs.observe(sel, { childList: true });
  }

  /* ----- calendar ----- */
  function enhanceDate(inp) {
    if (inp.dataset.ltDp) return;
    inp.dataset.ltDp = '1';
    const id = 'ltdp' + (++seq);
    inp.type = 'text'; inp.readOnly = true; inp.tabIndex = -1;
    inp.classList.add('dd-native'); inp.setAttribute('aria-hidden', 'true');
    const wrap = document.createElement('div'); wrap.className = 'dd lt-dd lt-dpw';
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'dd-btn'; btn.id = id + '-btn';
    btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="dd-value"></span><i class="bi bi-calendar3 dd-caret" aria-hidden="true"></i>';
    wrap.appendChild(btn); inp.after(wrap);
    const label = inp.id ? document.querySelector(`label[for="${inp.id}"]`) : null;
    if (label) { label.htmlFor = btn.id; }
    const ph = inp.getAttribute('placeholder') || 'Select date';
    const show = () => { btn.querySelector('.dd-value').textContent = nice(inp.value) || ph; wrap.classList.toggle('has-value', !!inp.value); wrap.classList.toggle('is-invalid', inp.classList.contains('is-invalid')); };
    new MutationObserver(show).observe(inp, { attributes: true, attributeFilter: ['class'] });
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(inp, 'value', { configurable: true, get() { return desc.get.call(this); }, set(v) { desc.set.call(this, v); show(); } });
    show();

    let panel = null, view = 'days', cursor = null;
    const min = parse(inp.getAttribute('min')), max = parse(inp.getAttribute('max'));
    const outOfRange = (d) => (min && d < min) || (max && d > max);
    const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };

    function render() {
      const sel = parse(inp.value), y = cursor.getFullYear(), m = cursor.getMonth();
      let head, body;
      if (view === 'days') {
        head = `${MONTHS[m]} ${y}`;
        const first = new Date(y, m, 1), start = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < start; i++) cells.push('<span></span>');
        for (let d = 1; d <= days; d++) {
          const dt = new Date(y, m, d), v = iso(dt);
          const cls = ['lt-dp-day', sel && iso(sel) === v ? 'is-selected' : '', iso(today()) === v ? 'is-today' : ''].join(' ');
          cells.push(`<button type="button" class="${cls}" data-v="${v}" ${outOfRange(dt) ? 'disabled' : ''} aria-label="${dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}" aria-pressed="${!!(sel && iso(sel) === v)}">${d}</button>`);
        }
        body = `<div class="lt-dp-week">${['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((w) => `<span>${w}</span>`).join('')}</div><div class="lt-dp-grid">${cells.join('')}</div>`;
      } else if (view === 'months') {
        head = String(y);
        body = `<div class="lt-dp-grid is-3">${MONTHS.map((mn, i) => { const off = (max && new Date(y, i, 1) > max) || (min && new Date(y, i + 1, 0) < min); return `<button type="button" class="lt-dp-cell ${sel && sel.getFullYear() === y && sel.getMonth() === i ? 'is-selected' : ''}" data-m="${i}" ${off ? 'disabled' : ''}>${mn.slice(0, 3)}</button>`; }).join('')}</div>`;
      } else {
        const from = Math.floor(y / 12) * 12;
        head = `${from} – ${from + 11}`;
        body = `<div class="lt-dp-grid is-3">${Array.from({ length: 12 }, (_, i) => from + i).map((yy) => `<button type="button" class="lt-dp-cell ${sel && sel.getFullYear() === yy ? 'is-selected' : ''}" data-y="${yy}" ${(max && yy > max.getFullYear()) || (min && yy < min.getFullYear()) ? 'disabled' : ''}>${yy}</button>`).join('')}</div>`;
      }
      panel.innerHTML = `<div class="lt-dp-head"><button type="button" class="lt-dp-nav" data-nav="-1" aria-label="Previous"><i class="bi bi-chevron-left"></i></button>
        <button type="button" class="lt-dp-title" data-view aria-label="Change ${view === 'days' ? 'month and year' : 'view'}">${head} <i class="bi bi-chevron-down"></i></button>
        <button type="button" class="lt-dp-nav" data-nav="1" aria-label="Next"><i class="bi bi-chevron-right"></i></button></div>${body}
        <div class="lt-dp-foot"><button type="button" class="lt-linkbtn" data-clear>Clear</button>${outOfRange(today()) ? '' : '<button type="button" class="lt-linkbtn" data-today>Today</button>'}</div>`;
    }
    function place() {
      const r = btn.getBoundingClientRect();
      panel.style.width = Math.min(320, window.innerWidth - 24) + 'px';
      const left = Math.max(12, Math.min(r.left, window.innerWidth - panel.offsetWidth - 12));
      const up = window.innerHeight - r.bottom < panel.offsetHeight + 16 && r.top > panel.offsetHeight + 16;
      panel.style.left = left + 'px';
      panel.style.top = (up ? r.top - panel.offsetHeight - 8 : r.bottom + 8) + 'px';
      panel.classList.toggle('bys-up', up);
    }
    function pick(v) {
      inp.value = v;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    }
    function open() {
      if (panel) return;
      document.dispatchEvent(new CustomEvent('dd:closeall', { detail: id }));
      const sel = parse(inp.value);
      cursor = sel || (max && today() > max ? new Date(max) : today()); cursor.setDate(1); view = 'days';
      panel = document.createElement('div'); panel.className = 'dd-panel lt-dp'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Choose date');
      document.body.appendChild(panel); render(); place();
      wrap.classList.add('bys-open'); btn.setAttribute('aria-expanded', 'true');
      const focus = panel.querySelector('.lt-dp-day.is-selected') || panel.querySelector('.lt-dp-day.is-today:not(:disabled)') || panel.querySelector('.lt-dp-day:not(:disabled)');
      if (focus) focus.focus({ preventScroll: true });
      panel.addEventListener('click', (e) => {
        const t = e.target.closest('button'); if (!t || t.disabled) return;
        if (t.dataset.v) return pick(t.dataset.v);
        if (t.dataset.nav) { const n = +t.dataset.nav; if (view === 'days') cursor.setMonth(cursor.getMonth() + n); else cursor.setFullYear(cursor.getFullYear() + (view === 'years' ? 12 : 1) * n); render(); return; }
        if (t.hasAttribute('data-view')) { view = view === 'days' ? 'months' : view === 'months' ? 'years' : 'days'; render(); return; }
        if (t.dataset.m) { cursor.setMonth(+t.dataset.m); view = 'days'; render(); return; }
        if (t.dataset.y) { cursor.setFullYear(+t.dataset.y); view = 'months'; render(); return; }
        if (t.hasAttribute('data-today')) return pick(iso(today()));
        if (t.hasAttribute('data-clear')) return pick('');
      });
      panel.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
        const d = e.target.closest('.lt-dp-day'); if (!d) return;
        const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]; if (!step) return;
        e.preventDefault();
        const nd = new Date(d.dataset.v + 'T00:00:00'); nd.setDate(nd.getDate() + step);
        if (nd.getMonth() !== cursor.getMonth()) { cursor = new Date(nd.getFullYear(), nd.getMonth(), 1); render(); }
        const nb = panel.querySelector(`[data-v="${iso(nd)}"]`); if (nb) nb.focus();
      });
    }
    function close(focusBtn) {
      if (!panel) return;
      panel.remove(); panel = null;
      wrap.classList.remove('bys-open'); btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus();
    }
    btn.addEventListener('click', () => (panel ? close(true) : open()));
    document.addEventListener('pointerdown', (e) => { if (panel && !panel.contains(e.target) && !wrap.contains(e.target)) close(false); });
    document.addEventListener('dd:closeall', (e) => { if (e.detail !== id) close(false); });
    window.addEventListener('resize', () => { if (panel) place(); });
    window.addEventListener('scroll', () => { if (panel) place(); }, { passive: true });
    wrap._close = () => close(false);
  }

  /* ----- apply everywhere, including content rendered later (pages, modals) ----- */
  function scan(root) {
    if (!root.querySelectorAll) return;
    root.querySelectorAll('select.form-select').forEach(enhanceSelect);
    root.querySelectorAll('input[type=date]').forEach(enhanceDate);
  }
  /* remove option panels whose dropdown left the page (re-rendered lists, closed modals) */
  function cleanup(node) {
    if (!node.querySelectorAll) return;
    const wraps = node.classList && node.classList.contains('dd') ? [node] : [...node.querySelectorAll('.dd')];
    wraps.forEach((w) => {
      if (w._close) w._close();
      const btn = w.querySelector('.dd-btn'), listId = btn && btn.getAttribute('aria-controls');
      const list = listId && document.getElementById(listId);
      if (list && list.closest('.dd-panel')) list.closest('.dd-panel').remove();
    });
  }
  let queued = false;
  const mo = new MutationObserver((muts) => {
    muts.forEach((m) => m.removedNodes.forEach((n) => { if (n.nodeType === 1 && !document.contains(n)) cleanup(n); }));
    if (queued) return; queued = true;
    queueMicrotask(() => { queued = false; scan(document.body); });
  });
  const start = () => { scan(document.body); mo.observe(document.body, { childList: true, subtree: true }); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  LT.ui.enhanceForms = scan;
})();
