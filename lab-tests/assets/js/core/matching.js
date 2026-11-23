/* Lab Tests – matching rules (moves to the server later).
   mergeDuplicates(items)       same test id shown once, sources combined
   packageOverlap(cart)         single tests that are already inside a package in the cart
   variantConflicts(cart)       similar variants both present (Vitamin D vs Vitamin D Total)
   validateAssignments(...)     gender / age / prescription-member rules per member
   rankLabs(labs, preference)   auto-assign scoring (best value, lowest price, fastest, nearest) */
window.LT = window.LT || {};

(function () {
  const P = () => LT.pricing;
  const VARIANTS = [['vitd', 'vitd-total'], ['cbc', 'cbc-esr']];

  function mergeDuplicates(items) {
    const map = new Map();
    items.forEach((it) => {
      const src = it.sources || [it.source];
      if (map.has(it.id)) {
        const cur = map.get(it.id);
        cur.sources = [...new Set(cur.sources.concat(src))];
        cur.requestId = cur.requestId || it.requestId || null;
      } else map.set(it.id, Object.assign({}, it, { sources: [...new Set(src)] }));
    });
    return [...map.values()];
  }

  function packageOverlap(cart) {
    const out = [];
    cart.filter((c) => P().isPackage(c.id)).forEach((pk) => {
      const inPkg = P().item(pk.id).tests;
      cart.filter((c) => !P().isPackage(c.id) && inPkg.includes(c.id)).forEach((t) => out.push({ testId: t.id, packageId: pk.id }));
    });
    return out;
  }

  const variantConflicts = (cart) => VARIANTS.filter(([a, b]) => cart.some((c) => c.id === a) && cart.some((c) => c.id === b));

  const age = (dob) => { const d = new Date(dob), n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };

  /* returns { [memberId]: { issues:[{itemId, level, msg}], blocked:[itemId], empty:bool } } */
  function validateAssignments(assignments, members, cart, rxMembers) {
    const out = {};
    members.forEach((m) => {
      const res = { issues: [], blocked: [], empty: false };
      cart.forEach((c) => {
        P().testsOf(c.id).forEach((tid) => {
          const t = P().item(tid);
          if (t.genderRule !== 'all' && t.genderRule !== m.gender) {
            res.blocked.push(c.id);
            res.issues.push({ itemId: c.id, level: 'error', msg: t.short + ' is only for ' + (t.genderRule === 'male' ? 'men' : 'women') + '.' });
          } else if (t.minAge && age(m.dob) < t.minAge) {
            res.issues.push({ itemId: c.id, level: 'warn', msg: t.short + ' is usually advised from age ' + t.minAge + '. Please check with your doctor.' });
          }
        });
        const rxFor = rxMembers && rxMembers[c.id];
        if (rxFor && rxFor !== m.id && (assignments[m.id] || []).includes(c.id)) {
          res.issues.push({ itemId: c.id, level: 'soft', msg: P().item(c.id).name + ' was prescribed for another member.' });
        }
      });
      res.blocked = [...new Set(res.blocked)];
      res.empty = !(assignments[m.id] || []).filter((x) => !res.blocked.includes(x)).length;
      out[m.id] = res;
    });
    return out;
  }

  /* labs: [{ quote:{total, tatHours}, rating, distanceKm, earliestMins }] -> sorted copies with .score (0-100) */
  function rankLabs(labs, preference, mode) {
    if (!labs.length) return [];
    const norm = (vals, lowerBetter) => {
      const min = Math.min(...vals), max = Math.max(...vals);
      return vals.map((v) => (max === min ? 1 : lowerBetter ? (max - v) / (max - min) : (v - min) / (max - min)));
    };
    const price = norm(labs.map((l) => l.quote.total), true);
    const rating = norm(labs.map((l) => l.rating), false);
    const tat = norm(labs.map((l) => l.quote.tatHours), true);
    const prox = norm(labs.map((l) => (mode === 'centre' ? l.distanceKm : l.earliestMins)), true);
    let w = { price: 0.4, rating: 0.25, tat: 0.2, prox: 0.15 };
    const rest = 0.1;
    if (preference === 'price') w = { price: 0.7, rating: rest, tat: rest, prox: rest };
    if (preference === 'fastest') w = { price: rest, rating: rest, tat: 0.7, prox: rest };
    if (preference === 'nearest') w = { price: rest, rating: rest, tat: rest, prox: 0.7 };
    return labs.map((l, i) => Object.assign({}, l, { score: Math.round(100 * (w.price * price[i] + w.rating * rating[i] + w.tat * tat[i] + w.prox * prox[i])) }))
      .sort((a, b) => b.score - a.score || b.rating - a.rating || a.earliestMins - b.earliestMins || a.distanceKm - b.distanceKm);
  }

  LT.matching = { mergeDuplicates, packageOverlap, variantConflicts, validateAssignments, rankLabs, age };
})();
