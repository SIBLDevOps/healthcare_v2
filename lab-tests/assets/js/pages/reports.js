/* Page: reports.html – PHASE 19 My Reports
   Reports are PDF files shared by the lab (one PDF per test / package). One open / close panel per family member
   (FAQ style, like Compare labs and Appointment detail): closed = name, relationship, number of reports, latest
   date, out-of-range count and status; open = every report (name, parameters, lab, date, booking, result chips,
   "PDF · N pages", View in a new tab / PDF download) and reports not ready yet (status + Track).
   Member filter tabs and a summary strip stay on top. */
(function () {
  const { esc, skeleton, empty, error, avatar, date, errMsg, param, statusChip } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'reports', crumbs: [['Lab Tests', 'index.html'], ['My Reports', '']], title: 'My Reports' });
  let member = param('member') || 'all', members = [], reports = [], pending = [];

  app.innerHTML = `<div class="lt-container"><div class="lt-page-head"><h1>My Reports</h1><p>Labs share every report as a PDF file. View it here or download it to keep a copy – each family member gets their own reports.</p></div>
    <div class="lt-tabs" role="tablist" aria-label="Filter by family member" data-tabs></div><div data-sum></div><div data-list></div></div>`;
  const $ = (q) => app.querySelector(q);

  async function load() {
    if (!LT.store.get().user.loggedIn) return empty($('[data-list]'), { icon: 'report', title: 'Log in to see your reports', text: 'Reports are protected and only visible to you.', actions: [{ label: 'Log in', onClick: async () => { try { await LT.ui.authModal(); location.reload(); } catch (e) { /* closed */ } } }] });
    skeleton($('[data-list]'), 'row', 3);
    try { [members, reports, pending] = await Promise.all([LT.api.getMembers(), LT.api.getReports('all'), LT.api.getPendingReports()]); paint(); }
    catch (e) { error($('[data-list]'), { text: errMsg(e), onRetry: load }); }
  }

  const fileCount = (rs) => rs.reduce((n, r) => n + r.files.length, 0);
  const result = (f) => (f.abnormal ? `<span class="lt-rchip is-abnormal"><i class="bi bi-arrow-up-circle-fill"></i>${f.abnormal} out of range</span>` : '')
    + (f.borderline ? `<span class="lt-rchip is-borderline"><i class="bi bi-exclamation-circle-fill"></i>${f.borderline} borderline</span>` : '')
    + (!f.abnormal && !f.borderline ? '<span class="lt-rchip is-normal"><i class="bi bi-check-circle-fill"></i>All normal</span>' : '');

  /* one report PDF inside a member panel */
  function row(r, f) {
    return `<li class="lt-mr-test is-ready">
      <span class="lt-mr-ico" aria-hidden="true"><i class="bi bi-file-earmark-medical-fill"></i></span>
      <div class="lt-mr-tmain"><a class="lt-rp-link" href="${url('report-view.html?id=' + r.id + '&file=' + encodeURIComponent(f.id))}">${esc(f.name)}</a>
        <small>${f.params} parameter${f.params > 1 ? 's' : ''} · ${esc(r.lab.name)} · ${date(r.date)} · Booking ${esc(r.bookingId)}</small>
        <div class="lt-mr-tstate">${result(f)}<span class="lt-mr-note is-pdf"><i class="bi bi-file-earmark-pdf" aria-hidden="true"></i> PDF · ${f.pages || 1} page${(f.pages || 1) > 1 ? 's' : ''}</span></div></div>
      <div class="lt-mr-acts"><button type="button" class="btn lt-btn lt-btn-sm" data-view="${r.id}|${esc(f.id)}" data-busy="Opening…" aria-label="View ${esc(f.name)} report (opens in a new tab)" title="Opens the PDF in a new tab"><i class="bi bi-eye"></i><span>View</span></button><button type="button" class="btn lt-btn-outline lt-btn-sm" data-dl="${r.id}|${esc(f.id)}" data-busy="Preparing…" aria-label="Download ${esc(f.name)} report as PDF"><i class="bi bi-download"></i><span>PDF</span></button></div>
    </li>`;
  }
  /* tests of a booking whose report is not ready yet */
  const waitRow = (pd) => `<li class="lt-mr-test">
      <span class="lt-mr-ico" aria-hidden="true"><i class="bi bi-hourglass-split"></i></span>
      <div class="lt-mr-tmain"><b>${esc(pd.tests.join(', '))}</b><small>${esc(pd.lab)} · Booking ${esc(pd.bookingId)}</small>
        <div class="lt-mr-tstate">${statusChip(pd.status)}<span class="lt-mr-note"><i class="bi bi-clock-history" aria-hidden="true"></i> Report not ready yet – we will SMS you</span></div></div>
      <div class="lt-mr-acts"><a class="btn lt-btn-outline lt-btn-sm" href="${url('appointment-detail.html?id=' + pd.bookingId)}"><i class="bi bi-geo"></i><span>Track</span></a></div>
    </li>`;

  function paint() {
    const counts = { all: fileCount(reports) };
    members.forEach((m) => { counts[m.id] = fileCount(reports.filter((r) => r.memberId === m.id)); });
    $('[data-tabs]').innerHTML = [{ id: 'all', name: 'All' }].concat(members).map((m) => `<button role="tab" data-m="${m.id}" aria-selected="${m.id === member}">${m.id === 'all' ? '<i class="bi bi-people"></i>' : avatar(m.name, null, 'sm')} ${esc(m.id === 'all' ? 'All' : m.name.split(' ')[0])} <span class="lt-count">${counts[m.id] || 0}</span></button>`).join('');

    const show = members.filter((m) => member === 'all' || m.id === member);
    const vis = reports.filter((r) => show.some((m) => m.id === r.memberId)), visPend = pending.filter((p) => show.some((m) => m.id === p.memberId));
    $('[data-sum]').innerHTML = vis.length || visPend.length ? `<div class="lt-rp-sum"><span><i class="bi bi-file-earmark-pdf"></i><b>${fileCount(vis)}</b> report${fileCount(vis) === 1 ? '' : 's'} ready</span>${visPend.length ? `<span><i class="bi bi-hourglass-split"></i><b>${visPend.length}</b> waiting for the lab</span>` : ''}<span class="lt-rp-sum-tip"><i class="bi bi-shield-lock"></i> Only you can see these reports</span></div>` : '';

    let firstPanel = true;
    const blocks = show.map((m) => {
      const rs = reports.filter((r) => r.memberId === m.id).sort((x, y) => new Date(y.date) - new Date(x.date)), pd = pending.filter((p) => p.memberId === m.id);
      if (!rs.length && !pd.length) return '';
      const n = fileCount(rs), flagged = rs.reduce((s, r) => s + r.files.reduce((k, f) => k + f.abnormal, 0), 0);
      const sub = [n ? n + ' report' + (n === 1 ? '' : 's') : '', rs.length ? 'latest ' + date(rs[0].date, { day: 'numeric', month: 'short' }) : '', pd.length ? pd.length + ' waiting' : ''].filter(Boolean).join(' · ')
        + (flagged ? ' · <span class="text-danger">' + flagged + ' out of range</span>' : '');
      const state = n ? '<span class="lt-pill is-success"><i class="bi bi-check2-circle"></i>Reports ready</span>' : '<span class="lt-pill is-warn"><i class="bi bi-hourglass-split"></i>In progress</span>';
      const open = firstPanel || member !== 'all'; firstPanel = false;
      return `<details class="lt-acc lt-mr" ${open ? 'open' : ''}>
        <summary class="lt-acc-sum">${avatar(m.name, LT.members ? LT.members.color(m.id) : null, 'sm')}
          <span class="lt-acc-txt"><b>${esc(m.name)} <span class="lt-mr-rel">${esc(m.relationship)}</span></b><small>${sub}</small></span>
          <span class="lt-mr-state">${state}</span>
          <span class="lt-acc-chev" aria-hidden="true"><i class="bi bi-chevron-down"></i></span></summary>
        <div class="lt-acc-body"><ul class="lt-mr-tests">${rs.map((r) => r.files.map((f) => row(r, f)).join('')).join('')}${pd.map(waitRow).join('')}</ul></div>
      </details>`;
    }).join('');
    if (!blocks) return empty($('[data-list]'), { icon: 'report', title: 'No reports yet', text: 'Reports appear here as soon as the lab shares the PDF. We will also SMS you.', actions: [{ label: 'Book a test', href: url('search.html') }] });
    $('[data-list]').innerHTML = `<div class="lt-mr-list lt-rp-panels">${blocks}</div>`;
  }

  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-m]'); if (t) { member = t.dataset.m; paint(); return; }
    const v = e.target.closest('[data-view]');
    if (v) { const [rid, fid] = v.dataset.view.split('|'); LT.reportPdf.openTab(rid, fid, v); return; } // opens the PDF in a new tab
    const d = e.target.closest('[data-dl]');
    if (d) { const [rid, fid] = d.dataset.dl.split('|'); LT.reportPdf.download(rid, fid, d); }
  });
  load();
})();
