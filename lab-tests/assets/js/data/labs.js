/* Lab Tests – dummy data: partner labs (8). 6 are live in Pune.
   "Aarogya Pathology" starts as status "pending" and only shows up in
   select-lab after an admin approves it (admin/lab-approvals.html).
   Lab price for a test = round(test.price * priceFactor)
   Lab TAT = max(4, test.tatHours + tatDelta) */
window.LT = window.LT || {}; LT.data = LT.data || {};

(function () {
  const PUNE = ['411057', '411045', '411038', '411014', '411005'];
  const policy = 'Free cancellation up to 12 hours before the slot. 50% refund within 2-12 hours. No refund within 2 hours.';
  LT.data.labs = [
    { id: 'lab-bs', name: 'BeyondSure Care Labs', initials: 'BS', color: '#1964ee', badges: ['Flagship', 'NABL', 'CAP'], rating: 4.9, reviews: 12840,
      priceFactor: 0.92, tatDelta: -4, homeCollection: true, collectionCharge: 0, freeAbove: 0, serviceablePincodes: PUNE.concat(['400001', '400069']),
      testsNotOffered: [], status: 'active', phone: '+91 20 4855 1200', founded: 2012,
      about: 'Our flagship NABL & CAP accredited network with fully automated analysers, cold-chain sample transport and a pathologist review on every report.',
      centres: [
        { id: 'c-bs-wakad', name: 'BeyondSure Care Labs – Wakad', address: 'Shop 4, Vision Galleria, Wakad Road, Wakad, Pune', pincode: '411057', lat: 18.598, lng: 73.772, hours: '6:30 AM - 9:30 PM', openNow: true, amenities: ['parking', 'wheelchair', 'ac', 'wifi'], distanceKm: 1.2, x: 32, y: 40 },
        { id: 'c-bs-baner', name: 'BeyondSure Care Labs – Baner', address: '2nd Floor, Balewadi High Street, Baner, Pune', pincode: '411045', lat: 18.560, lng: 73.786, hours: '7:00 AM - 9:00 PM', openNow: true, amenities: ['parking', 'ac'], distanceKm: 4.6, x: 58, y: 62 }
      ] },
    { id: 'lab-apollo', name: 'Apollo Diagnostics', initials: 'AD', color: '#0d685e', badges: ['NABL', 'ISO'], rating: 4.6, reviews: 8421,
      priceFactor: 1.0, tatDelta: 0, homeCollection: true, collectionCharge: 49, freeAbove: 499, serviceablePincodes: PUNE.concat(['400001']),
      testsNotOffered: [], status: 'active', phone: '+91 20 6720 4400', founded: 2001,
      about: 'A trusted national diagnostics chain with 1,500+ collection centres and consistent quality.',
      centres: [{ id: 'c-ap-hinj', name: 'Apollo Diagnostics – Hinjewadi Phase 1', address: 'Plot 12, Hinjewadi Phase 1, Pune', pincode: '411057', lat: 18.591, lng: 73.739, hours: '7:00 AM - 9:30 PM', openNow: true, amenities: ['parking', 'ac'], distanceKm: 2.8, x: 18, y: 28 }] },
    { id: 'lab-manipal', name: 'Manipal Diagnostic Services', initials: 'MD', color: '#7c3aed', badges: ['Hospital Grade', 'NABL', 'CAP'], rating: 4.8, reviews: 5210,
      priceFactor: 1.15, tatDelta: -2, homeCollection: true, collectionCharge: 99, freeAbove: 1499, serviceablePincodes: PUNE,
      testsNotOffered: [], status: 'active', phone: '+91 20 4915 7000', founded: 1995,
      about: 'Hospital-grade labs inside Manipal Hospitals with radiology, cardiology and pathology under one roof.',
      centres: [{ id: 'c-mn-baner', name: 'Manipal Hospital Lab – Baner', address: 'Survey 39, Baner-Pashan Link Road, Baner, Pune', pincode: '411045', lat: 18.556, lng: 73.790, hours: '24 hours', openNow: true, amenities: ['parking', 'wheelchair', 'ac', 'cafe'], distanceKm: 5.1, x: 66, y: 54 }] },
    { id: 'lab-metro', name: 'Metro Path Labs', initials: 'MP', color: '#e5484d', badges: ['NABL'], rating: 4.3, reviews: 3120,
      priceFactor: 0.82, tatDelta: 6, homeCollection: true, collectionCharge: 79, freeAbove: 799, serviceablePincodes: ['411057', '411045', '411014'],
      testsNotOffered: ['ecg', 'usg'], status: 'active', phone: '+91 20 2730 1188', founded: 2014,
      about: 'Budget-friendly pathology lab focused on routine blood tests with quick home collection.',
      centres: [{ id: 'c-mt-wakad', name: 'Metro Path Labs – Datta Mandir Chowk', address: 'Datta Mandir Road, Wakad, Pune', pincode: '411057', lat: 18.601, lng: 73.765, hours: '7:00 AM - 8:00 PM', openNow: false, amenities: ['ac'], distanceKm: 0.8, x: 40, y: 22 }] },
    { id: 'lab-city', name: 'City Health Lab', initials: 'CH', color: '#f59e0b', badges: ['ISO'], rating: 4.1, reviews: 1890,
      priceFactor: 0.86, tatDelta: 4, homeCollection: true, collectionCharge: 59, freeAbove: 599, serviceablePincodes: ['411057', '411038', '411014'],
      testsNotOffered: ['vitd-total', 'testosterone'], status: 'active', phone: '+91 20 2546 7711', founded: 2016,
      about: 'Neighbourhood lab with two decades of experience serving families in west Pune.',
      centres: [{ id: 'c-ch-kothrud', name: 'City Health Lab – Kothrud', address: 'Karve Road, near Kothrud Depot, Pune', pincode: '411038', lat: 18.507, lng: 73.808, hours: '7:00 AM - 9:00 PM', openNow: true, amenities: ['wheelchair'], distanceKm: 9.4, x: 74, y: 80 }] },
    { id: 'lab-sanjeevani', name: 'Sanjeevani Diagnostics', initials: 'SD', color: '#12a150', badges: ['NABL', 'ISO'], rating: 4.5, reviews: 2760,
      priceFactor: 0.95, tatDelta: 2, homeCollection: false, collectionCharge: 0, freeAbove: 0, serviceablePincodes: ['411057', '411045', '411038', '411005'],
      testsNotOffered: ['psa'], status: 'active', phone: '+91 20 2553 9090', founded: 2008,
      about: 'Walk-in diagnostic centres with in-house imaging (ultrasound, X-ray, ECG) and same-day reports.',
      centres: [
        { id: 'c-sj-shivaji', name: 'Sanjeevani Diagnostics – Shivajinagar', address: 'FC Road, Shivajinagar, Pune', pincode: '411005', lat: 18.530, lng: 73.847, hours: '7:00 AM - 9:30 PM', openNow: true, amenities: ['parking', 'wheelchair', 'ac'], distanceKm: 7.2, x: 82, y: 36 },
        { id: 'c-sj-wakad', name: 'Sanjeevani Diagnostics – Wakad', address: 'Kaspate Wasti, Wakad, Pune', pincode: '411057', lat: 18.596, lng: 73.776, hours: '7:30 AM - 9:00 PM', openNow: true, amenities: ['ac', 'wifi'], distanceKm: 1.9, x: 28, y: 58 }
      ] },
    { id: 'lab-lifeline', name: 'Lifeline Labs', initials: 'LL', color: '#0b1b3f', badges: ['NABL'], rating: 4.4, reviews: 4300,
      priceFactor: 0.9, tatDelta: 2, homeCollection: true, collectionCharge: 49, freeAbove: 699, serviceablePincodes: ['400001', '400069'],
      testsNotOffered: ['usg'], status: 'active', phone: '+91 22 6110 2200', founded: 2010,
      about: 'Metro-city lab chain with evening home collection slots.',
      centres: [{ id: 'c-ll-fort', name: 'Lifeline Labs – Fort', address: 'DN Road, Fort, Mumbai', pincode: '400001', lat: 18.933, lng: 72.835, hours: '7:00 AM - 9:00 PM', openNow: true, amenities: ['ac'], distanceKm: 1.5, x: 50, y: 50 }] },
    { id: 'lab-aarogya', name: 'Aarogya Pathology', initials: 'AP', color: '#0849c1', badges: ['NABL', 'ISO'], rating: 4.2, reviews: 640,
      priceFactor: 0.88, tatDelta: 0, homeCollection: true, collectionCharge: 39, freeAbove: 399, serviceablePincodes: ['411057', '411045', '411038'],
      testsNotOffered: ['usg', 'xray'], status: 'pending', phone: '+91 20 2771 3434', founded: 2019,
      about: 'New partner lab in Pimpri-Chinchwad with fully automated analysers. Goes live after admin approval.',
      centres: [{ id: 'c-ag-pimple', name: 'Aarogya Pathology – Pimple Saudagar', address: 'Kunal Icon Road, Pimple Saudagar, Pune', pincode: '411057', lat: 18.598, lng: 73.797, hours: '7:00 AM - 9:00 PM', openNow: true, amenities: ['parking', 'ac'], distanceKm: 3.4, x: 48, y: 70 }] }
  ];
  LT.data.labs.forEach((l) => { l.cancellationPolicy = policy; });

  LT.data.labReviews = [
    { name: 'Neha S.', rating: 5, text: 'Technician came on time and the sample was painless. Report in 10 hours.' },
    { name: 'Arjun P.', rating: 4, text: 'Clean centre and quick. Report explained clearly by the doctor on call.' },
    { name: 'Meera K.', rating: 5, text: 'Booked for my parents – they were very gentle and patient with them.' }
  ];
})();
