/* Lab Tests – dummy data: test catalogue (25 tests).
   price = base price; each lab applies its own priceFactor (see pricing.js).
   tags[] drive the category chips on search (cbc, sugar, lipid, thyroid ...). */
window.LT = window.LT || {}; LT.data = LT.data || {};

(function () {
  const commonFaq = (name) => [
    { q: 'Is home sample collection available?', a: 'Yes, for most tests a trained phlebotomist visits your home at the slot you pick. Imaging tests need a centre visit.' },
    { q: 'How will I get my ' + name + ' report?', a: 'Your report is shared on email, SMS and inside My Reports as soon as the lab releases it.' },
    { q: 'Can I eat before the test?', a: 'Follow the preparation shown on this page. If fasting is needed, only plain water is allowed.' }
  ];
  const T = (o) => Object.assign({
    sampleType: 'Blood', fastingHours: 0, tatHours: 24, homeAvailable: true, centreOnly: false,
    genderRule: 'all', minAge: 0, popularity: 50, tags: [],
    preparation: 'No special preparation needed. Stay hydrated and carry a valid ID.',
    whoShouldTake: 'Adults as part of a yearly health check, or when advised by a doctor.',
    affects: 'Recent illness, strenuous exercise, dehydration and some medicines can change results.'
  }, o, { faqs: o.faqs || commonFaq(o.short || o.name) });

  LT.data.tests = [
    T({ id: 'cbc', name: 'Complete Blood Count (CBC)', short: 'CBC', category: 'Blood Tests', tags: ['blood', 'cbc'], parameters: 24, tatHours: 12, mrp: 450, price: 299, popularity: 98,
      description: 'Checks red cells, white cells and platelets to spot anaemia, infection and other blood conditions.',
      parametersList: ['Hemoglobin', 'RBC Count', 'WBC Count', 'Platelet Count', 'Hematocrit (PCV)', 'MCV', 'MCH', 'MCHC', 'RDW', 'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils'],
      whoShouldTake: 'Anyone with tiredness, fever or weakness, and everyone as a yearly baseline.' }),
    T({ id: 'cbc-esr', name: 'CBC + ESR', short: 'CBC + ESR', category: 'Blood Tests', tags: ['blood', 'cbc'], parameters: 25, tatHours: 12, mrp: 520, price: 349, popularity: 80,
      description: 'Complete blood count with ESR, a marker that rises with inflammation in the body.',
      parametersList: ['Hemoglobin', 'RBC Count', 'WBC Count', 'Platelet Count', 'Differential Count', 'ESR (Erythrocyte Sedimentation Rate)'] }),
    T({ id: 'hba1c', name: 'HbA1c (Glycated Haemoglobin)', short: 'HbA1c', category: 'Diabetes', tags: ['diabetes', 'sugar'], parameters: 3, tatHours: 12, mrp: 600, price: 399, popularity: 95,
      description: 'Shows your average blood sugar over the last 3 months. Key test to diagnose and track diabetes.',
      parametersList: ['HbA1c', 'Estimated Average Glucose (eAG)', 'Interpretation'],
      whoShouldTake: 'People with diabetes every 3 months, and adults over 30 with a family history.' }),
    T({ id: 'fbs', name: 'Fasting Blood Sugar (FBS)', short: 'FBS', category: 'Diabetes', tags: ['diabetes', 'sugar'], parameters: 1, fastingHours: 10, tatHours: 6, mrp: 150, price: 99, popularity: 90,
      description: 'Measures blood glucose after an overnight fast to screen for diabetes and prediabetes.',
      parametersList: ['Glucose, Fasting'], preparation: 'Fast for 10-12 hours before the test. Only plain water is allowed.' }),
    T({ id: 'ppbs', name: 'Post Prandial Blood Sugar (PPBS)', short: 'PPBS', category: 'Diabetes', tags: ['diabetes', 'sugar'], parameters: 1, tatHours: 6, mrp: 150, price: 99, popularity: 70,
      description: 'Blood glucose measured 2 hours after a meal to see how well your body handles sugar.',
      parametersList: ['Glucose, Post Prandial'], preparation: 'Give the sample exactly 2 hours after starting a normal meal.' }),
    T({ id: 'lipid', name: 'Lipid Profile', short: 'Lipid Profile', category: 'Heart Health', tags: ['heart', 'lipid'], parameters: 8, fastingHours: 12, tatHours: 12, mrp: 900, price: 499, popularity: 93,
      description: 'Measures cholesterol and triglycerides to assess your risk of heart disease and stroke.',
      parametersList: ['Total Cholesterol', 'HDL Cholesterol', 'LDL Cholesterol', 'VLDL Cholesterol', 'Triglycerides', 'Non-HDL Cholesterol', 'TC/HDL Ratio', 'LDL/HDL Ratio'],
      preparation: 'Fast for 10-12 hours. Avoid alcohol and fatty food for 24 hours before the test.' }),
    T({ id: 'thyroid', name: 'Thyroid Profile (T3, T4, TSH)', short: 'Thyroid Profile', category: 'Thyroid', tags: ['thyroid', 'hormones'], parameters: 3, tatHours: 12, mrp: 800, price: 449, popularity: 92,
      description: 'Checks how well your thyroid gland works. Helps detect hypo- and hyperthyroidism.',
      parametersList: ['Total T3', 'Total T4', 'TSH (Ultrasensitive)'], preparation: 'Best taken in the morning. Take thyroid medicine after the sample.' }),
    T({ id: 'lft', name: 'Liver Function Test (LFT)', short: 'LFT', category: 'Liver', tags: ['liver'], parameters: 11, tatHours: 12, mrp: 950, price: 549, popularity: 78,
      description: 'Checks enzymes and proteins made by your liver to find liver inflammation or damage.',
      parametersList: ['Bilirubin Total', 'Bilirubin Direct', 'Bilirubin Indirect', 'SGOT (AST)', 'SGPT (ALT)', 'Alkaline Phosphatase', 'GGT', 'Total Protein', 'Albumin', 'Globulin', 'A/G Ratio'] }),
    T({ id: 'kft', name: 'Kidney Function Test (KFT)', short: 'KFT', category: 'Kidney', tags: ['kidney'], parameters: 9, tatHours: 12, mrp: 950, price: 549, popularity: 76,
      description: 'Measures urea, creatinine and electrolytes to check how well your kidneys filter blood.',
      parametersList: ['Urea', 'Creatinine', 'BUN', 'Uric Acid', 'Sodium', 'Potassium', 'Chloride', 'Calcium', 'eGFR'] }),
    T({ id: 'urine', name: 'Urine Routine & Microscopy', short: 'Urine Routine', category: 'Kidney', tags: ['kidney', 'infection'], sampleType: 'Urine', parameters: 20, tatHours: 8, mrp: 250, price: 149, popularity: 72,
      description: 'Screens urine for infection, sugar, protein and kidney problems.',
      parametersList: ['Colour', 'Appearance', 'pH', 'Specific Gravity', 'Protein', 'Glucose', 'Ketones', 'Pus Cells', 'RBCs', 'Epithelial Cells', 'Casts', 'Crystals'],
      preparation: 'Collect a mid-stream sample of the first morning urine in the sterile container.' }),
    T({ id: 'vitd', name: 'Vitamin D (25-OH)', short: 'Vitamin D', category: 'Vitamins', tags: ['vitamins'], parameters: 1, tatHours: 24, mrp: 2000, price: 1199, popularity: 88,
      description: 'Measures the main form of vitamin D in blood. Low levels affect bones, immunity and mood.',
      parametersList: ['25-Hydroxy Vitamin D'] }),
    T({ id: 'vitd-total', name: 'Vitamin D Total (D2 + D3)', short: 'Vitamin D Total', category: 'Vitamins', tags: ['vitamins'], parameters: 3, tatHours: 36, mrp: 2200, price: 1299, popularity: 40,
      description: 'Separately measures vitamin D2 and D3 for people on supplements or with absorption issues.',
      parametersList: ['Vitamin D2', 'Vitamin D3', 'Total Vitamin D'] }),
    T({ id: 'b12', name: 'Vitamin B12', short: 'Vitamin B12', category: 'Vitamins', tags: ['vitamins'], parameters: 1, tatHours: 24, mrp: 1500, price: 899, popularity: 82,
      description: 'Low B12 causes tiredness, tingling and memory problems. Common in vegetarians.',
      parametersList: ['Cyanocobalamin (Vitamin B12)'] }),
    T({ id: 'iron', name: 'Iron Studies', short: 'Iron Studies', category: 'Blood Tests', tags: ['blood'], parameters: 4, fastingHours: 8, tatHours: 24, mrp: 1300, price: 799, popularity: 60,
      description: 'Checks iron stores in your body to find iron deficiency or overload.',
      parametersList: ['Serum Iron', 'TIBC', 'Transferrin Saturation', 'Ferritin'], preparation: 'Fast for 8 hours. Stop iron supplements 24 hours before.' }),
    T({ id: 'calcium', name: 'Calcium, Serum', short: 'Calcium', category: 'Vitamins', tags: ['vitamins'], parameters: 1, tatHours: 8, mrp: 350, price: 199, popularity: 55,
      description: 'Measures calcium in blood, important for bones, nerves and heart rhythm.', parametersList: ['Calcium, Total'] }),
    T({ id: 'uric', name: 'Uric Acid', short: 'Uric Acid', category: 'Kidney', tags: ['kidney'], parameters: 1, tatHours: 8, mrp: 320, price: 199, popularity: 58,
      description: 'High uric acid can cause gout (painful joints) and kidney stones.', parametersList: ['Uric Acid, Serum'] }),
    T({ id: 'crp', name: 'C-Reactive Protein (CRP)', short: 'CRP', category: 'Heart Health', tags: ['heart', 'infection'], parameters: 1, tatHours: 8, mrp: 700, price: 449, popularity: 62,
      description: 'A general marker of inflammation or infection in the body.', parametersList: ['CRP, Quantitative'] }),
    T({ id: 'dengue', name: 'Dengue NS1 Antigen', short: 'Dengue NS1', category: 'Infection', tags: ['infection'], parameters: 1, tatHours: 6, mrp: 1000, price: 699, popularity: 66,
      description: 'Detects dengue in the first 1-5 days of fever.', parametersList: ['Dengue NS1 Antigen'],
      whoShouldTake: 'Anyone with sudden high fever, body ache or rash, especially during monsoon.' }),
    T({ id: 'malaria', name: 'Malaria Antigen (Rapid)', short: 'Malaria Antigen', category: 'Infection', tags: ['infection'], parameters: 2, tatHours: 6, mrp: 700, price: 449, popularity: 50,
      description: 'Rapid test for P. vivax and P. falciparum malaria.', parametersList: ['P. vivax Antigen', 'P. falciparum Antigen'] }),
    T({ id: 'psa', name: 'PSA (Prostate Specific Antigen)', short: 'PSA', category: 'Hormones', tags: ['hormones'], parameters: 1, tatHours: 24, mrp: 1200, price: 799, popularity: 45, genderRule: 'male', minAge: 40,
      description: 'Screens for prostate problems in men over 40.', parametersList: ['PSA, Total'], whoShouldTake: 'Men above 40 years, or earlier with a family history.' }),
    T({ id: 'bhcg', name: 'Pregnancy Test (Beta-hCG)', short: 'Beta-hCG', category: 'Hormones', tags: ['hormones'], parameters: 1, tatHours: 8, mrp: 800, price: 499, popularity: 48, genderRule: 'female', minAge: 12,
      description: 'Blood test that confirms pregnancy early and accurately.', parametersList: ['Beta-hCG, Quantitative'] }),
    T({ id: 'usg', name: 'Ultrasound Abdomen & Pelvis', short: 'Ultrasound Abdomen', category: 'Imaging', tags: ['imaging'], sampleType: 'Imaging scan', parameters: 1, fastingHours: 6, tatHours: 4, homeAvailable: false, centreOnly: true, mrp: 2200, price: 1499, popularity: 64,
      description: 'Painless scan of liver, kidneys, gall bladder, uterus and other abdominal organs.', parametersList: ['Radiologist report with images'],
      preparation: 'Fast for 6 hours. Drink 4-5 glasses of water 1 hour before and do not pass urine.' }),
    T({ id: 'xray', name: 'Chest X-Ray (PA View)', short: 'Chest X-Ray', category: 'Imaging', tags: ['imaging'], sampleType: 'Imaging scan', parameters: 1, tatHours: 4, homeAvailable: false, centreOnly: true, mrp: 650, price: 399, popularity: 52,
      description: 'Picture of the chest to check lungs and heart size.', parametersList: ['Radiologist report with film'], preparation: 'Remove metal items. Tell staff if you might be pregnant.' }),
    T({ id: 'ecg', name: 'ECG (Electrocardiogram)', short: 'ECG', category: 'Imaging', tags: ['imaging', 'heart'], sampleType: 'Imaging scan', parameters: 1, tatHours: 4, homeAvailable: false, centreOnly: true, mrp: 500, price: 299, popularity: 57,
      description: 'Records the electrical activity of your heart to check rhythm.', parametersList: ['12-lead ECG with cardiologist note'] }),
    T({ id: 'testosterone', name: 'Testosterone, Total', short: 'Testosterone', category: 'Hormones', tags: ['hormones'], parameters: 1, tatHours: 24, mrp: 1100, price: 699, popularity: 42, minAge: 12,
      description: 'Male hormone that affects energy, muscle and fertility. Also checked in women with PCOS.', parametersList: ['Testosterone, Total'],
      preparation: 'Give the sample between 7 and 10 AM.' })
  ];

  /* filter chips shown on search (key must exist in test.tags) */
  LT.data.chips = [
    { key: 'cbc', label: 'CBC', icon: 'bi-droplet' }, { key: 'sugar', label: 'Blood Sugar', icon: 'bi-droplet-half' },
    { key: 'lipid', label: 'Lipid', icon: 'bi-heart' }, { key: 'thyroid', label: 'Thyroid', icon: 'bi-activity' },
    { key: 'vitamins', label: 'Vitamins', icon: 'bi-sun' }, { key: 'heart', label: 'Heart', icon: 'bi-heart-pulse' },
    { key: 'hormones', label: 'Hormones', icon: 'bi-gender-ambiguous' }, { key: 'infection', label: 'Infection', icon: 'bi-virus' },
    { key: 'imaging', label: 'Imaging', icon: 'bi-camera' }
  ];
  /* specialties (categories) */
  LT.data.categories = [
    { key: 'blood', label: 'Blood Tests', icon: 'bi-droplet', color: 'blood' },
    { key: 'diabetes', label: 'Diabetes', icon: 'bi-droplet-half', color: 'diabetes' },
    { key: 'heart', label: 'Heart Health', icon: 'bi-heart-pulse', color: 'blood' },
    { key: 'thyroid', label: 'Thyroid', icon: 'bi-activity', color: 'imaging' },
    { key: 'liver', label: 'Liver', icon: 'bi-shield-plus', color: 'metabolism' },
    { key: 'kidney', label: 'Kidney', icon: 'bi-funnel', color: 'bone' },
    { key: 'hormones', label: 'Hormones', icon: 'bi-gender-ambiguous', color: 'imaging' },
    { key: 'vitamins', label: 'Vitamins', icon: 'bi-sun', color: 'metabolism' },
    { key: 'infection', label: 'Infection', icon: 'bi-virus', color: 'blood' },
    { key: 'imaging', label: 'Imaging', icon: 'bi-camera', color: 'imaging' }
  ];
})();
