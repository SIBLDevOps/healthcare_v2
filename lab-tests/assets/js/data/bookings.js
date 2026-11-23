/* Lab Tests – dummy data: 5 seed bookings in different lifecycle states.
   Dates are relative to the first load so the demo always looks current.
   stage = index into the timeline steps (api.js TIMELINE). bill + timeline
   are filled in by the mock API the first time a booking is read. */
window.LT = window.LT || {}; LT.data = LT.data || {};

(function () {
  const at = (days, h, m) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, m || 0, 0, 0); return d.toISOString(); };
  const soon = () => { const d = new Date(Date.now() + 3 * 3600e3); d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0); return d.toISOString(); };
  const slot = (iso, mins) => ({ date: iso.slice(0, 10), start: iso, end: new Date(new Date(iso).getTime() + (mins || 30) * 60000).toISOString() });

  LT.data.bookings = [
    { id: 'LT-2026-004821', labId: 'lab-bs', mode: 'home', addressId: 'a-home', centreId: null, slot: slot(at(1, 7, 0), 30),
      members: [{ memberId: 'm-self', tests: ['cbc', 'hba1c'] }, { memberId: 'm-spouse', tests: ['cbc', 'lipid'] }],
      status: 'CONFIRMED', stage: 1, coupon: 'CARE15', payment: { id: 'pay_Nx82KQ1mZ', method: 'UPI', status: 'paid' }, labMethod: 'auto', createdAt: at(-1, 18, 20), reschedules: 0 },
    { id: 'LT-2026-004790', labId: 'lab-apollo', mode: 'home', addressId: 'a-parents', centreId: null, slot: slot(soon(), 30),
      members: [{ memberId: 'm-mother', tests: ['thyroid', 'vitd'] }],
      status: 'TECH_ASSIGNED', stage: 2, coupon: null, payment: { id: 'pay_Nx77AB9pQ', method: 'Card', status: 'paid' }, labMethod: 'choose', createdAt: at(-2, 11, 5), reschedules: 1,
      technician: { name: 'Sagar Pawar', phone: '+91 98220 11223', code: '4821', rating: 4.9 } },
    { id: 'LT-2026-004712', labId: 'lab-metro', mode: 'home', addressId: 'a-work', centreId: null, slot: slot(at(0, 7, 30), 30),
      members: [{ memberId: 'm-self', tests: ['thyroid', 'b12'] }],
      status: 'SAMPLE_COLLECTED', stage: 4, coupon: null, payment: { id: 'pay_Nx70LL2wE', method: 'UPI', status: 'paid' }, labMethod: 'choose', createdAt: at(-3, 9, 40), reschedules: 0,
      technician: { name: 'Rohit Jadhav', phone: '+91 98500 44556', code: '7310', rating: 4.7 } },
    { id: 'LT-2026-004533', labId: 'lab-bs', mode: 'home', addressId: 'a-home', centreId: null, slot: slot(at(-6, 7, 0), 60),
      members: [{ memberId: 'm-self', tests: ['cbc', 'hba1c', 'lipid', 'vitd'] }, { memberId: 'm-mother', tests: ['cbc', 'lipid'] }, { memberId: 'm-spouse', tests: ['thyroid'] }],
      status: 'REPORT_READY', stage: 7, coupon: 'HEALTH100', payment: { id: 'pay_Nx51PO8tY', method: 'UPI', status: 'paid' }, labMethod: 'auto', createdAt: at(-8, 20, 15), reschedules: 0,
      technician: { name: 'Sagar Pawar', phone: '+91 98220 11223', code: '1180', rating: 4.9 } },
    { id: 'LT-2026-004402', labId: 'lab-sanjeevani', mode: 'centre', addressId: null, centreId: 'c-sj-wakad', slot: slot(at(-4, 10, 0), 30),
      members: [{ memberId: 'm-spouse', tests: ['usg', 'xray'] }],
      status: 'CANCELLED', stage: 0, coupon: null, payment: { id: 'pay_Nx44RT3dK', method: 'Net banking', status: 'refunded' }, labMethod: 'choose', createdAt: at(-9, 13, 0), reschedules: 0,
      cancel: { reason: 'Doctor changed the tests', refundPct: 100, refundStatus: 'Completed', at: at(-6, 9, 0) } }
  ];
})();
