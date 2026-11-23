/* Page: prescription-upload.html – PHASE 6 (assisted prescription flow)
   1. Upload one or more prescription images / PDFs + details (patient, doctor, date, callback number,
      preferred call time, notes).
   2. Submit -> success popup "Our team will connect with you soon" -> redirect to My Prescription Requests.
   No automatic reading: handwriting is often unclear, so our team / the lab calls the patient,
   identifies the tests and adds them to the request for the patient to confirm and book. */
(function () {
  const { esc, toast, modal, busy, errMsg, date } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'labtests', crumbs: [['Lab Tests', 'index.html'], ['Upload prescription', '']], title: 'Upload Prescription' });
  const MAX_SIZE = 10 * 1024 * 1024, MAX_FILES = 5, TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
  const files = []; // { id, file, name, size, type, preview }
  const s0 = LT.store.get(), draft = s0.prescriptionDraft || {};
  const fmtSize = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
  const CALL_TIMES = ['Anytime (8 AM – 8 PM)', 'Morning (8 AM – 12 PM)', 'Afternoon (12 – 4 PM)', 'Evening (4 – 8 PM)'];

  const guide = (ok) => `<figure><svg viewBox="0 0 120 90" aria-hidden="true"><defs><filter id="blur${ok ? 1 : 0}"><feGaussianBlur stdDeviation="2.4"/></filter></defs><rect x="22" y="6" width="76" height="78" rx="6" fill="#fff" stroke="#c3d6fb" stroke-width="2"/><g ${ok ? '' : 'filter="url(#blur0)"'}><text x="30" y="26" font-family="Georgia" font-style="italic" font-size="14" fill="#1964ee">Rx</text><rect x="30" y="34" width="56" height="4" rx="2" fill="#9fb6e6"/><rect x="30" y="44" width="44" height="4" rx="2" fill="#9fb6e6"/><rect x="30" y="54" width="50" height="4" rx="2" fill="#9fb6e6"/></g><circle cx="98" cy="74" r="12" fill="${ok ? '#0e9f6e' : '#e5484d'}"/><path d="${ok ? 'M92 74l4 4 8-8' : 'M93 69l10 10M103 69l-10 10'}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg><figcaption>${ok ? 'Clear, full page, well lit' : 'Blurry, cut or dark'}</figcaption></figure>`;

  app.innerHTML = `<div class="lt-container">
    <div class="lt-page-head d-flex flex-wrap justify-content-between align-items-end gap-3"><div><h1>Upload your prescription</h1><p>Share a clear photo or PDF of your prescription. Our team reads it and calls you to confirm the right tests – no guesswork from unclear handwriting.</p></div>
      <div class="lt-ministep"><span class="is-current"><b>1</b>Upload</span><i class="bi bi-chevron-right"></i><span><b>2</b>Our team calls you</span><i class="bi bi-chevron-right"></i><span><b>3</b>Confirm &amp; book</span></div></div>
    <form class="row g-4" novalidate data-form>
      <div class="col-lg-8">
        <section class="lt-card">
          <div class="lt-card-title"><h2><i class="bi bi-images"></i> Prescription images</h2><span class="lt-pill" data-count>0 / ${MAX_FILES} files</span></div>
          <div class="lt-drop" data-drop tabindex="0" role="button" aria-label="Add prescription files. Drag and drop or press Enter to browse">
            <i class="bi bi-cloud-arrow-up big" aria-hidden="true"></i><h3>Drag &amp; drop your prescription here</h3><p class="small mb-3">Add every page – up to ${MAX_FILES} files · PDF, JPG or PNG · max 10 MB each</p>
            <div class="d-flex flex-wrap gap-2 justify-content-center"><button type="button" class="btn lt-btn" data-browse><i class="bi bi-folder2-open"></i> Browse files</button>
              <button type="button" class="btn lt-btn-outline d-md-none" data-camera><i class="bi bi-camera"></i> Camera</button><button type="button" class="btn lt-btn-outline d-md-none" data-gallery><i class="bi bi-images"></i> Gallery</button></div>
            <input type="file" data-input accept=".pdf,.jpg,.jpeg,.png" multiple hidden><input type="file" data-cam accept="image/*" capture="environment" hidden><input type="file" data-gal accept="image/*" multiple hidden>
          </div>
          <div class="lt-field-err" data-ferr hidden></div>
          <div class="lt-rx-thumbs" data-files></div>
        </section>

        <section class="lt-card">
          <div class="lt-card-title"><h2><i class="bi bi-person-vcard"></i> Prescription details</h2></div>
          <div class="row g-3">
            <div class="col-md-6"><label class="form-label" for="rxFor">Patient (prescription is for) <span class="req">*</span></label><select id="rxFor" class="form-select"><option value="">Select patient</option></select><div class="lt-field-err" data-e="rxFor" hidden></div></div>
            <div class="col-md-6"><label class="form-label" for="rxDoc">Doctor's name <span class="lt-badge-opt">Optional</span></label><input id="rxDoc" class="form-control" placeholder="e.g. Dr. Ananya Mehta" value="${esc(draft.doctor || '')}"></div>
            <div class="col-md-6"><label class="form-label" for="rxDate">Prescription date <span class="lt-badge-opt">Optional</span></label><input id="rxDate" type="date" class="form-control" value="${esc(draft.date || '')}" max="${LT.api.isoDay(0)}"><div data-dmsg></div></div>
            <div class="col-md-6"><label class="form-label" for="rxMob">Mobile number for callback <span class="req">*</span></label><div class="input-group lt-input-group"><span class="input-group-text">+91</span><input id="rxMob" class="form-control" inputmode="numeric" maxlength="10" value="${esc(draft.callbackMobile || s0.user.mobile || '')}" autocomplete="tel-national"></div><div class="lt-field-err" data-e="rxMob" hidden></div></div>
            <div class="col-md-6"><label class="form-label" for="rxTime">Preferred time for our call</label><select id="rxTime" class="form-select">${CALL_TIMES.map((t) => `<option ${draft.callbackTime === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
            <div class="col-md-6"><span class="form-label d-block">Collection preference</span><div class="lt-segpills">${[['home', 'Home collection'], ['centre', 'Lab centre visit']].map(([k, l]) => `<input type="radio" name="rxMode" id="rxMode${k}" value="${k}" ${(draft.mode || s0.mode || 'home') === k ? 'checked' : ''}><label for="rxMode${k}">${l}</label>`).join('')}</div></div>
            <div class="col-12"><label class="form-label" for="rxNotes">Notes for our team <span class="lt-badge-opt">Optional</span></label><textarea id="rxNotes" class="form-control" rows="3" maxlength="400" placeholder="e.g. Doctor asked for a fasting sugar test as well, or symptoms you want checked">${esc(draft.notes || '')}</textarea><small class="lt-muted" data-left>400 characters left</small></div>
            <div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="rxOk" ${draft.consent ? 'checked' : ''}><label class="form-check-label" for="rxOk">I allow BeyondSure and its partner labs to view this prescription and call me to confirm my tests.</label></div><div class="lt-field-err" data-e="rxOk" hidden></div></div>
          </div>
        </section>

        <div class="d-flex flex-wrap justify-content-between gap-2 mt-3"><a class="btn lt-btn-ghost" href="${url('index.html')}"><i class="bi bi-arrow-left"></i> Back</a>
          <button type="submit" class="btn lt-btn" data-submit data-busy="Submitting…"><i class="bi bi-send-check"></i> Submit Prescription</button></div>
      </div>

      <aside class="col-lg-4"><div class="lt-aside">
        <section class="lt-card"><h2 class="h6 fw-bold mb-3"><i class="bi bi-headset text-primary"></i> How it works</h2>
          <ol class="lt-tl">${[['cloud-arrow-up', 'Upload your prescription', 'Add all pages and your details.'], ['telephone', 'Our team calls you', 'We read the prescription and confirm the tests with you – usually within 30 minutes (8 AM – 8 PM).'], ['list-check', 'Confirm & book', 'The tests appear in My Prescription Requests. Confirm them, pick a lab and slot, and pay.']]
            .map(([i, t, d], k) => `<li class="${k === 0 ? 'is-current is-done' : ''}"><span class="lt-tl-dot"><i class="bi bi-${i}"></i></span><strong>${t}</strong><small>${d}</small></li>`).join('')}</ol></section>
        <section class="lt-card"><h2 class="h6 fw-bold mb-3"><i class="bi bi-lightbulb text-primary"></i> Photo tips</h2><div class="lt-guide">${guide(true)}${guide(false)}</div>
          <ul class="lt-checklist small mt-3"><li><i class="bi bi-check-circle-fill"></i>Doctor's name, date and signature visible</li><li><i class="bi bi-check-circle-fill"></i>All test names readable, no glare</li><li><i class="bi bi-check-circle-fill"></i>One page per photo – add every page</li></ul></section>
      </div></aside>
    </form></div>`;

  const $ = (q) => app.querySelector(q);
  const err = (k, m) => { const e = app.querySelector(`[data-e="${k}"]`); if (e) { e.textContent = m || ''; e.hidden = !m; } return !m; };

  /* ---------- patients ---------- */
  async function loadMembers() {
    if (!LT.store.get().user.loggedIn) { $('#rxFor').innerHTML = '<option value="">Log in to choose a patient</option>'; return; }
    try {
      const members = await LT.api.getMembers();
      $('#rxFor').innerHTML = '<option value="">Select patient</option>' + members.map((m) => `<option value="${m.id}" ${(draft.memberId || members[0].id) === m.id ? 'selected' : ''}>${esc(m.name)} (${esc(m.relationship)})</option>`).join('');
    } catch (e) { toast(errMsg(e), 'danger'); }
  }

  /* ---------- files ---------- */
  const inp = $('[data-input]'), drop = $('[data-drop]');
  $('[data-browse]').onclick = (e) => { e.stopPropagation(); inp.click(); };
  $('[data-camera]').onclick = (e) => { e.stopPropagation(); $('[data-cam]').click(); };
  $('[data-gallery]').onclick = (e) => { e.stopPropagation(); $('[data-gal]').click(); };
  drop.onclick = () => inp.click();
  drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } };
  [inp, $('[data-cam]'), $('[data-gal]')].forEach((i) => { i.onchange = () => { addFiles([...i.files]); i.value = ''; }; });
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files]));

  function addFiles(list) {
    const errs = [];
    list.forEach((f) => {
      if (files.length >= MAX_FILES) return errs.push(`You can add up to ${MAX_FILES} files.`);
      if (!TYPES.includes(f.type) && !/\.(pdf|jpe?g|png)$/i.test(f.name)) return errs.push(`“${f.name}”: only PDF, JPG or PNG allowed.`);
      if (f.size > MAX_SIZE) return errs.push(`“${f.name}”: file is larger than 10 MB.`);
      if (files.some((x) => x.name === f.name && x.size === f.size)) return errs.push(`“${f.name}” is already added.`);
      files.push({ id: 'f' + Math.random().toString(36).slice(2, 7), file: f, name: f.name, size: f.size, type: f.type || 'application/pdf', preview: (f.type || '').startsWith('image/') ? URL.createObjectURL(f) : null });
    });
    const box = $('[data-ferr]'); box.innerHTML = [...new Set(errs)].join('<br>'); box.hidden = !errs.length;
    paintFiles();
  }
  function paintFiles() {
    $('[data-count]').textContent = `${files.length} / ${MAX_FILES} files`;
    $('[data-count]').className = 'lt-pill ' + (files.length ? 'is-success' : '');
    $('[data-files]').innerHTML = files.map((f, i) => `<figure class="lt-rx-thumb">
        <div class="lt-rx-img">${f.preview ? `<img src="${f.preview}" alt="Prescription page ${i + 1}">` : '<i class="bi bi-file-earmark-pdf-fill"></i>'}<span class="lt-rx-page">Page ${i + 1}</span>
          <button type="button" class="lt-rx-rm" data-rm="${f.id}" aria-label="Remove ${esc(f.name)}"><i class="bi bi-x-lg"></i></button></div>
        <figcaption><strong>${esc(f.name)}</strong><small>${fmtSize(f.size)}</small></figcaption></figure>`).join('') +
      (files.length && files.length < MAX_FILES ? `<button type="button" class="lt-rx-add" data-more><i class="bi bi-plus-lg"></i><span>Add page</span></button>` : '');
    const more = $('[data-more]'); if (more) more.onclick = () => inp.click();
    $('[data-files]').querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => { const i = files.findIndex((x) => x.id === b.dataset.rm); if (files[i].preview) URL.revokeObjectURL(files[i].preview); files.splice(i, 1); paintFiles(); }; });
    if (files.length) err('files');
  }

  /* ---------- details ---------- */
  function checkDate() {
    const v = $('#rxDate').value, box = $('[data-dmsg]');
    box.innerHTML = ''; $('#rxDate').classList.remove('is-invalid');
    if (!v) return true;
    const d = new Date(v + 'T00:00:00'), now = new Date();
    if (d > now) { box.innerHTML = '<div class="lt-field-err">Prescription date cannot be in the future.</div>'; $('#rxDate').classList.add('is-invalid'); return false; }
    if ((now - d) / 864e5 > 182) box.innerHTML = '<div class="lt-field-warn"><i class="bi bi-exclamation-triangle"></i> This prescription is older than 6 months. Our team will check if it is still valid.</div>';
    return true;
  }
  $('#rxDate').addEventListener('change', checkDate);
  $('#rxMob').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
  $('#rxNotes').addEventListener('input', (e) => { $('[data-left]').textContent = (400 - e.target.value.length) + ' characters left'; });
  /* keep what the user typed if they go back and return */
  const saveDraft = () => LT.store.set({ prescriptionDraft: Object.assign({}, LT.store.get().prescriptionDraft, { doctor: $('#rxDoc').value.trim(), date: $('#rxDate').value, memberId: $('#rxFor').value || null,
    callbackMobile: $('#rxMob').value, callbackTime: $('#rxTime').value, notes: $('#rxNotes').value, mode: (app.querySelector('input[name=rxMode]:checked') || {}).value, consent: $('#rxOk').checked }) });
  $('[data-form]').addEventListener('change', saveDraft);

  /* small thumbnails (data URLs) so the request shows the images in My Prescription Requests */
  const thumbOf = (f) => new Promise((res) => {
    if (!f.preview) return res(null);
    const img = new Image();
    img.onload = () => { const c = document.createElement('canvas'), w = 240, h = Math.round((img.height / img.width) * 240) || 320; c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); try { res(c.toDataURL('image/jpeg', 0.72)); } catch (e) { res(null); } };
    img.onerror = () => res(null); img.src = f.preview;
  });

  /* ---------- submit ---------- */
  $('[data-form]').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await LT.ui.requireLogin('Log in so our team can save your prescription and call you.'); } catch (er) { return; }
    if (!$('#rxFor').value || $('#rxFor option').length < 2) await loadMembers();
    let ok = true;
    if (!files.length) { const b = $('[data-ferr]'); b.textContent = 'Please add at least one prescription image or PDF.'; b.hidden = false; ok = false; }
    ok = err('rxFor', $('#rxFor').value ? '' : 'Choose who this prescription is for.') && ok;
    ok = err('rxMob', /^[6-9]\d{9}$/.test($('#rxMob').value) ? '' : 'Enter a valid 10-digit mobile number so we can call you.') && ok;
    ok = err('rxOk', $('#rxOk').checked ? '' : 'Please allow us to view the prescription and call you.') && ok;
    ok = checkDate() && ok;
    if (!ok) { const first = app.querySelector('.lt-field-err:not([hidden])'); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    saveDraft();
    const btn = e.submitter || $('[data-submit]');
    try {
      const res = await busy(btn, async () => {
        const thumbs = (await Promise.all(files.map(thumbOf))).filter(Boolean);
        return LT.api.saveRequest({ files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })), thumbnails: thumbs, thumbnail: thumbs[0] || null,
          doctor: $('#rxDoc').value.trim(), date: $('#rxDate').value, memberId: $('#rxFor').value, callbackMobile: $('#rxMob').value, callbackTime: $('#rxTime').value,
          mode: (app.querySelector('input[name=rxMode]:checked') || {}).value, notes: $('#rxNotes').value.trim() });
      });
      LT.store.set({ prescriptionDraft: LT.store.defaults().prescriptionDraft });
      success(res.requestId);
    } catch (er) { toast(errMsg(er), 'danger'); }
  });

  function success(id) {
    const mob = $('#rxMob').value, when = $('#rxTime').value;
    let left = 6, timer;
    const go = () => { clearInterval(timer); location.href = url('my-requests.html?new=' + encodeURIComponent(id)); };
    const md = modal.open({ title: false, static: true, sheet: false,
      body: `<div class="text-center py-2"><svg class="lt-success-anim" viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="46"/><path d="M32 54l14 14 26-30"/></svg>
        <h2 class="h3 fw-bold">Prescription received!</h2>
        <p class="mx-auto" style="max-width:420px">Thank you. Our team will connect with you soon on <b class="lt-ink">+91 ${esc(mob)}</b> (${esc(when.split(' (')[0].toLowerCase())}) to confirm your tests.</p>
        <p><span class="lt-idchip"><i class="bi bi-file-earmark-medical"></i> Request ID: ${esc(id)}</span></p>
        <ul class="lt-checklist small text-start mx-auto mt-3" style="max-width:360px"><li><i class="bi bi-telephone"></i>Keep your phone nearby – we usually call within 30 minutes.</li><li><i class="bi bi-list-check"></i>Confirmed tests will appear in My Prescription Requests.</li></ul>
        <button type="button" class="btn lt-btn w-100 mt-3" data-go>Go to My Prescription Requests <i class="bi bi-arrow-right"></i></button>
        <p class="small mt-2 mb-0 lt-muted" aria-live="polite">Redirecting in <b data-sec>${left}</b> seconds…</p></div>` });
    md.$('[data-go]').onclick = go;
    timer = setInterval(() => { left--; const s = md.$('[data-sec]'); if (s) s.textContent = left; if (left <= 0) go(); }, 1000);
  }

  loadMembers();
  checkDate();
})();
