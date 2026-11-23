/* Lab Tests – dummy data for the platform-side demo pages:
   lab partner applications (admin approvals) and lab-side bookings (lab dashboard). */
window.LT = window.LT || {}; LT.data = LT.data || {};

(function () {
  const ago = (d) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString(); };
  const docs = (ok) => [
    { name: 'Clinical Establishment Licence.pdf', ok: true }, { name: 'NABL Certificate (MC-4821).pdf', ok: ok },
    { name: 'Pathologist Registration – MMC.pdf', ok: true }, { name: 'GST Certificate.pdf', ok: true }
  ];
  LT.data.labApplications = [
    { id: 'APP-3101', labId: 'lab-aarogya', name: 'Aarogya Pathology', owner: 'Dr. Kiran Patil', city: 'Pune', pincodes: ['411057', '411045', '411038'], mobile: '9822334455', email: 'kiran@aarogyapath.in', gst: '27AAKFA1234B1Z9', submittedAt: ago(1), status: 'pending', documents: docs(true), testsCount: 23, note: '' },
    { id: 'APP-3088', labId: 'lab-sanjeevani', name: 'Sanjeevani Diagnostics', owner: 'Dr. Vaishali Gokhale', city: 'Pune', pincodes: ['411005', '411057'], mobile: '9890011223', email: 'ops@sanjeevanidx.in', gst: '27AABCS7788Q1Z2', submittedAt: ago(40), status: 'approved', documents: docs(true), testsCount: 24, note: 'All documents verified.' },
    { id: 'APP-3075', labId: null, name: 'QuickCheck Labs', owner: 'Mr. Amit Shah', city: 'Pune', pincodes: ['411014'], mobile: '9765012345', email: 'amit@quickcheck.in', gst: '27AAQCQ5511L1Z1', submittedAt: ago(12), status: 'rejected', documents: docs(false), testsCount: 12, note: 'NABL certificate expired. Please re-apply with a valid certificate.' }
  ];

  LT.data.labBookings = [
    { id: 'LT-2026-004830', patient: 'Kavya Joshi', members: ['Kavya Joshi', 'Mohan Joshi'], tests: ['Full Body Checkup', 'HbA1c'], mode: 'home', area: 'Baner', slot: 'Today, 07:30 - 08:00 AM', status: 'NEW', amount: 3017, technician: '' },
    { id: 'LT-2026-004826', patient: 'Imran Shaikh', members: ['Imran Shaikh'], tests: ['Lipid Profile', 'Thyroid Profile'], mode: 'home', area: 'Wakad', slot: 'Today, 09:00 - 09:30 AM', status: 'CONFIRMED', amount: 873, technician: '' },
    { id: 'LT-2026-004815', patient: 'Sneha Rao', members: ['Sneha Rao'], tests: ['CBC', 'Vitamin D (25-OH)'], mode: 'home', area: 'Hinjewadi', slot: 'Today, 06:30 - 07:00 AM', status: 'SAMPLE_COLLECTED', amount: 1378, technician: 'Sagar Pawar' },
    { id: 'LT-2026-004801', patient: 'Ganesh More', members: ['Ganesh More', 'Lata More'], tests: ['Senior Citizen Package'], mode: 'centre', area: 'Wakad centre', slot: 'Yesterday, 08:00 - 09:00 AM', status: 'PROCESSING', amount: 4598, technician: '' }
  ];
  LT.data.technicians = ['Sagar Pawar', 'Rohit Jadhav', 'Pooja Shinde', 'Imtiyaz Khan'];
  LT.data.settlements = [
    { id: 'ST-0921', period: '1-7 Nov 2026', bookings: 142, gross: 186420, commission: 22370, net: 164050, status: 'Paid' },
    { id: 'ST-0914', period: '25-31 Oct 2026', bookings: 128, gross: 171300, commission: 20556, net: 150744, status: 'Paid' },
    { id: 'ST-0928', period: '8-14 Nov 2026', bookings: 151, gross: 198760, commission: 23851, net: 174909, status: 'Processing' }
  ];
})();
