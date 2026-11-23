/* Lab Tests – pricing rules (moves to the server later; pages only display results).
   LT.pricing.labPrice(lab, itemId)      price of a test/package at a lab
   LT.pricing.labQuote(lab, cart, assignments, memberIds, mode)
   LT.pricing.coupon(code, subtotal, mode, isFirstBooking)
   LT.pricing.bill({lab, cart, assignments, memberIds, mode, couponCode, firstBooking})
   Collection charge is once per booking: free in centre mode or when price >= lab.freeAbove. */
window.LT = window.LT || {};

(function () {
  const D = () => LT.data;
  const item = (id) => D().tests.find((t) => t.id === id) || D().packages.find((p) => p.id === id) || null;
  const isPackage = (id) => String(id).startsWith('pkg-');
  const testsOf = (id) => { const it = item(id); return !it ? [] : isPackage(id) ? it.tests.slice() : [id]; };
  const offers = (lab, id, mode) => testsOf(id).every((t) => !(lab.testsNotOffered || []).includes(t) && !(mode === 'home' && item(t).centreOnly));
  const labPrice = (lab, id) => { const it = item(id); return it ? Math.round(it.price * (lab ? lab.priceFactor : 1)) : 0; };
  const labTat = (lab, id) => { const it = item(id); return it ? Math.max(4, it.tatHours + (lab ? lab.tatDelta : 0)) : 0; };

  /* which items each member gets; before members are picked we price "one person, every item" */
  function units(cart, assignments, memberIds) {
    const ids = cart.map((c) => c.id);
    if (!memberIds || !memberIds.length) return [{ memberId: null, items: ids }];
    return memberIds.map((m) => ({ memberId: m, items: (assignments && assignments[m] ? assignments[m] : ids).filter((x) => ids.includes(x)) }));
  }

  function labQuote(lab, cart, assignments, memberIds, mode) {
    let mrp = 0, price = 0, maxTat = 0;
    const missing = new Set();
    const perMember = units(cart, assignments, memberIds).map((u) => {
      let m = 0, p = 0;
      u.items.forEach((id) => {
        if (!offers(lab, id, mode)) { missing.add(id); return; }
        m += item(id).mrp; p += labPrice(lab, id); maxTat = Math.max(maxTat, labTat(lab, id));
      });
      mrp += m; price += p;
      return { memberId: u.memberId, items: u.items.filter((id) => offers(lab, id, mode)), mrp: m, price: p };
    });
    const collectionCharge = mode === 'home' && lab.homeCollection && price > 0 && price < (lab.freeAbove || Infinity) ? lab.collectionCharge : 0;
    return { mrp, price, discountPct: mrp ? Math.round(((mrp - price) / mrp) * 100) : 0, collectionCharge, total: price + collectionCharge,
      tatHours: maxTat, missingTests: [...missing], perMember };
  }

  function coupon(code, subtotal, mode, firstBooking) {
    code = String(code || '').trim().toUpperCase();
    const c = (D().coupons || []).find((x) => x.code === code);
    if (!code) return { ok: false, amount: 0, reason: 'Enter a coupon code.' };
    if (!c) return { ok: false, amount: 0, state: 'invalid', reason: 'This coupon code is not valid.' };
    if (c.expired) return { ok: false, amount: 0, state: 'expired', coupon: c, reason: 'This coupon has expired.' };
    if (c.modeOnly && c.modeOnly !== mode) return { ok: false, amount: 0, state: 'na', coupon: c, reason: 'Valid only on home sample collection.' };
    if (c.firstOnly && !firstBooking) return { ok: false, amount: 0, state: 'na', coupon: c, reason: 'Valid only on your first lab booking.' };
    if (subtotal < (c.min || 0)) return { ok: false, amount: 0, state: 'na', coupon: c, reason: 'Add ₹' + (c.min - subtotal).toLocaleString('en-IN') + ' more to use this coupon.' };
    const amount = Math.min(subtotal, c.type === 'pct' ? Math.min(Math.round((subtotal * c.value) / 100), c.max || Infinity) : c.value);
    return { ok: true, amount, state: 'applied', coupon: c, reason: '' };
  }

  function bill(ctx) {
    const q = labQuote(ctx.lab, ctx.cart, ctx.assignments, ctx.memberIds, ctx.mode);
    const cp = ctx.couponCode ? coupon(ctx.couponCode, q.price, ctx.mode, ctx.firstBooking) : { ok: false, amount: 0 };
    const couponAmt = cp.ok ? cp.amount : 0;
    const total = Math.max(0, q.price - couponAmt + q.collectionCharge);
    const saved = q.mrp - q.price + couponAmt;
    return { mrp: q.mrp, price: q.price, labDiscount: q.mrp - q.price, coupon: couponAmt, couponCode: cp.ok ? cp.coupon.code : null, couponResult: cp,
      collection: q.collectionCharge, kit: 0, tax: 0, total, saved, savedPct: q.mrp ? Math.round((saved / q.mrp) * 100) : 0,
      perMember: q.perMember, missingTests: q.missingTests, tatHours: q.tatHours };
  }

  LT.pricing = { item, isPackage, testsOf, offers, labPrice, labTat, labQuote, coupon, bill, units };
})();
