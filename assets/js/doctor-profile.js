/* BeyondSure – Doctor profile page (doctor-profile.html?id=...) */
(function () {
  'use strict';

  const LOGIN = 'https://teleconsult.bysure.in/login';
  const REGISTER = 'https://teleconsult.bysure.in/register';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

  const { DOCTORS, profileUrl } = window.BS_DATA;

  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage unavailable */ } }
  };

  /* ------------------------------------------------------------------
     DATES
     ------------------------------------------------------------------ */
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = (date) => Math.round((startOfDay(new Date(date)) - startOfDay(new Date())) / 86400000);
  const fmtTime = (d) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
  const fmtDay = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtSlot = (iso) => {
    const d = new Date(iso), diff = dayDiff(d);
    const day = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : fmtDay(d);
    return `${day}, ${fmtTime(d)}`;
  };
  const upcoming = (iso) => iso && new Date(iso) > new Date();

  /* open slots for the next 6 days (real next slot + DUMMY schedule from the data file) */
  const buildDays = (d) => {
    const now = new Date();
    const days = [];
    for (let i = 0; i < 6; i++) {
      const date = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
      const times = [];
      if (d.schedule && d.schedule.days.includes(i)) {
        d.schedule.times.forEach((t) => {
          const [hh, mm] = t.split(':').map(Number);
          times.push(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm));
        });
      }
      if (d.nextSlot && dayDiff(d.nextSlot) === i) times.push(new Date(d.nextSlot));
      const unique = [...new Map(times.filter((t) => t > now).map((t) => [t.getTime(), t])).values()].sort((a, b) => a - b);
      days.push({ date, times: unique });
    }
    return days;
  };

  /* ------------------------------------------------------------------
     FIND THE DOCTOR
     ------------------------------------------------------------------ */
  const id = new URLSearchParams(window.location.search).get('id');
  const doc = DOCTORS.find((x) => x.id === id);

  if (!doc) {
    $('#dpBody').hidden = true;
    $('#dpMissing').hidden = false;
    $('#crumbName').textContent = 'Not found';
  } else {
    document.title = `${doc.name} – ${doc.specialty} | BeyondSure`;
    $('#crumbName').textContent = doc.name;

    const days = buildDays(doc);
    const firstOpen = days.find((x) => x.times.length);
    const nextOpen = firstOpen ? firstOpen.times[0] : (upcoming(doc.nextSlot) ? new Date(doc.nextSlot) : null);

    /* ---------------- identity (top of the About card) ---------------- */
    let favs = store.get('bs_fav_doctors', []);
    const fav = favs.includes(doc.id);
    // each field is shown once: specialties = tags, qualification = degree line, experience + languages = chips,
    // mode = note bar, fee / next slot / registration = facts row
    const reg = doc.registration
      ? `<strong>${esc(doc.registration.council)} · ${esc(doc.registration.number)}</strong>`
      : '<strong class="bys-muted">Not provided</strong>';
    const identity = `
      <div class="dp-id">
        <div class="fd-avatar dp-avatar ${doc.color}" aria-hidden="true">${esc(doc.initials)}<span class="bys-tick"><i class="bi bi-check-lg"></i></span></div>
        <div class="dp-id-info">
          <div class="dp-tags">${doc.specialties.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
          <div class="dp-name-row">
            <h1 id="dpName">${esc(doc.name)}</h1>
            <span class="fd-verified"><i class="bi bi-patch-check-fill"></i> Verified</span>
          </div>
          <p class="dp-degree">${esc(doc.degree)}</p>
          <div class="dp-chips">
            <span><i class="bi bi-briefcase"></i><b>${doc.exp} years</b> experience</span>
            <span><i class="bi bi-translate"></i><b>${esc(doc.langs.join(', '))}</b> spoken</span>
          </div>
        </div>
        <div class="dp-actions">
          <button type="button" class="dp-icon-btn" id="favBtn" aria-pressed="${fav}" aria-label="${fav ? 'Remove from' : 'Save to'} favourites"><i class="bi bi-heart"></i></button>
          <button type="button" class="dp-icon-btn" id="shareBtn" aria-label="Share this profile" data-bs-title="Share this profile" data-bs-placement="bottom"><i class="bi bi-box-arrow-up-right"></i></button>
        </div>
      </div>
      <div class="dp-facts">
        <div><small>Consultation fee</small><strong>${inr(doc.fee)}</strong></div>
        <div><small>Next available</small><strong class="${nextOpen ? 'bys-ok' : 'bys-muted'}">${nextOpen ? esc(fmtSlot(nextOpen.toISOString())) : 'No open slots'}</strong></div>
        <div><small>Registration</small>${reg}</div>
      </div>
      <div class="dp-note"><i class="bi bi-camera-video"></i> Online video consultation — no travel needed</div>`;

    /* ---------------- about ---------------- */
    const about = doc.about && doc.about !== 'NA'
      ? `<p class="dp-about">${esc(doc.about)}</p>`
      : `<p class="dp-about dp-muted"><i class="bi bi-info-circle"></i> ${esc(doc.name)} hasn't added an about section yet.</p>`;
    $('#aboutCard').innerHTML = `
      <div class="dp-ident">${identity}</div>
      <div class="dp-divider"></div>
      <h2 class="dp-card-title"><span class="dp-ic"><i class="bi bi-person-vcard"></i></span> About ${esc(doc.name)}</h2>
      ${about}`;

    /* ---------------- booking card ---------------- */
    const anyOpen = days.some((x) => x.times.length);
    const slotUi = anyOpen
      ? `<div class="dp-days" role="tablist" aria-label="Choose a date">
           ${days.map((x, i) => {
        const diff = dayDiff(x.date);
        const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : x.date.toLocaleDateString('en-IN', { weekday: 'short' });
        const n = x.times.length;
        return `<button type="button" class="dp-day" role="tab" data-day="${i}" aria-selected="false" ${n ? '' : 'disabled'}>
                       <span class="bys-d1">${label}</span><span class="bys-d2">${x.date.getDate()} ${x.date.toLocaleDateString('en-IN', { month: 'short' })}</span>
                       <span class="bys-d3">${n ? `${n} slot${n === 1 ? '' : 's'}` : 'Full'}</span>
                     </button>`;
      }).join('')}
         </div>
         <div class="dp-times" id="dpTimes" role="tabpanel" aria-label="Choose a time"></div>
         <p class="dp-picked" id="dpPicked" hidden></p>`
      : `<div class="dp-noslots">
           <span><i class="bi bi-calendar2-x"></i></span>
           <strong>No open slots right now</strong>
           <p>New slots are added regularly. Please check back soon.</p>
         </div>`;

    $('#bookCard').innerHTML = `
      <div class="dp-book-top">
        <div class="dp-price">${inr(doc.fee)} <small>per consultation</small></div>
        <p>Video consultation · ${esc(doc.specialty)}</p>
      </div>
      <div class="dp-book-body">
        <h3 class="dp-book-title"><i class="bi bi-calendar2-week"></i> ${anyOpen ? 'Choose a slot' : 'Availability'}</h3>
        ${slotUi}
        <a class="bys-btn-brand dp-book-btn" id="bookBtn" href="${LOGIN}">${anyOpen ? 'Log in to Book' : 'Log in'} <i class="bi bi-arrow-right"></i></a>
        <p class="dp-login-note"><a href="${LOGIN}">Log in</a> or <a href="${REGISTER}">register</a> as a patient to book an appointment.</p>
      </div>`;

    if (anyOpen) {
      const timesEl = $('#dpTimes'), picked = $('#dpPicked'), bookBtn = $('#bookBtn');
      const part = (t) => (t.getHours() < 12 ? 'Morning' : t.getHours() < 17 ? 'Afternoon' : 'Evening');
      const showDay = (i) => {
        $$('.dp-day').forEach((b) => b.setAttribute('aria-selected', String(Number(b.dataset.day) === i)));
        const groups = {};
        days[i].times.forEach((t) => { (groups[part(t)] = groups[part(t)] || []).push(t); });
        timesEl.innerHTML = Object.entries(groups).map(([g, list]) => `
          <div class="dp-tgroup"><small>${g}</small>
            <div class="dp-tlist">${list.map((t) => `<button type="button" class="dp-time" data-t="${t.toISOString()}" aria-pressed="false">${fmtTime(t)}</button>`).join('')}</div>
          </div>`).join('');
        picked.hidden = true;
        bookBtn.innerHTML = 'Log in to Book <i class="bi bi-arrow-right"></i>';
      };
      $$('.dp-day').forEach((b) => b.addEventListener('click', () => showDay(Number(b.dataset.day))));
      timesEl.addEventListener('click', (e) => {
        const b = e.target.closest('.dp-time');
        if (!b) return;
        $$('.dp-time', timesEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        const t = new Date(b.dataset.t);
        picked.innerHTML = `<i class="bi bi-check-circle-fill"></i> Selected: <b>${esc(fmtSlot(t.toISOString()))}</b>`;
        picked.hidden = false;
        bookBtn.innerHTML = `Log in to Book ${esc(fmtTime(t))} <i class="bi bi-arrow-right"></i>`;
      });
      showDay(days.indexOf(firstOpen));
    }

    /* ---------------- favourite + share ---------------- */
    const favBtn = $('#favBtn');
    favBtn.addEventListener('click', () => {
      favs = store.get('bs_fav_doctors', []);
      favs = favs.includes(doc.id) ? favs.filter((f) => f !== doc.id) : favs.concat(doc.id);
      store.set('bs_fav_doctors', favs);
      const on = favs.includes(doc.id);
      favBtn.setAttribute('aria-pressed', String(on));
      favBtn.setAttribute('aria-label', `${on ? 'Remove from' : 'Save to'} favourites`);
      toast(on ? 'Saved to favourites' : 'Removed from favourites');
    });

    const shareBtn = $('#shareBtn');
    // hover / keyboard-focus tooltip explaining the share icon
    const shareTip = window.bootstrap ? new bootstrap.Tooltip(shareBtn, { customClass: 'dp-tip', trigger: 'hover focus' }) : null;
    shareBtn.addEventListener('click', async () => {
      if (shareTip) shareTip.hide();
      const data = { title: `${doc.name} – BeyondSure`, text: `Consult ${doc.name} (${doc.specialty}) on BeyondSure`, url: window.location.href };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(data.url);
        toast('Profile link copied');
      } catch (e) { if (e && e.name !== 'AbortError') toast('Could not share this link'); }
    });

    /* ---------------- similar doctors ---------------- */
    const others = DOCTORS.filter((x) => x.id !== doc.id)
      .sort((a, b) => (b.specialty === doc.specialty) - (a.specialty === doc.specialty))
      .slice(0, 3);
    $('#similarGrid').innerHTML = others.map((x, i) => {
      const nx = upcoming(x.nextSlot) ? fmtSlot(x.nextSlot) : null;
      return `
        <a class="dp-mini" href="${profileUrl(x)}" data-aos="fade-up" data-aos-delay="${i * 80}">
          <span class="fd-avatar ${x.color}" aria-hidden="true">${esc(x.initials)}</span>
          <span class="dp-mini-info">
            <strong>${esc(x.name)}</strong>
            <small>${esc(x.specialty)} · ${x.exp} yrs</small>
            <span class="dp-mini-slot ${nx ? 'bys-ok' : ''}"><i class="bi bi-calendar2${nx ? '-check' : '-x'}"></i> ${nx ? esc(nx) : 'No open slots'}</span>
          </span>
          <span class="dp-mini-fee">${inr(x.fee)}<i class="bi bi-arrow-right"></i></span>
        </a>`;
    }).join('');

    /* ---------------- mobile booking bar (optional – skipped when not in the page) ---------------- */
    const mbar = $('#mbar');
    if (mbar) {
      const mbarFee = $('#mbarFee');
      if (mbarFee) mbarFee.textContent = inr(doc.fee);
      mbar.hidden = false;
    }
  }

  /* ------------------------------------------------------------------
     TOAST
     ------------------------------------------------------------------ */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }

  /* ------------------------------------------------------------------
     SHARED SITE BEHAVIOUR
     ------------------------------------------------------------------ */
  $$('[data-marquee]').forEach((track) => {
    const once = track.dataset.marquee.split('|').map((w) => `<span>${esc(w)}<b>✱</b></span>`).join('');
    track.innerHTML = once + once + once + once;
  });

  if (window.AOS) {
    AOS.init({
      duration: 750, easing: 'ease-out-cubic', once: true, offset: 40,
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });
  }

  const header = $('#siteHeader'), toTop = $('#toTop');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-sticky', y > 160);
    toTop.classList.toggle('is-visible', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  $('#year').textContent = new Date().getFullYear();
})();
