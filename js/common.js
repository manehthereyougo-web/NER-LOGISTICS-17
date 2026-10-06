const STORE_KEY = "ne8-incidents";
const ROADS_STORE_KEY = "ne8-roads";
const VEHICLES_STORE_KEY = "ne8-vehicles";
const ALERTS_STORE_KEY = "ne8-alerts";

const DEFAULT_ROADS = [
  { id: "nh-6", name: "NH-6", highway: "NH-6", district: "Shillong, Meghalaya", state: "Meghalaya", status: "LIMITED ACCESS", statusClass: "caution", incident: "Heavy rain & landslide mudslip near km 114 Sonapur", lastUpdate: "10 mins ago" },
  { id: "nh-27", name: "NH-27", highway: "NH-27 / AH-1", district: "Guwahati → Nagaon, Assam", state: "Assam", status: "OPEN", statusClass: "safe", incident: "Clear high-density freight trunk", lastUpdate: "25 mins ago" },
  { id: "nh-37", name: "NH-37", highway: "NH-37", district: "Imphal → Jiribam, Manipur", state: "Manipur", status: "BLOCKED", statusClass: "risk", incident: "Active road sinkhole & mudfall across both lanes", lastUpdate: "15 mins ago" },
  { id: "nh-10", name: "NH-10", highway: "NH-10", district: "Rangpo → Gangtok, Sikkim", state: "Sikkim", status: "HIGH RISK", statusClass: "caution", incident: "Teesta river erosion & cliff boulder falls", lastUpdate: "30 mins ago" },
  { id: "nh-13", name: "NH-13", highway: "NH-13", district: "Sela Pass, Arunachal Pradesh", state: "Arunachal Pradesh", status: "HIGH RISK", statusClass: "caution", incident: "High altitude snowfall & black ice alert (13,700 ft)", lastUpdate: "45 mins ago" },
  { id: "nh-2", name: "NH-2", highway: "NH-2", district: "Dimapur → Kohima, Nagaland", state: "Nagaland", status: "LIMITED ACCESS", statusClass: "caution", incident: "Sinking road bed & steep ghat crawl at Phesama", lastUpdate: "1 hour ago" },
  { id: "nh-8", name: "NH-8", highway: "NH-8", district: "Agartala → Silchar, Tripura", state: "Tripura", status: "OPEN", statusClass: "safe", incident: "Normal dry road conditions", lastUpdate: "1 hour ago" },
  { id: "nh-54", name: "NH-54", highway: "NH-54", district: "Aizawl → Silchar, Mizoram", state: "Mizoram", status: "LIMITED ACCESS", statusClass: "caution", incident: "Localized rain showers & narrow hill turns", lastUpdate: "2 hours ago" },
];

const DEFAULT_VEHICLES = [
  { id: "NE-MED-101", code: "NE-MED-101", driver: "R. Sharma", cargo: "💊 Medicines (Vaccines & Emergency Kits)", cargoType: "medicines", icon: "💊", origin: "Guwahati, Assam", destination: "Shillong, Meghalaya", location: "Barapani, Meghalaya", lat: 25.654, lng: 91.896, status: "Delayed", statusClass: "caution", eta: "+45m Delay (Landslide Detour)", route: "NH-6 Corridor" },
  { id: "NE-FOOD-204", code: "NE-FOOD-204", driver: "A. Gogoi", cargo: "🍚 Food Supplies (Rice & Essential Grains)", cargoType: "food", icon: "🍚", origin: "Guwahati, Assam", destination: "Dibrugarh, Assam", location: "Nagaon Bypass, Assam", lat: 26.35, lng: 92.60, status: "Moving", statusClass: "safe", eta: "On Time (16:30)", route: "NH-27 Trunk" },
  { id: "NE-AGRI-308", code: "NE-AGRI-308", driver: "B. Das", cargo: "🌾 Agricultural Produce (Tea & Organic Produce)", cargoType: "agri", icon: "🌾", origin: "Tezpur, Assam", destination: "Guwahati, Assam", location: "Kolia Bhomora Bridge, Assam", lat: 26.60, lng: 92.85, status: "Moving", statusClass: "safe", eta: "On Time (17:15)", route: "NH-715 Route" },
  { id: "NE-MAT-412", code: "NE-MAT-412", driver: "T. Ao", cargo: "🏗️ Construction Materials (Bridge Steel & Cement)", cargoType: "materials", icon: "🏗️", origin: "Dimapur, Nagaland", destination: "Kohima, Nagaland", location: "Chumukedima Ghat, Nagaland", lat: 25.82, lng: 93.80, status: "Delayed", statusClass: "caution", eta: "+30m Slow Crawl (Sinking Zone)", route: "NH-2 Ghat" },
  { id: "NE-MED-105", code: "NE-MED-105", driver: "M. Singh", cargo: "💊 Medicines (Emergency Oxygen Cylinders)", cargoType: "medicines", icon: "💊", origin: "Silchar, Assam", destination: "Imphal, Manipur", location: "Jiribam Border, Manipur", lat: 24.78, lng: 93.15, status: "Route Disrupted", statusClass: "risk", eta: "Rerouting via NH-2 (NH-37 Blocked)", route: "NH-37 Corridor" },
];

const DEFAULT_ALERTS = [
  { id: "alt-1", severity: "CRITICAL", levelClass: "risk", icon: "🔴", title: "ROAD BLOCKED: NH-37 Imphal–Jiribam Section", description: "Active landslide and road sinkhole near km 62. Both lanes impassable for heavy trucks.", location: "Manipur (NH-37)", time: "15 mins ago" },
  { id: "alt-2", severity: "HIGH", levelClass: "caution", icon: "🟠", title: "HIGH RISK ADVISORY: Sonapur Tunnel Pass (NH-6)", description: "Heavy monsoonal rain destabilizes hill slope. Single lane crawling active toward Shillong.", location: "Meghalaya (NH-6)", time: "30 mins ago" },
  { id: "alt-3", severity: "WARNING", levelClass: "caution", icon: "🚚", title: "SUPPLY DELAY: Medicine Truck NE-MED-101", description: "Essential vaccine shipment delayed due to mountain hazard detour near Barapani.", location: "Shillong Freight Corridor", time: "40 mins ago" },
  { id: "alt-4", severity: "INFO", levelClass: "safe", icon: "🌦️", title: "IMD METEOROLOGICAL ADVISORY", description: "Live weather observations and radar warnings active across Northeast passes. Source: India Meteorological Department (IMD).", location: "Northeast Corridors", time: "Live Sync" },
];

const LIVE_PHOTOS = {
  sample1: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200&auto=format&fit=crop",
  sample2: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
  sample3: "https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=1200&auto=format&fit=crop",
  sample4: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1200&auto=format&fit=crop",
};
window.LIVE_PHOTOS = LIVE_PHOTOS;

const SAMPLE_INCIDENTS = [];
window.SAMPLE_INCIDENTS = SAMPLE_INCIDENTS;

// One-time purge of legacy sample incidents from localStorage
(function purgeLegacySampleIncidents() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const sampleIds = ["sample-1", "sample-2", "sample-3", "sample-4"];
        const cleaned = list.filter((item) => !sampleIds.includes(item.id));
        localStorage.setItem(STORE_KEY, JSON.stringify(cleaned));
      }
    }
  } catch (e) {
    console.warn("Notice checking stored incidents:", e);
  }
})();

function loadIncidents() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      localStorage.setItem(STORE_KEY, JSON.stringify([]));
      return [];
    }
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) {
      localStorage.setItem(STORE_KEY, JSON.stringify([]));
      return [];
    }
    // Ensure no legacy sample incidents linger
    const sampleIds = ["sample-1", "sample-2", "sample-3", "sample-4"];
    const filtered = list.filter((item) => !sampleIds.includes(item.id));
    if (filtered.length !== list.length) {
      saveIncidents(filtered);
      return filtered;
    }
    return list;
  } catch {
    return [];
  }
}

/**
 * Downscales and compresses large camera photos to ~80-120KB JPEG
 * Prevents localStorage QuotaExceededError and enables fast mobile cloud upload.
 */
function compressImage(fileOrDataUrl, maxWidth = 1200, maxHeight = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    if (!fileOrDataUrl) return resolve("");
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.width;
        let h = img.height;
        if (w > maxWidth || h > maxHeight) {
          if (w / h > maxWidth / maxHeight) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          } else {
            w = Math.round((w * maxHeight) / h);
            h = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn("Canvas compression notice:", err);
        resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
      }
    };
    img.onerror = () => {
      resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
    };

    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.onerror = () => { resolve(""); };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
window.compressImage = compressImage;

function saveIncidents(list) {
  const safeList = Array.isArray(list) ? list : [];
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(safeList));
  } catch (quotaErr) {
    console.warn("localStorage quota exceeded, compacting stored incidents...", quotaErr);
    try {
      // Keep most recent 20 items and replace excessively large base64 photos in older items
      const trimmed = safeList.slice(0, 20).map((item, idx) => {
        if (idx > 3 && item.photo && item.photo.startsWith("data:") && item.photo.length > 50000) {
          return { ...item, photo: "" };
        }
        return item;
      });
      localStorage.setItem(STORE_KEY, JSON.stringify(trimmed));
    } catch (e2) {
      console.warn("Could not save to localStorage even after compaction:", e2);
    }
  }
}

function deleteIncident(id) {
  try {
    const current = loadIncidents();
    const updated = current.filter((item) => String(item.id) !== String(id));
    saveIncidents(updated);
    window.dispatchEvent(new CustomEvent("ne8:platform-updated"));
    window.dispatchEvent(new CustomEvent("ne8:incidents-synced", { detail: updated }));
    return updated;
  } catch (err) {
    console.error("Failed to delete incident:", err);
    return [];
  }
}
window.deleteIncident = deleteIncident;

function clearAllIncidents() {
  try {
    saveIncidents([]);
    window.dispatchEvent(new CustomEvent("ne8:platform-updated"));
    window.dispatchEvent(new CustomEvent("ne8:incidents-synced", { detail: [] }));
    return [];
  } catch (err) {
    console.error("Failed to clear incidents:", err);
    return [];
  }
}
window.clearAllIncidents = clearAllIncidents;

async function syncIncidentsFromSupabase() {
  if (!window.NE8_SUPABASE || !window.NE8_SUPABASE.isSupabaseConfigured()) {
    return loadIncidents();
  }
  try {
    const { items, error } = await window.NE8_SUPABASE.fetchIncidents();
    if (!error && Array.isArray(items) && items.length > 0) {
      saveIncidents(items);
      window.dispatchEvent(new CustomEvent("ne8:incidents-synced", { detail: items }));
      return items;
    }
  } catch (err) {
    console.warn("Could not sync incidents from Supabase:", err);
  }
  return loadIncidents();
}
window.syncIncidentsFromSupabase = syncIncidentsFromSupabase;

function loadRoads() {
  try {
    const raw = localStorage.getItem(ROADS_STORE_KEY);
    if (!raw) {
      localStorage.setItem(ROADS_STORE_KEY, JSON.stringify(DEFAULT_ROADS));
      return [...DEFAULT_ROADS];
    }
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_ROADS];
  }
}

function saveRoads(list) {
  localStorage.setItem(ROADS_STORE_KEY, JSON.stringify(list));
}

function loadVehicles() {
  try {
    const raw = localStorage.getItem(VEHICLES_STORE_KEY);
    if (!raw) {
      localStorage.setItem(VEHICLES_STORE_KEY, JSON.stringify(DEFAULT_VEHICLES));
      return [...DEFAULT_VEHICLES];
    }
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_VEHICLES];
  }
}

function saveVehicles(list) {
  localStorage.setItem(VEHICLES_STORE_KEY, JSON.stringify(list));
}

function loadAlerts() {
  try {
    const raw = localStorage.getItem(ALERTS_STORE_KEY);
    if (!raw) {
      localStorage.setItem(ALERTS_STORE_KEY, JSON.stringify(DEFAULT_ALERTS));
      return [...DEFAULT_ALERTS];
    }
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_ALERTS];
  }
}

function saveAlerts(list) {
  localStorage.setItem(ALERTS_STORE_KEY, JSON.stringify(list));
}

// Reactive Platform Engine — Connects Field Incident Reporting across all platform features
function saveIncidentAndSyncPlatform(newItem) {
  // 1. Save to Incidents Store
  const incidents = loadIncidents();
  incidents.push(newItem);
  saveIncidents(incidents);

  // 2. Update affected Road in ROADS store
  const roads = loadRoads();
  const stateName = newItem.state || "Northeast";
  const titleText = (newItem.title || "").toLowerCase();
  const descText = (newItem.description || "").toLowerCase();
  
  let affectedRoad = roads.find((r) => r.state.toLowerCase().includes(stateName.toLowerCase()) || titleText.includes(r.name.toLowerCase()));
  if (affectedRoad) {
    if (newItem.level === "risk") {
      affectedRoad.status = "BLOCKED";
      affectedRoad.statusClass = "risk";
    } else if (newItem.level === "caution") {
      affectedRoad.status = "LIMITED ACCESS";
      affectedRoad.statusClass = "caution";
    }
    affectedRoad.incident = newItem.title || "Field hazard reported";
    affectedRoad.lastUpdate = "Just now";
    saveRoads(roads);
  }

  // 3. Generate Automated Alert in ALERTS store
  const alerts = loadAlerts();
  const newAlert = {
    id: `alt-${Date.now()}`,
    severity: newItem.level === "risk" ? "CRITICAL" : "HIGH",
    levelClass: newItem.level === "risk" ? "risk" : "caution",
    icon: newItem.level === "risk" ? "🔴" : "🟠",
    title: `${newItem.level === "risk" ? "ROAD BLOCKED" : "HIGH RISK REPORT"}: ${newItem.title || "Field Hazard"}`,
    description: newItem.description || "Field incident recorded by official.",
    location: `${newItem.state || "Northeast"} (${newItem.place || "Hill Corridor"})`,
    time: "Just now",
  };
  alerts.unshift(newAlert);
  saveAlerts(alerts.slice(0, 15));

  // 4. Update nearby Vehicles status if passing affected corridor
  const vehicles = loadVehicles();
  vehicles.forEach((v) => {
    if (v.destination.toLowerCase().includes(stateName.toLowerCase()) || v.route.toLowerCase().includes((affectedRoad ? affectedRoad.name : "").toLowerCase())) {
      v.status = newItem.level === "risk" ? "Route Disrupted" : "Delayed";
      v.statusClass = newItem.level === "risk" ? "risk" : "caution";
      v.eta = `+60m Delay (Rerouting around ${newItem.title || "Hazard"})`;
    }
  });
  saveVehicles(vehicles);

  // 5. Dispatch Custom Window Event for Live Cross-Component Refresh
  window.dispatchEvent(new CustomEvent("ne8:platform-updated", { detail: newItem }));
}

// Accessible Photo & Description Modal Viewer
function initPhotoModal() {
  if (document.getElementById("photo-modal")) return;

  const modalHtml = `
    <div id="photo-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-card">
        <button class="modal-close" id="modal-close-btn" aria-label="Close photo view">✕</button>
        <div class="modal-grid">
          <div class="modal-img-wrap">
            <img id="modal-img" src="" alt="Live field report photo" />
          </div>
          <div class="modal-content">
            <div class="modal-tags" id="modal-tags"></div>
            <h2 id="modal-title" class="modal-title"></h2>
            <p id="modal-desc" class="modal-desc"></p>
            <div id="modal-reasons-box" class="modal-reasons-box"></div>
            <div class="modal-meta" id="modal-meta"></div>
            <div class="modal-actions" id="modal-actions"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  document.getElementById("modal-close-btn").addEventListener("click", closePhotoModal);
  document.getElementById("photo-modal").addEventListener("click", (e) => {
    if (e.target.id === "photo-modal") closePhotoModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePhotoModal();
  });
}

function openPhotoModal(item) {
  initPhotoModal();
  const modal = document.getElementById("photo-modal");
  const img = document.getElementById("modal-img");
  const title = document.getElementById("modal-title");
  const desc = document.getElementById("modal-desc");
  const tags = document.getElementById("modal-tags");
  const meta = document.getElementById("modal-meta");
  const reasonsBox = document.getElementById("modal-reasons-box");
  const actions = document.getElementById("modal-actions");

  img.src = item.photo || LIVE_PHOTOS.sample1;
  img.alt = item.title || "Live field report photo";
  title.textContent = item.title || "Field Report Photo";
  desc.textContent = item.description || "No description provided.";

  const stateLocalized = item.state ? (typeof t === "function" ? t("state_" + item.state.toLowerCase().replace(/[\s-]+/g, "_"), item.state) : item.state) : "";
  const stateText = item.state ? `<span class="pill pill-state">${stateLocalized}</span>` : "";
  const levelBadgeText = typeof t === "function" ? (item.level === "risk" ? t("pill_highrisk", "HIGH RISK") : item.level === "caution" ? t("pill_limited", "CAUTION") : t("pill_open", "SAFE")) : (item.level || "caution");
  const levelBadge = `<span class="pill pill-${item.level || 'caution'}">${levelBadgeText}</span>`;
  const hazardPills = (hazardIdsForIncident(item) || [])
    .map((id) => {
      const def = riskById(id) || {};
      const hKey = "hazard_" + id.replace(/-/g, "_");
      const hLabel = typeof t === "function" ? t(hKey, def.label || id) : (def.label || id);
      return `<span class="pill pill-risk">${hLabel}</span>`;
    })
    .join(" ");

  tags.innerHTML = `${levelBadge} ${stateText} ${hazardPills}`;

  const lat = typeof item.lat === "number" ? item.lat : 26.1445;
  const lng = typeof item.lng === "number" ? item.lng : 91.7362;
  const mapUrl = googleMapsLocationUrl(lat, lng, item.title);
  const dirUrl = googleMapsDirectionsToUrl(lat, lng, item.title);

  meta.innerHTML = `
    <span>📍 GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
    <span>🕒 Time: ${formatTime(item.createdAt || Date.now())}</span>
  `;

  if (item.reasons && item.reasons.length) {
    reasonsBox.innerHTML = `<strong>Field Assessment:</strong><ul>${item.reasons.map((r) => `<li>${r}</li>`).join("")}</ul>`;
  } else {
    reasonsBox.innerHTML = "";
  }

  const locText = typeof t === "function" ? t("gmaps_location", "Google Maps Location") : "Google Maps Location";
  const dirText = typeof t === "function" ? t("get_directions", "Get Directions") : "Get Directions";

  const deleteText = typeof t === "function" ? t("btn_delete_report", "🗑️ Delete Report") : "🗑️ Delete Report";

  actions.innerHTML = `
    <a class="btn btn-google btn-sm" href="${mapUrl}" target="_blank" rel="noopener">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
      ${locText}
    </a>
    <a class="btn btn-secondary btn-sm" href="${dirUrl}" target="_blank" rel="noopener">
      ${dirText}
    </a>
    <button class="btn btn-secondary btn-sm" id="modal-delete-btn" type="button" style="color:#f87171; border-color:rgba(239,68,68,0.4);">
      ${deleteText}
    </button>
  `;

  const deleteBtn = document.getElementById("modal-delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      const confirmMsg = typeof t === "function" ? t("confirm_delete_report", `Delete report "${item.title || "Untitled"}"?`) : `Delete report "${item.title || "Untitled"}"?`;
      if (!window.confirm(confirmMsg)) return;

      closePhotoModal();
      if (window.NE8_SUPABASE && window.NE8_SUPABASE.isSupabaseConfigured()) {
        try {
          await window.NE8_SUPABASE.deleteIncident(item.id);
        } catch (e) {
          console.warn("Supabase delete notice:", e);
        }
      }
      if (typeof deleteIncident === "function") {
        deleteIncident(item.id);
      }
      if (typeof renderFeed === "function") {
        renderFeed();
      }
    });
  }

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closePhotoModal() {
  const modal = document.getElementById("photo-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

function formatTime(ts) {
  return new Date(ts).toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const h =
    s1 * s1 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function setLiveClock() {
  const el = document.querySelector("[data-clock]");
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  tick();
  setInterval(tick, 1000);
}

function fillStateList() {
  const ul = document.querySelector("[data-states]");
  if (!ul || typeof NE_STATES === "undefined") return;
  ul.innerHTML = NE_STATES.map(
    (s) => {
      const stateName = typeof t === "function" ? t("state_" + s.id, s.name) : s.name;
      return `<li><a href="trip-planner.html?origin=${encodeURIComponent(s.capital + ", " + s.name)}">${stateName}</a></li>`;
    }
  ).join("");
}

function applyCamera() {
  const url = window.NE8_CONFIG && window.NE8_CONFIG.cameraSrc;
  if (!url) return;
  document.querySelectorAll("video").forEach((video) => {
    const source = video.querySelector("source");
    if (source) source.src = url;
    video.src = url;
    video.load();
    video.play().catch(() => {});
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setLiveClock();
  fillStateList();
  applyCamera();
});

window.addEventListener("i18n:change", () => {
  fillStateList();
});

/* ==========================================================================
   NE8 Multilingual Voice Engine (Client-Side Web Speech API)
   Supports Hindi, Assamese, Bengali, and English
   Includes intelligent phonetic transliteration fallback for systems/browsers
   (such as default Windows installations) lacking native Indic TTS voice packs.
   ========================================================================== */
window.NE8Voice = {
  initialized: false,
  voices: [],

  init() {
    if (this.initialized) return;
    if (!("speechSynthesis" in window)) return;
    this.refreshVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.refreshVoices();
      };
    }
    this.initialized = true;
  },

  refreshVoices() {
    if (!("speechSynthesis" in window)) return [];
    try {
      this.voices = window.speechSynthesis.getVoices() || [];
    } catch {
      this.voices = [];
    }
    return this.voices;
  },

  getBestVoice(langCode) {
    this.refreshVoices();
    const voices = this.voices;
    const target = (langCode || "en").toLowerCase();

    if (target === "hi") {
      // 1. Direct match on lang tag starting with hi
      let v = voices.find((v) => (v.lang || "").toLowerCase().startsWith("hi"));
      if (v) return { voice: v, isNative: true };
      // 2. Name search for Hindi voices (Edge Microsoft Swara/Madhur/Hemant/Kalpana, Chrome Google Hindi)
      v = voices.find((v) => {
        const name = (v.name || "").toLowerCase();
        return (
          name.includes("hindi") ||
          name.includes("हिन्दी") ||
          name.includes("swara") ||
          name.includes("madhur") ||
          name.includes("kalpana") ||
          name.includes("hemant")
        );
      });
      if (v) return { voice: v, isNative: true };
      // Fallback: look for Indian English voice (en-IN) which handles Indian phonetics well
      v = voices.find((v) => (v.lang || "").toLowerCase().startsWith("en-in"));
      if (v) return { voice: v, isNative: false };
      // Fallback to default English voice
      v = voices.find((v) => (v.lang || "").toLowerCase().startsWith("en")) || voices[0] || null;
      return { voice: v, isNative: false };
    }

    if (target === "bn" || target === "as") {
      // 1. Direct match on bn or as
      let v = voices.find((v) => {
        const l = (v.lang || "").toLowerCase();
        return l.startsWith("bn") || l.startsWith("as");
      });
      if (v) return { voice: v, isNative: true };
      // 2. Name search for Bengali/Assamese (Microsoft Tanishaa, Bashkar, Google Bangla)
      v = voices.find((v) => {
        const name = (v.name || "").toLowerCase();
        return (
          name.includes("bengali") ||
          name.includes("bangla") ||
          name.includes("বাংলা") ||
          name.includes("assamese") ||
          name.includes("অসমীয়া") ||
          name.includes("tanishaa") ||
          name.includes("bashkar")
        );
      });
      if (v) return { voice: v, isNative: true };
      // If Assamese, check if Hindi voice available
      if (target === "as") {
        v = voices.find((v) => (v.lang || "").toLowerCase().startsWith("hi"));
        if (v) return { voice: v, isNative: true };
      }
      // Fallback: Indian English or general English
      v = voices.find((v) => (v.lang || "").toLowerCase().startsWith("en-in"));
      if (v) return { voice: v, isNative: false };
      v = voices.find((v) => (v.lang || "").toLowerCase().startsWith("en")) || voices[0] || null;
      return { voice: v, isNative: false };
    }

    // Default English (prefer en-IN if available, else any English)
    let v = voices.find((v) => (v.lang || "").toLowerCase().startsWith("en-in"));
    if (v) return { voice: v, isNative: true };
    v = voices.find((v) => (v.lang || "").toLowerCase().startsWith("en")) || voices[0] || null;
    return { voice: v, isNative: true };
  },

  speak(options) {
    const {
      lang = "en",
      textNative = "",
      textPhonetic = "",
      rate = 0.95,
      onStart = null,
      onEnd = null,
      onError = null,
    } = options || {};

    if (!("speechSynthesis" in window)) {
      if (onError) onError(new Error("Speech synthesis not supported"));
      return;
    }

    this.init();
    const voiceInfo = this.getBestVoice(lang);
    const useNative = (lang === "en" || voiceInfo.isNative) && Boolean(textNative);
    const spokenText = useNative ? textNative : (textPhonetic || textNative);

    // Cancel any running speech
    try {
      window.speechSynthesis.cancel();
    } catch {}

    // Safe timeout to prevent Chromium audio-thread cancellation collision
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(spokenText);
        if (voiceInfo.voice) {
          utterance.voice = voiceInfo.voice;
        }

        if (useNative) {
          if (lang === "hi") utterance.lang = (voiceInfo.voice && voiceInfo.voice.lang) || "hi-IN";
          else if (lang === "bn") utterance.lang = (voiceInfo.voice && voiceInfo.voice.lang) || "bn-IN";
          else if (lang === "as") utterance.lang = (voiceInfo.voice && voiceInfo.voice.lang) || "as-IN";
          else utterance.lang = (voiceInfo.voice && voiceInfo.voice.lang) || "en-IN";
          utterance.rate = rate;
        } else {
          // Phonetic fallback spoken by English synthesizer
          utterance.lang = (voiceInfo.voice && voiceInfo.voice.lang) || "en-IN";
          utterance.rate = Math.min(rate, 0.90);
        }

        utterance.pitch = 1.0;

        utterance.onstart = () => {
          if (onStart) onStart({ isNative: useNative, voice: voiceInfo.voice, spokenText });
        };
        utterance.onend = () => {
          window.__currentUtterance = null;
          if (onEnd) onEnd();
        };
        utterance.onerror = (e) => {
          window.__currentUtterance = null;
          if (onError) onError(e);
        };

        // Retain utterance on window to prevent Chrome GC bug during long speech
        window.__currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        if (onError) onError(err);
      }
    }, 120);

    return { isNative: useNative, spokenText, voice: voiceInfo.voice };
  },

  stop() {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    window.__currentUtterance = null;
  },

  pause() {
    if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
      try {
        window.speechSynthesis.pause();
      } catch {}
    }
  },

  resume() {
    if ("speechSynthesis" in window && window.speechSynthesis.paused) {
      try {
        window.speechSynthesis.resume();
      } catch {}
    }
  },
};

// Initialize voice engine early
if (typeof window !== "undefined") {
  window.NE8Voice.init();
}


