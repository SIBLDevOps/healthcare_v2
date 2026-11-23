/* Page: cart.html – PHASES 8-10 Review cart, grouped by family member
   Every test belongs to one or more members (chosen in the "Select Member" popup when it was added).
   Per member: tests, source, fasting, report time, price, change members / remove, "Add test for X",
   edit profile and subtotal. Also: tests without a member, other family members, add member,
   package overlap per member, variant clarification, centre-only warning, fasting banner, undo.
   Continue -> select-lab.html */
(function () {
  const { esc, money, hours, toast, modal, skeleton, empty, error, sourceChips, errMsg, avatar } = LT.ui;
  const url = LT.layout.url, MB = LT.members, P = LT.pricing;
  const app = LT.layout.mount({ active: 'labtests', stepper: 'cart', title: 'Your Lab Cart' });
  if (!LT.guards.require(['location'])) return;
  let askedVariant = false;
  const first = (n) => String(n || '').split(' ')[0];

  app.innerHTML = `<div class="lt-container"><div class="lt-page-head"><h1>Your lab cart</h1><p>Tests are grouped by family member. Each person gets a separate report. The final price depends on the lab you select next.</p></div>
    <div class="row g-4"><div class="col-lg-8" data-main></div><aside class="col-lg-4"><div class="lt-aside" data-aside></div></aside></div></div>`;
  const main = app.querySelector('[data-main]'), aside = app.querySelector('[data-aside]');

  async function render() {
    if (!main.children.length) skeleton(main, 'block', 2);
    try {
      const s = LT.store.get();
      const [d, members] = await Promise.all([LT.api.getCartDetails(), s.user.loggedIn ? LT.api.getMembers() : Promise.resolve([])]);
      if (!d.items.length) {
        document.getElementById('ltActionBar') && document.getElementById('ltActionBar').remove();
        document.body.classList.remove('has-actionbar');
        aside.innerHTML = '';
        return empty(main, { icon: 'cart', title: 'Your lab cart is empty', text: 'Add a test or health package and choose who it is for – you, or any family member.', actions: [{ label: 'Browse tests', href: url('search.html') }, { label: 'Health packages', href: url('packages.html') }] });
      }
      const byId = {}; d.items.forEach((i) => { byId[i.id] = i; });
      const booked = s.selectedMemberIds.map((id) => members.find((m) => m.id === id)).filter(Boolean);
      const unassigned = LT.cart.unassigned().map((c) => byId[c.id]).filter(Boolean);
      const others = members.filter((m) => !s.selectedMemberIds.includes(m.id));
      const v = LT.matching.validateAssignments(s.assignments, booked.filter((m) => !m.incomplete), s.cart, {});
      const mine = (m) => (s.assignments[m.id] || []).map((id) => byId[id]).filter(Boolean);
      const sub = (m) => mine(m).reduce((t, i) => t + i.fromPrice, 0);
      /* package <-> test overlap for the same person */
      const overlap = [];
      booked.forEach((m) => { const ids = s.assignments[m.id] || []; ids.filter((x) => P.isPackage(x)).forEach((pk) => ids.filter((x) => !P.isPackage(x) && P.item(pk).tests.includes(x)).forEach((t) => overlap.push({ m, t, pk }))); });

      const tile = (i, l, n, cls) => `<div class="lt-sumtile ${cls || ''}"><small><i class="bi bi-${i}"></i>${l}</small><b>${n}</b></div>`;
      const itemRow = (i, m) => {
        const note = m ? ((v[m.id] || {}).issues || []).filter((x) => x.itemId === i.id && x.level !== 'error').map((x) => `<span class="lt-cellnote is-${x.level}"><i class="bi bi-exclamation-triangle"></i> ${esc(x.msg)}</span>`).join('') : '';
        const who = LT.cart.membersOf(i.id).length;
        return `<li class="lt-cm-item"><span class="lt-cm-ico"><i class="bi bi-${i.type === 'package' ? 'box2-heart' : 'eyedropper'}"></i></span>
          <div class="lt-cm-info"><a class="lt-cm-name" href="${url(i.type === 'package' ? 'packages.html?open=' + i.id : 'test-detail.html?id=' + i.id)}">${esc(i.name)}</a>
            <small>${i.type === 'package' ? i.tests.length + ' tests · ' + i.parameters + ' parameters' : esc(i.sampleType) + ' · ' + i.parameters + ' parameters'} · ${i.fastingHours ? i.fastingHours + ' hrs fasting' : 'No fasting'} · Report in ${hours(i.tatHours)}</small>
            <div class="lt-cm-tags">${sourceChips(i.sources)}${i.centreOnly ? '<span class="lt-pill is-warn"><i class="bi bi-hospital"></i> Centre only</span>' : ''}${who > 1 ? `<span class="lt-pill"><i class="bi bi-people"></i> ${who} members</span>` : ''}</div>${note}</div>
          <div class="lt-cm-price"><small>From</small><b>${money(i.fromPrice)}</b><del>${money(i.mrp)}</del></div>
          <div class="lt-cm-acts">${m ? `<button type="button" class="btn lt-btn-ghost lt-btn-sm" data-who="${i.id}" title="Choose who gets this test"><i class="bi bi-people"></i><span>Members</span></button><button type="button" class="btn lt-btn-ghost lt-btn-sm text-danger" data-rmfor="${i.id}|${m.id}" aria-label="Remove ${esc(i.name)} for ${esc(m.name)}"><i class="bi bi-trash"></i><span>Remove</span></button>`
            : `<button type="button" class="btn lt-btn lt-btn-sm" data-who="${i.id}"><i class="bi bi-person-check"></i> Select member</button><button type="button" class="btn lt-btn-ghost lt-btn-sm text-danger" data-rm="${i.id}" aria-label="Remove ${esc(i.name)}"><i class="bi bi-trash"></i></button>`}</div></li>`;
      };

      main.innerHTML = `<div class="lt-sumtiles">${tile('people', 'Members', booked.length)}${tile('eyedropper', 'Tests booked', d.tests)}${tile('box2-heart', 'Packages', d.counts.packages)}${tile('file-earmark-medical', 'From prescription', d.counts.rx)}${tile('currency-rupee', 'Estimated total', 'From ' + money(d.estimate), 'is-total')}</div>
        <p class="small mt-2"><i class="bi bi-info-circle text-primary"></i> Estimated using the lowest lab price near ${esc(s.location.pincode)}. Final price depends on the lab you select.</p>
        <div class="d-grid gap-3 mt-3">
          ${d.centreOnly.length ? `<div class="lt-alert is-danger" role="alert"><i class="bi bi-hospital"></i><div><strong>${d.centreOnly.map((i) => esc(i.short || i.name)).join(', ')} ${d.centreOnly.length > 1 ? 'need' : 'needs'} a lab centre visit.</strong> You chose home collection, so ${d.centreOnly.length > 1 ? 'these tests' : 'this test'} can't be collected at home.
            <div class="lt-alert-acts"><button type="button" class="btn lt-btn btn-sm" data-switch-mode="centre">Switch to Lab Centre</button><button type="button" class="btn lt-btn-outline btn-sm" data-rm-centre>Remove ${d.centreOnly.length > 1 ? 'tests' : 'test'}</button></div></div></div>` : ''}
          ${overlap.length ? `<div class="lt-alert is-warn"><i class="bi bi-files"></i><div><strong>Possible duplicate:</strong> ${overlap.map((o) => `${esc(P.item(o.t).short || P.item(o.t).name)} is already in ${esc(P.item(o.pk).name)} for ${esc(first(o.m.name))}`).join('; ')}. You may be paying twice.<div class="lt-alert-acts"><button type="button" class="btn lt-btn btn-sm" data-fix>Fix now</button></div></div></div>` : ''}
          ${d.variants.length ? `<div class="lt-alert is-warn"><i class="bi bi-question-diamond"></i><div><strong>Similar tests in your cart:</strong> ${d.variants.map((p) => p.map((x) => esc(x.name)).join(' and ')).join('; ')}.<div class="lt-alert-acts"><button type="button" class="btn lt-btn btn-sm" data-variant>Choose the right one</button></div></div></div>` : ''}
          ${d.fasting.count ? `<div class="lt-alert is-info align-items-center"><i class="bi bi-cup-hot"></i><div><strong>${d.fasting.count} test${d.fasting.count > 1 ? 's' : ''} need${d.fasting.count > 1 ? '' : 's'} ${Math.min(d.fasting.maxHours, 10)}-12 hrs fasting.</strong> Book an early morning slot (6-9 AM) and drink only water before the test.</div></div>` : ''}
        </div>
        ${unassigned.length ? `<section class="lt-cm is-pending mt-3" aria-label="Tests without a member"><div class="lt-cm-head"><span class="lt-cm-badge"><i class="bi bi-person-exclamation"></i></span><div class="flex-grow-1"><b class="lt-ink">Who are these tests for?</b><small class="d-block">Choose a family member for each test to continue.</small></div><span class="lt-pill is-warn">${unassigned.length} pending</span></div><ul class="lt-cm-list">${unassigned.map((i) => itemRow(i, null)).join('')}</ul></section>` : ''}
        ${booked.map((m) => `<section class="lt-cm mt-3" aria-label="Tests for ${esc(m.name)}"><div class="lt-cm-head">${avatar(m.name, MB.color(m.id))}<div class="flex-grow-1 min-w-0"><b class="lt-ink">${esc(m.name)} ${m.relationship === 'Self' ? '<span class="lt-pill is-primary">You</span>' : ''}</b><small class="d-block">${m.incomplete ? esc(m.relationship) + ' · <button type="button" class="lt-linkbtn" data-editm="' + m.id + '">Add age &amp; gender</button>' : `${esc(m.relationship)} · ${m.age} yrs · ${MB.gender(m.gender)}`}</small></div>
            <span class="lt-pill is-primary">${mine(m).length} test${mine(m).length === 1 ? '' : 's'}</span><button type="button" class="btn lt-btn-ghost lt-btn-sm lt-cm-edit" data-editm="${m.id}" aria-label="Edit ${esc(m.name)}" title="Edit profile"><i class="bi bi-pencil"></i></button></div>
          <ul class="lt-cm-list">${mine(m).map((i) => itemRow(i, m)).join('')}</ul>
          <div class="lt-cm-foot"><button type="button" class="btn lt-btn-outline lt-btn-sm" data-addfor="${m.id}"><i class="bi bi-plus-lg"></i> Add test for ${esc(first(m.name))}</button><span class="lt-cm-sub"><small>Subtotal</small><b>From ${money(sub(m))}</b></span></div></section>`).join('')}
        ${s.user.loggedIn ? `<section class="lt-cm-others mt-3"><div><b class="lt-ink">${others.length ? 'Book for your family too' : 'Booking for your family?'}</b><small class="d-block">${others.length ? 'Tap a member to add tests for them in the same booking (one lab, one slot).' : 'Add parents, spouse or kids once – then choose them for any test.'}</small></div>
          <div class="lt-cm-chips">${others.map((m) => `<button type="button" class="lt-cm-chip" data-addfor="${m.id}">${avatar(m.name, MB.color(m.id), 'sm')}<span>${esc(first(m.name))}<small>${esc(m.relationship)}</small></span><i class="bi bi-plus-lg"></i></button>`).join('')}
            <button type="button" class="lt-cm-chip is-new" data-newm ${members.length >= 10 ? 'disabled' : ''}><i class="bi bi-person-plus"></i><span>Add family member<small>${members.length}/10 saved</small></span></button></div></section>` : ''}
        <div class="d-flex flex-wrap gap-2 mt-3"><a class="btn lt-btn-outline" href="${url('search.html')}"><i class="bi bi-plus-lg"></i> Add more tests</a><a class="btn lt-btn-ghost" href="${url('packages.html')}"><i class="bi bi-box2-heart"></i> Health packages</a>${d.requests.length ? '<button type="button" class="btn lt-btn-ghost" data-viewrx><i class="bi bi-file-earmark-image"></i> View prescription</button>' : ''}</div>`;

      const fix = main.querySelector('[data-fix]'); if (fix) fix.onclick = () => fixOverlap(overlap);
      const rc = main.querySelector('[data-rm-centre]'); if (rc) rc.onclick = () => { d.centreOnly.forEach((i) => LT.cart.remove(i.id)); toast('Centre-only tests removed'); render(); };
      const vb = main.querySelector('[data-variant]'); if (vb) vb.onclick = () => variantModal(d.variants[0]);
      const vr = main.querySelector('[data-viewrx]'); if (vr) vr.onclick = () => modal.open({ title: 'Prescription', body: d.requests.map((r) => `<figure class="text-center"><img src="${r.thumbnail}" alt="Prescription ${r.id}" style="max-height:60vh;margin:0 auto;border-radius:10px;border:1px solid var(--lt-border)"><figcaption class="small mt-2">${esc(r.id)} · ${esc(r.doctor)}</figcaption></figure>`).join('') });
      if (d.variants.length && !askedVariant) { askedVariant = true; setTimeout(() => variantModal(d.variants[0]), 400); }

      LT.layout.renderAside(aside, {});
      const blocked = d.centreOnly.length > 0 || unassigned.length > 0;
      LT.layout.setAction({
        text: `<b>From ${money(d.estimate)}</b>${booked.length} member${booked.length === 1 ? '' : 's'} · ${d.tests} test${d.tests === 1 ? '' : 's'}`, label: 'Continue to Select Lab <i class="bi bi-arrow-right"></i>', disabled: blocked,
        hint: d.centreOnly.length ? 'Resolve the centre-only tests to continue.' : unassigned.length ? 'Choose a member for every test to continue.' : 'Next: choose a lab', onClick: next
      });
    } catch (e) { error(main, { text: errMsg(e), onRetry: render }); }
  }

  main.addEventListener('click', async (e) => {
    const t = e.target;
    const who = t.closest('[data-who]'); if (who) { await MB.pick(who.dataset.who); return render(); }
    const rf = t.closest('[data-rmfor]');
    if (rf) {
      const [id, m] = rf.dataset.rmfor.split('|');
      const removed = LT.cart.removeFor(id, m);
      toast((P.item(id) || {}).name + ' removed', 'info', { action: 'Undo', onAction: () => { LT.cart.restore(removed); render(); } });
      return render();
    }
    const rm = t.closest('[data-rm]');
    if (rm) { const removed = LT.cart.remove(rm.dataset.rm); toast((P.item(rm.dataset.rm) || {}).name + ' removed', 'info', { action: 'Undo', onAction: () => { LT.cart.restore(removed); render(); } }); return render(); }
    const af = t.closest('[data-addfor]'); if (af) { await MB.addFor(af.dataset.addfor, render); return render(); }
    const ed = t.closest('[data-editm]'); if (ed) { const m = (await LT.api.getMembers()).find((x) => x.id === ed.dataset.editm); if (m && await MB.form(m)) render(); return; }
    if (t.closest('[data-newm]')) {
      const saved = await MB.form();
      if (saved) { render(); setTimeout(() => MB.addFor(saved.id, render).then(render), 350); }
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
    if (LT.cart.unassigned().length) return toast('Choose a member for every test to continue', 'warning');
    location.href = url('select-lab.html');
  }
  LT.page = Object.assign(LT.page || {}, { onCartChange: render });
  render();
})();
