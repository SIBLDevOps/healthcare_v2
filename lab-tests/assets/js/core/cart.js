/* Lab Tests – dedicated lab cart (separate from the wellness-shop basket).
   Lives in LT.store().cart as [{ id, type, source, sources[], requestId }] and
   LT.store().assignments as { memberId: [itemId] } – every test belongs to one or more
   family members. selectedMemberIds = members that have at least one test.
   LT.cart.add / setMembers / toggleMember / setAssignments / removeFor / remove / restore / has / list / count / clear / merge. */
window.LT = window.LT || {};

(function () {
  const get = () => LT.store.get().cart || [];
  const save = (cart) => LT.store.set({ cart });
  const typeOf = (id) => (String(id).startsWith('pkg-') ? 'package' : 'test');

  /* keep assignments + selected members consistent with the cart */
  function writeAssign(a, extraOrder) {
    const s = LT.store.get(), ids = get().map((c) => c.id);
    Object.keys(a).forEach((m) => { a[m] = [...new Set(a[m] || [])].filter((x) => ids.includes(x)); if (!a[m].length) delete a[m]; });
    const sel = s.selectedMemberIds.filter((m) => a[m]).concat((extraOrder || Object.keys(a)).filter((m) => a[m] && !s.selectedMemberIds.includes(m)));
    LT.store.set({ assignments: a, selectedMemberIds: [...new Set(sel)] });
  }
  /* any change in who gets what clears the slot (slot length changes). The lab chosen for the booking
     (lab side-bar on the first test) stays – it is changed on the Compare labs page – and is only
     cleared when the cart becomes empty, so the next first test asks for a lab again. */
  const resetLab = () => {
    const s = LT.store.get(), empty = !get().length;
    if ((empty && s.lab.id) || s.slot.start) LT.store.set({ lab: empty ? Object.assign(s.lab, { id: null, method: null, centreId: null }) : s.lab, slot: LT.store.defaults().slot });
  };

  LT.cart = {
    list: get,
    count: () => get().length,
    has: (id) => get().some((c) => c.id === id),
    ids: () => get().map((c) => c.id),
    /* members who get item id */
    membersOf: (id) => { const a = LT.store.get().assignments || {}; return Object.keys(a).filter((m) => (a[m] || []).includes(id)); },
    /* opts.members = [memberId] (or legacy opts.only) assigns the item to those members */
    add(id, source, requestId, opts) {
      source = source || (typeOf(id) === 'package' ? 'package' : 'manual');
      const cart = get(), cur = cart.find((c) => c.id === id);
      if (cur) { cur.sources = [...new Set((cur.sources || [cur.source]).concat(source))]; cur.requestId = cur.requestId || requestId || null; }
      else cart.push({ id, type: typeOf(id), source, sources: [source], requestId: requestId || null });
      save(cart);
      const mem = opts && (opts.members || (opts.only ? [opts.only] : null));
      if (mem && mem.length) { const a = LT.store.get().assignments || {}; mem.forEach((m) => { a[m] = (a[m] || []).concat(id); }); writeAssign(a, mem); resetLab(); }
      return !cur;
    },
    /* replace the list of members who get item id (empty list removes it from the cart) */
    setMembers(id, memberIds, source, requestId) {
      if (!memberIds.length) { LT.cart.remove(id); return; }
      if (!LT.cart.has(id)) LT.cart.add(id, source, requestId);
      const a = LT.store.get().assignments || {};
      Object.keys(a).forEach((m) => { a[m] = (a[m] || []).filter((x) => x !== id); });
      memberIds.forEach((m) => { a[m] = (a[m] || []).concat(id); });
      writeAssign(a, memberIds); resetLab();
    },
    /* Lab Cart member chips: add / remove one member for one item. The item stays in the cart even when
       nobody is ticked (the cart then asks who it is for). */
    toggleMember(id, memberId, on) {
      if (!LT.cart.has(id)) return;
      const a = LT.store.get().assignments || {};
      a[memberId] = (a[memberId] || []).filter((x) => x !== id);
      if (on) a[memberId].push(id);
      writeAssign(a, on ? [memberId] : null); resetLab();
    },
    /* replace all assignments at once (Undo on the Lab Cart page) */
    setAssignments(a) { writeAssign(JSON.parse(JSON.stringify(a || {}))); resetLab(); },
    /* remove a test for one member only; drops it from the cart when nobody has it */
    removeFor(id, memberId) {
      const item = get().find((c) => c.id === id);
      const a = LT.store.get().assignments || {};
      a[memberId] = (a[memberId] || []).filter((x) => x !== id);
      const left = Object.keys(a).some((m) => (a[m] || []).includes(id));
      if (!left) save(get().filter((c) => c.id !== id));
      writeAssign(a); resetLab();
      return item ? Object.assign({}, item, { members: [memberId] }) : null;
    },
    remove(id) {
      const removed = get().find((c) => c.id === id);
      const members = LT.cart.membersOf(id);
      save(get().filter((c) => c.id !== id));
      writeAssign(LT.store.get().assignments || {}); resetLab();
      return removed ? Object.assign({}, removed, { members }) : null;
    },
    /* undo for remove / removeFor */
    restore(item) {
      if (!item) return;
      const cart = get();
      if (!cart.some((c) => c.id === item.id)) { const c = Object.assign({}, item); delete c.members; cart.push(c); save(cart); }
      if (item.members && item.members.length) { const a = LT.store.get().assignments || {}; item.members.forEach((m) => { a[m] = (a[m] || []).concat(item.id); }); writeAssign(a, item.members); }
    },
    merge(ids, source, requestId, members) { let added = 0; ids.forEach((id) => { if (LT.cart.add(id, source, requestId, members ? { members } : null)) added++; }); return added; },
    /* items nobody is booked for (e.g. old carts) */
    unassigned: () => { const a = LT.store.get().assignments || {}; return get().filter((c) => !Object.keys(a).some((m) => (a[m] || []).includes(c.id))); },
    clear() { save([]); LT.store.set({ assignments: {}, selectedMemberIds: [] }); }
  };
})();
