/* Page: report-view.html?id=&file= – PHASE 19 report detail
   One booking's reports for one family member. Labs share each report as a PDF, so the page shows:
   banner (member, lab, booking) · "Report files" list (Report name | Result | View | Download) ·
   built-in PDF preview on desktop (phones open the PDF in their own viewer) · action cards:
   Consult a doctor · Share securely · Book follow-up. ?print=1 (old links) downloads the first PDF. */
(function () {
  const { esc, toast, modal, skeleton, date, errMsg, param, busy, labLogo } = LT.ui;
  const url = LT.layout.url;
  const id = param('id');
  const app = LT.layout.mount({ active: 'reports', crumbs: [['Lab Tests', 'index.html'], ['My Reports', 'reports.html'], ['Report', '']], title: 'Lab report' });
  app.innerHTML = '<div class="lt-container mt-3" data-main></div>';
  const main = app.querySelector('[data-main]');
  const P = () => LT.reportPdf;
  const wide = () => window.matchMedia('(min-width: 992px)').matches;

  const result = (f) => (f.abnormal ? `<span class="lt-rchip is-abnormal"><i class="bi bi-arrow-up-circle-fill"></i>${f.abnormal} out of range</span>` : '')
    + (f.borderline ? `<span class="lt-rchip is-borderline"><i class="bi bi-exclamation-circle-fill"></i>${f.borderline} borderline</span>` : '')
    + (!f.abnormal && !f.borderline ? '<span class="lt-rchip is-normal"><i class="bi bi-check-circle-fill"></i>All normal</span>' : '');

  async function load() {
    skeleton(main, 'block', 3);
    let r;
    try { r = await LT.api.getReport(id); }
    catch (e) { return LT.ui.empty(main, { icon: 'report', title: 'Report not ready', text: errMsg(e) + ' We will notify you by SMS when the lab shares it.', actions: [{ label: 'My Reports', href: url('reports.html') }, { label: 'My Appointments', href: url('appointments.html') }] }); }

    const files = r.files || [], bad = r.parameters.filter((p) => p.status !== 'normal');
    let current = files.find((f) => f.id === param('file')) || files[0];
    const sub = `${r.member.name} · ${r.lab.name} · ${date(r.date)}`;
    const preview = P().inlinePdf();

    main.innerHTML = `<section class="lt-report-banner lt-rv-banner"><div class="lt-rv-who"><span class="lt-pill is-success mb-2"><i class="bi bi-check2-circle"></i> Report ready · ${files.length} PDF${files.length === 1 ? '' : 's'}</span>
        <h1>Reports for ${esc(r.member.name)}</h1>
        <p class="mb-0 mt-1">${esc(r.member.relationship)} · ${r.member.age} yrs · ${r.member.gender === 'male' ? 'Male' : 'Female'} · Reported ${date(r.date)} · Booking ${esc(r.bookingId)}</p></div>
        <div class="lt-rv-lab">${labLogo(r.lab, 'sm')}<div><b>${esc(r.lab.name)}</b><span class="lt-badges">${(r.lab.badges || []).filter((b) => ['NABL', 'CAP', 'ISO'].includes(b)).map((b) => `<span>${b}</span>`).join('')}</span></div></div></section>
      <div class="row g-4 mt-1"><div class="col-lg-8">
        <section class="lt-card lt-rv-files"><div class="lt-rv-files-head"><h2><i class="bi bi-file-earmark-pdf" aria-hidden="true"></i> Report files</h2><span>Shared by ${esc(r.lab.name)} as PDF</span></div>
          <div class="lt-rp-table is-compact" role="table" aria-label="Report files">
            <div class="lt-rp-thead" role="row"><span role="columnheader">Report name</span><span role="columnheader">Result</span><span role="columnheader" class="text-end">Report (PDF)</span></div>
            ${files.map((f) => `<div class="lt-rp-row ${f.id === current.id && preview ? 'is-current' : ''}" role="row" data-row="${esc(f.id)}">
              <div class="lt-rp-name" role="cell"><span class="lt-rp-pdf" aria-hidden="true"><i class="bi bi-file-earmark-pdf-fill"></i><small>PDF</small></span><div><b class="lt-rp-title">${esc(f.name)}</b><small>${f.params} parameter${f.params > 1 ? 's' : ''} · 1 page</small></div></div>
              <div class="lt-rp-res" role="cell">${result(f)}</div>
              <div class="lt-rp-acts" role="cell"><button type="button" class="btn lt-btn lt-btn-sm" data-view="${esc(f.id)}" data-busy="Opening…" aria-label="View ${esc(f.name)} report"><i class="bi bi-eye"></i> View</button><button type="button" class="btn lt-btn-outline lt-btn-sm" data-dl="${esc(f.id)}" data-busy="Preparing…" aria-label="Download ${esc(f.name)} report as PDF"><i class="bi bi-download"></i> Download</button></div></div>`).join('')}
          </div>
          ${files.length > 1 ? `<div class="lt-rv-all"><button type="button" class="btn lt-btn-ghost lt-btn-sm" data-dlall><i class="bi bi-file-earmark-arrow-down"></i> Download all ${files.length} PDFs</button></div>` : ''}
        </section>
        ${preview ? `<section class="lt-card lt-rv-preview d-none d-lg-block" aria-label="Report preview"><div class="lt-rv-preview-head"><h2><i class="bi bi-eye" aria-hidden="true"></i> Preview: <span data-ptitle>${esc(current.name)}</span></h2><a class="btn lt-btn-ghost lt-btn-sm" data-pnew href="#" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Open in new tab</a></div>
          <div class="lt-pdfv is-inline"><iframe class="lt-pdfv-frame" data-pframe title="Report preview (PDF)"></iframe></div></section>` : ''}
        <p class="lt-disclaimer mt-3"><i class="bi bi-info-circle"></i> Reports are for information only and are not a diagnosis. Values outside the range do not always mean illness – please discuss your results with a doctor.</p>
      </div><div class="col-lg-4">
        <div class="lt-rv-help">
          <section class="lt-card lt-noprint is-main" aria-labelledby="rvConsult">
            <div class="lt-rv-hc-top"><span class="lt-rv-hc-ico" aria-hidden="true"><i class="bi bi-camera-video-fill"></i></span><div><h2 id="rvConsult">Consult a doctor</h2><p>Get your reports explained on a video call in 15 minutes.</p></div></div>
            <ul class="lt-rv-hc-points"><li><i class="bi bi-check-lg" aria-hidden="true"></i>Certified doctors</li><li><i class="bi bi-check-lg" aria-hidden="true"></i>Available today</li></ul>
            <a class="btn" href="${LT.layout.site('doctor/find-doctor.html')}"><i class="bi bi-camera-video"></i> Consult now</a>
          </section>
          <section class="lt-card lt-noprint" aria-labelledby="rvShare">
            <div class="lt-rv-hc-top"><span class="lt-rv-hc-ico is-blue" aria-hidden="true"><i class="bi bi-share-fill"></i></span><div><h2 id="rvShare">Share with your doctor</h2><p>Send a secure link to these reports.</p></div></div>
            <ul class="lt-rv-hc-points"><li><i class="bi bi-shield-lock-fill" aria-hidden="true"></i>OTP protected</li><li><i class="bi bi-clock" aria-hidden="true"></i>Expires in 24 hrs</li></ul>
            <button type="button" class="btn lt-btn-outline" data-share data-busy="Creating link…"><i class="bi bi-link-45deg"></i> Share securely</button>
          </section>
          <section class="lt-card lt-noprint" aria-labelledby="rvFollow">
            <div class="lt-rv-hc-top"><span class="lt-rv-hc-ico is-amber" aria-hidden="true"><i class="bi bi-arrow-repeat"></i></span><div><h2 id="rvFollow">Book a follow-up test</h2><p>Re-check ${bad.length ? 'out-of-range values' : 'these tests'} in 3 months to see your progress.</p></div></div>
            <ul class="lt-rv-hc-points"><li><i class="bi bi-check-lg" aria-hidden="true"></i>Same tests</li><li><i class="bi bi-check-lg" aria-hidden="true"></i>For ${esc(r.member.name.split(' ')[0])}</li></ul>
            <button type="button" class="btn lt-btn-outline" data-follow><i class="bi bi-cart-plus"></i> Add same tests to cart</button>
          </section>
        </div>
      </div></div>`;

    /* desktop preview of the selected PDF */
    async function showPreview(f) {
      const frame = main.querySelector('[data-pframe]'); if (!frame) return false;
      current = f;
      main.querySelectorAll('[data-row]').forEach((x) => x.classList.toggle('is-current', x.dataset.row === f.id));
      main.querySelector('[data-ptitle]').textContent = f.name;
      try { const u = await P().fileUrl(r.id, f.id); frame.src = u.href + '#view=FitH'; main.querySelector('[data-pnew]').href = u.href; }
      catch (e) { toast(errMsg(e), 'danger'); }
      return true;
    }
    if (preview) showPreview(current);

    main.addEventListener('click', async (e) => {
      const v = e.target.closest('[data-view]');
      if (v) {
        const f = files.find((x) => x.id === v.dataset.view);
        if (preview && wide()) { await showPreview(f); main.querySelector('.lt-rv-preview').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        else P().view(r.id, f.id, { btn: v, sub });
        return;
      }
      const d = e.target.closest('[data-dl]'); if (d) { P().download(r.id, d.dataset.dl, d); return; }
      const all = e.target.closest('[data-dlall]');
      if (all) { for (const f of files) { await P().download(r.id, f.id); await new Promise((res) => setTimeout(res, 450)); } }
    });
    main.querySelector('[data-follow]').onclick = () => { LT.cart.merge(r.tests, 'manual', null, r.memberId ? [r.memberId] : null); LT.layout.flash('Follow-up tests added to your cart'); location.href = url('cart.html'); };
    main.querySelector('[data-share]').onclick = async (e) => {
      const s = await busy(e.currentTarget, () => LT.api.shareReport(r.id));
      const md = modal.open({
        title: 'Share report securely', body: `<p class="small">Anyone with this link needs an OTP sent to ${esc(r.member.name.split(' ')[0])}'s mobile to open the PDF reports.</p><div class="d-flex gap-2"><label class="visually-hidden" for="shL">Secure link</label><input id="shL" class="form-control" readonly value="${esc(s.url)}"><button type="button" class="btn lt-btn" data-copy><i class="bi bi-copy"></i> Copy</button></div><p class="small mt-2 mb-0"><i class="bi bi-shield-lock text-success"></i> Expires in ${esc(s.expiresIn)} – OTP protected</p>`,
        footer: `<a class="btn lt-btn-outline" href="https://wa.me/?text=${encodeURIComponent('My lab report: ' + s.url)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> WhatsApp</a><button type="button" class="btn lt-btn-ghost" data-bs-dismiss="modal">Done</button>`
      });
      md.$('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(s.url); toast('Secure link copied'); } catch (er) { md.$('#shL').select(); toast('Press Ctrl+C to copy', 'info'); } };
    };
    if (param('print') === '1' && current) P().download(r.id, current.id); // old "download" links
  }
  load();
})();
