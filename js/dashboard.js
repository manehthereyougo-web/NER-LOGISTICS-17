function baselineForState(state) {
  const incidents = loadIncidents();
  const nearbyIds = new Set();
  incidents.forEach((item) => {
    if (typeof item.lat !== "number") return;
    if (haversineKm(state.center, item) >= 80) return;
    hazardIdsForIncident(item).forEach((id) => nearbyIds.add(id));
  });
  let hazards = 90;
  nearbyIds.forEach((id) => {
    const def = riskById(id);
    if (def) hazards -= def.deduct;
  });
  const terrainById = {
    assam: 78,
    tripura: 74,
    meghalaya: 58,
    nagaland: 54,
    manipur: 56,
    mizoram: 52,
    sikkim: 48,
    "arunachal-pradesh": 46,
  };
  const continuity = 70;
  const terrain = terrainById[state.id] || 60;
  const network = 72;
  hazards = Math.max(0, Math.min(100, hazards));
  const overall = Math.round(continuity * 0.3 + terrain * 0.3 + hazards * 0.25 + network * 0.15);
  return { overall, band: scoreBand(overall), hazards, terrain };
}

function renderFrequentDangers() {
  const container = document.getElementById("danger-grid");
  if (!container || !window.FREQUENT_DANGER_ROADS) return;

  const viewHazardText = typeof t === "function" ? t("view_hazard_map", "View Hazard on Map") : "View Hazard on Map";
  const gmapsNavText = typeof t === "function" ? t("gmaps_nav", "Google Maps Detour") : "Google Maps Detour";
  const trafficLabelText = typeof t === "function" ? t("traffic_label", "Traffic Volume") : "Traffic Volume";

  container.innerHTML = FREQUENT_DANGER_ROADS.map((road) => {
    const mapNavUrl = googleMapsLocationUrl(road.lat, road.lng, road.name);
    const interactiveUrl = `trip-planner.html?origin=${encodeURIComponent(road.name)}&destination=${encodeURIComponent(road.highway)}`;

    return `<article class="card danger-card">
      <div>
        <div class="danger-card-head">
          <span class="highway-badge">${road.highway}</span>
          <span class="pill pill-${road.riskLevel}">${road.riskLevel}</span>
        </div>
        <h3 class="danger-card-title">${road.name}</h3>
        <div class="danger-card-subtitle">⚠️ ${road.riskTitle}</div>
        <p class="danger-card-desc">${road.description}</p>
      </div>
      <div class="danger-card-foot">
        <span class="traffic-pill">${trafficLabelText}: ${road.traffic}</span>
        <div style="display:flex; gap:6px;">
          <a class="btn btn-secondary btn-sm" href="${interactiveUrl}">${viewHazardText}</a>
          <a class="btn btn-google btn-sm" href="${mapNavUrl}" target="_blank" rel="noopener">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            ${gmapsNavText}
          </a>
        </div>
      </div>
    </article>`;
  }).join("");
}

function renderRoadsMonitoring() {
  const grid = document.getElementById("road-status-grid");
  if (!grid || typeof loadRoads !== "function") return;

  const roads = loadRoads();
  let openCount = 0;
  let limitedCount = 0;
  let highriskCount = 0;
  let blockedCount = 0;
  const updatedLabel = typeof t === "function" ? t("time_updated", "Updated") : "Updated";

  grid.innerHTML = roads.map((road) => {
    if (road.status === "OPEN") openCount++;
    else if (road.status === "LIMITED ACCESS") limitedCount++;
    else if (road.status === "HIGH RISK") highriskCount++;
    else if (road.status === "BLOCKED") blockedCount++;

    const statusPill = road.status === "OPEN" ? (typeof t === "function" ? t("pill_open", "OPEN") : "OPEN")
      : road.status === "LIMITED ACCESS" ? (typeof t === "function" ? t("pill_limited", "LIMITED") : "LIMITED ACCESS")
      : road.status === "HIGH RISK" ? (typeof t === "function" ? t("pill_highrisk", "HIGH RISK") : "HIGH RISK")
      : (typeof t === "function" ? t("pill_blocked", "BLOCKED") : "BLOCKED");

    return `<div style="background:rgba(15,23,42,0.6); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); font-size:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <strong style="color:#ffffff; font-size:13px;">${road.name} (${road.highway})</strong>
        <span class="pill pill-${road.statusClass}">${statusPill}</span>
      </div>
      <div style="color:var(--muted); font-size:11px; margin-bottom:4px;">📍 ${road.district}</div>
      <div style="color:#cbd5e1; font-size:11px; margin-bottom:4px;">⚠️ ${road.incident}</div>
      <small style="color:var(--accent); font-size:10px;">🕒 ${updatedLabel} ${road.lastUpdate}</small>
    </div>`;
  }).join("");

  const elOpen = document.getElementById("stat-open");
  if (elOpen) elOpen.textContent = String(openCount);
  const elLim = document.getElementById("stat-limited");
  if (elLim) elLim.textContent = String(limitedCount);
  const elHr = document.getElementById("stat-highrisk");
  if (elHr) elHr.textContent = String(highriskCount);
  const elBlk = document.getElementById("stat-blocked");
  if (elBlk) elBlk.textContent = String(blockedCount);
}

function renderLogisticsVehicles() {
  const grid = document.getElementById("logistics-vehicle-grid");
  if (!grid || typeof loadVehicles !== "function") return;

  const vehicles = loadVehicles();
  const vCountEl = document.getElementById("vehicle-count");
  if (vCountEl) vCountEl.textContent = String(vehicles.length);

  const routeLabel = typeof t === "function" ? t("route_label", "Route") : "Route";
  const posLabel = typeof t === "function" ? t("position_label", "Position") : "Position";
  const driverLabel = typeof t === "function" ? t("driver_label", "Driver") : "Driver";
  const etaLabel = typeof t === "function" ? t("eta_label", "ETA") : "ETA";

  grid.innerHTML = vehicles.map((v) => {
    const statusText = v.status === "Moving" ? (typeof t === "function" ? t("vehicle_moving", "Moving") : "Moving")
      : v.status === "Delayed" ? (typeof t === "function" ? t("vehicle_delayed", "Delayed") : "Delayed")
      : (typeof t === "function" ? t("vehicle_disrupted", "Route Disrupted") : "Route Disrupted");

    const cargoText = v.cargoType && typeof t === "function" ? t("cargo_" + v.cargoType, v.cargo) : v.cargo;

    return `<div style="background:rgba(15,23,42,0.6); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); font-size:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <strong style="color:var(--accent); font-size:13px;">${v.icon} ${v.code}</strong>
        <span class="pill pill-${v.statusClass}">${statusText}</span>
      </div>
      <div style="color:#ffffff; font-size:12px; font-weight:600; margin-bottom:4px;">${cargoText}</div>
      <div style="color:var(--muted); font-size:11px;">🛣️ ${routeLabel}: ${v.origin} ➔ ${v.destination}</div>
      <div style="color:#cbd5e1; font-size:11px; margin-top:4px;">📍 ${posLabel}: ${v.location} (${driverLabel}: ${v.driver})</div>
      <div style="color:${v.statusClass === 'risk' ? '#f87171' : v.statusClass === 'caution' ? '#fbbf24' : '#34d399'}; font-weight:700; font-size:11px; margin-top:4px;">⏱️ ${etaLabel}: ${v.eta}</div>
    </div>`;
  }).join("");
}

function renderAlertsFeed() {
  const container = document.getElementById("alerts-feed-list");
  if (!container || typeof loadAlerts !== "function") return;

  const alerts = loadAlerts();
  container.innerHTML = alerts.map((alt) => {
    const sevText = alt.severity === "CRITICAL" ? (typeof t === "function" ? t("alert_critical", "CRITICAL") : "CRITICAL")
      : alt.severity === "HIGH" ? (typeof t === "function" ? t("alert_high", "HIGH") : "HIGH")
      : alt.severity === "WARNING" ? (typeof t === "function" ? t("alert_warning", "WARNING") : "WARNING")
      : (typeof t === "function" ? t("alert_info", "INFO") : "INFO");

    return `<div style="background:rgba(15,23,42,0.6); padding:10px 14px; border-radius:8px; border-left:4px solid ${alt.levelClass === 'risk' ? '#ef4444' : alt.levelClass === 'caution' ? '#f59e0b' : '#10b981'}; display:flex; justify-content:space-between; align-items:flex-start; font-size:12px;">
      <div>
        <div style="display:flex; align-items:center; gap:6px;">
          <span>${alt.icon}</span>
          <strong style="color:#ffffff; font-size:13px;">${alt.title}</strong>
          <span class="pill pill-${alt.levelClass}">${sevText}</span>
        </div>
        <p style="margin:4px 0 0 0; color:#cbd5e1; font-size:12px;">${alt.description}</p>
        <small style="color:var(--muted); font-size:10px; display:inline-block; margin-top:4px;">📍 ${alt.location}</small>
      </div>
      <small style="color:var(--accent); font-size:11px; white-space:nowrap; margin-left:12px;">${alt.time}</small>
    </div>`;
  }).join("");
}

function renderDriverGlanceBar() {
  const container = document.getElementById("driver-glance-container");
  if (!container || typeof loadRoads !== "function") return;

  const roads = loadRoads();
  const openRoads = roads.filter((r) => r.status === "OPEN");
  const cautionRoads = roads.filter((r) => r.status === "LIMITED ACCESS" || r.status === "HIGH RISK");
  const blockedRoads = roads.filter((r) => r.status === "BLOCKED");

  const openTitle = typeof t === "function" ? t("pill_open", "OPEN") : "OPEN";
  const cautionTitle = typeof t === "function" ? t("driver_hud_slow", "CAUTION / GO SLOW") : "CAUTION / GO SLOW";
  const blockedTitle = typeof t === "function" ? t("pill_blocked", "BLOCKED") : "BLOCKED";

  container.innerHTML = `
    <!-- Column 1: Green OPEN -->
    <div class="driver-glance-column glance-open">
      <div class="glance-col-head">
        <span>🟢 ${openTitle}</span>
        <span>${openRoads.length}</span>
      </div>
      <div class="glance-road-list">
        ${openRoads.slice(0, 3).map((r) => `
          <div class="glance-road-item">
            <strong>${r.name} (${r.highway})</strong>
            <span style="color:#4ade80;">✓ Clear</span>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Column 2: Yellow CAUTION -->
    <div class="driver-glance-column glance-caution">
      <div class="glance-col-head">
        <span>🟡 ${cautionTitle}</span>
        <span>${cautionRoads.length}</span>
      </div>
      <div class="glance-road-list">
        ${cautionRoads.slice(0, 3).map((r) => `
          <div class="glance-road-item">
            <strong>${r.name}</strong>
            <span style="color:#facc15; font-size:11px;">⚠️ ${r.incident ? r.incident.split('&')[0].trim() : 'Slow'}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Column 3: Red BLOCKED -->
    <div class="driver-glance-column glance-blocked">
      <div class="glance-col-head">
        <span>🔴 ${blockedTitle}</span>
        <span>${blockedRoads.length}</span>
      </div>
      <div class="glance-road-list">
        ${blockedRoads.slice(0, 3).map((r) => `
          <div class="glance-road-item">
            <strong>${r.name}</strong>
            <span style="color:#f87171; font-size:11px;">🛑 Detour Req</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

window.speakDashboardSummary = function () {
  const lang = typeof getCurrentLanguage === "function" ? getCurrentLanguage() : "en";
  let textNative = "";
  let textPhonetic = "";

  if (lang === "hi") {
    textNative =
      "चालक अलर्ट सारांश: मणिपुर में NH-37 सड़क टूटने के कारण अवरुद्ध है। मेघालय में सोनपुर टनल और अरुणाचल में सेला पास पर संभलकर चलें। NH-27 और NH-8 पूरी तरह सुरक्षित और खुले हैं। शुभ यात्रा।";
    textPhonetic =
      "Chalak alert saransh: Manipur mein National Highway 37 sadak tootne ke karan band hai. Meghalaya mein Sonapur Tunnel aur Arunachal mein Sela Pass par gaadi sambhalkar chalayein. National Highway 27 aur National Highway 8 poori tarah surakshit aur khule hain. Shubh yatra.";
  } else if (lang === "as") {
    textNative =
      "চালকৰ সতৰ্কবাৰ্তা: মণিপুৰৰ NH-37 পথ ভগাৰ বাবে বন্ধ আছে। মেঘালয়ৰ চোনপুৰ আৰু অৰুণাচলৰ চেলা পাছত লাহেকৈ চলাওক। NH-27 আৰু NH-8 সম্পূৰ্ণ মুকলি আৰু সুৰক্ষিত। শুভ যাত্ৰা।";
    textPhonetic =
      "Syalokor xotorkobarta: Manipur-or National Highway 37 poth bhogar babe bondho ase. Meghalaya-r Sonapur Tunnel aru Arunachal-ot Sela Pass-ot lahekoi solauk. National Highway 27 aru 8 xompurno mukoli aru xurokhito. Xubho jatra.";
  } else if (lang === "bn") {
    textNative =
      "চালকের সতর্কতা সারাংশ: মণিপুরের NH-37 রাস্তা ভাঙার জন্য বন্ধ আছে। মেঘালয়ের সোনপুর এবং সেলা পাসে সাবধানে গাড়ি চালান। NH-27 এবং NH-8 সম্পূর্ণ খোলা ও নিরাপদ। শুভ যাত্রা।";
    textPhonetic =
      "Chaloker shotorkota sharangsho: Manipur-e National Highway 37 rasta bhangar jonno bondho ache. Meghalaya-r Sonapur Tunnel ebong Arunachal-e Sela Pass-e shabdhane gari chalaben. National Highway 27 ebong 8 shompurno khola o nirapod. Shuvo jatra.";
  } else {
    textNative =
      "Driver alert summary: Highway 37 in Manipur is blocked due to road collapse. Highway 6 Sonapur Tunnel and Sela Pass have caution warnings for slow movement. Highway 27 and Highway 8 are open and safe. Safe travels.";
    textPhonetic = textNative;
  }

  const btn = document.getElementById("btn-driver-glance-speak");
  let originalText = "";
  if (btn) {
    originalText = btn.innerHTML;
    btn.innerHTML = `<span>🔊</span> <span>${typeof t === "function" ? t("voice_reading_active", "Speaking...") : "Speaking..."}</span>`;
  }

  if (window.NE8Voice) {
    window.NE8Voice.speak({
      lang,
      textNative,
      textPhonetic,
      rate: 0.95,
      onEnd: () => {
        if (btn) btn.innerHTML = originalText;
      },
      onError: () => {
        if (btn) btn.innerHTML = originalText;
      },
    });
  }
};

function renderDashboard() {
  const count = loadIncidents().length;
  const countEl = document.getElementById("incident-count");
  if (countEl) countEl.textContent = String(count);

  const riskCount = loadIncidents().filter((i) => i.level === "risk").length;
  const riskEl = document.getElementById("risk-count");
  if (riskEl) riskEl.textContent = String(riskCount);

  renderDriverGlanceBar();
  renderRoadsMonitoring();
  renderLogisticsVehicles();
  renderAlertsFeed();
  initImdRadarDesk();

  const grid = document.getElementById("state-grid");
  if (grid) {
    grid.innerHTML = NE_STATES.map((s) => {
      const b = baselineForState(s);
      const stateName = typeof t === "function" ? t("state_" + s.id, s.name) : s.name;
      const capitalName = typeof t === "function" ? t("cap_" + s.id.replace(/-/g, "_"), s.capital) : s.capital;
      const bandLabel = typeof t === "function" ? t("band_" + b.band.key, b.band.label) : b.band.label;

      return `<article class="card card-pad state-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="color:#ffffff; font-size:16px; margin:0;">${stateName}</h3>
          <span id="imd-state-wx-${s.id}" style="font-size:12px; font-weight:700; color:var(--accent); display:flex; align-items:center; gap:4px;">
            <span class="pulse-dot"></span> <span>IMD</span>
          </span>
        </div>
        <p style="margin-top:4px; color:#cbd5e1;">${capitalName} · ${s.corridor}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
          <span style="font-family:var(--mono);font-size:24px;font-weight:700;color:var(--accent);">${b.overall}</span>
          <span class="pill pill-${b.band.key}">${bandLabel}</span>
        </div>
      </article>`;
    }).join("");
  }

  const body = document.getElementById("corridor-body");
  if (body) {
    const btnInteractiveText = typeof t === "function" ? t("btn_interactive_map", "Interactive Map") : "Interactive Map";
    const btnGmapsText = typeof t === "function" ? t("btn_gmaps", "Google Maps") : "Google Maps";

    body.innerHTML = NE_STATES.map((s) => {
      const b = baselineForState(s);
      const stateName = typeof t === "function" ? t("state_" + s.id, s.name) : s.name;
      const bandLabel = typeof t === "function" ? t("band_" + b.band.key, b.band.label) : b.band.label;
      const parts = s.corridor.split("·");
      const highwayTag = parts.length > 1 ? parts[0].trim() : "HWY";
      const corridorText = parts.length > 1 ? parts[1].trim() : s.corridor;
      const origin = corridorText.split("→")[0].trim() + ", " + s.name;
      const dest = corridorText.split("→")[1] ? corridorText.split("→")[1].trim() : "";
      const mapNavUrl = googleMapsNavigateUrl(origin, dest, []);
      return `<tr>
        <td class="table-state-name">${stateName}</td>
        <td class="table-corridor-name"><span class="highway-badge">${highwayTag}</span> ${corridorText}</td>
        <td>
          <div class="weather-badge" id="imd-corridor-wx-${s.id}" title="India Meteorological Department (IMD)">
            <span class="pulse-dot"></span>
            <span class="weather-cond" style="font-size:11px;">IMD Loading...</span>
          </div>
        </td>
        <td style="font-family:var(--mono);font-weight:700;font-size:18px;color:var(--accent)">${b.overall}</td>
        <td><span class="pill pill-${b.band.key}">${bandLabel}</span></td>
        <td style="display:flex;gap:8px;align-items:center;">
          <a class="btn btn-secondary btn-sm" href="trip-planner.html?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}">${btnInteractiveText}</a>
          <a class="btn btn-google btn-sm" href="${mapNavUrl}" target="_blank" rel="noopener">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            ${btnGmapsText}
          </a>
        </td>
      </tr>`;
    }).join("");
  }

  renderFrequentDangers();
  loadAndRenderImdWeather();
}

/**
 * Asynchronously populates all state cards and corridor rows with official IMD telemetry
 */
async function loadAndRenderImdWeather() {
  if (!window.NE8_IMD) return;

  for (const s of NE_STATES) {
    try {
      const data = await window.NE8_IMD.fetchWeatherForState(s.name);
      const stateEl = document.getElementById(`imd-state-wx-${s.id}`);
      const corridorEl = document.getElementById(`imd-corridor-wx-${s.id}`);

      if (data && data.current) {
        const cur = data.current;
        const tempText = cur.temperature ? cur.temperature : "Active";
        const condText = cur.condition ? (cur.condition.length > 25 ? cur.condition.substring(0, 22) + "..." : cur.condition) : "Monitored";
        const icon = cur.icon || "🌤️";

        if (stateEl) {
          stateEl.innerHTML = `<span>${icon}</span> <span>${tempText}</span>`;
          stateEl.title = `${s.name}: ${condText} · Source: India Meteorological Department (IMD)`;
        }

        if (corridorEl) {
          corridorEl.innerHTML = `
            <span>${icon}</span>
            <span class="weather-temp">${tempText}</span>
            <span class="weather-cond" title="${cur.condition || 'IMD Telemetry'}">${condText}</span>
          `;
          corridorEl.title = `Source: India Meteorological Department (IMD)`;
        }
      } else if (data && data.error) {
        if (stateEl) stateEl.innerHTML = `<span style="color:#94a3b8; font-size:11px;">⚠️ IMD</span>`;
        if (corridorEl) corridorEl.innerHTML = `<span style="color:#94a3b8; font-size:11px;">⚠️ IMD unavailable</span>`;
      }
    } catch (e) {
      console.warn(`IMD render notice for ${s.name}:`, e);
    }
  }
}

/**
 * Initializes and manages the IMD Weather & Radar Desk on the Dashboard
 */
let imdDeskInitialized = false;
function initImdRadarDesk() {
  const selectEl = document.getElementById("imd-district-select");
  if (!selectEl) return;

  if (!imdDeskInitialized) {
    imdDeskInitialized = true;
    const districts = window.NE_DISTRICTS_LIST || [
      { district: "Kamrup Metropolitan (Guwahati)", state: "Assam" },
      { district: "East Khasi Hills (Shillong)", state: "Meghalaya" },
      { district: "Papum Pare (Itanagar)", state: "Arunachal Pradesh" },
      { district: "Imphal West", state: "Manipur" },
      { district: "Kohima", state: "Nagaland" },
      { district: "Aizawl", state: "Mizoram" },
      { district: "West Tripura (Agartala)", state: "Tripura" },
      { district: "East Sikkim (Gangtok)", state: "Sikkim" },
    ];

    selectEl.innerHTML = districts
      .map((d) => `<option value="${d.district}" data-state="${d.state}">${d.district}, ${d.state}</option>`)
      .join("");

    selectEl.addEventListener("change", () => {
      const opt = selectEl.options[selectEl.selectedIndex];
      const dist = selectEl.value;
      const st = opt.dataset.state || "";
      updateImdRadarDesk(dist, st);
    });

    // Initial load for default selection
    const defaultOpt = selectEl.options[0];
    if (defaultOpt) {
      updateImdRadarDesk(selectEl.value, defaultOpt.dataset.state || "Assam");
    }
  }
}

async function updateImdRadarDesk(district, state) {
  const contentEl = document.getElementById("imd-radar-content");
  if (!contentEl || !window.NE8_IMD) return;

  contentEl.innerHTML = `
    <div class="imd-loading-banner" style="background:rgba(15,23,42,0.6); padding:16px; border-radius:8px; display:flex; align-items:center; gap:10px; font-size:13px; color:#94a3b8;">
      <span class="pulse-dot"></span> <span>Fetching live observations for ${district} from India Meteorological Department (IMD)...</span>
    </div>
  `;

  try {
    const data = await window.NE8_IMD.fetchWeatherForDistrict(district, state);
    renderImdRadarDeskContent(data, district, state);
  } catch (err) {
    contentEl.innerHTML = `
      <div class="notice alert-caution" style="padding:12px 16px; border-radius:8px;">
        <strong>⚠️ Unable to connect to India Meteorological Department (IMD)</strong>
        <p style="margin:4px 0 0 0; font-size:12px;">Could not retrieve real-time weather data for ${district}. Please check your internet connection.</p>
        <small style="color:var(--muted); font-size:11px; display:block; margin-top:4px;">Source: India Meteorological Department (IMD)</small>
      </div>
    `;
  }
}

window.useGpsForImdWeather = function () {
  const contentEl = document.getElementById("imd-radar-content");
  const selectEl = document.getElementById("imd-district-select");

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  if (contentEl) {
    contentEl.innerHTML = `
      <div class="imd-loading-banner" style="background:rgba(15,23,42,0.6); padding:16px; border-radius:8px; display:flex; align-items:center; gap:10px; font-size:13px; color:#38bdf8;">
        <span class="pulse-dot"></span> <span>Acquiring live GPS fix for IMD regional weather query...</span>
      </div>
    `;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      try {
        const data = await window.NE8_IMD.fetchWeatherForCoords(lat, lng);
        if (selectEl) {
          const gpsOpt = document.createElement("option");
          gpsOpt.value = "GPS Location";
          gpsOpt.text = `📍 My GPS (${lat.toFixed(2)}° N, ${lng.toFixed(2)}° E)`;
          gpsOpt.selected = true;
          selectEl.prepend(gpsOpt);
        }
        renderImdRadarDeskContent(data, `GPS Location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`, "Northeast");
      } catch (err) {
        if (contentEl) {
          contentEl.innerHTML = `
            <div class="notice alert-caution" style="padding:12px 16px; border-radius:8px;">
              ⚠️ Unable to retrieve IMD weather for current coordinates. Source: India Meteorological Department (IMD)
            </div>
          `;
        }
      }
    },
    (err) => {
      console.warn("GPS error for IMD:", err);
      if (contentEl) {
        contentEl.innerHTML = `
          <div class="notice alert-caution" style="padding:12px 16px; border-radius:8px;">
            ⚠️ Unable to acquire GPS location. Please select a district manually from the dropdown.
          </div>
        `;
      }
    },
    { timeout: 8000 }
  );
};

function renderImdRadarDeskContent(data, locationTitle, state) {
  const contentEl = document.getElementById("imd-radar-content");
  if (!contentEl) return;

  if (!data || data.error) {
    contentEl.innerHTML = `
      <div class="notice alert-caution" style="padding:12px 16px; border-radius:8px;">
        <strong>⚠️ IMD Data Notice</strong>
        <p style="margin:4px 0 0 0; font-size:12px;">Live meteorological observation is temporarily unavailable for this station from India Meteorological Department.</p>
        <small style="color:var(--muted); font-size:11px; display:block; margin-top:4px;">Source: India Meteorological Department (IMD)</small>
      </div>
    `;
    return;
  }

  const cur = data.current || {};
  const warn = (data.warnings && data.warnings[0]) || {
    severity: "safe",
    color: "#008000",
    message: "No active severe weather warning issued by IMD for this corridor.",
  };

  const warnBadgeClass = warn.severity === "risk" ? "pill-risk" : warn.severity === "caution" ? "pill-caution" : "pill-safe";
  const warnBadgeTitle = warn.severity === "risk" ? "🔴 IMD RED/ORANGE ALERT" : warn.severity === "caution" ? "🟡 IMD CAUTION ADVISORY" : "🟢 IMD NORMAL STATUS";

  const tempVal = cur.temperature ? cur.temperature : "—";
  const rainVal = cur.past24hRainfall ? cur.past24hRainfall : "—";
  const humVal = cur.humidity ? cur.humidity : "—";
  const condVal = cur.condition || "Observations active";
  const icon = cur.icon || "🌤️";

  // Forecast cards HTML
  let forecastHtml = "";
  if (Array.isArray(data.forecast) && data.forecast.length > 0) {
    forecastHtml = `
      <div style="margin-top:14px;">
        <strong style="color:#ffffff; font-size:12px; text-transform:uppercase; letter-spacing:0.04em;">📅 IMD 5 to 7-Day Forecast Outlook:</strong>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:8px; margin-top:8px;">
          ${data.forecast.slice(0, 5).map((f) => `
            <div style="background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:8px; text-align:center;">
              <small style="color:var(--accent); font-weight:700; display:block;">${f.day}</small>
              <div style="font-size:13px; font-weight:700; color:#ffffff; margin:4px 0;">${f.maxTemp || '—'} / ${f.minTemp || '—'}</div>
              <small style="color:#cbd5e1; font-size:10px; display:block; line-height:1.3;">${f.condition}</small>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  contentEl.innerHTML = `
    <!-- Top Warning Alert Banner -->
    <div style="background:${warn.severity === 'risk' ? 'rgba(239,68,68,0.15)' : warn.severity === 'caution' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}; border:1px solid ${warn.severity === 'risk' ? '#ef4444' : warn.severity === 'caution' ? '#f59e0b' : '#10b981'}; border-radius:8px; padding:12px 14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <span class="pill ${warnBadgeClass}" style="font-weight:700; font-size:11px;">${warnBadgeTitle}</span>
          <strong style="color:#ffffff; font-size:13px;">${locationTitle}</strong>
        </div>
        <div style="color:#e2e8f0; font-size:12px; line-height:1.4;">
          ${warn.message}
        </div>
        ${warn.validUpto ? `<small style="color:var(--muted); font-size:11px; display:block; margin-top:4px;">⏱️ Warning Valid Upto: ${warn.validUpto}</small>` : ''}
      </div>
      <div style="font-size:11px; color:#cbd5e1; white-space:nowrap;">
        <span>📅 ${cur.recordedAt || 'Today'}</span>
      </div>
    </div>

    <!-- 4 Primary Weather Telemetry Metrics -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:10px;">
      <div style="background:rgba(15,23,42,0.6); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
        <small style="color:var(--muted); font-size:11px; display:block;">🌡️ TEMPERATURE</small>
        <div style="font-size:22px; font-weight:700; color:var(--accent); margin-top:2px;">${tempVal}</div>
        <small style="color:#94a3b8; font-size:10px;">Observed by IMD station</small>
      </div>
      <div style="background:rgba(15,23,42,0.6); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
        <small style="color:var(--muted); font-size:11px; display:block;">🌧️ 24-HR RAINFALL</small>
        <div style="font-size:22px; font-weight:700; color:#38bdf8; margin-top:2px;">${rainVal}</div>
        <small style="color:#94a3b8; font-size:10px;">Precipitation depth</small>
      </div>
      <div style="background:rgba(15,23,42,0.6); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
        <small style="color:var(--muted); font-size:11px; display:block;">💧 HUMIDITY</small>
        <div style="font-size:22px; font-weight:700; color:#a78bfa; margin-top:2px;">${humVal}</div>
        <small style="color:#94a3b8; font-size:10px;">Relative atmospheric moisture</small>
      </div>
      <div style="background:rgba(15,23,42,0.6); padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
        <small style="color:var(--muted); font-size:11px; display:block;">🌤️ WEATHER OUTLOOK</small>
        <div style="font-size:14px; font-weight:700; color:#ffffff; margin-top:4px; display:flex; align-items:center; gap:6px;">
          <span>${icon}</span> <span>${condVal}</span>
        </div>
        <small style="color:#94a3b8; font-size:10px;">Sky &amp; cloud conditions</small>
      </div>
    </div>

    ${forecastHtml}
  `;

  const updatedEl = document.getElementById("imd-last-updated");
  if (updatedEl) {
    updatedEl.textContent = `Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (30m Cache Active)`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
  if (typeof syncIncidentsFromSupabase === "function") {
    syncIncidentsFromSupabase().then(() => renderDashboard());
  }
});
window.addEventListener("i18n:change", renderDashboard);
window.addEventListener("ne8:platform-updated", renderDashboard);
window.addEventListener("ne8:incidents-synced", renderDashboard);
