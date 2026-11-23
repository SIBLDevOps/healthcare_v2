/* Lab Tests – state store.
   LT.store : booking-flow state in localStorage "lt_state_v2"
              { get(), set(patch), reset(), subscribe(fn), clearBooking() }
   LT.db    : seeded "tables" (members, addresses, bookings, requests, reports,
              labApplications, labBookings, customLabs, reviews) in "lt_db_v1".
              Only the mock API (api.js) should touch LT.db. */
window.LT = window.LT || {};

(function () {
  const KEY = 'lt_state_v2', DB_KEY = 'lt_db_v2', SEED_KEY = 'lt_seeded_v2'; // v2: new demo family
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full / blocked */ } };

  const defaults = () => ({
    user: { loggedIn: false, id: null, name: '', mobile: '' },
    location: { city: '', area: '', pincode: '', lat: null, lng: null, serviceable: { home: false, lab: false } },
    mode: null,                                  // "home" | "centre"
    selectionMethods: { rx: false, manual: false },
    cart: [],                                    // [{id, type, source, sources[], requestId}]
    prescriptionDraft: { files: [], doctor: '', date: '', memberId: null, ocrItems: [] },
    selectedMemberIds: [],
    assignments: {},                             // { memberId: [itemId] }
    lab: { id: null, method: null, centreId: null, preference: 'value' },
    labOption: null,                             // last used option on select-lab: "choose" | "auto"
    address: { id: null },
    slot: { date: '', start: '', end: '', heldUntil: null },
    coupon: { code: null },
    payment: { simulate: 'success' },
    lastBookingId: null,
    recentSearches: [],
    gate: { done: false }
  });

  let state = Object.assign(defaults(), read(KEY, {}));
  const subs = [];
  const emit = () => subs.forEach((fn) => { try { fn(state); } catch (e) { console.error(e); } });

  LT.store = {
    get: () => clone(state),
    set(patch) { state = Object.assign({}, state, clone(patch)); write(KEY, state); emit(); return LT.store.get(); },
    subscribe(fn) { subs.push(fn); return () => subs.splice(subs.indexOf(fn), 1); },
    reset() { [KEY, DB_KEY, SEED_KEY].forEach((k) => localStorage.removeItem(k)); state = defaults(); emit(); },
    clearBooking() {
      const d = defaults();
      LT.store.set({ cart: [], selectedMemberIds: [], assignments: {}, assignMode: null, selectionMethods: d.selectionMethods,
        lab: Object.assign(d.lab, { preference: state.lab.preference }), address: d.address, slot: d.slot, coupon: d.coupon, payment: d.payment });
    },
    defaults
  };
  /* keep pages in sync when another tab changes the cart */
  window.addEventListener('storage', (e) => { if (e.key === KEY) { state = Object.assign(defaults(), read(KEY, {})); emit(); } });

  /* ---------------- seeded tables ---------------- */
  let db = null;
  function load() {
    if (db) return db;
    db = read(DB_KEY, null);
    if (!db || !localStorage.getItem(SEED_KEY)) {
      const d = LT.data || {};
      db = clone({
        members: d.members || [], addresses: d.addresses || [], bookings: d.bookings || [], requests: d.requests || [],
        reports: d.reports || [], labApplications: d.labApplications || [], labBookings: d.labBookings || [],
        labsStatus: {}, customLabs: [], reviews: [], notify: []
      });
      write(DB_KEY, db);
      localStorage.setItem(SEED_KEY, '1');
    }
    return db;
  }
  LT.db = {
    all(name) { return clone(load()[name] || []); },
    obj(name) { return clone(load()[name] || {}); },
    save(name, value) { load()[name] = clone(value); write(DB_KEY, db); },
    find(name, id) { return LT.db.all(name).find((x) => x.id === id) || null; },
    upsert(name, item) {
      const list = LT.db.all(name), i = list.findIndex((x) => x.id === item.id);
      if (i >= 0) list[i] = Object.assign(list[i], item); else list.unshift(item);
      LT.db.save(name, list); return clone(i >= 0 ? list[i] : item);
    },
    remove(name, id) { LT.db.save(name, LT.db.all(name).filter((x) => x.id !== id)); }
  };
})();
