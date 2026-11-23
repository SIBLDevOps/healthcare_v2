/* Lab Tests – dummy data: health packages (6).
   tests[] are ids from tests.js. Some overlap with single tests on purpose
   (CBC, Lipid, HbA1c) to demo the duplicate / package-overlap warnings. */
window.LT = window.LT || {}; LT.data = LT.data || {};

LT.data.packages = [
  { id: 'pkg-fullbody', name: 'Full Body Checkup', lifeStage: 'adult', lifeLabel: 'Adults 25-45', parameters: 68, fastingHours: 10, tatHours: 24, mrp: 2999, price: 1499, popularity: 99, badge: 'Bestseller',
    tests: ['cbc', 'lipid', 'lft', 'kft', 'thyroid', 'fbs', 'urine', 'vitd'],
    description: 'Our most complete yearly check covering blood, heart, liver, kidney, thyroid, sugar and vitamin D.' },
  { id: 'pkg-diabetes', name: 'Diabetes Care Package', lifeStage: 'diabetes', lifeLabel: 'Diabetes care', parameters: 43, fastingHours: 10, tatHours: 24, mrp: 1800, price: 999, popularity: 86, badge: 'Doctor recommended',
    tests: ['hba1c', 'fbs', 'ppbs', 'kft', 'urine', 'lipid'],
    description: 'Tracks sugar control and checks the organs diabetes affects most: kidney and heart.' },
  { id: 'pkg-heart', name: 'Heart Health Package', lifeStage: 'heart', lifeLabel: 'Heart care', parameters: 43, fastingHours: 12, tatHours: 24, mrp: 2400, price: 1299, popularity: 74,
    tests: ['lipid', 'crp', 'cbc', 'kft', 'fbs'],
    description: 'Cholesterol, inflammation and sugar markers that together show your heart risk.' },
  { id: 'pkg-women', name: "Women's Wellness Package", lifeStage: 'women', lifeLabel: 'Women', parameters: 34, fastingHours: 8, tatHours: 24, mrp: 3800, price: 1999, popularity: 81,
    tests: ['cbc', 'thyroid', 'vitd', 'b12', 'iron', 'calcium'],
    description: 'Checks thyroid, anaemia, bone health and vitamins – the most common gaps in women.' },
  { id: 'pkg-senior', name: 'Senior Citizen Package', lifeStage: 'senior', lifeLabel: 'Age 60+', parameters: 82, fastingHours: 12, tatHours: 24, mrp: 4999, price: 2499, popularity: 77,
    tests: ['cbc-esr', 'lipid', 'lft', 'kft', 'hba1c', 'vitd', 'b12', 'uric', 'calcium', 'urine'],
    description: 'A thorough yearly review for parents and grandparents, including bones, sugar and organs.' },
  { id: 'pkg-young', name: 'Young Adult Baseline', lifeStage: 'young', lifeLabel: 'Age 18-30', parameters: 62, fastingHours: 10, tatHours: 24, mrp: 2800, price: 1499, popularity: 90, badge: 'New',
    tests: ['cbc', 'lipid', 'thyroid', 'fbs', 'vitd', 'b12'],
    description: 'Your first full health baseline. Know your numbers early and keep them on file.' }
];

LT.data.lifeStages = [
  { key: 'all', label: 'All' }, { key: 'young', label: 'Young adults' }, { key: 'adult', label: 'Adults' },
  { key: 'women', label: 'Women' }, { key: 'senior', label: 'Seniors' }, { key: 'diabetes', label: 'Diabetes' }, { key: 'heart', label: 'Heart' }
];
