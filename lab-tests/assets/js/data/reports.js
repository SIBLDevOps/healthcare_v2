/* Lab Tests – dummy data: lab reports with parameter values.
   status: normal | borderline | abnormal ; dir: high | low (for abnormal/borderline) ; prev = previous value for trend. */
window.LT = window.LT || {}; LT.data = LT.data || {};

(function () {
  const ago = (d) => { const x = new Date(); x.setDate(x.getDate() - d); x.setHours(16, 30, 0, 0); return x.toISOString(); };
  LT.data.reports = [
    { id: 'r-1001', bookingId: 'LT-2026-004533', memberId: 'm-self', labId: 'lab-bs', date: ago(5), status: 'ready', tests: ['cbc', 'hba1c', 'lipid', 'vitd'],
      summary: '3 values need attention: LDL cholesterol and Vitamin D are outside range, HbA1c and hemoglobin are borderline. Platelets are slightly high. Please discuss these with a doctor.',
      parameters: [
        { group: 'Complete Blood Count', name: 'Hemoglobin', value: 11.2, unit: 'g/dL', low: 12, high: 15, status: 'borderline', dir: 'low', prev: 11.8 },
        { group: 'Complete Blood Count', name: 'WBC Count', value: 7.1, unit: '10³/µL', low: 4, high: 11, status: 'normal', prev: 6.8 },
        { group: 'Complete Blood Count', name: 'Platelet Count', value: 410, unit: '10³/µL', low: 150, high: 400, status: 'abnormal', dir: 'high', prev: 372 },
        { group: 'Complete Blood Count', name: 'RBC Count', value: 4.4, unit: 'million/µL', low: 3.8, high: 4.8, status: 'normal', prev: 4.5 },
        { group: 'Diabetes', name: 'HbA1c', value: 6.1, unit: '%', low: 4, high: 5.6, status: 'borderline', dir: 'high', prev: 5.8 },
        { group: 'Lipid Profile', name: 'Total Cholesterol', value: 236, unit: 'mg/dL', low: 0, high: 200, status: 'borderline', dir: 'high', prev: 221 },
        { group: 'Lipid Profile', name: 'LDL Cholesterol', value: 168, unit: 'mg/dL', low: 0, high: 130, status: 'abnormal', dir: 'high', prev: 149 },
        { group: 'Lipid Profile', name: 'HDL Cholesterol', value: 48, unit: 'mg/dL', low: 40, high: 60, status: 'normal', prev: 46 },
        { group: 'Lipid Profile', name: 'Triglycerides', value: 142, unit: 'mg/dL', low: 0, high: 150, status: 'normal', prev: 160 },
        { group: 'Vitamins', name: 'Vitamin D (25-OH)', value: 18, unit: 'ng/mL', low: 30, high: 100, status: 'abnormal', dir: 'low', prev: 21 }
      ] },
    { id: 'r-1002', bookingId: 'LT-2026-004533', memberId: 'm-mother', labId: 'lab-bs', date: ago(5), status: 'ready', tests: ['cbc', 'lipid'],
      summary: 'Most values are in the healthy range. Total cholesterol is borderline high – a diet review is suggested.',
      parameters: [
        { group: 'Complete Blood Count', name: 'Hemoglobin', value: 12.6, unit: 'g/dL', low: 12, high: 15, status: 'normal', prev: 12.1 },
        { group: 'Complete Blood Count', name: 'WBC Count', value: 6.2, unit: '10³/µL', low: 4, high: 11, status: 'normal', prev: 6.6 },
        { group: 'Complete Blood Count', name: 'Platelet Count', value: 260, unit: '10³/µL', low: 150, high: 400, status: 'normal', prev: 248 },
        { group: 'Lipid Profile', name: 'Total Cholesterol', value: 212, unit: 'mg/dL', low: 0, high: 200, status: 'borderline', dir: 'high', prev: 228 },
        { group: 'Lipid Profile', name: 'LDL Cholesterol', value: 124, unit: 'mg/dL', low: 0, high: 130, status: 'normal', prev: 139 },
        { group: 'Lipid Profile', name: 'HDL Cholesterol', value: 52, unit: 'mg/dL', low: 40, high: 60, status: 'normal', prev: 50 },
        { group: 'Lipid Profile', name: 'Triglycerides', value: 128, unit: 'mg/dL', low: 0, high: 150, status: 'normal', prev: 141 }
      ] },
    { id: 'r-1003', bookingId: 'LT-2026-004533', memberId: 'm-spouse', labId: 'lab-bs', date: ago(5), status: 'ready', tests: ['thyroid'],
      summary: 'All thyroid values are within the normal range. No action needed.',
      parameters: [
        { group: 'Thyroid Profile', name: 'Total T3', value: 1.21, unit: 'ng/mL', low: 0.8, high: 2.0, status: 'normal', prev: 1.18 },
        { group: 'Thyroid Profile', name: 'Total T4', value: 8.4, unit: 'µg/dL', low: 5.1, high: 14.1, status: 'normal', prev: 8.9 },
        { group: 'Thyroid Profile', name: 'TSH (Ultrasensitive)', value: 2.6, unit: 'µIU/mL', low: 0.27, high: 4.2, status: 'normal', prev: 3.1 }
      ] }
  ];
})();
