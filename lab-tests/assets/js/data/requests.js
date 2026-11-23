/* Lab Tests – dummy data: prescription requests (My Prescription Requests).
   Lifecycle: SUBMITTED -> UNDER_REVIEW -> TESTS_IDENTIFIED | NEEDS_CLARIFICATION -> USER_CONFIRMED -> CONVERTED (also REJECTED, EXPIRED). */
window.LT = window.LT || {}; LT.data = LT.data || {};

(function () {
  const ago = (d, h) => { const x = new Date(); x.setDate(x.getDate() - d); x.setHours(h || 10, 15, 0, 0); return x.toISOString(); };
  /* small SVG "photo of a prescription" used as thumbnail */
  const rx = (tint) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"><rect width="120" height="160" rx="8" fill="#fff"/><rect width="120" height="26" rx="8" fill="${tint}"/><text x="10" y="18" font-family="Arial" font-size="11" fill="#fff" font-weight="700">Rx Clinic</text><text x="10" y="46" font-family="Georgia" font-size="16" fill="${tint}" font-style="italic">Rx</text>${[58, 72, 86, 100, 114].map((y, i) => `<rect x="12" y="${y}" width="${[86, 70, 92, 60, 78][i]}" height="5" rx="2.5" fill="#c9d4ea"/>`).join('')}<path d="M70 140c8-10 14 6 22-4s10 4 16-2" stroke="${tint}" stroke-width="2" fill="none"/></svg>`);
  LT.data.rxThumb = rx;

  LT.data.requests = [
    { id: 'RX-24091', createdAt: ago(0, 9), doctor: 'Dr. Ananya Mehta', rxDate: ago(1).slice(0, 10), memberId: 'm-self', thumbnail: rx('#1964ee'), files: [{ name: 'prescription_mehta.jpg', size: 842311, type: 'image/jpeg' }],
      status: 'SUBMITTED', items: [], note: '' },
    { id: 'RX-24077', createdAt: ago(2, 18), doctor: 'Dr. Sameer Kulkarni', rxDate: ago(3).slice(0, 10), memberId: 'm-mother', thumbnail: rx('#0d685e'), files: [{ name: 'kulkarni_rx.pdf', size: 312004, type: 'application/pdf' }],
      status: 'TESTS_IDENTIFIED', note: 'We matched 3 tests from your prescription. Please confirm to add them to your cart.',
      items: [{ raw: 'TFT', matchedTestId: 'thyroid', confidence: 0.96 }, { raw: 'Lipid prof.', matchedTestId: 'lipid', confidence: 0.92 }, { raw: 'Vit B12', matchedTestId: 'b12', confidence: 0.88 }] },
    { id: 'RX-24052', createdAt: ago(4, 12), doctor: 'Dr. R. Iyer', rxDate: ago(5).slice(0, 10), memberId: 'm-spouse', thumbnail: rx('#e5484d'), files: [{ name: 'IMG_2041.jpg', size: 1904220, type: 'image/jpeg' }],
      status: 'NEEDS_CLARIFICATION', note: 'The second line of the prescription is not readable. Please upload a clearer photo or tell us the test name.', items: [{ raw: 'CBC', matchedTestId: 'cbc', confidence: 0.9 }] },
    { id: 'RX-23998', createdAt: ago(10, 11), doctor: 'Dr. Ananya Mehta', rxDate: ago(11).slice(0, 10), memberId: 'm-self', thumbnail: rx('#7c3aed'), files: [{ name: 'rx_mehta_aug.png', size: 652110, type: 'image/png' }],
      status: 'CONVERTED', bookingId: 'LT-2026-004533', note: 'Tests booked under LT-2026-004533.',
      items: [{ raw: 'CBC', matchedTestId: 'cbc', confidence: 0.98 }, { raw: 'HbA1c', matchedTestId: 'hba1c', confidence: 0.97 }] }
  ];
})();
