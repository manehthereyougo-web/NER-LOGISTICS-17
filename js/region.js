const NE_STATES = [
  {
    id: "arunachal-pradesh",
    name: "Arunachal Pradesh",
    capital: "Itanagar",
    center: { lat: 27.0844, lng: 93.6053 },
    corridor: "NH-415 · Itanagar → Tezpur"
  },
  {
    id: "assam",
    name: "Assam",
    capital: "Dispur",
    center: { lat: 26.1445, lng: 91.7362 },
    corridor: "NH-27 · Guwahati → Dibrugarh"
  },
  {
    id: "manipur",
    name: "Manipur",
    capital: "Imphal",
    center: { lat: 24.817, lng: 93.9368 },
    corridor: "NH-37 · Imphal → Silchar"
  },
  {
    id: "meghalaya",
    name: "Meghalaya",
    capital: "Shillong",
    center: { lat: 25.5788, lng: 91.8933 },
    corridor: "NH-6 · Guwahati → Shillong"
  },
  {
    id: "mizoram",
    name: "Mizoram",
    capital: "Aizawl",
    center: { lat: 23.7271, lng: 92.7176 },
    corridor: "NH-54 · Aizawl → Silchar"
  },
  {
    id: "nagaland",
    name: "Nagaland",
    capital: "Kohima",
    center: { lat: 25.6751, lng: 94.1086 },
    corridor: "NH-2 · Dimapur → Kohima"
  },
  {
    id: "sikkim",
    name: "Sikkim",
    capital: "Gangtok",
    center: { lat: 27.3314, lng: 88.6138 },
    corridor: "NH-10 · Gangtok → Rangpo"
  },
  {
    id: "tripura",
    name: "Tripura",
    capital: "Agartala",
    center: { lat: 23.8315, lng: 91.2868 },
    corridor: "NH-8 · Agartala → Silchar"
  },
];

const NE_DISTRICTS_LIST = [
  { district: "Kamrup Metropolitan", state: "Assam" },
  { district: "Kamrup Rural", state: "Assam" },
  { district: "Dibrugarh", state: "Assam" },
  { district: "Cachar (Silchar)", state: "Assam" },
  { district: "Nagaon", state: "Assam" },
  { district: "Sonitpur (Tezpur)", state: "Assam" },
  { district: "Jorhat", state: "Assam" },
  { district: "Dima Hasao (Haflong)", state: "Assam" },
  { district: "East Khasi Hills (Shillong)", state: "Meghalaya" },
  { district: "West Khasi Hills", state: "Meghalaya" },
  { district: "East Jaintia Hills", state: "Meghalaya" },
  { district: "West Garo Hills (Tura)", state: "Meghalaya" },
  { district: "Papum Pare (Itanagar)", state: "Arunachal Pradesh" },
  { district: "Tawang", state: "Arunachal Pradesh" },
  { district: "East Siang (Pasighat)", state: "Arunachal Pradesh" },
  { district: "West Kameng (Bomdila)", state: "Arunachal Pradesh" },
  { district: "Imphal West", state: "Manipur" },
  { district: "Imphal East", state: "Manipur" },
  { district: "Jiribam", state: "Manipur" },
  { district: "Churachandpur", state: "Manipur" },
  { district: "Kohima", state: "Nagaland" },
  { district: "Dimapur", state: "Nagaland" },
  { district: "Mokokchung", state: "Nagaland" },
  { district: "Aizawl", state: "Mizoram" },
  { district: "Lunglei", state: "Mizoram" },
  { district: "Kolasib", state: "Mizoram" },
  { district: "West Tripura (Agartala)", state: "Tripura" },
  { district: "Gomati (Udaipur)", state: "Tripura" },
  { district: "North Tripura (Dharmanagar)", state: "Tripura" },
  { district: "East Sikkim (Gangtok)", state: "Sikkim" },
  { district: "South Sikkim (Namchi)", state: "Sikkim" },
  { district: "North Sikkim (Mangan)", state: "Sikkim" },
];
window.NE_DISTRICTS_LIST = NE_DISTRICTS_LIST;

const FREQUENT_DANGER_ROADS = [
  {
    id: "sonapur-tunnel",
    name: "Sonapur Tunnel & East Jaintia Hills",
    highway: "NH-6 (Meghalaya)",
    riskLevel: "risk",
    riskTitle: "Landslide & Mudslip Hotspot",
    description: "Heavy rain destabilizes hill face; primary freight corridor to Silchar & Mizoram.",
    lat: 25.12,
    lng: 92.36,
    traffic: "High Freight Volume"
  },
  {
    id: "sela-pass",
    name: "Sela Pass High Altitude Pass",
    highway: "NH-13 (Arunachal)",
    riskLevel: "risk",
    riskTitle: "Snowfall & Black Ice Zone",
    description: "Elevation 13,700 ft; sudden ice formation and dense fog impair heavy truck stability.",
    lat: 27.50,
    lng: 92.10,
    traffic: "Strategic & Supply Corridor"
  },
  {
    id: "imphal-jiribam",
    name: "Imphal–Jiribam Mountain Section",
    highway: "NH-37 (Manipur)",
    riskLevel: "risk",
    riskTitle: "Road Sinkhole & Sinking Soil",
    description: "Frequent road bed collapse during monsoon; essential supply line into Imphal Valley.",
    lat: 24.78,
    lng: 93.45,
    traffic: "Heavy Cargo Trunk"
  },
  {
    id: "rangpo-teesta",
    name: "Rangpo–Teesta River Gorge",
    highway: "NH-10 (Sikkim)",
    riskLevel: "caution",
    riskTitle: "River Erosion & Falling Boulders",
    description: "Teesta river undercut and unstable cliffs cause frequent single-lane restrictions.",
    lat: 27.17,
    lng: 88.52,
    traffic: "High Tourist & Freight Traffic"
  },
  {
    id: "guwahati-dibrugarh",
    name: "Guwahati–Nagaon–Dibrugarh Trunk",
    highway: "NH-27 / AH-1 (Assam)",
    riskLevel: "safe",
    riskTitle: "Heavy Freight Density & Waterlogging",
    description: "Highest vehicle density in Northeast; localized waterlogging near low bridge approaches.",
    lat: 26.30,
    lng: 92.60,
    traffic: "Highest Northeast Density"
  },
  {
    id: "kohima-dimapur",
    name: "Kohima–Dimapur Ghat Stretch",
    highway: "NH-2 (Nagaland)",
    riskLevel: "caution",
    riskTitle: "Sinking Zone & Steep Ghat Gradient",
    description: "Active land sinking stretch at Phesama & Kapa; heavy loaded trucks experience slow crawls.",
    lat: 25.72,
    lng: 93.92,
    traffic: "Primary Nagaland Life-Line"
  }
];

const NE_BOUNDS = {
  north: 29.6,
  south: 21.9,
  west: 87.8,
  east: 97.5,
};

const NE_CITIES_LIST = [
  "Guwahati, Assam",
  "Dibrugarh, Assam",
  "Silchar, Assam",
  "Tezpur, Assam",
  "Jorhat, Assam",
  "Shillong, Meghalaya",
  "Tura, Meghalaya",
  "Itanagar, Arunachal Pradesh",
  "Tawang, Arunachal Pradesh",
  "Pasighat, Arunachal Pradesh",
  "Imphal, Manipur",
  "Kohima, Nagaland",
  "Dimapur, Nagaland",
  "Aizawl, Mizoram",
  "Agartala, Tripura",
  "Gangtok, Sikkim",
  "Namchi, Sikkim",
];
window.NE_CITIES_LIST = NE_CITIES_LIST;

function normalizeStateName(name) {
  return (name || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function isNortheastState(name) {
  const n = normalizeStateName(name);
  return NE_STATES.some((s) => n.includes(normalizeStateName(s.name)));
}

function inNortheastBounds(lat, lng) {
  return (
    lat >= NE_BOUNDS.south &&
    lat <= NE_BOUNDS.north &&
    lng >= NE_BOUNDS.west &&
    lng <= NE_BOUNDS.east
  );
}

function stateFromAddressComponents(components) {
  const admin = (components || []).find((c) =>
    (c.types || []).includes("administrative_area_level_1")
  );
  return admin ? admin.long_name : "";
}

function googleLatLngBounds() {
  return new google.maps.LatLngBounds(
    { lat: NE_BOUNDS.south, lng: NE_BOUNDS.west },
    { lat: NE_BOUNDS.north, lng: NE_BOUNDS.east }
  );
}
