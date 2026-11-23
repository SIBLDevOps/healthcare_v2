/* Lab Tests – dummy data: coupons. type pct = percentage, flat = rupees. */
window.LT = window.LT || {}; LT.data = LT.data || {};

LT.data.coupons = [
  { code: 'CARE15', title: '15% off up to ₹300', text: 'On orders above ₹499', type: 'pct', value: 15, max: 300, min: 499 },
  { code: 'FIRSTMED', title: 'Flat ₹120 off', text: 'On your first lab booking', type: 'flat', value: 120, min: 0, firstOnly: true },
  { code: 'HEALTH100', title: 'Flat ₹100 off', text: 'On orders above ₹999', type: 'flat', value: 100, min: 999 },
  { code: 'HOMEONLY', title: '10% off home collection', text: 'Valid only on home sample collection', type: 'pct', value: 10, max: 200, min: 0, modeOnly: 'home' },
  { code: 'EXPIRED10', title: '10% off', text: 'Monsoon offer – ended 31 Aug', type: 'pct', value: 10, max: 150, min: 0, expired: true }
];
