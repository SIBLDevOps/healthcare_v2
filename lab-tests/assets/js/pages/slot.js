/* Page: slot.html – PHASE 13 Select Collection Date & Time
   Card: title + "For <members> • <lab>" chip, next 7 dates (selected date shows "N Slots"),
   MORNING SLOTS (12 one-hour windows 05:30 AM – 12:00 PM, "Fasting Recommended" when needed),
   2 columns on mobile / 3 on desktop, selected slot shows a tick, Confirm Slot button.
   Confirm -> api.holdSlot (10-min hold) -> summary.html */
(function () {
  const { esc, toast, error, errMsg, busy } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'labtests', stepper: 'slot', title: 'Select Collection Date & Time' });
  if (!LT.guards.require(['location', 'cart', 'members', 'lab', 'place'])) return;
  document.body.classList.add('lt-slot-page');
  const s0 = LT.store.get(), centre = s0.mode === 'centre';
  let day = s0.slot.date || null, picked = s0.slot.start ? { start: s0.slot.start, end: s0.slot.end } : null, lab = null, counts = {};
  const fmt = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  const dlabel = (iso) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/^(\w+)/, '$1,').replace(',,', ',');
  const open = (x) => x.state === 'available' || x.state === 'fast';

  app.innerHTML = `<div class="lt-container"><div class="row g-4"><div class="col-lg-8">
      <section class="lt-slotcard" aria-labelledby="ltSlotTitle">
        <header class="lt-slotcard-head"><h1 id="ltSlotTitle">Select Collection Date &amp; Time</h1><p class="lt-slotcard-for" data-for><span class="lt-skel" style="width:60%;height:16px;display:inline-block"></span></p></header>
        <div class="lt-sdates-wrap"><button type="button" class="lt-sdate-arrow" data-scroll="-1" aria-label="Previous dates"><i class="bi bi-chevron-left"></i></button>
          <div class="lt-sdates" data-dates role="radiogroup" aria-label="Choose a date"></div>
          <button type="button" class="lt-sdate-arrow" data-scroll="1" aria-label="More dates"><i class="bi bi-chevron-right"></i></button></div>
        <div class="lt-slotcard-body" data-slots aria-live="polite"></div>
        <p class="lt-slotcard-info" data-info></p>
        <footer class="lt-slotcard-foot"><button type="button" class="btn lt-slot-confirm" data-confirm disabled data-busy="Holding slot…">Select a slot</button></footer>
      </section></div>
    <aside class="col-lg-4"><div class="lt-aside" data-aside></div></aside></div></div>`;
  const $ = (q) => app.querySelector(q);

  async function init() {
    try {
      const [l, cart, members] = await Promise.all([LT.api.getLab(s0.lab.id), LT.api.getCartDetails(), LT.api.getMembers()]);
      lab = l;
      const who = members.filter((m) => s0.selectedMemberIds.includes(m.id)).map((m) => m.name);
      const c = l.centres.find((x) => x.id === s0.lab.centreId) || l.nearestCentre;
      $('[data-for]').innerHTML = `<span class="lt-slotcard-who" title="${esc(who.join(', '))}">For ${esc(who.length > 2 ? who[0] + ' +' + (who.length - 1) + ' more' : who.join(' & '))}</span><span class="lt-dot" aria-hidden="true">•</span><span class="lt-slotcard-lab" title="${esc(l.name)}">${esc(l.name)}</span>`;
      $('[data-info]').innerHTML = centre ? `<i class="bi bi-hospital"></i> Visit <b>${esc(c.name.split('–').pop().trim())}</b> within your 1-hour window. Please reach 10 minutes early.`
        : '<i class="bi bi-person-badge"></i> Our technician arrives at your address within the 1-hour window you choose.';
      app.dataset.fasting = cart.fasting.count ? '1' : '';
      /* slot count per day (for the date pills) */
      const days = Array.from({ length: 7 }, (_, i) => LT.api.isoDay(i));
      (await Promise.all(days.map((iso) => LT.api.getSlots(s0.lab.id, iso, s0.mode)))).forEach((list, i) => { counts[days[i]] = list.filter(open).length; });
      if (!day || !counts[day]) day = Object.keys(counts).find((k) => counts[k]) || LT.api.isoDay(0);
      paintDates(); loadSlots();
      const sel = $('.lt-sdate.is-active'); if (sel) sel.scrollIntoView({ block: 'nearest', inline: 'center' });
    } catch (e) { error($('[data-slots]'), { text: errMsg(e), onRetry: init }); }
  }
  function paintDates() {
    $('[data-dates]').innerHTML = Array.from({ length: 7 }, (_, i) => {
      const iso = LT.api.isoDay(i), d = new Date(iso + 'T00:00:00'), on = iso === day, n = counts[iso] || 0;
      return `<button type="button" class="lt-sdate ${on ? 'is-active' : ''}" role="radio" aria-checked="${on}" data-day="${iso}" ${n ? '' : 'disabled'} aria-label="${d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}, ${n ? n + ' slots' : 'no slots'}">
        <span>${d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}</span><b>${d.getDate()}</b>${on ? `<small>${n} Slots</small>` : !n ? '<small class="is-none">Full</small>' : ''}</button>`;
    }).join('');
  }
  $('[data-dates]').onclick = (e) => { const b = e.target.closest('[data-day]'); if (!b || b.disabled) return; day = b.dataset.day; paintDates(); loadSlots(); };
  app.querySelectorAll('[data-scroll]').forEach((b) => { b.onclick = () => { $('[data-dates]').scrollBy({ left: +b.dataset.scroll * 240, behavior: 'smooth' }); }; });

  async function loadSlots() {
    const box = $('[data-slots]');
    box.innerHTML = '<div class="lt-sgrid">' + '<div class="lt-skel" style="height:54px;border-radius:14px;margin:0"></div>'.repeat(12) + '</div>';
    try {
      const slots = await LT.api.getSlots(s0.lab.id, day, s0.mode);
      if (picked && picked.start.slice(0, 10) !== day) picked = null;
      if (picked && !slots.some((x) => x.start === picked.start && open(x))) picked = null;
      box.innerHTML = `<div class="lt-sgroup-head"><h2><i class="bi bi-brightness-high-fill" aria-hidden="true"></i>MORNING SLOTS</h2>${app.dataset.fasting ? '<span class="lt-fast-badge">Fasting Recommended</span>' : ''}</div>
        <div class="lt-sgrid" role="radiogroup" aria-label="Morning slots">${slots.map((x) => {
          const on = picked && picked.start === x.start, dis = !open(x);
          return `<button type="button" class="lt-sslot ${on ? 'is-active' : ''}" role="radio" aria-checked="${!!on}" data-s="${x.start}|${x.end}" ${dis ? 'disabled' : ''} aria-label="${fmt(x.start)} to ${fmt(x.end)}${dis ? ', unavailable' : ''}"><span>${fmt(x.start)} - ${fmt(x.end)}</span>${on ? '<i class="bi bi-check-circle-fill" aria-hidden="true"></i>' : ''}</button>`;
        }).join('')}</div>`;
      box.querySelector('.lt-sgrid').onclick = (e) => {
        const b = e.target.closest('[data-s]'); if (!b || b.disabled) return;
        const [start, end] = b.dataset.s.split('|'); picked = { start, end };
        box.querySelectorAll('[data-s]').forEach((x) => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-checked', on); const ic = x.querySelector('i'); if (on && !ic) x.insertAdjacentHTML('beforeend', '<i class="bi bi-check-circle-fill" aria-hidden="true"></i>'); if (!on && ic) ic.remove(); });
        bar();
      };
      bar();
    } catch (e) { error(box, { text: errMsg(e), onRetry: loadSlots }); }
  }
  async function confirmSlot(e) {
    if (!picked) return;
    try { await busy(e.currentTarget, () => LT.api.holdSlot({ date: picked.start.slice(0, 10), start: picked.start, end: picked.end })); toast('Slot held for 10 minutes'); location.href = url('summary.html'); }
    catch (er) { toast(errMsg(er), 'danger'); }
  }
  function bar() {
    const btn = $('[data-confirm]');
    const text = picked ? `Confirm Slot (${dlabel(picked.start)} • ${fmt(picked.start)})` : 'Select a slot';
    btn.disabled = !picked;
    btn.innerHTML = picked ? `<span>${text}</span><i class="bi bi-check-lg" aria-hidden="true"></i>` : text;
    btn.onclick = confirmSlot;
    LT.layout.setAction({ text: picked ? `<b>${dlabel(picked.start)} • ${fmt(picked.start)}</b>${esc(lab ? lab.name : '')}` : '<b>No slot selected</b>Pick a date and time', label: 'Confirm Slot <i class="bi bi-check-lg"></i>', disabled: !picked, busy: 'Holding slot…', hint: picked ? 'We hold this slot for 10 minutes' : 'Pick a date and time', onClick: confirmSlot });
  }
  LT.layout.renderAside($('[data-aside]'));
  init();
})();
