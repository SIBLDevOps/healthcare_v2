/* BeyondSure – website scripts */
(function () {
  'use strict';

  const BASE = 'https://teleconsult.bysure.in';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TOOTH = '<svg class="bys-tooth" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 3C5 3 3.5 5 3.5 7.6c0 2.2 1 3.6 1.6 5.6.6 2 .8 4.9 1.7 6.6.5.9 1.4 1 1.9.2.6-1 .9-3.6 1.4-4.9.3-.8.7-1.1 1.9-1.1s1.6.3 1.9 1.1c.5 1.3.8 3.9 1.4 4.9.5.8 1.4.7 1.9-.2.9-1.7 1.1-4.6 1.7-6.6.6-2 1.6-3.4 1.6-5.6C20.5 5 19 3 16.5 3c-1.9 0-2.9 1-4.5 1S9.4 3 7.5 3z"/></svg>';

  /* ------------------------------------------------------------------
     CONTENT (BeyondSure home page)
     ------------------------------------------------------------------ */
  const specialties = [
    ['Ayurveda', 'flower1'], ['Cardiologist', 'heart-pulse'], ['Dermatologist', 'brightness-high'],
    ['Diabetologist', 'droplet-half'], ['Endocrinologist', 'activity'], ['ENT Specialist', 'ear'],
    ['Gastroenterologist', 'capsule'], ['General Physician', 'person-badge'], ['General Surgeon', 'bandaid'],
    ['Gynaecologist', 'gender-female'], ['Nephrologist', 'droplet'], ['Neurologist', 'lightning-charge'],
    ['Nutritionist', 'apple'], ['Oncologist', 'shield-plus'], ['Ophthalmologist', 'eye'],
    ['Orthopedician', 'person-walking'], ['Paediatrician', 'balloon-heart'], ['Physiotherapist', 'person-arms-up'],
    ['Plastic Surgeon', 'stars'], ['Psychiatrist', 'chat-heart'], ['Psychologist', 'chat-square-heart'],
    ['Pulmonologist', 'lungs'], ['Rheumatologist', 'hand-index'], ['Urologist', 'clipboard2-pulse']
  ];

  const doctors = [
    { name: 'Dr. Vikrant Shinde', specialty: 'Ayurveda', exp: 10, fee: 500, id: '8R34mb09ybbqHsKkwSf52Q' },
    { name: 'Dr. Tejaswi K', specialty: 'ENT Specialist', exp: 10, fee: 450, id: 'KwZZqKPsWZ75N4nfQsD3Dw' }
  ];
  const doctorFeatures = [
    { icon: 'camera-video', title: 'Consult On Video', text: 'Join from any browser, no installs.' },
    { icon: 'file-earmark-medical', title: 'Digital Prescriptions', text: 'Your e-prescription arrives as a PDF.' }
  ];

  const services = [
    { icon: 'bi-camera-video', title: 'Teleconsultation', live: true, href: 'doctor/find-doctor.html', link: 'Consult Doctor', text: 'Certified doctors available for video consultations, prescriptions, and second opinions.' },
    { icon: 'bi-eyedropper', title: 'Diagnostic Lab Tests', live: true, href: 'lab-tests/index.html', link: 'Book Lab Test', text: '500+ diagnostic tests & full body checkups with certified home sample collection.' },
    { icon: 'bi-capsule-pill', title: 'Medicine Delivery', live: true, href: 'medicines/index.html', link: 'Order Medicines', text: 'Order medicines online with prescription upload, genuine discounts, and 2-hr express delivery.' },
    { icon: 'tooth', title: 'Dental Care', live: true, href: 'dental/index.html', link: 'Explore Dental', text: 'Cashless dental consultations, cleanings, RCT, and treatments across 500+ clinics.' },
    { icon: 'bi-bicycle', title: 'Cult.fit Fitness Pass', live: true, href: 'fitness/index.html', link: 'Get Cult Pass', text: 'Unlimited access to 600+ Cult centres, gyms, HRX, boxing, yoga, and elite group workouts.' },
    { icon: 'bi-bag-heart', title: 'Health & Wellness Shop', live: true, href: 'shop/shop.html', link: 'Visit Shop', text: 'Curated wellness essentials, monitors, ayurvedic formulations, and fitness nutrition.' },
    { icon: 'bi-hospital', title: 'OPD at Hospitals', live: false, text: 'Cashless outpatient visits at partnered hospitals and multi-specialty clinics.' },
    { icon: 'bi-chat-heart', title: 'Mental Wellness', live: false, text: 'Counselling, 1-on-1 therapy sessions, mindfulness routines, and emotional wellbeing.' }
  ];

  const steps = [
    ['person-plus', 'Create Your Account', 'Sign up as a patient in under a minute — just your name, email, and mobile.'],
    ['person-check', 'Choose Your Doctor', 'Filter by specialty, fee, experience, or language and pick a slot that suits you.'],
    ['credit-card-2-front', 'Pay Securely', 'UPI, cards, net banking, or wallets — powered by Razorpay.'],
    ['camera-video', 'Consult On Video', 'Join from any browser, no installs. Your e-prescription arrives as a PDF.']
  ];

  // Dummy FAQ content – replace with final answers before going live
  const faqs = [
    { q: 'How do I book a video consultation?', a: 'Create your account, choose a doctor by specialty, fee, experience or language, pick a slot that suits you and pay securely. You join the call from any browser — no installs.' },
    { q: 'Will I get a prescription after my consultation?', a: 'Yes. When your doctor prescribes medicines, your e-prescription arrives as a PDF that you can download, share, or use to order medicines through BeyondSure.' },
    { q: 'Which payment methods can I use?', a: 'You can pay with UPI, credit or debit cards, net banking, or wallets. All payments are processed securely by Razorpay.' },
    { q: 'What does the membership include?', a: 'Teleconsultation, dental care, fitness access, travel insurance and medicine delivery are live today. OPD at hospitals, diagnostic labs and mental wellness are coming soon.' },
    { q: 'Can I consult a doctor in my language?', a: 'Yes. When you choose your doctor, filter by language to see the doctors who can consult with you in the language you are most comfortable with.' }
  ];

  const tips = [
    'Spotting a pattern is easier when you are not rushing it. The same is true of most things worth noticing.',
    'Breathe in for four counts, hold for four, and breathe out for six. Repeat three times.',
    'Stand up, roll your shoulders back five times, and drink a glass of water.',
    'Name three things you can see, two you can hear, and one you can feel right now.',
    'Step away from your screen for two minutes and look at something far away.'
  ];

  /* ------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------ */
  // Big moving text (duplicated for a seamless loop)
  $$('[data-marquee]').forEach((track) => {
    const once = track.dataset.marquee.split('|').map((w) => `<span>${esc(w)}<b>✱</b></span>`).join('');
    track.innerHTML = once + once + once + once;
  });

  // Specialty items (icon + name) in two moving rows
  const chips = (list) => {
    const once = list.map(([name, icon]) =>
      `<a class="bys-spec-item" href="doctor/find-doctor.html?specialty=${name.toLowerCase().replace(/\s+/g, '-')}"><i class="bi bi-${icon}"></i>${esc(name)}</a>`).join('');
    return once + once;
  };
  $('#specRow1').innerHTML = chips(specialties.slice(0, 12));
  $('#specRow2').innerHTML = chips(specialties.slice(12));

  // Doctors icon list
  $('#doctorList').innerHTML =
    doctors.map((d, i) => `
      <div class="bys-icon-box" data-aos="fade-up" data-aos-delay="${i * 100}">
        <span class="bys-icon-circle">${esc(d.name.replace(/^Dr\.\s*/, '').charAt(0))}</span>
        <div>
          <h4><a href="${BASE}/doctors/${d.id}">${esc(d.name)}</a></h4>
          <p class="bys-desc">${esc(d.specialty)} · ${d.exp} yrs experience · <span class="bys-fee">Rs. ${d.fee.toFixed(2)} / consultation</span></p>
        </div>
      </div>`).join('') +
    doctorFeatures.map((f, i) => `
      <div class="bys-icon-box" data-aos="fade-up" data-aos-delay="${(i + 2) * 100}">
        <span class="bys-icon-circle"><i class="bi bi-${f.icon}"></i></span>
        <div><h4>${esc(f.title)}</h4><p class="bys-desc">${esc(f.text)}</p></div>
      </div>`).join('');

  // Service cards
  $('#serviceGrid').innerHTML = services.map((s, i) => {
    const icon = s.icon === 'tooth' ? TOOTH : `<i class="bi ${s.icon}"></i>`;
    const status = s.live ? '<span class="bys-status bys-live">Live</span>' : '<span class="bys-status bys-soon">Coming Soon</span>';
    const link = s.href
      ? `<span class="bys-svc-link">${esc(s.link)} <i class="bi bi-arrow-right"></i></span>`
      : `<span class="bys-svc-link bys-plain">${s.live ? 'Included In Membership' : 'Launching Soon'}</span>`;
    const inner = `<div class="bys-top"><span class="bys-svc-icon">${icon}</span>${status}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${link}`;
    const cardHref = s.href ? (s.href.startsWith('http') ? s.href : (s.href.startsWith('/') ? `${BASE}${s.href}` : s.href)) : null;
    return `<div class="col-sm-6 col-xl-3 bys-svc-col" data-status="${s.live ? 'live' : 'soon'}" data-aos="fade-up" data-aos-delay="${(i % 4) * 80}">
      ${cardHref ? `<a class="bys-svc-card" href="${cardHref}">${inner}</a>` : `<div class="bys-svc-card">${inner}</div>`}
    </div>`;
  }).join('');

  // Steps with gradient counters
  $('#stepGrid').innerHTML = steps.map(([icon, t, p], i) => `
    <div class="col-sm-6 col-lg-3" data-aos="fade-up" data-aos-delay="${i * 100}">
      <div class="bys-step">
        <span class="bys-step-ico"><i class="bi bi-${icon}"></i></span>
        <div class="bys-num" data-count="${i + 1}">0${i + 1}</div>
        <h5>${esc(t)}</h5>
        <p>${esc(p)}</p>
      </div>
    </div>`).join('');

  // FAQ – two accordion columns, first item of each column open
  const faqItem = (f, i, col, open) => `
    <div class="bys-faq-item">
      <button class="bys-faq-q" type="button" data-bs-toggle="collapse" data-bs-target="#faq${i}" aria-expanded="${open}" aria-controls="faq${i}">${esc(f.q)}<span class="bys-faq-ic" aria-hidden="true"></span></button>
      <div id="faq${i}" class="collapse${open ? ' show' : ''}" data-bs-parent="#${col}"><p class="bys-faq-a">${esc(f.a)}</p></div>
    </div>`;
  const half = Math.ceil(faqs.length / 2);
  const faqCol = (list, offset, id, delay) =>
    `<div class="col-lg-6" data-aos="fade-up" data-aos-delay="${delay}"><div id="${id}">${list.map((f, j) => faqItem(f, offset + j, id, false)).join('')}</div></div>`;
  $('#faqList').innerHTML = `<div class="row g-3 g-lg-4 align-items-start">${faqCol(faqs.slice(0, half), 0, 'faqColA', 0)}${faqCol(faqs.slice(half), half, 'faqColB', 120)}</div>`;

  /* ------------------------------------------------------------------
     AOS – initialise after content is rendered
     ------------------------------------------------------------------ */
  if (window.AOS) {
    AOS.init({ duration: 750, easing: 'ease-out-cubic', once: true, offset: 60,
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches });
  }

  /* ------------------------------------------------------------------
     INTERACTIONS
     ------------------------------------------------------------------ */
  // Service filter
  const tabs = $$('.bys-filter-tabs button');
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    const f = tab.dataset.filter;
    tabs.forEach((t) => { t.classList.toggle('is-active', t === tab); t.setAttribute('aria-selected', t === tab); });
    $$('#serviceGrid .bys-svc-col').forEach((col) => {
      const show = f === 'all' || col.dataset.status === f;
      col.classList.toggle('is-hidden', !show);
      if (show) col.classList.add('aos-animate');
    });
    if (window.AOS) AOS.refresh();
  }));

  // Wellness tip
  $('#tipBtn').addEventListener('click', () => {
    const text = $('#tipText');
    text.textContent = tips[Math.floor(Math.random() * tips.length)];
    text.classList.remove('bys-muted');
    $('#tipCta').innerHTML = `<a class="bys-mind-more" href="${BASE}/patient/mind-gym">More in Mind Gym →</a>`;
  });

  // Contact form
  const form = $('#contactForm');
  const status = $('#formStatus');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach((f) => { const v = f.checkValidity(); f.classList.toggle('bys-invalid', !v); if (!v) ok = false; });
    if (!ok) { status.textContent = 'Please fill in your name, a valid email and your message.'; status.classList.add('bys-err'); return; }
    const btn = $('#sendBtn');
    btn.disabled = true; status.classList.remove('bys-err'); status.textContent = 'Sending…';
    // TODO: connect to the backend endpoint, e.g. fetch('/contact', { method: 'POST', body: new FormData(form) })
    setTimeout(() => { btn.disabled = false; form.reset(); status.textContent = 'Thanks! Your message has been sent. We will get back to you soon.'; }, 700);
  });
  $$('[required]', form).forEach((f) => f.addEventListener('input', () => f.classList.remove('bys-invalid')));

  // Sticky header, active menu link, back to top
  const header = $('#siteHeader');
  const toTop = $('#toTop');
  const menuLinks = $$('.bys-menu-pill a[href^="#"]');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-sticky', y > 160);
    toTop.classList.toggle('is-visible', y > 600);
    let current = null;
    menuLinks.forEach((a) => { const sec = $(a.getAttribute('href')); if (sec && sec.getBoundingClientRect().top <= 140) current = a; });
    menuLinks.forEach((a) => a.classList.toggle('is-active', a === current));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Phone menu: a link to a section on this page (e.g. #services) first closes the menu,
  // then scrolls once the menu has fully closed (while it is open the page cannot scroll).
  // Links to other pages are left to open normally.
  const mobileMenu = $('#mobileMenu');
  if (mobileMenu && window.bootstrap) {
    mobileMenu.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (!url.hash || url.pathname !== window.location.pathname) return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      mobileMenu.addEventListener('hidden.bs.offcanvas', () => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try { history.pushState(null, '', url.hash); } catch (err) { /* ignore */ }
      }, { once: true });
      bootstrap.Offcanvas.getOrCreateInstance(mobileMenu).hide();
    });
  }

  // Step numbers count up when they come into view
  const pad = (n) => String(n).padStart(2, '0');
  const countUp = (el) => {
    const to = Number(el.dataset.count) || 0, loops = 10;
    let i = 0;
    el.textContent = pad(0);
    const timer = setInterval(() => {
      i += 1;
      el.textContent = pad(Math.round((to / loops) * i));
      if (i >= loops) { clearInterval(timer); el.textContent = pad(to); }
    }, 100);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { countUp(en.target); io.unobserve(en.target); }
    }), { threshold: 0.5 });
    $$('.bys-step .bys-num[data-count]').forEach((n) => io.observe(n));
  }

  $('#year').textContent = new Date().getFullYear();
})();
