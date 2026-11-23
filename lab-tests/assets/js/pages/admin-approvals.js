/* Page: admin/lab-approvals.html – PLATFORM DEMO: admin lab approvals
   Table of applications (Pending / Approved / Rejected / Needs info), documents modal,
   Approve / Reject with reason / Needs info. Approving makes the lab visible in select-lab. */
(function () {
  const { esc, toast, modal, skeleton, error, statusChip, date, errMsg, busy } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: '', crumbs: [['Lab Tests', 'index.html'], ['Admin: lab approvals (demo)', '']], title: 'Lab approvals' });
  let filter = 'all', apps = [];

  app.innerHTML = `<div class="lt-container"><div class="lt-page-head d-flex flex-wrap justify-content-between align-items-end gap-3"><div><span class="lt-portal-badge"><i class="bi bi-shield-lock"></i> Admin console</span><h1 class="mt-2">Lab partner approvals</h1><p>Verify documents before a lab goes live on the marketplace. Approved labs appear on the patient lab-selection page for their pincodes.</p></div><a class="btn lt-btn-outline" href="${url('lab-partner/register.html')}"><i class="bi bi-plus-lg"></i> New application (demo)</a></div>
    <div class="lt-tabs" role="tablist" data-tabs></div><div data-body></div></div>`;
  const $ = (q) => app.querySelector(q);

  async function load() {
    skeleton($('[data-body]'), 'row', 3);
    try { apps = await LT.api.getLabApplications(); paint(); } catch (e) { error($('[data-body]'), { text: errMsg(e), onRetry: load }); }
  }
  function paint() {
    const F = [['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['needs_info', 'Needs info']];
    $('[data-tabs]').innerHTML = F.map(([k, l]) => `<button role="tab" data-f="${k}" aria-selected="${k === filter}">${l} <span class="lt-count">${apps.filter((a) => k === 'all' || a.status === k).length}</span></button>`).join('');
    const rows = apps.filter((a) => filter === 'all' || a.status === filter);
    if (!rows.length) return LT.ui.empty($('[data-body]'), { icon: 'lab', title: 'No applications here' });
    $('[data-body]').innerHTML = `<div class="lt-table-wrap"><table class="lt-table is-stack"><caption class="visually-hidden">Lab applications</caption><thead><tr><th scope="col">Application</th><th scope="col">Lab</th><th scope="col">Service area</th><th scope="col">Submitted</th><th scope="col">Status</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead>
      <tbody>${rows.map((a) => `<tr><td class="fw-bold">${esc(a.id)}</td><td data-l="Lab"><b>${esc(a.name)}</b><br><small>${esc(a.owner)} · ${a.testsCount} tests</small></td><td data-l="Area">${esc(a.city)} · ${a.pincodes.map(esc).join(', ')}</td><td data-l="Submitted">${date(a.submittedAt)}</td><td data-l="Status">${statusChip(a.status)}${a.note ? `<small class="d-block mt-1">${esc(a.note)}</small>` : ''}</td>
        <td class="text-nowrap"><button type="button" class="btn lt-btn-ghost lt-btn-sm" data-docs="${a.id}"><i class="bi bi-folder2-open"></i> Documents</button>${a.status !== 'approved' ? `<button type="button" class="btn lt-btn lt-btn-sm" data-approve="${a.id}">Approve</button>` : ''}${a.status === 'pending' || a.status === 'needs_info' ? `<button type="button" class="btn lt-btn-ghost lt-btn-sm" data-info="${a.id}">Needs info</button>` : ''}${a.status !== 'rejected' ? `<button type="button" class="btn lt-btn-ghost lt-btn-sm text-danger" data-reject="${a.id}">Reject</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
      <div class="lt-alert is-info mt-3"><i class="bi bi-lightbulb"></i><div><strong>Demo:</strong> approve <b>Aarogya Pathology</b>, then open <a class="fw-bold" href="${url('select-lab.html')}">Select lab</a> with a Pune 411057 cart – it now appears as a partner lab.</div></div>`;
  }
  async function setStatus(id, status, note, btn) {
    await busy(btn, () => LT.api.setLabStatus(id, status, note));
    toast({ approved: 'Lab approved and now live on the marketplace', rejected: 'Application rejected', needs_info: 'Requested more information from the lab' }[status]);
    load();
  }
  app.addEventListener('click', (e) => {
    const f = e.target.closest('[data-f]'); if (f) { filter = f.dataset.f; paint(); return; }
    const d = e.target.closest('[data-docs]'); if (d) {
      const a = apps.find((x) => x.id === d.dataset.docs);
      modal.open({ title: 'Documents – ' + a.name, body: `<dl class="lt-kv mb-3"><div><dt>Owner</dt><dd>${esc(a.owner)}</dd></div><div><dt>Contact</dt><dd>+91 ${esc(a.mobile)} · ${esc(a.email)}</dd></div><div><dt>GSTIN</dt><dd>${esc(a.gst)}</dd></div></dl>
        <ul class="d-grid gap-2">${a.documents.map((doc) => `<li class="d-flex align-items-center gap-2 p-2 border rounded-3"><i class="bi bi-file-earmark-pdf text-danger fs-4"></i><span class="flex-grow-1 lt-ink">${esc(doc.name)}</span>${doc.ok ? '<span class="lt-pill is-success"><i class="bi bi-check2"></i>Valid</span>' : '<span class="lt-pill is-danger"><i class="bi bi-x"></i>Expired</span>'}<button type="button" class="btn lt-btn-ghost lt-btn-sm" onclick="LT.ui.toast('Demo: document preview','info')">View</button></li>`).join('') || '<li class="small">No documents uploaded.</li>'}</ul>` });
      return;
    }
    const ap = e.target.closest('[data-approve]'); if (ap) return setStatus(ap.dataset.approve, 'approved', 'All documents verified.', ap);
    const rj = e.target.closest('[data-reject]'), ni = e.target.closest('[data-info]');
    if (rj || ni) {
      const id = (rj || ni).dataset[rj ? 'reject' : 'info'];
      const md = modal.open({ title: (rj ? 'Reject ' : 'Request info – ') + id, body: `<label class="form-label" for="adR">${rj ? 'Reason for rejection' : 'What do you need from the lab?'}</label><textarea id="adR" class="form-control" rows="3" placeholder="${rj ? 'e.g. NABL certificate expired' : 'e.g. Upload a clearer pathologist registration'}"></textarea><div class="lt-field-err" data-e hidden>Please add a note (at least 5 characters).</div>`,
        footer: `<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn ${rj ? 'lt-btn-danger' : 'lt-btn'}" data-ok data-busy="Saving…">${rj ? 'Reject' : 'Send request'}</button>` });
      md.$('[data-ok]').onclick = async (ev) => { const n = md.$('#adR').value.trim(); if (n.length < 5) { md.$('[data-e]').hidden = false; return; } await setStatus(id, rj ? 'rejected' : 'needs_info', n, ev.currentTarget); md.close(); };
    }
  });
  load();
})();
