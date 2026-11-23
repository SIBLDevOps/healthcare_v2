/* Page: my-requests.html – My Prescription Requests (account area)
   Tabs: All | Action needed | In review | Confirmed. Detail drawer with status timeline and
   identified tests (untick / replace / add). Confirm -> api.confirmRequest + convertRequestToCart -> cart.html */
(function () {
  const { esc, money, toast, modal, skeleton, empty, error, statusChip, date, busy, errMsg, param, debounce } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'labtests', crumbs: [['Lab Tests', 'index.html'], ['My Prescription Requests', '']], showCartBar: true });
  const TABS = [['all', 'All', null], ['action', 'Action needed', ['TESTS_IDENTIFIED', 'NEEDS_CLARIFICATION']], ['review', 'In review', ['SUBMITTED', 'UNDER_REVIEW']], ['done', 'Confirmed', ['USER_CONFIRMED', 'CONVERTED']]];
  const FLOW = [['SUBMITTED', 'Submitted'], ['UNDER_REVIEW', 'Under review'], ['TESTS_IDENTIFIED', 'Tests identified'], ['USER_CONFIRMED', 'Confirmed'], ['CONVERTED', 'Booked']];
  let tab = 'all', list = [];

  app.innerHTML = `<div class="lt-container"><div class="lt-page-head d-flex flex-wrap justify-content-between align-items-end gap-3"><div><h1>My Prescription Requests</h1><p>Track prescriptions you uploaded. Confirm the identified tests to add them to your cart.</p></div>
    <a class="btn lt-btn" href="${url('prescription-upload.html')}"><i class="bi bi-file-earmark-arrow-up"></i> Upload new</a></div>
    <div class="lt-tabs" role="tablist" data-tabs></div><div data-list class="d-grid gap-3"></div>
    <p class="text-center mt-4 small"><button type="button" class="lt-linkbtn" data-sim>Simulate: mark a request as identified</button></p></div>`;
  const $ = (q) => app.querySelector(q);

  async function load() {
    if (!LT.store.get().user.loggedIn) {
      return empty($('[data-list]'), { icon: 'doc', title: 'Log in to see your requests', text: 'Your prescription requests are saved to your account.', actions: [{ label: 'Log in', onClick: async () => { try { await LT.ui.authModal(); location.reload(); } catch (e) { /* closed */ } } }] });
    }
    skeleton($('[data-list]'), 'row', 3);
    try {
      list = await LT.api.getRequests(); paint(); if (param('open')) detail(param('open'));
      const nw = param('new'); const card = nw && document.getElementById('req-' + nw);
      if (card) { setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200); toast('Request ' + nw + ' submitted – our team will call you soon'); }
    }
    catch (e) { error($('[data-list]'), { text: errMsg(e), onRetry: load }); }
  }
  function paint() {
    $('[data-tabs]').innerHTML = TABS.map(([k, l, st]) => `<button role="tab" data-tab="${k}" aria-selected="${k === tab}">${l} <span class="lt-count">${list.filter((r) => !st || st.includes(r.status)).length}</span></button>`).join('');
    const st = TABS.find((t) => t[0] === tab)[2];
    const rows = list.filter((r) => !st || st.includes(r.status));
    if (!rows.length) return empty($('[data-list]'), { icon: 'doc', title: tab === 'all' ? 'No requests yet' : 'Nothing here right now', text: 'Upload a prescription and we will identify the tests for you.', actions: [{ label: 'Upload prescription', href: url('prescription-upload.html') }] });
    $('[data-list]').innerHTML = rows.map((r) => {
      const acts = {
        TESTS_IDENTIFIED: `<button type="button" class="btn lt-btn lt-btn-sm" data-open="${r.id}">Confirm &amp; Continue Booking</button>`,
        NEEDS_CLARIFICATION: `<a class="btn lt-btn lt-btn-sm" href="${url('prescription-upload.html')}">Re-upload</a><button type="button" class="btn lt-btn-outline lt-btn-sm" data-details="${r.id}">Add details</button>`,
        SUBMITTED: `<button type="button" class="btn lt-btn-outline lt-btn-sm" data-open="${r.id}">View</button>`,
        UNDER_REVIEW: `<button type="button" class="btn lt-btn-outline lt-btn-sm" data-open="${r.id}">View</button>`,
        USER_CONFIRMED: `<a class="btn lt-btn lt-btn-sm" href="${url('cart.html')}">Go to cart</a><button type="button" class="btn lt-btn-ghost lt-btn-sm" data-open="${r.id}">View</button>`,
        CONVERTED: `<a class="btn lt-btn-outline lt-btn-sm" href="${url('appointment-detail.html?id=' + r.bookingId)}">View booking</a>`
      }[r.status] || `<button type="button" class="btn lt-btn-outline lt-btn-sm" data-open="${r.id}">View</button>`;
      return `<article class="lt-card lt-card-hover lt-req ${r.id === param('new') ? 'is-new' : ''}" id="req-${r.id}"><button type="button" class="lt-req-thumb p-0" data-open="${r.id}" aria-label="Open request ${r.id}"><img src="${r.thumbnail}" alt=""></button>
        <div><div class="d-flex flex-wrap gap-2 align-items-center"><h3 class="mb-0">${esc(r.id)}</h3>${statusChip(r.status)}</div>
          <div class="lt-req-meta"><span><i class="bi bi-calendar3"></i>${date(r.createdAt)}</span>${(r.files || []).length > 1 ? `<span><i class="bi bi-images"></i>${r.files.length} pages</span>` : ''}<span><i class="bi bi-person-badge"></i>${esc(r.doctor)}</span>${r.member ? `<span><i class="bi bi-person"></i>${esc(r.member.name)}</span>` : ''}${r.items.length ? `<span><i class="bi bi-list-check"></i>${r.items.length} test${r.items.length > 1 ? 's' : ''}</span>` : ''}</div>
          ${['SUBMITTED', 'UNDER_REVIEW'].includes(r.status) ? `<p class="small mt-2 mb-0"><i class="bi bi-telephone text-primary"></i> Our team will call you${r.callbackMobile ? ' on +91 ' + esc(r.callbackMobile) : ''}${r.callbackTime ? ' · ' + esc(r.callbackTime.split(' (')[0]) : ''} to confirm your tests.</p>` : r.note ? `<p class="small mt-2 mb-0">${esc(r.note)}</p>` : ''}</div>
        <div class="lt-req-acts">${acts}</div></article>`;
    }).join('');
  }
  app.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; paint(); return; }
    const o = e.target.closest('[data-open]'); if (o) return detail(o.dataset.open);
    const d = e.target.closest('[data-details]'); if (d) return addDetails(d.dataset.details);
    if (e.target.closest('[data-sim]')) { try { const r = await LT.api.markRequestIdentified(); toast(r.id + ' is now “Tests identified”'); load(); } catch (er) { toast(errMsg(er), 'warning'); } }
  });

  function addDetails(id) {
    const md = modal.open({ title: 'Add details for ' + id, body: '<label class="form-label" for="adTxt">Tell us the test names or anything that helps</label><textarea id="adTxt" class="form-control" rows="4" placeholder="e.g. Second line is Vitamin B12"></textarea>', footer: '<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn lt-btn" data-ok data-busy="Sending…">Send</button>' });
    md.$('[data-ok]').onclick = async (e) => {
      const v = md.$('#adTxt').value.trim(); if (v.length < 3) return md.$('#adTxt').classList.add('is-invalid');
      await busy(e.currentTarget, () => LT.api.updateRequest(id, { status: 'UNDER_REVIEW', note: 'You added: “' + v + '”. Our team is reviewing it.' }));
      md.close(); toast('Details sent. We will update you shortly.'); load();
    };
  }

  async function detail(id) {
    const el = document.createElement('div');
    el.className = 'offcanvas offcanvas-end lt-drawer'; el.tabIndex = -1; el.setAttribute('aria-label', 'Request ' + id);
    el.innerHTML = `<div class="offcanvas-header"><h2 class="h5 mb-0">Request ${esc(id)}</h2><button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button></div><div class="offcanvas-body" data-b></div>`;
    document.body.appendChild(el);
    const oc = new bootstrap.Offcanvas(el); oc.show(); el.addEventListener('hidden.bs.offcanvas', () => el.remove());
    const b = el.querySelector('[data-b]'); skeleton(b, 'block', 2);
    try {
      const r = await LT.api.getRequest(id);
      let ids = r.items.map((i) => i.matchedTestId).filter(Boolean);
      const items = await LT.api.getItems(ids);
      const idx = Math.max(0, FLOW.findIndex((f) => f[0] === r.status));
      const editable = r.status === 'TESTS_IDENTIFIED';
      const draw = (tests) => `<div class="lt-rx-gallery">${(r.thumbnails || [r.thumbnail]).map((t, i) => `<a href="${t}" target="_blank" rel="noopener" aria-label="Open page ${i + 1}"><img src="${t}" alt="Prescription page ${i + 1}"></a>`).join('')}</div>
        ${r.callbackMobile ? `<div class="lt-alert is-info mt-3"><i class="bi bi-telephone"></i><div><strong>Callback</strong><br>+91 ${esc(r.callbackMobile)} · ${esc(r.callbackTime || 'Anytime')}${r.mode ? ' · ' + (r.mode === 'centre' ? 'Lab centre visit' : 'Home collection') : ''}${r.notes ? '<br><span class="small">Your note: “' + esc(r.notes) + '”</span>' : ''}</div></div>` : ''}
        <div class="d-flex flex-wrap gap-2 align-items-center mt-3">${statusChip(r.status)}<small>${date(r.createdAt)} · ${esc(r.doctor)}</small></div>
        <h3 class="h6 fw-bold mt-4">Status</h3><ol class="lt-tl mt-2">${(r.status === 'NEEDS_CLARIFICATION' ? [['SUBMITTED', 'Submitted'], ['NEEDS_CLARIFICATION', 'Needs clarification']] : FLOW).map((f, i, arr) => { const cur = r.status === 'NEEDS_CLARIFICATION' ? 1 : idx; return `<li class="${i < cur ? 'is-done' : i === cur ? 'is-current is-done' : ''}"><span class="lt-tl-dot">${i <= cur ? '<i class="bi bi-check-lg"></i>' : i + 1}</span><strong>${f[1]}</strong></li>`; }).join('')}</ol>
        ${r.note ? `<div class="lt-alert ${r.status === 'NEEDS_CLARIFICATION' ? 'is-danger' : 'is-info'}"><i class="bi bi-chat-left-text"></i><div><strong>Note from reviewer</strong><br>${esc(r.note)}</div></div>` : ''}
        <h3 class="h6 fw-bold mt-4">Identified tests</h3>
        ${tests.length ? `<div data-tests>${tests.map((t) => `<div class="lt-ocr-row"><label><input class="form-check-input mt-1" type="checkbox" value="${t.id}" checked ${editable ? '' : 'disabled'}><span>${esc(t.name)}<small>From ${money(t.fromPrice)}</small></span></label>${editable ? `<button type="button" class="btn lt-btn-ghost lt-btn-sm" data-rep="${t.id}">Replace</button>` : ''}</div>`).join('')}</div>` : '<p class="small">No tests identified yet. We will notify you once our team has reviewed the prescription.</p>'}
        ${editable ? `<button type="button" class="btn lt-btn-ghost w-100 mt-2" data-addt><i class="bi bi-plus-lg"></i> Add a test</button><div class="lt-drawer-foot"><small>Tests go to your cart and merge with any manual tests.</small><button type="button" class="btn lt-btn" data-confirm data-busy="Adding…">Confirm &amp; Continue Booking</button></div>` : ''}
        ${r.status === 'USER_CONFIRMED' ? `<a class="btn lt-btn w-100 mt-3" href="${url('cart.html')}">Go to cart</a>` : ''}`;
      let tests = items;
      const paintD = () => {
        b.innerHTML = draw(tests);
        const pick = (title, cb) => LT.page.pickTest(title, cb);
        b.querySelectorAll('[data-rep]').forEach((x) => { x.onclick = () => pick('Replace test', (t) => { tests = tests.map((y) => (y.id === x.dataset.rep ? t : y)); paintD(); }); });
        const add = b.querySelector('[data-addt]'); if (add) add.onclick = () => pick('Add a test', (t) => { if (!tests.some((y) => y.id === t.id)) tests.push(t); paintD(); });
        const c = b.querySelector('[data-confirm]');
        if (c) c.onclick = async (e) => {
          const sel = [...b.querySelectorAll('[data-tests] input:checked')].map((i) => i.value);
          if (!sel.length) return toast('Keep at least one test to continue', 'warning');
          try {
            await busy(e.currentTarget, async () => { await LT.api.confirmRequest(id, sel); await LT.api.convertRequestToCart(id); });
            LT.layout.flash('Tests added to your cart (duplicates merged)');
            location.href = url('cart.html');
          } catch (er) { toast(errMsg(er), 'danger'); }
        };
      };
      paintD();
    } catch (e) { error(b, { text: errMsg(e) }); }
  }
  LT.page = {
    pickTest(title, onPick) {
      const md = modal.open({ title, body: '<div class="lt-searchbox" style="box-shadow:none"><i class="bi bi-search"></i><label class="visually-hidden" for="ptq">Search</label><input id="ptq" type="search" placeholder="Type a test name"></div><div class="mt-3" data-r></div>', onOpen: (el) => el.querySelector('#ptq').focus() });
      const run = async () => { const r = await LT.api.searchTests({ q: md.$('#ptq').value, pageSize: 8 }); md.$('[data-r]').innerHTML = r.items.map((t) => `<div class="lt-ocr-row"><span class="flex-grow-1"><b class="lt-ink">${esc(t.name)}</b><small class="d-block">From ${money(t.fromPrice)}</small></span><button type="button" class="btn lt-add lt-btn-sm" data-p="${t.id}">Select</button></div>`).join('') || '<p class="small">No match.</p>'; md.$('[data-r]').onclick = (e) => { const x = e.target.closest('[data-p]'); if (x) { onPick(r.items.find((i) => i.id === x.dataset.p)); md.close(); } }; };
      md.$('#ptq').addEventListener('input', debounce(run, 250)); run();
    }
  };
  load();
})();
