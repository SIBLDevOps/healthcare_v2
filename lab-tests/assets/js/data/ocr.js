/* Lab Tests – dummy data: fixed OCR result returned for ANY uploaded prescription. */
window.LT = window.LT || {}; LT.data = LT.data || {};

LT.data.ocr = {
  doctor: 'Dr. Ananya Mehta',
  date: '2024-09-18',
  matched: [
    { raw: 'CBC', testId: 'cbc', confidence: 0.97 },
    { raw: 'HbA1c', testId: 'hba1c', confidence: 0.95 },
    { raw: 'Lipid Profile', testId: 'lipid', confidence: 0.93 }
  ],
  unclear: [{ raw: 'Vit D', options: ['vitd', 'vitd-total'] }],
  unrecognised: ['Serum xyz panel']
};
