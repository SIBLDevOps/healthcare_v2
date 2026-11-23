/* BeyondSure – shared doctor data (used by find-doctor.html and doctor-profile.html)
   TODO: load this from the BeyondSure API instead of hard-coding it. */
(function () {
  'use strict';

  const SPECIALTIES = [
    'Ayurveda', 'Cardiologist', 'Dermatologist', 'Diabetologist', 'Endocrinologist', 'ENT Specialist',
    'Gastroenterologist', 'General Physician', 'General Surgeon', 'Gynaecologist', 'Nephrologist', 'Neurologist',
    'Nutritionist', 'Oncologist', 'Ophthalmologist', 'Orthopedician', 'Paediatrician', 'Physiotherapist',
    'Plastic Surgeon', 'Psychiatrist', 'Psychologist', 'Pulmonologist', 'Rheumatologist', 'Urologist'
  ];

  // date N days from today at hh:mm (keeps dummy slots current)
  function slotAt(dayOffset, hh, mm) {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hh, mm, 0, 0);
    return d.toISOString();
  }

  /*
    Fields
      specialty      primary specialty (used by the list filters)
      specialties    all specialties shown on the profile
      about          'NA' when the doctor has not added one
      registration   { council, number } or null when not provided
      nextSlot       ISO date of the next open slot, or null ("No open slots")
      schedule       DUMMY sample slots for the profile booking card:
                     { days: [day offsets from today], times: ['HH:MM', ...] }
  */
  const DOCTORS = [
    // ---- real data (teleconsult.bysure.in) ----
    {
      id: '8R34mb09ybbqHsKkwSf52Q', name: 'Dr. Vikrant Shinde', initials: 'VS',
      specialty: 'Ayurveda', specialties: ['Ayurveda', 'General Physician'],
      degree: 'MBBS', qualifications: ['MBBS'], exp: 10, langs: ['English', 'Marathi', 'Hindi'],
      fee: 500, feeFrom: true, about: 'NA',
      registration: { council: 'Maharashtra', number: 'A73671887' },
      nextSlot: null, schedule: null, color: 'bys-g-teal'
    },
    {
      id: 'KwZZqKPsWZ75N4nfQsD3Dw', name: 'Dr. Tejaswi K', initials: 'TK',
      specialty: 'ENT Specialist', specialties: ['ENT Specialist'],
      degree: 'MBBS', qualifications: ['MBBS'], exp: 10, langs: ['English', 'Marathi', 'Hindi'],
      fee: 450, feeFrom: false, about: 'NA', registration: null,
      nextSlot: '2026-11-18T10:00:00',
      schedule: { days: [1, 2, 4], times: ['10:00', '10:30', '11:00', '17:30'] }, // DUMMY sample slots
      color: 'bys-g-blue'
    },

    // ---- DUMMY DATA – sample doctors for layout/testing only. Remove before going live. ----
    {
      id: 'dummy-ananya-rao', dummy: true, name: 'Dr. Ananya Rao', initials: 'AR',
      specialty: 'Dermatologist', specialties: ['Dermatologist'],
      degree: 'MBBS, MD', qualifications: ['MBBS', 'MD (Dermatology)'], exp: 8, langs: ['English', 'Hindi'],
      fee: 600, feeFrom: false,
      about: 'Sample profile. Dr. Ananya Rao consults on common skin, hair and nail concerns such as acne, pigmentation and hair fall, and guides patients on everyday skin care.',
      registration: { council: 'Sample council', number: 'SAMPLE-0001' },
      nextSlot: slotAt(1, 16, 30),
      schedule: { days: [1, 2, 3, 5], times: ['16:30', '17:00', '17:30', '18:00'] },
      color: 'bys-g-navy'
    },
    {
      id: 'dummy-rahul-mehta', dummy: true, name: 'Dr. Rahul Mehta', initials: 'RM',
      specialty: 'General Physician', specialties: ['General Physician'],
      degree: 'MBBS', qualifications: ['MBBS'], exp: 15, langs: ['English', 'Hindi', 'Marathi'],
      fee: 350, feeFrom: false,
      about: 'Sample profile. Dr. Rahul Mehta helps with everyday health concerns such as fever, cold, infections and lifestyle conditions, and advises on when an in-person visit is needed.',
      registration: { council: 'Sample council', number: 'SAMPLE-0002' },
      nextSlot: slotAt(0, 18, 0),
      schedule: { days: [0, 1, 2, 3, 4], times: ['09:30', '11:00', '18:00', '19:30'] },
      color: 'bys-g-blue'
    }
  ];

  const profileUrl = (d) => `doctor-profile.html?id=${encodeURIComponent(d.id)}`;

  window.BS_DATA = { SPECIALTIES, DOCTORS, slotAt, profileUrl };
})();
