/* Page: location.html – PHASE 12 Service location
   HOME: saved addresses for the selected pincode only, add / edit / delete, lab-zone validation.
   CENTRE: confirm lab centre (hours, amenities, tests available), change centre / lab, directions. */
(function () {
  const { esc, toast, modal, skeleton, empty, error, busy, errMsg, confirm, amenities, labLogo, avatar } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'labtests', stepper: 'location', title: 'Collection location' });
  if (!LT.guards.require(['location', 'cart', 'members', 'lab'])) return;
  const s0 = LT.store.get(), centre = s0.mode === 'centre';
  let addresses = [], lab = null, validation = null;

  app.innerHTML = `<div class="lt-container"><div class="lt-page-head"><h1>${centre ? 'Confirm your lab centre' : 'Select collection address'}</h1><p>${centre ? 'All selected members visit this centre together at the slot you pick next.' : 'Our technician will come to this address. One address per booking.'}</p></div>
    <div class="row g-4 mt-4"><div class="col-lg-8" data-main></div><aside class="col-lg-4"><div class="lt-aside" data-aside></div></aside></div></div>`;
  const main = app.querySelector('[data-main]');
  const dir = (c) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.name + ', ' + c.address);

  /* =========== HOME =========== */
  async function home() {
    const pin = LT.store.get().location.pincode, area = LT.store.get().location.area || LT.store.get().location.city;
    main.innerHTML = `<div class="lt-addr-head"><div><h2 class="lt-h2 mb-1">Saved addresses</h2><p class="mb-0 small">Showing addresses in <b class="lt-ink">${esc(area)} ${esc(pin)}</b> – the location you chose for this booking.</p></div>
        <button type="button" class="btn lt-btn-outline lt-btn-sm" data-add><i class="bi bi-plus-lg"></i> Add New Address</button></div>
      <div class="lt-addr lt-addr-grid mt-3" data-list role="radiogroup" aria-label="Saved addresses in ${esc(pin)}"></div>
      <div data-other class="mt-3"></div><div data-val class="mt-3" aria-live="polite"></div>`;
    main.querySelector('[data-add]').onclick = () => form();
    await loadAddresses();
  }
  async function loadAddresses() {
    const list = main.querySelector('[data-list]'), other = main.querySelector('[data-other]');
    const pin = LT.store.get().location.pincode;
    skeleton(list, 'row', 2);
    try {
      let all;
      [all, lab] = await Promise.all([LT.api.getAddresses(), lab || LT.api.getLab(LT.store.get().lab.id)]);
      /* only addresses in the booking pincode can be used */
      addresses = all.filter((a) => String(a.pincode) === String(pin));
      const hidden = all.length - addresses.length;
      other.innerHTML = hidden ? `<div class="lt-addr-note"><i class="bi bi-eye-slash"></i><span>${hidden} saved address${hidden > 1 ? 'es are' : ' is'} in another pincode and hidden here. To use ${hidden > 1 ? 'one' : 'it'}, change your location first.</span><button type="button" class="lt-linkbtn" data-change-location>Change location</button></div>` : '';
      if (LT.store.get().address.id && !addresses.some((a) => a.id === LT.store.get().address.id)) LT.store.set({ address: { id: null } });
      if (!addresses.length) {
        validation = null; main.querySelector('[data-val]').innerHTML = '';
        empty(list, { icon: 'map', title: 'No saved address in ' + pin, text: 'Add the address in ' + pin + ' where our technician should collect the sample.', actions: [{ label: 'Add address', onClick: () => form() }] });
        list.classList.remove('lt-addr-grid'); setBar(); return;
      }
      list.classList.add('lt-addr-grid');
      const cur = LT.store.get().address.id;
      list.innerHTML = addresses.map((a) => `<label class="lt-opt"><input class="lt-opt-input" type="radio" name="addr" value="${a.id}" ${cur === a.id ? 'checked' : ''}><span class="lt-opt-card"><span class="lt-opt-check"><i class="bi bi-check"></i></span>
        <span class="lt-opt-body"><h3><span class="lt-pill is-primary"><i class="bi bi-${a.type === 'Work' ? 'briefcase' : a.type === 'Home' ? 'house' : 'people'}"></i>${esc(a.type)}</span>${a.verified ? '<span class="lt-pill is-success"><i class="bi bi-patch-check"></i>Verified</span>' : ''}</h3>
        <b class="lt-addr-name">${esc(a.name)}</b>
        <p>${esc(a.house)}, ${esc(a.area)}${a.landmark ? ', ' + esc(a.landmark) : ''}, ${esc(a.city)} ${esc(a.pincode)}</p><p class="small"><i class="bi bi-telephone"></i> +91 ${esc(a.mobile)}</p>
        <span class="lt-addr-acts"><button type="button" class="lt-linkbtn" data-edit="${a.id}"><i class="bi bi-pencil"></i> Edit</button><button type="button" class="lt-linkbtn is-danger" data-del="${a.id}"><i class="bi bi-trash"></i> Delete</button></span></span></span></label>`).join('');
      list.onchange = (e) => { if (e.target.name === 'addr') choose(e.target.value); };
      list.onclick = (e) => {
        const ed = e.target.closest('[data-edit]'); if (ed) { e.preventDefault(); return form(addresses.find((a) => a.id === ed.dataset.edit)); }
        const de = e.target.closest('[data-del]'); if (de) { e.preventDefault(); return del(addresses.find((a) => a.id === de.dataset.del)); }
      };
      if (cur && addresses.some((a) => a.id === cur)) choose(cur, true);
      else if (addresses.length === 1) { list.querySelector('input').checked = true; choose(addresses[0].id, true); }
      else { validation = null; main.querySelector('[data-val]').innerHTML = ''; setBar(); }
    } catch (e) { error(list, { text: errMsg(e), onRetry: loadAddresses }); }
  }
  async function choose(id, silent) {
    const a = addresses.find((x) => x.id === id);
    LT.store.set({ address: { id } });
    const box = main.querySelector('[data-val]');
    box.innerHTML = '<div class="lt-skel" style="height:50px;border-radius:14px"></div>';
    validation = await LT.api.validateAddressForLab(id, LT.store.get().lab.id);
    box.innerHTML = validation.ok ? `<div class="lt-alert is-success"><i class="bi bi-check-circle-fill"></i><div>${esc(validation.message)}</div></div>`
      : `<div class="lt-alert is-danger" role="alert"><i class="bi bi-geo"></i><div><strong>This lab does not collect from this address.</strong><br>${esc(validation.message)}<div class="lt-alert-acts"><button type="button" class="btn lt-btn-outline btn-sm" data-chaddr>Change address</button><a class="btn lt-btn btn-sm" href="${url('select-lab.html')}">Change lab</a></div></div></div>`;
    const ch = box.querySelector('[data-chaddr]'); if (ch) ch.onclick = () => main.querySelector('[data-list]').scrollIntoView({ behavior: 'smooth' });
    if (!silent && validation.ok) toast('Address selected');
    setBar();
  }
  function setBar() {
    const a = addresses.find((x) => x.id === LT.store.get().address.id);
    const ok = a && validation && validation.ok;
    LT.layout.setAction({ text: a ? `<b>${esc(a.type)}: ${esc(a.house.split(',')[0])}</b>${esc(a.area.split(',').slice(-1)[0].trim())}` : '<b>No address selected</b>Choose where to collect the sample', label: 'Confirm &amp; Proceed <i class="bi bi-arrow-right"></i>', disabled: !ok, hint: ok ? 'Next: choose date and time' : 'Select an address the lab serves', onClick: () => { location.href = url('slot.html'); } });
  }
  function form(a) {
    a = a || {};
    const s = LT.store.get();
    const f = (id, label, val, attrs, col) => `<div class="${col || 'col-md-6'}"><label class="form-label" for="${id}">${label}</label><input id="${id}" class="form-control" value="${esc(val || '')}" ${attrs || ''}><div class="lt-field-err" data-e="${id}" hidden></div></div>`;
    const md = modal.open({
      title: a.id ? 'Edit address' : 'Add new address', size: 'lg',
      body: `<div class="row g-3">${f('adName', 'Full name <span class="req">*</span>', a.name || s.user.name, 'autocomplete="name"')}
        <div class="col-md-6"><label class="form-label" for="adMob">Mobile <span class="req">*</span></label><div class="input-group lt-input-group"><span class="input-group-text">+91</span><input id="adMob" class="form-control" inputmode="numeric" maxlength="10" value="${esc(a.mobile || s.user.mobile)}"></div><div class="lt-field-err" data-e="adMob" hidden></div></div>
        <div class="col-md-6"><label class="form-label" for="adPin">Pincode <span class="req">*</span></label><input id="adPin" class="form-control" value="${esc(s.location.pincode)}" readonly aria-describedby="adPinHelp"><small class="lt-hint d-block mt-1" id="adPinHelp"><i class="bi bi-lock"></i> Same as your booking location. <button type="button" class="lt-linkbtn" data-change-location>Change location</button></small><div class="lt-field-err" data-e="adPin" hidden></div></div>${f('adHouse', 'House / Flat / Building <span class="req">*</span>', a.house)}
        ${f('adArea', 'Area / Street <span class="req">*</span>', a.area || s.location.area, '', 'col-12')}${f('adLand', 'Landmark <span class="lt-badge-opt">Optional</span>', a.landmark)}
        ${f('adCity', 'City <span class="req">*</span>', a.city || s.location.city)}${f('adState', 'State <span class="req">*</span>', a.state || 'Maharashtra')}
        <div class="col-md-6"><span class="form-label d-block">Address type</span><div class="lt-segpills">${['Home', 'Work', 'Other'].map((t) => `<input type="radio" name="adType" id="adT${t}" value="${t}" ${(a.type || 'Home') === t || (t === 'Other' && a.type === "Parents' Home") ? 'checked' : ''}><label for="adT${t}">${t}</label>`).join('')}</div></div>
        <div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="adSave" checked><label class="form-check-label" for="adSave">Save this address for future orders</label></div></div></div>`,
      footer: '<button type="button" class="btn lt-btn-outline" data-bs-dismiss="modal">Cancel</button><button type="button" class="btn lt-btn" data-save data-busy="Saving…">Save Address</button>'
    });
    const v = (id) => md.$('#' + id).value.trim();
    const err = (id, m) => { const e = md.$(`[data-e="${id}"]`); e.textContent = m || ''; e.hidden = !m; md.$('#' + id).classList.toggle('is-invalid', !!m); return !m; };
    const rules = { adName: (x) => (/^[A-Za-z][A-Za-z .']{1,48}$/.test(x) ? '' : 'Enter a name using letters only.'), adMob: (x) => (/^[6-9]\d{9}$/.test(x) ? '' : 'Enter a valid 10-digit mobile number.'), adPin: (x) => (x === String(s.location.pincode) ? '' : 'The address must be in ' + s.location.pincode + '.'), adHouse: (x) => (x.length > 2 ? '' : 'Enter house / flat details.'), adArea: (x) => (x.length > 2 ? '' : 'Enter area or street.'), adCity: (x) => (x ? '' : 'Enter city.'), adState: (x) => (x ? '' : 'Enter state.') };
    Object.keys(rules).forEach((id) => md.$('#' + id).addEventListener('blur', () => err(id, rules[id](v(id)))));
    md.$('[data-save]').onclick = async (e) => {
      const ok = Object.keys(rules).map((id) => err(id, rules[id](v(id)))).every(Boolean);
      if (!ok) return;
      const t = md.$('input[name=adType]:checked').value;
      const rec = { id: a.id, name: v('adName'), mobile: v('adMob'), pincode: v('adPin'), house: v('adHouse'), area: v('adArea'), landmark: v('adLand'), city: v('adCity'), state: v('adState'), type: t === 'Other' && a.type === "Parents' Home" ? a.type : t };
      try {
        const saved = await busy(e.currentTarget, () => LT.api.saveAddress(rec));
        md.close(); toast(a.id ? 'Address updated' : 'Address saved');
        LT.store.set({ address: { id: saved.id } });
        await loadAddresses();
      } catch (er) { toast(errMsg(er), 'danger'); }
    };
  }
  async function del(a) {
    const ok = await confirm({ title: 'Delete this address?', icon: 'trash', danger: true, body: `<div class="lt-card p-3"><b class="lt-ink">${esc(a.type)} · ${esc(a.name)}</b><p class="small mb-0">${esc(a.house)}, ${esc(a.area)}, ${esc(a.city)} ${esc(a.pincode)}</p></div><p class="small mt-2 mb-0">This cannot be undone.</p>`, ok: 'Delete address' });
    if (!ok) return;
    try { await LT.api.deleteAddress(a.id); if (LT.store.get().address.id === a.id) LT.store.set({ address: { id: null } }); toast('Address deleted'); loadAddresses(); }
    catch (e) { confirm({ title: 'Cannot delete address', icon: 'exclamation-octagon', danger: true, body: `<p class="mb-0">${esc(errMsg(e))}</p>`, ok: 'OK', cancel: false }); }
  }

  /* =========== CENTRE =========== */
  async function centreView() {
    skeleton(main, 'block', 2);
    try {
      const s = LT.store.get();
      const [l, bill, members] = await Promise.all([LT.api.getLab(s.lab.id), LT.api.getBillSummary(), LT.api.getMembers()]);
      lab = l;
      const c = l.centres.find((x) => x.id === s.lab.centreId) || l.nearestCentre;
      if (!s.lab.centreId) LT.store.set({ lab: Object.assign(s.lab, { centreId: c.id }) });
      const tests = [...new Set(bill.bill.perMember.flatMap((p) => p.itemsDetail.map((i) => i.name)))];
      const visiting = members.filter((m) => s.selectedMemberIds.includes(m.id));
      /* "You" pin is placed on the side away from the centre pin so the two never overlap on small maps */
      const me = { x: c.x > 50 ? 22 : 76, y: c.y > 50 ? 30 : 66 };
      const missing = bill.bill.missingTests || [];
      main.innerHTML = `<section class="lt-card lt-cv">
          <header class="lt-cv-head">${labLogo(l)}<div class="lt-cv-title"><span class="lt-pill is-primary"><i class="bi bi-building"></i>${esc(l.name)}</span><h2>${esc(c.name)}</h2></div></header>
          <ul class="lt-cv-info">
            <li class="is-wide"><span class="lt-cv-ico" aria-hidden="true"><i class="bi bi-geo-alt"></i></span><div><small>Address</small><p>${esc(c.address)}</p><span class="lt-cv-tag"><i class="bi bi-signpost-2" aria-hidden="true"></i> ${c.distanceKm} km away</span></div></li>
            <li><span class="lt-cv-ico" aria-hidden="true"><i class="bi bi-clock"></i></span><div><small>Timings</small><p>${esc(c.hours)}</p><span class="lt-cv-tag ${c.openNow ? 'is-open' : 'is-closed'}"><i class="bi bi-circle-fill" aria-hidden="true"></i> ${c.openNow ? 'Open now' : 'Closed now'}</span></div></li>
            <li><span class="lt-cv-ico" aria-hidden="true"><i class="bi bi-telephone"></i></span><div><small>Phone</small><p><a href="tel:${esc(l.phone.replace(/\s/g, ''))}">${esc(l.phone)}</a></p></div></li>
            ${c.amenities && c.amenities.length ? `<li class="is-wide"><span class="lt-cv-ico" aria-hidden="true"><i class="bi bi-stars"></i></span><div><small>Facilities</small><div class="lt-cv-amen">${amenities(c.amenities)}</div></div></li>` : ''}
          </ul>
          <div class="lt-map lt-cv-map" role="img" aria-label="Map: ${esc(c.name)}, ${c.distanceKm} km from you"><span class="lt-pin is-me" style="left:${me.x}%;top:${me.y}%"><i class="bi bi-person-circle"></i><span>You</span></span><span class="lt-pin is-active" style="left:${c.x}%;top:${c.y}%"><i class="bi bi-geo-alt-fill"></i><span>${esc(l.initials)}</span></span></div>
          <div class="lt-cv-acts"><a class="btn lt-btn-outline lt-btn-sm is-main" href="${dir(c)}" target="_blank" rel="noopener"><i class="bi bi-sign-turn-right"></i> Get Directions</a>${l.centres.length > 1 ? '<button type="button" class="btn lt-btn-ghost lt-btn-sm" data-chc><i class="bi bi-arrow-left-right"></i> Change centre</button>' : ''}<a class="btn lt-btn-ghost lt-btn-sm" href="${url('select-lab.html')}"><i class="bi bi-building"></i> Change lab</a></div>
        </section>
        <section class="lt-card lt-cv-sec"><h3 class="lt-cv-h3"><i class="bi bi-clipboard2-check" aria-hidden="true"></i> Tests available at this centre <span class="lt-cv-count">${tests.length}${missing.length ? ' of ' + (tests.length + missing.length) : ''}</span></h3>
          <ul class="lt-checklist lt-cv-tests">${tests.map((t) => `<li><i class="bi bi-check-circle-fill"></i><span>${esc(t)}</span></li>`).join('')}${missing.map((t) => `<li class="is-missing"><i class="bi bi-x-circle-fill text-danger"></i><span>${esc(LT.pricing.item(t).name)} <small class="text-danger">(not available)</small></span></li>`).join('')}</ul></section>
        <section class="lt-card lt-cv-sec"><h3 class="lt-cv-h3"><i class="bi bi-people" aria-hidden="true"></i> Visiting members <span class="lt-cv-count">${visiting.length}</span></h3>
          <div class="lt-cv-members">${visiting.map((m) => `<div class="lt-cv-member">${avatar(m.name, null, 'sm')}<div><b>${esc(m.name)}</b><small>${esc(m.relationship)}</small></div></div>`).join('')}</div>
          <p class="lt-cv-note"><i class="bi bi-person-vcard" aria-hidden="true"></i><span>Carry a photo ID for each member and the original prescription if you have one.</span></p></section>`;
      /* facilities: icon + name chips (the shared helper gives icons only; names are needed on touch screens) */
      main.querySelectorAll('.lt-cv-amen .lt-amen i').forEach((i) => {
        const name = i.getAttribute('title') || '', chip = document.createElement('span');
        chip.className = 'lt-cv-chip'; i.removeAttribute('title'); i.removeAttribute('aria-label'); i.setAttribute('aria-hidden', 'true');
        chip.innerHTML = i.outerHTML + `<span>${esc(name)}</span>`; i.replaceWith(chip);
      });
      const chc = main.querySelector('[data-chc]');
      if (chc) chc.onclick = () => {
        const md = modal.open({ title: 'Change centre', body: `<div class="d-grid gap-2">${l.centres.map((x) => `<label class="lt-opt"><input class="lt-opt-input" type="radio" name="cc" value="${x.id}" ${x.id === c.id ? 'checked' : ''}><span class="lt-opt-card"><span class="lt-opt-check"><i class="bi bi-check"></i></span><span class="lt-opt-body"><h3>${esc(x.name)}</h3><p>${esc(x.address)} · ${x.distanceKm} km · ${esc(x.hours)}</p></span></span></label>`).join('')}</div>`, footer: '<button type="button" class="btn lt-btn" data-ok>Use this centre</button>' });
        md.$('[data-ok]').onclick = () => { const v = md.$('input[name=cc]:checked').value; LT.store.set({ lab: Object.assign(LT.store.get().lab, { centreId: v }), slot: v !== c.id ? LT.store.defaults().slot : LT.store.get().slot }); md.close(); toast('Centre updated'); centreView(); };
      };
      LT.layout.setAction({ text: `<b>${esc(c.name.split('–').pop().trim())}</b>${esc(l.name)}`, label: 'Continue <i class="bi bi-arrow-right"></i>', hint: 'Next: choose date and time', onClick: () => { location.href = url('slot.html'); } });
    } catch (e) { error(main, { text: errMsg(e), onRetry: centreView }); }
  }

  LT.layout.renderAside(app.querySelector('[data-aside]'), { after: () => (centre ? null : setBar()) });
  if (centre) centreView(); else home();
})();
