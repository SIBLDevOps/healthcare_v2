/* Page: lab-partner/register.html – PLATFORM DEMO: lab partner registration (3 steps)
   1 Business (with mobile OTP) -> 2 Documents -> 3 Catalogue & service area -> submit (status pending).
   After an admin approves it (admin/lab-approvals.html) the lab shows up in select-lab. */
(function () {
  const { esc, money, toast, busy, errMsg } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: '', crumbs: [['Lab Tests', 'index.html'], ['Partner registration', '']], title: 'Lab partner registration' });
  let step = 1, otpOk = false, pins = ['411057'];
  const files = {};

  app.innerHTML = `<div class="lt-container"><div class="lt-page-head d-flex flex-wrap justify-content-between align-items-end gap-3"><div><span class="lt-portal-badge"><i class="bi bi-building"></i> For diagnostic labs</span><h1 class="mt-2">Partner with BeyondSure</h1><p>Reach 200K+ patients. List your tests, set your prices and receive bookings from your service area.</p></div><div class="lt-ministep" data-mini></div></div>
    <form class="lt-card" novalidate data-form><div data-s="1"></div><div data-s="2" hidden></div><div data-s="3" hidden></div>
      <div class="d-flex justify-content-between gap-2 mt-4 border-top pt-3" data-nav><button type="button" class="btn lt-btn-ghost" data-prev hidden><i class="bi bi-arrow-left"></i> Back</button><button type="button" class="btn lt-btn ms-auto" data-next>Continue <i class="bi bi-arrow-right"></i></button></div></form></div>`;
  const $ = (q) => app.querySelector(q);
  const field = (id, label, attrs, col, opt) => `<div class="${col || 'col-md-6'}"><label class="form-label" for="${id}">${label} ${opt ? '<span class="lt-badge-opt">Optional</span>' : '<span class="req">*</span>'}</label><input id="${id}" class="form-control" ${attrs || ''}><div class="lt-field-err" data-e="${id}" hidden></div></div>`;

  $('[data-s="1"]').innerHTML = `<h2 class="h5 fw-bold mb-3">1. Business details</h2><div class="row g-3">
    ${field('rgName', 'Lab / business name', 'placeholder="e.g. Aarogya Pathology"')}${field('rgOwner', 'Owner / director name', 'autocomplete="name"')}
    <div class="col-md-6"><label class="form-label" for="rgMob">Mobile <span class="req">*</span></label><div class="d-flex gap-2"><div class="input-group lt-input-group"><span class="input-group-text">+91</span><input id="rgMob" class="form-control" inputmode="numeric" maxlength="10"></div><button type="button" class="btn lt-btn-outline" data-otp>Verify</button></div><div class="lt-field-err" data-e="rgMob" hidden></div>
      <div class="d-flex gap-2 mt-2" data-otpbox hidden><label class="visually-hidden" for="rgOtp">OTP</label><input id="rgOtp" class="form-control" maxlength="6" inputmode="numeric" placeholder="OTP (demo 123456)"><button type="button" class="btn lt-btn" data-otpok>Confirm</button></div></div>
    ${field('rgEmail', 'Business email', 'type="email"')}${field('rgAddr', 'Registered address', '', 'col-12')}${field('rgArea', 'Area / locality', 'placeholder="e.g. Pimple Saudagar"')}${field('rgGst', 'GSTIN', 'maxlength="15" placeholder="27AAKFA1234B1Z9" style="text-transform:uppercase"')}
    ${field('rgPan', 'PAN', 'maxlength="10" placeholder="AAKFA1234B" style="text-transform:uppercase"')}${field('rgIfsc', 'Bank IFSC (for settlements)', 'maxlength="11" placeholder="HDFC0001234" style="text-transform:uppercase"')}
    ${field('rgAcc', 'Bank account number (demo)', 'inputmode="numeric" maxlength="18" autocomplete="off"')}</div>`;
  $('[data-s="2"]').innerHTML = `<h2 class="h5 fw-bold mb-3">2. Documents</h2><p class="small">PDF or image, up to 10 MB each. Files stay on this device in the demo.</p><div class="row g-3">
    ${[['licence', 'Clinical establishment licence', false], ['nabl', 'NABL / CAP / ISO certificate', false], ['patho', 'Pathologist registration (MCI / state council)', false], ['gstdoc', 'GST certificate', true]].map(([k, l, o]) => `<div class="col-md-6"><label class="form-label" for="doc-${k}">${l} ${o ? '<span class="lt-badge-opt">Optional</span>' : '<span class="req">*</span>'}</label><input id="doc-${k}" type="file" class="form-control" accept=".pdf,.jpg,.jpeg,.png" data-doc="${k}"><div class="small mt-1" data-docname="${k}"></div><div class="lt-field-err" data-e="doc-${k}" hidden></div></div>`).join('')}
    <div class="col-12"><span class="form-label d-block">Accreditations</span><div class="lt-togglechips">${['NABL', 'CAP', 'ISO'].map((a) => `<input type="checkbox" id="ac${a}" value="${a}" ${a === 'NABL' ? 'checked' : ''}><label for="ac${a}">${a}</label>`).join('')}</div></div></div>`;

  async function step3() {
    const tests = (await LT.api.searchTests({ pageSize: 50, sort: 'popularity' })).items;
    $('[data-s="3"]').innerHTML = `<h2 class="h5 fw-bold mb-3">3. Catalogue &amp; service area</h2>
      <div class="d-flex justify-content-between align-items-center mb-2"><b class="lt-ink">Tests you offer</b><button type="button" class="lt-linkbtn small" data-all>Select all</button></div>
      <div class="lt-table-wrap" style="max-height:340px"><table class="lt-table"><thead><tr><th scope="col"><span class="visually-hidden">Offer</span></th><th scope="col">Test</th><th scope="col">Your price (₹)</th><th scope="col">TAT (hrs)</th></tr></thead><tbody>${tests.map((t, i) => `<tr><td><input class="form-check-input" type="checkbox" data-t="${t.id}" ${i < 10 ? 'checked' : ''} aria-label="Offer ${esc(t.name)}"></td><td>${esc(t.name)}<br><small class="lt-muted">MRP ${money(t.mrp)}</small></td><td><input class="form-control form-control-sm" style="min-height:36px;width:110px" inputmode="numeric" value="${t.price}" aria-label="Price for ${esc(t.name)}"></td><td><input class="form-control form-control-sm" style="min-height:36px;width:80px" inputmode="numeric" value="${t.tatHours}" aria-label="TAT for ${esc(t.name)}"></td></tr>`).join('')}</tbody></table></div>
      <div class="row g-3 mt-2"><div class="col-12"><label class="form-label" for="pinIn">Serviceable pincodes <span class="req">*</span></label><div class="lt-taginput" data-pins><input id="pinIn" inputmode="numeric" maxlength="6" placeholder="Type a pincode and press Enter"></div><div class="lt-field-err" data-e="pins" hidden></div></div>
        ${field('rgCentre', 'Collection centre address', 'placeholder="Shop no., building, road"', 'col-12')}
        <div class="col-md-4"><label class="form-label" for="rgOpen">Opens at</label><input id="rgOpen" type="time" class="form-control" value="07:00"></div><div class="col-md-4"><label class="form-label" for="rgClose">Closes at</label><input id="rgClose" type="time" class="form-control" value="21:00"></div>
        <div class="col-md-4"><label class="form-label" for="rgCap">Home visits per 30-min slot</label><input id="rgCap" type="number" min="1" max="20" class="form-control" value="4"></div>
        <div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="rgTerms"><label class="form-check-label" for="rgTerms">I agree to the partner terms, quality standards and a 12% platform commission on completed bookings.</label></div><div class="lt-field-err" data-e="rgTerms" hidden></div></div></div>`;
    paintPins();
    $('[data-all]').onclick = () => app.querySelectorAll('[data-t]').forEach((c) => { c.checked = true; });
    $('#pinIn').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const v = e.target.value.trim(); if (/^[1-9]\d{5}$/.test(v) && !pins.includes(v)) { pins.push(v); e.target.value = ''; paintPins(); } else if (v) toast('Enter a valid new 6-digit pincode', 'warning'); } });
  }
  function paintPins() { const box = $('[data-pins]'), inp = box.querySelector('input'); box.querySelectorAll('span').forEach((s) => s.remove()); pins.forEach((p) => { const s = document.createElement('span'); s.innerHTML = `${p}<button type="button" aria-label="Remove ${p}">×</button>`; s.querySelector('button').onclick = () => { pins = pins.filter((x) => x !== p); paintPins(); }; box.insertBefore(s, inp); }); }

  const err = (id, m) => { const e = app.querySelector(`[data-e="${id}"]`); if (e) { e.textContent = m || ''; e.hidden = !m; } const f = app.querySelector('#' + id); if (f) f.classList.toggle('is-invalid', !!m); return !m; };
  const v = (id) => ($('#' + id) || {}).value ? $('#' + id).value.trim() : '';
  function validate(n) {
    let ok = true;
    if (n === 1) {
      ok = err('rgName', v('rgName').length > 2 ? '' : 'Enter the lab name.') && ok;
      ok = err('rgOwner', /^[A-Za-z][A-Za-z .']{1,48}$/.test(v('rgOwner')) ? '' : 'Enter the owner name (letters only).') && ok;
      ok = err('rgMob', !/^[6-9]\d{9}$/.test(v('rgMob')) ? 'Enter a valid mobile number.' : !otpOk ? 'Verify the mobile number with OTP.' : '') && ok;
      ok = err('rgEmail', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('rgEmail')) ? '' : 'Enter a valid email.') && ok;
      ok = err('rgAddr', v('rgAddr').length > 5 ? '' : 'Enter the registered address.') && ok;
      ok = err('rgArea', v('rgArea') ? '' : 'Enter the area.') && ok;
      ok = err('rgGst', /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/i.test(v('rgGst')) ? '' : 'Enter a valid 15-character GSTIN.') && ok;
      ok = err('rgPan', /^[A-Z]{5}\d{4}[A-Z]$/i.test(v('rgPan')) ? '' : 'Enter a valid PAN (e.g. AAKFA1234B).') && ok;
      ok = err('rgIfsc', /^[A-Z]{4}0[A-Z\d]{6}$/i.test(v('rgIfsc')) ? '' : 'Enter a valid IFSC.') && ok;
      ok = err('rgAcc', /^\d{9,18}$/.test(v('rgAcc')) ? '' : 'Enter a 9-18 digit account number.') && ok;
    }
    if (n === 2) ['licence', 'nabl', 'patho'].forEach((k) => { ok = err('doc-' + k, files[k] ? '' : 'Please upload this document.') && ok; });
    if (n === 3) {
      ok = err('pins', pins.length ? '' : 'Add at least one pincode.') && ok;
      ok = err('rgCentre', v('rgCentre').length > 5 ? '' : 'Enter the centre address.') && ok;
      ok = err('rgTerms', $('#rgTerms').checked ? '' : 'Please accept the partner terms.') && ok;
      if (!app.querySelectorAll('[data-t]:checked').length) { toast('Select at least one test', 'warning'); ok = false; }
    }
    if (!ok) { const f = app.querySelector('.is-invalid'); if (f) f.focus(); }
    return ok;
  }
  function show(n) {
    step = n; [1, 2, 3].forEach((k) => { $(`[data-s="${k}"]`).hidden = k !== n; });
    $('[data-prev]').hidden = n === 1; $('[data-next]').innerHTML = n === 3 ? '<i class="bi bi-send"></i> Submit application' : 'Continue <i class="bi bi-arrow-right"></i>';
    $('[data-mini]').innerHTML = ['Business', 'Documents', 'Catalogue'].map((l, i) => `<span class="${i + 1 < n ? 'is-done' : i + 1 === n ? 'is-current' : ''}"><b>${i + 1 < n ? '<i class="bi bi-check"></i>' : i + 1}</b>${l}</span>`).join('<i class="bi bi-chevron-right"></i>');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('[data-otp]').onclick = async () => { if (!/^[6-9]\d{9}$/.test(v('rgMob'))) return err('rgMob', 'Enter a valid mobile number.'); await LT.api.sendOtp(v('rgMob')); $('[data-otpbox]').hidden = false; $('#rgOtp').focus(); toast('OTP sent. Demo OTP: 123456', 'info'); };
  $('[data-otpok]').onclick = () => { if (v('rgOtp') === '123456') { otpOk = true; $('[data-otpbox]').innerHTML = '<span class="lt-pill is-success"><i class="bi bi-patch-check"></i> Mobile verified</span>'; err('rgMob', ''); } else toast('Wrong OTP. Use 123456 in the demo.', 'danger'); };
  app.addEventListener('change', (e) => { if (e.target.dataset.doc) { const f = e.target.files[0]; files[e.target.dataset.doc] = f ? f.name : null; app.querySelector(`[data-docname="${e.target.dataset.doc}"]`).innerHTML = f ? `<i class="bi bi-file-earmark-check text-success"></i> ${esc(f.name)}` : ''; if (f) err('doc-' + e.target.dataset.doc, ''); } });
  $('[data-prev]').onclick = () => show(step - 1);
  $('[data-next]').onclick = async (e) => {
    if (!validate(step)) return;
    if (step === 1) return show(2);
    if (step === 2) { await step3(); return show(3); }
    const form = { name: v('rgName'), owner: v('rgOwner'), mobile: v('rgMob'), email: v('rgEmail'), address: v('rgCentre'), area: v('rgArea'), gst: v('rgGst').toUpperCase(), pincodes: pins,
      tests: [...app.querySelectorAll('[data-t]:checked')].map((c) => c.dataset.t), documents: Object.values(files).filter(Boolean), accreditations: [...app.querySelectorAll('.lt-togglechips input:checked')].map((c) => c.value),
      open: $('#rgOpen').value, close: $('#rgClose').value };
    try {
      const r = await busy(e.currentTarget, () => LT.api.registerLab(form));
      app.querySelector('[data-form]').innerHTML = `<div class="text-center py-4"><svg class="lt-success-anim" viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="46"/><path d="M32 54l14 14 26-30"/></svg><h2 class="fw-bold">Application submitted</h2><p>Admin will verify within 48 hours. We'll email ${esc(form.email)} once your lab is live.</p><p><span class="lt-idchip"><i class="bi bi-hash"></i>${esc(r.applicationId)}</span></p>
        <div class="lt-acts justify-content-center mt-3"><a class="btn lt-btn" href="${url('admin/lab-approvals.html')}"><i class="bi bi-shield-check"></i> Open admin approvals (demo)</a><a class="btn lt-btn-outline" href="${url('lab-partner/dashboard.html')}">Lab dashboard (demo)</a></div></div>`;
      toast('Application ' + r.applicationId + ' submitted');
    } catch (er) { toast(errMsg(er), 'danger'); }
  };
  show(1);
})();
