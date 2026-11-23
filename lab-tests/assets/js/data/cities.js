/* Lab Tests – dummy data: cities, areas, pincodes and serviceability.
   Read ONLY through LT.api (searchLocations / checkServiceability). */
window.LT = window.LT || {}; LT.data = LT.data || {};

LT.data.cities = [
  { city: 'Pune', icon: 'bi-buildings', areas: [
    { area: 'Wakad', pincode: '411057', lat: 18.5975, lng: 73.7707 },
    { area: 'Hinjewadi', pincode: '411057', lat: 18.5913, lng: 73.7389 },
    { area: 'Baner', pincode: '411045', lat: 18.5590, lng: 73.7868 },
    { area: 'Kothrud', pincode: '411038', lat: 18.5074, lng: 73.8077 },
    { area: 'Shivajinagar', pincode: '411005', lat: 18.5308, lng: 73.8475 },
    { area: 'Viman Nagar', pincode: '411014', lat: 18.5679, lng: 73.9143 }
  ] },
  { city: 'Mumbai', icon: 'bi-water', areas: [
    { area: 'Fort', pincode: '400001', lat: 18.9330, lng: 72.8350 },
    { area: 'Andheri East', pincode: '400069', lat: 19.1136, lng: 72.8697 }
  ] },
  { city: 'Delhi', icon: 'bi-bank', areas: [{ area: 'Connaught Place', pincode: '110001', lat: 28.6315, lng: 77.2167 }] },
  { city: 'Bangalore', icon: 'bi-tree', areas: [{ area: 'MG Road', pincode: '560001', lat: 12.9756, lng: 77.6050 }] },
  { city: 'Hyderabad', icon: 'bi-gem', areas: [{ area: 'Abids', pincode: '500001', lat: 17.3920, lng: 78.4760 }] },
  { city: 'Chennai', icon: 'bi-sun', areas: [{ area: 'George Town', pincode: '600001', lat: 13.0950, lng: 80.2870 }] },
  { city: 'Kolkata', icon: 'bi-signpost-split', areas: [{ area: 'BBD Bagh', pincode: '700001', lat: 22.5720, lng: 88.3510 }] },
  { city: 'Ahmedabad', icon: 'bi-flower2', areas: [{ area: 'Lal Darwaja', pincode: '380001', lat: 23.0260, lng: 72.5800 }] },
  { city: 'Dhule', icon: 'bi-geo', areas: [{ area: 'Dhule City', pincode: '424001', lat: 20.9042, lng: 74.7749 }] },
  { city: 'Nashik', icon: 'bi-geo', areas: [{ area: 'College Road', pincode: '422005', lat: 20.0059, lng: 73.7629 }] },
  { city: 'Nagpur', icon: 'bi-geo', areas: [{ area: 'Sitabuldi', pincode: '440012', lat: 21.1458, lng: 79.0882 }] },
  { city: 'Jaipur', icon: 'bi-geo', areas: [{ area: 'MI Road', pincode: '302001', lat: 26.9124, lng: 75.7873 }] }
];

/* We currently serve ONLY Pune and Mumbai. Every other city / pincode is "not available"
   and the location popup asks the user to change location. */
LT.data.servedCities = ['Pune', 'Mumbai'];

/* pincode -> what we can serve there. Anything not listed is not serviceable. */
LT.data.serviceability = {
  '411057': { home: true, lab: true },
  '411045': { home: true, lab: true },
  '411038': { home: true, lab: true },
  '411014': { home: true, lab: false },
  '411005': { home: false, lab: true },
  '400001': { home: true, lab: true },
  '400069': { home: true, lab: true }
};
