/* Lab Tests – MOCK API.
   Every LT.api.* call returns a Promise resolved after 400-700 ms (LT.api._delay).
   Pages must use ONLY these functions (never LT.data / LT.db directly) so we can
   later swap each body for a fetch() call with the same name + return shape.
   Debug: LT.api.failNext = true  -> the next call rejects (to show error states). */
window.LT = window.LT || {};

(function () {
  const D = () => LT.data, S = () => LT.store.get(), P = () => LT.pricing, M = () => LT.matching;
  const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
  const uid = (p) => p + Math.random().toString(36).slice(2, 8).toUpperCase();
  const fail = (msg) => { const e = new Error(msg); e.userMessage = msg; throw e; };
  const HOUR = 3600e3;

  /* ---------- helpers (server side in the future) ---------- */
  const allLabs = () => {
    const st = LT.db.obj('labsStatus');
    return D().labs.concat(LT.db.all('customLabs')).map((l) => Object.assign({}, l, { status: st[l.id] || l.status }));
  };
  const labById = (id) => allLabs().find((l) => l.id === id) || null;
  const testName = (id) => (P().item(id) || {}).name || id;
  /* report PDFs: labs share one PDF per test (r.files from the real API wins). Demo: derived from the
     parameter groups, which follow the order of r.tests; otherwise one combined PDF. */
  function reportFiles(r) {
    if (Array.isArray(r.files) && r.files.length && r.files[0].type) return r.files;
    const groups = [...new Set(r.parameters.map((p) => p.group))], perTest = groups.length === r.tests.length;
    const list = perTest ? r.tests.map((t, i) => ({ id: r.id + '-' + t, test: t, name: testName(t), short: (P().item(t) || {}).short || testName(t), group: groups[i] }))
      : [{ id: r.id + '-all', test: null, name: r.tests.map(testName).join(', '), short: 'Full', group: null }];
    return list.map((f) => {
      const ps = r.parameters.filter((p) => !f.group || p.group === f.group);
      return Object.assign(f, { type: 'pdf', pages: 1, params: ps.length, uploadedAt: r.date,
        abnormal: ps.filter((p) => p.status === 'abnormal').length, borderline: ps.filter((p) => p.status === 'borderline').length });
    });
  }
  const memberById = (id) => LT.db.find('members', id);
  /* records belong to the logged-in account (a fresh user starts with no bookings / requests) */
  const ownerOf = (memberId) => (memberById(memberId) || {}).owner;
  const mine = (b) => (b.owner || ownerOf(((b.members || [])[0] || {}).memberId)) === S().user.mobile;
  const mineRx = (r) => (r.owner || ownerOf(r.memberId) || D().demoUser.mobile) === S().user.mobile;
  const slotLabel = (iso) => {
    const d = new Date(iso), t = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    const day = new Date(); day.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - day) / 864e5);
    return (diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })) + ', ' + t;
  };
  const isoDay = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); const z = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); };

  /* labs that can serve this pincode + mode */
  function servingLabs(pincode, mode) {
    return allLabs().filter((l) => l.status === 'active' && (!pincode || l.serviceablePincodes.includes(pincode)) &&
      (mode === 'centre' ? l.centres && l.centres.length : mode === 'home' ? l.homeCollection : true));
  }
  function fromPrice(id, labs) {
    const prices = labs.filter((l) => P().offers(l, id)).map((l) => P().labPrice(l, id));
    const base = P().item(id).price;
    return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: base, max: base };
  }
  function decorate(it, labs) {
    if (!it) return null;
    const range = fromPrice(it.id, labs);
    const o = clone(it);
    o.type = P().isPackage(it.id) ? 'package' : 'test';
    o.fromPrice = range.min; o.priceRange = range;
    o.savePct = it.mrp > range.min ? Math.round(((it.mrp - range.min) / it.mrp) * 100) : 0;
    if (o.type === 'package') {
      o.testsDetail = it.tests.map((t) => ({ id: t, name: testName(t), short: P().item(t).short }));
      o.centreOnly = false; o.homeAvailable = true; o.category = 'Health Package';
    }
    return o;
  }
  const ctxLabs = () => { const s = S(); return servingLabs(s.location.pincode, s.mode); };

  function earliest(lab, mode, members) {
    for (let i = 0; i < 7; i++) {
      const s = D().makeSlots(lab.id, isoDay(i), mode, members).find((x) => x.state === 'available' || x.state === 'fast');
      if (s) return { start: s.start, label: slotLabel(s.start), mins: Math.round((new Date(s.start) - Date.now()) / 60000) };
    }
    return { start: null, label: 'No slots this week', mins: 99999 };
  }

  function labView(lab, ctx) {
    const q = P().labQuote(lab, ctx.cart, ctx.assignments, ctx.memberIds, ctx.mode);
    const centres = (lab.centres || []).slice().sort((a, b) => a.distanceKm - b.distanceKm);
    const e = earliest(lab, ctx.mode, Math.max(1, (ctx.memberIds || []).length));
    return {
      id: lab.id, name: lab.name, initials: lab.initials, color: lab.color, badges: lab.badges, rating: lab.rating, reviews: lab.reviews,
      homeCollection: lab.homeCollection, collectionCharge: lab.collectionCharge, freeAbove: lab.freeAbove, phone: lab.phone,
      cancellationPolicy: lab.cancellationPolicy, about: lab.about, centres, nearestCentre: centres[0] || null,
      distanceKm: centres[0] ? centres[0].distanceKm : 99, openNow: centres[0] ? centres[0].openNow : false,
      quote: q, missingTests: q.missingTests.map((id) => ({ id, name: testName(id) })), coverage: q.missingTests.length ? 'partial' : 'full',
      earliestSlot: e, earliestMins: e.mins, accredited: lab.badges.some((b) => b === 'NABL' || b === 'CAP')
    };
  }
  function eligible(cart, memberIds, assignments, mode, pincode) {
    const ctx = { cart, memberIds, assignments, mode };
    let list = servingLabs(pincode, mode).map((l) => labView(l, ctx)).filter((v) => v.quote.perMember.some((u) => u.items.length));
    list = M().rankLabs(list, 'value', mode);
    if (list.length) {
      const full = list.filter((l) => l.coverage === 'full');
      const cheapest = Math.min(...(full.length ? full : list).map((l) => l.quote.total));
      const fastest = Math.min(...list.map((l) => l.quote.tatHours));
      const topRated = Math.max(...list.map((l) => l.rating));
      list.forEach((l) => {
        l.deltaVsCheapest = l.quote.total - cheapest;
        l.tags = [];
        if (l.coverage === 'full' && l.quote.total === cheapest) l.tags.push('Lowest price');
        if (l.quote.tatHours === fastest) l.tags.push('Fastest report');
        if (l.rating === topRated) l.tags.push('Top rated');
      });
    }
    return list;
  }

  /* ---------- bookings ---------- */
  const TIMELINE = {
    home: [
      ['BOOKED', 'Booked', 'Booking placed and payment received'], ['CONFIRMED', 'Confirmed by lab', 'The lab has accepted your booking'],
      ['TECH_ASSIGNED', 'Technician assigned', 'A certified phlebotomist will collect your sample'], ['ON_THE_WAY', 'On the way', 'Technician is heading to your address'],
      ['SAMPLE_COLLECTED', 'Sample collected', 'Samples sealed in a single-use kit'], ['RECEIVED', 'Sample received at lab', 'Cold-chain delivered to the lab'],
      ['PROCESSING', 'Processing', 'Tests are running on automated analysers'], ['REPORT_READY', 'Report ready', 'Reviewed and signed by a pathologist']],
    centre: [
      ['BOOKED', 'Booked', 'Booking placed and payment received'], ['CONFIRMED', 'Confirmed by lab', 'The centre is expecting you'],
      ['VISIT_DONE', 'Lab visit done', 'Samples / scans taken at the centre'], ['RECEIVED', 'Sample received at lab', 'Samples logged in the lab system'],
      ['PROCESSING', 'Processing', 'Tests are running'], ['REPORT_READY', 'Report ready', 'Reviewed and signed by a doctor']]
  };
  function stepTime(b, i, n) {
    const c = new Date(b.createdAt).getTime(), s = new Date(b.slot.start).getTime();
    const home = [c, c + 20 * 6e4, s - 2 * HOUR, s - 30 * 6e4, s + 10 * 6e4, s + 2 * HOUR, s + 3 * HOUR, s + 10 * HOUR];
    const centre = [c, c + 20 * 6e4, s + 20 * 6e4, s + 2 * HOUR, s + 3 * HOUR, s + 10 * HOUR];
    return new Date((n === 8 ? home : centre)[i]).toISOString();
  }
  function normalizeBooking(b) {
    const lab = labById(b.labId);
    const assignments = {}; b.members.forEach((m) => { assignments[m.memberId] = m.tests; });
    const cart = [...new Set(b.members.flatMap((m) => m.tests))].map((id) => ({ id }));
    if (!b.bill && lab) {
      const bill = P().bill({ lab, cart, assignments, memberIds: b.members.map((m) => m.memberId), mode: b.mode, couponCode: b.coupon, firstBooking: false });
      b.bill = { mrp: bill.mrp, discount: bill.labDiscount, coupon: bill.coupon, couponCode: bill.couponCode, collection: bill.collection, total: bill.total, saved: bill.saved };
      b.members.forEach((m) => { const pm = bill.perMember.find((x) => x.memberId === m.memberId); m.subtotal = pm ? pm.price : 0; });
      LT.db.upsert('bookings', b);
    }
    const steps = TIMELINE[b.mode];
    const reports = LT.db.all('reports').filter((r) => r.bookingId === b.id);
    const hoursToSlot = (new Date(b.slot.start) - Date.now()) / HOUR;
    const v = clone(b);
    v.lab = lab ? { id: lab.id, name: lab.name, initials: lab.initials, color: lab.color, badges: lab.badges, phone: lab.phone, rating: lab.rating, centres: lab.centres } : null;
    v.centre = b.centreId && lab ? lab.centres.find((c) => c.id === b.centreId) : null;
    v.address = b.addressId ? LT.db.find('addresses', b.addressId) : null;
    v.timeline = steps.map((s, i) => ({ step: s[0], title: s[1], text: s[2], done: b.status !== 'CANCELLED' && i <= b.stage, current: b.status !== 'CANCELLED' && i === b.stage, time: i <= b.stage ? stepTime(b, i, steps.length) : null }));
    v.membersView = b.members.map((m) => {
      const mem = memberById(m.memberId) || { name: 'Member', relationship: '' };
      const rep = reports.find((r) => r.memberId === m.memberId);
      return { memberId: m.memberId, name: mem.name, relationship: mem.relationship, gender: mem.gender, tests: m.tests.map((t) => ({ id: t, name: testName(t), fastingHours: P().item(t).fastingHours, price: lab ? P().labPrice(lab, t) : (P().item(t) || {}).price || 0 })), subtotal: m.subtotal || 0, reportId: rep ? rep.id : null, reportStatus: rep ? 'ready' : b.status === 'CANCELLED' ? 'cancelled' : 'pending' };
    });
    v.slotLabel = slotLabel(b.slot.start);
    v.hoursToSlot = hoursToSlot;
    v.isUpcoming = !['REPORT_READY', 'COMPLETED', 'CANCELLED'].includes(b.status);
    v.canChange = v.isUpcoming && b.stage <= 2 && hoursToSlot > 2;
    v.refundPct = hoursToSlot > 12 ? 100 : hoursToSlot > 2 ? 50 : 0;
    v.fastingHours = Math.max(0, ...cart.map((c) => P().testsOf(c.id).map((t) => P().item(t).fastingHours)).flat());
    v.review = LT.db.all('reviews').find((r) => r.bookingId === b.id) || null;
    v.requests = LT.db.all('requests').filter((r) => r.bookingId === b.id).map((r) => ({ id: r.id, thumbnail: r.thumbnail, doctor: r.doctor }));
    return v;
  }
  function makeReport(b, m) {
    const params = m.tests.flatMap((t) => P().testsOf(t)).flatMap((tid) => {
      const t = P().item(tid);
      return t.parametersList.slice(0, 3).map((p) => ({ group: t.name, name: p, value: 'Within limits', unit: '', low: null, high: null, status: 'normal' }));
    });
    return { id: uid('r-'), bookingId: b.id, memberId: m.memberId, labId: b.labId, date: new Date().toISOString(), status: 'ready', tests: m.tests,
      summary: 'All tested values are within the reference range. Keep up your healthy routine.', parameters: params };
  }

  /* ---------- raw implementations ---------- */
  const R = {
    /* Location */
    searchLocations(q) {
      q = String(q || '').trim().toLowerCase();
      if (q.length < 2) return [];
      return D().cities.flatMap((c) => c.areas.map((a) => ({ city: c.city, area: a.area, pincode: a.pincode, lat: a.lat, lng: a.lng })))
        .filter((x) => (x.city + ' ' + x.area + ' ' + x.pincode).toLowerCase().includes(q)).slice(0, 8);
    },
    getCities() { return D().cities.map((c) => ({ city: c.city, icon: c.icon, areas: c.areas })); },
    checkServiceability(pincode) {
      if (!/^[1-9]\d{5}$/.test(String(pincode))) fail('Enter a valid 6-digit pincode.');
      const s = D().serviceability[pincode] || { home: false, lab: false };
      const homeLabs = s.home ? servingLabs(pincode, 'home') : [], centreLabs = s.lab ? servingLabs(pincode, 'centre') : [];
      const e = homeLabs.length ? homeLabs.map((l) => earliest(l, 'home', 1)).sort((a, b) => a.mins - b.mins)[0] : null;
      return { pincode, home: s.home && homeLabs.length > 0, lab: s.lab && centreLabs.length > 0, labCount: new Set(homeLabs.concat(centreLabs).map((l) => l.id)).size,
        homeLabCount: homeLabs.length, centreLabCount: centreLabs.length, earliestHome: e ? e.label : null };
    },
    reverseGeocode() { return { city: 'Pune', area: 'Wakad', pincode: '411057', lat: 18.5975, lng: 73.7707 }; },
    notifyMe(contact, pincode) { const n = LT.db.all('notify'); n.push({ contact, pincode, at: new Date().toISOString() }); LT.db.save('notify', n); return { ok: true }; },

    /* Catalogue */
    getCategories() { return { categories: D().categories, chips: D().chips }; },
    suggestTests(q) {
      q = String(q || '').trim().toLowerCase();
      if (q.length < 2) return { terms: [], items: [] };
      const words = ['blood test', 'blood sugar', 'blood group', 'blood count', 'thyroid', 'vitamin d', 'vitamin b12', 'diabetes', 'cholesterol', 'liver', 'kidney', 'fever', 'pregnancy', 'x-ray', 'ultrasound', 'full body checkup', 'heart'];
      const terms = words.filter((w) => w.includes(q)).slice(0, 4);
      const labs = ctxLabs();
      const items = D().tests.concat(D().packages).filter((t) => (t.name + ' ' + (t.short || '') + ' ' + (t.tags || []).join(' ')).toLowerCase().includes(q))
        .sort((a, b) => b.popularity - a.popularity).slice(0, 6).map((t) => decorate(t, labs));
      return { terms, items };
    },
    searchTests(params) {
      params = params || {};
      const labs = ctxLabs();
      const SYN = { sugar: 'diabetes', cholesterol: 'lipid', fever: 'infection', 'full body': 'pkg', pregnancy: 'bhcg', 'blood group': 'blood' };
      let q = String(params.q || '').trim().toLowerCase();
      let list = D().tests.map((t) => decorate(t, labs));
      if (q) {
        const alt = Object.keys(SYN).find((k) => q.includes(k));
        list = list.filter((t) => {
          const hay = (t.name + ' ' + t.short + ' ' + t.category + ' ' + t.tags.join(' ') + ' ' + t.description + ' ' + t.parametersList.join(' ')).toLowerCase();
          return hay.includes(q) || q.split(/\s+/).every((w) => hay.includes(w)) || (alt && hay.includes(SYN[alt]));
        });
      }
      const cats = [].concat(params.category || []).filter((c) => c && c !== 'all');
      if (cats.length) list = list.filter((t) => cats.some((c) => t.tags.includes(c)));
      const f = params.filters || {};
      if (f.fasting === 'yes') list = list.filter((t) => t.fastingHours > 0);
      if (f.fasting === 'no') list = list.filter((t) => !t.fastingHours);
      if (f.tat && f.tat !== 'any') list = list.filter((t) => t.tatHours <= +f.tat);
      if (f.priceMax) list = list.filter((t) => t.fromPrice <= +f.priceMax);
      if (f.availability === 'home') list = list.filter((t) => t.homeAvailable);
      if (f.availability === 'centre') list = list.filter((t) => t.centreOnly);
      const sort = params.sort || 'popularity';
      list.sort((a, b) => sort === 'price_asc' ? a.fromPrice - b.fromPrice : sort === 'price_desc' ? b.fromPrice - a.fromPrice : sort === 'fastest' ? a.tatHours - b.tatHours : b.popularity - a.popularity);
      const size = params.pageSize || 12, page = params.page || 1;
      return { items: list.slice(0, page * size), total: list.length, page, pages: Math.ceil(list.length / size) || 1 };
    },
    countTests(params) { return R.searchTests(Object.assign({}, params, { page: 999 })).total; },
    getTest(id) {
      const labs = ctxLabs();
      const t = decorate(D().tests.find((x) => x.id === id), labs);
      if (!t) fail('We could not find this test.');
      t.related = D().tests.filter((x) => x.id !== id && (x.category === t.category || x.tags.some((g) => t.tags.includes(g))))
        .sort((a, b) => b.popularity - a.popularity).slice(0, 3).map((x) => decorate(x, labs));
      if (t.related.length < 3) t.related = t.related.concat(D().tests.filter((x) => x.id !== id && !t.related.some((r) => r.id === x.id)).slice(0, 3 - t.related.length).map((x) => decorate(x, labs)));
      t.labCount = labs.filter((l) => P().offers(l, id)).length;
      t.inPackages = D().packages.filter((p) => p.tests.includes(id)).map((p) => ({ id: p.id, name: p.name }));
      return t;
    },
    getPackages(params) {
      const labs = ctxLabs(), st = (params && params.lifeStage) || 'all';
      return D().packages.filter((p) => st === 'all' || p.lifeStage === st).sort((a, b) => b.popularity - a.popularity).map((p) => decorate(p, labs));
    },
    getLifeStages() { return D().lifeStages; },
    getPackage(id) { const p = D().packages.find((x) => x.id === id); if (!p) fail('Package not found.'); return decorate(p, ctxLabs()); },
    getPopular() {
      const labs = ctxLabs();
      return { tests: D().tests.slice().sort((a, b) => b.popularity - a.popularity).slice(0, 6).map((t) => decorate(t, labs)),
        packages: D().packages.slice().sort((a, b) => b.popularity - a.popularity).map((p) => decorate(p, labs)) };
    },
    getItems(ids) { const labs = ctxLabs(); return ids.map((id) => decorate(P().item(id), labs)).filter(Boolean); },

    /* Cart details (merged view for cart.html) */
    getCartDetails() {
      const s = S(), labs = ctxLabs();
      const cart = M().mergeDuplicates(s.cart);
      const items = cart.map((c) => Object.assign(decorate(P().item(c.id), labs), { sources: c.sources, requestId: c.requestId }));
      const mem = (id) => s.selectedMemberIds.filter((m) => (s.assignments[m] || []).includes(id)).length;
      const fastingItems = items.filter((i) => (i.type === 'package' ? i.fastingHours : i.fastingHours) > 0);
      return {
        items, overlap: M().packageOverlap(cart).map((o) => ({ testId: o.testId, packageId: o.packageId, testName: testName(o.testId), packageName: testName(o.packageId) })),
        variants: M().variantConflicts(cart).map((pair) => pair.map((id) => ({ id, name: testName(id) }))),
        centreOnly: s.mode === 'home' ? items.filter((i) => i.centreOnly) : [],
        fasting: { count: fastingItems.length, maxHours: Math.max(0, ...fastingItems.map((i) => i.fastingHours)) },
        counts: { rx: cart.filter((c) => c.sources.includes('prescription')).length, manual: cart.filter((c) => c.sources.includes('manual')).length, packages: cart.filter((c) => P().isPackage(c.id)).length, total: cart.length },
        /* per member: an item booked for 2 people is counted twice */
        estimate: items.reduce((a, i) => a + i.fromPrice * Math.max(1, mem(i.id)), 0), mrp: items.reduce((a, i) => a + i.mrp * Math.max(1, mem(i.id)), 0),
        people: s.selectedMemberIds.length, tests: items.reduce((a, i) => a + Math.max(1, mem(i.id)), 0),
        requests: [...new Set(cart.map((c) => c.requestId).filter(Boolean))].map((id) => LT.db.find('requests', id)).filter(Boolean).map((r) => ({ id: r.id, thumbnail: r.thumbnail, doctor: r.doctor }))
      };
    },

    /* Prescription */
    uploadPrescription(draft) { if (!draft || !draft.files || !draft.files.length) fail('Please add at least one file.'); return { prescriptionId: uid('PRX-') }; },
    runOcr() {
      const o = clone(D().ocr), labs = ctxLabs();
      o.matched = o.matched.map((m) => Object.assign(m, { test: decorate(P().item(m.testId), labs) }));
      o.unclear = o.unclear.map((u) => Object.assign(u, { optionsDetail: u.options.map((id) => decorate(P().item(id), labs)) }));
      return o;
    },
    saveRequest(p) {
      const id = 'RX-' + (24100 + LT.db.all('requests').length + Math.floor(Math.random() * 50));
      const req = { id, owner: S().user.mobile, createdAt: new Date().toISOString(), doctor: p.doctor || 'Not mentioned', rxDate: p.date || '', memberId: p.memberId || null,
        thumbnail: p.thumbnail || D().rxThumb('#1964ee'), thumbnails: p.thumbnails && p.thumbnails.length ? p.thumbnails : [p.thumbnail || D().rxThumb('#1964ee')], files: p.files || [], status: 'SUBMITTED',
        callbackMobile: p.callbackMobile || S().user.mobile, callbackTime: p.callbackTime || 'Anytime (8 AM – 8 PM)', mode: p.mode || S().mode, notes: p.notes || '',
        note: p.note || 'Our team will call you on +91 ' + (p.callbackMobile || S().user.mobile) + ' to confirm the tests.', items: p.items || [], extra: p.extra || [] };
      LT.db.upsert('requests', req);
      return { requestId: id, status: 'SUBMITTED' };
    },
    getRequests() {
      return LT.db.all('requests').filter(mineRx).map((r) => Object.assign(r, { member: r.memberId ? memberById(r.memberId) : null,
        itemsDetail: r.items.map((i) => Object.assign({}, i, { name: i.matchedTestId ? testName(i.matchedTestId) : i.raw })) }));
    },
    getRequest(id) { const r = R.getRequests().find((x) => x.id === id); if (!r) fail('Request not found.'); return r; },
    confirmRequest(id, testIds) {
      const r = LT.db.find('requests', id); if (!r) fail('Request not found.');
      r.items = testIds.map((t) => (r.items.find((i) => i.matchedTestId === t) || { raw: testName(t), matchedTestId: t, confidence: 1 }));
      r.status = 'USER_CONFIRMED'; LT.db.upsert('requests', r); return { status: r.status };
    },
    convertRequestToCart(id) {
      const r = LT.db.find('requests', id); if (!r) fail('Request not found.');
      LT.cart.merge(r.items.map((i) => i.matchedTestId).filter(Boolean), 'prescription', id, r.memberId ? [r.memberId] : null);
      return { added: r.items.length, cart: S().cart };
    },
    updateRequest(id, patch) { const r = LT.db.find('requests', id); if (!r) fail('Request not found.'); return LT.db.upsert('requests', Object.assign(r, patch)); },
    markRequestIdentified(id) {
      const list = LT.db.all('requests').filter(mineRx);
      const r = id ? list.find((x) => x.id === id) : list.find((x) => ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CLARIFICATION'].includes(x.status));
      if (!r) fail('No request waiting for review.');
      r.status = 'TESTS_IDENTIFIED';
      if (!r.items.length) r.items = D().ocr.matched.map((m) => ({ raw: m.raw, matchedTestId: m.testId, confidence: m.confidence }));
      r.note = 'Our team identified ' + r.items.length + ' tests. Please confirm to continue.';
      LT.db.upsert('requests', r); return r;
    },

    /* Auth (OTP is always 123456) */
    sendOtp(mobile) { if (!/^[6-9]\d{9}$/.test(mobile)) fail('Enter a valid 10-digit mobile number.'); R._otp[mobile] = R._otp[mobile] || { tries: 0 }; return { sent: true, resendIn: 30 }; },
    _otp: {},
    /* is this mobile already registered (has a "Self" member)? */
    checkMobile(mobile) { if (!/^[6-9]\d{9}$/.test(mobile)) fail('Enter a valid 10-digit mobile number.'); return { registered: LT.db.all('members').some((m) => m.owner === mobile && m.relationship === 'Self') }; },
    /* profile = { name, dob, gender, email } from the Register form (or just a name string) */
    verifyOtp(mobile, otp, profile) {
      const p = typeof profile === 'string' ? { name: profile } : (profile || {}), name = (p.name || '').trim();
      const rec = R._otp[mobile] || (R._otp[mobile] = { tries: 0 });
      if (rec.tries >= 5) return { ok: false, locked: true, message: 'Too many wrong attempts. Try again after 15 minutes.' };
      if (String(otp) !== '123456') { rec.tries++; return { ok: false, attemptsLeft: 5 - rec.tries, locked: rec.tries >= 5, message: rec.tries >= 5 ? 'Too many wrong attempts. Try again after 15 minutes.' : 'Wrong OTP. ' + (5 - rec.tries) + ' attempts left.' }; }
      const members = LT.db.all('members');
      const self = members.find((m) => m.owner === mobile && m.relationship === 'Self');
      if (!self && !name) return { ok: false, needName: true };
      if (!self) LT.db.upsert('members', { id: uid('m-'), owner: mobile, name, relationship: 'Self', dob: p.dob || '1995-01-01', gender: p.gender || 'female', mobile, email: p.email || '', permission: true, status: 'active', incomplete: !(p.dob && p.gender) });
      rec.tries = 0;
      const user = { loggedIn: true, id: mobile === D().demoUser.mobile ? D().demoUser.id : uid('u-'), name: self ? self.name : name, mobile };
      LT.store.set({ user });
      return { ok: true, user };
    },
    logout() { LT.store.clearBooking(); LT.store.set({ user: LT.store.defaults().user, selectedMemberIds: [], assignments: {}, cart: [] }); return { ok: true }; },

    /* Members */
    getMembers() {
      const mob = S().user.mobile;
      return LT.db.all('members').filter((m) => m.owner === mob && m.status === 'active')
        .map((m) => Object.assign(m, { age: M().age(m.dob) })).sort((a, b) => (a.relationship === 'Self' ? -1 : b.relationship === 'Self' ? 1 : 0));
    },
    saveMember(m) {
      const mob = S().user.mobile, list = LT.db.all('members').filter((x) => x.owner === mob && x.status === 'active');
      if (!m.id && list.length >= 10) fail('You can save up to 10 family members.');
      if (list.some((x) => x.id !== m.id && x.name.trim().toLowerCase() === m.name.trim().toLowerCase() && x.dob === m.dob)) fail(m.name + ' with the same date of birth already exists.');
      if (m.relationship === 'Self' && list.some((x) => x.id !== m.id && x.relationship === 'Self')) fail('Only one member can be "Self".');
      const rec = Object.assign({ status: 'active', owner: mob }, m, { id: m.id || uid('m-'), incomplete: false });
      return Object.assign(LT.db.upsert('members', rec), { age: M().age(rec.dob) });
    },
    archiveMember(id) {
      const m = LT.db.find('members', id); if (!m) fail('Member not found.');
      if (m.relationship === 'Self') fail('"Self" cannot be removed from your account.');
      const busy = LT.db.all('bookings').some((b) => !['REPORT_READY', 'COMPLETED', 'CANCELLED', 'PENDING_PAYMENT'].includes(b.status) && b.members.some((x) => x.memberId === id));
      if (busy) fail(m.name + ' has an upcoming booking. Cancel it or remove the member from it first.');
      if (LT.db.all('requests').some((r) => r.memberId === id && ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CLARIFICATION', 'TESTS_IDENTIFIED'].includes(r.status))) fail(m.name + ' has a pending prescription request.');
      m.status = 'archived'; LT.db.upsert('members', m); return { ok: true };
    },
    validateAssignments(assignments) {
      const s = S(), members = R.getMembers().filter((m) => s.selectedMemberIds.includes(m.id));
      const rxMembers = {};
      s.cart.forEach((c) => { if (c.requestId) { const r = LT.db.find('requests', c.requestId); if (r && r.memberId) rxMembers[c.id] = r.memberId; } });
      return M().validateAssignments(assignments, members, M().mergeDuplicates(s.cart), rxMembers);
    },

    /* Labs */
    getEligibleLabs(cart, memberIds, assignments, mode, pincode) { return eligible(cart, memberIds, assignments, mode, pincode); },
    autoAssignLab(cart, memberIds, assignments, mode, pincode, preference) {
      const list = eligible(cart, memberIds, assignments, mode, pincode);
      if (!list.length) return { lab: null, reason: '', alternatives: [] };
      const full = list.filter((l) => l.coverage === 'full');
      const maxCov = Math.min(...list.map((l) => l.missingTests.length));
      const pool = full.length ? full : list.filter((l) => l.missingTests.length === maxCov);
      const ranked = M().rankLabs(pool, preference || 'value', mode);
      const best = ranked[0];
      const prefText = { value: 'the best balance of price, rating and report time', price: 'the lowest total price', fastest: 'the fastest report', nearest: mode === 'centre' ? 'the nearest centre' : 'the earliest slot' }[preference || 'value'];
      const reason = (best.accredited ? best.badges.filter((b) => ['NABL', 'CAP'].includes(b)).join(' & ') + ' accredited lab' : 'Partner lab') + ' with ' + prefText +
        (best.coverage === 'full' ? ', all your tests' : ' (' + best.missingTests.length + ' test not available)') + ' and a slot ' + best.earliestSlot.label.split(',')[0].toLowerCase() + '.';
      const others = list.filter((l) => l.id !== best.id).slice(0, 2);
      return { lab: best, reason, alternatives: others, candidates: pool.length };
    },
    getLab(id) {
      const lab = labById(id); if (!lab) fail('Lab not found.');
      const s = S();
      const v = labView(lab, { cart: s.cart, memberIds: s.selectedMemberIds, assignments: s.assignments, mode: s.mode });
      v.about = lab.about; v.founded = lab.founded;
      v.prices = D().tests.filter((t) => P().offers(lab, t.id)).slice(0, 12).map((t) => ({ id: t.id, name: t.name, price: P().labPrice(lab, t.id), mrp: t.mrp, tat: P().labTat(lab, t.id) }));
      v.reviewsList = D().labReviews;
      return v;
    },
    compareLabs(ids) { const s = S(); return eligible(s.cart, s.selectedMemberIds, s.assignments, s.mode, s.location.pincode).filter((l) => ids.includes(l.id)); },

    /* Address */
    getAddresses() { const mob = S().user.mobile; return LT.db.all('addresses').filter((a) => a.owner === mob); },
    saveAddress(a) { const rec = Object.assign({ owner: S().user.mobile, verified: true }, a, { id: a.id || uid('a-') }); return LT.db.upsert('addresses', rec); },
    deleteAddress(id) {
      if (LT.db.all('bookings').some((b) => b.addressId === id && !['REPORT_READY', 'COMPLETED', 'CANCELLED', 'PENDING_PAYMENT'].includes(b.status))) fail('This address is used by an upcoming booking and cannot be deleted.');
      LT.db.remove('addresses', id); return { ok: true };
    },
    validateAddressForLab(addressId, labId) {
      const a = LT.db.find('addresses', addressId), lab = labById(labId);
      if (!a || !lab) return { ok: false, message: 'Select an address.' };
      return lab.serviceablePincodes.includes(a.pincode) ? { ok: true, message: lab.name + ' collects from ' + a.pincode + '.' } : { ok: false, message: lab.name + ' does not collect from this address (' + a.area + ', ' + a.pincode + ').' };
    },

    /* Slots */
    getSlots(labId, date, mode, memberCount) { return D().makeSlots(labId, date, mode, memberCount); },
    holdSlot(slot) { const s = Object.assign({}, slot, { heldUntil: Date.now() + 10 * 60000 }); LT.store.set({ slot: s }); return s; },

    /* Checkout */
    getCoupons() {
      const s = S(), lab = labById(s.lab.id);
      const q = lab ? P().labQuote(lab, s.cart, s.assignments, s.selectedMemberIds, s.mode) : { price: 0 };
      const first = !LT.db.all('bookings').some((b) => b.status !== 'PENDING_PAYMENT' && LT.db.find('members', b.members[0].memberId)?.owner === s.user.mobile);
      return D().coupons.map((c) => Object.assign({}, c, { check: P().coupon(c.code, q.price, s.mode, first) }));
    },
    applyCoupon(code, subtotal) {
      const s = S();
      const first = !LT.db.all('bookings').some((b) => b.status !== 'PENDING_PAYMENT' && LT.db.find('members', b.members[0].memberId)?.owner === s.user.mobile);
      return P().coupon(code, subtotal, s.mode, first);
    },
    getBillSummary(state) {
      const s = state || S(), lab = labById(s.lab.id);
      if (!lab) fail('Select a lab first.');
      const first = !LT.db.all('bookings').some((b) => b.status !== 'PENDING_PAYMENT' && LT.db.find('members', b.members[0].memberId)?.owner === s.user.mobile);
      const bill = P().bill({ lab, cart: M().mergeDuplicates(s.cart), assignments: s.assignments, memberIds: s.selectedMemberIds, mode: s.mode, couponCode: s.coupon.code, firstBooking: first });
      bill.perMember = bill.perMember.map((pm) => Object.assign(pm, { member: memberById(pm.memberId), itemsDetail: pm.items.map((id) => ({ id, name: testName(id), price: P().labPrice(lab, id), mrp: P().item(id).mrp, tat: P().labTat(lab, id), fastingHours: P().item(id).fastingHours })) }));
      return { bill, lab: labView(lab, { cart: s.cart, memberIds: s.selectedMemberIds, assignments: s.assignments, mode: s.mode }) };
    },
    createBooking(state) {
      const s = state || S(), lab = labById(s.lab.id);
      const n = 4822 + LT.db.all('bookings').length + Math.floor(Math.random() * 90);
      const b = { id: 'LT-2026-00' + n, labId: s.lab.id, mode: s.mode, addressId: s.mode === 'home' ? s.address.id : null, centreId: s.mode === 'centre' ? s.lab.centreId : null,
        slot: { date: s.slot.date, start: s.slot.start, end: s.slot.end }, members: s.selectedMemberIds.map((m) => ({ memberId: m, tests: (s.assignments[m] || []).filter((id) => P().offers(lab, id, s.mode)) })).filter((m) => m.tests.length),
        status: 'PENDING_PAYMENT', stage: 0, coupon: s.coupon.code, payment: { id: null, method: null, status: 'pending' }, labMethod: s.lab.method, createdAt: new Date().toISOString(), reschedules: 0,
        requestIds: [...new Set(s.cart.map((c) => c.requestId).filter(Boolean))] };
      LT.db.upsert('bookings', b);
      return { bookingId: b.id };
    },
    pay(bookingId, simulate, method) {
      const b = LT.db.find('bookings', bookingId); if (!b) fail('Booking not found.');
      if (simulate === 'failed') return { status: 'failed', reason: 'Your bank declined the transaction (code U30). No money was deducted.' };
      if (simulate === 'processing') return { status: 'processing', reason: 'Payment is being confirmed by your bank.' };
      b.status = 'CONFIRMED'; b.stage = 1; b.payment = { id: 'pay_' + Math.random().toString(36).slice(2, 11), method: method || 'UPI', status: 'paid' };
      LT.db.upsert('bookings', b);
      (b.requestIds || []).forEach((rid) => { const r = LT.db.find('requests', rid); if (r) { r.status = 'CONVERTED'; r.bookingId = b.id; r.note = 'Tests booked under ' + b.id + '.'; LT.db.upsert('requests', r); } });
      LT.store.set({ lastBookingId: b.id });
      return { status: 'success', paymentId: b.payment.id, bookingId: b.id };
    },

    /* Bookings */
    getBookings() { return LT.db.all('bookings').filter((b) => b.status !== 'PENDING_PAYMENT' && mine(b)).map(normalizeBooking).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); },
    getBooking(id) { const b = LT.db.find('bookings', id); if (!b) fail('Booking ' + id + ' was not found.'); return normalizeBooking(b); },
    rescheduleBooking(id, slot) {
      const b = LT.db.find('bookings', id);
      if ((b.reschedules || 0) >= 2) fail('You can reschedule a booking only 2 times.');
      if ((new Date(b.slot.start) - Date.now()) / HOUR < 2) fail('Rescheduling closes 2 hours before the slot.');
      b.slot = { date: slot.start.slice(0, 10), start: slot.start, end: slot.end }; b.reschedules = (b.reschedules || 0) + 1;
      LT.db.upsert('bookings', b); return normalizeBooking(b);
    },
    /* extra (reason "Other"): { note: string, attachment: {name, size, type, preview} | null } */
    cancelBooking(id, reason, extra) {
      const b = LT.db.find('bookings', id), v = normalizeBooking(b), x = extra || {};
      if (!reason) fail('Please choose a reason for cancelling.');
      if (reason === 'Other' && String(x.note || '').trim().length < 10) fail('Please describe your reason (at least 10 characters).');
      b.status = 'CANCELLED'; b.cancel = { reason, note: x.note ? String(x.note).trim().slice(0, 300) : '', attachment: x.attachment || null, refundPct: v.refundPct, refundAmount: Math.round((b.bill.total * v.refundPct) / 100), refundStatus: 'Initiated', at: new Date().toISOString() };
      b.payment.status = v.refundPct ? 'refund initiated' : 'paid';
      LT.db.upsert('bookings', b); return normalizeBooking(b);
    },
    removeMemberFromBooking(id, memberId) {
      const b = LT.db.find('bookings', id);
      if (b.members.length < 2) fail('A booking needs at least one member. Cancel the booking instead.');
      const oldTotal = b.bill.total;
      b.members = b.members.filter((m) => m.memberId !== memberId); delete b.bill;
      LT.db.upsert('bookings', b);
      const v = normalizeBooking(LT.db.find('bookings', id));
      const refund = Math.max(0, oldTotal - v.bill.total);
      const nb = LT.db.find('bookings', id); nb.partialRefunds = (nb.partialRefunds || []).concat([{ memberId, amount: refund, at: new Date().toISOString() }]); LT.db.upsert('bookings', nb);
      return Object.assign(normalizeBooking(nb), { refund });
    },
    advanceBooking(id) {
      const list = LT.db.all('bookings').filter((b) => !['CANCELLED', 'PENDING_PAYMENT', 'REPORT_READY', 'COMPLETED'].includes(b.status));
      const b = id ? LT.db.find('bookings', id) : list[0];
      if (!b) fail('No active booking to advance.');
      const steps = TIMELINE[b.mode];
      if (b.status === 'CANCELLED' || b.stage >= steps.length - 1) fail('This booking is already complete.');
      b.stage++; b.status = steps[b.stage][0];
      if (b.status === 'TECH_ASSIGNED' && !b.technician) b.technician = { name: 'Pooja Shinde', phone: '+91 98811 22334', code: String(1000 + Math.floor(Math.random() * 8999)), rating: 4.8 };
      if (b.status === 'REPORT_READY') b.members.forEach((m) => { if (!LT.db.all('reports').some((r) => r.bookingId === b.id && r.memberId === m.memberId)) LT.db.upsert('reports', makeReport(b, m)); });
      LT.db.upsert('bookings', b); return normalizeBooking(b);
    },
    checkIn(id) { const b = LT.db.find('bookings', id); b.checkedIn = new Date().toISOString(); LT.db.upsert('bookings', b); return normalizeBooking(b); },
    repeatOrder(id) {
      const b = LT.db.find('bookings', id);
      const ids = [...new Set(b.members.flatMap((m) => m.tests))];
      const assignments = {}; b.members.forEach((m) => { assignments[m.memberId] = m.tests.slice(); });
      LT.store.set({ cart: ids.map((x) => ({ id: x, type: P().isPackage(x) ? 'package' : 'test', source: 'manual', sources: ['manual'], requestId: null })),
        selectedMemberIds: b.members.map((m) => m.memberId), assignments, mode: b.mode, lab: { id: null, method: null, centreId: null, preference: 'value' }, slot: LT.store.defaults().slot, coupon: { code: null }, assignMode: 'different' });
      return { ok: true };
    },

    /* Reports */
    getReports(memberId) {
      const mob = S().user.mobile;
      return LT.db.all('reports').filter((r) => (!memberId || memberId === 'all' || r.memberId === memberId) && (memberById(r.memberId) || {}).owner === mob)
        .map((r) => Object.assign(r, { member: memberById(r.memberId), lab: labById(r.labId), testsDetail: r.tests.map((t) => testName(t)), files: reportFiles(r),
          counts: { abnormal: r.parameters.filter((p) => p.status === 'abnormal').length, borderline: r.parameters.filter((p) => p.status === 'borderline').length } }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    /* One report PDF (as shared by the lab). Production: return { fileName, url } of the lab's uploaded PDF.
       Demo: the PDF is generated from the report data (ASCII text, turned into a Blob by the page). */
    getReportFile(reportId, fileId) {
      const r = R.getReport(reportId), f = (r.files || []).find((x) => x.id === fileId) || (r.files || [])[0];
      if (!f) fail('This report file is not available yet.');
      if (!LT.reportPdf) fail('PDF viewer is not available on this page.');
      const params = r.parameters.filter((p) => !f.group || p.group === f.group);
      const pdf = LT.reportPdf.build({ report: r, file: f, params });
      const safe = (s) => LT.reportPdf.asc(s).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const d = new Date(r.date), stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
      return { id: f.id, name: f.name, fileName: `${safe(r.member.name.split(' ')[0])}_${safe(f.short || f.name)}_Report_${stamp}.pdf`, size: pdf.length, url: null, pdf };
    },
    getPendingReports() {
      return LT.db.all('bookings').filter((b) => !['CANCELLED', 'PENDING_PAYMENT', 'REPORT_READY', 'COMPLETED'].includes(b.status)).map(normalizeBooking)
        .flatMap((b) => b.membersView.map((m) => ({ bookingId: b.id, memberId: m.memberId, name: m.name, tests: m.tests.map((t) => t.name), status: b.status, lab: b.lab.name })));
    },
    getReport(id) {
      const r = LT.db.find('reports', id); if (!r) fail('Report not found or not ready yet.');
      const lab = labById(r.labId);
      return Object.assign(r, { member: Object.assign(memberById(r.memberId) || {}, { age: M().age((memberById(r.memberId) || {}).dob || '1990-01-01') }), lab: { name: lab.name, badges: lab.badges, phone: lab.phone, initials: lab.initials, color: lab.color }, testsDetail: r.tests.map(testName), files: reportFiles(r) });
    },
    shareReport(id) { return { url: 'https://bysure.in/r/' + id + '-' + Math.random().toString(36).slice(2, 8), expiresIn: '24 hours' }; },

    /* Feedback */
    saveReview(bookingId, rating, tags, comment) { const r = { id: uid('rv-'), bookingId, rating, tags, comment, at: new Date().toISOString() }; LT.db.upsert('reviews', r); return r; },
    submitSupport(form) { return { ticketId: 'SUP-' + (50000 + Math.floor(Math.random() * 9999)) }; },

    /* Lab portal / admin (demo) */
    registerLab(form) {
      const labId = 'lab-c' + Date.now().toString(36);
      LT.db.save('customLabs', LT.db.all('customLabs').concat([{ id: labId, name: form.name, initials: form.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(), color: '#0d685e',
        badges: form.accreditations && form.accreditations.length ? form.accreditations : ['ISO'], rating: 4.0, reviews: 0, priceFactor: 0.9, tatDelta: 0, homeCollection: true, collectionCharge: 49, freeAbove: 499,
        serviceablePincodes: form.pincodes, testsNotOffered: D().tests.filter((t) => !(form.tests || []).includes(t.id)).map((t) => t.id), status: 'pending', phone: '+91 ' + form.mobile, founded: new Date().getFullYear(),
        about: 'New partner lab on BeyondSure.', cancellationPolicy: D().labs[0].cancellationPolicy,
        centres: [{ id: 'c-' + labId, name: form.name + ' – ' + (form.area || 'Main centre'), address: form.address || 'Pune', pincode: form.pincodes[0], hours: (form.open || '7:00 AM') + ' - ' + (form.close || '9:00 PM'), openNow: true, amenities: ['ac'], distanceKm: 2.5, x: 60, y: 30 }] }]));
      const app = { id: 'APP-' + (3110 + LT.db.all('labApplications').length), labId, name: form.name, owner: form.owner, city: 'Pune', pincodes: form.pincodes, mobile: form.mobile, email: form.email, gst: form.gst,
        submittedAt: new Date().toISOString(), status: 'pending', documents: (form.documents || []).map((n) => ({ name: n, ok: true })), testsCount: (form.tests || []).length, note: '' };
      LT.db.upsert('labApplications', app);
      return { applicationId: app.id };
    },
    getLabApplications() { return LT.db.all('labApplications'); },
    setLabStatus(id, status, note) {
      const app = LT.db.find('labApplications', id); if (!app) fail('Application not found.');
      app.status = status; app.note = note || app.note; LT.db.upsert('labApplications', app);
      if (app.labId) { const st = LT.db.obj('labsStatus'); st[app.labId] = status === 'approved' ? 'active' : status; LT.db.save('labsStatus', st); }
      return app;
    },
    getLabBookings() { return LT.db.all('labBookings'); },
    updateLabBooking(id, patch) { const b = LT.db.find('labBookings', id); return LT.db.upsert('labBookings', Object.assign(b, patch)); },
    uploadReportDemo(bookingId) { const b = LT.db.find('labBookings', bookingId); b.status = 'REPORT_READY'; b.reportUploaded = true; return LT.db.upsert('labBookings', b); },
    getTechnicians() { return D().technicians; },
    getSettlements() { return D().settlements; }
  };

  /* ---------- public, Promise-based API ---------- */
  const FAST = ['getCartDetails', 'suggestTests', 'searchLocations', 'countTests', 'applyCoupon', 'validateAddressForLab', 'validateAssignments', 'getSlots'];
  const api = { failNext: false, TIMELINE, slotLabel, isoDay };
  /* sync helper: lowest lab price near the user (used by the Select Member popup) */
  api.fromPrice = (id) => { try { return decorate(P().item(id), ctxLabs()).fromPrice; } catch (e) { return (P().item(id) || {}).price || 0; } };
  api._delay = (min, max) => new Promise((r) => setTimeout(r, (min || 400) + Math.random() * ((max || 700) - (min || 400))));
  Object.keys(R).filter((k) => !k.startsWith('_')).forEach((k) => {
    api[k] = async function () {
      const args = arguments;
      await (FAST.includes(k) ? api._delay(120, 260) : api._delay());
      if (api.failNext) { api.failNext = false; const e = new Error('Demo: the server did not respond. Please try again.'); e.userMessage = e.message; throw e; }
      return clone(R[k].apply(null, args));
    };
  });
  LT.api = api;
})();
