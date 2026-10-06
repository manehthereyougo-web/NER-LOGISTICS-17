let map;
let leafletMap;
let leafletTileLayer;
let geocoder;
let originAuto;
let destAuto;
let incAuto;
let lastNavigateUrl = "";
let lastOriginLatLng = null;
let lastDestLatLng = null;

// Route Polylines & Markers for Google Maps
let googleRoutePolyline = null;
let googleDetourPolyline = null;
let googleExclusionCircle = null;
let googleIncidentMarker = null;
let googleOriginMarker = null;
let googleDestMarker = null;

// Route Polylines & Markers for Leaflet fallback
let leafletRoutePolyline = null;
let leafletDetourPolyline = null;
let leafletExclusionCircle = null;
let leafletIncidentMarker = null;
let leafletOriginMarker = null;
let leafletDestMarker = null;

let leafletHazardCircles = [];
let googleHazardCircles = [];
let googleHazardMarkers = [];
let googleVehicleMarkers = [];
let currentLayer = "standard";
let isPickingIncident = false;

const GOOGLE_DARK_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#141e18" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#141e18" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#749683" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#10b981" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#5eead4" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0d261d" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d3e34" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a2720" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#0f766e" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#115e59" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f1f5f9" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a192f" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] },
];

const CITY_COORDS = {
  "Guwahati, Assam": { lat: 26.1445, lng: 91.7362, ele: 55 },
  "Shillong, Meghalaya": { lat: 25.5788, lng: 91.8933, ele: 1525 },
  "Barapani, Meghalaya": { lat: 25.654, lng: 91.896, ele: 990 },
  "Sonapur, Meghalaya": { lat: 25.12, lng: 92.36, ele: 1250 },
  "Silchar, Assam": { lat: 24.8333, lng: 92.7789, ele: 35 },
  "Imphal, Manipur": { lat: 24.817, lng: 93.9368, ele: 786 },
  "Jiribam, Manipur": { lat: 24.78, lng: 93.15, ele: 30 },
  "Dimapur, Nagaland": { lat: 25.906, lng: 93.727, ele: 145 },
  "Kohima, Nagaland": { lat: 25.6751, lng: 94.1086, ele: 1444 },
  "Phesama, Nagaland": { lat: 25.63, lng: 94.11, ele: 1480 },
  "Itanagar, Arunachal Pradesh": { lat: 27.0844, lng: 93.6053, ele: 320 },
  "Aizawl, Mizoram": { lat: 23.7271, lng: 92.7176, ele: 1132 },
  "Agartala, Tripura": { lat: 23.8315, lng: 91.2868, ele: 128 },
  "Gangtok, Sikkim": { lat: 27.3314, lng: 88.6138, ele: 1650 },
  "Rangpo, Sikkim": { lat: 27.1764, lng: 88.5342, ele: 350 },
  "Tawang, Arunachal Pradesh": { lat: 27.5861, lng: 91.8594, ele: 3048 },
  "Sela Pass, Arunachal Pradesh": { lat: 27.5028, lng: 92.1039, ele: 4170 },
  "Dibrugarh, Assam": { lat: 27.4728, lng: 94.912, ele: 108 },
  "Tezpur, Assam": { lat: 26.6338, lng: 92.8, ele: 48 },
  "Jorhat, Assam": { lat: 26.7509, lng: 94.2037, ele: 90 },
  "Nagaon, Assam": { lat: 26.35, lng: 92.68, ele: 60 },
  "Tura, Meghalaya": { lat: 25.5141, lng: 90.2032, ele: 349 },
  "Pasighat, Arunachal Pradesh": { lat: 28.0663, lng: 95.326, ele: 155 },
  "Namchi, Sikkim": { lat: 27.1667, lng: 88.35, ele: 1315 },
  "Haflong, Assam": { lat: 25.17, lng: 93.02, ele: 680 },
  "Cherrapunji, Meghalaya": { lat: 25.27, lng: 91.73, ele: 1430 },
  "Bomdila, Arunachal Pradesh": { lat: 27.26, lng: 92.42, ele: 2415 },
};

async function getCityWeather(query) {
  if (!query || !window.NE8_IMD) return null;
  const q = query.toLowerCase();
  for (const s of (window.NE_STATES || [])) {
    if (q.includes(s.name.toLowerCase()) || q.includes(s.capital.toLowerCase())) {
      const imd = await window.NE8_IMD.fetchWeatherForState(s.name);
      if (imd && imd.current) {
        return {
          state: s.name,
          temp: imd.current.temperature || "IMD Active",
          icon: imd.current.icon || "🌤️",
          condition: imd.current.condition || "Observed",
          source: window.NE8_IMD.ATTRIBUTION,
        };
      }
    }
  }
  return null;
}

const DISASTER_DESCRIPTIONS_BY_PLACE = {
  "Barapani, Meghalaya": {
    type: "Flood",
    desc: "Flash flood water surge and bridge approach erosion near reservoir causeway. Southbound lane submerged.",
    severity: "blocked",
    reason: "Water level 1.8m above roadbed, structural risk on causeway approach"
  },
  "Sonapur, Meghalaya": {
    type: "Landslide",
    desc: "Heavy monsoonal mudfall blocking southbound truck lane near tunnel approach. Single-lane movement active.",
    severity: "caution",
    reason: "Active mudfall with single-lane convoy clearance"
  },
  "Sela Pass, Arunachal Pradesh": {
    type: "Snow",
    desc: "Sub-zero blizzard conditions and slippery black ice at 13,700 ft. Drivers advised to put on snow chains, slow crawling speed.",
    severity: "caution",
    reason: "Sub-zero blizzard, black ice, snow chains mandatory"
  },
  "Jiribam, Manipur": {
    type: "Landslide",
    desc: "Active landslide and fractured road bed near km 62. Both lanes closed for heavy goods vehicles.",
    severity: "blocked",
    reason: "Total road collapse, fractured carriageway impassable"
  },
  "Phesama, Nagaland": {
    type: "Road Damage",
    desc: "Severe sinking zone and hillside subsidence on NH-2. Heavy trucks diverted to bypass.",
    severity: "blocked",
    reason: "Subsidence depression > 1.2m across primary lane"
  },
  "Rangpo, Sikkim": {
    type: "Flood",
    desc: "Teesta river surge eroding highway foundation and cliff rockfalls near border checkpoint.",
    severity: "blocked",
    reason: "Foundation wash-out, high boulder fall risk"
  },
  "Haflong, Assam": {
    type: "Landslide",
    desc: "Hill slope shear failure cutting Jatinga Valley corridor. Earthmovers clearing debris.",
    severity: "blocked",
    reason: "Debris blockage spanning 80m of road width"
  },
  "Cherrapunji, Meghalaya": {
    type: "Flood",
    desc: "Extreme torrential downpour (>350mm) causing waterfalls cascading directly across ghat curves.",
    severity: "caution",
    reason: "Poor visibility (<10m) and aquaplaning hazard"
  }
};

function getDisasterReportForPlace(placeQuery) {
  if (!placeQuery) return null;
  const q = placeQuery.trim().toLowerCase();

  // 1. Check known dictionary
  for (const [key, val] of Object.entries(DISASTER_DESCRIPTIONS_BY_PLACE)) {
    const city = key.split(",")[0].trim().toLowerCase();
    if (q === key.toLowerCase() || q.includes(city) || city.includes(q)) {
      return { place: key, ...val };
    }
  }

  // 2. Check loaded incidents from localStorage / Supabase
  const incidents = typeof loadIncidents === "function" ? loadIncidents() : [];
  for (const item of incidents) {
    const title = (item.title || "").toLowerCase();
    const place = (item.place || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    if (q && (title.includes(q) || place.includes(q) || q.includes(place) || q.includes(title))) {
      const type = (item.hazards && item.hazards[0]) || "Landslide";
      return {
        place: item.place || item.title,
        type: type.charAt(0).toUpperCase() + type.slice(1),
        desc: item.description || "Active reported road hazard",
        severity: item.level === "risk" ? "blocked" : "caution",
        reason: (item.reasons && item.reasons.join(". ")) || "Reported field disaster"
      };
    }
  }

  return null;
}

function evaluateDisasterDescription(description, incidentType) {
  const text = ((description || "") + " " + (incidentType || "")).toLowerCase();
  
  // Severe blockage keywords -> Detour is mandatory
  const blockageKeywords = [
    "block", "blocked", "blocking", "closed", "closure", "impassable", 
    "submerged", "collapse", "collapsed", "sinkhole", "fractured", 
    "washed away", "landslide", "mudslide", "rockfall", "debris", 
    "cave-in", "breach", "inundated", "both lanes", "cut off", 
    "destruction", "water surge", "subsidence"
  ];
  
  // Caution / limited access keywords
  const cautionKeywords = [
    "caution", "single-lane", "single lane", "slow", "crawl", 
    "chains", "ice", "black ice", "snow", "slippery", "fog", 
    "advisory", "reduced speed", "watch", "drizzle", "monsoon"
  ];

  // Specific phrases indicating partial movement allowed
  const partialPassablePhrases = [
    "single-lane movement active",
    "single lane movement",
    "single lane crawling",
    "drivers advised to put on snow chains",
    "snow chains",
    "passable with caution",
    "slow crawl"
  ];

  const totalClosureKeywords = ["both lanes closed", "completely blocked", "washed away", "total collapse", "impassable for all", "submerged"];

  const isTotalClosure = totalClosureKeywords.some(kw => text.includes(kw));
  const hasBlockage = blockageKeywords.some(kw => text.includes(kw));
  const hasCaution = cautionKeywords.some(kw => text.includes(kw));
  const isPartialPassable = partialPassablePhrases.some(phrase => text.includes(phrase));

  let decision = "detour_required";
  let severityLevel = "critical";

  if (isTotalClosure) {
    decision = "detour_required";
    severityLevel = "critical";
  } else if (isPartialPassable && !isTotalClosure) {
    decision = "caution_passable";
    severityLevel = "high";
  } else if (hasBlockage) {
    decision = "detour_required";
    severityLevel = "critical";
  } else if (hasCaution) {
    decision = "caution_passable";
    severityLevel = "moderate";
  }

  return {
    decision,
    severityLevel,
    text: description || "No detailed description provided.",
    hasBlockage,
    hasCaution,
    isPartialPassable
  };
}

function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  const params = new URLSearchParams(location.search);
  if (params.get("origin")) document.getElementById("origin").value = params.get("origin");
  if (params.get("destination")) document.getElementById("destination").value = params.get("destination");
  if (params.get("incident")) {
    const inc = document.getElementById("incident-location");
    if (inc) inc.value = params.get("incident");
    const aiInc = document.getElementById("ai-incident-quick");
    if (aiInc) aiInc.value = params.get("incident");
  }
  if (params.get("desc")) {
    const descEl = document.getElementById("incident-desc");
    if (descEl) descEl.value = params.get("desc");
  }
  if (params.get("type")) {
    const typeEl = document.getElementById("incident-type");
    if (typeEl) {
      for (let i = 0; i < typeEl.options.length; i++) {
        if (typeEl.options[i].value.toLowerCase() === params.get("type").toLowerCase() ||
            typeEl.options[i].text.toLowerCase().includes(params.get("type").toLowerCase())) {
          typeEl.selectedIndex = i;
          break;
        }
      }
    }
  }

  // Auto-fill disaster description when incident location is changed or selected
  const incLocInput = document.getElementById("incident-location");
  if (incLocInput) {
    const handleIncLocChange = () => {
      const incVal = incLocInput.value.trim();
      const incDescEl = document.getElementById("incident-desc");
      const incTypeEl = document.getElementById("incident-type");
      const report = getDisasterReportForPlace(incVal);
      if (report) {
        if (incDescEl && (!incDescEl.value.trim() || incDescEl.dataset.autofilled === "true")) {
          incDescEl.value = report.desc;
          incDescEl.dataset.autofilled = "true";
        }
        if (incTypeEl && report.type) {
          for (let i = 0; i < incTypeEl.options.length; i++) {
            if (incTypeEl.options[i].value.toLowerCase() === report.type.toLowerCase() ||
                incTypeEl.options[i].text.toLowerCase().includes(report.type.toLowerCase())) {
              incTypeEl.selectedIndex = i;
              break;
            }
          }
        }
      }
    };
    incLocInput.addEventListener("change", handleIncLocChange);
    incLocInput.addEventListener("input", () => {
      if (incLocInput.value.length >= 4) handleIncLocChange();
    });
  }

  const incDescInput = document.getElementById("incident-desc");
  if (incDescInput) {
    incDescInput.addEventListener("input", () => {
      incDescInput.dataset.autofilled = "false";
    });
  }

  const plotBtn = document.getElementById("plot-btn");
  if (plotBtn) plotBtn.onclick = plotRoute;

  const locateBtn = document.getElementById("locate-btn");
  if (locateBtn) locateBtn.onclick = useMyPosition;

  const btnGpsOrigin = document.getElementById("btn-gps-origin");
  if (btnGpsOrigin) btnGpsOrigin.onclick = useMyPosition;

  const btnSwapRoute = document.getElementById("btn-swap-route");
  if (btnSwapRoute) btnSwapRoute.onclick = window.swapRouteOriginDestination;

  const btnPickInc = document.getElementById("btn-pick-incident-map");
  if (btnPickInc) {
    btnPickInc.onclick = () => {
      isPickingIncident = !isPickingIncident;
      if (isPickingIncident) {
        btnPickInc.textContent = "🎯 Click Map...";
        btnPickInc.style.background = "#ef4444";
        btnPickInc.style.color = "#ffffff";
        const status = document.getElementById("map-status");
        if (status) status.textContent = "🎯 Click anywhere on the map to place the Incident / Disaster Exclusion Zone";
      } else {
        btnPickInc.textContent = "📍 On Map";
        btnPickInc.style.background = "";
        btnPickInc.style.color = "";
      }
    };
  }

  initMapToolbar();

  // If Google Maps is ready, initialize Google Maps
  if (window.google && window.google.maps && !window.USE_FALLBACK_MAP) {
    initGoogleMap();
  } else if (window.L) {
    initLeafletMap();
  } else {
    setTimeout(() => {
      if (window.google && window.google.maps && !window.USE_FALLBACK_MAP) {
        initGoogleMap();
      } else if (window.L) {
        initLeafletMap();
      }
    }, 400);
  }

  // Auto-run initial route plot to render route & AI safe evaluation immediately
  setTimeout(() => {
    plotRoute();
  }, 500);
}

function initMapToolbar() {
  const btnStandard = document.getElementById("layer-standard");
  const btnSat = document.getElementById("layer-satellite");
  const btnDark = document.getElementById("layer-dark");
  const btnHeat = document.getElementById("layer-heatmap");

  if (!btnStandard) return;

  const buttons = [btnStandard, btnSat, btnDark, btnHeat];
  buttons.forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b && b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.id.replace("layer-", "");
      switchMapLayer(mode);
    });
  });
}

function switchMapLayer(mode) {
  currentLayer = mode;

  // Google Maps layer switching
  if (map && window.google && window.google.maps) {
    if (mode === "satellite") {
      map.setMapTypeId("hybrid");
      map.setOptions({ styles: [] });
    } else if (mode === "dark") {
      map.setMapTypeId("roadmap");
      map.setOptions({ styles: GOOGLE_DARK_STYLES });
    } else if (mode === "heatmap") {
      map.setMapTypeId("roadmap");
      map.setOptions({ styles: [] });
      googleHazardCircles.forEach((circle) => {
        circle.setOptions({ fillOpacity: 0.65, radius: 12000 });
      });
    } else {
      map.setMapTypeId("roadmap");
      map.setOptions({ styles: [] });
      googleHazardCircles.forEach((circle) => {
        circle.setOptions({ fillOpacity: 0.25, radius: 6000 });
      });
    }
    return;
  }

  // Leaflet fallback layer switching
  if (leafletMap && window.L) {
    if (leafletTileLayer) leafletMap.removeLayer(leafletTileLayer);

    let tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
    let attr = '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

    if (mode === "satellite") {
      tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      attr = "Esri World Imagery | NE8 Corridor";
    } else if (mode === "dark") {
      tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
      attr = '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
    }

    if (window.SafeRouteMap && window.SafeRouteMap.createTileLayer && mode !== "satellite" && mode !== "dark") {
      leafletTileLayer = window.SafeRouteMap.createTileLayer().addTo(leafletMap);
      window.SafeRouteMap.attachTileErrorBanner(leafletMap, "map");
    } else {
      leafletTileLayer = L.tileLayer(tileUrl, { maxZoom: 19, attribution: attr, crossOrigin: true }).addTo(leafletMap);
    }

    leafletHazardCircles.forEach((circle) => {
      if (mode === "heatmap") {
        circle.setStyle({ fillOpacity: 0.6, radius: 12000 });
      } else {
        circle.setStyle({ fillOpacity: 0.3, radius: 6000 });
      }
    });
  }
}

function initGoogleMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  // Clean container if any previous content existed
  mapElement.innerHTML = "";
  if (leafletMap) {
    try { leafletMap.remove(); } catch (e) {}
    leafletMap = null;
  }

  const missing = document.getElementById("maps-key-missing");
  if (missing) missing.classList.add("hidden");

  // Initialize interactive Google Map
  map = new google.maps.Map(mapElement, {
    center: { lat: 26.1445, lng: 91.7362 }, // Guwahati hub
    zoom: 7,
    restriction: {
      latLngBounds: googleLatLngBounds(),
      strictBounds: false,
    },
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
    styles: currentLayer === "dark" ? GOOGLE_DARK_STYLES : [],
    mapTypeId: currentLayer === "satellite" ? "hybrid" : "roadmap",
  });

  geocoder = new google.maps.Geocoder();

  // Places Autocomplete integration
  try {
    if (window.google.maps.places && typeof google.maps.places.Autocomplete === "function") {
      const options = {
        bounds: googleLatLngBounds(),
        strictBounds: false,
        componentRestrictions: { country: "in" },
        fields: ["geometry", "formatted_address", "name"],
      };

      const origInput = document.getElementById("origin");
      const destInput = document.getElementById("destination");
      const incInput = document.getElementById("incident-location");

      if (origInput) {
        originAuto = new google.maps.places.Autocomplete(origInput, options);
        originAuto.addListener("place_changed", () => {
          const place = originAuto.getPlace();
          if (place && place.geometry) plotRoute();
        });
      }

      if (destInput) {
        destAuto = new google.maps.places.Autocomplete(destInput, options);
        destAuto.addListener("place_changed", () => {
          const place = destAuto.getPlace();
          if (place && place.geometry) plotRoute();
        });
      }

      if (incInput) {
        incAuto = new google.maps.places.Autocomplete(incInput, options);
        incAuto.addListener("place_changed", () => {
          const place = incAuto.getPlace();
          if (place && place.geometry) plotRoute();
        });
      }
    }
  } catch (err) {
    console.warn("Places Autocomplete not available or restricted:", err);
  }

  // Click on map to set Origin, Destination, or Incident
  map.addListener("click", (e) => {
    if (!e || !e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    handleMapClickLocation(lat, lng);
  });

  drawHazardsGoogle();
  drawVehiclesGoogle();
}

function initLeafletMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;
  mapContainer.innerHTML = "";

  leafletMap = L.map("map", { attributionControl: true }).setView([26.2, 92.9], 7);

  if (window.SafeRouteMap && window.SafeRouteMap.createTileLayer) {
    leafletTileLayer = window.SafeRouteMap.createTileLayer().addTo(leafletMap);
    window.SafeRouteMap.attachTileErrorBanner(leafletMap, "map");
  } else {
    leafletTileLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      crossOrigin: true,
    }).addTo(leafletMap);
  }

  leafletMap.on("click", (e) => {
    if (!e || !e.latlng) return;
    handleMapClickLocation(e.latlng.lat, e.latlng.lng);
  });

  drawHazardsLeaflet();
  drawVehiclesLeaflet();
}

function handleMapClickLocation(lat, lng) {
  if (!inNortheastBounds(lat, lng)) {
    alert("Clicked location is outside the 8 Northeast states!");
    return;
  }

  const coordStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  if (isPickingIncident) {
    isPickingIncident = false;
    const btnPickInc = document.getElementById("btn-pick-incident-map");
    if (btnPickInc) {
      btnPickInc.textContent = "📍 On Map";
      btnPickInc.style.background = "";
      btnPickInc.style.color = "";
    }
    const incInput = document.getElementById("incident-location");
    const aiIncInput = document.getElementById("ai-incident-quick");
    if (incInput) incInput.value = coordStr;
    if (aiIncInput) aiIncInput.value = coordStr;
    plotRoute();
    return;
  }

  const popupHtml = `
    <div style="font-family: system-ui, sans-serif; font-size: 13px; text-align: center; padding: 6px; color: #14231c;">
      <strong>📍 Selected Location</strong><br/>
      <small style="color: #64748b;">${coordStr}</small>
      <div style="display: flex; gap: 6px; margin-top: 8px; justify-content: center; flex-wrap: wrap;">
        <button onclick="document.getElementById('origin').value='${coordStr}'; plotRoute();" style="background:#10b981; color:#fff; border:none; padding:5px 9px; border-radius:4px; font-size:11px; cursor:pointer;">Set Origin</button>
        <button onclick="document.getElementById('destination').value='${coordStr}'; plotRoute();" style="background:#3b82f6; color:#fff; border:none; padding:5px 9px; border-radius:4px; font-size:11px; cursor:pointer;">Set Destination</button>
        <button onclick="document.getElementById('incident-location').value='${coordStr}'; if(document.getElementById('ai-incident-quick')) document.getElementById('ai-incident-quick').value='${coordStr}'; plotRoute();" style="background:#ef4444; color:#fff; border:none; padding:5px 9px; border-radius:4px; font-size:11px; cursor:pointer;">⚠️ Set Incident</button>
      </div>
    </div>
  `;

  if (map && window.google && window.google.maps) {
    new google.maps.InfoWindow({ content: popupHtml, position: { lat, lng } }).open(map);
  } else if (leafletMap && window.L) {
    L.popup().setLatLng([lat, lng]).setContent(popupHtml).openOn(leafletMap);
  }
}

function drawHazardsGoogle() {
  if (!map || !window.google || !window.google.maps) return;

  // Clear previous hazard markers and circles
  googleHazardCircles.forEach((c) => c.setMap(null));
  googleHazardMarkers.forEach((m) => m.setMap(null));
  googleHazardCircles = [];
  googleHazardMarkers = [];

  loadIncidents().forEach((item) => {
    if (typeof item.lat !== "number") return;
    const ids = hazardIdsForIncident(item);
    const color = ids.some((id) => (riskById(id) || {}).severe)
      ? "#b42318"
      : item.level === "caution"
        ? "#9a6700"
        : "#1f6b45";

    const circle = new google.maps.Circle({
      map,
      center: { lat: item.lat, lng: item.lng },
      radius: currentLayer === "heatmap" ? 12000 : 6000,
      fillColor: color,
      fillOpacity: currentLayer === "heatmap" ? 0.65 : 0.25,
      strokeColor: color,
      strokeWeight: 1,
    });
    googleHazardCircles.push(circle);

    const marker = new google.maps.Marker({
      map,
      position: { lat: item.lat, lng: item.lng },
      title: `${item.title}`,
    });
    googleHazardMarkers.push(marker);

    const mapUrl = googleMapsLocationUrl(item.lat, item.lng, item.title);
    const infoContent = `
      <div style="font-family: system-ui, sans-serif; padding: 6px; max-width: 260px; color: #14231c;">
        ${item.photo ? `<img src="${item.photo}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin-bottom:8px;" alt="Damage photo" />` : ""}
        <h4 style="margin:2px 0 4px; font-size:15px; font-weight:700;">${item.title || "Damaged Site"}</h4>
        <p style="margin:0 0 10px; font-size:12px; color:#5b6b62;">${item.description || "Field incident photo"}</p>
        <a href="${mapUrl}" target="_blank" rel="noopener" style="display:inline-block; padding:6px 12px; background:#1a73e8; color:#fff; text-decoration:none; border-radius:6px; font-size:12px; font-weight:600;">Open in Google Maps</a>
      </div>
    `;
    const infoWindow = new google.maps.InfoWindow({ content: infoContent });
    marker.addListener("click", () => infoWindow.open(map, marker));
  });
}

function drawHazardsLeaflet() {
  if (!leafletMap || !window.L) return;
  leafletHazardCircles.forEach((c) => leafletMap.removeLayer(c));
  leafletHazardCircles = [];

  loadIncidents().forEach((item) => {
    if (typeof item.lat !== "number") return;
    const ids = hazardIdsForIncident(item);
    const color = ids.some((id) => (riskById(id) || {}).severe)
      ? "#ef4444"
      : item.level === "caution"
        ? "#f59e0b"
        : "#10b981";

    const circle = L.circle([item.lat, item.lng], {
      color: color,
      fillColor: color,
      fillOpacity: currentLayer === "heatmap" ? 0.6 : 0.3,
      radius: currentLayer === "heatmap" ? 12000 : 6000,
    }).addTo(leafletMap);

    leafletHazardCircles.push(circle);

    const mapUrl = googleMapsLocationUrl(item.lat, item.lng, item.title);
    const popupContent = `
      <div style="font-family: system-ui, sans-serif; max-width: 220px;">
        ${item.photo ? `<img src="${item.photo}" style="width:100%; height:100px; object-fit:cover; border-radius:6px; margin-bottom:6px;" alt="Photo" />` : ""}
        <strong style="display:block; font-size:14px; color:#0f172a;">${item.title || "Damaged Route Site"}</strong>
        <p style="margin:4px 0 8px; font-size:12px; color:#475569;">${item.description || ""}</p>
        <a href="${mapUrl}" target="_blank" rel="noopener" style="display:inline-block; padding:5px 10px; background:#10b981; color:#fff; text-decoration:none; border-radius:4px; font-size:11px; font-weight:700;">Google Maps Detour</a>
      </div>
    `;

    L.marker([item.lat, item.lng]).addTo(leafletMap).bindPopup(popupContent);
  });
}

function drawVehiclesGoogle() {
  if (!map || !window.google || !window.google.maps || typeof loadVehicles !== "function") return;
  googleVehicleMarkers.forEach((m) => m.setMap(null));
  googleVehicleMarkers = [];

  loadVehicles().forEach((v) => {
    if (typeof v.lat !== "number" || typeof v.lng !== "number") return;
    const marker = new google.maps.Marker({
      map,
      position: { lat: v.lat, lng: v.lng },
      title: `${v.code} - ${v.cargo}`,
    });
    googleVehicleMarkers.push(marker);

    const infoContent = `
      <div style="font-family: system-ui, sans-serif; padding: 4px; max-width: 230px; color: #0f172a;">
        <strong style="font-size:13px;">${v.icon} ${v.code}</strong>
        <p style="margin:2px 0 4px; font-size:12px; font-weight:600;">${v.cargo}</p>
        <div style="font-size:11px; color:#475569;">Route: ${v.origin} ➔ ${v.destination}</div>
        <div style="font-size:11px; color:#475569; margin-top:2px;">Position: ${v.location}</div>
        <div style="font-size:11px; font-weight:700; color:#0f766e; margin-top:4px;">ETA: ${v.eta}</div>
      </div>
    `;
    const infoWindow = new google.maps.InfoWindow({ content: infoContent });
    marker.addListener("click", () => infoWindow.open(map, marker));
  });
}

function drawVehiclesLeaflet() {
  if (!leafletMap || !window.L || typeof loadVehicles !== "function") return;
  loadVehicles().forEach((v) => {
    if (typeof v.lat !== "number" || typeof v.lng !== "number") return;
    const iconHtml = `<div style="background:rgba(15,23,42,0.95); border:2px solid ${v.statusClass === "risk" ? "#ef4444" : v.statusClass === "caution" ? "#f59e0b" : "#10b981"}; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 2px 8px rgba(0,0,0,0.5);" title="${v.code} - ${v.cargo}">${v.icon}</div>`;
    const customIcon = L.divIcon({
      html: iconHtml,
      className: "vehicle-leaflet-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const popupContent = `
      <div style="font-family: system-ui, sans-serif; max-width: 230px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <strong style="font-size:13px; color:#0f172a;">${v.icon} ${v.code}</strong>
          <span style="font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; background:${v.statusClass === "risk" ? "#fef2f2; color:#ef4444" : v.statusClass === "caution" ? "#fffbeb; color:#d97706" : "#ecfdf5; color:#10b981"}">${v.status}</span>
        </div>
        <p style="margin:2px 0 4px; font-size:12px; font-weight:600; color:#334155;">${v.cargo}</p>
        <div style="font-size:11px; color:#64748b;">🛣️ Route: ${v.origin} ➔ ${v.destination}</div>
        <div style="font-size:11px; color:#64748b; margin-top:2px;">📍 Position: ${v.location}</div>
        <div style="font-size:11px; font-weight:700; color:#0f766e; margin-top:4px;">⏱️ ETA: ${v.eta}</div>
      </div>
    `;
    L.marker([v.lat, v.lng], { icon: customIcon }).addTo(leafletMap).bindPopup(popupContent);
  });
}

function resolveCoords(query) {
  const trimmed = (query || "").trim().toLowerCase();
  if (!trimmed) return { lat: 26.1445, lng: 91.7362, ele: 55 };

  for (const [key, val] of Object.entries(CITY_COORDS)) {
    if (key.toLowerCase() === trimmed) return val;
  }

  for (const [key, val] of Object.entries(CITY_COORDS)) {
    const cityName = key.split(",")[0].trim().toLowerCase();
    if (cityName === trimmed || key.toLowerCase().includes(trimmed) || trimmed.includes(cityName)) {
      return val;
    }
  }

  if (window.NE_STATES) {
    const match = NE_STATES.find(
      (s) =>
        s.name.toLowerCase().includes(trimmed) ||
        s.capital.toLowerCase().includes(trimmed) ||
        trimmed.includes(s.name.toLowerCase()) ||
        trimmed.includes(s.capital.toLowerCase())
    );
    if (match && match.center) {
      return { lat: match.center.lat, lng: match.center.lng, ele: 500 };
    }
  }

  const parts = trimmed.split(",");
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, ele: 200 };
  }

  return { lat: 26.1445, lng: 91.7362, ele: 55 };
}

function geocodeQuery(query) {
  return new Promise((resolve) => {
    if (!geocoder) {
      resolve({ geometry: { location: resolveCoords(query) } });
      return;
    }
    geocoder.geocode(
      {
        address: `${query}, India`,
        componentRestrictions: { country: "IN" },
        bounds: googleLatLngBounds(),
      },
      (results, status) => {
        if (status !== "OK" || !results || !results.length) {
          resolve({ geometry: { location: resolveCoords(query) } });
          return;
        }
        resolve(results[0]);
      }
    );
  });
}

function clearRouteGraphics() {
  // Clear Google Maps elements
  if (googleRoutePolyline) {
    try { googleRoutePolyline.setMap(null); } catch (e) {}
    googleRoutePolyline = null;
  }
  if (googleDetourPolyline) {
    try { googleDetourPolyline.setMap(null); } catch (e) {}
    googleDetourPolyline = null;
  }
  if (googleExclusionCircle) {
    try { googleExclusionCircle.setMap(null); } catch (e) {}
    googleExclusionCircle = null;
  }
  if (googleIncidentMarker) {
    try { googleIncidentMarker.setMap(null); } catch (e) {}
    googleIncidentMarker = null;
  }
  if (googleOriginMarker) {
    try { googleOriginMarker.setMap(null); } catch (e) {}
    googleOriginMarker = null;
  }
  if (googleDestMarker) {
    try { googleDestMarker.setMap(null); } catch (e) {}
    googleDestMarker = null;
  }

  // Clear Leaflet elements
  if (leafletMap && window.L) {
    if (leafletRoutePolyline) {
      try { leafletMap.removeLayer(leafletRoutePolyline); } catch (e) {}
      leafletRoutePolyline = null;
    }
    if (leafletDetourPolyline) {
      try { leafletMap.removeLayer(leafletDetourPolyline); } catch (e) {}
      leafletDetourPolyline = null;
    }
    if (leafletExclusionCircle) {
      try { leafletMap.removeLayer(leafletExclusionCircle); } catch (e) {}
      leafletExclusionCircle = null;
    }
    if (leafletIncidentMarker) {
      try { leafletMap.removeLayer(leafletIncidentMarker); } catch (e) {}
      leafletIncidentMarker = null;
    }
    if (leafletOriginMarker) {
      try { leafletMap.removeLayer(leafletOriginMarker); } catch (e) {}
      leafletOriginMarker = null;
    }
    if (leafletDestMarker) {
      try { leafletMap.removeLayer(leafletDestMarker); } catch (e) {}
      leafletDestMarker = null;
    }
  }
}

async function fetchOSRM(waypointsStr, alternatives = false) {
  const altParam = alternatives ? "&alternatives=true" : "";
  const url = `https://router.project-osrm.org/route/v1/driving/${waypointsStr}?overview=full&geometries=geojson&steps=true${altParam}`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(9000) });
  if (!resp.ok) throw new Error(`OSRM HTTP status ${resp.status}`);
  const data = await resp.json();
  if (data.code !== "Ok" || !data.routes || !data.routes.length) {
    throw new Error(data.message || "No OSRM route found");
  }
  return data.routes;
}

function createFallbackRoute(orig, dest, origName, destName) {
  const dist = haversineKm(orig, dest);
  const durSec = Math.round((dist / 38) * 3600);
  const midLat = (orig.lat + dest.lat) / 2 + 0.05;
  const midLng = (orig.lng + dest.lng) / 2 + 0.05;
  return {
    distance: dist * 1000,
    duration: durSec,
    geometry: {
      coordinates: [
        [orig.lng, orig.lat],
        [midLng, midLat],
        [dest.lng, dest.lat],
      ],
    },
    legs: [
      {
        distance: { value: dist * 1000, text: `${Math.round(dist)} km` },
        duration: { value: durSec, text: `${Math.round(durSec / 60)} min` },
        steps: [
          { maneuver: { type: "depart" }, name: "Hill Highway Corridor", distance: dist * 400, duration: durSec * 0.4 },
          { maneuver: { type: "turn", modifier: "slight right" }, name: "Mountain Pass Road", distance: dist * 600, duration: durSec * 0.6 },
        ],
      },
    ],
  };
}

function createDetourFallbackRoute(orig, bp, dest, origName, destName, incName) {
  const d1 = haversineKm(orig, bp);
  const d2 = haversineKm(bp, dest);
  const totalDist = d1 + d2;
  const durSec = Math.round((totalDist / 35) * 3600);
  return {
    distance: totalDist * 1000,
    duration: durSec,
    geometry: {
      coordinates: [
        [orig.lng, orig.lat],
        [bp.lng, bp.lat],
        [dest.lng, dest.lat],
      ],
    },
    legs: [
      {
        distance: { value: totalDist * 1000, text: `${Math.round(totalDist)} km` },
        duration: { value: durSec, text: `${Math.round(durSec / 60)} min` },
        steps: [
          { maneuver: { type: "depart" }, name: "Primary Arterial Route", distance: d1 * 1000, duration: durSec * 0.45 },
          { maneuver: { type: "turn", modifier: "slight left" }, name: `Safe Bypass around ${incName}`, distance: d2 * 1000, duration: durSec * 0.55 },
        ],
      },
    ],
  };
}

function formatSteps(legs) {
  const rawSteps = (legs && legs[0] && legs[0].steps) || [];
  if (!rawSteps.length) {
    return [
      { instructions: "Depart on regional hill highway corridor", distance: { text: "15.0 km" } },
      { instructions: "Continue forward toward destination", distance: { text: "35.0 km" } },
    ];
  }
  return rawSteps.map((s) => {
    let action = (s.maneuver && s.maneuver.type) || "Proceed";
    if (action === "turn" && s.maneuver.modifier) {
      action = `Turn ${s.maneuver.modifier}`;
    } else if (action === "new name") {
      action = "Continue onto";
    } else if (action === "depart") {
      action = "Head out";
    } else if (action === "arrive") {
      action = "Arrive at destination";
    } else if (action === "fork" && s.maneuver.modifier) {
      action = `Take the ${s.maneuver.modifier} fork onto`;
    } else if (action === "roundabout") {
      action = "Enter roundabout onto";
    } else if (s.maneuver && s.maneuver.modifier) {
      action = `${action} ${s.maneuver.modifier}`;
    }
    const road = s.name ? `on ${s.name}` : "on mountain highway";
    const distKm = (s.distance / 1000).toFixed(1);
    return {
      instructions: `${action.charAt(0).toUpperCase() + action.slice(1)} ${road}`.trim(),
      distance: { text: distKm > 0.1 ? `${distKm} km` : `${Math.round(s.distance)} m` },
    };
  });
}

function drawRouteOnGoogleMap(safePath, blockedPath, incidentCoords, incidentName, origCoords, destCoords, origName, destName, entersExclusion, incidentDesc, disasterEval, detectedIncident) {
  if (!map || !window.google || !window.google.maps) return;

  clearRouteGraphics();
  const bounds = new google.maps.LatLngBounds();

  // 1. Hazard Exclusion Zone Circle (10 km radius)
  if (incidentCoords && typeof incidentCoords.lat === "number") {
    googleExclusionCircle = new google.maps.Circle({
      map,
      center: { lat: incidentCoords.lat, lng: incidentCoords.lng },
      radius: 10000,
      fillColor: "#ef4444",
      fillOpacity: 0.32,
      strokeColor: "#dc2626",
      strokeWeight: 2,
      zIndex: 5,
    });

    // Add incident marker with warning InfoWindow
    googleIncidentMarker = new google.maps.Marker({
      map,
      position: { lat: incidentCoords.lat, lng: incidentCoords.lng },
      title: `Incident Exclusion Zone: ${incidentName}`,
      label: { text: "⚠️", fontSize: "16px" },
      zIndex: 40,
    });

    const impactBadge = (disasterEval && disasterEval.decision === 'caution_passable')
      ? '<span style="background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px; font-weight:700; font-size:10px;">CAUTION &bull; PASSABLE WITH RESTRICTIONS</span>'
      : '<span style="background:#fee2e2; color:#b91c1c; padding:2px 6px; border-radius:4px; font-weight:700; font-size:10px;">MANDATORY DETOUR ENFORCED</span>';

    const photoHtml = (detectedIncident && detectedIncident.photo) 
      ? `<div style="margin:6px 0;"><img src="${detectedIncident.photo}" style="width:100%; max-height:100px; object-fit:cover; border-radius:6px; border:1px solid #e2e8f0;" alt="Hazard Photo" /></div>` 
      : '';

    const incInfo = new google.maps.InfoWindow({
      content: `
        <div style="font-family:system-ui,sans-serif; padding:6px; max-width:270px; color:#0f172a;">
          <strong style="color:#ef4444; font-size:13px;">⚠️ Hazard Exclusion Zone (10 km)</strong>
          <div style="font-size:12px; font-weight:700; margin-top:2px;">${incidentName}</div>
          ${photoHtml}
          <p style="margin:4px 0 6px; font-size:11px; color:#475569; line-height:1.4;">
            <strong>Disaster Report:</strong> ${incidentDesc || "Active disaster exclusion zone. Safe detour routes bypass this corridor."}
          </p>
          <div>${impactBadge}</div>
        </div>
      `,
    });
    googleIncidentMarker.addListener("click", () => incInfo.open(map, googleIncidentMarker));

    bounds.extend(new google.maps.LatLng(incidentCoords.lat + 0.09, incidentCoords.lng));
    bounds.extend(new google.maps.LatLng(incidentCoords.lat - 0.09, incidentCoords.lng));
    bounds.extend(new google.maps.LatLng(incidentCoords.lat, incidentCoords.lng + 0.09));
    bounds.extend(new google.maps.LatLng(incidentCoords.lat, incidentCoords.lng - 0.09));
  }

  // 2. Draw Original / Blocked Route in RED line if detour is active
  if (entersExclusion && blockedPath && blockedPath.length > 0) {
    googleDetourPolyline = new google.maps.Polyline({
      map,
      path: blockedPath.map((p) => ({ lat: p[0], lng: p[1] })),
      strokeColor: "#dc2626",
      strokeOpacity: 0.85,
      strokeWeight: 5,
      zIndex: 10,
    });
    blockedPath.forEach((p) => bounds.extend({ lat: p[0], lng: p[1] }));
  }

  // 3. Draw Active Safe Route in vibrant emerald green line
  if (safePath && safePath.length > 0) {
    googleRoutePolyline = new google.maps.Polyline({
      map,
      path: safePath.map((p) => ({ lat: p[0], lng: p[1] })),
      strokeColor: "#16a34a",
      strokeOpacity: 0.95,
      strokeWeight: 6,
      zIndex: 25,
    });
    safePath.forEach((p) => bounds.extend({ lat: p[0], lng: p[1] }));
  }

  // 4. Draw Origin Marker (A, green)
  googleOriginMarker = new google.maps.Marker({
    map,
    position: { lat: origCoords.lat, lng: origCoords.lng },
    title: `Origin: ${origName}`,
    label: { text: "A", color: "#ffffff", fontWeight: "bold", fontSize: "12px" },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 9,
      fillColor: "#16a34a",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
    },
    zIndex: 35,
  });

  // 5. Draw Destination Marker (B, blue)
  googleDestMarker = new google.maps.Marker({
    map,
    position: { lat: destCoords.lat, lng: destCoords.lng },
    title: `Destination: ${destName}`,
    label: { text: "B", color: "#ffffff", fontWeight: "bold", fontSize: "12px" },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 9,
      fillColor: "#2563eb",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
    },
    zIndex: 35,
  });

  bounds.extend({ lat: origCoords.lat, lng: origCoords.lng });
  bounds.extend({ lat: destCoords.lat, lng: destCoords.lng });
  map.fitBounds(bounds, { top: 45, right: 45, bottom: 45, left: 45 });
}

function drawRouteOnLeaflet(safePath, blockedPath, incidentCoords, incidentName, origCoords, destCoords, origName, destName, entersExclusion, incidentDesc, disasterEval, detectedIncident) {
  if (!leafletMap || !window.L) return;

  clearRouteGraphics();
  const latlngsAll = [];

  // 1. Exclusion Zone Circle
  if (incidentCoords && typeof incidentCoords.lat === "number") {
    leafletExclusionCircle = L.circle([incidentCoords.lat, incidentCoords.lng], {
      color: "#dc2626",
      fillColor: "#ef4444",
      fillOpacity: 0.35,
      radius: 10000,
    }).addTo(leafletMap);

    const impactBadge = (disasterEval && disasterEval.decision === 'caution_passable')
      ? '<span style="color:#d97706; font-weight:bold;">CAUTION &bull; PASSABLE WITH RESTRICTIONS</span>'
      : '<span style="color:#dc2626; font-weight:bold;">MANDATORY DETOUR ENFORCED</span>';

    const photoHtml = (detectedIncident && detectedIncident.photo) 
      ? `<div style="margin:6px 0;"><img src="${detectedIncident.photo}" style="width:100%; max-height:100px; object-fit:cover; border-radius:6px;" alt="Hazard Photo" /></div>` 
      : '';

    leafletIncidentMarker = L.marker([incidentCoords.lat, incidentCoords.lng])
      .addTo(leafletMap)
      .bindPopup(`<strong>⚠️ Hazard Exclusion Zone (10 km)</strong><br/><strong>${incidentName}</strong><br/>${photoHtml}<small style="color:#475569;">${incidentDesc || "Active disaster perimeter"}</small><br/>${impactBadge}`);
  }

  // 2. Blocked Route in RED
  if (entersExclusion && blockedPath && blockedPath.length > 0) {
    leafletDetourPolyline = L.polyline(blockedPath, {
      color: "#dc2626",
      weight: 5,
      opacity: 0.85,
    }).addTo(leafletMap);
    blockedPath.forEach((p) => latlngsAll.push(p));
  }

  // 3. Safe Route in Green
  if (safePath && safePath.length > 0) {
    leafletRoutePolyline = L.polyline(safePath, {
      color: "#16a34a",
      weight: 6,
      opacity: 0.95,
    }).addTo(leafletMap);
    safePath.forEach((p) => latlngsAll.push(p));
  }

  // Markers
  leafletOriginMarker = L.marker([origCoords.lat, origCoords.lng])
    .addTo(leafletMap)
    .bindPopup(`<strong>📍 Origin</strong>: ${origName}`);
  leafletDestMarker = L.marker([destCoords.lat, destCoords.lng])
    .addTo(leafletMap)
    .bindPopup(`<strong>🎯 Destination</strong>: ${destName}`);

  latlngsAll.push([origCoords.lat, origCoords.lng], [destCoords.lat, destCoords.lng]);
  if (latlngsAll.length > 0) {
    leafletMap.fitBounds(L.latLngBounds(latlngsAll), { padding: [40, 40] });
  }
}

// Global quick corridor helper functions
window.swapRouteOriginDestination = function () {
  const origEl = document.getElementById("origin");
  const destEl = document.getElementById("destination");
  const origQuick = document.getElementById("ai-orig-quick");
  const destQuick = document.getElementById("ai-dest-quick");
  if (origEl && destEl) {
    const temp = origEl.value;
    origEl.value = destEl.value;
    destEl.value = temp;
    if (origQuick) origQuick.value = origEl.value;
    if (destQuick) destQuick.value = destEl.value;
    if (typeof plotRoute === "function") plotRoute();
  }
};

window.selectCorridor = function (origin, destination) {
  const origEl = document.getElementById("origin");
  const destEl = document.getElementById("destination");
  const origQuick = document.getElementById("ai-orig-quick");
  const destQuick = document.getElementById("ai-dest-quick");
  if (origEl) origEl.value = origin;
  if (destEl) destEl.value = destination;
  if (origQuick) origQuick.value = origin;
  if (destQuick) destQuick.value = destination;
  if (typeof plotRoute === "function") plotRoute();
};

/**
 * Automatically scan route polyline against all driver-reported disaster photos and incidents.
 * Returns all incidents within the corridor threshold (default 10 km).
 */
function findCorridorDisasters(routePath, incidents, thresholdKm = 10) {
  if (!Array.isArray(routePath) || routePath.length === 0) return [];
  const list = typeof loadIncidents === "function" ? loadIncidents() : (Array.isArray(incidents) ? incidents : []);
  
  const allCandidates = [...list];

  // Include known dictionary disaster hotspots if coordinates are defined in CITY_COORDS
  for (const [placeName, placeData] of Object.entries(DISASTER_DESCRIPTIONS_BY_PLACE)) {
    const cityName = placeName.split(",")[0].trim().toLowerCase();
    const alreadyExists = list.some((item) => {
      const p = (item.place || "").toLowerCase();
      const t = (item.title || "").toLowerCase();
      return p.includes(cityName) || t.includes(cityName);
    });

    if (!alreadyExists && CITY_COORDS[placeName]) {
      allCandidates.push({
        id: `dict-${placeName}`,
        title: `${placeName} Hazard`,
        place: placeName,
        description: placeData.desc,
        incident_type: placeData.type,
        level: placeData.severity === "blocked" ? "risk" : "caution",
        lat: CITY_COORDS[placeName].lat,
        lng: CITY_COORDS[placeName].lng,
        photo: (window.LIVE_PHOTOS && (window.LIVE_PHOTOS.sample4 || window.LIVE_PHOTOS.sample1)) || "",
        driver: "Field Driver Telemetry",
        reasons: [placeData.reason || "Reported disaster on corridor"],
      });
    }
  }

  const corridorHits = [];

  for (const inc of allCandidates) {
    if (typeof inc.lat !== "number" || typeof inc.lng !== "number") continue;
    
    // Find minimum distance from any point in routePath to this incident
    let minDistance = Infinity;
    for (let i = 0; i < routePath.length; i++) {
      const pt = routePath[i];
      const ptLat = Array.isArray(pt) ? pt[0] : (typeof pt.lat === "function" ? pt.lat() : pt.lat);
      const ptLng = Array.isArray(pt) ? pt[1] : (typeof pt.lng === "function" ? pt.lng() : pt.lng);
      const d = haversineKm({ lat: ptLat, lng: ptLng }, { lat: inc.lat, lng: inc.lng });
      if (d < minDistance) {
        minDistance = d;
      }
    }

    if (minDistance <= thresholdKm) {
      corridorHits.push({
        incident: inc,
        minDistance: Math.round(minDistance * 10) / 10,
        entersExclusionZone: true,
        thresholdKm,
      });
    }
  }

  // Sort: highest severity ("risk" / "blocked") first, then closest distance
  corridorHits.sort((a, b) => {
    const aRisk = a.incident.level === "risk" || a.incident.severity === "blocked" ? 1 : 0;
    const bRisk = b.incident.level === "risk" || b.incident.severity === "blocked" ? 1 : 0;
    if (bRisk !== aRisk) return bRisk - aRisk;
    return a.minDistance - b.minDistance;
  });

  return corridorHits;
}

async function plotRoute() {
  const origMain = document.getElementById("origin");
  const destMain = document.getElementById("destination");
  const origQuick = document.getElementById("ai-orig-quick");
  const destQuick = document.getElementById("ai-dest-quick");
  const incMain = document.getElementById("incident-location");
  const incDescEl = document.getElementById("incident-desc");
  const incTypeEl = document.getElementById("incident-type");

  const originVal = (origMain && origMain.value.trim()) || (origQuick && origQuick.value.trim()) || "Guwahati, Assam";
  const destVal = (destMain && destMain.value.trim()) || (destQuick && destQuick.value.trim()) || "Shillong, Meghalaya";

  if (origMain && origMain.value !== originVal) origMain.value = originVal;
  if (origQuick && origQuick.value !== originVal) origQuick.value = originVal;
  if (destMain && destMain.value !== destVal) destMain.value = destVal;
  if (destQuick && destQuick.value !== destVal) destQuick.value = destVal;

  const btn = document.getElementById("plot-btn");
  const aiSubmitBtns = document.querySelectorAll("[data-i18n='ai_btn_get_route']");
  const status = document.getElementById("map-status");
  const scoreEl = document.getElementById("route-score");
  const stepsEl = document.getElementById("steps");
  const navBtn = document.getElementById("google-nav-btn");

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `⚡ Scanning Corridor for Disasters...`;
  }
  aiSubmitBtns.forEach((b) => {
    b.disabled = true;
    b.dataset.origHtml = b.innerHTML;
    b.innerHTML = `Scanning Corridor for Disasters...`;
  });

  if (status) {
    status.textContent = `Scanning route from ${originVal} to ${destVal} for disasters & road blockages...`;
  }

  try {
    const originCoords = resolveCoords(originVal);
    const destCoords = resolveCoords(destVal);
    const exclusionRadiusKm = 10;

    // 1. Fetch direct route via OpenStreetMap (OSRM)
    let directRoutes = [];
    try {
      directRoutes = await fetchOSRM(`${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}`, true);
    } catch (err) {
      console.warn("OSRM direct query failed, using geometric fallback:", err);
      directRoutes = [createFallbackRoute(originCoords, destCoords, originVal, destVal)];
    }

    const directRoute = directRoutes[0];
    const directPath = directRoute.geometry.coordinates.map((c) => [c[1], c[0]]);
    const directDistKm = Math.round((directRoute.distance / 1000) * 10) / 10;
    const directDurMin = Math.round(directRoute.duration / 60);

    // 2. Automated AI Corridor Disaster Scan
    // Scan all driver disaster photos + reports against the direct route corridor within 10 km
    const allIncidents = typeof loadIncidents === "function" ? loadIncidents() : [];
    const corridorHits = findCorridorDisasters(directPath, allIncidents, exclusionRadiusKm);

    let detectedIncident = null;
    let incidentVal = "";
    let incidentCoords = null;
    let incidentDesc = "";
    let incidentType = "Road Blockage";
    let disasterEval = null;
    let minDistanceToIncident = 999999;
    let entersExclusionZone = false;
    let requiresDetour = false;

    if (corridorHits.length > 0) {
      const topHit = corridorHits[0];
      detectedIncident = topHit.incident;
      incidentVal = detectedIncident.place || detectedIncident.title || "Reported Disaster Point";
      incidentCoords = { lat: detectedIncident.lat, lng: detectedIncident.lng };
      incidentDesc = detectedIncident.description || "Active reported disaster blocking highway corridor.";
      incidentType = detectedIncident.incident_type || (detectedIncident.hazards && detectedIncident.hazards[0]) || "Landslide";
      minDistanceToIncident = topHit.minDistance;
      entersExclusionZone = true;

      // Sync hidden fields for backwards compatibility
      if (incMain) incMain.value = incidentVal;
      const aiIncQuick = document.getElementById("ai-incident-quick");
      if (aiIncQuick) aiIncQuick.value = incidentVal;
      if (incDescEl) incDescEl.value = incidentDesc;

      disasterEval = evaluateDisasterDescription(incidentDesc, incidentType);
      requiresDetour = disasterEval.decision === "detour_required" || disasterEval.decision === "detour_recommended" || !disasterEval.isPartialPassable;
    } else {
      // Check if user manually typed an incident into hidden input
      const manualInc = incMain && incMain.value.trim();
      if (manualInc && manualInc !== "Barapani, Meghalaya") {
        const manualCoords = resolveCoords(manualInc);
        let distToManual = 999999;
        for (const pt of directPath) {
          const d = haversineKm({ lat: pt[0], lng: pt[1] }, manualCoords);
          if (d < distToManual) distToManual = d;
        }
        if (distToManual <= exclusionRadiusKm) {
          incidentVal = manualInc;
          incidentCoords = manualCoords;
          incidentDesc = (incDescEl && incDescEl.value.trim()) || "Manual reported hazard";
          minDistanceToIncident = distToManual;
          entersExclusionZone = true;
          disasterEval = evaluateDisasterDescription(incidentDesc, incidentType);
          requiresDetour = true;
        }
      }
    }

    // 3. Alternative Safe Detour Calculation if route traverses hazard zone
    let safeRoute = directRoute;
    let blockedRoute = null;
    let isDetourActive = false;
    let detourWaypointObj = null;

    if (entersExclusionZone && requiresDetour && incidentCoords) {
      blockedRoute = directRoute;
      isDetourActive = true;

      // Check if OSRM returned an alternative that avoids the 10km zone
      let foundCleanAlternative = null;
      if (directRoutes.length > 1) {
        for (let i = 1; i < directRoutes.length; i++) {
          const candidatePath = directRoutes[i].geometry.coordinates.map((c) => [c[1], c[0]]);
          const candidateMinDist = Math.min(
            ...candidatePath.map((p) => haversineKm({ lat: p[0], lng: p[1] }, incidentCoords))
          );
          if (candidateMinDist > exclusionRadiusKm) {
            foundCleanAlternative = directRoutes[i];
            break;
          }
        }
      }

      if (foundCleanAlternative) {
        safeRoute = foundCleanAlternative;
      } else {
        // Calculate deterministic bypass waypoint offset perpendicular to corridor
        const dLat = destCoords.lat - originCoords.lat;
        const dLng = destCoords.lng - originCoords.lng;
        const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
        const perpLat = -dLng / len;
        const perpLng = dLat / len;

        const bp1 = {
          lat: parseFloat((incidentCoords.lat + perpLat * 0.18).toFixed(5)),
          lng: parseFloat((incidentCoords.lng + perpLng * 0.18).toFixed(5)),
        };
        const bp2 = {
          lat: parseFloat((incidentCoords.lat - perpLat * 0.18).toFixed(5)),
          lng: parseFloat((incidentCoords.lng - perpLng * 0.18).toFixed(5)),
        };

        let detourRoutes = null;
        try {
          detourRoutes = await fetchOSRM(`${originCoords.lng},${originCoords.lat};${bp1.lng},${bp1.lat};${destCoords.lng},${destCoords.lat}`);
          detourWaypointObj = { ...bp1, name: `Bypass around ${incidentVal}` };
        } catch (e1) {
          try {
            detourRoutes = await fetchOSRM(`${originCoords.lng},${originCoords.lat};${bp2.lng},${bp2.lat};${destCoords.lng},${destCoords.lat}`);
            detourWaypointObj = { ...bp2, name: `Bypass around ${incidentVal}` };
          } catch (e2) {
            console.warn("OSRM detour waypoint could not be mapped, generating safe bypass corridor.");
            detourRoutes = [createDetourFallbackRoute(originCoords, bp1, destCoords, originVal, destVal, incidentVal)];
            detourWaypointObj = { ...bp1, name: `Bypass around ${incidentVal}` };
          }
        }

        if (detourRoutes && detourRoutes.length > 0) {
          safeRoute = detourRoutes[0];
        }
      }
    }

    const safePath = safeRoute.geometry.coordinates.map((c) => [c[1], c[0]]);
    const safeDistKm = Math.round((safeRoute.distance / 1000) * 10) / 10;
    const safeDurMin = Math.round(safeRoute.duration / 60);
    const safeSteps = formatSteps(safeRoute.legs);

    // 4. Generate AI Safe Route Evaluation Report
    let aiReport = null;
    if (window.NE8AiRouteEngine) {
      aiReport = window.NE8AiRouteEngine.generateSafeRoute(originVal, destVal, incidentVal || "Corridor", {
        distanceKm: safeDistKm,
        durationMin: safeDurMin,
      });
      aiReport.detourActive = isDetourActive;
      aiReport.originalRouteBlocked = entersExclusionZone && requiresDetour;
      aiReport.cautionOnly = entersExclusionZone && !requiresDetour;
      aiReport.minDistToIncident = minDistanceToIncident;
      aiReport.directDistKm = directDistKm;
      aiReport.directDurMin = directDurMin;
      aiReport.safeDistKm = safeDistKm;
      aiReport.safeDurMin = safeDurMin;
      aiReport.incidentDesc = incidentDesc;
      aiReport.disasterEval = disasterEval;
      aiReport.detectedIncident = detectedIncident;
      if (detourWaypointObj) aiReport.detourWaypoint = detourWaypointObj;

      renderAiRouteEvaluation(
        aiReport,
        incidentVal,
        incidentCoords,
        entersExclusionZone,
        minDistanceToIncident,
        incidentDesc,
        disasterEval,
        detectedIncident
      );
      renderElevationChart(aiReport);
    }

    // 5. Draw on Map (Google Map or Leaflet)
    if (map && window.google && window.google.maps && !window.USE_FALLBACK_MAP) {
      drawRouteOnGoogleMap(
        safePath,
        blockedRoute ? blockedRoute.geometry.coordinates.map((c) => [c[1], c[0]]) : null,
        incidentCoords,
        incidentVal,
        originCoords,
        destCoords,
        originVal,
        destVal,
        entersExclusionZone && requiresDetour,
        incidentDesc,
        disasterEval,
        detectedIncident
      );
    } else if (leafletMap && window.L) {
      drawRouteOnLeaflet(
        safePath,
        blockedRoute ? blockedRoute.geometry.coordinates.map((c) => [c[1], c[0]]) : null,
        incidentCoords,
        incidentVal,
        originCoords,
        destCoords,
        originVal,
        destVal,
        entersExclusionZone && requiresDetour,
        incidentDesc,
        disasterEval,
        detectedIncident
      );
    }

    // 6. External Google Maps Navigation link
    const waypointsForGmaps = (isDetourActive && detourWaypointObj) ? [detourWaypointObj] : [];
    lastNavigateUrl = googleMapsNavigateUrl(originVal, destVal, waypointsForGmaps);
    if (navBtn) {
      navBtn.href = lastNavigateUrl;
      navBtn.classList.remove("hidden");
    }

    // 7. Route Accessibility Score & UI
    const incidents = loadIncidents();
    const mockRouteForScore = {
      legs: [
        {
          distance: { value: safeDistKm * 1000, text: `${safeDistKm.toFixed(0)} km` },
          duration: { value: safeDurMin * 60, text: `${safeDurMin} min` },
          steps: safeSteps,
        },
      ],
      overview_path: safePath.map((pt) => ({ lat: () => pt[0], lng: () => pt[1] })),
    };
    const score = accessibilityScore(mockRouteForScore, incidents);

    if (scoreEl) {
      const openGmapsBtnText = typeof t === "function" ? t("btn_open_best_gmaps", "Open best route in Google Maps") : "Open best route in Google Maps";
      renderScore(
        scoreEl,
        score,
        `<a class="btn btn-google" id="google-nav-inline" href="${lastNavigateUrl}" target="_blank" rel="noopener">${openGmapsBtnText}</a>`
      );
    }

    const statusBadge = entersExclusionZone
      ? (requiresDetour ? `🛡️ Safe Detour Active (Disaster Blockade at ${incidentVal})` : `⚠️ Caution Advisory (Disaster Restriction at ${incidentVal})`)
      : `✅ Corridor Clear — Safe Direct Route`;
    if (status) {
      status.textContent = `${statusBadge} · Distance: ${safeDistKm} km · Travel time: ~${Math.floor(safeDurMin / 60)}h ${safeDurMin % 60}m`;
    }

    if (stepsEl) {
      stepsEl.innerHTML = safeSteps
        .slice(0, 18)
        .map((s) => `<li>${s.instructions} <span style="color:var(--muted); font-size:11px;">(${s.distance.text})</span></li>`)
        .join("");
    }
  } catch (err) {
    console.error("Plot route error:", err);
    if (status) status.textContent = "Route calculation updated.";
    if (scoreEl) {
      scoreEl.classList.remove("hidden");
      scoreEl.innerHTML = `<p style="color:#ef4444;">Route notice: ${err.message || err}</p>`;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "🛣️ Find Safe Route";
    }
    aiSubmitBtns.forEach((b) => {
      b.disabled = false;
      if (b.dataset.origHtml) b.innerHTML = b.dataset.origHtml;
    });
  }
}

// Cache for reactive re-rendering on language change
window.lastAiRouteEvaluationArgs = null;

// State for AI Voice Assistant Modal and Playback
window.aiVoiceState = {
  currentUtterance: null,
  isPaused: false,
  activeSpeechText: "",
  activeSpeechLang: "en",
  recognition: null,
  isListening: false,
};

function generateLocalizedVoiceAdvisory(ai, incidentData, lang) {
  if (!lang) lang = typeof getCurrentLanguage === "function" ? getCurrentLanguage() : "en";

  const origin = (ai && ai.origin) || "Origin";
  const dest = (ai && ai.destination) || "Destination";
  const safeDist = (ai && (ai.safeDistKm || ai.distanceKm)) || 0;
  const hours = Math.floor(((ai && ai.estMins) || 0) / 60);
  const mins = ((ai && ai.estMins) || 0) % 60;

  const incDisplay = incidentData ? (incidentData.incidentName || "Corridor") : "";
  const descText = incidentData ? (incidentData.descText || "") : "";
  const isDetour = incidentData ? incidentData.isDetour : false;
  const isCaution = incidentData ? incidentData.isCaution : false;

  let native = "";
  let phonetic = "";

  if (isDetour) {
    if (lang === "hi") {
      native = `ध्यान दें चालक: ${incDisplay} के पास मुख्य राजमार्ग आपदा के कारण अवरुद्ध है। ${descText}। खतरे से बचने के लिए ${safeDist} किलोमीटर का स्वचालित सुरक्षित बाईपास तैयार किया गया है। कृपया हरे रंग के सुरक्षित मार्ग का पालन करें।`;
      phonetic = `Dhyan dein chalak: ${incDisplay} ke paas mukhya highway aafat ke karan band hai. ${descText}. Khatre se bachne ke liye ${safeDist} kilometer ka safe bypass taiyyar kiya gaya hai. Kripya hare rang ke safe route ka palan karein.`;
    } else if (lang === "as") {
      native = `চালকৰ দৃষ্টি আকৰ্ষণ: ${incDisplay}ৰ ওচৰত মুখ্য ঘাইপথ দুৰ্যোগৰ বাবে বন্ধ হৈ আছে। ${descText}। বিপদ সংকুল অঞ্চল এৰাই চলিবলৈ ${safeDist} কিলোমিটাৰৰ বিকল্প নিৰাপদ বাইপাছ পথ নিৰ্ণয় কৰা হৈছে। অনুগ্ৰহ কৰি সেউজীয়া পথটো অনুসৰণ কৰক।`;
      phonetic = `Syalokor dristi akorson: ${incDisplay}-or osorot mukhya highway durjugor babe bondho ase. ${descText}. Bipod erai soliboloi ${safeDist} kilometeror safe bypass dhora hoise. Xeuziya poth onuxoron korok.`;
    } else if (lang === "bn") {
      native = `চালকের দৃষ্টি আকর্ষণ: ${incDisplay}-এর কাছে প্রধান মহাসড়ক দুর্যোগের কারণে অবরুদ্ধ। ${descText}। বিপদ এলাকা এড়াতে ${safeDist} কিলোমিটারের বিকল্প নিরাপদ বাইপাস তৈরি করা হয়েছে। অনুগ্রহ করে সবুজ রুটটি অনুসরণ করুন।`;
      phonetic = `Chaloker drishti akorshon: ${incDisplay}-er kache pradhan highway biporjoyer karone bondho ache. ${descText}. Bipod erate ${safeDist} kilometerer safe bypass toiri kora hoyeche. Sobuj rasta onushoron korun.`;
    } else {
      native = `Attention driver: The direct highway near ${incDisplay} is blocked by a disaster. Verified report states: ${descText}. An automated safe detour of ${safeDist} kilometers has been calculated to bypass the danger zone. Please follow the green line on your screen.`;
      phonetic = native;
    }
  } else if (isCaution) {
    if (lang === "hi") {
      native = `${origin} और ${dest} के बीच सावधानी से वाहन चलाएं। ${incDisplay} के पास मार्ग में चेतावनी: ${descText}। गति धीमी रखें, सुरक्षित दूरी बनाए रखें और दिशा-निर्देशों का पालन करें।`;
      phonetic = `${origin} aur ${dest} ke beech sawdhani se gaadi chalayein. ${incDisplay} ke paas raste mein chetavni: ${descText}. Speed dheemi rakhein, surakshit doori banaye rakhein aur nirdeshon ka palan karein.`;
    } else if (lang === "as") {
      native = `${origin} আৰু ${dest}ৰ মাজত যাত্ৰা কৰোঁতে সাৱধান হওক। ${incDisplay}ত সতৰ্কবাৰ্তা: ${descText}। যান-বাহন ধীৰে চলাওক আৰু নিৰাপদ দূৰত্ব বজাই ৰাখক।`;
      phonetic = `${origin} aru ${dest}-or majot jatra korute xavdhan houk. ${incDisplay}-ot xotorkobarta: ${descText}. Gari dheere solauk aru xurokhito durotwo rakhok.`;
    } else if (lang === "bn") {
      native = `${origin} এবং ${dest}-এর মধ্যে চলাচলের ক্ষেত্রে সতর্কতা অবলম্বন করুন। ${incDisplay}-এ সতর্কতা: ${descText}। সাবধানে ও ধীর गतिতে গাড়ি চালান এবং নির্দেশনা মেনে চলুন।`;
      phonetic = `${origin} ebong ${dest}-er moddhe shabdhane gari chalaben. ${incDisplay}-e shotorkobarta: ${descText}. Goti kom rakhun ebong nirapod durotwo bojay rakhun.`;
    } else {
      native = `Caution advised between ${origin} and ${dest}. At ${incDisplay}, disaster advisory states: ${descText}. Drive slowly, use headlights, and follow convoy directions.`;
      phonetic = native;
    }
  } else {
    // Safe / Clear
    if (lang === "hi") {
      native = `${origin} से ${dest} के लिए सुरक्षित मार्ग मिल गया है। कुल दूरी ${safeDist} किलोमीटर है और यात्रा का समय लगभग ${hours} घंटे ${mins} मिनट है। सड़क पूरी तरह साफ़ और सुरक्षित है। शुभ यात्रा।`;
      phonetic = `${origin} se ${dest} ke liye surakshit rasta mil gaya hai. Kul doori ${safeDist} kilometer hai aur yatra ka samay lagbhag ${hours} ghante ${mins} minute hai. Sadak poori tarah saaf aur safe hai. Shubh yatra.`;
    } else if (lang === "as") {
      native = `${origin}ৰ পৰা ${dest}লৈ নিৰাপদ পথ পোৱা গৈছে। মুঠ দূৰত্ব ${safeDist} কিলোমিটাৰ আৰু আনুমানিক সময় ${hours} ঘণ্টা ${mins} মিনিট। পথ সম্পূৰ্ণৰূপে মুকলি আৰু সুৰক্ষিত। শুভ যাত্ৰা।`;
      phonetic = `${origin}-or pora ${dest}-oloi xurokhito poth pua goise. Muth durotwo ${safeDist} kilometer aru xomoy ${hours} ghonta ${mins} minute. Poth xompurno mukoli aru xurokhito. Xubho jatra.`;
    } else if (lang === "bn") {
      native = `${origin} থেকে ${dest}-এর নিরাপদ রুট পাওয়া গেছে। মোট দূরত্ব ${safeDist} কিলোমিটার এবং আনুমানিক সময় ${hours} ঘণ্টা ${mins} মিনিট। রাস্তা সম্পূর্ণ পরিষ্কার এবং নিরাপদ। শুভ যাত্রা।`;
      phonetic = `${origin} theke ${dest}-er nirapod rasta pawa geche. Mot durotwo ${safeDist} kilometer ebong anumanik shomoy ${hours} ghonta ${mins} minute. Rasta shompurno porishkar o nirapod. Shuvo jatra.`;
    } else {
      native = `Safe route found from ${origin} to ${dest}. Total distance is ${safeDist} kilometers, travel time is approximately ${hours} hours and ${mins} minutes. Road is clear and safe to drive. Safe travels.`;
      phonetic = native;
    }
  }

  return {
    native,
    phonetic,
    toString() {
      return this.native;
    },
  };
}

function updateDriverHud(ai, entersExclusionZone, isDetour, isCaution, incDisplay) {
  const hudContainer = document.getElementById("driver-hud-container");
  if (!hudContainer) return;

  let hudClass = "hud-safe";
  let signalEmoji = "🟢";
  let hudTitle = typeof t === "function" ? t("driver_hud_go", "ROAD CLEAR / GO") : "ROAD CLEAR / GO";
  let hudSub = typeof t === "function" ? t("driver_hud_go_sub", "Safe driving conditions · 0 active landslides") : "Safe driving conditions · 0 active landslides";

  if (entersExclusionZone) {
    if (isDetour) {
      hudClass = "hud-blocked";
      signalEmoji = "🛑";
      hudTitle = typeof t === "function" ? t("driver_hud_stop", "STOP / DANGER AHEAD") : "STOP / DANGER AHEAD";
      hudSub = `${typeof t === "function" ? t("driver_hud_stop_sub", "Road blocked · Follow detour corridor around hazard") : "Road blocked · Follow detour corridor around hazard"} (${incDisplay})`;
    } else {
      hudClass = "hud-caution";
      signalEmoji = "⚠️";
      hudTitle = typeof t === "function" ? t("driver_hud_slow", "CAUTION / GO SLOW") : "CAUTION / GO SLOW";
      hudSub = `${typeof t === "function" ? t("driver_hud_slow_sub", "Drive 20 km/h · Slippery pass or single-lane crawl") : "Drive 20 km/h · Slippery pass or single-lane crawl"} (${incDisplay})`;
    }
  }

  const btnSpeakText = typeof t === "function" ? t("driver_tap_to_listen", "🔊 Tap to Listen") : "🔊 Tap to Listen";
  const btnGmapsText = typeof t === "function" ? t("driver_start_gmaps", "🗺️ Open Google Maps Navigation") : "🗺️ Open Google Maps Navigation";
  const mapNavUrl = lastNavigateUrl || (ai ? googleMapsNavigateUrl(ai.origin, ai.destination, []) : "#");

  hudContainer.innerHTML = `
    <div class="driver-hud-card ${hudClass}">
      <div class="driver-hud-top">
        <div class="driver-signal-banner">
          <div class="driver-signal-light">${signalEmoji}</div>
          <div>
            <h2 class="driver-verdict-title">${hudTitle}</h2>
            <p class="driver-verdict-sub">${hudSub}</p>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button type="button" class="btn-driver-speak-hero" onclick="window.speakAiRouteAdvisory()">
            <span>${btnSpeakText}</span>
          </button>
          <a class="btn-driver-gmaps-hero" href="${mapNavUrl}" target="_blank" rel="noopener">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span>${btnGmapsText}</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

function initDriverHud() {
  const hudContainer = document.getElementById("driver-hud-container");
  if (!hudContainer) return;
  const btnSpeakText = typeof t === "function" ? t("driver_tap_to_listen", "🔊 Tap to Listen") : "🔊 Tap to Listen";
  const goTitle = typeof t === "function" ? t("driver_hud_go", "ROAD CLEAR / GO") : "ROAD CLEAR / GO";
  const goSub = typeof t === "function" ? t("driver_hud_go_sub", "Safe driving conditions · 0 active landslides") : "Safe driving conditions · 0 active landslides";

  hudContainer.innerHTML = `
    <div class="driver-hud-card hud-safe">
      <div class="driver-hud-top">
        <div class="driver-signal-banner">
          <div class="driver-signal-light">🟢</div>
          <div>
            <h2 class="driver-verdict-title">${goTitle}</h2>
            <p class="driver-verdict-sub">${goSub} · Tap any corridor above or pick a destination</p>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button type="button" class="btn-driver-speak-hero" onclick="window.speakAiRouteAdvisory()">
            <span>${btnSpeakText}</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderAiRouteEvaluation(ai, incidentName, incidentCoords, entersExclusionZone, minDist, incidentDesc, disasterEval, detectedIncident) {
  window.lastAiRouteEvaluationArgs = {
    ai,
    incidentName,
    incidentCoords,
    entersExclusionZone,
    minDist,
    incidentDesc,
    disasterEval,
    detectedIncident,
  };

  let container = document.getElementById("ai-eval-box");
  if (!container) {
    const scoreEl = document.getElementById("route-score");
    if (scoreEl && scoreEl.parentNode) {
      container = document.createElement("div");
      container.id = "ai-eval-box";
      container.className = "ai-eval-report";
      scoreEl.parentNode.insertBefore(container, scoreEl.nextSibling);
    }
  }
  if (!container || !ai) return;

  container.classList.remove("hidden");

  const lang = typeof getCurrentLanguage === "function" ? getCurrentLanguage() : "en";
  const incDisplay = incidentName || ai.incidentInput || (typeof t === "function" ? t("route_corridor", "Route Corridor") : "Route Corridor");
  const problemType = (detectedIncident && (detectedIncident.incident_type || (detectedIncident.hazards && detectedIncident.hazards[0]))) || "Natural Disaster";
  const problemPhoto = (detectedIncident && detectedIncident.photo) || (window.LIVE_PHOTOS && window.LIVE_PHOTOS.sample1) || "";
  const driverName = (detectedIncident && detectedIncident.driver) || (typeof t === "function" ? t("evidence_driver", "Driver Incident Report") : "Driver Incident Report");

  const safeDist = ai.safeDistKm || ai.distanceKm;
  const safeTime = `${Math.floor(ai.estMins / 60)}h ${ai.estMins % 60}m`;
  const descText = incidentDesc || (disasterEval && disasterEval.text) || "Verified field disaster report on mountain highway.";

  let statusClass = "status-safe";
  let statusIcon = "🟢";
  let statusTitle = typeof t === "function" ? t("safe_route_found", "SAFE ROUTE FOUND — ALL CLEAR") : "SAFE ROUTE FOUND — ALL CLEAR";
  let safetyVerdict = typeof t === "function" ? t("all_clear_verdict", "ALL CLEAR — Safe to drive") : "ALL CLEAR — Safe to drive";
  let recommendedRoute = `${typeof t === "function" ? t("direct_corridor", "Direct Corridor") : "Direct Corridor"}: ${ai.origin} ➔ ${ai.destination}`;
  let hazardInfo = typeof t === "function" ? t("corridor_clear_no_blocks", "Corridor Clear — 0 active blockages detected on highway") : "Corridor Clear — 0 active blockages detected on highway";
  let distTime = `${safeDist} km · ${safeTime}`;

  const isDetour = entersExclusionZone && (!disasterEval || disasterEval.decision !== "caution_passable");
  const isCaution = entersExclusionZone && (disasterEval && disasterEval.decision === "caution_passable");

  if (entersExclusionZone) {
    if (isDetour) {
      statusClass = "status-blocked";
      statusIcon = "🔴";
      statusTitle = typeof t === "function" ? t("route_blocked_detour", "ROUTE BLOCKED — SAFE DETOUR ACTIVE") : "ROUTE BLOCKED — SAFE DETOUR ACTIVE";
      safetyVerdict = `${typeof t === "function" ? t("safe_detour_verdict", "SAFE DETOUR ACTIVE — Bypassed danger zone") : "SAFE DETOUR ACTIVE"} (${incDisplay})`;
      recommendedRoute = `${typeof t === "function" ? t("safe_bypass", "Safe Bypass: Detouring around") : "Safe Bypass: Detouring around"} ${incDisplay}`;
      hazardInfo = `⚠️ ${problemType} at ${incDisplay} (10 km exclusion zone)`;
    } else {
      statusClass = "status-caution";
      statusIcon = "🟡";
      statusTitle = typeof t === "function" ? t("caution_advisory", "CAUTION ADVISORY — PASS RESTRICTIONS") : "CAUTION ADVISORY — PASS RESTRICTIONS";
      safetyVerdict = `${typeof t === "function" ? t("drive_caution_verdict", "DRIVE WITH EXTREME CAUTION — Restricted movement") : "DRIVE WITH EXTREME CAUTION"} (${incDisplay})`;
      recommendedRoute = `${ai.origin} ➔ ${ai.destination}`;
      hazardInfo = `❄️ ${problemType} at ${incDisplay}`;
    }
  }

  const voiceAdvisory = generateLocalizedVoiceAdvisory(ai, { incidentName: incDisplay, descText, problemType, isDetour, isCaution }, lang);
  window.aiVoiceState.activeSpeechText = typeof voiceAdvisory === "object" ? voiceAdvisory.native : voiceAdvisory;
  window.aiVoiceState.activeSpeechPhonetic = typeof voiceAdvisory === "object" ? voiceAdvisory.phonetic : voiceAdvisory;
  window.aiVoiceState.activeSpeechLang = lang;

  const btnListenText = typeof t === "function" ? t("btn_listen_voice", "Listen to Voice Directions") : "Listen to Voice Directions";
  const radarText = entersExclusionZone
    ? (typeof t === "function" ? t("ai_disaster_radar", "AI DISASTER RADAR") : "AI DISASTER RADAR")
    : (typeof t === "function" ? t("ai_radar_verified", "AI RADAR VERIFIED") : "AI RADAR VERIFIED");
  const recRouteLabel = typeof t === "function" ? t("rec_route_label", "Recommended Route") : "Recommended Route";
  const detectedHazardLabel = typeof t === "function" ? t("detected_hazard_label", "Detected Hazard") : "Detected Hazard";
  const distTravelLabel = typeof t === "function" ? t("dist_travel_time_label", "Distance & Travel Time") : "Distance & Travel Time";
  const safetyVerdictLabel = typeof t === "function" ? t("safety_verdict_label", "Safety Verdict") : "Safety Verdict";
  const directClearTitle = typeof t === "function" ? t("direct_highway_clear", "DIRECT HIGHWAY CORRIDOR 100% CLEAR") : "DIRECT HIGHWAY CORRIDOR 100% CLEAR";
  const directClearDesc = typeof t === "function" ? t("clear_desc", "AI scanned all driver disaster photos & telemetry along the corridor. Zero active landslides or blockades detected.") : "AI scanned all driver disaster photos & telemetry along the corridor. Zero active landslides or blockades detected.";
  const exclusionZoneNotice = typeof t === "function" ? t("exclusion_zone_enforced", "10 km Exclusion Zone Enforced") : "10 km Exclusion Zone Enforced";

  // Update Top Driver Traffic Light HUD
  updateDriverHud(ai, entersExclusionZone, isDetour, isCaution, incDisplay);

  // Build Card HTML
  if (entersExclusionZone) {
    const badgeLabel = statusClass === "status-blocked" ? "ROAD BLOCKED" : "CAUTION ADVISORY";
    const badgeColor = statusClass === "status-blocked" ? "#ef4444" : "#f59e0b";

    container.innerHTML = `
      <div class="driver-status-card ${statusClass}">
        <div class="status-header">
          <span class="status-title-text">${statusIcon} ${statusTitle}</span>
          <span class="status-chip-tag">${radarText}</span>
        </div>

        <!-- Detected Hazard Photo Banner -->
        <div class="detected-hazard-card">
          <div class="hazard-photo-wrap">
            <img src="${problemPhoto}" alt="Disaster Evidence Photo" class="hazard-thumb" onerror="this.style.display='none'" />
            <span class="hazard-photo-badge" style="background:${badgeColor};">${problemType.toUpperCase()}</span>
          </div>
          <div class="hazard-details">
            <div class="hazard-meta-row">
              <span class="hazard-location">📍 ${incDisplay}</span>
              <span class="hazard-severity-badge ${statusClass}">${badgeLabel}</span>
            </div>
            <p class="hazard-desc">&ldquo;${descText}&rdquo;</p>
            <div class="hazard-sub-meta">
              <span>📸 ${driverName}</span>
              <span>🛡️ ${exclusionZoneNotice}</span>
            </div>
          </div>
        </div>

        <div class="driver-info-grid">
          <div class="driver-info-row">
            <span class="driver-info-label">${recRouteLabel}</span>
            <span class="driver-info-val">${recommendedRoute}</span>
          </div>

          <div class="driver-info-row">
            <span class="driver-info-label">${detectedHazardLabel}</span>
            <span class="driver-info-val">${hazardInfo}</span>
          </div>

          <div class="driver-info-row">
            <span class="driver-info-label">${distTravelLabel}</span>
            <span class="driver-info-val">${distTime}</span>
          </div>

          <div class="driver-info-row">
            <span class="driver-info-label">${safetyVerdictLabel}</span>
            <span class="driver-info-val">${safetyVerdict}</span>
          </div>
        </div>

        <div class="driver-action-row">
          <button type="button" class="btn-voice-speak" onclick="window.speakAiRouteAdvisory()">
            🔊 ${btnListenText}
          </button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="driver-status-card status-safe">
        <div class="status-header">
          <span class="status-title-text">${statusIcon} ${statusTitle}</span>
          <span class="status-chip-tag">${radarText}</span>
        </div>

        <div class="clear-corridor-card">
          <div class="clear-icon">✅</div>
          <div class="clear-details">
            <strong>${directClearTitle}</strong>
            <p>${directClearDesc}</p>
          </div>
        </div>

        <div class="driver-info-grid">
          <div class="driver-info-row">
            <span class="driver-info-label">${recRouteLabel}</span>
            <span class="driver-info-val">${recommendedRoute}</span>
          </div>

          <div class="driver-info-row">
            <span class="driver-info-label">${distTravelLabel}</span>
            <span class="driver-info-val">${distTime}</span>
          </div>

          <div class="driver-info-row">
            <span class="driver-info-label">${safetyVerdictLabel}</span>
            <span class="driver-info-val">${safetyVerdict}</span>
          </div>
        </div>

        <div class="driver-action-row">
          <button type="button" class="btn-voice-speak" onclick="window.speakAiRouteAdvisory()">
            🔊 ${btnListenText}
          </button>
        </div>
      </div>
    `;
  }
}

window.openAiVoiceModal = function (skipPrompt = false) {
  let modalBackdrop = document.getElementById("ai-voice-modal-backdrop");
  if (!modalBackdrop) {
    modalBackdrop = document.createElement("div");
    modalBackdrop.id = "ai-voice-modal-backdrop";
    modalBackdrop.className = "ai-voice-modal-backdrop";
    document.body.appendChild(modalBackdrop);
  }

  const currentLang = typeof getCurrentLanguage === "function" ? getCurrentLanguage() : "en";
  const titleText = typeof t === "function" ? t("voice_modal_title", "AI Road Voice Assistant") : "AI Road Voice Assistant";
  const askLangText = typeof t === "function" ? t("voice_ask_lang", "Which language would you like me to read the road directions in?") : "Which language would you like me to read the road directions in?";
  const subpromptText = typeof t === "function" ? t("voice_subprompt", "Choose your preferred language for spoken voice navigation & route advisory") : "Choose your preferred language for spoken voice navigation & route advisory";
  const listeningText = typeof t === "function" ? t("voice_listening", "Listening... Speak your language (English, Hindi, Assamese, Bengali)") : "Listening... Speak your language (English, Hindi, Assamese, Bengali)";
  const pauseText = typeof t === "function" ? t("voice_btn_pause", "Pause") : "Pause";
  const replayText = typeof t === "function" ? t("voice_btn_replay", "Replay") : "Replay";
  const stopText = typeof t === "function" ? t("voice_btn_stop", "Stop") : "Stop";

  modalBackdrop.innerHTML = `
    <div class="ai-voice-modal" role="dialog" aria-modal="true">
      <div class="ai-voice-modal-header">
        <span class="ai-voice-title-badge">
          <span>🎙️</span>
          <span>${titleText}</span>
        </span>
        <button type="button" class="ai-voice-btn-close" onclick="window.closeAiVoiceModal()" title="Close">&times;</button>
      </div>

      <!-- Animated Voice Visualizer Wave -->
      <div class="ai-voice-visualizer">
        <div class="ai-voice-wave-bar speaking"></div>
        <div class="ai-voice-wave-bar speaking"></div>
        <div class="ai-voice-wave-bar speaking"></div>
        <div class="ai-voice-wave-bar speaking"></div>
        <div class="ai-voice-wave-bar speaking"></div>
        <div class="ai-voice-wave-bar speaking"></div>
        <div class="ai-voice-wave-bar speaking"></div>
      </div>

      <div class="ai-voice-prompt-text" id="ai-voice-prompt-text">${askLangText}</div>
      <div class="ai-voice-subprompt" id="ai-voice-subprompt">${subpromptText}</div>

      <!-- Speech Recognition Live Feedback (if supported) -->
      <div class="ai-voice-mic-status" id="ai-voice-mic-status" style="display: none;">
        <span>🎤</span>
        <span id="ai-voice-mic-text">${listeningText}</span>
      </div>

      <!-- 4 Language Cards -->
      <div class="ai-voice-lang-grid">
        <button type="button" class="ai-voice-lang-card ${currentLang === 'en' ? 'is-active' : ''}" onclick="window.selectVoiceLanguage('en')">
          <span class="ai-voice-lang-flag">🇬🇧</span>
          <span class="ai-voice-lang-native">English</span>
          <span class="ai-voice-lang-sub">Route Directions in English</span>
        </button>
        <button type="button" class="ai-voice-lang-card ${currentLang === 'hi' ? 'is-active' : ''}" onclick="window.selectVoiceLanguage('hi')">
          <span class="ai-voice-lang-flag">🇮🇳</span>
          <span class="ai-voice-lang-native">हिंदी (Hindi)</span>
          <span class="ai-voice-lang-sub">सड़क सलाह हिंदी में</span>
        </button>
        <button type="button" class="ai-voice-lang-card ${currentLang === 'as' ? 'is-active' : ''}" onclick="window.selectVoiceLanguage('as')">
          <span class="ai-voice-lang-flag">🇮🇳</span>
          <span class="ai-voice-lang-native">অসমীয়া (Assamese)</span>
          <span class="ai-voice-lang-sub">পথ পৰামৰ্শ অসমীয়াত</span>
        </button>
        <button type="button" class="ai-voice-lang-card ${currentLang === 'bn' ? 'is-active' : ''}" onclick="window.selectVoiceLanguage('bn')">
          <span class="ai-voice-lang-flag">🇮🇳</span>
          <span class="ai-voice-lang-native">বাংলা (Bengali)</span>
          <span class="ai-voice-lang-sub">রাস্তার নির্দেশনা বাংলায়</span>
        </button>
      </div>

      <div class="ai-voice-speech-preview" id="ai-voice-speech-preview" style="display: none;"></div>

      <!-- Audio Playback Controls -->
      <div class="ai-voice-playback-bar">
        <div style="display: flex; gap: 6px;">
          <button type="button" class="ai-voice-ctrl-btn" id="ai-voice-btn-toggle-play" onclick="window.toggleVoicePlayback()">
            ⏸️ ${pauseText}
          </button>
          <button type="button" class="ai-voice-ctrl-btn" onclick="window.replayCurrentVoiceAdvisory()">
            🔁 ${replayText}
          </button>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="ai-voice-ctrl-btn btn-stop" onclick="window.stopAiVoice()">
            🛑 ${stopText}
          </button>
        </div>
      </div>
    </div>
  `;

  modalBackdrop.style.display = "flex";

  // Prompt the user verbally via Web Speech API in their active language
  if (!skipPrompt && window.NE8Voice) {
    let promptNative = "Which language would you like me to read the road directions in? Please choose English, Hindi, Assamese, or Bengali.";
    let promptPhonetic = promptNative;

    if (currentLang === "hi") {
      promptNative = "सड़क मार्ग निर्देश सुनने के लिए भाषा चुनें: हिंदी, असमिया, बांग्ला या अंग्रेजी।";
      promptPhonetic = "Sadak nirdesh sunne ke liye bhasha chunein: Hindi, Asamiya, Bangla ya Angrezi.";
    } else if (currentLang === "as") {
      promptNative = "পথৰ নিৰ্দেশনা শুনিবলৈ ভাষা বাছক: অসমীয়া, হিন্দী, বাংলা বা ইংৰাজী।";
      promptPhonetic = "Pothor nirdexona suniboloi bhasa basok: Asamiya, Hindi, Bangla ba Engrezi.";
    } else if (currentLang === "bn") {
      promptNative = "রাস্তার নির্দেশনা শোনার জন্য ভাষা নির্বাচন করুন: বাংলা, হিন্দি, অসমীয়া বা ইংরেজি।";
      promptPhonetic = "Rastar nirdeshona shonar jonno bhasha nirbachon korun: Bangla, Hindi, Asamiya ba English.";
    }

    window.NE8Voice.speak({
      lang: currentLang,
      textNative: promptNative,
      textPhonetic: promptPhonetic,
      rate: 1.0,
      onStart: () => {
        document.querySelectorAll(".ai-voice-wave-bar").forEach((b) => b.classList.add("speaking"));
      },
      onEnd: () => {
        document.querySelectorAll(".ai-voice-wave-bar").forEach((b) => b.classList.remove("speaking"));
      },
    });
  }

  // Setup Web Speech Recognition if supported
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRec) {
    try {
      if (window.aiVoiceState.recognition) {
        window.aiVoiceState.recognition.abort();
      }
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = currentLang === "hi" ? "hi-IN" : currentLang === "bn" ? "bn-IN" : "en-IN";

      const micStatus = document.getElementById("ai-voice-mic-status");
      if (micStatus) micStatus.style.display = "flex";

      rec.onresult = (e) => {
        const transcript = (e.results[0][0].transcript || "").toLowerCase();
        if (transcript.includes("hindi") || transcript.includes("हिंदी")) {
          window.selectVoiceLanguage("hi");
        } else if (transcript.includes("assamese") || transcript.includes("অসমীয়া") || transcript.includes("asami")) {
          window.selectVoiceLanguage("as");
        } else if (transcript.includes("bengali") || transcript.includes("বাংলা") || transcript.includes("bangla")) {
          window.selectVoiceLanguage("bn");
        } else if (transcript.includes("english") || transcript.includes("अंग्रेजी") || transcript.includes("ইংৰাজী")) {
          window.selectVoiceLanguage("en");
        }
      };
      rec.onerror = () => {};
      rec.onend = () => {
        window.aiVoiceState.isListening = false;
      };
      rec.start();
      window.aiVoiceState.recognition = rec;
      window.aiVoiceState.isListening = true;
    } catch {
      // Speech recognition not permitted or unavailable
    }
  }
};

window.closeAiVoiceModal = function () {
  const modal = document.getElementById("ai-voice-modal-backdrop");
  if (modal) modal.style.display = "none";
  if (window.aiVoiceState.recognition) {
    try {
      window.aiVoiceState.recognition.abort();
    } catch {}
  }
  if (window.NE8Voice) {
    window.NE8Voice.stop();
  }
  window.aiVoiceState.isPaused = false;
  document.querySelectorAll(".ai-voice-wave-bar").forEach((b) => b.classList.remove("speaking"));
};

window.selectVoiceLanguage = function (langCode) {
  if (typeof setLanguage === "function") {
    setLanguage(langCode);
  }

  // Highlight active card
  document.querySelectorAll(".ai-voice-lang-card").forEach((card, idx) => {
    const codes = ["en", "hi", "as", "bn"];
    card.classList.toggle("is-active", codes[idx] === langCode);
  });

  // Determine speech text for current route
  let advisoryObj;
  if (window.lastAiRouteEvaluationArgs) {
    const a = window.lastAiRouteEvaluationArgs;
    const isDetour = a.entersExclusionZone && (!a.disasterEval || a.disasterEval.decision !== "caution_passable");
    const isCaution = a.entersExclusionZone && a.disasterEval && a.disasterEval.decision === "caution_passable";
    const incidentData = {
      incidentName: a.incidentName || (a.ai && a.ai.incidentInput) || "Corridor",
      descText: a.incidentDesc || (a.disasterEval && a.disasterEval.text) || "",
      problemType:
        (a.detectedIncident &&
          (a.detectedIncident.incident_type || (a.detectedIncident.hazards && a.detectedIncident.hazards[0]))) ||
        "Natural Disaster",
      isDetour,
      isCaution,
    };
    advisoryObj = generateLocalizedVoiceAdvisory(a.ai, incidentData, langCode);
  } else {
    advisoryObj = generateLocalizedVoiceAdvisory(
      { origin: "Guwahati, Assam", destination: "Shillong, Meghalaya", distanceKm: 98, estMins: 145 },
      null,
      langCode
    );
  }

  const advisoryNative = typeof advisoryObj === "object" ? advisoryObj.native : advisoryObj;
  const advisoryPhonetic = typeof advisoryObj === "object" ? advisoryObj.phonetic : advisoryObj;

  window.aiVoiceState.activeSpeechText = advisoryNative;
  window.aiVoiceState.activeSpeechPhonetic = advisoryPhonetic;
  window.aiVoiceState.activeSpeechLang = langCode;

  // Show live speech preview
  const preview = document.getElementById("ai-voice-speech-preview");
  if (preview) {
    preview.style.display = "block";
    preview.innerHTML = `<strong>🗣️ [${langCode.toUpperCase()}]:</strong> ${advisoryNative}`;
  }

  const promptText = document.getElementById("ai-voice-prompt-text");
  if (promptText) {
    promptText.textContent =
      typeof t === "function" ? t("voice_reading_active", "Reading Route Advisory...") : "Reading Route Advisory...";
  }

  // Confirmation intro
  const confKey = "voice_confirmed_" + langCode;
  const confNative = typeof t === "function" ? t(confKey) : "";
  let confPhonetic = "";
  if (langCode === "hi") confPhonetic = "Sadak nirdesh Hindi mein shuru ho rahe hain.";
  else if (langCode === "as") confPhonetic = "Oxomiyat pothor nirdexona xuru hoise.";
  else if (langCode === "bn") confPhonetic = "Banglay rastar nirdeshona shuru hocche.";
  else confPhonetic = confNative;

  const fullNative = confNative ? `${confNative} ${advisoryNative}` : advisoryNative;
  const fullPhonetic = confPhonetic ? `${confPhonetic} ${advisoryPhonetic}` : advisoryPhonetic;

  // Speak via unified NE8Voice engine
  if (window.NE8Voice) {
    window.NE8Voice.speak({
      lang: langCode,
      textNative: fullNative,
      textPhonetic: fullPhonetic,
      rate: 0.95,
      onStart: (info) => {
        document.querySelectorAll(".ai-voice-wave-bar").forEach((b) => b.classList.add("speaking"));
        const playBtn = document.getElementById("ai-voice-btn-toggle-play");
        if (playBtn) playBtn.innerHTML = `⏸️ ${typeof t === "function" ? t("voice_btn_pause", "Pause") : "Pause"}`;
        if (preview) {
          const badge = info.isNative
            ? `<span style="font-size: 11px; font-weight: 600; background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.35); margin-left: 8px;">🎙️ Native ${langCode.toUpperCase()} Voice</span>`
            : `<span style="font-size: 11px; font-weight: 600; background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(59, 130, 246, 0.35); margin-left: 8px;">✨ Clear Voice Engine Active</span>`;
          preview.innerHTML = `<strong>🗣️ [${langCode.toUpperCase()}]:</strong> ${advisoryNative} ${badge}`;
        }
      },
      onEnd: () => {
        document.querySelectorAll(".ai-voice-wave-bar").forEach((b) => b.classList.remove("speaking"));
        const playBtn = document.getElementById("ai-voice-btn-toggle-play");
        if (playBtn) playBtn.innerHTML = `▶️ ${typeof t === "function" ? t("voice_btn_play", "Play") : "Play"}`;
      },
      onError: () => {
        document.querySelectorAll(".ai-voice-wave-bar").forEach((b) => b.classList.remove("speaking"));
        const playBtn = document.getElementById("ai-voice-btn-toggle-play");
        if (playBtn) playBtn.innerHTML = `▶️ ${typeof t === "function" ? t("voice_btn_play", "Play") : "Play"}`;
      },
    });
  }
};

window.toggleVoicePlayback = function () {
  const btn = document.getElementById("ai-voice-btn-toggle-play");
  if (!("speechSynthesis" in window)) return;
  if (window.speechSynthesis.speaking) {
    if (window.speechSynthesis.paused || window.aiVoiceState.isPaused) {
      if (window.NE8Voice) window.NE8Voice.resume();
      window.aiVoiceState.isPaused = false;
      if (btn) btn.innerHTML = `⏸️ ${typeof t === "function" ? t("voice_btn_pause", "Pause") : "Pause"}`;
      document.querySelectorAll(".ai-voice-wave-bar").forEach((b) => b.classList.add("speaking"));
    } else {
      if (window.NE8Voice) window.NE8Voice.pause();
      window.aiVoiceState.isPaused = true;
      if (btn) btn.innerHTML = `▶️ ${typeof t === "function" ? t("voice_btn_play", "Resume") : "Resume"}`;
      document.querySelectorAll(".ai-voice-wave-bar").forEach((b) => b.classList.remove("speaking"));
    }
  } else if (window.aiVoiceState.activeSpeechLang) {
    window.selectVoiceLanguage(window.aiVoiceState.activeSpeechLang);
  }
};

window.replayCurrentVoiceAdvisory = function () {
  if (window.aiVoiceState.activeSpeechLang) {
    window.selectVoiceLanguage(window.aiVoiceState.activeSpeechLang);
  } else {
    window.selectVoiceLanguage(typeof getCurrentLanguage === "function" ? getCurrentLanguage() : "en");
  }
};

window.stopAiVoice = function () {
  if (window.NE8Voice) {
    window.NE8Voice.stop();
  }
  window.aiVoiceState.isPaused = false;
  document.querySelectorAll(".ai-voice-wave-bar").forEach((b) => b.classList.remove("speaking"));
  const btn = document.getElementById("ai-voice-btn-toggle-play");
  if (btn) btn.innerHTML = `▶️ ${typeof t === "function" ? t("voice_btn_play", "Play") : "Play"}`;
};

window.speakAiRouteAdvisory = function (text) {
  const currentLang = typeof getCurrentLanguage === "function" ? getCurrentLanguage() : "en";
  window.openAiVoiceModal(true);
  window.selectVoiceLanguage(currentLang);
};

function renderElevationChart(ai) {
  const container = document.getElementById("elevation-container");
  const canvas = document.getElementById("elevation-canvas");
  const meta = document.getElementById("elevation-meta");
  if (!container || !canvas || !ai || !ai.profilePoints) return;

  container.classList.remove("hidden");
  if (meta) meta.textContent = `${ai.distanceKm} km · Peak altitude ~${Math.max(...ai.profilePoints.map((p) => p.ele))}m`;

  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.offsetWidth || 400;
  const h = canvas.height = canvas.offsetHeight || 120;

  ctx.clearRect(0, 0, w, h);

  const points = ai.profilePoints;
  const maxEle = Math.max(...points.map((p) => p.ele)) * 1.25 || 2000;
  const pad = 24;

  const coords = points.map((p, idx) => {
    const x = pad + (idx / (points.length - 1)) * (w - pad * 2);
    const y = h - pad - (p.ele / maxEle) * (h - pad * 2);
    return { x, y, p };
  });

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(16, 185, 129, 0.4)");
  grad.addColorStop(1, "rgba(16, 185, 129, 0.0)");

  ctx.beginPath();
  ctx.moveTo(coords[0].x, h - pad);
  coords.forEach((c) => ctx.lineTo(c.x, c.y));
  ctx.lineTo(coords[coords.length - 1].x, h - pad);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  coords.forEach((c, idx) => {
    if (idx === 0) ctx.moveTo(c.x, c.y);
    else ctx.lineTo(c.x, c.y);
  });
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 3;
  ctx.stroke();

  coords.forEach((c) => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#34d399";
    ctx.fill();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillText(`${c.p.name} (${c.p.ele}m)`, c.x - 20, c.y - 8);
  });
}

function useMyPosition() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude: lat, longitude: lng } = pos.coords;
    if (!inNortheastBounds(lat, lng)) {
      const status = document.getElementById("map-status");
      if (status) {
        status.textContent = typeof t === "function" ? t("outside_ne_pos", "Your position is outside Northeast India. Type a yard inside the eight states.") : "Your position is outside Northeast India. Type a yard inside the eight states.";
      }
      return;
    }
    const orig = document.getElementById("origin");
    if (orig) orig.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    if (map && window.google && window.google.maps) {
      map.setCenter({ lat, lng });
      map.setZoom(10);
    } else if (leafletMap) {
      leafletMap.setView([lat, lng], 10);
    }
    plotRoute();
  });
}

window.initMap = initMap;
document.addEventListener("DOMContentLoaded", () => {
  loadGoogleMaps("initMap");
  initDriverHud();
  if (typeof renderFrequentDangers === "function") renderFrequentDangers();
  if (typeof syncIncidentsFromSupabase === "function") {
    syncIncidentsFromSupabase().then(() => {
      if (map && window.google && window.google.maps && typeof drawHazardsGoogle === "function") {
        drawHazardsGoogle();
      } else if (typeof leafletMap !== "undefined" && leafletMap && typeof drawHazardsLeaflet === "function") {
        drawHazardsLeaflet();
      }
    });
  }
});

window.addEventListener("ne8:incidents-synced", () => {
  if (map && window.google && window.google.maps && typeof drawHazardsGoogle === "function") {
    drawHazardsGoogle();
  } else if (typeof leafletMap !== "undefined" && leafletMap && typeof drawHazardsLeaflet === "function") {
    drawHazardsLeaflet();
  }
});

window.addEventListener("i18n:change", () => {
  if (typeof renderFrequentDangers === "function") renderFrequentDangers();
  if (window.lastAiRouteEvaluationArgs) {
    const a = window.lastAiRouteEvaluationArgs;
    renderAiRouteEvaluation(
      a.ai,
      a.incidentName,
      a.incidentCoords,
      a.entersExclusionZone,
      a.minDist,
      a.incidentDesc,
      a.disasterEval,
      a.detectedIncident
    );
  } else {
    initDriverHud();
  }
});
