/* Page: test-detail.html?id= – PHASE 7 test detail
   Title, category, facts, sticky price card, tabs (Overview, Parameters, Preparation,
   What affects, Who should take, FAQs), safety process, "Often booked with". */
(function () {
  const { esc, money, hours, skeleton, error, testCard, priceBlock, addBtn, errMsg, param, tag } = LT.ui;
  const url = LT.layout.url;
  const id = param('id') || 'cbc';
  const app = LT.layout.mount({ active: 'labtests', crumbs: [['Lab Tests', 'index.html'], ['Search', 'search.html'], ['Test details', '']], showCartBar: true });
  app.innerHTML = '<div class="lt-container"><div class="row g-4 mt-1"><div class="col-lg-8" data-main></div><div class="col-lg-4" data-side></div></div></div>';
  const main = app.querySelector('[data-main]'), side = app.querySelector('[data-side]');

  async function load() {
    skeleton(main, 'block', 3); skeleton(side, 'card', 1);
    try {
      const t = await LT.api.getTest(id);
      const s = LT.store.get();
      document.title = t.name + ' – BeyondSure Lab Tests';
      const crumb = document.querySelector('.lt-crumbs span[aria-current]'); if (crumb) crumb.textContent = t.short;
      const tabs = [['ov', 'Overview'], ['pa', 'Parameters (' + t.parametersList.length + ')'], ['pr', 'Preparation'], ['af', 'What affects this test'], ['wh', 'Who should take'], ['fq', 'FAQs']];
      main.innerHTML = `<div class="lt-detail-head">${tag(t.category)} ${t.centreOnly ? '<span class="lt-pill is-warn ms-1"><i class="bi bi-hospital"></i> Centre visit only</span>' : '<span class="lt-pill is-success ms-1"><i class="bi bi-house-heart"></i> Home collection</span>'}
          <h1>${esc(t.name)}</h1><p>${esc(t.description)}</p>
          ${t.centreOnly && s.mode === 'home' ? `<div class="lt-alert is-warn mt-3"><i class="bi bi-exclamation-triangle-fill"></i><div><strong>This test needs a lab centre visit.</strong> You're booking home collection right now.<div class="lt-alert-acts"><button type="button" class="btn lt-btn btn-sm" data-switch-mode="centre">Switch to Lab Centre</button></div></div></div>` : ''}
          <div class="lt-factrow">
            <div class="lt-fact"><i class="bi bi-droplet"></i><div><small>Sample type</small><b>${esc(t.sampleType)}</b></div></div>
            <div class="lt-fact"><i class="bi bi-clock-history"></i><div><small>Report in</small><b>${hours(t.tatHours)}</b></div></div>
            <div class="lt-fact"><i class="bi bi-cup-hot"></i><div><small>Fasting</small><b>${t.fastingHours ? t.fastingHours + '-12 hrs' : 'Not needed'}</b></div></div>
            <div class="lt-fact"><i class="bi bi-list-check"></i><div><small>Parameters</small><b>${t.parameters}</b></div></div>
          </div></div>
        <div class="lt-card mt-4 p-0">
          <ul class="nav lt-dtabs px-2" role="tablist">${tabs.map(([k, l], i) => `<li class="nav-item" role="presentation"><button class="nav-link ${i ? '' : 'active'}" id="tb-${k}" data-bs-toggle="tab" data-bs-target="#tp-${k}" type="button" role="tab" aria-controls="tp-${k}" aria-selected="${!i}">${l}</button></li>`).join('')}</ul>
          <div class="tab-content p-3 p-md-4">
            <div class="tab-pane fade show active" id="tp-ov" role="tabpanel" aria-labelledby="tb-ov"><p class="lt-ink">${esc(t.description)}</p><p>Doctors often order this test as part of a routine check or to investigate symptoms. Results are reviewed and signed by a qualified pathologist at the partner lab.</p>
              ${t.inPackages.length ? `<div class="lt-alert is-info mt-3"><i class="bi bi-box2-heart"></i><div>Also included in: ${t.inPackages.map((p) => `<button type="button" class="lt-linkbtn" data-pkg-open="${p.id}">${esc(p.name)}</button>`).join(', ')} – save more with a package.</div></div>` : ''}</div>
            <div class="tab-pane fade" id="tp-pa" role="tabpanel" aria-labelledby="tb-pa"><ul class="lt-checklist is-cols">${t.parametersList.map((p) => `<li><i class="bi bi-check-circle-fill"></i>${esc(p)}</li>`).join('')}</ul></div>
            <div class="tab-pane fade" id="tp-pr" role="tabpanel" aria-labelledby="tb-pr"><div class="lt-alert ${t.fastingHours ? 'is-warn' : 'is-success'}"><i class="bi bi-${t.fastingHours ? 'cup-hot' : 'emoji-smile'}"></i><div><strong>${t.fastingHours ? 'Fasting needed' : 'No fasting needed'}</strong><br>${esc(t.preparation)}</div></div>
              <ul class="lt-checklist mt-3"><li><i class="bi bi-check-circle-fill"></i>Drink plenty of water unless told otherwise.</li><li><i class="bi bi-check-circle-fill"></i>Wear a loose-sleeved top for easy collection.</li><li><i class="bi bi-check-circle-fill"></i>Tell the technician about any medicines you take.</li></ul></div>
            <div class="tab-pane fade" id="tp-af" role="tabpanel" aria-labelledby="tb-af"><p>${esc(t.affects)}</p><p class="mb-0">Avoid heavy exercise and alcohol for 24 hours before the test for the most accurate result.</p></div>
            <div class="tab-pane fade" id="tp-wh" role="tabpanel" aria-labelledby="tb-wh"><p class="mb-0">${esc(t.whoShouldTake)}</p>${t.genderRule !== 'all' ? `<p class="mt-2 mb-0"><span class="lt-pill is-primary"><i class="bi bi-gender-${t.genderRule}"></i> Only for ${t.genderRule === 'male' ? 'men' : 'women'}</span></p>` : ''}</div>
            <div class="tab-pane fade" id="tp-fq" role="tabpanel" aria-labelledby="tb-fq"><div class="accordion lt-faq" id="ltTf">${t.faqs.map((f, i) => `<div class="accordion-item"><h3 class="accordion-header"><button class="accordion-button ${i ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#tf${i}" aria-expanded="${!i}">${esc(f.q)}</button></h3><div id="tf${i}" class="accordion-collapse collapse ${i ? '' : 'show'}" data-bs-parent="#ltTf"><div class="accordion-body">${esc(f.a)}</div></div></div>`).join('')}</div></div>
          </div></div>
        <section class="lt-card mt-4"><div class="lt-card-title"><h2><i class="bi bi-shield-check"></i> Home collection &amp; safety process</h2></div>
          <div class="lt-safety"><div><i class="bi bi-person-badge"></i><b>Certified technician</b><small>Background-verified</small></div><div><i class="bi bi-box-seam"></i><b>Sealed single-use kit</b><small>Opened in front of you</small></div><div><i class="bi bi-thermometer-snow"></i><b>Cold-chain transport</b><small>Sample stays stable</small></div><div><i class="bi bi-file-earmark-lock"></i><b>Secure digital report</b><small>OTP-protected sharing</small></div></div></section>
        <section class="mt-4"><div class="lt-section-head"><h2 class="h4">Often booked with</h2></div><div class="lt-grid">${t.related.map((r) => testCard(r)).join('')}</div></section>`;
      side.innerHTML = `<div class="lt-card lt-pricecard"><small class="fw-bold">Price at labs near ${esc(s.location.pincode)}</small>
          <div class="mt-1">${priceBlock(t.fromPrice, t.mrp, { from: true })}</div>
          <p class="small mt-2 mb-3"><i class="bi bi-info-circle text-primary"></i> Price varies by lab: <b class="lt-ink">${money(t.priceRange.min)} - ${money(t.priceRange.max)}</b> across ${t.labCount} lab${t.labCount === 1 ? '' : 's'}.</p>
          <div class="lt-pc-acts">${addBtn(t.id, { block: true }).replace('btn lt-add', 'btn lt-add lt-btn-lg')}
            <a class="btn lt-btn lt-btn-lg" href="${url('cart.html')}">Go to cart <i class="bi bi-arrow-right"></i></a></div>
          <ul class="lt-checklist mt-3 small"><li><i class="bi bi-check-circle-fill"></i>Free home collection on most labs</li><li><i class="bi bi-check-circle-fill"></i>NABL-accredited partner labs</li><li><i class="bi bi-check-circle-fill"></i>Free cancellation up to 12 hrs before</li></ul></div>`;
      LT.layout.syncAddButtons();
    } catch (e) { error(main, { text: errMsg(e), onRetry: load }); side.innerHTML = ''; }
  }
  load();
})();
