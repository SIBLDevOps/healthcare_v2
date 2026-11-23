/* Page: lab-partner/dashboard.html – PLATFORM DEMO: lab dashboard
   Tabs: New bookings (confirm / reject) | Today's collections (assign technician, status) |
   Reports (upload per member -> progress -> Report ready) | Performance | Settlements. */
(function () {
  const { esc, money, toast, modal, skeleton, error, statusChip, errMsg, busy } = LT.ui;
  const app = LT.layout.mount({ active: '', crumbs: [['Lab Tests', 'index.html'], ['Lab dashboard (demo)', '']], title: 'Lab partner dashboard' });
  let tab = 'new', bookings = [], techs = [], settlements = [];
  const TABS = [['new', 'New bookings', 'bell'], ['today', "Today's collections", 'calendar-day'], ['reports', 'Reports', 'file-earmark-arrow-up'], ['perf', 'Performance', 'graph-up'], ['settle', 'Settlements', 'cash-stack']];

  app.innerHTML = `<div class="lt-container"><div class="lt-page-head d-flex flex-wrap justify-content-between align-items-end gap-3"><div><span class="lt-portal-badge"><i class="bi bi-building"></i> BeyondSure Care Labs – Wakad</span><h1 class="mt-2">Lab dashboard</h1><p>Manage incoming bookings, home collections and report uploads.</p></div><span class="lt-pill is-success"><i class="bi bi-circle-fill" style="font-size:8px"></i> Accepting bookings</span></div>
    <div class="lt-kpis mb-3" data-kpis></div><div class="lt-tabs" role="tablist" data-tabs></div><div data-body></div></div>`;
  const $ = (q) => app.querySelector(q);

  async function load() {
    skeleton($('[data-body]'), 'row', 3);
    try { [bookings, techs, settlements] = await Promise.all([LT.api.getLabBookings(), LT.api.getTechnicians(), LT.api.getSettlements()]); paint(); }
    catch (e) { error($('[data-body]'), { text: errMsg(e), onRetry: load }); }
  }
  function paint() {
    const k = (i, l, v) => `<div class="lt-kpi"><small><i class="bi bi-${i} text-primary"></i> ${l}</small><b>${v}</b></div>`;
    $('[data-kpis]').innerHTML = k('bell', 'New bookings', bookings.filter((b) => b.status === 'NEW').length) + k('house-heart', 'Collections today', bookings.filter((b) => ['CONFIRMED', 'SAMPLE_COLLECTED'].includes(b.status)).length) + k('hourglass-split', 'Reports pending', bookings.filter((b) => ['SAMPLE_COLLECTED', 'PROCESSING'].includes(b.status)).length) + k('currency-rupee', "Today's revenue", money(bookings.filter((b) => b.status !== 'REJECTED').reduce((t, b) => t + b.amount, 0)));
    $('[data-tabs]').innerHTML = TABS.map(([key, l, i]) => `<button role="tab" data-tab="${key}" aria-selected="${key === tab}"><i class="bi bi-${i}"></i>${l}</button>`).join('');
    const body = $('[data-body]');
    const card = (b, acts) => `<article class="lt-card"><div class="lt-bk-top"><div class="d-flex flex-wrap gap-2 align-items-center"><span class="lt-bk-id">${esc(b.id)}</span>${statusChip(b.status)}<span class="lt-pill"><i class="bi bi-${b.mode === 'home' ? 'house-heart' : 'hospital'}"></i>${esc(b.area)}</span></div><b class="lt-ink">${money(b.amount)}</b></div>
      <div class="lt-bk-grid"><div><i class="bi bi-people"></i><span>Members<b>${b.members.map(esc).join(', ')}</b></span></div><div><i class="bi bi-cart3"></i><span>Tests<b>${b.tests.map(esc).join(', ')}</b></span></div><div><i class="bi bi-clock"></i><span>Slot<b>${esc(b.slot)}</b></span></div>${b.technician ? `<div><i class="bi bi-person-badge"></i><span>Technician<b>${esc(b.technician)}</b></span></div>` : ''}</div><div class="lt-acts">${acts}</div></article>`;
    if (tab === 'new') {
      const list = bookings.filter((b) => b.status === 'NEW');
      body.innerHTML = list.length ? `<div class="d-grid gap-3">${list.map((b) => card(b, `<button type="button" class="btn lt-btn lt-btn-sm" data-confirm="${b.id}">Confirm</button><button type="button" class="btn lt-btn-ghost lt-btn-sm text-danger" data-reject="${b.id}">Reject</button>`)).join('')}</div>` : '';
      if (!list.length) LT.ui.empty(body, { icon: 'calendar', title: 'No new bookings', text: 'New bookings from patients appear here.' });
    }
    if (tab === 'today') {
      const list = bookings.filter((b) => ['CONFIRMED', 'SAMPLE_COLLECTED'].includes(b.status) && b.mode === 'home');
      body.innerHTML = list.length ? `<div class="d-grid gap-3">${list.map((b) => card(b, `<label class="visually-hidden" for="tc-${b.id}">Technician</label><select id="tc-${b.id}" class="form-select form-select-sm" style="width:auto;min-height:38px" data-tech="${b.id}"><option value="">Assign technician</option>${techs.map((t) => `<option ${b.technician === t ? 'selected' : ''}>${t}</option>`).join('')}</select>${b.status === 'CONFIRMED' ? `<button type="button" class="btn lt-btn lt-btn-sm" data-status="${b.id}|SAMPLE_COLLECTED" ${b.technician ? '' : 'disabled'}>Mark sample collected</button>` : `<button type="button" class="btn lt-btn lt-btn-sm" data-status="${b.id}|PROCESSING">Received at lab</button>`}`)).join('')}</div>` : '';
      if (!list.length) LT.ui.empty(body, { icon: 'calendar', title: 'No collections pending today' });
    }
    if (tab === 'reports') {
      const list = bookings.filter((b) => ['SAMPLE_COLLECTED', 'PROCESSING', 'REPORT_READY'].includes(b.status));
      body.innerHTML = `<div class="d-grid gap-3">${list.map((b) => `<article class="lt-card"><div class="lt-bk-top"><div class="d-flex gap-2 align-items-center"><span class="lt-bk-id">${esc(b.id)}</span>${statusChip(b.status)}</div></div>
        ${b.members.map((m, i) => `<div class="d-flex flex-wrap gap-2 align-items-center py-2 border-top mt-2"><b class="lt-ink flex-grow-1">${esc(m)} <small class="fw-normal lt-muted">· ${b.tests.map(esc).join(', ')}</small></b>${b.status === 'REPORT_READY' ? '<span class="lt-pill is-success"><i class="bi bi-check2-circle"></i>Report ready</span>' : `<div class="d-flex gap-2 align-items-center"><div class="lt-progress" style="width:120px;margin:0" hidden data-pg="${b.id}-${i}"><i></i></div><button type="button" class="btn lt-btn-outline lt-btn-sm" data-upload="${b.id}|${i}"><i class="bi bi-upload"></i> Upload report</button></div>`}</div>`).join('')}</article>`).join('')}</div>`;
    }
    if (tab === 'perf') body.innerHTML = `<div class="lt-kpis">${[['star-fill', 'Patient rating', '4.9 / 5', 98], ['stopwatch', 'TAT adherence', '96%', 96], ['check2-all', 'Collections on time', '93%', 93], ['arrow-repeat', 'Repeat patients', '41%', 41]].map(([i, l, v, p]) => `<div class="lt-kpi"><small><i class="bi bi-${i} text-primary"></i> ${l}</small><b>${v}</b><div class="lt-meter"><i style="width:${p}%"></i></div></div>`).join('')}</div><div class="lt-card mt-3"><h2 class="h6 fw-bold">Last 7 days bookings</h2><div class="d-flex align-items-end gap-2 mt-3" style="height:140px" role="img" aria-label="Bar chart of bookings in the last 7 days">${[18, 24, 21, 30, 27, 34, 29].map((n, i) => `<div class="flex-fill text-center"><div style="height:${n * 3.6}px;background:linear-gradient(180deg,var(--lt-primary),#7ea6f6);border-radius:8px 8px 0 0"></div><small>${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</small></div>`).join('')}</div></div>`;
    if (tab === 'settle') body.innerHTML = `<div class="lt-table-wrap"><table class="lt-table is-stack"><thead><tr><th scope="col">Settlement</th><th scope="col">Period</th><th scope="col">Bookings</th><th scope="col">Gross</th><th scope="col">Commission</th><th scope="col">Net payout</th><th scope="col">Status</th></tr></thead><tbody>${settlements.map((s) => `<tr><td class="fw-bold">${s.id}</td><td data-l="Period">${s.period}</td><td data-l="Bookings">${s.bookings}</td><td data-l="Gross">${money(s.gross)}</td><td data-l="Commission">- ${money(s.commission)}</td><td data-l="Net"><b>${money(s.net)}</b></td><td data-l="Status"><span class="lt-pill ${s.status === 'Paid' ? 'is-success' : 'is-warn'}">${s.status}</span></td></tr>`).join('')}</tbody></table></div>`;
  }
  const update = async (id, patch, msg) => { await LT.api.updateLabBooking(id, patch); bookings = await LT.api.getLabBookings(); toast(msg); paint(); };
  app.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; paint(); return; }
    const c = e.target.closest('[data-confirm]'); if (c) return update(c.dataset.confirm, { status: 'CONFIRMED' }, c.dataset.confirm + ' confirmed');
    const r = e.target.closest('[data-reject]'); if (r) {
      const md = modal.open({ title: 'Reject ' + r.dataset.reject, body: '<label class="form-label" for="rjR">Reason</label><select id="rjR" class="form-select"><option>No technician available in this slot</option><option>Test not available today</option><option>Area outside our zone</option><option>Other</option></select>', footer: '<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn lt-btn-danger" data-ok>Reject booking</button>' });
      md.$('[data-ok]').onclick = () => { md.close(); update(r.dataset.reject, { status: 'REJECTED', rejectReason: md.$('#rjR').value }, 'Booking rejected – patient will be offered another lab'); };
      return;
    }
    const s = e.target.closest('[data-status]'); if (s) { const [id, st] = s.dataset.status.split('|'); return update(id, { status: st }, id + ' → ' + st.replace(/_/g, ' ').toLowerCase()); }
    const u = e.target.closest('[data-upload]'); if (u) {
      const [id, i] = u.dataset.upload.split('|');
      const pg = app.querySelector(`[data-pg="${id}-${i}"]`); pg.hidden = false; u.disabled = true;
      requestAnimationFrame(() => { pg.querySelector('i').style.transition = 'width 1.4s linear'; pg.querySelector('i').style.width = '100%'; });
      await busy(u, () => new Promise((ok) => setTimeout(ok, 1500)));
      const b = bookings.find((x) => x.id === id); b.uploaded = (b.uploaded || 0) + 1;
      if (b.uploaded >= b.members.length) { await LT.api.uploadReportDemo(id); bookings = await LT.api.getLabBookings(); toast('All reports uploaded – status: Report ready'); paint(); }
      else { await LT.api.updateLabBooking(id, { uploaded: b.uploaded }); u.outerHTML = '<span class="lt-pill is-success"><i class="bi bi-check2-circle"></i>Uploaded</span>'; pg.remove(); toast('Report uploaded for ' + b.members[+i]); }
    }
  });
  app.addEventListener('change', (e) => { const t = e.target.closest('[data-tech]'); if (t && t.value) update(t.dataset.tech, { technician: t.value }, t.value + ' assigned'); });
  load();
})();
