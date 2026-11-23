/* Page: appointments.html – PHASE 15 My Appointments
   Tabs Upcoming | Completed | Cancelled with booking cards and quick actions. */
(function () {
  const { esc, money, skeleton, empty, error, statusChip, avatar, errMsg, param, labLogo } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'appointments', crumbs: [['Lab Tests', 'index.html'], ['My Appointments', '']], title: 'My Appointments' });
  const TABS = [['upcoming', 'Upcoming', (b) => b.isUpcoming], ['completed', 'Completed', (b) => ['REPORT_READY', 'COMPLETED'].includes(b.status)], ['cancelled', 'Cancelled', (b) => b.status === 'CANCELLED']];
  let tab = param('tab') || 'upcoming', list = [];

  app.innerHTML = `<div class="lt-container"><div class="lt-page-head d-flex flex-wrap justify-content-between align-items-end gap-3"><div><h1>My Appointments</h1><p>Track sample collection, lab processing and reports for every booking.</p></div><a class="btn lt-btn" href="${url('search.html')}"><i class="bi bi-plus-lg"></i> Book a test</a></div>
    <div class="lt-tabs" role="tablist" data-tabs></div><div class="d-grid gap-3" data-list></div></div>`;
  const $ = (q) => app.querySelector(q);

  async function load() {
    if (!LT.store.get().user.loggedIn) return empty($('[data-list]'), { icon: 'calendar', title: 'Log in to see your appointments', text: 'All your lab bookings in one place.', actions: [{ label: 'Log in', onClick: async () => { try { await LT.ui.authModal(); location.reload(); } catch (e) { /* closed */ } } }] });
    skeleton($('[data-list]'), 'block', 3);
    try { list = await LT.api.getBookings(); paint(); } catch (e) { error($('[data-list]'), { text: errMsg(e), onRetry: load }); }
  }
  function paint() {
    $('[data-tabs]').innerHTML = TABS.map(([k, l, f]) => `<button role="tab" data-tab="${k}" aria-selected="${k === tab}">${l} <span class="lt-count">${list.filter(f).length}</span></button>`).join('');
    const rows = list.filter(TABS.find((t) => t[0] === tab)[2]);
    if (!rows.length) return empty($('[data-list]'), { icon: 'calendar', title: { upcoming: 'No upcoming appointments', completed: 'No completed bookings yet', cancelled: 'No cancelled bookings' }[tab], text: tab === 'upcoming' ? 'Book a test and it will show up here with live tracking.' : '', actions: tab === 'upcoming' ? [{ label: 'Book a test', href: url('search.html') }] : [] });
    $('[data-list]').innerHTML = rows.map((b) => {
      const tests = [...new Set(b.membersView.flatMap((m) => m.tests.map((t) => t.name)))];
      const dirUrl = b.centre ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(b.centre.name + ', ' + b.centre.address) : '';
      return `<article class="lt-card lt-card-hover"><div class="lt-bk-top"><div class="d-flex gap-2 align-items-center flex-wrap"><span class="lt-bk-id">${esc(b.id)}</span>${statusChip(b.status)}<span class="lt-pill"><i class="bi bi-${b.mode === 'home' ? 'house-heart' : 'hospital'}"></i>${b.mode === 'home' ? 'Home collection' : 'Centre visit'}</span></div><span class="lt-avstack">${b.membersView.map((m) => avatar(m.name, null, 'sm')).join('')}</span></div>
        <div class="lt-bk-grid"><div><i class="bi bi-cart3"></i><span>Tests<b>${esc(tests.slice(0, 2).join(', '))}${tests.length > 2 ? ` +${tests.length - 2} more` : ''}</b></span></div><div><i class="bi bi-building"></i><span>Lab<b>${esc(b.lab.name)}</b></span></div><div><i class="bi bi-calendar-event"></i><span>Slot<b>${esc(b.slotLabel)}</b></span></div><div><i class="bi bi-currency-rupee"></i><span>${b.membersView.length} member${b.membersView.length > 1 ? 's' : ''}<b>${money(b.bill.total)}</b></span></div></div>
        ${b.status === 'CANCELLED' && b.cancel ? `<p class="small mb-2"><i class="bi bi-arrow-counterclockwise text-primary"></i> Refund ${b.cancel.refundPct}% · ${esc(b.cancel.refundStatus)}</p>` : ''}
        <div class="lt-acts"><a class="btn lt-btn lt-btn-sm" href="${url('appointment-detail.html?id=' + b.id)}">View</a>
          ${b.isUpcoming ? `<a class="btn lt-btn-outline lt-btn-sm ${b.canChange ? '' : 'disabled'}" href="${url('appointment-detail.html?id=' + b.id + '&action=reschedule')}" ${b.canChange ? '' : 'aria-disabled="true"'}>Reschedule</a><a class="btn lt-btn-ghost lt-btn-sm text-danger" href="${url('appointment-detail.html?id=' + b.id + '&action=cancel')}">Cancel</a>` : ''}
          ${b.centre && b.isUpcoming ? `<a class="btn lt-btn-ghost lt-btn-sm" href="${dirUrl}" target="_blank" rel="noopener"><i class="bi bi-sign-turn-right"></i> Directions</a>` : ''}
          ${b.status === 'REPORT_READY' ? `<a class="btn lt-btn-outline lt-btn-sm" href="${url('reports.html')}"><i class="bi bi-file-earmark-medical"></i> Report</a>` : ''}</div></article>`;
    }).join('');
  }
  app.addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; paint(); } });
  load();
})();
