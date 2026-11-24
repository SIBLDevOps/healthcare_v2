/* Page: cart.html – PHASES 8-10 Lab Cart (members are chosen HERE – there is no member popup when adding).
   Add on a test card puts the test in the cart for Self; this page decides who gets each test:
     Top     "Your selected lab" card (lab, tests it does, total there) + "Change lab", or "Choose a lab".
     Step 1  "Who is this booking for?" – Add family member card first, then Self + every family member.
             Tap a member to book ALL suitable tests for them (tap again to remove them, with Undo).
             Incomplete profiles ask for age & gender first. Max 6 members per booking.
     Step 2  "Tests in your cart" – one card per test / package: details, price x members = total, remove,
             and member chips to choose exactly who gets it (gender rules block unsuitable members).
             A test with nobody ticked shows "Choose who this test is for".
   Also: centre-only warning, package overlap per member (Fix now), similar variants, fasting tip, prescription.
   Continue -> compare-labs.html (the Lab step); blocked until every test has a member. */
(function () {
  const { esc, money, hours, toast, modal, skeleton, empty, error, sourceChips, errMsg, avatar, labLogo, rating } = LT.ui;
  const url = LT.layout.url, MB = LT.members, P = LT.pricing;
  const app = LT.layout.mount({ active: 'labtests', stepper: 'cart', title: 'Your Lab Cart' });
  if (!LT.guards.require(['location'])) return;
  let askedVariant = false, members = [], autoSelf = false;
  const first = (n) => String(n || '').split(' ')[0];

  app.innerHTML = `<div class="lt-container"><div class="lt-page-head"><h1>Your lab cart</h1><p>Choose who each test is for – you or any family member. Each person gets a separate report.</p></div>
    <div class="row g-4"><div class="col-lg-8" data-main></div><aside class="col-lg-4"><div class="lt-aside" data-aside></div></aside></div></div>`;
  const main = app.querySelector('[data-main]'), aside = app.querySelector('[data-aside]');

  async function render() {
    if (!main.children.length) skeleton(main, 'block', 2);
    try {
      let s = LT.store.get();
      const [d0, mem, labBill0] = await Promise.all([LT.api.getCartDetails(), s.user.loggedIn ? LT.api.getMembers() : Promise.resolve([]),
        s.lab.id ? LT.api.getBillSummary().catch(() => null) : Promise.resolve(null)]);
      members = mem;
      let d = d0, labBill = labBill0;
      /* tests added before logging in (or old carts): give them to Self once, so nothing is left hanging */
      const self = members.find((m) => m.relationship === 'Self');
      if (self && !autoSelf && LT.cart.unassigned().length && !Object.keys(s.assignments || {}).length) {
        autoSelf = true;
        LT.cart.unassigned().forEach((c) => { if (self.incomplete || !MB.checks(c.id, [self])[self.id].blocked) LT.cart.toggleMember(c.id, self.id, true); });
        s = LT.store.get();
        [d, labBill] = await Promise.all([LT.api.getCartDetails(), s.lab.id ? LT.api.getBillSummary().catch(() => null) : Promise.resolve(null)]);
      }
      if (!d.items.length) {
        document.getElementById('ltActionBar') && document.getElementById('ltActionBar').remove();
        document.body.classList.remove('has-actionbar');
        aside.innerHTML = '';
        return empty(main, { icon: 'cart', title: 'Your lab cart is empty', text: 'Add a test or health package. You can book it for yourself or any family member here.', actions: [{ label: 'Browse tests', href: url('search.html') }, { label: 'Health packages', href: url('packages.html') }] });
      }
      const a = s.assignments || {};
      const whoOf = (id) => Object.keys(a).filter((m) => (a[m] || []).includes(id));
      const booked = members.filter((m) => (a[m.id] || []).length);
      const unassigned = LT.cart.unassigned();
      /* gender / age rules: { itemId: { memberId: { blocked, issue, level } } } */
      const rules = {}; d.items.forEach((i) => { rules[i.id] = members.length ? MB.checks(i.id, members) : {}; });
      /* package <-> single test overlap for the same person */
      const overlap = [];
      booked.forEach((m) => { const ids = a[m.id] || []; ids.filter((x) => P.isPackage(x)).forEach((pk) => ids.filter((x) => !P.isPackage(x) && P.item(pk).tests.includes(x)).forEach((t) => overlap.push({ m, t, pk }))); });

      main.innerHTML = `${labCard(labBill)}
        <div class="d-grid gap-3">
          ${d.centreOnly.length ? `<div class="lt-alert is-danger" role="alert"><i class="bi bi-hospital"></i><div><strong>${d.centreOnly.map((i) => esc(i.short || i.name)).join(', ')} ${d.centreOnly.length > 1 ? 'need' : 'needs'} a lab centre visit.</strong> You chose home collection, so ${d.centreOnly.length > 1 ? 'these tests' : 'this test'} can't be collected at home.
            <div class="lt-alert-acts"><button type="button" class="btn lt-btn btn-sm" data-switch-mode="centre">Switch to Lab Centre</button><button type="button" class="btn lt-btn-outline btn-sm" data-rm-centre>Remove ${d.centreOnly.length > 1 ? 'tests' : 'test'}</button></div></div></div>` : ''}
          ${overlap.length ? `<div class="lt-alert is-warn"><i class="bi bi-files"></i><div><strong>Possible duplicate:</strong> ${overlap.map((o) => `${esc(P.item(o.t).short || P.item(o.t).name)} is already in ${esc(P.item(o.pk).name)} for ${esc(first(o.m.name))}`).join('; ')}. You may be paying twice.<div class="lt-alert-acts"><button type="button" class="btn lt-btn btn-sm" data-fix>Fix now</button></div></div></div>` : ''}
          ${d.variants.length ? `<div class="lt-alert is-warn"><i class="bi bi-question-diamond"></i><div><strong>Similar tests in your cart:</strong> ${d.variants.map((p) => p.map((x) => esc(x.name)).join(' and ')).join('; ')}.<div class="lt-alert-acts"><button type="button" class="btn lt-btn btn-sm" data-variant>Choose the right one</button></div></div></div>` : ''}
        </div>
        ${whoSection(booked, d)}
        ${testsSection(d, whoOf, rules, unassigned)}
        ${d.fasting.count ? `<div class="lt-alert is-info align-items-center mt-3"><i class="bi bi-cup-hot"></i><div><strong>${d.fasting.count} test${d.fasting.count > 1 ? 's' : ''} need${d.fasting.count > 1 ? '' : 's'} ${Math.min(d.fasting.maxHours, 10)}-12 hrs fasting.</strong> Book an early morning slot (6-9 AM) and drink only water before the test.</div></div>` : ''}
        <div class="lt-cart-more"><a class="btn lt-btn-outline" href="${url('search.html')}"><i class="bi bi-plus-lg"></i> Add more tests</a><a class="btn lt-btn-outline" href="${url('packages.html')}"><i class="bi bi-box2-heart"></i> Health packages</a>${d.requests.length ? '<button type="button" class="btn lt-btn-ghost" data-viewrx><i class="bi bi-file-earmark-image"></i> View prescription</button>' : ''}</div>`;

      const fix = main.querySelector('[data-fix]'); if (fix) fix.onclick = () => fixOverlap(overlap);
      const rc = main.querySelector('[data-rm-centre]'); if (rc) rc.onclick = () => { d.centreOnly.forEach((i) => LT.cart.remove(i.id)); toast('Centre-only tests removed'); render(); };
      const vb = main.querySelector('[data-variant]'); if (vb) vb.onclick = () => variantModal(d.variants[0]);
      const vr = main.querySelector('[data-viewrx]'); if (vr) vr.onclick = () => modal.open({ title: 'Prescription', body: d.requests.map((r) => `<figure class="text-center"><img src="${r.thumbnail}" alt="Prescription ${r.id}" style="max-height:60vh;margin:0 auto;border-radius:10px;border:1px solid var(--lt-border)"><figcaption class="small mt-2">${esc(r.id)} · ${esc(r.doctor)}</figcaption></figure>`).join('') });
      if (d.variants.length && !askedVariant) { askedVariant = true; setTimeout(() => variantModal(d.variants[0]), 400); }

      LT.layout.renderAside(aside, {});
      const blocked = d.centreOnly.length > 0 || unassigned.length > 0 || !s.user.loggedIn;
      LT.layout.setAction({
        text: `<b>From ${money(d.estimate)}</b>${booked.length} member${booked.length === 1 ? '' : 's'} · ${d.tests} test${d.tests === 1 ? '' : 's'}`, label: (labBill ? 'Continue' : 'Continue to Compare Labs') + ' <i class="bi bi-arrow-right"></i>', disabled: blocked,
        hint: !s.user.loggedIn ? 'Log in to choose who each test is for.' : d.centreOnly.length ? 'Resolve the centre-only tests to continue.' : unassigned.length ? 'Choose who each test is for to continue.' : labBill ? 'Next: confirm ' + esc(labBill.lab.name) + ' or compare labs' : 'Next: choose a lab', onClick: next
      });
    } catch (e) { error(main, { text: errMsg(e), onRetry: render }); }
  }

  /* ---------- Step 1: who is this booking for? ---------- */
  function whoSection(booked, d) {
    const s = LT.store.get();
    if (!s.user.loggedIn) {
      return `<section class="lt-cstep" aria-labelledby="cwH"><div class="lt-cstep-head"><span class="lt-cstep-n">1</span><div><h2 id="cwH">Who is this booking for?</h2><p>Log in to book these tests for you and your family.</p></div></div>
        <div class="lt-cwho-login"><i class="bi bi-person-lock" aria-hidden="true"></i><span>Your family members appear here after you log in.</span><button type="button" class="btn lt-btn lt-btn-sm" data-login>Log in</button></div></section>`;
    }
    const card = (m) => {
      const n = (s.assignments[m.id] || []).length, on = n > 0;
      return `<button type="button" class="lt-cwho ${on ? 'is-on' : ''} ${m.incomplete ? 'is-incomplete' : ''}" data-who="${m.id}" aria-pressed="${on}" aria-label="${esc(m.name)}, ${esc(m.relationship)}${on ? ', booked for ' + n + ' test' + (n > 1 ? 's' : '') : ''}">
        <span class="lt-cwho-tick" aria-hidden="true"><i class="bi bi-check-lg"></i></span>
        ${avatar(m.name, MB.color(m.id))}
        <span class="lt-cwho-txt"><b>${esc(first(m.name))}${m.relationship === 'Self' ? ' <em>You</em>' : ''}</b>
          <small>${m.incomplete ? esc(m.relationship) + ' · add age &amp; gender' : esc(m.relationship) + ' · ' + m.age + ' yrs'}</small></span>
        <span class="lt-cwho-count">${on ? n + ' test' + (n > 1 ? 's' : '') : m.incomplete ? 'Complete profile' : 'Tap to add'}</span></button>`;
    };
    return `<section class="lt-cstep" aria-labelledby="cwH">
      <div class="lt-cstep-head"><span class="lt-cstep-n">1</span><div><h2 id="cwH">Who is this booking for?</h2><p>Tap a family member to book all your tests for them. Tap again to remove them.</p></div>
        <span class="lt-cstep-badge">${booked.length} of ${MB.MAX_SEL} max</span></div>
      <div class="lt-cwho-grid" role="group" aria-label="Family members">
        <button type="button" class="lt-cwho is-add" data-newm ${members.length >= MB.MAX_SAVED ? 'disabled' : ''}><span class="lt-cwho-plus" aria-hidden="true"><i class="bi bi-person-plus"></i></span>
          <span class="lt-cwho-txt"><b>Add member</b><small>${members.length} of ${MB.MAX_SAVED} saved</small></span></button>
        ${members.map(card).join('')}
      </div></section>`;
  }

  /* ---------- Step 2: tests, each with member chips ---------- */
  function testsSection(d, whoOf, rules, unassigned) {
    const s = LT.store.get();
    const item = (i) => {
      const who = whoOf(i.id), n = who.length, r = rules[i.id] || {};
      const chips = members.map((m) => {
        const on = who.includes(m.id), c = r[m.id] || {}, dis = c.blocked;
        return `<button type="button" class="lt-cchip ${on ? 'is-on' : ''} ${c.level === 'warn' ? 'is-warn' : ''}" data-tog="${i.id}|${m.id}" aria-pressed="${on}" ${dis ? 'disabled' : ''} title="${esc(c.issue || (on ? 'Remove ' + first(m.name) : 'Book for ' + first(m.name)))}">
          ${avatar(m.name, MB.color(m.id), 'sm')}<span>${esc(first(m.name))}</span><i class="bi bi-${dis ? 'slash-circle' : on ? 'check-lg' : 'plus-lg'}" aria-hidden="true"></i></button>`;
      }).join('');
      const notes = who.map((m) => (r[m] || {}).level === 'warn' ? `<span class="lt-cellnote is-warn"><i class="bi bi-exclamation-triangle"></i> ${esc(r[m].issue)}</span>` : '').join('');
      const blockedNote = members.filter((m) => (r[m.id] || {}).blocked).length ? `<span class="lt-citem-blocked"><i class="bi bi-info-circle"></i> ${esc(Object.values(r).find((x) => x.blocked).issue)}</span>` : '';
      return `<article class="lt-citem ${n ? '' : 'is-pending'}" aria-label="${esc(i.name)}">
        <div class="lt-citem-top"><span class="lt-citem-ico" aria-hidden="true"><i class="bi bi-${i.type === 'package' ? 'box2-heart' : 'droplet-half'}"></i></span>
          <div class="lt-citem-info"><a class="lt-citem-name" href="${url(i.type === 'package' ? 'packages.html?open=' + i.id : 'test-detail.html?id=' + i.id)}">${esc(i.name)}</a>
            <small>${i.type === 'package' ? i.tests.length + ' tests · ' + i.parameters + ' parameters' : esc(i.sampleType) + ' · ' + i.parameters + ' parameter' + (i.parameters > 1 ? 's' : '')} · ${i.fastingHours ? i.fastingHours + ' hrs fasting' : 'No fasting'} · Report in ${hours(i.tatHours)}</small>
            <div class="lt-citem-tags">${sourceChips(i.sources)}${i.centreOnly ? '<span class="lt-pill is-warn"><i class="bi bi-hospital"></i> Centre only</span>' : ''}</div></div>
          <div class="lt-citem-price"><small>From</small><b>${money(i.fromPrice * Math.max(1, n))}</b>${n > 1 ? `<span>${money(i.fromPrice)} × ${n}</span>` : `<del>${money(i.mrp)}</del>`}</div>
          <button type="button" class="lt-citem-rm" data-rm="${i.id}" aria-label="Remove ${esc(i.name)}" title="Remove from cart"><i class="bi bi-trash3"></i></button></div>
        ${s.user.loggedIn ? `<div class="lt-citem-who"><span class="lt-citem-for">For</span><div class="lt-cchips" role="group" aria-label="Who gets ${esc(i.name)}">${chips}</div></div>
        ${n ? '' : '<p class="lt-citem-need"><i class="bi bi-person-exclamation"></i> Choose who this test is for.</p>'}${notes}${blockedNote}` : ''}
      </article>`;
    };
    return `<section class="lt-cstep" aria-labelledby="ctH">
      <div class="lt-cstep-head"><span class="lt-cstep-n">2</span><div><h2 id="ctH">Tests in your cart <span class="lt-cstep-count">${d.items.length}</span></h2><p>Choose exactly who gets each test. Prices are the lowest near ${esc(s.location.pincode)}.</p></div>
        ${unassigned.length ? `<span class="lt-cstep-badge is-warn">${unassigned.length} need a member</span>` : ''}</div>
      <div class="lt-citems">${d.items.map(item).join('')}</div></section>`;
  }

  /* "Your selected lab" card – always at the top so the lab and "Change lab" are easy to find */
  function labCard(lb) {
    if (!lb) {
      return `<section class="lt-cartlab is-empty" aria-label="Lab for this booking">
        <span class="lt-cartlab-ico" aria-hidden="true"><i class="bi bi-building-add"></i></span>
        <div class="lt-cartlab-txt"><small class="lt-cartlab-eyebrow">Lab for this booking</small><h2>No lab selected yet</h2><p>Compare the price of your tests at labs near you and pick one.</p></div>
        <a class="btn lt-btn lt-cartlab-btn" href="${url('compare-labs.html')}"><i class="bi bi-layout-three-columns" aria-hidden="true"></i> Choose a lab</a></section>`;
    }
    const l = lb.lab, b = lb.bill, miss = (b.missingTests || []).map((id) => (P.item(id) || {}).short || (P.item(id) || {}).name), total = LT.store.get().cart.length;
    const have = total - miss.length;
    return `<section class="lt-cartlab ${miss.length ? 'is-partial' : ''}" aria-label="Your selected lab">
      <div class="lt-cartlab-lab">${labLogo(l)}
        <div class="lt-cartlab-txt"><small class="lt-cartlab-eyebrow"><i class="bi bi-building-check" aria-hidden="true"></i> Your selected lab</small>
          <h2>${esc(l.name)}</h2>
          <div class="lt-cartlab-meta">${rating(l.rating, l.reviews)}<span class="lt-badges">${l.badges.filter((x) => ['NABL', 'CAP', 'ISO'].includes(x)).map((x) => `<span>${esc(x)}</span>`).join('')}</span>
            <span class="lt-cmp-cov ${miss.length ? 'is-part' : 'is-full'}"><i class="bi bi-${miss.length ? 'exclamation-triangle' : 'check2-circle'}" aria-hidden="true"></i>${miss.length ? have + ' of ' + total + ' tests' : 'All ' + total + ' test' + (total > 1 ? 's' : '')}</span></div></div></div>
      <div class="lt-cartlab-side">
        <div class="lt-cartlab-total"><small>Total at this lab</small><b>${money(b.total)}</b>${b.saved ? `<span>You save ${money(b.saved)}</span>` : ''}</div>
        <a class="btn lt-btn-outline lt-cartlab-btn" href="${url('compare-labs.html')}"><i class="bi bi-arrow-left-right" aria-hidden="true"></i> Change lab</a>
      </div>
      ${miss.length ? `<p class="lt-cartlab-warn"><i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i> ${esc(miss.join(', '))} ${miss.length > 1 ? 'are' : 'is'} not done at ${esc(l.name)}. Change the lab to one that has everything, or ${miss.length > 1 ? 'they' : 'it'} will be left out of this booking.</p>` : ''}
    </section>`;
  }

  /* ---------- actions ---------- */
  const bookedIds = () => { const a = LT.store.get().assignments || {}; return Object.keys(a).filter((m) => (a[m] || []).length); };
  async function toggleWho(mid) {
    const m = members.find((x) => x.id === mid); if (!m) return;
    const s = LT.store.get(), mine = s.assignments[mid] || [];
    if (mine.length) {
      const snap = s.assignments;
      mine.slice().forEach((id) => LT.cart.toggleMember(id, mid, false));
      toast(first(m.name) + ' removed from this booking', 'info', { action: 'Undo', onAction: () => { LT.cart.setAssignments(snap); render(); } });
      return render();
    }
    if (m.incomplete) { const saved = await MB.form(m); if (!saved) return; return render(); }
    if (bookedIds().length >= MB.MAX_SEL) return toast('A booking can have up to ' + MB.MAX_SEL + ' members', 'warning');
    const ok = s.cart.filter((c) => !MB.checks(c.id, [m])[m.id].blocked);
    if (!ok.length) return toast('None of your tests are suitable for ' + first(m.name) + '.', 'warning');
    ok.forEach((c) => LT.cart.toggleMember(c.id, mid, true));
    const skipped = s.cart.length - ok.length;
    toast(ok.length + ' test' + (ok.length > 1 ? 's' : '') + ' booked for ' + first(m.name) + (skipped ? ' · ' + skipped + ' not suitable' : '') + '. Untick any test below.');
    render();
  }
  function toggleChip(id, mid) {
    const m = members.find((x) => x.id === mid); if (!m) return;
    const on = (LT.store.get().assignments[mid] || []).includes(id);
    if (!on && m.incomplete) { MB.form(m).then((saved) => { if (saved) render(); }); return; }
    if (!on && !bookedIds().includes(mid) && bookedIds().length >= MB.MAX_SEL) return toast('A booking can have up to ' + MB.MAX_SEL + ' members', 'warning');
    LT.cart.toggleMember(id, mid, !on);
    render();
  }

  main.addEventListener('click', async (e) => {
    const t = e.target;
    const who = t.closest('[data-who]'); if (who) return toggleWho(who.dataset.who);
    const tg = t.closest('[data-tog]'); if (tg && !tg.disabled) { const [id, mid] = tg.dataset.tog.split('|'); return toggleChip(id, mid); }
    const rm = t.closest('[data-rm]');
    if (rm) { const removed = LT.cart.remove(rm.dataset.rm); toast((P.item(rm.dataset.rm) || {}).name + ' removed', 'info', { action: 'Undo', onAction: () => { LT.cart.restore(removed); render(); } }); return render(); }
    if (t.closest('[data-newm]')) {
      const saved = await MB.form();
      if (!saved) return;
      members = await LT.api.getMembers();
      const ok = LT.store.get().cart.filter((c) => !MB.checks(c.id, [saved])[saved.id].blocked);
      if (ok.length && bookedIds().length < MB.MAX_SEL) { ok.forEach((c) => LT.cart.toggleMember(c.id, saved.id, true)); toast(first(saved.name) + ' added to this booking for ' + ok.length + ' test' + (ok.length > 1 ? 's' : '') + '. Untick any test below.'); }
      render();
    }
  });

  async function fixOverlap(list) {
    const ok = await LT.ui.confirm({ title: 'Remove duplicate tests?', icon: 'files', body: `<p>${list.map((o) => `<b>${esc(P.item(o.t).short || P.item(o.t).name)}</b> is already included in <b>${esc(P.item(o.pk).name)}</b> for ${esc(first(o.m.name))}.`).join('<br>')}</p><p class="mb-0">Remove the separate test${list.length > 1 ? 's' : ''} to avoid paying twice?</p>`, ok: 'Yes, remove', cancel: 'Keep both' });
    if (ok) { list.forEach((o) => LT.cart.removeFor(o.t, o.m.id)); toast('Duplicates removed'); render(); }
  }
  function variantModal(pair) {
    const md = modal.open({
      title: 'Which test did you mean?', sub: 'These two tests are very similar. Most doctors mean the first one.',
      body: `<div class="d-grid gap-2" role="radiogroup">${pair.map((x, i) => `<label class="lt-opt"><input class="lt-opt-input" type="radio" name="vr" value="${x.id}" ${i ? '' : 'checked'}><span class="lt-opt-card"><span class="lt-opt-check"><i class="bi bi-check"></i></span><span class="lt-opt-body"><h3>${esc(x.name)}</h3><p>${i ? 'Separate D2 and D3 values – usually for people on supplements.' : 'Standard vitamin D test that most doctors order.'}</p></span></span></label>`).join('')}
        <label class="lt-opt"><input class="lt-opt-input" type="radio" name="vr" value="both"><span class="lt-opt-card"><span class="lt-opt-check"><i class="bi bi-check"></i></span><span class="lt-opt-body"><h3>I need both</h3><p>Keep both tests in the cart.</p></span></span></label></div>`,
      footer: '<button type="button" class="btn lt-btn" data-ok>Confirm</button>'
    });
    md.$('[data-ok]').onclick = () => { const x = md.$('input[name=vr]:checked').value; if (x !== 'both') pair.filter((p) => p.id !== x).forEach((p) => LT.cart.remove(p.id)); md.close(); toast(x === 'both' ? 'Keeping both tests' : 'Updated your cart'); render(); };
  }
  async function next() {
    try { await LT.ui.requireLogin('Log in to book tests for you and your family.'); } catch (e) { return; }
    if (LT.cart.unassigned().length) { toast('Choose who each test is for to continue', 'warning'); const p = main.querySelector('.lt-citem.is-pending'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    location.href = url('compare-labs.html');
  }
  LT.page = Object.assign(LT.page || {}, { onCartChange: render });
  render();
})();
