/* Page: summary.html – PHASE 14 Booking summary + payment (2 steps on one page)
   Step 1: members & tests, prescription, location, lab, slot, bill (coupon code box under Taxes), consent.
   Step 2: payment method + "Simulate result" (success / failed / processing).
   Slot-hold countdown; on expiry -> "Slot expired" -> slot.html. */
(function () {
  const { esc, money, hours, toast, modal, skeleton, error, busy, errMsg, labLogo, sourceChips, avatar } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'labtests', stepper: 'pay', title: 'Summary & payment' });
  if (!LT.guards.require(['location', 'cart', 'members', 'lab', 'place', 'slot'])) return;
  let data = null, step = 1, timer = null, expiredShown = false;

  app.innerHTML = `<div class="lt-container"><div class="lt-page-head d-flex flex-wrap justify-content-between align-items-end gap-3"><div><h1 data-h>Review your booking</h1><p data-p>Check everything once before you pay.</p></div><span class="lt-holdchip" data-hold role="timer" aria-live="off"><i class="bi bi-stopwatch"></i> <span>10:00</span></span></div>
    <div class="row g-4"><div class="col-lg-8" data-main></div><aside class="col-lg-4"><div class="lt-aside" data-bill></div></aside></div></div>`;
  const $ = (q) => app.querySelector(q);

  /* ---------- hold timer ---------- */
  function startTimer() {
    const s = LT.store.get();
    let until = s.slot.heldUntil;
    if (!until) { until = Date.now() + 10 * 60000; LT.store.set({ slot: Object.assign(s.slot, { heldUntil: until }) }); }
    const chip = $('[data-hold]');
    const tick = () => {
      const left = Math.max(0, Math.round((until - Date.now()) / 1000));
      chip.querySelector('span').textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0');
      chip.classList.toggle('is-low', left < 120);
      chip.setAttribute('aria-label', 'Slot held for ' + Math.floor(left / 60) + ' minutes ' + (left % 60) + ' seconds');
      if (!left && !expiredShown) { expiredShown = true; clearInterval(timer); expired(); }
    };
    tick(); timer = setInterval(tick, 1000);
  }
  function expired() {
    const md = modal.open({ title: 'Slot expired', static: true, body: '<div class="lt-confirm"><span class="lt-confirm-ico is-danger"><i class="bi bi-hourglass-bottom"></i></span><p class="mb-0">We held your slot for 10 minutes. It has now been released. Please pick a slot again – your tests, members and lab are saved.</p></div>', footer: '<button type="button" class="btn lt-btn" data-ok>Choose a new slot</button>' });
    md.$('[data-ok]').onclick = () => { LT.store.set({ slot: LT.store.defaults().slot }); location.href = url('slot.html'); };
  }

  async function load() {
    sessionStorage.removeItem('lt_pending_booking'); // booking is (re)created from the latest state on pay
    skeleton($('[data-main]'), 'block', 3); skeleton($('[data-bill]'), 'block', 1);
    try {
      const s = LT.store.get();
      const [sum, cart, addresses, members] = await Promise.all([LT.api.getBillSummary(), LT.api.getCartDetails(), s.mode === 'home' ? LT.api.getAddresses() : [], LT.api.getMembers()]);
      data = { sum, cart, address: addresses.find((a) => a.id === s.address.id), members };
      if (s.coupon.code && !sum.bill.couponCode) { toast('Coupon ' + s.coupon.code + ' no longer applies and was removed', 'warning'); LT.store.set({ coupon: { code: null } }); return load(); }
      step === 1 ? renderSummary() : renderPayment();
      renderBill();
    } catch (e) { error($('[data-main]'), { text: errMsg(e), onRetry: load }); }
  }

  /* ---------- step 1 ---------- */
  function renderSummary() {
    const s = LT.store.get(), { sum, cart, address } = data, lab = sum.lab;
    const c = lab.centres.find((x) => x.id === s.lab.centreId) || lab.nearestCentre;
    const head = (icon, t, href) => `<div class="lt-sumcard-head"><h2><i class="bi bi-${icon}"></i>${t}</h2>${href ? `<a class="lt-linkbtn" href="${url(href)}">Change</a>` : ''}</div>`;
    const slotD = new Date(s.slot.start), slotE = new Date(s.slot.end);
    const tm = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    $('[data-h]').textContent = 'Review your booking'; $('[data-p]').textContent = 'Check everything once before you pay.';
    $('[data-main]').innerHTML = `
      <section class="lt-card">${head('people', 'Members &amp; tests', 'cart.html')}
        ${sum.bill.perMember.map((pm) => `<div class="py-2 border-top"><div class="d-flex align-items-center gap-2 mb-2">${avatar(pm.member.name, null, 'sm')}<b class="lt-ink">${esc(pm.member.name)}</b><small>${esc(pm.member.relationship)}</small><span class="ms-auto fw-bold lt-ink">${money(pm.price)}</span></div>
          <ul class="d-grid gap-1 small">${pm.itemsDetail.map((i) => { const ci = cart.items.find((x) => x.id === i.id); return `<li class="d-flex flex-wrap gap-2 align-items-center"><i class="bi bi-check2 text-success"></i><span class="lt-ink">${esc(i.name)}</span>${ci ? sourceChips(ci.sources) : ''}<span class="lt-muted">· ${i.fastingHours ? i.fastingHours + ' hrs fasting' : 'No fasting'} · ${hours(i.tat)}</span></li>`; }).join('')}</ul></div>`).join('')}</section>
      ${cart.requests.length ? `<section class="lt-card">${head('file-earmark-medical', 'Prescription', 'my-requests.html')}<div class="d-flex gap-2">${cart.requests.map((r) => `<button type="button" class="p-0 border rounded-3 overflow-hidden" data-rx="${r.id}" style="width:64px;height:82px" aria-label="View prescription ${r.id}"><img src="${r.thumbnail}" alt="" style="width:100%;height:100%;object-fit:cover"></button>`).join('')}</div></section>` : ''}
      <section class="lt-card">${head(s.mode === 'home' ? 'house-heart' : 'hospital', s.mode === 'home' ? 'Home collection address' : 'Lab centre', 'location.html')}
        ${s.mode === 'home' && address ? `<p class="mb-0"><b class="lt-ink">${esc(address.type)} · ${esc(address.name)}</b><br>${esc(address.house)}, ${esc(address.area)}, ${esc(address.city)} ${esc(address.pincode)}<br><small>+91 ${esc(address.mobile)}</small></p>` : `<p class="mb-0"><b class="lt-ink">${esc(c.name)}</b><br>${esc(c.address)}<br><small>${esc(c.hours)}</small></p>`}</section>
      <section class="lt-card">${head('building', 'Lab', 'compare-labs.html')}<div class="d-flex gap-3 align-items-center">${labLogo(lab, 'sm')}<div><b class="lt-ink">${esc(lab.name)}</b><div class="lt-badges mt-1">${lab.badges.map((b) => `<span>${esc(b)}</span>`).join('')}</div></div><span class="lt-pill ms-auto"><i class="bi bi-hand-index"></i>Chosen by you</span></div></section>
      <section class="lt-card">${head('calendar-check', 'Slot', 'slot.html')}<p class="mb-0 fw-bold lt-ink">${slotD.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} | ${tm(slotD)} - ${tm(slotE)}</p><small>${s.mode === 'home' ? 'Technician arrival window' : 'Please reach 10 minutes early'}</small></section>`;
    $('[data-main]').querySelectorAll('[data-rx]').forEach((b) => { b.onclick = () => { const r = cart.requests.find((x) => x.id === b.dataset.rx); modal.open({ title: 'Prescription ' + r.id, body: `<img src="${r.thumbnail}" alt="Prescription" style="max-height:65vh;margin:0 auto;display:block;border-radius:10px">` }); }; });
  }

  /* ---------- coupon code box (inside Bill details, under Taxes) – review step only, not on Payment ---------- */
  function couponBox(b) {
    if (b.couponCode) {
      return `<div class="lt-bcoupon is-applied"><div class="lt-bcoupon-ok"><i class="bi bi-ticket-perforated-fill" aria-hidden="true"></i>
        <span class="lt-bcoupon-txt"><b>${esc(b.couponCode)} applied</b><small>You saved ${money(b.coupon)}</small></span>
        <button type="button" class="lt-linkbtn is-danger" data-rmcp>Remove</button></div></div>`;
    }
    return `<div class="lt-bcoupon"><div class="lt-bcoupon-row"><label class="visually-hidden" for="cpIn">Coupon code</label>
        <span class="lt-bcoupon-field"><i class="bi bi-ticket-perforated" aria-hidden="true"></i><input id="cpIn" class="form-control" placeholder="Enter coupon code" autocomplete="off" maxlength="20"></span>
        <button type="button" class="btn lt-btn-outline lt-btn-sm" data-apply data-busy="Checking…">Apply</button></div>
      <div class="lt-bcoupon-msg" data-cpmsg aria-live="polite"></div></div>`;
  }
  function bindCoupon() {
    const msg = $('[data-cpmsg]'), input = $('#cpIn'), btn = $('[data-apply]');
    const rm = $('[data-rmcp]'); if (rm) rm.onclick = () => { LT.store.set({ coupon: { code: null } }); toast('Coupon removed', 'info'); load(); };
    if (!input) return;
    const show = (html) => { msg.innerHTML = html; };
    input.oninput = () => { input.value = input.value.toUpperCase().replace(/\s/g, ''); input.classList.remove('is-invalid'); show(''); };
    input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } };
    btn.onclick = async (e) => {
      const code = input.value.trim().toUpperCase();
      if (!code) { input.classList.add('is-invalid'); input.focus(); return show('<span class="is-err"><i class="bi bi-exclamation-circle"></i> Enter a coupon code.</span>'); }
      try {
        const r = await busy(e.currentTarget, () => LT.api.applyCoupon(code, data.sum.bill.price));
        if (!r.ok) { input.classList.add('is-invalid'); return show(`<span class="is-${r.state === 'invalid' ? 'err' : 'warn'}"><i class="bi bi-${r.state === 'expired' ? 'calendar-x' : r.state === 'invalid' ? 'x-octagon' : 'info-circle'}"></i> ${esc(r.reason)}</span>`); }
        LT.store.set({ coupon: { code: r.coupon.code } }); toast(r.coupon.code + ' applied – you save ' + money(r.amount)); load();
      } catch (er) { toast(errMsg(er), 'danger'); }
    };
  }

  /* ---------- bill (right column) ---------- */
  function renderBill() {
    const b = data.sum.bill;
    const line = (l, v, cls) => `<div class="${cls || ''}"><span>${l}</span><b>${v}</b></div>`;
    $('[data-bill]').innerHTML = `<div class="lt-aside-card"><h2 class="h6 fw-bold">Bill details</h2><div class="lt-bill mt-3">
        ${line('Test total (MRP)', money(b.mrp))}${line('Lab / promotional discount', '- ' + money(b.labDiscount), 'is-minus')}${b.coupon ? line('Coupon (' + esc(b.couponCode) + ')', '- ' + money(b.coupon), 'is-minus') : ''}
        ${line(LT.store.get().mode === 'home' ? 'Home collection charge' : 'Centre visit', b.collection ? money(b.collection) : '<span class="text-success">FREE</span>')}${line('Safety &amp; hygiene kit', '<span class="text-success">FREE</span>')}${line('Taxes <small>(diagnostics exempt)</small>', money(b.tax))}
        ${step === 1 ? couponBox(b) : ''}
        ${line('Total payable', money(b.total), 'is-total')}</div>
      ${b.saved ? `<div class="lt-saved-strip mt-3"><i class="bi bi-piggy-bank"></i> You save ${money(b.saved)} (${b.savedPct}%)</div>` : ''}
      <button type="button" class="lt-linkbtn small mt-3" data-bs-toggle="collapse" data-bs-target="#ltBreak" aria-expanded="false" aria-controls="ltBreak">View breakup per member <i class="bi bi-chevron-down"></i></button>
      <div class="collapse" id="ltBreak"><div class="lt-bill mt-2 small">${b.perMember.map((pm) => line(esc(pm.member.name) + ' <small>(' + pm.items.length + ' tests)</small>', money(pm.price))).join('')}${b.collection ? line('Collection (once per booking)', money(b.collection)) : ''}</div></div>
      <div class="lt-consent" data-consentbox ${step === 2 ? 'hidden' : ''}><div class="form-check mt-3"><input class="form-check-input" type="checkbox" id="ltConsent" aria-describedby="ltConsentErr"><label class="form-check-label small" for="ltConsent">I agree to the <a href="#" onclick="return false" class="text-primary">terms</a>, the lab's cancellation policy and to my samples being tested at ${esc(data.sum.lab.name)}.</label></div>
        <p class="lt-consent-err" id="ltConsentErr" role="alert" hidden><i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i> Please tick this box to agree before you proceed to pay.</p></div>
      <button type="button" class="btn lt-btn w-100 mt-3 d-none d-lg-flex" data-aside-act>Proceed</button><p class="lt-aside-hint" data-aside-txt></p></div>`;
    bindCoupon();
    const consent = $('#ltConsent');
    /* "Proceed to Pay" stays clickable: without the consent tick it shows the user what is missing
       (scrolls to the box, red highlight + message, focuses the checkbox) instead of doing nothing */
    const consentError = (on) => {
      const box = $('[data-consentbox]'); if (!box) return;
      box.classList.toggle('is-error', on); $('#ltConsentErr').hidden = !on;
      consent.setAttribute('aria-invalid', on ? 'true' : 'false');
      if (on) {
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        box.classList.remove('is-shake'); void box.offsetWidth; box.classList.add('is-shake');
        setTimeout(() => consent.focus({ preventScroll: true }), 350);
      }
    };
    const setProceed = () => LT.layout.setAction(step === 1
      ? { text: `<b>${money(b.total)}</b>${b.saved ? 'You save ' + money(b.saved) : 'Total payable'}`, label: `Proceed to Pay ${money(b.total)}`, hint: consent.checked ? '' : 'Tick the consent box to continue', onClick: () => { if (!consent.checked) return consentError(true); step = 2; renderPayment(); renderBill(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }
      : { text: `<b>${money(b.total)}</b>Secure payment`, label: `<i class="bi bi-lock-fill"></i> Pay ${money(b.total)}`, busy: 'Processing…', onClick: pay });
    if (consent) { consent.checked = !!sessionStorage.getItem('lt_consent'); consent.onchange = () => { consent.checked ? sessionStorage.setItem('lt_consent', '1') : sessionStorage.removeItem('lt_consent'); if (consent.checked) consentError(false); setProceed(); }; }
    setProceed();
  }

  /* ---------- step 2: payment ---------- */
  function renderPayment() {
    const s = LT.store.get(), b = data.sum.bill;
    $('[data-h]').textContent = 'Payment'; $('[data-p]').textContent = 'Choose how you want to pay. Your slot stays held while you pay.';
    const m = (v, icon, t, sub, checked) => `<label class="lt-opt"><input class="lt-opt-input" type="radio" name="pm" value="${v}" ${checked ? 'checked' : ''}><span class="lt-opt-card"><span class="lt-opt-check"><i class="bi bi-check"></i></span><span class="lt-opt-ico"><i class="bi bi-${icon}"></i></span><span class="lt-opt-body"><h3>${t}</h3><p>${sub}</p></span></span></label>`;
    $('[data-main]').innerHTML = `<button type="button" class="btn lt-btn-ghost mb-2" data-back><i class="bi bi-arrow-left"></i> Back to summary</button>
      <div class="lt-pay-methods" role="radiogroup" aria-label="Payment method">${m('upi', 'phone', 'UPI', 'Google Pay, PhonePe, Paytm, BHIM', true)}${m('card', 'credit-card', 'Credit / Debit card', 'Visa, Mastercard, RuPay')}${m('netbanking', 'bank', 'Net banking', 'All major Indian banks')}${m('wallet', 'wallet2', 'Wallets', 'Paytm, Amazon Pay, Mobikwik')}${m('later', s.mode === 'home' ? 'cash-coin' : 'shop', 'Pay at ' + (s.mode === 'home' ? 'collection' : 'centre'), 'Cash or UPI to the ' + (s.mode === 'home' ? 'technician' : 'centre') + '. Slot is confirmed now.')}</div>
      <div class="lt-pay-detail" data-detail></div>
      <div class="lt-demo-sim mt-3"><b class="lt-ink"><i class="bi bi-tools text-warning"></i> Demo: Simulate result</b><div class="lt-segpills mt-2" role="radiogroup" aria-label="Simulate payment result">${[['success', 'Success'], ['failed', 'Failed'], ['processing', 'Debited, not confirmed']].map(([k, l]) => `<input type="radio" name="sim" id="sim${k}" value="${k}" ${s.payment.simulate === k ? 'checked' : ''}><label for="sim${k}">${l}</label>`).join('')}</div></div>
      <p class="small mt-3"><i class="bi bi-shield-lock-fill text-success"></i> Payments are 256-bit encrypted. We never store your card details.</p>`;
    const detail = () => {
      const v = $('input[name=pm]:checked').value, d = $('[data-detail]');
      d.innerHTML = {
        upi: '<label class="form-label" for="pyUpi">UPI ID</label><input id="pyUpi" class="form-control" placeholder="yourname@okbank"><div class="lt-field-err" data-e hidden></div><div class="lt-upi-apps"><span>GPay</span><span>PhonePe</span><span>Paytm</span><span>BHIM</span></div>',
        card: '<div class="row g-3"><div class="col-12"><label class="form-label" for="pyNum">Card number</label><input id="pyNum" class="form-control" inputmode="numeric" maxlength="19" placeholder="4111 1111 1111 1111" autocomplete="off"></div><div class="col-6"><label class="form-label" for="pyExp">Expiry (MM/YY)</label><input id="pyExp" class="form-control" maxlength="5" placeholder="MM/YY" autocomplete="off"></div><div class="col-6"><label class="form-label" for="pyCvv">CVV</label><input id="pyCvv" class="form-control" type="password" inputmode="numeric" maxlength="3" autocomplete="off"></div><div class="col-12"><label class="form-label" for="pyName">Name on card</label><input id="pyName" class="form-control" autocomplete="off"></div></div><div class="lt-field-err" data-e hidden></div>',
        netbanking: '<label class="form-label" for="pyBank">Select your bank</label><select id="pyBank" class="form-select"><option value="">Choose bank</option><option>State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option><option>Kotak Mahindra Bank</option><option>Bank of Baroda</option></select><div class="lt-field-err" data-e hidden></div>',
        wallet: '<div class="lt-segpills">' + ['Paytm', 'Amazon Pay', 'Mobikwik'].map((w, i) => `<input type="radio" name="wl" id="wl${i}" value="${w}" ${i ? '' : 'checked'}><label for="wl${i}">${w}</label>`).join('') + '</div>',
        later: `<div class="lt-alert is-info"><i class="bi bi-info-circle"></i><div>Pay <b>${money(b.total)}</b> by cash or UPI ${s.mode === 'home' ? 'to the technician at collection' : 'at the centre reception'}. Online coupons stay applied.</div></div>`
      }[v];
      d.oninput = d.onchange = (ev) => { const f = ev.target; if (f.classList && f.classList.contains('is-invalid')) { f.classList.remove('is-invalid'); f.removeAttribute('aria-invalid'); if (!d.querySelector('input.is-invalid, select.is-invalid')) { d.classList.remove('is-error'); const er = d.querySelector('[data-e]'); if (er) er.hidden = true; } } };
      const num = $('#pyNum'); if (num) num.oninput = () => { num.value = num.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); };
      const exp = $('#pyExp'); if (exp) exp.oninput = () => { exp.value = exp.value.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2'); };
    };
    $('[data-main]').addEventListener('change', (e) => { if (e.target.name === 'pm') detail(); if (e.target.name === 'sim') LT.store.set({ payment: { simulate: e.target.value } }); });
    $('[data-back]').onclick = () => { step = 1; renderSummary(); renderBill(); };
    detail();
  }
  function validPay() {
    const v = $('input[name=pm]:checked').value, e = $('[data-detail] [data-e]'), detail = $('[data-detail]');
    detail.querySelectorAll('.is-invalid').forEach((x) => x.classList.remove('is-invalid'));
    detail.classList.remove('is-error');
    /* Pay with missing / wrong details: scroll to the field, red highlight + message, focus it */
    const bad = (m, field) => {
      if (e) { e.textContent = m; e.hidden = false; e.setAttribute('role', 'alert'); }
      detail.classList.add('is-error');
      if (field) { field.classList.add('is-invalid'); field.setAttribute('aria-invalid', 'true'); if (e) { e.id = e.id || 'ltPayErr'; field.setAttribute('aria-describedby', e.id); } }
      (field || detail).scrollIntoView({ behavior: 'smooth', block: 'center' });
      detail.classList.remove('is-shake'); void detail.offsetWidth; detail.classList.add('is-shake');
      if (field) setTimeout(() => field.focus({ preventScroll: true }), 350);
      return false;
    };
    if (v === 'upi' && !/^[\w.-]{2,}@[a-z]{2,}$/i.test($('#pyUpi').value.trim())) return bad($('#pyUpi').value.trim() ? 'Enter a valid UPI ID, e.g. name@okbank' : 'Enter your UPI ID to pay, e.g. name@okbank', $('#pyUpi'));
    if (v === 'card') {
      if ($('#pyNum').value.replace(/\s/g, '').length !== 16) return bad('Card number must be 16 digits.', $('#pyNum'));
      const [mm, yy] = $('#pyExp').value.split('/').map(Number);
      if (!mm || mm > 12 || !yy || new Date(2000 + yy, mm) < new Date()) return bad('Enter a valid future expiry date (MM/YY).', $('#pyExp'));
      if (!/^\d{3}$/.test($('#pyCvv').value)) return bad('CVV must be 3 digits.', $('#pyCvv'));
      if (!/^[A-Za-z ]{2,}$/.test($('#pyName').value.trim())) return bad('Enter the name on the card.', $('#pyName'));
    }
    if (v === 'netbanking' && !$('#pyBank').value) return bad('Choose your bank.', $('#pyBank'));
    if (e) e.hidden = true;
    return { upi: 'UPI', card: 'Card', netbanking: 'Net banking', wallet: 'Wallet', later: 'Pay at ' + (LT.store.get().mode === 'home' ? 'collection' : 'centre') }[v];
  }
  async function pay() {
    const method = validPay(); if (!method) return;
    const sim = (document.querySelector('input[name=sim]:checked') || {}).value || 'success';
    const ov = document.createElement('div'); ov.className = 'lt-overlay'; ov.setAttribute('role', 'alert');
    ov.innerHTML = '<div><div class="lt-orbit"></div><h2 class="h4 text-white fw-bold">Processing payment…</h2><p class="text-white-50">Please don\'t close or refresh this page.</p></div>';
    document.body.appendChild(ov);
    try {
      let id = sessionStorage.getItem('lt_pending_booking');
      if (!id) { id = (await LT.api.createBooking(LT.store.get())).bookingId; sessionStorage.setItem('lt_pending_booking', id); }
      const [r] = await Promise.all([LT.api.pay(id, method === 'Pay at ' + (LT.store.get().mode === 'home' ? 'collection' : 'centre') ? 'success' : sim, method), new Promise((ok) => setTimeout(ok, 2000))]);
      ov.remove();
      if (r.status === 'success') { sessionStorage.removeItem('lt_pending_booking'); sessionStorage.removeItem('lt_consent'); clearInterval(timer); location.href = url('confirmation.html?id=' + encodeURIComponent(r.bookingId)); return; }
      if (r.status === 'processing') {
        const md = modal.open({ title: 'Payment is processing', static: true, body: `<div class="lt-confirm"><span class="lt-confirm-ico"><i class="bi bi-hourglass-split"></i></span><div><p><b>Do not pay again.</b> If money was debited, we'll confirm your booking within 15 minutes and notify you by SMS.</p><p class="small mb-0">Reference: ${esc(id)}</p></div></div>`, footer: '<a class="btn lt-btn-outline" href="' + url('appointments.html') + '">Go to My Appointments</a><button type="button" class="btn lt-btn" data-bs-dismiss="modal">OK</button>' });
        return;
      }
      const md = modal.open({ title: 'Payment Failed', body: `<div class="text-center"><span class="lt-confirm-ico is-danger mx-auto mb-3" style="width:64px;height:64px;font-size:30px"><i class="bi bi-x-lg"></i></span><p class="lt-ink fw-bold">${esc(r.reason)}</p><p class="small mb-0">Your slot is still held and your cart is saved.</p></div>`,
        footer: `<a class="btn lt-btn-ghost" href="${url('cart.html')}">Back to Cart</a><button type="button" class="btn lt-btn-outline" data-change>Change Method</button><button type="button" class="btn lt-btn" data-retry>Retry Payment</button>` });
      md.$('[data-retry]').onclick = () => { md.close(); setTimeout(pay, 350); };
      md.$('[data-change]').onclick = () => { md.close(); $('input[name=pm][value=card]').checked = true; $('input[name=pm][value=card]').dispatchEvent(new Event('change', { bubbles: true })); };
    } catch (e) { ov.remove(); toast(errMsg(e), 'danger'); }
  }

  startTimer();
  load();
})();
