/* Page: packages.html – PHASE 7 packages
   Life-stage filter chips, package cards, detail drawer (?open=id), duplicate rule on add
   (handled globally in layout.js: "CBC is already included in this package…"). */
(function () {
  const { esc, skeleton, empty, error, packageCard, errMsg, param } = LT.ui;
  const url = LT.layout.url;
  const app = LT.layout.mount({ active: 'packages', crumbs: [['Lab Tests', 'index.html'], ['Health packages', '']], showCartBar: true });
  let stage = param('stage') || 'all';

  app.innerHTML = `<div class="lt-container">
    <div class="lt-band mt-3"><div class="row align-items-center g-3"><div class="col-lg-8"><span class="lt-eyebrow" style="color:#8fb1ff">Health checkups</span><h1 class="h2 fw-bold text-white">Full body checkups for every life stage</h1><p class="mb-0">Packages bundle the right tests at up to 55% less than booking them one by one.</p></div>
      <div class="col-lg-4 text-lg-end"><a class="btn lt-btn-light" href="${url('search.html')}"><i class="bi bi-search"></i> Prefer single tests?</a></div></div></div>
    <div class="lt-chiprow mt-4 mb-3" data-stages role="group" aria-label="Life stage"></div>
    <div class="lt-grid" data-list></div>
    <div class="lt-alert is-info mt-4"><i class="bi bi-lightbulb"></i><div><strong>Tip:</strong> if a test in your cart is already part of a package you add, we'll offer to remove it so you don't pay twice.</div></div>
  </div>`;
  const $ = (q) => app.querySelector(q);

  LT.api.getLifeStages().then((list) => {
    const paint = () => { $('[data-stages]').innerHTML = list.map((l) => `<button type="button" class="lt-chip" data-stage="${l.key}" aria-pressed="${l.key === stage}">${esc(l.label)}</button>`).join(''); };
    paint();
    $('[data-stages]').onclick = (e) => { const b = e.target.closest('[data-stage]'); if (!b) return; stage = b.dataset.stage; paint(); history.replaceState(null, '', 'packages.html' + (stage !== 'all' ? '?stage=' + stage : '')); load(); };
  });

  async function load() {
    const box = $('[data-list]');
    skeleton(box, 'card', 6);
    try {
      const list = await LT.api.getPackages({ lifeStage: stage });
      if (!list.length) return empty(box, { icon: 'search', title: 'No packages for this group yet', text: 'Try another life stage or browse single tests.', actions: [{ label: 'Show all', onClick: () => $('[data-stage="all"]').click() }] });
      box.innerHTML = list.map((p) => packageCard(p)).join('');
      box.removeAttribute('aria-busy');
      LT.layout.syncAddButtons();
    } catch (e) { error(box, { text: errMsg(e), onRetry: load }); }
  }
  load();
  if (param('open')) setTimeout(() => LT.layout.packageDrawer(param('open')), 300);
})();
