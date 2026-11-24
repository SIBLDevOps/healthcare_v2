/* Page: lab-tests/index.html – PHASES 1-4
   Setup gate: ONE popup – location + collection method together.
   The location popup checks serviceability; if only one method is available it is chosen automatically,
   if both are available the user picks Home Sample Collection or Visit Lab Centre inside the same popup.
   Skipped when a location and a valid method are already saved. Then the landing page. */
(function () {
  const { esc, money, toast, modal, debounce, skeleton, error, testCard, packageCard, priceBlock, addBtn, busy, errMsg, param } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'labtests', showCartBar: true, hero: true });
  LT.page = { openLocation: () => gate({ forceLocation: true }) };

  /* =================== SETUP GATE =================== */
  async function gate(o) {
    o = o || {};
    let s = LT.store.get();
    const valid = !!(s.location.pincode && s.mode && s.location.serviceable[s.mode === 'home' ? 'home' : 'lab']);
    if (o.forceLocation || !valid) { const r = await locationModal(valid); if (!r) return; s = LT.store.get(); }
    toast(s.mode === 'home' ? 'Home collection available in ' + s.location.pincode : 'Partner lab centres available near ' + s.location.pincode);
    LT.store.set({ gate: { done: true } });
    LT.layout.refreshHeader();
    renderLanding();
  }

  /* ---------- MODAL 1: location ---------- */
  function locationModal(closable) {
    return new Promise(async (resolve) => {
      const before = LT.store.get().location.pincode;
      let picked = null, serv = null, activeIdx = -1, results = [], saved = false;
      let chosen = null, userPick = null; // collection method: 'home' | 'centre'
      const servedTxt = (LT.data.servedCities || []).join(' and ');
      const HINT = `<div class="lt-loc-hint"><span class="lt-loc-hint-ico" aria-hidden="true"><i class="bi bi-geo-alt"></i></span>
        <div><b>Find your area</b><span>Type your area, city or 6-digit pincode in the search box, or tap <b>Use my current location</b>.</span>
        <small><i class="bi bi-lightbulb" aria-hidden="true"></i> We currently serve ${esc(servedTxt)}. Try “Wakad”, “Andheri” or “411057”</small></div></div>`;
      const md = modal.open({
        title: 'Select your location',
        sub: 'We show diagnostic tests, partner labs and collection slots near you.',
        static: !closable,
        size: 'lg',
        body: `<div class="lt-loc-wrap">
          <!-- Top Row: Search Box on Left + Use my current location Button on Right -->
          <div class="lt-loc-topbar">
            <div class="position-relative flex-grow-1">
              <div class="lt-loc-searchbox">
                <i class="bi bi-search" aria-hidden="true"></i>
                <label class="visually-hidden" for="ltLocQ">Search area, city or pincode</label>
                <input id="ltLocQ" type="text" inputmode="search" enterkeyhint="search" autocomplete="off" spellcheck="false" placeholder="Search area, city or pincode" role="combobox" aria-expanded="false" aria-controls="ltLocList" aria-autocomplete="list">
                <button type="button" class="lt-loc-clear" data-clear hidden aria-label="Clear search"><i class="bi bi-x-circle-fill"></i></button>
              </div>
              <div class="lt-suggest lt-loc-suggest" id="ltLocList" role="listbox" hidden></div>
            </div>
            <button type="button" class="btn lt-loc-geo-btn" data-geo data-busy="Detecting…">
              <i class="bi bi-crosshair"></i> <span>Use my current location</span>
            </button>
          </div>
          <div class="lt-field-err mt-2" data-geo-err hidden></div>

          <!-- Serviceability / Status Result -->
          <div data-result class="mt-3" aria-live="polite">${HINT}</div>
        </div>`,
        footer: `<div class="d-flex flex-wrap align-items-center justify-content-between w-100 gap-2">
          <div class="lt-loc-picked-info small me-auto" data-picked>
            <span class="lt-muted">No location selected yet</span>
          </div>
          <button type="button" class="btn lt-btn lt-btn-continue" data-continue disabled>Continue <i class="bi bi-arrow-right"></i></button>
        </div>`,
        onClose: () => resolve(saved ? { changed: true, before } : null)
      });
      const $ = md.$;

      const setPicked = (p, skipInputUpdate) => {
        picked = p;
        if (!skipInputUpdate) {
          const qVal = p.area ? `${p.area}, ${p.city} (${p.pincode})` : `${p.city} ${p.pincode}`;
          $('#ltLocQ').value = qVal;
        }
        $('[data-clear]').hidden = !$('#ltLocQ').value;
        $('[data-picked]').innerHTML = `<i class="bi bi-geo-alt-fill text-primary"></i> <b>${esc(p.area ? p.area + ', ' : '')}${esc(p.city)}</b> <span class="badge bg-light text-dark border ms-1">${esc(p.pincode)}</span>`;
        check(p.pincode);
      };

      /* Service availability card: overall status + one row per service.
         Both available -> the two rows are radio cards (user picks one).
         One available  -> that one is selected automatically, the other shows "Not available". */
      const MODE_NAME = { home: 'Home Sample Collection', centre: 'Visit Lab Centre' };
      function svcCard(r, pin) {
        const place = picked && picked.area ? picked.area + ', ' + picked.city : picked && picked.city && picked.city !== 'Your area' ? picked.city : '';
        const where = esc(place ? place + ' · ' + pin : pin);
        const both = r.home && r.lab, none = !r.home && !r.lab;
        const lvl = both ? 'is-ok' : none ? 'is-no' : 'is-part';
        const head = both ? ['check-circle-fill', 'All services available', r.labCount + ' partner lab' + (r.labCount > 1 ? 's' : '') + ' serve your area']
          : none ? ['geo-alt', 'Service not available at your location', '']
            : ['info-circle-fill', 'Some services available', r.labCount + ' partner lab' + (r.labCount > 1 ? 's' : '') + ' serve your area'];
        const row = (ok, icon, name, yes, no, val) => {
          const sel = ok && chosen === val;
          const tag = !ok ? '<i class="bi bi-x-lg" aria-hidden="true"></i> Not available'
            : sel && !both ? '<i class="bi bi-check-lg" aria-hidden="true"></i> Selected for you' : '<i class="bi bi-check-lg" aria-hidden="true"></i> Available';
          const inner = `<span class="lt-svc-ico" aria-hidden="true"><i class="bi bi-${icon}"></i></span>
            <span class="lt-svc-txt"><b>${name}</b><small>${ok ? yes : no}</small></span>
            <span class="lt-svc-tag">${tag}</span>`;
          return both
            ? `<li><label class="lt-svc-row is-on is-pick ${sel ? 'is-sel' : ''}"><input class="visually-hidden" type="radio" name="ltMode" value="${val}" ${sel ? 'checked' : ''}>
                <span class="lt-svc-radio" aria-hidden="true"><i class="bi bi-check-lg"></i></span>${inner}</label></li>`
            : `<li class="lt-svc-row ${ok ? 'is-on' : 'is-off'} ${sel ? 'is-sel' : ''}">${sel ? '<span class="lt-svc-radio" aria-hidden="true"><i class="bi bi-check-lg"></i></span>' : ''}${inner}</li>`;
        };
        const p = esc(pin);
        const rows = row(r.home, 'house-heart', 'Home Sample Collection',
          `${r.homeLabCount} lab${r.homeLabCount > 1 ? 's' : ''} collect at your doorstep${r.earliestHome ? '<span class="lt-svc-em"><i class="bi bi-clock" aria-hidden="true"></i> Earliest: ' + esc(r.earliestHome) + '</span>' : ''}`,
          `Technicians don't visit ${p} yet`, 'home')
          + row(r.lab, 'hospital', 'Visit Lab Centre',
            `${r.centreLabCount} partner centre${r.centreLabCount > 1 ? 's' : ''} near you<span class="lt-svc-em"><i class="bi bi-qr-code-scan" aria-hidden="true"></i> Walk in at your booked slot</span>`,
            `No partner centre near ${p} yet`, 'centre');
        const foot = both ? `<span data-svc-foot>${footBoth()}</span>`
          : !none ? `<i class="bi bi-lightbulb-fill" aria-hidden="true"></i><span>Only <b>${MODE_NAME[chosen]}</b> is available here, so we've selected it for you. Press <b>Continue</b>.</span>`
            : '';
        /* not served: clear message + change location (+ optional notify) */
        const cityName = picked && picked.city && picked.city !== 'Your area' ? esc(picked.city) : 'pincode ' + p;
        const served = (LT.data.servedCities || []);
        const na = none ? `<div class="lt-svc-na">
            <p class="lt-svc-na-msg"><b>Sorry, our lab test services are not available in ${cityName} yet.</b>
              Please change your location to book tests and use our services.</p>
            ${served.length ? `<div class="lt-svc-na-cities"><span>We currently serve:</span>${served.map((c) => `<button type="button" class="lt-svc-city" data-try="${esc(c)}"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ${esc(c)}</button>`).join('')}</div>` : ''}
            <button type="button" class="btn lt-btn lt-svc-change" data-change-loc><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Change location</button>
          </div>` : '';
        const notify = none ? `<details class="lt-svc-notify" data-notify-box>
            <summary class="lt-svc-notify-l"><i class="bi bi-bell" aria-hidden="true"></i> Want us in ${cityName}? Get notified when we launch</summary>
            <div class="lt-svc-notify-f mt-2"><label class="visually-hidden" for="ltNotify">Mobile number or email</label><input id="ltNotify" class="form-control" inputmode="email" autocomplete="email" placeholder="Mobile number or email" aria-describedby="ltNotifyErr"><button type="button" class="btn lt-btn-outline" data-notify>Notify me</button></div>
            <div class="lt-field-err" id="ltNotifyErr" data-notify-err hidden>Enter a valid 10-digit mobile number or email.</div></details>` : '';
        return `<section class="lt-svc ${lvl}" aria-label="Service availability">
          <header class="lt-svc-head"><span class="lt-svc-badge" aria-hidden="true"><i class="bi bi-${head[0]}"></i></span>
            <span class="lt-svc-title"><strong>${head[1]}</strong><small><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ${where}${none ? '' : ' · ' + head[2]}</small></span></header>
          ${both ? '<p class="lt-svc-ask" id="ltSvcAsk"><i class="bi bi-hand-index-thumb" aria-hidden="true"></i> How would you like to get your tests done?</p>' : ''}
          ${none ? na : `<ul class="lt-svc-list" ${both ? 'role="radiogroup" aria-labelledby="ltSvcAsk"' : ''}>${rows}</ul>`}
          ${foot ? `<p class="lt-svc-foot ${both && !chosen ? 'is-ask' : ''}">${foot}</p>` : ''}${notify}</section>`;
      }
      function footBoth() {
        return chosen
          ? `<i class="bi bi-check-circle-fill" aria-hidden="true"></i><span>You chose <b>${MODE_NAME[chosen]}</b>. Press <b>Continue</b>. You can switch later from the header.</span>`
          : '<i class="bi bi-info-circle-fill" aria-hidden="true"></i><span>Choose one option to continue. Scans like ultrasound, X-ray and ECG need a lab centre visit.</span>';
      }
      /* radio cards (both available) */
      function bindModePick() {
        const list = $('.lt-svc-list[role=radiogroup]'); if (!list) return;
        list.onchange = (e) => {
          const inp = e.target.closest('input[name=ltMode]'); if (!inp) return;
          chosen = userPick = inp.value;
          md.$$('.lt-svc-row.is-pick').forEach((l) => l.classList.toggle('is-sel', l.contains(inp)));
          $('[data-svc-foot]').innerHTML = footBoth(); $('.lt-svc-foot').classList.remove('is-ask');
          syncContinue();
        };
      }
      function syncContinue() {
        $('[data-continue]').disabled = !(serv && chosen);
        const info = $('[data-picked] [data-mode]');
        if (info) info.remove();
        if (serv && chosen) $('[data-picked]').insertAdjacentHTML('beforeend', `<span class="lt-loc-mode" data-mode><i class="bi bi-${chosen === 'home' ? 'house-heart' : 'hospital'}" aria-hidden="true"></i> ${MODE_NAME[chosen]}</span>`);
      }

      async function check(pin, btn) {
        serv = null;
        $('[data-continue]').disabled = true;
        pin = String(pin || '').trim();
        if (!/^[1-9]\d{5}$/.test(pin)) {
          $('[data-result]').innerHTML = '<div class="lt-alert is-warn"><i class="bi bi-exclamation-triangle"></i><div>Please enter a valid 6-digit Indian pincode.</div></div>';
          return;
        }
        const box = $('[data-result]');
        box.innerHTML = '<div class="lt-skel" style="height:56px;border-radius:14px"></div>';
        try {
          const r = await busy(btn, () => LT.api.checkServiceability(pin));
          if (!picked || !picked.city) {
            const m = await LT.api.searchLocations(pin);
            if (m[0]) picked = Object.assign(picked || {}, m[0]);
            else picked = Object.assign(picked || {}, { city: 'Your area', pincode: pin });
            $('[data-picked]').innerHTML = `<i class="bi bi-geo-alt-fill text-primary"></i> <b>${esc(picked.area ? picked.area + ', ' : '')}${esc(picked.city)}</b> <span class="badge bg-light text-dark border ms-1">${esc(pin)}</span>`;
          }
          /* method: auto when only one is available; when both, keep the user's pick (or the saved method) */
          const prefer = userPick || LT.store.get().mode || null;
          chosen = r.home && r.lab ? prefer : r.home ? 'home' : r.lab ? 'centre' : null;
          box.innerHTML = svcCard(r, pin);
          if (r.home || r.lab) {
            serv = r;
            bindModePick(); syncContinue();
          } else {
            /* "Change location": clear search and start again; city chips search that city */
            $('[data-change-loc]').onclick = resetSearch;
            md.$$('[data-try]').forEach((b) => { b.onclick = () => { resetSearch(); q.value = b.dataset.try; q.dispatchEvent(new Event('input')); }; });
            $('[data-notify]').onclick = async () => {
              const inp = $('#ltNotify'), v = inp.value.trim();
              const ok = /^[6-9]\d{9}$/.test(v) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
              inp.classList.toggle('is-invalid', !ok); $('[data-notify-err]').hidden = ok;
              if (!ok) return inp.focus();
              await LT.api.notifyMe(v, pin);
              $('[data-notify-box]').outerHTML = `<div class="lt-svc-notify lt-svc-done"><i class="bi bi-bell-fill" aria-hidden="true"></i><span>Done! We'll tell you at <b>${esc(v)}</b> when we launch in ${esc(pin)}.</span></div>`;
              toast("Thanks! We'll notify you when we launch here.");
            };
          }
        } catch (e) {
          box.innerHTML = `<div class="lt-alert is-danger"><i class="bi bi-x-octagon"></i><div>${esc(errMsg(e))}</div></div>`;
        }
      }

      /* start over: empty search, guide text back, nothing selected */
      function resetSearch() {
        picked = null; serv = null; chosen = null;
        q.value = ''; $('[data-clear]').hidden = true; close();
        $('[data-result]').innerHTML = HINT;
        $('[data-picked]').innerHTML = '<span class="lt-muted">No location selected yet</span>';
        $('[data-continue]').disabled = true;
        md.el.querySelector('.modal-body').scrollTop = 0;
        q.focus();
      }

      /* geolocation */
      $('[data-geo]').onclick = async (e) => {
        $('[data-geo-err]').hidden = true;
        try {
          const g = await busy(e.currentTarget, () => LT.api.reverseGeocode());
          setPicked(g);
          toast('Location detected: ' + g.area + ', ' + g.city);
        } catch (er) {
          $('[data-geo-err]').textContent = errMsg(er);
          $('[data-geo-err]').hidden = false;
        }
      };

      /* search with suggestions + keyboard */
      const q = $('#ltLocQ'), list = $('#ltLocList');
      const hl = (txt, term) => esc(txt).replace(new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
      const close = () => { list.hidden = true; q.setAttribute('aria-expanded', 'false'); activeIdx = -1; };

      /* Suggestions float ABOVE the popup instead of being cut off by its scroll area:
         the list sits on the .modal element (outside the dialog) with position: fixed, aligned to the search box.
         It opens upwards when there is not enough room below (e.g. phone keyboard open). */
      const sbox = $('.lt-loc-searchbox'), mbody = md.el.querySelector('.modal-body');
      md.el.appendChild(list); list.classList.add('is-float');
      const place = () => {
        if (list.hidden) return;
        const r = sbox.getBoundingClientRect(), b = mbody.getBoundingClientRect();
        if (r.bottom < b.top || r.top > b.bottom) return close(); // search box scrolled out of view
        const vv = window.visualViewport, vh = vv ? vv.height + vv.offsetTop : window.innerHeight, vw = document.documentElement.clientWidth, gap = 8;
        const below = vh - r.bottom - gap - 12, above = r.top - gap - 12, up = below < 180 && above > below;
        list.style.left = Math.max(8, r.left) + 'px';
        list.style.width = Math.min(r.width, vw - 16) + 'px';
        list.style.maxHeight = Math.max(120, Math.min(340, up ? above : below)) + 'px';
        if (up) { list.style.top = 'auto'; list.style.bottom = (window.innerHeight - r.top + gap) + 'px'; }
        else { list.style.bottom = 'auto'; list.style.top = (r.bottom + gap) + 'px'; }
        list.classList.toggle('is-up', up);
      };
      /* while open, follow the search box every frame (popup slide-in, phone keyboard, scrolling, resizing) */
      let raf = 0;
      const track = () => { place(); raf = list.hidden ? 0 : requestAnimationFrame(track); };
      const openList = () => { list.hidden = false; q.setAttribute('aria-expanded', 'true'); if (!raf) track(); };
      /* plus event-based updates (also covers browsers/tabs that pause animation frames) */
      const vv = window.visualViewport;
      ['shown.bs.modal', 'transitionend'].forEach((ev) => md.el.addEventListener(ev, place));
      md.el.addEventListener('scroll', place, true);
      window.addEventListener('resize', place); if (vv) vv.addEventListener('resize', place);
      md.el.addEventListener('hidden.bs.modal', () => {
        cancelAnimationFrame(raf); raf = 0;
        window.removeEventListener('resize', place); if (vv) vv.removeEventListener('resize', place);
      });
      const paintSuggest = () => {
        [...list.querySelectorAll('.lt-suggest-item')].forEach((x, i) => {
          x.classList.toggle('is-active', i === activeIdx);
          x.setAttribute('aria-selected', i === activeIdx);
        });
      };

      $('[data-clear]').onclick = () => {
        q.value = '';
        $('[data-clear]').hidden = true;
        close();
        q.focus();
      };

      q.addEventListener('input', debounce(async () => {
        const term = q.value.trim();
        $('[data-clear]').hidden = !term;
        if (/^[1-9]\d{5}$/.test(term)) {
          close();
          const match = await LT.api.searchLocations(term);
          if (match[0]) setPicked(match[0], true);
          else { picked = null; check(term); } // unknown pincode: don't keep the previous area's name
          return;
        }
        if (term.length < 2) return close();
        results = await LT.api.searchLocations(term);
        list.innerHTML = results.length ? results.map((r, i) => `
          <button type="button" role="option" class="lt-suggest-item d-flex align-items-center gap-2" data-i="${i}">
            <i class="bi bi-geo-alt-fill text-primary"></i>
            <div class="flex-grow-1 text-truncate">
              <span class="fw-bold lt-ink">${hl(r.area, term)}</span>
              <small class="lt-muted ms-1">${hl(r.city, term)}</small>
            </div>
            <span class="badge bg-light text-secondary border">${hl(r.pincode, term)}</span>
          </button>
        `).join('') : `<div class="lt-suggest-empty" role="status"><i class="bi bi-geo" aria-hidden="true"></i><span><b>No matching area for “${esc(term)}”.</b> We currently serve ${esc(servedTxt)}. Try an area there or enter a 6-digit pincode.</span></div>`;
        activeIdx = -1;
        openList();
      }, 200));

      q.addEventListener('keydown', (e) => {
        const n = results.length;
        if (list.hidden || !n) {
          if (e.key === 'Enter' && /^[1-9]\d{5}$/.test(q.value.trim())) {
            e.preventDefault();
            check(q.value.trim());
          }
          return;
        }
        if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = (activeIdx + 1) % n; paintSuggest(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = (activeIdx - 1 + n) % n; paintSuggest(); }
        if (e.key === 'Enter' && activeIdx >= 0) {
          e.preventDefault();
          setPicked(results[activeIdx]);
          close();
        }
        if (e.key === 'Escape') close();
      });

      list.onclick = (e) => {
        const b = e.target.closest('[data-i]');
        if (!b) return;
        const r = results[+b.dataset.i];
        setPicked(r);
        close();
      };

      md.el.addEventListener('click', (e) => { // inside the popup only (no listener left behind after it closes)
        if (!q.contains(e.target) && !list.contains(e.target)) close();
      });

      $('[data-continue]').onclick = () => {
        if (!serv || !chosen) return;
        LT.store.set({
          location: {
            city: picked.city,
            area: picked.area,
            pincode: picked.pincode,
            lat: picked.lat || null,
            lng: picked.lng || null,
            serviceable: { home: serv.home, lab: serv.lab }
          },
          mode: chosen,
          lab: Object.assign(LT.store.get().lab, { id: null, centreId: null }),
          slot: LT.store.defaults().slot,
          address: { id: null }
        });
        saved = true;
        md.close();
      };

      const cur = LT.store.get().location;
      if (cur.pincode) setPicked(cur);
      else md.el.addEventListener('shown.bs.modal', () => $('#ltLocQ').focus(), { once: true }); // first visit: start typing right away
    });
  }

  /* =================== LANDING (PHASE 4) =================== */
  const HERO_SVG = `<svg viewBox="0 0 420 360" role="img" aria-label="Lab test tubes, microscope and report illustration">
    <ellipse cx="210" cy="338" rx="160" ry="12" fill="rgba(11,27,63,.12)"/>
    <rect x="34" y="64" width="352" height="250" rx="30" fill="#fff" stroke="#dbe7fd" stroke-width="2"/>
    <rect x="34" y="64" width="352" height="46" rx="23" fill="#f1f5fe"/><circle cx="62" cy="87" r="7" fill="#e5484d"/><circle cx="84" cy="87" r="7" fill="#f59e0b"/><circle cx="106" cy="87" r="7" fill="#12a150"/><rect x="250" y="80" width="110" height="14" rx="7" fill="#dbe7fd"/>
    <g transform="translate(70 150)"><rect x="-8" y="96" width="150" height="20" rx="10" fill="#c3d6fb"/>${[0, 1, 2, 3].map((i) => `<rect x="${6 + i * 32}" y="0" width="22" height="104" rx="11" fill="#f7f9ff" stroke="#c3d6fb" stroke-width="2"/><rect x="${8 + i * 32}" y="${38 + i * 8}" width="18" height="${64 - i * 8}" rx="9" fill="${['#e5484d', '#1964ee', '#12a150', '#f59e0b'][i]}"/>`).join('')}</g>
    <g transform="translate(228 112)"><rect x="34" y="176" width="116" height="20" rx="10" fill="#0b1b3f"/><rect x="82" y="110" width="20" height="70" rx="8" fill="#0849c1"/><path d="M58 30 l40 -26 22 34 -40 26z" fill="#1964ee"/><rect x="54" y="60" width="28" height="64" rx="10" transform="rotate(-32 68 92)" fill="#1964ee"/><circle cx="100" cy="122" r="26" fill="none" stroke="#7ea6f6" stroke-width="10"/><rect x="16" y="140" width="70" height="10" rx="5" fill="#50d1b6"/></g>
    <g transform="translate(232 238)"><rect width="140" height="58" rx="16" fill="#fff" stroke="#dbe7fd" stroke-width="2"/><circle cx="28" cy="29" r="15" fill="#e6f7f0"/><path d="M21 29l5 5 9-10" stroke="#0e9f6e" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="52" y="18" width="70" height="8" rx="4" fill="#0b1b3f"/><rect x="52" y="33" width="48" height="7" rx="3.5" fill="#c3d6fb"/></g>
    <path d="M350 40 h22 M361 29 v22" stroke="#50d1b6" stroke-width="6" stroke-linecap="round"/><circle cx="30" cy="300" r="6" fill="#1964ee" opacity=".4"/></svg>`;

  const FAQS = [
    ['How does home sample collection work?', 'Pick a slot and a certified phlebotomist visits your address with a sealed single-use kit. The sample reaches the lab in a temperature-controlled box.'],
    ['Do I need a prescription?', 'No. You can search and book tests yourself. If you have a prescription, upload it and our team will call you to confirm the tests.'],
    ['How do you choose the lab?', 'You choose the lab yourself. We show every partner lab near you with its exact price, rating, accreditation, report time and earliest slot, and you can compare up to 3 side by side.'],
    ['When will I get my reports?', 'Most blood test reports arrive in 6-24 hours. You get them on SMS, email and under My Reports, separately for each family member.'],
    ['Can I book for my family in one go?', 'Yes. Add up to 6 family members in one booking. Each member gets their own tests and report – one lab, one address, one slot.'],
    ['What if I need to cancel?', 'Cancel free up to 12 hours before the slot. Between 2-12 hours you get 50% back, and within 2 hours no refund is possible.']
  ];

  function renderLanding() {
    const s = LT.store.get();
    const pill = (t) => `<span class="bys-tag-pill"><i class="bi bi-plus-lg"></i><span>${t}</span></span>`;
    const head = (tag, title, sub, link) => `<div class="lt-section-head"><div>${pill(tag)}<h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${link ? `<a class="bys-link-line" href="${link[1]}">${link[0]} <i class="bi bi-arrow-right"></i></a>` : ''}</div>`;
    const steps = [['search', 'Choose Your Tests', 'Search, pick a health package or upload your prescription.'], ['building-check', 'Pick A Lab', 'Compare partner labs by price, rating and report time, and pick one.'], ['calendar-check', 'Book A Slot', 'Home sample collection or a centre visit at a time that suits you.'], ['file-earmark-medical', 'Get Your Reports', 'Digital reports for each family member, usually within 24 hours.']];
    const testimonials = [
      {
        name: 'Anjali Deshmukh',
        loc: 'Baner, Pune',
        avatar: 'AD',
        rating: 5,
        title: 'Painless & On-Time Collection',
        quote: 'The phlebotomist arrived at 6:30 AM sharp with a sealed sterile kit. Collection was completely painless, and I received my full thyroid report by 5 PM on WhatsApp and email.',
        test: 'Thyroid Care Profile',
        time: '2 days ago'
      },
      {
        name: 'Vikram Salunkhe',
        loc: 'Wakad, Pune',
        avatar: 'VS',
        rating: 5,
        title: 'Hassle-Free Family Booking',
        quote: 'Booked tests for my elderly parents and myself together in one slot. The technician was extremely gentle with my mother. Separate digital reports for each of us made it super convenient!',
        test: 'Senior Citizen Health Package',
        time: '5 days ago'
      },
      {
        name: 'Fatima Khan',
        loc: 'Kothrud, Pune',
        avatar: 'FK',
        rating: 5,
        title: 'Transparent Pricing & Accurate Results',
        quote: 'Uploaded my doctor prescription and within 2 minutes all tests were mapped accurately. Comparing certified NABL partner labs side by side helped me save 40% on my full body checkup.',
        test: 'Full Body Comprehensive (78 Tests)',
        time: '1 week ago'
      },
      {
        name: 'Rajesh Nair',
        loc: 'Hinjawadi, Pune',
        avatar: 'RN',
        rating: 5,
        title: 'Early Morning Slot Before Work',
        quote: 'Selected a 6:00 AM home collection slot before leaving for office. The sample was barcoded right in front of me and tracked online. Received detailed HbA1c graph analysis the same day.',
        test: 'HbA1c & Diabetes Risk Screening',
        time: '3 days ago'
      },
      {
        name: 'Dr. Priya Kulkarni',
        loc: 'Kalyani Nagar, Pune',
        avatar: 'PK',
        rating: 5,
        title: 'Clinical Accuracy You Can Trust',
        quote: 'As a physician, lab accreditation matters deeply to me. BeyondSure only connects with certified NABL and CAP accredited labs. The clinical reference ranges were immaculate and trustworthy.',
        test: 'Vitamin D3 & B12 Vitality Duo',
        time: '4 days ago'
      },
      {
        name: 'Amitava Roy',
        loc: 'Aundh, Pune',
        avatar: 'AR',
        rating: 5,
        title: 'Side-By-Side Lab Comparison',
        quote: 'Comparing turnaround time and lab accreditation side by side made choosing so easy. The technician was in full sanitization gear with cold-chain box. Highly recommend BeyondSure!',
        test: 'Advanced Cardiac Risk Profile',
        time: '6 days ago'
      },
      {
        name: 'Sneha Joshi',
        loc: 'Hadapsar, Pune',
        avatar: 'SJ',
        rating: 5,
        title: 'Super Smooth Prescription Upload',
        quote: 'My doctor had scribbled 4 different tests. Uploaded the photo, and within minutes BeyondSure mapped each exact test with fasting instructions. No confusion whatsoever.',
        test: 'Complete Blood Count & Iron Panel',
        time: '1 week ago'
      },
      {
        name: 'Deepak Mehta',
        loc: 'Koregaon Park, Pune',
        avatar: 'DM',
        rating: 5,
        title: 'Great Support & Gentle Phlebotomist',
        quote: 'My 78-year-old father has difficult veins. The phlebotomist who visited was so calm and skilled that he took the sample in one smooth prick. My father did not feel any discomfort at all.',
        test: 'Comprehensive Liver & Kidney Panel',
        time: '2 weeks ago'
      }
    ];
    app.innerHTML = `
      <section class="fd-hero lt-lhero" aria-labelledby="ltHeroH">
        <span class="fd-plus bys-p1" aria-hidden="true">+</span><span class="fd-plus bys-p2" aria-hidden="true">+</span>
        <span class="fd-orb bys-o1" aria-hidden="true"></span><span class="fd-orb bys-o2" aria-hidden="true"></span>
        <div class="fd-hero-inner">
          <div class="fd-hero-copy">
            ${LT.layout.labBar()}
            <nav class="fd-crumbs" aria-label="Breadcrumb"><a href="${LT.layout.site('index.html')}">Home</a><i class="bi bi-chevron-right" aria-hidden="true"></i><span aria-current="page">Diagnostic Lab Tests</span></nav>
            <h1 id="ltHeroH">Accurate Lab Tests, Delivered To Your <span class="lt-hl">Doorstep.</span></h1>
            <p class="fd-lead">Book from NABL-accredited partner labs near ${esc(s.location.area || s.location.city || 'you')}. Free home sample collection, transparent prices and digital reports for your whole family.</p>
            <form class="fd-search lt-lsearch" role="search" data-search>
              <div class="fd-field"><i class="bi bi-search" aria-hidden="true"></i><label class="visually-hidden" for="ltQ">Search tests</label><input type="search" id="ltQ" placeholder="Search tests e.g. CBC, Thyroid, Vitamin D" autocomplete="off" aria-controls="ltSug"></div>
              <button type="submit" class="bys-btn-brand fd-search-btn"><i class="bi bi-search"></i><span>Search Tests</span></button>
              <div class="lt-suggest" id="ltSug" hidden></div>
            </form>
            <div class="lt-lhero-ctas d-none"><a class="bys-btn-brand" href="${url('search.html')}">Book Lab Test <i class="bi bi-arrow-right"></i></a><a class="bys-btn-brand-outline" href="${url('prescription-upload.html')}"><i class="bi bi-file-earmark-arrow-up"></i> Upload Prescription</a></div>
            <ul class="fd-trust"><li><i class="bi bi-patch-check-fill"></i> NABL partner labs</li><li><i class="bi bi-house-heart-fill"></i> Free home collection</li><li><i class="bi bi-file-earmark-medical-fill"></i> Reports in 24 hrs</li><li><i class="bi bi-shield-fill-check"></i> Secure payments</li></ul>
          </div>
          <div class="lt-lmedia" aria-hidden="true">${HERO_SVG}
            <div class="lt-float f1"><span class="ico"><i class="bi bi-patch-check"></i></span><div><b>350+ Labs</b><small>NABL &amp; CAP partners</small></div></div>
            <div class="lt-float f2"><span class="ico"><i class="bi bi-house-heart"></i></span><div><b>Home Collection</b><small>From 6:00 AM daily</small></div></div>
            <div class="lt-float f3"><span class="ico"><i class="bi bi-currency-rupee"></i></span><div><b>Up to 60% off</b><small>vs. MRP</small></div></div>
          </div>
        </div>
      </section>

      <div class="lt-container">
        <section class="lt-section" style="margin-top:56px"><div class="lt-banner"><span class="lt-banner-ico"><i class="bi bi-file-earmark-medical"></i></span>
          <div class="lt-banner-txt"><h3>Book lab test with prescription – faster and easier</h3><p class="mb-0">Upload a photo or PDF. Our team calls you to confirm the right tests – no confusion from unclear handwriting.</p></div>
          <a class="bys-btn-brand" href="${url('prescription-upload.html')}">Upload Now <i class="bi bi-arrow-right"></i></a></div></section>

        <section class="lt-section">${head('Quick Picks', 'Explore Common Tests', '', ['View All Tests', url('search.html')])}<div class="lt-tiles" data-common></div></section>

        <section class="lt-section">${head('Made For You', 'Popular By Life Stage', '', ['All Packages', url('packages.html')])}<div class="row g-3" data-life></div></section>

        <section class="lt-section">${head('Most Booked', 'Popular Diagnostic Tests', 'Prices shown are the lowest across labs serving ' + esc(s.location.pincode || 'your area') + '.', ['See More', url('search.html')])}<div class="lt-grid" data-popular></div></section>

        <section class="lt-section"><div class="lt-trust">
          <div><i class="bi bi-house-check"></i><div><strong>Sanitized Cabins</strong><span>Cleaned after every visit</span></div></div>
          <div><i class="bi bi-box-seam"></i><div><strong>Single-Use Kits</strong><span>Sealed in front of you</span></div></div>
          <div><i class="bi bi-heart-pulse"></i><div><strong>Painless Collection</strong><span>Trained phlebotomists</span></div></div>
          <div><i class="bi bi-patch-check"></i><div><strong>NABL-Accredited Labs</strong><span>Quality you can trust</span></div></div></div></section>

        <section class="lt-section">${head('Save More', 'Curated Full Body Checkups', '', ['Compare Packages', url('packages.html')])}<div class="lt-grid" data-pkgs></div></section>

        <section class="lt-section lt-lsection-panel">${head('By Body System', 'Explore By Specialty')}<div class="lt-tiles" data-spec></div></section>

        <section class="lt-section bys-how" aria-labelledby="ltHow"><div>${pill('How It Works')}<h2 class="bys-sec-title" id="ltHow">Booking A Lab Test Takes Less Than 2 Minutes.</h2></div>
          <div class="row bys-steps">${steps.map(([icon, t, p], i) => `<div class="col-sm-6 col-lg-3"><div class="bys-step"><span class="bys-step-ico"><i class="bi bi-${icon}"></i></span><div class="bys-num">0${i + 1}</div><h5>${t}</h5><p>${p}</p></div></div>`).join('')}</div>
          <div class="bys-how-ctas"><a class="bys-btn-brand-outline" href="${url('packages.html')}">View Packages</a><a class="bys-btn-brand" href="${url('search.html')}">Book Your Lab Test Today <i class="bi bi-arrow-right"></i></a></div></section>

        <section class="lt-section lt-testimonials-section" aria-labelledby="ltLovedBy">
          <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
            <div>
              ${pill('Loved By Families')}
              <h2 class="bys-sec-title mb-1" id="ltLovedBy">What Our Patients Say</h2>
              <p class="text-muted mb-0">Real verified feedback from patients booking home collections and diagnostic tests across Pune.</p>
            </div>
            <div class="lt-marquee-ctrls d-flex align-items-center gap-2">
              <span class="lt-live-badge"><span class="lt-live-dot"></span> 4.9/5 from 200K+ patients</span>
              <button class="lt-marquee-btn" type="button" data-marquee-pause title="Pause or Resume auto-scrolling" aria-label="Pause auto-scroll">
                <i class="bi bi-pause-fill"></i>
              </button>
              <button class="lt-marquee-btn" type="button" data-marquee-prev title="Scroll left" aria-label="Scroll left">
                <i class="bi bi-chevron-left"></i>
              </button>
              <button class="lt-marquee-btn" type="button" data-marquee-next title="Scroll right" aria-label="Scroll right">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          <div class="lt-marquee-outer">
            <div class="lt-marquee-wrap" tabindex="0" role="region" aria-label="Patient testimonials slider">
              <div class="lt-marquee-track py-3">${[...testimonials, ...testimonials].map((t) => `
                <div class="lt-marquee-item">
                  <div class="lt-quote h-100">
                    <div class="lt-quote-head">
                      <div class="lt-quote-rating" aria-label="${t.rating} out of 5 stars">
                        <div class="stars">${'<i class="bi bi-star-fill"></i>'.repeat(t.rating)}</div>
                        <span class="lt-quote-score">5.0</span>
                      </div>
                      <div class="lt-quote-badge" aria-hidden="true">
                        <i class="bi bi-quote"></i>
                      </div>
                    </div>
                    <div class="lt-quote-body">
                      <h3 class="lt-quote-title">${t.title}</h3>
                      <p class="lt-quote-text">“${t.quote}”</p>
                    </div>
                    <div class="lt-quote-footer">
                      <div class="lt-quote-author">
                        <div class="lt-quote-avatar" aria-hidden="true">${t.avatar}</div>
                        <div class="lt-quote-author-info">
                          <div class="lt-quote-name">
                            <span>${t.name}</span>
                            <span class="lt-quote-vbadge" title="Verified Patient"><i class="bi bi-patch-check-fill"></i></span>
                          </div>
                          <div class="lt-quote-loc"><i class="bi bi-geo-alt"></i> ${t.loc} <span class="lt-quote-dot">•</span> ${t.time}</div>
                        </div>
                      </div>
                      <div class="lt-quote-tag">
                        <i class="bi bi-shield-check"></i> ${t.test}
                      </div>
                    </div>
                  </div>
                </div>`).join('')}</div>
            </div>
          </div>

          <div class="lt-stats mt-4">${[['200K+', 'Patients served'], ['100%', 'Secure reports'], ['350+', 'Partner labs'], ['10K+', 'Home visits a month']].map((x) => `<div class="lt-stat"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div></section>

        <section class="lt-section bys-faq" aria-labelledby="ltFaqT"><div>${pill('Quick Answers')}<h2 class="bys-sec-title mb-3" id="ltFaqT">Questions We Hear All The Time</h2></div>
          <div class="bys-faq-wrap"><div class="row g-3 g-lg-4 align-items-start">${[FAQS.slice(0, 3), FAQS.slice(3)].map((col, c) => `<div class="col-lg-6" id="ltFaqC${c}">${col.map((f, i) => `<div class="bys-faq-item"><button class="bys-faq-q" type="button" data-bs-toggle="collapse" data-bs-target="#ltF${c}${i}" aria-expanded="${!i}" aria-controls="ltF${c}${i}">${f[0]}<span class="bys-faq-ic" aria-hidden="true"></span></button><div id="ltF${c}${i}" class="collapse ${i ? '' : 'show'}" data-bs-parent="#ltFaqC${c}"><p class="bys-faq-a">${f[1]}</p></div></div>`).join('')}</div>`).join('')}</div></div></section>

        <section class="lt-section"><div class="lt-band d-flex flex-wrap align-items-center justify-content-between gap-3"><div><h2 class="h3 fw-bold">Ready to book your tests?</h2><p class="mb-0">Takes less than 2 minutes. Pay online or at collection.</p></div>
          <div class="lt-acts"><a class="btn lt-btn-light" href="${url('search.html')}">Book Lab Test</a><a class="btn lt-btn-glass" href="${url('prescription-upload.html')}">Upload Prescription</a></div></div></section>
      </div>`;
    bindSearch();
    bindMarquee();
    loadSections();
  }

  function bindMarquee() {
    const wrap = app.querySelector('.lt-marquee-wrap');
    if (!wrap) return;
    const track = wrap.querySelector('.lt-marquee-track');
    if (!track) return;

    const pauseBtn = app.querySelector('[data-marquee-pause]');
    const prevBtn = app.querySelector('[data-marquee-prev]');
    const nextBtn = app.querySelector('[data-marquee-next]');

    let isPaused = false;
    if (pauseBtn) {
      pauseBtn.onclick = () => {
        isPaused = !isPaused;
        track.classList.toggle('is-paused', isPaused);
        pauseBtn.innerHTML = isPaused ? '<i class="bi bi-play-fill"></i>' : '<i class="bi bi-pause-fill"></i>';
        pauseBtn.setAttribute('aria-label', isPaused ? 'Resume auto-scrolling' : 'Pause auto-scrolling');
        pauseBtn.title = isPaused ? 'Resume auto-scrolling' : 'Pause auto-scrolling';
      };
    }

    const step = (dir) => {
      try {
        const style = window.getComputedStyle(track);
        const matrix = window.DOMMatrixReadOnly ? new DOMMatrixReadOnly(style.transform) : (window.WebKitCSSMatrix ? new WebKitCSSMatrix(style.transform) : null);
        const currentX = matrix ? matrix.m41 : 0;
        const item = wrap.querySelector('.lt-marquee-item');
        const cardWidth = (item ? item.offsetWidth : 380) + 24;
        let targetX = currentX + (dir * cardWidth);
        const halfWidth = track.scrollWidth / 2;

        if (targetX > 0) targetX = -halfWidth + cardWidth;
        if (targetX < -halfWidth) targetX = 0;

        track.style.animation = 'none';
        track.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
        track.style.transform = `translate3d(${targetX}px, 0, 0)`;

        clearTimeout(track._resumeTimer);
        track._resumeTimer = setTimeout(() => {
          track.style.transition = '';
          if (!isPaused) {
            track.style.animation = '';
            track.style.transform = '';
          }
        }, 4500);
      } catch (err) {
        console.warn('Marquee step error:', err);
      }
    };

    if (prevBtn) prevBtn.onclick = () => step(1);
    if (nextBtn) nextBtn.onclick = () => step(-1);
  }

  async function loadSections() {
    const $ = (s) => app.querySelector(s);
    skeleton($('[data-common]'), 'tile', 8); skeleton($('[data-spec]'), 'tile', 10); skeleton($('[data-popular]'), 'card', 6); skeleton($('[data-pkgs]'), 'card', 4); skeleton($('[data-life]'), 'block', 2, 'col-md-6');
    try {
      const [cats, pop] = await Promise.all([LT.api.getCategories(), LT.api.getPopular()]);
      const colors = { cbc: 'blood', sugar: 'diabetes', lipid: 'blood', thyroid: 'imaging', vitamins: 'metabolism', heart: 'blood', hormones: 'imaging', infection: 'bone', imaging: 'imaging' };
      $('[data-common]').innerHTML = cats.chips.slice(0, 8).map((c) => `<a class="lt-tile" href="${url('search.html?category=' + c.key)}"><span class="lt-tile-ico" data-c="${colors[c.key]}"><i class="bi ${c.icon}"></i></span>${esc(c.label)}</a>`).join('');
      $('[data-spec]').innerHTML = cats.categories.map((c) => `<a class="lt-tile" href="${url('search.html?category=' + c.key)}"><span class="lt-tile-ico" data-c="${c.color}"><i class="bi ${c.icon}"></i></span>${esc(c.label)}</a>`).join('');
      $('[data-popular]').innerHTML = pop.tests.map((t) => testCard(t)).join('');
      $('[data-pkgs]').innerHTML = pop.packages.filter((p) => ['pkg-fullbody', 'pkg-senior', 'pkg-women', 'pkg-heart'].includes(p.id)).map((p) => packageCard(p)).join('');
      const young = pop.packages.find((p) => p.id === 'pkg-young');
      const side = pop.packages.filter((p) => ['pkg-women', 'pkg-senior', 'pkg-diabetes'].includes(p.id));
      const icons = { women: ['gender-female', 'blood'], senior: ['person-heart', 'bone'], diabetes: ['droplet-half', 'diabetes'] };
      $('[data-life]').innerHTML = `<div class="col-lg-7"><div class="lt-life-hero"><span class="lt-badge-new align-self-start">For age 18-30</span><h3 class="mt-3">${esc(young.name)}</h3><p class="mb-0">${esc(young.description)}</p>
          <ul>${young.testsDetail.slice(0, 4).map((t) => `<li><i class="bi bi-check-circle-fill"></i>${esc(t.name)}</li>`).join('')}<li><i class="bi bi-plus-circle"></i>${young.testsDetail.length - 4} more · ${young.parameters} parameters</li></ul>
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-auto">${priceBlock(young.fromPrice, young.mrp, { from: true })}<div class="d-flex gap-2"><button type="button" class="btn lt-btn-glass" data-pkg-open="${young.id}">Details</button>${addBtn(young.id)}</div></div></div></div>
        <div class="col-lg-5">${side.map((p) => `<a class="lt-life-side" href="${url('packages.html?stage=' + p.lifeStage)}"><span class="lt-tile-ico" data-c="${icons[p.lifeStage][1]}"><i class="bi bi-${icons[p.lifeStage][0]}"></i></span><div class="flex-grow-1"><h4>${esc(p.name)}</h4><small>${p.parameters} parameters · ${esc(p.lifeLabel)}</small></div><div class="text-end"><small class="d-block" >From</small><b class="lt-ink">${money(p.fromPrice)}</b></div></a>`).join('')}</div>`;
      LT.layout.syncAddButtons();
    } catch (e) {
      ['[data-common]', '[data-spec]', '[data-popular]', '[data-pkgs]', '[data-life]'].forEach((k) => error($(k), { text: errMsg(e), onRetry: loadSections }));
    }
  }

  /* landing search with suggestions */
  function bindSearch() {
    const form = app.querySelector('[data-search]'), q = form.querySelector('input'), box = form.querySelector('#ltSug');
    let idx = -1, opts = [], raf = 0;
    /* the hero hides anything that spills out of it, so the suggestion list lives on <body> and floats (fixed)
       under the search bar: full list visible, opens upwards when there is more room above, never goes under
       the sticky header or the bottom bars (app menu, cart bar) and follows the bar while scrolling */
    document.querySelectorAll('body > .lt-hsug').forEach((x) => x.remove()); // list from an earlier render
    document.body.appendChild(box);
    box.classList.add('lt-hsug');
    const shown = (el) => el && !el.hidden && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
    function limits(vh) {
      let top = 8, bottom = vh - 8;
      const hdr = document.getElementById('siteHeader');
      if (shown(hdr)) { const h = hdr.getBoundingClientRect(); if (h.bottom > 0) top = Math.max(top, h.bottom + 6); }
      [document.getElementById('ltBottomNav'), document.getElementById('ltCartBar')].forEach((el) => {
        if (!shown(el)) return; const b = el.getBoundingClientRect(); if (b.top < vh && b.bottom > 0) bottom = Math.min(bottom, b.top - 8);
      });
      return { top, bottom };
    }
    function place() {
      if (box.hidden) return;
      if (!form.isConnected) { box.hidden = true; return; }
      const f = form.getBoundingClientRect(), vh = window.innerHeight, vw = document.documentElement.clientWidth, gap = 8, lim = limits(vh);
      if (f.bottom < lim.top || f.top > lim.bottom) { box.style.visibility = 'hidden'; return; } // search bar scrolled away
      box.style.visibility = '';
      const below = lim.bottom - (f.bottom + gap), above = (f.top - gap) - lim.top;
      const up = below < 200 && above > below; // prefer opening downwards
      box.style.left = Math.max(8, f.left) + 'px';
      box.style.width = Math.min(f.width, vw - 16) + 'px';
      box.style.maxHeight = Math.min(420, Math.max(up ? above : below, 96)) + 'px';
      if (up) { box.style.top = 'auto'; box.style.bottom = (vh - f.top + gap) + 'px'; } else { box.style.bottom = 'auto'; box.style.top = (f.bottom + gap) + 'px'; }
      box.classList.toggle('is-up', up);
    }
    const track = () => { place(); raf = box.hidden ? 0 : requestAnimationFrame(track); };
    new MutationObserver(() => { if (!box.hidden && !raf) track(); }).observe(box, { attributes: true, attributeFilter: ['hidden'] });
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    const hl = (t, term) => esc(t).replace(new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    q.addEventListener('input', debounce(async () => {
      const term = q.value.trim();
      if (term.length < 2) { box.hidden = true; return; }
      const r = await LT.api.suggestTests(term);
      opts = r.terms.map((t) => ({ href: url('search.html?q=' + encodeURIComponent(t)), html: `<i class="bi bi-search"></i><span>${hl(t, term)}</span>` }))
        .concat(r.items.map((t) => ({ href: url(t.type === 'package' ? 'packages.html?open=' + t.id : 'test-detail.html?id=' + t.id), html: `<i class="bi bi-${t.type === 'package' ? 'box2-heart' : 'droplet'}"></i><span>${hl(t.name, term)}</span><small>From ${money(t.fromPrice)}</small>` })));
      box.innerHTML = opts.length ? (r.terms.length ? '<div class="lt-suggest-h">Searches</div>' : '') + opts.map((o, i) => (i === r.terms.length && r.items.length ? '<div class="lt-suggest-h">Tests &amp; packages</div>' : '') + `<a class="lt-suggest-item" href="${o.href}" data-i="${i}">${o.html}</a>`).join('') : `<div class="lt-suggest-h">No match for “${esc(term)}”. Press Enter to search all tests.</div>`;
      box.hidden = false; idx = -1; place();
    }, 250));
    q.addEventListener('keydown', (e) => {
      const items = [...box.querySelectorAll('.lt-suggest-item')];
      if (box.hidden || !items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((x, i) => x.classList.toggle('is-active', i === idx)); }
      if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); location.href = items[idx].href; }
      if (e.key === 'Escape') box.hidden = true;
    });
    document.addEventListener('click', (e) => { if (!form.contains(e.target) && !box.contains(e.target)) box.hidden = true; });
    form.addEventListener('submit', (e) => { e.preventDefault(); location.href = url('search.html' + (q.value.trim() ? '?q=' + encodeURIComponent(q.value.trim()) : '')); });
  }

  /* ---------- start ---------- */
  /* a location saved earlier may no longer be served (we serve only Pune & Mumbai):
     refresh its flags from the current data so the popup opens and asks for a new location */
  let st = LT.store.get();
  if (st.location.pincode) {
    const now = (LT.data.serviceability || {})[st.location.pincode] || { home: false, lab: false };
    const old = st.location.serviceable || {};
    if (!!now.home !== !!old.home || !!now.lab !== !!old.lab) {
      LT.store.set({ location: Object.assign({}, st.location, { serviceable: { home: !!now.home, lab: !!now.lab } }) });
      st = LT.store.get(); LT.layout.refreshHeader();
    }
  }
  const stillServed = !!(st.location.pincode && st.mode && st.location.serviceable[st.mode === 'home' ? 'home' : 'lab']);
  if (param('setup') === 'location') { renderLanding(); gate({ forceLocation: !!st.location.pincode }); }
  else if (!stillServed) { renderLanding(); gate(); }
  else renderLanding();
})();
