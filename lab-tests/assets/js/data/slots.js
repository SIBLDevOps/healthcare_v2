/* Lab Tests – dummy data: slot generator.
   LT.data.makeSlots(labId, dateISO, mode, memberCount)
   12 morning collection windows of 1 hour, starting every 30 minutes:
   05:30-06:30 AM, 06:00-07:00 AM … 10:30-11:30 AM, 11:00 AM-12:00 PM.
   States: available | past (same-day 2-hour cut-off). Same list for every lab and both modes. */
window.LT = window.LT || {}; LT.data = LT.data || {};

LT.data.SLOT_STARTS = ['05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];
LT.data.SLOT_MINUTES = 60;

LT.data.makeSlots = function (labId, dateISO) {
  const day = new Date(String(dateISO).slice(0, 10) + 'T00:00:00');
  const cutoff = Date.now() + 2 * 3600 * 1000; // same-day bookings need 2 hours notice
  return LT.data.SLOT_STARTS.map((hm) => {
    const [h, m] = hm.split(':').map(Number), mins = h * 60 + m;
    const t = new Date(day.getTime() + mins * 60000);
    return { start: t.toISOString(), end: new Date(t.getTime() + LT.data.SLOT_MINUTES * 60000).toISOString(), minutes: mins,
      left: 5, state: t.getTime() < cutoff ? 'past' : 'available', period: 'Morning' };
  });
};
