/* Lab Tests – dummy data: slot generator.
   LT.data.makeSlots(labId, dateISO, mode, memberCount)
   13 one-hour collection windows a day, in two groups:
     Morning              : 05:00-06:00 AM … 11:00 AM-12:00 PM (7 windows)
     Afternoon & Evening  : 12:00-01:00 PM, 01:00-02:00 PM, 02:00-03:00 PM,
                            04:00-05:00 PM, 05:00-06:00 PM, 06:00-07:00 PM (6 windows; 3-4 PM lab break)
   States: available | past (same-day 2-hour cut-off). Same list for every lab and both modes. */
window.LT = window.LT || {}; LT.data = LT.data || {};

LT.data.SLOT_STARTS = ['05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '16:00', '17:00', '18:00'];
LT.data.SLOT_MINUTES = 60;
LT.data.SLOT_PERIODS = { morning: 'Morning', pm: 'Afternoon & Evening' };

LT.data.makeSlots = function (labId, dateISO) {
  const day = new Date(String(dateISO).slice(0, 10) + 'T00:00:00');
  const cutoff = Date.now() + 2 * 3600 * 1000; // same-day bookings need 2 hours notice
  return LT.data.SLOT_STARTS.map((hm) => {
    const [h, m] = hm.split(':').map(Number), mins = h * 60 + m;
    const t = new Date(day.getTime() + mins * 60000);
    return { start: t.toISOString(), end: new Date(t.getTime() + LT.data.SLOT_MINUTES * 60000).toISOString(), minutes: mins,
      left: 5, state: t.getTime() < cutoff ? 'past' : 'available', period: h < 12 ? 'morning' : 'pm' };
  });
};
