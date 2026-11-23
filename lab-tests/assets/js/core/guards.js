/* Lab Tests – flow guards. Call LT.guards.require([...]) at the top of a page.
   Each rule redirects to the page that fixes it (with a flash message) and returns false.
   Rules: location, cart, members, lab, place (address or centre), slot. */
window.LT = window.LT || {};

(function () {
  /* the saved pincode must still be served for the chosen method (we serve only Pune & Mumbai) */
  const served = (s) => {
    const t = LT.data && LT.data.serviceability; if (!t) return true;
    const v = t[s.location.pincode]; return !!(v && v[s.mode === 'home' ? 'home' : 'lab']);
  };
  const RULES = {
    location: [(s) => s.location.pincode && s.mode && served(s), 'index.html?setup=location', 'Please choose a location we serve (Pune or Mumbai) and how you\'d like to get tested.'],
    cart: [(s) => s.cart.length > 0, 'cart.html', 'Your lab cart is empty. Add tests to continue.'],
    members: [(s) => s.user.loggedIn && s.selectedMemberIds.length > 0 && s.cart.every((c) => s.selectedMemberIds.some((m) => (s.assignments[m] || []).includes(c.id))), 'cart.html', 'Please choose a family member for every test in your cart.'],
    lab: [(s) => !!s.lab.id, 'select-lab.html', 'Please select a lab.'],
    place: [(s) => (s.mode === 'home' ? !!s.address.id : !!s.lab.centreId), 'location.html', 'Please confirm the collection address or lab centre.'],
    slot: [(s) => !!s.slot.start, 'slot.html', 'Please choose a date and time slot.']
  };
  LT.guards = {
    require(list) {
      const s = LT.store.get();
      for (const k of list) {
        const [ok, to, msg] = RULES[k];
        if (!ok(s)) { LT.layout.flash(msg, 'warning'); location.replace(LT.layout.url(to)); return false; }
      }
      return true;
    },
    returnTo: () => encodeURIComponent(location.pathname.split('/').pop() + location.search)
  };
})();
