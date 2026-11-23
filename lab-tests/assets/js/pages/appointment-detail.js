/* Page: appointment-detail.html?id= – PHASES 15-18, 20, 21
   Header, status timeline (with "Advance status" demo), technician / ETA, member-wise tests and
   reports, preparation reminders, centre QR + check-in, bill, actions: reschedule (same lab, max 2,
   not within 2 hrs), cancel with refund preview, remove member, call lab, support, invoice,
   feedback after completion, repeat order, consult a doctor. */
(function () {
  const { esc, money, toast, modal, skeleton, error, statusChip, avatar, labLogo, busy, errMsg, param, confirm, date } = LT.ui;
  const url = LT.layout.url;
  const id = param('id');
  const app = LT.layout.mount({ active: 'appointments', crumbs: [['Lab Tests', 'index.html'], ['My Appointments', 'appointments.html'], [id || 'Appointment', '']], title: 'Appointment ' + (id || '') });
  app.innerHTML = '<div class="lt-container mt-3" data-main></div>';
  const main = app.querySelector('[data-main]');
  let b = null, acted = false;
  const qr = (seed) => { let h = 0; for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; }; let c = ''; const fin = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#0b1b3f"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#0b1b3f"/>`; for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) { if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue; if (rnd() > 0.5) c += `<rect x="${x}" y="${y}" width="1" height="1" fill="#0b1b3f"/>`; } return `<svg class="lt-qr" viewBox="-1 -1 23 23" role="img" aria-label="Check-in QR code for ${esc(seed)}"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/>${c}${fin(0, 0)}${fin(14, 0)}${fin(0, 14)}</svg>`; };

  async function load() {
    if (!id) return LT.ui.empty(main, { icon: 'calendar', title: 'Booking not found', actions: [{ label: 'My Appointments', href: url('appointments.html') }] });
    skeleton(main, 'block', 3);
    try { b = await LT.api.getBooking(id); render(); }
    catch (e) { error(main, { text: errMsg(e), onRetry: load }); }
  }

  function render() {
    const done = ['REPORT_READY', 'COMPLETED'].includes(b.status), cancelled = b.status === 'CANCELLED';
    const tech = b.technician && b.stage >= 2 && b.mode === 'home';
    const dirUrl = b.centre ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(b.centre.name + ', ' + b.centre.address) : '';
    const timeline = b.timeline.map((t) => `<li class="${t.done ? 'is-done' : ''} ${t.current ? 'is-current' : ''}"><span class="lt-tl-dot">${t.done && !t.current ? '<i class="bi bi-check-lg"></i>' : t.current ? '<i class="bi bi-circle-fill" style="font-size:9px"></i>' : ''}</span>
        <strong>${esc(t.title)}</strong><small>${esc(t.text)}</small>${t.time ? `<span class="lt-tl-time">${date(t.time, { day: 'numeric', month: 'short' })}, ${LT.ui.time(t.time)}</span>` : ''}
        ${t.current && t.step === 'TECH_ASSIGNED' && tech ? techCard() : ''}${t.current && t.step === 'ON_THE_WAY' ? `${tech ? techCard() : ''}<div class="lt-tl-extra"><div class="d-flex justify-content-between small mb-1"><span>Technician is on the way</span><b>ETA 18 min</b></div><div class="lt-eta"><i></i></div></div>` : ''}
        ${t.current && t.step === 'PROCESSING' ? `<div class="lt-tl-extra small"><i class="bi bi-hourglass-split text-primary"></i> Expected report by ${date(new Date(new Date(b.slot.start).getTime() + 12 * 3600e3), { day: 'numeric', month: 'short' })}, ${LT.ui.time(new Date(new Date(b.slot.start).getTime() + 12 * 3600e3))}</div>` : ''}</li>`).join('');
    function techCard() {
      return `<div class="lt-tech lt-tl-extra">
        <div class="lt-tech-profile">
          ${avatar(b.technician.name, '#0d685e')}
          <div class="lt-tech-info">
            <b class="lt-ink d-block">${esc(b.technician.name)}</b>
            <div class="small text-muted lt-tech-subtitle">Certified phlebotomist · ★ ${b.technician.rating}</div>
            <a class="small fw-bold lt-tech-call mt-1" href="tel:${b.technician.phone.replace(/\s/g, '')}"><i class="bi bi-telephone-fill"></i> ${esc(b.technician.phone)}</a>
          </div>
        </div>
        <div class="lt-tech-code">
          <small>Share code</small>
          <b>${esc(b.technician.code)}</b>
        </div>
      </div>`;
    }

    main.innerHTML = `<section class="lt-card"><div class="d-flex flex-wrap justify-content-between gap-3 align-items-start">
        <div class="d-flex gap-3 align-items-center">${labLogo(b.lab)}<div><div class="d-flex flex-wrap gap-2 align-items-center"><h1 class="h4 fw-bold mb-0">${esc(b.id)}</h1>${statusChip(b.status)}</div><p class="mb-0 mt-1"><b class="lt-ink">${esc(b.lab.name)}</b> · ${esc(b.lab.phone)}</p></div></div>
        <div class="lt-acts lt-noprint"><a class="btn lt-btn-outline lt-btn-sm" href="tel:${b.lab.phone.replace(/\s/g, '')}"><i class="bi bi-telephone"></i> Call lab</a><button type="button" class="btn lt-btn-ghost lt-btn-sm" data-support><i class="bi bi-headset"></i> Support</button><button type="button" class="btn lt-btn-ghost lt-btn-sm" data-inv><i class="bi bi-receipt"></i> Invoice</button></div></div>
      <div class="lt-bk-grid mb-0"><div><i class="bi bi-calendar-event"></i><span>Slot<b>${esc(LT.ui.fmtSlot(b))}</b></span></div><div><i class="bi bi-${b.mode === 'home' ? 'house-heart' : 'hospital'}"></i><span>${b.mode === 'home' ? 'Home collection' : 'Centre visit'}<b>${b.mode === 'home' && b.address ? esc(b.address.house + ', ' + b.address.area) : b.centre ? esc(b.centre.name) : ''}</b></span></div><div><i class="bi bi-people"></i><span>Members<b>${b.membersView.length}</b></span></div><div><i class="bi bi-arrow-repeat"></i><span>Reschedules used<b>${b.reschedules || 0} of 2</b></span></div></div></section>
      ${cancelled ? `<div class="lt-alert is-danger mt-3"><i class="bi bi-x-octagon"></i><div><strong>This booking was cancelled.</strong> Reason: ${esc(b.cancel.reason)}${b.cancel.note ? ' – “' + esc(b.cancel.note) + '”' : '.'}
        ${b.cancel.attachment ? `<div class="lt-cn-att">${b.cancel.attachment.preview ? `<button type="button" class="lt-cn-att-chip" data-att><img src="${b.cancel.attachment.preview}" alt=""><span>${esc(b.cancel.attachment.name)}</span><i class="bi bi-eye"></i></button>` : `<span class="lt-cn-att-chip"><i class="bi bi-file-earmark-pdf-fill text-danger"></i><span>${esc(b.cancel.attachment.name)}</span><small>${kb(b.cancel.attachment.size)}</small></span>`}</div>` : '<br>'}Refund: <b>${b.cancel.refundPct}%</b>${b.cancel.refundAmount != null ? ' (' + money(b.cancel.refundAmount) + ')' : ''} · Status: <b>${esc(b.cancel.refundStatus)}</b> · usually 5-7 working days to your original payment method.</div></div>` : ''}
      <div class="row g-4 mt-1"><div class="col-lg-7">
        <section class="lt-card"><div class="lt-card-title"><h2><i class="bi bi-signpost-split"></i> Tracking</h2>${!cancelled && !done ? '<button type="button" class="lt-linkbtn small lt-noprint" data-advance><i class="bi bi-skip-forward"></i> Advance status (demo)</button>' : ''}</div><ol class="lt-tl">${timeline}</ol></section>
        <section class="lt-card"><div class="lt-card-title"><h2><i class="bi bi-person-lines-fill"></i> Members &amp; reports</h2></div>${b.membersView.map((m) => `<div class="lt-member-report-item py-3 border-top">
          <div class="lt-member-report-main">
            ${avatar(m.name, null, 'sm')}
            <div class="lt-member-report-info">
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <b class="lt-ink">${esc(m.name)}</b>
                <span class="lt-pill lt-pill-subtle">${esc(m.relationship)}</span>
              </div>
              <div class="small text-muted mt-1 lt-member-report-tests">
                <i class="bi bi-cart3 text-primary me-1"></i>${m.tests.map((t) => esc(t.name)).join(' · ')}
              </div>
            </div>
          </div>
          <div class="lt-member-report-act">
            ${m.reportStatus === 'ready' ? `<a class="btn lt-btn lt-btn-sm" href="${url('report-view.html?id=' + m.reportId)}"><i class="bi bi-file-earmark-medical"></i> View report</a>` : m.reportStatus === 'cancelled' ? '<span class="lt-pill">Cancelled</span>' : '<span class="lt-pill is-warn"><i class="bi bi-hourglass-split"></i>Report not ready</span>'}
          </div>
        </div>`).join('')}</section>
        ${done ? `<section class="lt-band"><div class="d-flex flex-wrap gap-3 align-items-center justify-content-between"><div><h2 class="h5 fw-bold">Consult a doctor about your report</h2><p class="mb-0">Talk to a certified doctor on video and understand what your numbers mean.</p></div><a class="btn lt-btn-light" href="${LT.layout.site('doctor/find-doctor.html')}"><i class="bi bi-camera-video"></i> Consult now</a></div></section>` : ''}
      </div><div class="col-lg-5">
        ${!cancelled && !done ? `<section class="lt-card"><div class="lt-card-title"><h2><i class="bi bi-clipboard2-pulse"></i> Preparation reminders</h2></div><ul class="lt-checklist">${b.fastingHours ? `<li><i class="bi bi-cup-hot text-warning"></i><span><b>Fast ${b.fastingHours}-12 hrs</b> before ${LT.ui.time(b.slot.start)}. Stop eating by ${LT.ui.time(new Date(new Date(b.slot.start).getTime() - Math.max(10, b.fastingHours) * 3600e3))} the night before.</span></li>` : '<li><i class="bi bi-check-circle-fill"></i>No fasting needed.</li>'}<li><i class="bi bi-droplet"></i>Drink water – it makes collection easier.</li><li><i class="bi bi-capsule"></i>Take regular medicines after the sample unless your doctor says otherwise.</li><li><i class="bi bi-person-vcard"></i>Keep photo IDs ready for all members.</li></ul></section>` : ''}
        ${b.mode === 'centre' && b.centre && !cancelled && !done ? `<section class="lt-card text-center"><h2 class="h6 fw-bold">Show this at the centre</h2>${qr(b.id)}<p class="small">${esc(b.centre.name)}<br>${esc(b.centre.hours)}</p><div class="lt-acts justify-content-center">${b.checkedIn ? '<span class="lt-pill is-success"><i class="bi bi-check2-circle"></i>Checked in</span>' : '<button type="button" class="btn lt-btn lt-btn-sm" data-checkin>Check-in</button>'}<a class="btn lt-btn-outline lt-btn-sm" href="${dirUrl}" target="_blank" rel="noopener"><i class="bi bi-sign-turn-right"></i> Get Directions</a></div></section>` : ''}
        <section class="lt-card"><div class="lt-card-title"><h2><i class="bi bi-receipt"></i> Bill &amp; payment</h2></div><div class="lt-bill small"><div><span>Test total (MRP)</span><b>${money(b.bill.mrp)}</b></div><div class="is-minus"><span>Lab discount</span><b>- ${money(b.bill.discount)}</b></div>${b.bill.coupon ? `<div class="is-minus"><span>Coupon ${esc(b.bill.couponCode || '')}</span><b>- ${money(b.bill.coupon)}</b></div>` : ''}<div><span>Collection</span><b>${b.bill.collection ? money(b.bill.collection) : 'FREE'}</b></div><div class="is-total"><span>Total</span><b>${money(b.bill.total)}</b></div></div>
          <p class="small mt-2 mb-0">${esc(b.payment.method || '')} · ${esc(b.payment.id || '')} · <b>${esc(b.payment.status)}</b></p>${(b.partialRefunds || []).map((r) => `<p class="small text-success mb-0"><i class="bi bi-arrow-counterclockwise"></i> Partial refund ${money(r.amount)} initiated</p>`).join('')}
          ${b.requests.length ? `<div class="d-flex gap-2 mt-3">${b.requests.map((r) => `<img src="${r.thumbnail}" alt="Prescription ${r.id}" width="48" height="62" style="border-radius:6px;border:1px solid var(--lt-border)">`).join('')}</div>` : ''}</section>
        <section class="lt-card lt-noprint"><div class="lt-card-title"><h2><i class="bi bi-sliders"></i> Manage booking</h2></div>
          <div class="lt-manage-actions mt-3">
            ${b.isUpcoming ? `<button type="button" class="btn lt-btn-outline" data-resched ${b.canChange && (b.reschedules || 0) < 2 ? '' : 'disabled'}><i class="bi bi-calendar2-week"></i> Reschedule</button>
              ${b.membersView.length > 1 ? `<button type="button" class="btn lt-btn-ghost" data-rmmember ${b.canChange ? '' : 'disabled'}><i class="bi bi-person-dash"></i> Remove a member</button>` : ''}
              <button type="button" class="btn lt-btn-ghost text-danger" data-cancel><i class="bi bi-x-circle"></i> Cancel booking</button>` : ''}
            ${done ? `<button type="button" class="btn lt-btn" data-feedback><i class="bi bi-star"></i> ${b.review ? 'Your rating: ' + '★'.repeat(b.review.rating) : 'Rate your experience'}</button><button type="button" class="btn lt-btn-outline" data-repeat data-busy="Loading…"><i class="bi bi-arrow-repeat"></i> Repeat this order</button>` : ''}
            ${cancelled ? `<button type="button" class="btn lt-btn" data-repeat data-busy="Loading…"><i class="bi bi-arrow-repeat"></i> Book these tests again</button>` : ''}
            <button type="button" class="btn lt-btn-ghost" data-support><i class="bi bi-headset"></i> Help &amp; support</button>
          </div>
          ${b.isUpcoming && !b.canChange ? '<small class="text-center d-block text-muted mt-2">Changes close 2 hours before the slot or once the technician is on the way.</small>' : b.isUpcoming && (b.reschedules || 0) >= 2 ? '<small class="text-center d-block text-danger mt-2">Reschedule limit reached (2 of 2).</small>' : ''}
        </section>
      </div></div>`;

    const on = (sel, fn) => main.querySelectorAll(sel).forEach((x) => { x.onclick = fn; });
    on('[data-inv]', () => LT.ui.invoice(b));
    on('[data-support]', support);
    on('[data-advance]', async (e) => { try { b = await busy(e.currentTarget, () => LT.api.advanceBooking(b.id)); toast('Status: ' + b.timeline.find((t) => t.current).title); render(); if (b.status === 'REPORT_READY') setTimeout(feedback, 700); } catch (er) { toast(errMsg(er), 'warning'); } });
    on('[data-checkin]', async (e) => { b = await busy(e.currentTarget, () => LT.api.checkIn(b.id)); toast('Checked in. Please wait for your token.'); render(); });
    on('[data-resched]', reschedule);
    on('[data-cancel]', cancel);
    on('[data-att]', () => viewAttachment(b.cancel.attachment));
    on('[data-rmmember]', removeMember);
    on('[data-feedback]', feedback);
    on('[data-repeat]', async (e) => { await busy(e.currentTarget, () => LT.api.repeatOrder(b.id)); LT.layout.flash('Same tests and members loaded. Pick a lab to continue.'); location.href = url('select-lab.html'); });
    if (!acted) { acted = true; const a = param('action'); if (a === 'reschedule' && b.canChange) setTimeout(reschedule, 300); if (a === 'cancel' && b.isUpcoming) setTimeout(cancel, 300); if (done && !b.review && param('feedback') !== '0' && sessionStorage.getItem('lt_fb_' + b.id) !== '1') { sessionStorage.setItem('lt_fb_' + b.id, '1'); setTimeout(feedback, 900); } }
  }

  /* ---------- reschedule (same lab) ---------- */
  function reschedule() {
    if ((b.reschedules || 0) >= 2) return confirm({ title: 'Reschedule limit reached', icon: 'calendar-x', body: '<p class="mb-0">A booking can be rescheduled only 2 times. You can cancel and book again.</p>', ok: 'OK', cancel: false });
    let day = LT.api.isoDay(0), pick = null;
    const md = modal.open({
      title: 'Reschedule ' + b.id, sub: 'Same lab: ' + b.lab.name + ' · ' + (2 - (b.reschedules || 0)) + ' of 2 reschedules left', size: 'lg',
      body: '<div class="lt-dates" data-d></div><div data-s class="mt-3"></div>', footer: '<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">Keep current slot</button><button type="button" class="btn lt-btn" data-ok disabled data-busy="Updating…">Confirm new slot</button>'
    });
    const dates = () => { md.$('[data-d]').innerHTML = Array.from({ length: 7 }, (_, i) => { const iso = LT.api.isoDay(i), d = new Date(iso + 'T00:00:00'); return `<button type="button" class="lt-date" data-day="${iso}" aria-pressed="${iso === day}"><span>${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' })}</span><b>${d.getDate()}</b><small>${d.toLocaleDateString('en-IN', { month: 'short' })}</small></button>`; }).join(''); };
    const slots = async () => {
      md.$('[data-s]').innerHTML = '<div class="lt-skel" style="height:120px"></div>';
      const list = await LT.api.getSlots(b.labId, day, b.mode, b.membersView.length);
      const ok = list.filter((x) => ['available', 'fast'].includes(x.state));
      md.$('[data-s]').innerHTML = ok.length ? `<div class="lt-slots">${ok.map((x) => `<button type="button" class="lt-slot ${x.state === 'fast' ? 'is-fast' : ''}" data-st="${x.start}|${x.end}">${LT.ui.time(x.start)}<small>${x.left} left</small></button>`).join('')}</div>` : '<p class="small">No slots on this day. Try another date.</p>';
    };
    md.$('[data-d]').onclick = (e) => { const x = e.target.closest('[data-day]'); if (!x) return; day = x.dataset.day; pick = null; md.$('[data-ok]').disabled = true; dates(); slots(); };
    md.$('[data-s]').onclick = (e) => { const x = e.target.closest('[data-st]'); if (!x) return; const [start, end] = x.dataset.st.split('|'); pick = { start, end }; md.$$('[data-st]').forEach((y) => y.setAttribute('aria-pressed', y === x)); md.$('[data-ok]').disabled = false; };
    md.$('[data-ok]').onclick = async (e) => { try { b = await busy(e.currentTarget, () => LT.api.rescheduleBooking(b.id, pick)); md.close(); toast('Rescheduled to ' + b.slotLabel); render(); } catch (er) { toast(errMsg(er), 'danger'); } };
    dates(); slots();
  }

  /* ---------- cancel with refund preview ---------- */
  /* "Other" reason: free-text reason (10-300 chars, required) + one optional supporting file
     (JPG / PNG / PDF, max 5 MB). Images are shrunk before saving so localStorage stays small. */
  const CN_MAX = 300, CN_MIN = 10, CN_FILE_MB = 5, CN_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  const kb = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
  const shrink = (file) => new Promise((res) => {
    if (!file.type.startsWith('image/')) return res(null);
    const fr = new FileReader();
    fr.onload = () => { const img = new Image(); img.onload = () => { const k = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.72)); }; img.onerror = () => res(null); img.src = fr.result; };
    fr.onerror = () => res(null); fr.readAsDataURL(file);
  });
  function cancel() {
    const pct = b.refundPct, amt = Math.round((b.bill.total * pct) / 100);
    let file = null, preview = null;
    const md = modal.open({
      title: 'Cancel booking ' + b.id + '?',
      body: `<label class="form-label" for="cnR">Reason for cancelling</label><select id="cnR" class="form-select" aria-describedby="cnRErr"><option value="">Choose a reason</option><option>Doctor changed the tests</option><option>Not available at this time</option><option>Booked by mistake</option><option>Found a better price</option><option>Health issue / travelling</option><option value="Other">Other</option></select><div class="lt-field-err" id="cnRErr" data-e hidden>Please choose a reason.</div>
        <div class="lt-cn-other" data-other hidden>
          <label class="form-label" for="cnT">Tell us your reason <span class="text-danger" aria-hidden="true">*</span></label>
          <textarea id="cnT" class="form-control" rows="3" maxlength="${CN_MAX}" placeholder="Please describe why you are cancelling this booking" aria-describedby="cnTErr cnTCount" aria-required="true"></textarea>
          <div class="lt-cn-meta"><div class="lt-field-err" id="cnTErr" data-te hidden>Please write at least ${CN_MIN} characters.</div><small class="lt-cn-count" id="cnTCount" data-count>0 / ${CN_MAX}</small></div>
          <span class="form-label d-block mt-3 mb-2">Supporting document <span class="lt-badge-opt">Optional</span></span>
          <div class="lt-cn-drop" data-drop tabindex="0" role="button" aria-label="Attach a supporting document. Drag and drop or press Enter to browse">
            <i class="bi bi-cloud-arrow-up" aria-hidden="true"></i><span><b>Upload a file</b> or drag &amp; drop<small>JPG, PNG or PDF · max ${CN_FILE_MB} MB (e.g. doctor's note, travel ticket)</small></span>
          </div>
          <input type="file" data-file accept=".jpg,.jpeg,.png,.pdf" hidden>
          <div data-filebox></div><div class="lt-field-err" data-fe hidden></div>
        </div>
        <div class="lt-card mt-3 p-3"><b class="lt-ink">Refund preview</b><div class="d-flex justify-content-between mt-2"><span>Paid</span><b>${money(b.bill.total)}</b></div><div class="d-flex justify-content-between"><span>Refund (${pct}%)</span><b class="${pct ? 'text-success' : 'text-danger'}">${money(amt)}</b></div>
          <ul class="small mt-2 mb-0 ps-3" style="list-style:disc"><li class="${pct === 100 ? 'fw-bold lt-ink' : ''}">More than 12 hrs before slot: 100% refund</li><li class="${pct === 50 ? 'fw-bold lt-ink' : ''}">2-12 hrs before slot: 50% refund</li><li class="${pct === 0 ? 'fw-bold lt-ink' : ''}">Within 2 hrs: no refund</li></ul></div>`,
      footer: '<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">Keep booking</button><button type="button" class="btn lt-btn-danger" data-ok data-busy="Cancelling…">Cancel booking</button>'
    });
    const sel = md.$('#cnR'), other = md.$('[data-other]'), ta = md.$('#cnT'), inp = md.$('[data-file]'), drop = md.$('[data-drop]'), fe = md.$('[data-fe]');
    const isOther = () => sel.value === 'Other';
    sel.onchange = () => {
      md.$('[data-e]').hidden = !!sel.value; sel.classList.remove('is-invalid');
      other.hidden = !isOther();
      if (isOther()) setTimeout(() => ta.focus(), 50);
    };
    ta.oninput = () => {
      const n = ta.value.length; md.$('[data-count]').textContent = n + ' / ' + CN_MAX;
      md.$('[data-count]').classList.toggle('is-near', n > CN_MAX - 30);
      if (ta.value.trim().length >= CN_MIN) { md.$('[data-te]').hidden = true; ta.classList.remove('is-invalid'); }
    };
    const paintFile = () => {
      md.$('[data-filebox]').innerHTML = file ? `<div class="lt-file lt-cn-file"><span class="lt-file-thumb">${preview ? `<img src="${preview}" alt="">` : '<i class="bi bi-file-earmark-pdf-fill"></i>'}</span>
        <span class="lt-file-info"><strong title="${esc(file.name)}">${esc(file.name)}</strong><small>${kb(file.size)} · Ready to upload</small></span>
        <button type="button" class="btn lt-btn-ghost lt-btn-sm" data-rmfile aria-label="Remove ${esc(file.name)}"><i class="bi bi-trash3"></i></button></div>` : '';
      drop.hidden = !!file;
      const rm = md.$('[data-rmfile]'); if (rm) rm.onclick = () => { file = null; preview = null; inp.value = ''; paintFile(); drop.focus(); };
    };
    const take = async (f) => {
      fe.hidden = true; if (!f) return;
      if (!CN_TYPES.includes(f.type)) { fe.textContent = 'Only JPG, PNG or PDF files are allowed.'; fe.hidden = false; return; }
      if (f.size > CN_FILE_MB * 1048576) { fe.textContent = 'File is too large. Maximum size is ' + CN_FILE_MB + ' MB.'; fe.hidden = false; return; }
      file = f; preview = await shrink(f); paintFile();
    };
    drop.onclick = () => inp.click();
    drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } };
    inp.onchange = () => take(inp.files[0]);
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('is-over'); };
    drop.ondragleave = () => drop.classList.remove('is-over');
    drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('is-over'); take(e.dataTransfer.files[0]); };

    md.$('[data-ok]').onclick = async (e) => {
      const r = sel.value;
      if (!r) { md.$('[data-e]').hidden = false; sel.classList.add('is-invalid'); sel.focus(); return; }
      let extra = {};
      if (isOther()) {
        const note = ta.value.trim();
        if (note.length < CN_MIN) { md.$('[data-te]').hidden = false; ta.classList.add('is-invalid'); ta.focus(); return; }
        extra = { note, attachment: file ? { name: file.name, size: file.size, type: file.type, preview } : null };
      }
      try {
        b = await busy(e.currentTarget, () => LT.api.cancelBooking(b.id, r, extra)); md.close();
        toast(pct ? 'Booking cancelled. Refund of ' + money(amt) + ' initiated.' : 'Booking cancelled.', 'info'); render();
      } catch (er) { toast(errMsg(er), 'danger'); }
    };
  }
  function viewAttachment(a) {
    modal.open({
      title: a.name, sub: kb(a.size), size: 'lg',
      body: `<div class="lt-cn-view"><img src="${a.preview}" alt="Cancellation document ${esc(a.name)}"></div>`,
      footer: '<button type="button" class="btn lt-btn" data-bs-dismiss="modal">Close</button>'
    });
  }
  function removeMember() {
    const md = modal.open({
      title: 'Remove a member', sub: 'The booking amount is recalculated and the difference is refunded.',
      body: `<div class="d-grid gap-2" role="radiogroup">${b.membersView.map((m, i) => `<label class="lt-opt"><input class="lt-opt-input" type="radio" name="rm" value="${m.memberId}" ${i === b.membersView.length - 1 ? 'checked' : ''}><span class="lt-opt-card"><span class="lt-opt-check"><i class="bi bi-check"></i></span>${avatar(m.name, null, 'sm')}<span class="lt-opt-body"><h3>${esc(m.name)}</h3><p>${m.tests.length} tests · ${money(m.subtotal)}</p></span></span></label>`).join('')}</div><p class="small mt-3 mb-0"><i class="bi bi-info-circle text-primary"></i> Partial refund goes to your original payment method in 5-7 working days.</p>`,
      footer: '<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn lt-btn-danger" data-ok data-busy="Updating…">Remove member</button>'
    });
    md.$('[data-ok]').onclick = async (e) => { try { const r = await busy(e.currentTarget, () => LT.api.removeMemberFromBooking(b.id, md.$('input[name=rm]:checked').value)); b = r; md.close(); toast('Member removed. Partial refund of ' + money(r.refund) + ' initiated.'); render(); } catch (er) { toast(errMsg(er), 'danger'); } };
  }

  /* ---------- feedback (PHASE 20) ---------- */
  function feedback() {
    let stars = b.review ? b.review.rating : 0;
    const md = modal.open({
      title: 'How was your experience?', sub: 'Rate ' + b.lab.name,
      body: `<div class="lt-stars justify-content-center" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="${n === stars}" aria-label="${n} star${n > 1 ? 's' : ''}" data-n="${n}" class="${n <= stars ? 'is-on' : ''}">★</button>`).join('')}</div>
        <div data-low class="mt-3" hidden><div class="lt-alert is-warn"><i class="bi bi-emoji-frown"></i><div>We're sorry – our support team will contact you within 24 hours to make this right.</div></div></div>
        <p class="small fw-bold mt-3 mb-2 lt-ink">What went well?</p><div class="lt-togglechips">${['On time', 'Polite', 'Painless', 'Clear report'].map((t, i) => `<input type="checkbox" id="fb${i}" value="${t}" ${b.review && b.review.tags.includes(t) ? 'checked' : ''}><label for="fb${i}">${t}</label>`).join('')}</div>
        <label class="form-label mt-3" for="fbC">Comments <span class="lt-badge-opt">Optional</span></label><textarea id="fbC" class="form-control" rows="3">${esc(b.review ? b.review.comment : '')}</textarea>`,
      footer: '<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">Later</button><button type="button" class="btn lt-btn" data-ok data-busy="Sending…">Submit</button>'
    });
    const paint = () => { md.$$('[data-n]').forEach((x) => { x.classList.toggle('is-on', +x.dataset.n <= stars); x.setAttribute('aria-checked', +x.dataset.n === stars); }); md.$('[data-low]').hidden = !(stars && stars <= 2); };
    md.$('.lt-stars').onclick = (e) => { const x = e.target.closest('[data-n]'); if (x) { stars = +x.dataset.n; paint(); } };
    paint();
    md.$('[data-ok]').onclick = async (e) => {
      if (!stars) return toast('Please choose a star rating', 'warning');
      await busy(e.currentTarget, () => LT.api.saveReview(b.id, stars, md.$$('.lt-togglechips input:checked').map((i) => i.value), md.$('#fbC').value.trim()));
      md.close(); toast(stars <= 2 ? 'Thanks. Support will reach out to you.' : 'Thank you for your feedback!'); b = await LT.api.getBooking(b.id); render();
    };
  }

  /* ---------- support (PHASE 21) ---------- */
  function support() {
    const faqs = [['When will I get my refund?', 'Refunds reach your original payment method in 5-7 working days after cancellation.'], ['The technician is late', 'Technicians arrive within the 30-minute window. If it is past the window, call the lab or raise a request below.'], ['My report is delayed', 'Some tests take longer. You will get an SMS the moment the report is ready.']];
    const md = modal.open({
      title: 'Help & support', sub: 'Booking ' + b.id, size: 'lg',
      body: `<div class="accordion lt-faq" id="supF">${faqs.map((f, i) => `<div class="accordion-item"><h3 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#sf${i}">${f[0]}</button></h3><div id="sf${i}" class="accordion-collapse collapse" data-bs-parent="#supF"><div class="accordion-body">${f[1]}</div></div></div>`).join('')}</div>
        <h3 class="h6 fw-bold mt-4">Still need help?</h3><div class="row g-2"><div class="col-md-5"><label class="form-label" for="spT">Topic</label><select id="spT" class="form-select"><option>Reschedule / cancel</option><option>Payment &amp; refund</option><option>Technician / collection</option><option>Report</option><option>Other</option></select></div><div class="col-md-7"><label class="form-label" for="spM">Message</label><textarea id="spM" class="form-control" rows="2" placeholder="Describe the issue"></textarea></div></div><div class="lt-field-err" data-e hidden>Please describe the issue (at least 10 characters).</div>`,
      footer: '<a class="btn lt-btn-ghost me-auto" href="tel:+919830024236"><i class="bi bi-telephone"></i> Call support</a><button type="button" class="btn lt-btn" data-ok data-busy="Sending…">Submit request</button>'
    });
    md.$('[data-ok]').onclick = async (e) => { const m = md.$('#spM').value.trim(); if (m.length < 10) { md.$('[data-e]').hidden = false; return; } const r = await busy(e.currentTarget, () => LT.api.submitSupport({ bookingId: b.id, topic: md.$('#spT').value, message: m })); md.close(); toast('Request ' + r.ticketId + ' raised. We will call you shortly.'); };
  }
  load();
})();
