/* Page: confirmation.html?id= – BOOKING CONFIRMED
   Success animation, booking id + copy, summary cards, preparation, actions
   (view appointment, add to calendar .ics, share, invoice, book another).
   Clears cart + booking state in the store (user data stays). */
(function () {
  const { esc, money, toast, skeleton, error, errMsg, param, labLogo, avatar } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'labtests', title: 'Booking confirmed' });
  const id = param('id') || LT.store.get().lastBookingId;
  app.innerHTML = '<div class="lt-container mt-3" data-main></div>';
  const main = app.querySelector('[data-main]');

  async function load() {
    if (!id) return LT.ui.empty(main, { icon: 'calendar', title: 'No recent booking', text: 'Your confirmed bookings appear under My Appointments.', actions: [{ label: 'My Appointments', href: url('appointments.html') }, { label: 'Book a test', href: url('search.html') }] });
    skeleton(main, 'block', 3);
    try {
      const b = await LT.api.getBooking(id);
      if (LT.store.get().cart.length) LT.store.clearBooking();
      const paidLater = /^Pay at/.test(b.payment.method || '');
      const fasting = b.fastingHours;
      main.innerHTML = `<section class="lt-confirm-hero"><svg class="lt-success-anim" viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="46"/><path d="M32 54l14 14 26-30"/></svg>
          <h1>Booking Confirmed</h1><p class="mt-2">${b.mode === 'home' ? 'A technician will visit you' : 'See you at the centre'} on <b class="text-white">${esc(LT.ui.fmtSlot(b))}</b>.</p>
          <div class="d-flex flex-wrap justify-content-center gap-2 mt-3"><span class="lt-idchip"><i class="bi bi-hash"></i>${esc(b.id)}</span><button type="button" class="btn lt-btn-glass btn-sm" data-copy><i class="bi bi-copy"></i> Copy</button></div></section>
        <div class="row g-4 mt-1"><div class="col-lg-8">
          <section class="lt-card"><div class="lt-card-title"><h2><i class="bi bi-people"></i> Members &amp; tests</h2></div>${b.membersView.map((m) => `<div class="d-flex gap-3 py-2 border-top align-items-start">${avatar(m.name, null, 'sm')}<div class="flex-grow-1"><b class="lt-ink">${esc(m.name)}</b> <small>${esc(m.relationship)}</small><div class="small">${m.tests.map((t) => esc(t.name)).join(', ')}</div></div><b class="lt-ink">${money(m.subtotal)}</b></div>`).join('')}</section>
          <section class="lt-card"><div class="lt-card-title"><h2><i class="bi bi-clipboard2-pulse"></i> Before your test</h2></div>
            <ul class="lt-checklist">${fasting ? `
                <li><i class="bi bi-cup-hot text-warning"></i><span><b>Fast for ${fasting}-12 hours</b> before the slot. Only plain water is allowed.</span></li>` : '<li><i class="bi bi-check-circle-fill"></i>No fasting needed for your tests.</li>'}
                <li><i class="bi bi-person-vcard"></i>Keep ready: a photo ID for each member and the original prescription (if any).</li>
              ${b.mode === 'home' ? '<li><i class="bi bi-clock"></i>Technician arrival window: ' + esc(LT.ui.fmtSlot(b).split(', ').slice(-1)[0]) + '. You will get their name and phone 2 hours before.</li>' : '<li><i class="bi bi-geo-alt"></i>Reach the centre 10 minutes early and show the booking QR at reception.</li>'}
                <li class="flex-wrap"><i class="bi bi-telephone"></i>Need help? Call <a class="fw-bold text-primary" href="tel:+919830024236">+91 98300 24236</a> (7 AM - 10 PM).</li>
              </ul>
            </section>
        </div><div class="col-lg-4">
          <section class="lt-card"><div class="d-flex gap-3 align-items-center">${labLogo(b.lab, 'sm')}<div><b class="lt-ink">${esc(b.lab.name)}</b><div class="small">${esc(b.lab.phone)}</div></div></div>
            <dl class="lt-kv mt-3"><div><dt>Slot</dt><dd>${esc(LT.ui.fmtSlot(b))}</dd></div><div><dt>${b.mode === 'home' ? 'Address' : 'Centre'}</dt><dd>${b.mode === 'home' && b.address ? esc(b.address.house + ', ' + b.address.area) : b.centre ? esc(b.centre.name) : '-'}</dd></div>
              <div><dt>${paidLater ? 'Amount due' : 'Amount paid'}</dt><dd>${money(b.bill.total)}${b.bill.saved ? ` <span class="lt-save">saved ${money(b.bill.saved)}</span>` : ''}</dd></div><div><dt>Payment</dt><dd>${esc(b.payment.method)} · <small>${esc(b.payment.id)}</small></dd></div></dl></section>
          <div class="lt-confirm-actions mt-3">
            <a class="btn lt-btn" href="${url('appointment-detail.html?id=' + b.id)}"><i class="bi bi-calendar-check"></i> View Appointment</a>
            <button type="button" class="btn lt-btn-outline" data-share><i class="bi bi-share"></i> Share</button>
            <button type="button" class="btn lt-btn-outline" data-inv><i class="bi bi-receipt"></i> Download Invoice</button>
            <a class="btn lt-btn-ghost lt-btn-outline" href="${url('search.html')}"><i class="bi bi-plus-lg"></i> Book Another Test</a>
          </div>
        </div></div>`;
      main.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(b.id); toast('Booking ID copied'); } catch (e) { toast('Booking ID: ' + b.id, 'info'); } };
      main.querySelector('[data-inv]').onclick = () => LT.ui.invoice(b);
      main.querySelector('[data-share]').onclick = () => LT.ui.share('My lab test booking', 'Lab test booked with ' + b.lab.name + ' on ' + LT.ui.fmtSlot(b), location.href.split('confirmation.html')[0] + 'appointment-detail.html?id=' + b.id);
    } catch (e) { error(main, { text: errMsg(e), onRetry: load }); }
  }
  load();
})();
