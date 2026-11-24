/* Lab Tests – shared layout.
   LT.layout.mount({ active, stepper, crumbs, showCartBar, title }) injects:
   site top bar + header (BeyondSure theme), breadcrumbs, booking stepper, footer,
   sticky lab-cart bar, demo tools, offline banner, toasts. Also wires global
   behaviours: [data-add] add-to-cart buttons (with package-overlap check),
   [data-switch-mode], [data-pkg-open] package drawer, flash messages. */
window.LT = window.LT || {};

(function () {
  const U = () => LT.ui;
  const base = () => document.body.dataset.ltBase || '';
  const url = (p) => base() + p;
  const site = (p) => base() + '../' + p;
  const STEPS = [['cart', 'Cart & Members', 'cart.html'], ['lab', 'Lab', 'compare-labs.html'], ['location', 'Location', 'location.html'], ['slot', 'Slot', 'slot.html'], ['pay', 'Pay', 'summary.html']];
  const LOGO = 'https://teleconsult.bysure.in/images/beyondsure-logo_light.png';
  let opts = {};

  /* ---------- header (same structure as the BeyondSure site header) ---------- */
  function header() {
    const s = LT.store.get(), user = s.user;
    const siteNav = [['Find a Doctor', site('doctor/find-doctor.html')], ['Lab Tests', url('index.html'), true], ['Medicines', site('medicines/index.html')], ['Dental', site('dental/index.html')], ['Cult Fitness', site('fitness/index.html')], ['Shop', site('shop/shop.html')], ['Services', site('index.html#services')], ['Contact', site('index.html#contact')]];
    const menu = `<li><a class="dropdown-item" href="${url('appointments.html')}"><i class="bi bi-calendar-check"></i> My Appointments</a></li>
      <li><a class="dropdown-item" href="${url('reports.html')}"><i class="bi bi-file-earmark-medical"></i> My Reports</a></li>
      <li><button class="dropdown-item" type="button" data-family><i class="bi bi-people"></i> Family Members</button></li>
      <li><a class="dropdown-item" href="${url('cart.html')}"><i class="bi bi-cart3"></i> Lab Cart</a></li>
      <li><a class="dropdown-item" href="${url('my-requests.html')}"><i class="bi bi-file-earmark-arrow-up"></i> Prescription Requests</a></li>`;
    return `<a class="lt-skip" href="#ltMain">Skip to content</a>
    <div class="bys-topbar d-none d-md-block"><div class="bys-topbar-inner"><p><i class="bi bi-heart-pulse"></i> Beyond Insurance. Into Wellness.</p>
      <div class="bys-topbar-links"><a href="mailto:support@shrigodahealthcare.com"><i class="bi bi-envelope"></i> support@shrigodahealthcare.com</a><a href="https://wa.me/919830024236"><i class="bi bi-whatsapp"></i> +91 98300 24236</a></div></div></div>
    <header class="bys-site-header" id="siteHeader">
      <div class="bys-header-inner">
        <a class="bys-logo" href="${site('index.html')}" aria-label="BeyondSure home"><img src="${LOGO}" alt="BeyondSure" width="146" height="40"></a>
        <nav class="bys-menu-pill" aria-label="Main">${siteNav.map(([l, h, on]) => `<a href="${h}" ${on ? 'class="is-active" aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
        <div class="bys-header-actions">
          <a class="bys-icon-btn bys-cart-btn" href="${url('cart.html')}" aria-label="Lab cart" title="Lab Tests Cart"><i class="bi bi-cart3"></i><span class="bys-cart-badge" data-lt-count hidden>0</span></a>
          ${user.loggedIn ? `<div class="dropdown">
            <button class="bys-icon-btn lt-profile-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Account menu">${U().avatar(user.name, null, 'sm')}</button>
            <ul class="dropdown-menu dropdown-menu-end lt-dropdown"><li class="lt-dd-head"><strong>${U().esc(user.name)}</strong><small>+91 ${U().esc(user.mobile)}</small></li><li><hr class="dropdown-divider"></li>
              ${menu}<li><hr class="dropdown-divider"></li><li><button class="dropdown-item text-danger" type="button" data-logout><i class="bi bi-box-arrow-right"></i> Logout</button></li></ul></div>`
        : `<button type="button" class="bys-btn-brand lt-login-btn" data-login><i class="bi bi-person-circle" aria-hidden="true"></i> Login</button>`}
          <button class="bys-icon-btn bys-menu-toggle" type="button" data-bs-toggle="offcanvas" data-bs-target="#ltMobileMenu" aria-controls="ltMobileMenu" aria-label="Open menu"><i class="bi bi-list"></i></button>
        </div>
      </div>
    </header>
    <div class="offcanvas offcanvas-end bys-mobile-menu" tabindex="-1" id="ltMobileMenu" aria-labelledby="ltMobileMenuLabel">
      <div class="offcanvas-header"><img src="${LOGO}" alt="BeyondSure" height="34" id="ltMobileMenuLabel"><button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button></div>
      <div class="offcanvas-body">
        ${siteNav.map(([l, h, on]) => `<a class="bys-m-link ${on ? 'fd-active-link' : ''}" href="${h}">${l === 'Lab Tests' ? 'Diagnostic Lab Tests' : l} <i class="bi bi-chevron-right"></i></a>`).join('')}
        <p class="lt-m-head">Lab tests</p>
        ${[['Search Tests', 'search.html'], ['Health Packages', 'packages.html'], ['Lab Cart', 'cart.html'], ['My Appointments', 'appointments.html'], ['My Reports', 'reports.html'], ['Prescription Requests', 'my-requests.html']].map(([l, h]) => `<a class="bys-m-link" href="${url(h)}">${l} <i class="bi bi-chevron-right"></i></a>`).join('')}
        <button type="button" class="bys-m-link w-100 border-0 bg-transparent text-start" data-family>Family Members <i class="bi bi-chevron-right"></i></button>
        ${user.loggedIn ? `<button type="button" class="bys-btn-brand-outline w-100 mt-4" data-logout>Logout</button>` : `<button type="button" class="bys-btn-brand w-100 mt-4" data-login>Login</button>`}
        <div class="bys-m-contact"><a href="mailto:support@shrigodahealthcare.com"><i class="bi bi-envelope"></i> support@shrigodahealthcare.com</a><a href="https://wa.me/919830024236"><i class="bi bi-whatsapp"></i> +91 98300 24236</a></div>
      </div>
    </div>`;
  }

  /* lab sub-navigation (inside the page hero band) */
  function labBar() {
    const s = LT.store.get(), loc = s.location.pincode ? `${s.location.area || s.location.city} ${s.location.pincode}` : 'Select location';
    const nav = [['labtests', 'Lab Tests', 'index.html', 'eyedropper'], ['search', 'Search', 'search.html', 'search'], ['packages', 'Packages', 'packages.html', 'box2-heart'], ['appointments', 'Appointments', 'appointments.html', 'calendar-check'], ['reports', 'Reports', 'reports.html', 'file-earmark-medical']];
    return `<div class="lt-labbar">
                <nav class="lt-labnav" aria-label="Lab tests">${nav.map(([k, l, h, i]) => `
                  <a href="${url(h)}" class="${opts.active === k ? 'is-active' : ''}" ${opts.active === k ? 'aria-current="page"' : ''}><i class="bi bi-${i}"></i>${l}</a>`).join('')}
                </nav>
                <div class="lt-hchips">
                  <button type="button" class="lt-hchip" data-change-location aria-label="Change location: ${U().esc(loc)}" title="${U().esc(loc)}">
                      <i class="bi bi-geo-alt-fill"></i>
                      ${s.location.pincode
                        /* area shortens with "..." when space runs out; the pincode is always shown in full */
                        ? `<span class="lt-hchip-txt"><span class="lt-hchip-area">${U().esc(s.location.area || s.location.city)}</span><span class="lt-hchip-pin">${U().esc(s.location.pincode)}</span></span>`
                        : `<span class="lt-hchip-txt"><span class="lt-hchip-area">${U().esc(loc)}</span></span>`}
                      <i class="bi bi-chevron-down small"></i>
                  </button>
                  <button type="button" class="lt-hchip is-mode" data-toggle-mode aria-label="Collection mode: ${s.mode === 'centre' ? 'Lab Centre' : 'Home Collection'}. Click to switch" title="${s.mode === 'centre' ? 'Lab Centre' : s.mode === 'home' ? 'Home Collection' : 'Choose mode'}">
                    <i class="bi bi-${s.mode === 'centre' ? 'hospital' : 'house-heart'}"></i>
                    <span class="lt-hchip-txt"><span class="lt-hchip-area">${s.mode === 'centre' ? 'Lab Centre' : s.mode === 'home' ? 'Home Collection' : 'Choose mode'}</span></span>
                    <i class="bi bi-arrow-left-right small"></i>
                  </button>
                </div>
            </div>`;
  }

  /* ---------- footer (same structure as the BeyondSure site footer) ---------- */
  function footer() {
    const col = (t, links) => `<div class="bys-ft-col"><h5>${t}</h5><ul>${links.map(([l, h]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div>`;
    const once = 'Accurate Reports|Home Sample Collection|NABL Partner Labs|Beyond Insurance|Into Wellness'.split('|').map((w) => `<span>${w}<b>✱</b></span>`).join('');
    return `<div class="bys-site-wrap lt-footwrap"><div class="bys-band bys-section" aria-hidden="true"><div class="bys-marquee-track">${once + once + once + once}</div></div>
    <footer class="bys-site-footer lt-footer">
      <div class="ft-top"><div class="bys-ft-brand"><a href="${site('index.html')}" class="bys-ft-logo" aria-label="BeyondSure home"><img src="${LOGO}" alt="BeyondSure"></a>
        <p class="bys-ft-tagline">Preventive care, made a daily habit. Book accurate lab tests from NABL-accredited partner labs with home sample collection and digital reports.</p></div></div>
      <div class="bys-ft-line"></div>
      <div class="bys-ft-cols">
        <div class="bys-ft-col bys-ft-touch"><h5>Get In Touch</h5><ul>
          <li><i class="bi bi-envelope"></i><a href="mailto:support@shrigodahealthcare.com">support@shrigodahealthcare.com</a></li>
          <li><i class="bi bi-telephone"></i><a href="https://wa.me/919830024236">+91 98300 24236</a></li>
          <li><i class="bi bi-geo-alt"></i><span>203, Shivam Square, 4 Sahar Road, Andheri (E), Mumbai 400069, Maharashtra, India</span></li></ul></div>
        ${col('Lab Tests', [['Book a Lab Test', url('search.html')], ['Upload Prescription', url('prescription-upload.html')], ['Search Tests', url('search.html')], ['Health Packages', url('packages.html')], ['Lab Cart', url('cart.html')]])}
        ${col('My Account', [['My Appointments', url('appointments.html')], ['My Reports', url('reports.html')], ['Prescription Requests', url('my-requests.html')], ['Family Members', '#family']])}
        ${col('Services', [['Teleconsultation', site('doctor/find-doctor.html')], ['Medicine Delivery', site('medicines/index.html')], ['Dental Care', site('dental/index.html')], ['Health Shop', site('shop/shop.html')]])}
      </div>
      <div class="bys-ft-bottom"><nav aria-label="Footer"><a href="${site('index.html#services')}">Services</a><a href="${url('index.html')}">Lab Tests</a><a href="${site('index.html#faq')}">FAQ</a><a href="${site('index.html#contact')}">Contact</a><button type="button" class="lt-reset-link" data-reset-demo>Reset demo data</button></nav>
        <p>© ${new Date().getFullYear()} BeyondSure. All rights reserved.</p></div>
    </footer></div>
    <button class="bys-to-top" id="toTop" type="button" aria-label="Back to top"><i class="bi bi-arrow-up"></i></button>`;
  }

  /* ---------- crumbs + stepper ---------- */
  const crumbs = (list) => `<nav class="lt-crumbs" aria-label="Breadcrumb"><a href="${site('index.html')}">Home</a>${list.map(([l, h], i) => `<i class="bi bi-chevron-right" aria-hidden="true"></i>${h && i < list.length - 1 ? `<a href="${url(h)}">${U().esc(l)}</a>` : `<span aria-current="page">${U().esc(l)}</span>`}`).join('')}</nav>`;
  function stepper(cur) {
    const idx = STEPS.findIndex((s) => s[0] === cur);
    return `<nav class="lt-stepper" aria-label="Booking progress"><ol>${STEPS.map(([k, l, h], i) => {
      const cls = i < idx ? 'is-done' : i === idx ? 'is-current' : '';
      const inner = `<span class="lt-step-dot">${i < idx ? '<i class="bi bi-check-lg"></i>' : i + 1}</span><span class="lt-step-label">${l}</span>`;
      return `<li class="${cls}" ${i === idx ? 'aria-current="step"' : ''}>${i < idx ? `<a href="${url(h)}">${inner}</a>` : inner}</li>`;
    }).join('')}</ol><div class="lt-stepper-m"><span>Step ${idx + 1} of ${STEPS.length}</span><b>${STEPS[idx][1]}</b><div class="lt-stepper-bar"><i style="width:${((idx + 1) / STEPS.length) * 100}%"></i></div></div></nav>`;
  }

  /* ---------- cart bar ---------- */
  async function updateCart() {
    const n = LT.cart.count();
    document.querySelectorAll('[data-lt-count]').forEach((b) => { b.textContent = n; b.hidden = !n; });
    syncAddButtons();
    const bar = document.getElementById('ltCartBar');
    if (!bar) return;
    bar.hidden = !n;
    document.body.classList.toggle('has-cartbar', !!n);
    if (!n) return;
    bar.querySelector('[data-n]').textContent = n + (n === 1 ? ' test' : ' tests');
    bar.classList.remove('is-bump'); void bar.offsetWidth; bar.classList.add('is-bump');
    try {
      const d = await LT.api.getCartDetails();
      bar.querySelector('[data-total]').textContent = 'From ' + U().money(d.estimate);
      const pct = d.mrp ? Math.round(((d.mrp - d.estimate) / d.mrp) * 100) : 0;
      bar.querySelector('[data-off]').textContent = pct ? pct + '% off' : '';
    } catch (e) { /* bar keeps count only */ }
  }
  function syncAddButtons() {
    document.querySelectorAll('[data-add]').forEach((b) => {
      const on = LT.cart.has(b.dataset.add), n = on ? LT.cart.membersOf(b.dataset.add).length : 0;
      b.classList.toggle('is-added', on); b.setAttribute('aria-pressed', on);
      if (!b.dataset.keepLabel) b.innerHTML = on ? '<i class="bi bi-check2"></i> Added' + (n > 1 ? ' · ' + n : '') : '<i class="bi bi-plus-lg"></i> ' + (b.dataset.label || 'Add');
    });
    /* lab tag on test / package cards (top-right): the booking's lab on every card once a lab is chosen */
    document.querySelectorAll('[data-cardlab]').forEach((el) => { el.outerHTML = U().cardLab(el.dataset.cardlab); });
  }

  /* Add on a test / package card: login (if needed) -> added to the lab cart for Self (no member popup –
     family members are chosen on the Lab Cart page). Tapping "Added" removes it again (with Undo).
     The FIRST test (no lab chosen yet) then opens the lab side-bar "Choose a lab"; later tests keep that lab
     (no side-bar) – the lab is changed on the Compare labs page. */
  const cartChanged = () => { updateCart(); if (LT.page && LT.page.onCartChange) LT.page.onCartChange(); };
  async function handleAdd(id) {
    const it = LT.pricing.item(id) || {}, name = it.short || it.name || 'Test';
    if (LT.cart.has(id)) {
      const removed = LT.cart.remove(id); cartChanged();
      U().toast(name + ' removed from your lab cart', 'info', { action: 'Undo', onAction: () => { LT.cart.restore(removed); cartChanged(); } });
      return;
    }
    const r = await LT.members.quickAdd(id);
    cartChanged();
    if (!r) return;
    U().toast(r.member ? name + ' added for ' + r.member.name.split(' ')[0] + '. Book it for family members in your cart.' : name + ' added. Choose who it is for in your cart.',
      r.member ? 'success' : 'warning', { action: 'View cart', onAction: () => { location.href = url('cart.html'); } });
    const tag = LT.api.labTag(id);
    if (!tag) { if (LT.labPicker && opts.labPicker !== false) LT.labPicker.open(id); return; }
    if (!tag.offered) U().toast((LT.pricing.item(id) || {}).name + ' is not available at ' + tag.name + '. You can change the lab on the Compare labs page.', 'warning');
  }

  async function switchMode(next) {
    const s = LT.store.get();
    next = next || (s.mode === 'centre' ? 'home' : 'centre');
    if (s.location.pincode && !s.location.serviceable[next === 'home' ? 'home' : 'lab']) {
      return U().toast((next === 'home' ? 'Home collection' : 'Lab centre visits') + ' are not available at ' + s.location.pincode, 'danger');
    }
    if (LT.cart.count() || s.lab.id) {
      const ok = await U().confirm({
        title: 'Switch to ' + (next === 'home' ? 'Home Collection' : 'Lab Centre') + '?', icon: next === 'home' ? 'house-heart' : 'hospital',
        body: '<p>Test availability and prices can change. Your selected lab, address/centre and slot will be reset. Your cart stays as it is.</p>', ok: 'Switch mode'
      });
      if (!ok) return;
    }
    LT.store.set({ mode: next, lab: Object.assign({}, s.lab, { id: null, method: null, centreId: null }), slot: LT.store.defaults().slot, address: { id: null } });
    U().toast('Switched to ' + (next === 'home' ? 'Home Collection' : 'Lab Centre'));
    setTimeout(() => location.reload(), 500);
  }

  async function packageDrawer(id) {
    const el = document.createElement('div');
    el.className = 'offcanvas offcanvas-end lt-drawer'; el.tabIndex = -1; el.setAttribute('aria-label', 'Package details');
    el.innerHTML = '<div class="offcanvas-header"><h2 class="h5 mb-0">Package details</h2><button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button></div><div class="offcanvas-body" data-body></div>';
    document.body.appendChild(el);
    const oc = new bootstrap.Offcanvas(el); oc.show();
    el.addEventListener('hidden.bs.offcanvas', () => el.remove());
    const body = el.querySelector('[data-body]');
    U().skeleton(body, 'block', 2);
    try {
      const p = await LT.api.getPackage(id);
      body.innerHTML = `<span class="lt-tag" data-c="bone">${U().esc(p.lifeLabel)}</span><h3 class="h4 mt-2">${U().esc(p.name)}</h3><p class="text-muted">${U().esc(p.description)}</p>
        <ul class="lt-meta mb-3"><li><i class="bi bi-list-check"></i>${p.parameters} parameters</li><li><i class="bi bi-cup-hot"></i>${p.fastingHours ? p.fastingHours + ' hrs fasting' : 'No fasting'}</li><li><i class="bi bi-clock-history"></i>Report in ${U().hours(p.tatHours)}</li></ul>
        <h4 class="h6">Tests included (${p.testsDetail.length})</h4>
        <ul class="lt-checklist">${p.testsDetail.map((t) => `<li><i class="bi bi-check-circle-fill"></i><a href="${url('test-detail.html?id=' + t.id)}">${U().esc(t.name)}</a></li>`).join('')}</ul>
        <div class="lt-drawer-foot">${U().priceBlock(p.fromPrice, p.mrp, { from: true })}${U().addBtn(p.id)}</div>`;
    } catch (e) { U().error(body, { text: U().errMsg(e), onRetry: () => { oc.hide(); packageDrawer(id); } }); }
  }

  /* ---------- demo tools ---------- */
  function demoTools() {
    if (new URLSearchParams(location.search).get('demo') === '0') sessionStorage.setItem('lt_demo_off', '1');
    if (new URLSearchParams(location.search).get('demo') === '1') sessionStorage.removeItem('lt_demo_off');
    if (sessionStorage.getItem('lt_demo_off')) return '';
    const pages = [['index.html', 'Landing (Phase 1-4)'], ['prescription-upload.html', 'Prescription upload (6)'], ['my-requests.html', 'My requests'],
    ['search.html', 'Search tests (7)'], ['test-detail.html?id=cbc', 'Test detail'], ['packages.html', 'Packages'], ['cart.html', 'Cart & members (8-10)'], ['compare-labs.html', 'Compare labs (11)'],
    ['location.html', 'Location (12)'], ['slot.html', 'Slot (13)'], ['summary.html', 'Summary & pay (14)'], ['appointments.html', 'Appointments (15)'], ['appointment-detail.html?id=LT-2026-004821', 'Appointment detail'],
    ['reports.html', 'Reports (19)'], ['report-view.html?id=r-1001', 'Report view']];
    const s = LT.store.get();
    return `<div class="lt-demo" id="ltDemo"><button type="button" class="lt-demo-btn" aria-expanded="false" aria-controls="ltDemoPanel"><i class="bi bi-tools"></i><span>Demo tools</span></button>
      <div class="lt-demo-panel" id="ltDemoPanel" hidden>
        <div class="lt-demo-head"><strong>Demo tools</strong><button type="button" class="btn-close btn-sm" data-demo-close aria-label="Close demo tools"></button></div>
        <button type="button" data-demo="login"><i class="bi bi-person"></i>${s.user.loggedIn ? 'Logout (' + U().esc(s.user.name.split(' ')[0]) + ')' : 'Login as demo user (with family)'}</button>
        <button type="button" data-demo="fresh"><i class="bi bi-person-plus"></i>New user (fresh login – only Self, no family)</button>
        <button type="button" data-demo="mode"><i class="bi bi-arrow-left-right"></i>Toggle mode (now: ${s.mode || 'none'})</button>
        <button type="button" data-demo="fail"><i class="bi bi-bug"></i>Simulate API error on next call</button>
        <button type="button" data-demo="payfail"><i class="bi bi-credit-card"></i>Payment result: <b>${s.payment.simulate}</b> (toggle)</button>
        <button type="button" data-demo="advance"><i class="bi bi-skip-forward"></i>Advance booking status</button>
        <button type="button" data-demo="identify"><i class="bi bi-list-check"></i>Mark request as identified</button>
        <button type="button" data-demo="reset" class="text-danger"><i class="bi bi-arrow-counterclockwise"></i>Reset demo data</button>
        <label class="form-label small mt-2 mb-1" for="ltDemoJump">Jump to any phase</label>
        <select id="ltDemoJump" class="form-select form-select-sm"><option value="">Choose a page…</option>${pages.map(([h, l]) => `<option value="${url(h)}">${l}</option>`).join('')}</select>
        <small class="d-block mt-2 text-muted">Add <code>?demo=0</code> to the URL to hide.</small>
      </div></div>`;
  }
  async function demoAction(k, btn) {
    const s = LT.store.get();
    if (k === 'login') {
      if (s.user.loggedIn) { await LT.api.logout(); U().toast('Logged out'); return setTimeout(() => location.reload(), 400); }
      await LT.api.sendOtp('9876543210'); await LT.api.verifyOtp('9876543210', '123456'); U().toast('Logged in as Riya Malhotra'); return setTimeout(() => location.reload(), 400);
    }
    if (k === 'fresh') {
      /* brand-new account, logged in straight away: only "Self", no family / bookings / reports */
      await LT.api.logout();
      const used = LT.db.all('members').map((m) => m.owner);
      let mob; do { mob = '7' + String(Math.floor(Math.random() * 1e9)).padStart(9, '0'); } while (used.includes(mob));
      const names = ['Aarav Sharma', 'Ananya Iyer', 'Rohan Deshpande', 'Kavya Nair', 'Vikram Rathore', 'Sneha Kulkarni', 'Arjun Mehta', 'Pooja Reddy'];
      const name = names[Math.floor(Math.random() * names.length)];
      try { await LT.api.sendOtp(mob); await LT.api.verifyOtp(mob, '123456', name); } catch (e) { return U().toast(U().errMsg(e), 'danger'); }
      LT.layout.flash('Logged in as new user ' + name + ' (+91 ' + mob + ') – no family members yet', 'success');
      return setTimeout(() => location.reload(), 200);
    }
    if (k === 'mode') return switchMode();
    if (k === 'fail') { LT.api.failNext = true; return U().toast('The next API call will fail', 'warning'); }
    if (k === 'payfail') { const next = { success: 'failed', failed: 'processing', processing: 'success' }[s.payment.simulate] || 'failed'; LT.store.set({ payment: { simulate: next } }); btn.querySelector('b').textContent = next; return U().toast('Payment will be: ' + next, 'info'); }
    if (k === 'advance') {
      try { const b = await LT.api.advanceBooking(new URLSearchParams(location.search).get('id') && location.pathname.includes('appointment') ? new URLSearchParams(location.search).get('id') : null); U().toast(b.id + ' → ' + b.status.replace(/_/g, ' ').toLowerCase()); setTimeout(() => location.reload(), 600); }
      catch (e) { U().toast(U().errMsg(e), 'warning'); }
      return;
    }
    if (k === 'identify') { try { const r = await LT.api.markRequestIdentified(location.pathname.includes('my-requests') ? null : null); U().toast(r.id + ' marked as Tests identified'); setTimeout(() => location.reload(), 600); } catch (e) { U().toast(U().errMsg(e), 'warning'); } return; }
    if (k === 'reset') return resetDemo();
  }
  async function resetDemo() {
    const ok = await U().confirm({ title: 'Reset demo data?', icon: 'arrow-counterclockwise', danger: true, body: '<p>This clears your cart, bookings, members and all changes, and restores the original demo data.</p>', ok: 'Reset everything' });
    if (!ok) return;
    LT.store.reset(); sessionStorage.clear(); location.href = url('index.html');
  }

  /* ---------- flash messages across pages ---------- */
  const flash = (msg, type) => sessionStorage.setItem('lt_flash', JSON.stringify({ msg, type }));
  function showFlash() { try { const f = JSON.parse(sessionStorage.getItem('lt_flash')); if (f) { sessionStorage.removeItem('lt_flash'); setTimeout(() => U().toast(f.msg, f.type), 300); } } catch (e) { /* ignore */ } }

  /* ---------- booking-page action bar (mobile sticky; desktop lives in the aside) ---------- */
  let lastAction = null;
  function setAction(o) {
    lastAction = o;
    let bar = document.getElementById('ltActionBar');
    if (!bar) {
      bar = document.createElement('div'); bar.id = 'ltActionBar'; bar.className = 'lt-actionbar';
      bar.innerHTML = '<div class="lt-actionbar-in"><div class="lt-actionbar-txt" data-txt></div><button type="button" class="btn lt-btn" data-act></button></div>';
      document.body.appendChild(bar); document.body.classList.add('has-actionbar');
    }
    const targets = [bar.querySelector('[data-act]')].concat([...document.querySelectorAll('[data-aside-act]')]);
    bar.querySelector('[data-txt]').innerHTML = o.text || '';
    targets.forEach((b) => { b.innerHTML = o.label; b.disabled = !!o.disabled; b.onclick = o.onClick; if (o.busy) b.dataset.busy = o.busy; });
    document.querySelectorAll('[data-aside-txt]').forEach((t) => { t.innerHTML = o.hint || ''; });
  }

  /* ---------- order summary aside for booking pages ---------- */
  async function renderAside(el, o) {
    o = o || {};
    if (!el) return;
    el.innerHTML = '<div class="lt-aside-card"><h2 class="h6">Order summary</h2><div data-sum>' + '<div class="lt-skel" style="height:14px;width:70%"></div><div class="lt-skel" style="height:14px;width:50%"></div><div class="lt-skel" style="height:30px;width:60%"></div>' + '</div><button type="button" class="btn lt-btn w-100 mt-3 d-none d-lg-flex" data-aside-act>Continue</button><p class="lt-aside-hint" data-aside-txt></p></div>';
    if (lastAction) setAction(lastAction);
    const s = LT.store.get();
    try {
      const d = await LT.api.getCartDetails();
      let bill = null, lab = null;
      if (s.lab.id) { const r = await LT.api.getBillSummary(); bill = r.bill; lab = r.lab; }
      const members = s.selectedMemberIds.length;
      const row = (i, l, v) => `<li><i class="bi bi-${i}"></i><span>${l}</span><b>${v}</b></li>`;
      el.querySelector('[data-sum]').innerHTML = `<ul class="lt-sumlist">
        ${row('eyedropper', 'Tests', d.tests || d.counts.total)}${members ? row('people', 'Members', members) : ''}${row(s.mode === 'centre' ? 'hospital' : 'house-heart', 'Mode', s.mode === 'centre' ? 'Lab centre' : 'Home collection')}
        ${lab ? row('building', 'Lab', U().esc(lab.name)) : ''}${s.slot.start ? row('calendar-check', 'Slot', LT.api.slotLabel(s.slot.start)) : ''}</ul>
        <div class="lt-sumtotal">${bill ? `<span>Total payable</span><b>${U().money(bill.total)}</b>${bill.saved ? `<small class="text-success">You save ${U().money(bill.saved)}</small>` : ''}` : `<span>Estimated total</span><b>From ${U().money(d.estimate)}</b><small>Final price depends on the lab you select</small>`}</div>`;
      if (o.after) o.after({ details: d, bill, lab });
    } catch (e) { U().error(el.querySelector('[data-sum]'), { text: U().errMsg(e), onRetry: () => renderAside(el, o) }); }
  }

  /* ---------- mobile bottom app menu (every customer page; phones only – lab.css "Mobile bottom app menu") ----------
     Lab Tests · Packages · Cart (centre button + count) · Appointments · Reports. The active tab follows the page
     (booking steps highlight Cart). Not shown when a page mounts with active: ''. The cart count
     uses [data-lt-count], so updateCart() keeps it current. */
  const BNAV_TAB = { index: 'labtests', search: 'labtests', 'test-detail': 'labtests', 'prescription-upload': 'labtests', 'my-requests': 'labtests',
    packages: 'packages', cart: 'cart', 'compare-labs': 'cart', location: 'cart', slot: 'cart', summary: 'cart', confirmation: 'appointments',
    appointments: 'appointments', 'appointment-detail': 'appointments', reports: 'reports', 'report-view': 'reports' };
  function bottomNav() {
    if (document.getElementById('ltBottomNav') || !opts.active) return;
    const on = BNAV_TAB[document.body.dataset.ltPage] || opts.active;
    const tab = (k, label, href, icon) => `<a class="lt-bnav-tab ${on === k ? 'is-active' : ''}" href="${url(href)}" ${on === k ? 'aria-current="page"' : ''}><i class="bi bi-${icon}${on === k ? '-fill' : ''}" aria-hidden="true"></i><span>${label}</span></a>`;
    document.body.insertAdjacentHTML('beforeend', `<nav class="lt-bnav" id="ltBottomNav" aria-label="App menu">
      ${tab('labtests', 'Lab Tests', 'index.html', 'house-heart')}${tab('packages', 'Packages', 'packages.html', 'box2-heart')}
      <a class="lt-bnav-tab is-cart ${on === 'cart' ? 'is-active' : ''}" href="${url('cart.html')}" aria-label="Lab cart" ${on === 'cart' ? 'aria-current="page"' : ''}><span class="lt-bnav-fab"><i class="bi bi-cart3" aria-hidden="true"></i><span class="lt-bnav-badge" data-lt-count hidden>0</span></span><span>Cart</span></a>
      ${tab('appointments', 'Appointments', 'appointments.html', 'calendar-check')}${tab('reports', 'Reports', 'reports.html', 'file-earmark-medical')}</nav>`);
    document.body.classList.add('lt-has-bnav');
  }

  /* ---------- mount ---------- */
  function mount(o) {
    opts = o || {};
    document.getElementById('ltHeader').innerHTML = header();
    document.getElementById('ltFooter').innerHTML = footer();
    const main = document.getElementById('ltMain');
    main.classList.add('bys-site-wrap');
    document.body.classList.toggle('lt-has-hero', !!opts.hero);
    main.innerHTML = opts.hero ? '<div id="ltApp" class="lt-app"></div>' : `<div class="lt-container lt-top">${labBar()}${crumbs(opts.crumbs || [['Lab Tests', 'index.html'], [opts.title || 'Lab Tests', '']])}${opts.stepper ? stepper(opts.stepper) : ''}</div><div id="ltApp" class="lt-app"></div>`;
    /* site behaviour: sticky header + back-to-top */
    const hdr = document.getElementById('siteHeader'), toTop = document.getElementById('toTop');
    const onScroll = () => { const y = window.scrollY; hdr && hdr.classList.toggle('is-sticky', y > 160); toTop && toTop.classList.toggle('is-visible', y > 600); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (toTop) toTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    if (opts.showCartBar) {
      const bar = document.createElement('div');
      bar.id = 'ltCartBar'; bar.className = 'lt-cartbar'; bar.hidden = true;
      bar.innerHTML = `<div class="lt-cartbar-in"><div class="lt-cartbar-txt"><i class="bi bi-cart3"></i><div><b data-total>…</b><span><span data-n></span> <span class="lt-save" data-off></span></span></div></div><a class="btn lt-btn" href="${url('cart.html')}">View Cart <i class="bi bi-arrow-right"></i></a></div>`;
      document.body.appendChild(bar);
    }
    document.body.insertAdjacentHTML('beforeend', demoTools() + '<div class="lt-offline" id="ltOffline" role="alert" hidden><i class="bi bi-wifi-off"></i> You are offline. Changes will be saved on this device.</div>');
    bottomNav();
    if (o.title) document.title = o.title + ' – BeyondSure Lab Tests';
    bindGlobal();
    updateCart();
    showFlash();
    document.body.classList.add('is-ready');
    return document.getElementById('ltApp');
  }

  let bound = false;
  function bindGlobal() {
    if (bound) return; bound = true;
    document.addEventListener('click', async (e) => {
      const t = e.target;
      const add = t.closest('[data-add]'); if (add) { e.preventDefault(); await handleAdd(add.dataset.add, add); return; }
      if (t.closest('[data-switch-mode]')) return switchMode(t.closest('[data-switch-mode]').dataset.switchMode);
      if (t.closest('[data-toggle-mode]')) return switchMode();
      if (t.closest('[data-change-location]')) { if (LT.page && LT.page.openLocation) return LT.page.openLocation(); location.href = url('index.html?setup=location'); return; }
      const pk = t.closest('[data-pkg-open]'); if (pk) return packageDrawer(pk.dataset.pkgOpen);
      if (t.closest('[data-login], [data-register]')) { try { await U().authModal({ mode: t.closest('[data-register]') ? 'register' : 'login' }); location.reload(); } catch (er) { /* closed */ } return; }
      if (t.closest('[data-logout]')) { await LT.api.logout(); flash('You are logged out', 'info'); location.href = url('index.html'); return; }
      if (t.closest('[data-reset-demo]')) return resetDemo();
      if (t.closest('[data-family], a[href="#family"]')) {
        e.preventDefault();
        const oc = document.getElementById('ltMobileMenu'), inst = oc && bootstrap.Offcanvas.getInstance(oc);
        if (inst && oc.classList.contains('show')) { oc.addEventListener('hidden.bs.offcanvas', () => LT.members.manage(), { once: true }); inst.hide(); return; }
        return LT.members.manage();
      }
      const demoBtn = t.closest('.lt-demo-btn');
      if (demoBtn) { const p = document.getElementById('ltDemoPanel'); p.hidden = !p.hidden; demoBtn.setAttribute('aria-expanded', !p.hidden); return; }
      if (t.closest('[data-demo-close]')) { document.getElementById('ltDemoPanel').hidden = true; return; }
      const d = t.closest('[data-demo]'); if (d) return demoAction(d.dataset.demo, d);
    });
    document.addEventListener('change', (e) => { if (e.target.id === 'ltDemoJump' && e.target.value) location.href = e.target.value; });
    LT.store.subscribe(() => updateCart());
    const off = () => { const b = document.getElementById('ltOffline'); if (b) b.hidden = navigator.onLine; };
    window.addEventListener('online', off); window.addEventListener('offline', off); off();
  }

  const refreshHeader = () => { document.getElementById('ltHeader').innerHTML = header(); document.querySelectorAll('.lt-labbar').forEach((el) => { el.outerHTML = labBar(); }); updateCart(); };
  LT.layout = { labBar, refreshHeader, mount, url, site, crumbs, stepper, refresh: updateCart, syncAddButtons, switchMode, packageDrawer, flash, setAction, renderAside, STEPS };
})();
