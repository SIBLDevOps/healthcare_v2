/* Lab Tests – dummy data: demo user + family members.
   Seeded into localStorage on first load (see store.js). Owner = demo user's mobile. */
window.LT = window.LT || {}; LT.data = LT.data || {};

LT.data.demoUser = { id: 'u-1001', name: 'Riya Malhotra', mobile: '9876543210' };

LT.data.members = [
  { id: 'm-self', owner: '9876543210', name: 'Riya Malhotra', relationship: 'Self', dob: '1995-06-18', gender: 'female', mobile: '9876543210', email: 'riya.malhotra@example.in', permission: true, status: 'active' },
  { id: 'm-spouse', owner: '9876543210', name: 'Karan Malhotra', relationship: 'Spouse', dob: '1991-02-09', gender: 'male', mobile: '9811045672', email: 'karan.malhotra@example.in', permission: true, status: 'active' },
  { id: 'm-child', owner: '9876543210', name: 'Ishaan Malhotra', relationship: 'Child', dob: '2019-09-14', gender: 'male', mobile: '9876543210', email: '', permission: true, status: 'active' },
  { id: 'm-mother', owner: '9876543210', name: 'Usha Bhatia', relationship: 'Mother', dob: '1964-11-03', gender: 'female', mobile: '9899023418', email: '', permission: true, status: 'active' },
  { id: 'm-father', owner: '9876543210', name: 'Rajesh Bhatia', relationship: 'Father', dob: '1960-04-22', gender: 'male', mobile: '9899023419', email: '', permission: true, status: 'active' }
];
