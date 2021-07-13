// Activated Districts
export const ACTIVATED_DISTRICTS = [
  { id: 15, name: "Adilabad", lat: 19.675_945_2, lng: 78.533_989_5, zoom: 13 },
  { id: 16, name: "Mancherial", lat: 18.876_179_5, lng: 79.444_969_6, zoom: 13 },
  { id: 17, name: "Nirmal", lat: 19.092_174_9, lng: 78.348_872_5, zoom: 13 },
  { id: 19, name: "Nizamabad", lat: 18.673_269_3, lng: 78.097_847_7, zoom: 13 },
  { id: 26, name: "Narayanpet", lat: 16.744_511, lng: 77.496_010, zoom: 13 },
  { id: 30, name: "Bhadradri Kothagudem", lat: 18.359_301, lng: 80.559_067, zoom: 13 },
  { id: 35, name: "Hyderabad", lat: 17.360_589, lng: 78.474_061_3, zoom: 13 },
  { id: 32, name: "Jagitial", lat: 18.797_126_9, lng: 78.922_472_7, zoom: 13 },
  { id: 40, name: "Jangoan", lat: 17.755_791_9, lng: 79.132_389_6, zoom: 13 },
  { id: 43, name: "Jayashankar Bhupalapally", lat: 18.515_987_1, lng: 79.969_396_5, zoom: 13 },
  { id: 27, name: "Jogulamba Gadwal", lat: 16.099_920_2, lng: 77.734_158_3, zoom: 13 },
  { id: 20, name: "Kamareddy", lat: 18.316_551, lng: 78.053_938_0, zoom: 13 },
  { id: 33, name: "Karimnagar", lat: 18.434_643_8, lng: 79.132_264_8, zoom: 13 },
  { id: 29, name: "Khammam", lat: 17.246_535_1, lng: 80.150_032_6, zoom: 13 },
  { id: 18, name: "Kumuram Bheem Asifabad", lat: 19.350_478_1, lng: 79.218_760_2, zoom: 13 },
  { id: 45, name: "Mahabubabad", lat: 17.713_898_3, lng: 80.041_342_5, zoom: 13 },
  { id: 25, name: "Mahabubnagar", lat: 16.696_568_5, lng: 77.959_114_6, zoom: 13 },
  { id: 22, name: "Medak", lat: 18.045_879_2, lng: 78.265_199_3, zoom: 13 },
  { id: 46, name: "Medchal Malkajgiri", lat: 17.534_983_4, lng: 78.524_638_7, zoom: 13 },
  { id: 36, name: "Nagarkurnool", lat: 16.415_762_6, lng: 78.683_043_3, zoom: 13 },
  { id: 39, name: "Nalgonda", lat: 17.050_440_6, lng: 79.266_923_5, zoom: 13 },
  { id: 31, name: "Peddapalli", lat: 18.620_653, lng: 79.495_017_1, zoom: 13 },
  { id: 34, name: "Rajanna Sircilla", lat: 18.452_116, lng: 78.764_558_3, zoom: 13 },
  { id: 44, name: "Ranga Reddy", lat: 17.340_789_1, lng: 78.546_100_9, zoom: 13 },
  { id: 21, name: "Sangareddy", lat: 17.868_592, lng: 77.822_819_9, zoom: 13 },
  { id: 23, name: "Siddipet", lat: 18.101_773_9, lng: 78.852_012_8, zoom: 13 },
  { id: 38, name: "Suryapet", lat: 17.140_532_8, lng: 79.622_510_5, zoom: 13 },
  { id: 24, name: "Vikarabad", lat: 17.270_285_5, lng: 77.745_297, zoom: 13 },
  { id: 28, name: "Wanaparthy", lat: 16.285_294_3, lng: 77.986_447_2, zoom: 13 },
  { id: 42, name: "Warangal Rural", lat: 17.948_542_5, lng: 79.816_123_9, zoom: 13 },
  { id: 41, name: "Warangal Urban", lat: 18.026_256_9, lng: 79.464_444_9, zoom: 13 },
  { id: 37, name: "Yadadri Bhuvanagiri", lat: 17.428_196_6, lng: 79.090_490_9, zoom: 13 },
];

export const GMAP_KEY = "AIzaSyADqpKqZOggMr33usQvZ5hml3tyWZ6SCMc";

export const AVAILABILITY_TYPES_ORDERED = [
  1, 150, 10, 20, 30, 120, 110, 100, 40, 60, 50, 70,
];

export const ORDINARY = [4444, 30, 1, 4];
export const OXYGEN = [3333, 120, 150, 60];
export const ICU = [2222, 110, 10, 50];
export const VENTILATOR = [1111, 100, 20, 70];

export const AVAILABILITY_TYPES_TOTAL_ORDERED = [
  { id: 4444, name: "Ordinary Bed", non_covid: 1, covid: 30 },
  { id: 3333, name: "Oxygen Beds", non_covid: 150, covid: 120 },
  { id: 2222, name: "ICU", non_covid: 10, covid: 110 },
  { id: 1111, name: "Ventilator", non_covid: 20, covid: 100 },
];

export const AVAILABILITY_TYPES = {
  20: "Non-Covid Ventilator",
  10: "Non-Covid ICU",
  150: "Non-Covid Oxygen Beds",
  1: "Non-Covid Ordinary Bed",
  70: "KASP Ventilator",
  50: "KASP ICU",
  60: "KASP Oxygen Beds",
  40: "KASP Ordinary Bed",
  100: "Covid ICU w/ Ventilator",
  110: "Covid ICU",
  120: "Covid Oxygen Beds",
  30: "Covid Ordinary Bed",
};

export const AVAILABILITY_TYPES_PROXY = {
  20: "Non-Covid",
  10: "Non-Covid",
  150: "Non-Covid",
  1: "Non-Covid",
  70: "KASP",
  50: "KASP",
  60: "KASP",
  40: "KASP",
  100: "Covid",
  110: "Covid",
  120: "Covid",
  30: "Covid",
};

export const PATIENT_TYPES = {
  home_isolation: "Home Isolation",
  isolation_room: "Isolation Room",
  bed_with_oxygen_support: "Bed with Oxygen Support",
  icu: "ICU",
  icu_with_oxygen_support: "ICU with Oxygen Support",
  icu_with_non_invasive_ventilator: "ICU with Non Invasive ventilator",
  icu_with_invasive_ventilator: "ICU with Invasive ventilator",
  gynaecology_ward: "Gynaecology Ward",
  paediatric_ward: "Paediatric Ward",
};

export const TESTS_TYPES = {
  result_awaited: "Result awaited",
  test_discarded: "Tests discarded",
  total_patients: "Total patients",
  result_negative: "Negative results",
  result_positive: "Positive results",
};

export const TRIAGE_TYPES = {
  avg_patients_visited: "Average patients visited",
  avg_patients_referred: "Average patients referred",
  avg_patients_isolation: "Average patients isolation",
  avg_patients_home_quarantine: "Average patients home quarantine",
  total_patients_visited: "Total patients visited",
  total_patients_referred: "Total patients referred",
  total_patients_isolation: "Total patients isolation",
  total_patients_home_quarantine: "Total patients home quarantine",
};

export const GOVT_FACILITY_TYPES = [
  "Govt Hospital",
  "Primary Health Centres",
  "24x7 Public Health Centres",
  "Family Health Centres",
  "Community Health Centres",
  "Urban Primary Health Center",
  "Taluk Hospitals",
  "Taluk Headquarters Hospitals",
  "Women and Child Health Centres",
  "General hospitals",
  "District Hospitals",
  "Govt Medical College Hospitals",
];

export const FACILITY_TYPES = [
  ...GOVT_FACILITY_TYPES,
  "Private Hospital",
  "First Line Treatment Centre",
  "Second Line Treatment Center",
  "COVID-19 Domiciliary Care Center",
  "Corona Care Centre",
  "Covid Management Center",
  "Shifting Centre",
  "TeleMedicine",
];

// Table title
export const OXYGEN_TYPES = {
  liquid: "Liquid Oxygen",
  type_d: "Cylinder D",
  type_c: "Cylinder C",
  type_b: "Cylinder B",
};
// ID from care DB
export const OXYGEN_INVENTORY = {
  liquid: 2,
  type_d: 4,
  type_c: 6,
  type_b: 5,
};
// Reverse Dict for OXYGEN_INVENTORY
export const OXYGEN_TYPES_KEYS = Object.entries(OXYGEN_INVENTORY).reduce(
  (acc, [key, value]) => acc && { ...acc, [value]: key },
  {}
);

// Name from care DB, used to compute district summary
export const OXYGEN_INVENTORY_NAME = {
  liquid: "Liquid Oxygen",
  type_d: "Jumbo D Type Oxygen Cylinder",
  type_c: "C Type Oxygen Cylinder",
  type_b: "B Type Oxygen Cylinder",
};

export const OXYGEN_CAPACITY_TRANSLATION = {
  liquid: "oxygenCapacity",
  type_d: "type_d_cylinders",
  type_c: "type_c_cylinders",
  type_b: "type_b_cylinders",
};

export const CONTENT = {
  CAPACITY: 1,
  PATIENT: 2,
  TESTS: 3,
  TRIAGE: 4,
  LSG: 6,
  OXYGEN: 7,
  MAP: 8,
};
