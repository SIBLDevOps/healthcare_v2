/* Lab Tests – "Select Member" step, used every time a test or package is added.
   LT.members.pick(itemId, { source, requestId }) -> login (if needed) -> Select Member popup
       (Self + family members, add member inline). Resolves the chosen member ids, or null.
   LT.members.addFor(memberId) -> search popup to add a test for one member only.
   LT.members.form(member?)    -> add / edit family member form. Resolves the saved member or null.
   LT.members.color(id)        -> avatar colour for a member. */
window.LT = window.LT || {};

(function () {
  const U = () => LT.ui;
  const MAX_SEL = 6, MAX_SAVED = 10;
  const COLORS = ['#1964ee', '#0d685e', '#7c3aed', '#e5484d', '#f59e0b', '#0b7fa8', '#12a150', '#0849c1', '#c2410c', '#475569'];
  const color = (id) => COLORS[Math.abs([...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0)) % COLORS.length];
  const gender = (g) => (g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Other');
  const first = (n) => String(n || '').split(' ')[0];
  const meta = (m) => (m.incomplete ? esc(m.relationship) + ' · add age &amp; gender' : `${esc(m.relationship)} · ${m.age} yrs · ${gender(m.gender)}`);
  const esc = (s) => U().esc(s);

  /* gender / age rules for one item and a list of members */
  function checks(itemId, members) {
    const v = LT.matching.validateAssignments({}, members.filter((m) => !m.incomplete), [{ id: itemId }], {});
    const out = {};
    members.forEach((m) => { const r = v[m.id] || { blocked: [], issues: [] }; out[m.id] = { blocked: r.blocked.includes(itemId), issue: (r.issues[0] || {}).msg || '', level: (r.issues[0] || {}).level || '' }; });
    return out;
  }

  /* ---------- Select Member popup ---------- */
  let picking = false; // ignore a second click while the popup is already open
  async function pick(id, o) {
    if (picking) return null;
    picking = true;
    try { return await pickInner(id, o); } finally { picking = false; }
  }
  async function pickInner(id, o) {
    o = o || {};
    if (!LT.store.get().user.loggedIn) {
      try { await U().authModal({ reason: 'Log in to add tests and choose who each test is for.' }); } catch (e) { return null; }
      LT.layout.refreshHeader();
    }
    const it = LT.pricing.item(id);
    if (!it) return null;
    let members;
    try { members = await LT.api.getMembers(); } catch (e) { U().toast(U().errMsg(e), 'danger'); return null; }
    const inCart = LT.cart.has(id) && LT.cart.membersOf(id).length > 0;
    let chosen = inCart ? LT.cart.membersOf(id) : (o.preset || []).slice();
    if (!inCart && !chosen.length) { const self = members.find((m) => m.relationship === 'Self'); if (self) chosen = [self.id]; }
    chosen = chosen.filter((m) => members.some((x) => x.id === m));
    return open();

    function open() {
      return new Promise((resolve) => {
        let result = null, next = null;
        const v = checks(id, members);
        chosen = chosen.filter((m) => !v[m] || !v[m].blocked);
        const fresh = members.length <= 1;
        const otherInBooking = LT.store.get().selectedMemberIds.filter((m) => !LT.cart.membersOf(id).includes(m));
        const chosenLabel = () => chosen.length + ' selected';
        const row = (m) => {
          const c = v[m.id], on = chosen.includes(m.id);
          return `<label class="lt-pick-row ${c.blocked ? 'is-blocked' : ''}"><input type="checkbox" class="lt-pick-input" value="${m.id}" ${on ? 'checked' : ''} ${c.blocked ? 'disabled' : ''} aria-label="${esc(m.name)}, ${esc(m.relationship)}">
            <span class="lt-pick-card"><span class="lt-pick-tick"><i class="bi bi-check-lg"></i></span>${U().avatar(m.name, color(m.id))}
              <span class="lt-pick-body"><b>${esc(m.name)}${m.relationship === 'Self' ? ' <span class="lt-pill is-primary">You</span>' : ''}</b><small>${meta(m)}</small>
                ${c.issue ? `<span class="lt-pick-note is-${c.level}"><i class="bi bi-${c.blocked ? 'slash-circle' : 'exclamation-triangle'}"></i> ${esc(c.issue)}</span>` : ''}
                ${m.incomplete ? `<button type="button" class="lt-linkbtn lt-pick-edit" data-edit="${m.id}"><i class="bi bi-pencil"></i> Complete profile</button>` : ''}</span></span></label>`;
        };
        const md = U().modal.open({
          title: 'Select Member', sub: 'Who is this test for? You can choose more than one person.',
          body: `<div class="lt-pick-item"><span class="lt-pick-ico"><i class="bi bi-${it.type === 'package' || LT.pricing.isPackage(id) ? 'box2-heart' : 'eyedropper'}"></i></span>
              <div class="flex-grow-1"><b>${esc(it.name)}</b><small>${LT.pricing.isPackage(id) ? (it.tests || []).length + ' tests' : esc(it.sampleType || 'Blood')} · ${it.fastingHours ? it.fastingHours + ' hrs fasting' : 'No fasting'}</small></div>
              <span class="lt-pick-price"><small>From</small><b>${U().money(LT.api.fromPrice(id))}</b><small>per person</small></span></div>
            <p class="lt-pick-label">Choose member${members.length > 1 ? 's' : ''} <span>${chosenLabel()}</span></p>
            <div class="lt-pick-list" role="group" aria-label="Family members">${members.map(row).join('')}
              <button type="button" class="lt-pick-add" data-addm ${members.length >= MAX_SAVED ? 'disabled' : ''}><i class="bi bi-person-plus"></i><span><b>Add family member</b><small>${fresh ? 'Parents, spouse or kids' : members.length + ' of ' + MAX_SAVED + ' saved'}</small></span></button></div>
            ${fresh ? '<div class="lt-pick-tip"><i class="bi bi-people"></i><span>Booking for your family too? Add them once and choose them for any test.</span></div>' : ''}
            <p class="lt-pick-hint"><i class="bi bi-info-circle"></i> Up to ${MAX_SEL} members per booking. Each person gets a separate report.</p>`,
          footer: `${inCart ? '<button type="button" class="btn lt-btn-ghost text-danger me-auto" data-rm><i class="bi bi-trash"></i> Remove test</button>' : ''}<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn lt-btn" data-ok></button>`,
          onClose: () => { if (next) next(); else resolve(result); }
        });
        md.el.classList.add('lt-pick-modal');
        const okBtn = md.$('[data-ok]');
        const paint = () => {
          md.$('.lt-pick-label span').textContent = chosenLabel();
          okBtn.disabled = !chosen.length;
          okBtn.innerHTML = !chosen.length ? 'Select a member' : (inCart ? 'Save' : '<i class="bi bi-plus-lg"></i> Add') + (chosen.length > 1 ? ' for ' + chosen.length + ' members' : ' for ' + esc(first((members.find((m) => m.id === chosen[0]) || {}).name)));
        };
        md.el.addEventListener('change', (e) => {
          const x = e.target.closest('.lt-pick-input'); if (!x) return;
          if (x.checked) {
            if (new Set(otherInBooking.concat(chosen, x.value)).size > MAX_SEL) { x.checked = false; return U().toast('A booking can have up to ' + MAX_SEL + ' members', 'warning'); }
            chosen.push(x.value);
          } else chosen = chosen.filter((m) => m !== x.value);
          paint();
        });
        md.el.addEventListener('click', (e) => {
          const ed = e.target.closest('[data-edit]');
          if (ed) { e.preventDefault(); const m = members.find((x) => x.id === ed.dataset.edit); next = () => form(m).then(() => reload().then(() => open().then(resolve))); md.close(); return; }
          if (e.target.closest('[data-addm]')) { next = () => form().then((saved) => reload().then(() => { if (saved && !chosen.includes(saved.id)) chosen.push(saved.id); return open().then(resolve); })); md.close(); return; }
          if (e.target.closest('[data-rm]')) { const removed = LT.cart.remove(id); result = []; U().toast(it.name + ' removed', 'info', { action: 'Undo', onAction: () => { LT.cart.restore(removed); LT.layout.refresh(); o.onChange && o.onChange(); } }); md.close(); o.onChange && o.onChange(); }
        });
        okBtn.onclick = async () => {
          if (!chosen.length) return;
          LT.cart.setMembers(id, chosen, o.source || (LT.pricing.isPackage(id) ? 'package' : 'manual'), o.requestId);
          result = chosen.slice();
          md.close();
          const names = chosen.map((m) => first((members.find((x) => x.id === m) || {}).name));
          U().toast((it.short || it.name) + (inCart ? ' updated for ' : ' added for ') + names.join(', '));
          await overlap(id, chosen, members);
          o.onChange && o.onChange();
        };
        paint();
      });
    }
    async function reload() { members = await LT.api.getMembers(); }
  }

  /* package <-> single test overlap for the same member */
  async function overlap(id, chosen, members) {
    const a = LT.store.get().assignments || {}, P = LT.pricing;
    const pairs = [];
    chosen.forEach((m) => {
      const mine = a[m] || [];
      if (P.isPackage(id)) mine.filter((x) => !P.isPackage(x) && P.item(id).tests.includes(x)).forEach((t) => pairs.push({ m, test: t, pkg: id }));
      else mine.filter((x) => P.isPackage(x) && P.item(x).tests.includes(id)).forEach((p) => pairs.push({ m, test: id, pkg: p }));
    });
    if (!pairs.length) return;
    const nm = (m) => first((members.find((x) => x.id === m) || {}).name);
    const yes = await U().confirm({
      title: 'Already in a package', icon: 'files',
      body: `<p>${pairs.map((p) => `<b>${esc(P.item(p.test).short || P.item(p.test).name)}</b> is already inside <b>${esc(P.item(p.pkg).name)}</b> for ${esc(nm(p.m))}.`).join('<br>')}</p><p class="text-muted mb-0">Remove the separate test to avoid paying twice?</p>`, ok: 'Yes, remove', cancel: 'Keep both'
    });
    if (yes) { pairs.forEach((p) => LT.cart.removeFor(p.test, p.m)); U().toast('Duplicate tests removed'); }
  }

  /* ---------- add a test for one member (search popup) ---------- */
  function addFor(memberId, onChange) {
    return LT.api.getMembers().then((members) => new Promise((resolve) => {
      const m = members.find((x) => x.id === memberId); if (!m) return resolve(null);
      const md = U().modal.open({
        title: 'Add a test for ' + esc(first(m.name)), sub: 'Only ' + esc(first(m.name)) + ' gets these tests. Others are not charged.',
        body: '<div class="lt-searchbox" style="box-shadow:none"><i class="bi bi-search"></i><label class="visually-hidden" for="afq">Search tests</label><input id="afq" type="search" placeholder="Search e.g. Thyroid, Vitamin D, Lipid" autocomplete="off"></div><div class="mt-3" data-r></div>',
        onOpen: (el) => el.querySelector('#afq').focus(), onClose: () => resolve(true)
      });
      const run = async () => {
        const r = await LT.api.searchTests({ q: md.$('#afq').value, pageSize: 10 });
        md.$('[data-r]').innerHTML = r.items.map((t) => {
          const has = (LT.store.get().assignments[memberId] || []).includes(t.id), c = checks(t.id, [m])[m.id];
          return `<div class="lt-ocr-row"><span class="flex-grow-1"><b class="lt-ink">${esc(t.name)}</b><small class="d-block">From ${U().money(t.fromPrice)} · ${t.fastingHours ? t.fastingHours + ' hrs fasting' : 'No fasting'}</small>${c.blocked ? `<small class="d-block text-danger">${esc(c.issue)}</small>` : ''}</span>${has ? '<span class="lt-pill is-success"><i class="bi bi-check2"></i>Added</span>' : c.blocked ? '' : `<button type="button" class="btn lt-add lt-btn-sm" data-pick="${t.id}"><i class="bi bi-plus-lg"></i> Add</button>`}</div>`;
        }).join('') || '<p class="small">No tests found.</p>';
      };
      md.$('[data-r]').onclick = async (e) => {
        const b = e.target.closest('[data-pick]'); if (!b) return;
        LT.cart.add(b.dataset.pick, 'manual', null, { members: [memberId] });
        U().toast((LT.pricing.item(b.dataset.pick) || {}).short + ' added for ' + first(m.name));
        await overlap(b.dataset.pick, [memberId], members);
        onChange && onChange(); run();
      };
      md.$('#afq').addEventListener('input', U().debounce(run, 250)); run();
    }));
  }

  /* ---------- add / edit family member form ---------- */
  function form(m) {
    m = m || {};
    return new Promise((resolve) => {
      let saved = null;
      const rels = ['Self', 'Spouse', 'Child', 'Father', 'Mother', 'Sibling', 'Other'];
      const md = U().modal.open({
        title: m.id ? (m.incomplete ? 'Complete your profile' : 'Edit ' + esc(m.name)) : 'Add family member', sub: m.id ? '' : 'Add once and choose them for any test later.', size: 'lg',
        body: `<form novalidate data-f><div class="row g-3">
          <div class="col-md-6"><label class="form-label" for="mfName">Full name <span class="req">*</span></label><input id="mfName" class="form-control" value="${esc(m.name || '')}" autocomplete="name"><div class="lt-field-err" data-e="name" hidden></div></div>
          <div class="col-md-6"><label class="form-label" for="mfRel">Relationship <span class="req">*</span></label><select id="mfRel" class="form-select" ${m.relationship === 'Self' ? 'disabled' : ''}><option value="">Select</option>${rels.filter((r) => r !== 'Self' || m.relationship === 'Self').map((r) => `<option ${m.relationship === r ? 'selected' : ''}>${r}</option>`).join('')}</select><div class="lt-field-err" data-e="rel" hidden></div></div>
          <div class="col-md-6"><label class="form-label" for="mfDob">Date of birth <span class="req">*</span></label><input id="mfDob" type="date" class="form-control" value="${esc(m.incomplete ? '' : m.dob || '')}" max="${new Date().toISOString().slice(0, 10)}"><div class="lt-field-err" data-e="dob" hidden></div></div>
          <div class="col-md-6"><span class="form-label d-block">Gender <span class="req">*</span></span><div class="lt-segpills" role="radiogroup" aria-label="Gender">${[['female', 'Female'], ['male', 'Male'], ['other', 'Other']].map(([k, l]) => `<input type="radio" name="mfG" id="mfG${k}" value="${k}" ${!m.incomplete && m.gender === k ? 'checked' : ''}><label for="mfG${k}">${l}</label>`).join('')}</div><div class="lt-field-err" data-e="g" hidden></div></div>
          <div class="col-md-6"><label class="form-label" for="mfMob" data-moblabel>Mobile <span class="lt-badge-opt">Optional</span></label><div class="input-group lt-input-group"><span class="input-group-text">+91</span><input id="mfMob" class="form-control" inputmode="numeric" maxlength="10" value="${esc(m.mobile || '')}"></div><div class="lt-field-err" data-e="mob" hidden></div></div>
          <div class="col-md-6"><label class="form-label" for="mfEmail">Email <span class="lt-badge-opt">Optional</span></label><input id="mfEmail" type="email" class="form-control" value="${esc(m.email || '')}"><div class="lt-field-err" data-e="email" hidden></div></div>
          <div class="col-12" data-minor hidden><div class="lt-alert is-info"><i class="bi bi-shield-check"></i><div>This member is under 18. As the guardian, you will receive their reports and must be present at collection.</div></div></div>
          <div class="col-12" data-consent><div class="form-check"><input class="form-check-input" type="checkbox" id="mfOk" ${m.permission && m.id ? 'checked' : ''}><label class="form-check-label" for="mfOk">I confirm I have this person's permission to book tests and view their reports.</label></div><div class="lt-field-err" data-e="ok" hidden></div></div>
        </div></form>`,
        footer: `<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn lt-btn" data-save data-busy="Saving…">${m.id ? 'Save' : '<i class="bi bi-person-plus"></i> Add member'}</button>`,
        onClose: () => resolve(saved)
      });
      const f = md.el, age = () => { const d = f.querySelector('#mfDob').value; return d ? LT.matching.age(d) : null; };
      const relOf = () => (m.relationship === 'Self' ? 'Self' : f.querySelector('#mfRel').value);
      const sync = () => { const a = age(), minor = a != null && a < 18; f.querySelector('[data-minor]').hidden = !minor; f.querySelector('[data-consent]').hidden = minor || relOf() === 'Self'; f.querySelector('[data-moblabel]').innerHTML = (minor ? 'Guardian mobile' : 'Mobile') + ' <span class="lt-badge-opt">Optional</span>'; };
      f.addEventListener('input', sync); f.addEventListener('change', sync); sync();
      const err = (k, msg) => { const e = f.querySelector(`[data-e="${k}"]`); e.textContent = msg || ''; e.hidden = !msg; return !msg; };
      function validate() {
        const name = f.querySelector('#mfName').value.trim(), rel = relOf(), dob = f.querySelector('#mfDob').value, g = (f.querySelector('input[name=mfG]:checked') || {}).value, mob = f.querySelector('#mfMob').value.trim(), email = f.querySelector('#mfEmail').value.trim();
        let ok = true;
        ok = err('name', !name ? 'Enter the full name.' : !/^[A-Za-z][A-Za-z .']{1,48}$/.test(name) ? 'Use letters only (2-50 characters).' : '') && ok;
        ok = err('rel', !rel ? 'Choose a relationship.' : '') && ok;
        ok = err('dob', !dob ? 'Enter date of birth.' : new Date(dob) > new Date() ? 'Date of birth cannot be in the future.' : '') && ok;
        ok = err('g', !g ? 'Choose a gender.' : '') && ok;
        ok = err('mob', mob && !/^[6-9]\d{9}$/.test(mob) ? 'Enter a valid 10-digit mobile number.' : '') && ok;
        ok = err('email', email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email address.' : '') && ok;
        ok = err('ok', !f.querySelector('[data-consent]').hidden && !f.querySelector('#mfOk').checked ? 'Permission is required for adult members.' : '') && ok;
        return ok ? { id: m.id, name, relationship: rel, dob, gender: g, mobile: mob, email, permission: true } : null;
      }
      md.$('[data-save]').onclick = async (e) => {
        const data = validate(); if (!data) return;
        try {
          saved = await U().busy(e.currentTarget, () => LT.api.saveMember(data));
          if (m.relationship === 'Self') { const s = LT.store.get(); LT.store.set({ user: Object.assign(s.user, { name: saved.name }) }); LT.layout.refreshHeader(); }
          U().toast(m.id ? 'Profile updated' : saved.name + ' added to your family');
          md.close();
        } catch (er) { err('name', U().errMsg(er)); }
      };
    });
  }

  /* ---------- Profile -> Family Members (view / add / edit / remove) ---------- */
  const changed = () => { LT.layout.refresh(); if (LT.page && LT.page.onCartChange) LT.page.onCartChange(); };
  async function manage() {
    if (!LT.store.get().user.loggedIn) {
      try { await U().authModal({ reason: 'Log in to see and manage your family members.' }); } catch (e) { return; }
      LT.layout.refreshHeader();
    }
    let members;
    try { members = await LT.api.getMembers(); } catch (e) { return U().toast(U().errMsg(e), 'danger'); }
    const a = LT.store.get().assignments || {};
    const card = (m) => {
      const n = (a[m.id] || []).length;
      return `<article class="lt-fam-card"><div class="lt-fam-top">${U().avatar(m.name, color(m.id))}<div class="min-w-0 flex-grow-1"><b>${esc(m.name)}${m.relationship === 'Self' ? ' <span class="lt-pill is-primary">You</span>' : ''}</b><small>${esc(m.relationship)}</small></div>
          ${n ? `<span class="lt-pill is-success" title="In your lab cart"><i class="bi bi-cart3"></i> ${n}</span>` : ''}</div>
        <ul class="lt-fam-meta">${m.incomplete ? '<li class="text-warning"><i class="bi bi-exclamation-circle"></i> Add age &amp; gender</li>' : `<li><i class="bi bi-calendar3"></i> ${m.age} yrs · ${gender(m.gender)}</li>`}
          <li><i class="bi bi-telephone"></i> ${m.mobile ? '+91 ' + esc(m.mobile) : '<span class="lt-muted">No mobile</span>'}</li>${m.email ? `<li><i class="bi bi-envelope"></i> <span class="text-truncate">${esc(m.email)}</span></li>` : ''}</ul>
        <div class="lt-fam-acts"><button type="button" class="btn lt-btn-ghost lt-btn-sm" data-fedit="${m.id}"><i class="bi bi-pencil"></i> ${m.incomplete ? 'Complete' : 'Edit'}</button>${m.relationship === 'Self' ? '' : `<button type="button" class="btn lt-btn-ghost lt-btn-sm text-danger" data-farch="${m.id}"><i class="bi bi-trash"></i> Remove</button>`}</div></article>`;
    };
    let next = null;
    const md = U().modal.open({
      title: 'Family Members', sub: members.length + ' of ' + MAX_SAVED + ' saved · Each member gets their own reports', size: 'lg',
      body: `<div class="lt-fam-grid">${members.map(card).join('')}
          <button type="button" class="lt-fam-add" data-fnew ${members.length >= MAX_SAVED ? 'disabled' : ''}><i class="bi bi-person-plus"></i><b>Add family member</b><small>${members.length <= 1 ? 'Add parents, spouse or kids once and book for them any time.' : 'Up to ' + MAX_SAVED + ' members'}</small></button></div>`,
      footer: `<a class="btn lt-btn-outline" href="${LT.layout.url('cart.html')}"><i class="bi bi-cart3"></i> Lab cart</a><button type="button" class="btn lt-btn" data-bs-dismiss="modal">Done</button>`,
      onClose: () => { if (next) next(); }
    });
    md.el.classList.add('lt-fam-modal');
    md.el.addEventListener('click', (e) => {
      const ed = e.target.closest('[data-fedit]'), ar = e.target.closest('[data-farch]');
      if (ed) { next = () => form(members.find((m) => m.id === ed.dataset.fedit)).then(() => { changed(); manage(); }); md.close(); }
      if (e.target.closest('[data-fnew]')) { next = () => form().then(() => { changed(); manage(); }); md.close(); }
      if (ar) { next = () => archive(members.find((m) => m.id === ar.dataset.farch)).then(manage); md.close(); }
    });
  }
  async function archive(m) {
    const n = (LT.store.get().assignments[m.id] || []).length;
    const ok = await U().confirm({ title: 'Remove ' + esc(m.name) + '?', icon: 'person-x', danger: true, body: `<p>${esc(m.name)} (${esc(m.relationship)}) will be removed from your family list. Past reports stay safe in your account.</p>${n ? `<p class="mb-0"><b>${n} test${n > 1 ? 's' : ''}</b> booked for ${esc(first(m.name))} will be removed from your lab cart.</p>` : ''}`, ok: 'Remove member' });
    if (!ok) return;
    try {
      await LT.api.archiveMember(m.id);
      (LT.store.get().assignments[m.id] || []).forEach((id) => LT.cart.removeFor(id, m.id));
      U().toast(m.name + ' removed'); changed();
    } catch (e) { await U().confirm({ title: 'Cannot remove ' + esc(m.name), icon: 'exclamation-octagon', danger: true, body: `<p class="mb-0">${esc(U().errMsg(e))}</p>`, ok: 'OK', cancel: false }); }
  }

  LT.members = { pick, addFor, form, manage, color, gender, MAX_SEL };
})();
