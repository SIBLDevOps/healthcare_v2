/* Page: reports.html – PHASE 19 My Reports
   Reports are PDF files shared by the lab (one PDF per test). The page lists them per family member as
   Report name | Lab & date | Result | View / Download. View opens the PDF directly in a new browser tab,
   Download saves the PDF. Member filter tabs + reports that are not ready yet. */
(function () {
  const { esc, skeleton, empty, error, avatar, date, errMsg, param, labLogo } = LT.ui;
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

  function row(r, f) {
    return `<div class="lt-rp-row" role="row">
      <div class="lt-rp-name" role="cell"><span class="lt-rp-pdf" aria-hidden="true"><i class="bi bi-file-earmark-pdf-fill"></i><small>PDF</small></span>
        <div><a class="lt-rp-title" href="${url('report-view.html?id=' + r.id + '&file=' + encodeURIComponent(f.id))}">${esc(f.name)}</a><small>${f.params} parameter${f.params > 1 ? 's' : ''} · Booking ${esc(r.bookingId)}</small></div></div>
      <div class="lt-rp-meta" role="cell">${labLogo(r.lab, 'sm')}<div><b>${esc(r.lab.name)}</b><small><i class="bi bi-calendar3" aria-hidden="true"></i> ${date(r.date)}</small></div></div>
      <div class="lt-rp-res" role="cell">${result(f)}</div>
      <div class="lt-rp-acts" role="cell">
        <button type="button" class="btn lt-btn lt-btn-sm" data-view="${r.id}|${esc(f.id)}" data-busy="Opening…" aria-label="View ${esc(f.name)} report (opens in a new tab)" title="Opens the PDF in a new tab"><i class="bi bi-eye"></i> View</button>
        <button type="button" class="btn lt-btn-outline lt-btn-sm" data-dl="${r.id}|${esc(f.id)}" data-busy="Preparing…" aria-label="Download ${esc(f.name)} report as PDF"><i class="bi bi-download"></i> Download</button>
      </div></div>`;
  }

  function paint() {
    const counts = { all: fileCount(reports) };
    members.forEach((m) => { counts[m.id] = fileCount(reports.filter((r) => r.memberId === m.id)); });
    $('[data-tabs]').innerHTML = [{ id: 'all', name: 'All' }].concat(members).map((m) => `<button role="tab" data-m="${m.id}" aria-selected="${m.id === member}">${m.id === 'all' ? '<i class="bi bi-people"></i>' : avatar(m.name, null, 'sm')} ${esc(m.id === 'all' ? 'All' : m.name.split(' ')[0])} <span class="lt-count">${counts[m.id] || 0}</span></button>`).join('');

    const show = members.filter((m) => member === 'all' || m.id === member);
    const vis = reports.filter((r) => show.some((m) => m.id === r.memberId)), visPend = pending.filter((p) => show.some((m) => m.id === p.memberId));
    $('[data-sum]').innerHTML = vis.length || visPend.length ? `<div class="lt-rp-sum"><span><i class="bi bi-file-earmark-pdf"></i><b>${fileCount(vis)}</b> report${fileCount(vis) === 1 ? '' : 's'} ready</span>${visPend.length ? `<span><i class="bi bi-hourglass-split"></i><b>${visPend.length}</b> waiting for the lab</span>` : ''}<span class="lt-rp-sum-tip"><i class="bi bi-shield-lock"></i> Only you can see these reports</span></div>` : '';

    const blocks = show.map((m) => {
      const rs = reports.filter((r) => r.memberId === m.id), pd = pending.filter((p) => p.memberId === m.id);
      if (!rs.length && !pd.length) return '';
      const n = fileCount(rs);
      return `<section class="lt-rp-group" aria-label="Reports for ${esc(m.name)}">
        <header class="lt-rp-ghead">${avatar(m.name)}<div><h2>${esc(m.name)}</h2><small>${esc(m.relationship)}</small></div><span class="lt-rp-gcount">${n} report${n === 1 ? '' : 's'}</span></header>
        ${rs.length ? `<div class="lt-rp-table" role="table" aria-label="${esc(m.name)} – reports">
          <div class="lt-rp-thead" role="row"><span role="columnheader">Report name</span><span role="columnheader">Lab &amp; date</span><span role="columnheader">Result</span><span role="columnheader" class="text-end">Report (PDF)</span></div>
          ${rs.map((r) => r.files.map((f) => row(r, f)).join('')).join('')}</div>` : ''}
        ${pd.map((p) => `<div class="lt-rp-row is-pending" role="group" aria-label="Report not ready">
          <div class="lt-rp-name"><span class="lt-rp-pdf is-wait" aria-hidden="true"><i class="bi bi-hourglass-split"></i></span><div><b class="lt-rp-title">${esc(p.tests.join(', '))}</b><small>${esc(p.lab)} · Booking ${esc(p.bookingId)}</small></div></div>
          <div class="lt-rp-res"><span class="lt-pill is-warn"><i class="bi bi-clock"></i> Report not ready yet</span></div>
          <div class="lt-rp-acts"><a class="btn lt-btn-ghost lt-btn-sm" href="${url('appointment-detail.html?id=' + p.bookingId)}"><i class="bi bi-geo"></i> Track</a></div></div>`).join('')}
      </section>`;
    }).join('');
    if (!blocks) return empty($('[data-list]'), { icon: 'report', title: 'No reports yet', text: 'Reports appear here as soon as the lab shares the PDF. We will also SMS you.', actions: [{ label: 'Book a test', href: url('search.html') }] });
    $('[data-list]').innerHTML = blocks;
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
