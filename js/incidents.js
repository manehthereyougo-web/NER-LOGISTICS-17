const photoInput = document.getElementById("photo");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("preview-img");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const placeInput = document.getElementById("place");
const stateInput = document.getElementById("state");
const incidentTypeInput = document.getElementById("incident-type");
const latInput = document.getElementById("latitude");
const lngInput = document.getElementById("longitude");
const btnDetectGps = document.getElementById("btn-detect-gps");
const gpsStatusBadge = document.getElementById("gps-status-badge");
const evalBtn = document.getElementById("eval-btn");
const saveBtn = document.getElementById("save-btn");
const verdictEl = document.getElementById("photo-verdict");
const feed = document.getElementById("feed");

let lastResult = null;
let lastPhoto = "";

function captureDriverGpsLocation(notify = true) {
  if (!navigator.geolocation) {
    autoFallbackToCorridorState();
    return;
  }
  if (gpsStatusBadge) {
    const detectingText = typeof t === "function" ? t("gps_detecting", "📡 Auto-detecting live GPS coordinates...") : "📡 Auto-detecting live GPS coordinates...";
    gpsStatusBadge.innerHTML = `<span class="pulse-dot"></span> <span style="color:#38bdf8;">${detectingText}</span>`;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = parseFloat(pos.coords.latitude.toFixed(5));
      const lng = parseFloat(pos.coords.longitude.toFixed(5));
      if (latInput) {
        latInput.value = lat;
        latInput.dataset.hardwareLock = "true";
      }
      if (lngInput) {
        lngInput.value = lng;
        lngInput.dataset.hardwareLock = "true";
      }
      if (gpsStatusBadge) {
        const autoText = typeof t === "function" ? t("gps_auto_detected", "Auto-Detected GPS") : "Auto-Detected GPS";
        gpsStatusBadge.innerHTML = `<span style="color:#10b981; font-weight:700; display:flex; align-items:center; gap:6px;">
          <span style="width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 8px #10b981; display:inline-block;"></span>
          ${autoText}: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (±${Math.round(pos.coords.accuracy)}m)
        </span>`;
      }
      const driverGpsText = document.getElementById("driver-gps-text");
      if (driverGpsText) {
        const lockedText = typeof t === "function" ? t("driver_gps_locked_msg", "📍 Live GPS Location Auto-Locked") : "📍 Live GPS Location Auto-Locked";
        driverGpsText.textContent = `${lockedText} (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`;
      }
    },
    (err) => {
      console.warn("GPS capture notice:", err);
      autoFallbackToCorridorState();
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
  );
}

function autoFallbackToCorridorState() {
  const stateVal = (stateInput && stateInput.value) || "Meghalaya";
  const matchedState = (window.NE_STATES || []).find((s) => s.name.toLowerCase() === stateVal.toLowerCase()) || (window.NE_STATES && window.NE_STATES[1]) || { center: { lat: 25.5788, lng: 91.8933 } };
  const fallbackLat = matchedState.center ? matchedState.center.lat : 25.5788;
  const fallbackLng = matchedState.center ? matchedState.center.lng : 91.8933;

  if (latInput && !latInput.dataset.hardwareLock) latInput.value = fallbackLat;
  if (lngInput && !lngInput.dataset.hardwareLock) lngInput.value = fallbackLng;

  if (gpsStatusBadge) {
    const resolvedText = typeof t === "function" ? t("gps_auto_resolved", "Auto-Resolved GPS") : "Auto-Resolved GPS";
    gpsStatusBadge.innerHTML = `<span style="color:#34d399; font-weight:600; display:flex; align-items:center; gap:6px;">
      <span style="width:8px; height:8px; border-radius:50%; background:#34d399; display:inline-block;"></span>
      ${resolvedText}: ${parseFloat(fallbackLat).toFixed(4)}° N, ${parseFloat(fallbackLng).toFixed(4)}° E (${stateVal} Corridor)
    </span>`;
  }
  const driverGpsText = document.getElementById("driver-gps-text");
  if (driverGpsText) {
    const lockedText = typeof t === "function" ? t("driver_gps_locked_msg", "📍 Live GPS Location Auto-Locked") : "📍 Live GPS Location Auto-Locked";
    driverGpsText.textContent = `${lockedText} (${stateVal} Corridor)`;
  }
}

// Driver Quick-Snap Hazard Cards & 1-Tap Submission
function initDriverQuickSnap() {
  const hazardCards = document.querySelectorAll(".driver-hazard-card");
  hazardCards.forEach((card) => {
    card.addEventListener("click", () => {
      hazardCards.forEach((c) => c.classList.remove("is-selected"));
      card.classList.add("is-selected");

      const hVal = card.dataset.hazard;
      const typeVal = card.dataset.type;
      const titleVal = card.dataset.title;
      const descVal = card.dataset.desc;

      if (titleInput) titleInput.value = titleVal;
      if (descInput) descInput.value = descVal;
      if (incidentTypeInput) incidentTypeInput.value = typeVal;

      // Check the corresponding hazard box
      document.querySelectorAll('input[name="hazard"]').forEach((cb) => {
        cb.checked = cb.value === hVal;
      });
    });
  });

  const btnDriverSubmit = document.getElementById("btn-driver-submit-snap");
  if (btnDriverSubmit) {
    btnDriverSubmit.addEventListener("click", () => {
      if (saveBtn) {
        btnDriverSubmit.innerHTML = `<span class="pulse-dot"></span> <span>Sending Road Alert...</span>`;
        saveBtn.click();
        setTimeout(() => {
          btnDriverSubmit.innerHTML = `<span style="font-size:22px;">🚀</span> <span>${typeof t === "function" ? t("driver_send_alert_btn", "Send Road Alert Now") : "Send Road Alert Now"}</span>`;
        }, 1500);
      }
    });
  }
}

if (btnDetectGps) {
  btnDetectGps.addEventListener("click", () => captureDriverGpsLocation(true));
}

// Auto-request live location on page load
setTimeout(() => captureDriverGpsLocation(false), 300);
initDriverQuickSnap();

if (stateInput) {
  stateInput.innerHTML = NE_STATES.map((s) => `<option value="${s.name}">${s.name}</option>`).join("");
  stateInput.addEventListener("change", () => {
    if (!latInput || !latInput.dataset.hardwareLock) {
      autoFallbackToCorridorState();
    }
  });
}

function selectedHazards() {
  return [...document.querySelectorAll('input[name="hazard"]:checked')].map((el) => el.value);
}

function reportPayload() {
  return evaluateReport({
    description: `${titleInput.value} ${descInput.value}`,
    imageEl: previewImg,
    selectedHazards: selectedHazards(),
  });
}

function renderFeed() {
  const items = loadIncidents().slice().sort((a, b) => b.createdAt - a.createdAt);
  const locBtnText = typeof t === "function" ? t("gmaps_location", "Google Maps Location") : "Google Maps Location";
  const dirBtnText = typeof t === "function" ? t("get_directions", "Get Directions") : "Get Directions";
  const viewPhotoText = typeof t === "function" ? t("view_photo_desc", "🔍 View Photo & Description") : "🔍 View Photo & Description";
  const deleteBtnTitle = typeof t === "function" ? t("btn_delete_report", "Delete this report") : "Delete this report";
  const fallbackImg = (window.LIVE_PHOTOS && window.LIVE_PHOTOS.sample1) || "";

  // Update clear all reports button visibility
  const btnClearReports = document.getElementById("btn-clear-reports");
  if (btnClearReports) {
    btnClearReports.style.display = items.length > 0 ? "inline-flex" : "none";
    if (!btnClearReports.dataset.bound) {
      btnClearReports.dataset.bound = "true";
      btnClearReports.addEventListener("click", async () => {
        const confirmMsg = typeof t === "function" 
          ? t("confirm_clear_all_reports", "Are you sure you want to remove all field reports?") 
          : "Are you sure you want to remove all field reports?";
        if (!window.confirm(confirmMsg)) return;

        if (window.NE8_SUPABASE && window.NE8_SUPABASE.isSupabaseConfigured()) {
          try {
            await window.NE8_SUPABASE.clearAllIncidents();
          } catch (err) {
            console.warn("Supabase clear warning:", err);
          }
        }
        if (typeof clearAllIncidents === "function") {
          clearAllIncidents();
        } else {
          saveIncidents([]);
        }
        renderFeed();
      });
    }
  }

  if (items.length === 0) {
    const emptyMsg = typeof t === "function" 
      ? t("feed_empty", "No active field reports on file. Newly submitted disaster photos will appear here.") 
      : "No active field reports on file. Newly submitted disaster photos will appear here.";
    feed.innerHTML = `
      <div class="empty-feed-card" style="padding: 40px 20px; text-align: center; background: rgba(15, 23, 42, 0.4); border: 1px dashed var(--line); border-radius: 12px; color: var(--muted); grid-column: 1 / -1; width: 100%;">
        <span style="font-size: 36px; display: block; margin-bottom: 10px;">📷</span>
        <strong style="display: block; font-size: 15px; color: var(--text); margin-bottom: 6px;" data-i18n="feed_empty_title">0 Field Reports On File</strong>
        <p style="margin: 0; font-size: 13px; max-width: 380px; margin-left: auto; margin-right: auto;" data-i18n="feed_empty">${emptyMsg}</p>
      </div>`;
    return;
  }

  feed.innerHTML = items
    .map((item) => {
      const lat = typeof item.lat === "number" ? item.lat : 26.1445;
      const lng = typeof item.lng === "number" ? item.lng : 91.7362;
      const mapUrl = googleMapsLocationUrl(lat, lng, item.title);
      const dirUrl = googleMapsDirectionsToUrl(lat, lng, item.title);
      const photoUrl = item.photo || fallbackImg;

      const levelBadgeText = typeof t === "function" ? (item.level === "risk" ? t("pill_highrisk", "HIGH RISK") : item.level === "caution" ? t("pill_limited", "CAUTION") : t("pill_open", "SAFE")) : item.level;
      const stateLocalized = item.state ? (typeof t === "function" ? t("state_" + item.state.toLowerCase().replace(/[\s-]+/g, "_"), item.state) : item.state) : "";

      return `<article class="report card" data-id="${item.id}">
        <div class="report-img-wrap" style="cursor:pointer;" title="Click to view full photo and details">
          <img src="${photoUrl}" onerror="this.onerror=null; this.src='${fallbackImg}';" alt="${item.title || 'Damaged route photo'}" />
          <span class="report-badge pill pill-${item.level}">${levelBadgeText}</span>
        </div>
        <div class="report-body">
          <div class="report-tags">
            ${(hazardIdsForIncident(item) || [])
              .map((id) => {
                const def = riskById(id) || {};
                const hKey = "hazard_" + id.replace(/-/g, "_");
                const hLabel = typeof t === "function" ? t(hKey, def.label || id) : (def.label || id);
                return `<span class="pill pill-risk">${hLabel}</span>`;
              })
              .join(" ")}
            ${item.state ? `<span class="pill pill-state">${stateLocalized}</span>` : ""}
          </div>
          <h3 class="report-title" style="cursor:pointer;" title="Click to view full description">${item.title || "Untitled site"}</h3>
          <p class="report-desc">${item.description || "Field report photo"}</p>
          <div class="report-meta">
            <span>📍 ${lat.toFixed(3)}, ${lng.toFixed(3)}</span>
            <span>🕒 ${formatTime(item.createdAt)}</span>
          </div>
          <div class="report-actions">
            <button class="btn btn-primary btn-sm btn-view-modal" type="button" style="background:linear-gradient(135deg,#0f766e,#0d9488);">
              ${viewPhotoText}
            </button>
            <a class="btn btn-google btn-sm" href="${mapUrl}" target="_blank" rel="noopener">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              ${locBtnText}
            </a>
            <button class="btn btn-secondary btn-sm btn-delete-report" type="button" style="color:#f87171; border-color:rgba(239,68,68,0.35); padding: 4px 8px;" title="${deleteBtnTitle}">
              🗑️
            </button>
          </div>
        </div>
      </article>`;
    })
    .join("");

  // Attach event listeners to all report cards
  feed.querySelectorAll(".report").forEach((card) => {
    const id = card.dataset.id;
    const item = items.find((i) => String(i.id) === String(id));
    if (!item) return;

    const imgWrap = card.querySelector(".report-img-wrap");
    const titleEl = card.querySelector(".report-title");
    const viewBtn = card.querySelector(".btn-view-modal");
    const deleteBtn = card.querySelector(".btn-delete-report");

    const openHandler = () => openPhotoModal(item);
    if (imgWrap) imgWrap.addEventListener("click", openHandler);
    if (titleEl) titleEl.addEventListener("click", openHandler);
    if (viewBtn) viewBtn.addEventListener("click", openHandler);

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const confirmMsg = typeof t === "function" 
          ? t("confirm_delete_report", `Delete report "${item.title || "Untitled"}"?`) 
          : `Delete report "${item.title || "Untitled"}"?`;
        if (!window.confirm(confirmMsg)) return;

        if (window.NE8_SUPABASE && window.NE8_SUPABASE.isSupabaseConfigured()) {
          try {
            await window.NE8_SUPABASE.deleteIncident(item.id);
          } catch (err) {
            console.warn("Supabase delete warning:", err);
          }
        }
        if (typeof deleteIncident === "function") {
          deleteIncident(item.id);
        } else {
          const list = loadIncidents().filter((i) => String(i.id) !== String(item.id));
          saveIncidents(list);
        }
        renderFeed();
      });
    }
  });
}

photoInput.addEventListener("change", async () => {
  const file = photoInput.files[0];
  if (!file) return;
  // Automatically acquire GPS location upon selecting a photo
  captureDriverGpsLocation(false);
  try {
    if (typeof window.compressImage === "function") {
      lastPhoto = await window.compressImage(file, 1200, 1200, 0.75);
    } else {
      const reader = new FileReader();
      lastPhoto = await new Promise((res) => {
        reader.onload = () => res(reader.result);
        reader.onerror = () => res("");
        reader.readAsDataURL(file);
      });
    }
    previewImg.src = lastPhoto;
    preview.style.display = "block";
  } catch (err) {
    console.warn("Photo preview error:", err);
  }
});

evalBtn.addEventListener("click", () => {
  const run = () => {
    lastResult = reportPayload();
    verdictEl.className = `notice alert-${lastResult.level}`;
    const deduct = (lastResult.deductRows || [])
      .map((row) => `${row.label} −${row.deduct}`)
      .join(", ");
    const placeQuery = (placeInput && placeInput.value) || (stateInput && stateInput.value) || "Northeast India";
    const mapUrl = googleMapsLocationUrl(placeQuery, "", titleInput.value || "Damaged site");
    const openLocText = typeof t === "function" ? t("open_location_gmaps", "Open Location in Google Maps") : "Open Location in Google Maps";
    verdictEl.innerHTML = `<strong>${levelLabel(lastResult.level)}</strong> Score ${lastResult.score}/100. ${deduct || "No typed hazard selected"}. ${lastResult.reasons.join(". ")}.
    <div style="margin-top:10px; display:flex; gap:8px;">
      <a class="btn btn-google btn-sm" href="${mapUrl}" target="_blank" rel="noopener">${openLocText}</a>
    </div>`;
    verdictEl.classList.remove("hidden");
  };
  if (previewImg.complete || previewImg.src) run();
  else previewImg.onload = run;
});

function geocodePlace(query, stateName) {
  return new Promise((resolve) => {
    const fallback = NE_STATES.find((s) => s.name === stateName) || NE_STATES[1];
    if (!getMapsKey() || !(window.google && google.maps)) {
      resolve(fallback.center);
      return;
    }
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      {
        address: `${query}, ${stateName}, India`,
        componentRestrictions: { country: "IN" },
        bounds: googleLatLngBounds(),
      },
      (results, status) => {
        if (status === "OK" && results[0] && placeAllowed(results[0])) {
          resolve({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          });
        } else {
          resolve(fallback.center);
        }
      }
    );
  });
}

function placeAllowed(result) {
  const loc = result.geometry.location;
  return inNortheastBounds(loc.lat(), loc.lng());
}

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  try {
    let photoToSave = lastPhoto || (window.LIVE_PHOTOS && window.LIVE_PHOTOS.sample1) || "";
    const file = photoInput.files && photoInput.files[0];

    // Upload photo to Supabase Storage 'incident-photos' bucket if configured
    if (window.NE8_SUPABASE && window.NE8_SUPABASE.isSupabaseConfigured() && (file || lastPhoto)) {
      try {
        const { publicUrl, error: uploadErr } = await window.NE8_SUPABASE.uploadPhoto(lastPhoto || file);
        if (publicUrl) {
          photoToSave = publicUrl;
        } else if (uploadErr) {
          console.warn("Storage upload error, using local fallback:", uploadErr);
        }
      } catch (e) {
        console.warn("Upload exception:", e);
      }
    }

    if (!lastResult) lastResult = reportPayload();

    let lat = latInput && parseFloat(latInput.value);
    let lng = lngInput && parseFloat(lngInput.value);
    if (isNaN(lat) || isNaN(lng) || !lat || !lng) {
      const loc = await geocodePlace(placeInput.value, stateInput.value);
      lat = loc.lat;
      lng = loc.lng;
    }

    const newItem = {
      id: crypto.randomUUID(),
      title: titleInput.value.trim() || "Field photo",
      description: descInput.value.trim() || "Roadside incident report",
      photo: photoToSave,
      photo_url: photoToSave,
      photoUrl: photoToSave,
      level: lastResult.level,
      reasons: lastResult.reasons,
      hazards: lastResult.hazards || selectedHazards(),
      lat: lat,
      lng: lng,
      state: stateInput.value || "Assam",
      place: placeInput ? placeInput.value : "",
      incident_type: (incidentTypeInput && incidentTypeInput.value) || "landslide",
      createdAt: Date.now(),
    };

    // Save incident record to Supabase database 'incidents' table
    if (window.NE8_SUPABASE && window.NE8_SUPABASE.isSupabaseConfigured()) {
      try {
        const { data: cloudItem, error: dbErr } = await window.NE8_SUPABASE.saveIncident(newItem);
        if (cloudItem && cloudItem.id) {
          newItem.id = cloudItem.id;
        } else if (dbErr) {
          console.warn("Supabase database save error:", dbErr);
        }
      } catch (e) {
        console.warn("Save exception:", e);
      }
    }

    try {
      if (typeof saveIncidentAndSyncPlatform === "function") {
        saveIncidentAndSyncPlatform(newItem);
      } else {
        const list = loadIncidents();
        list.push(newItem);
        saveIncidents(list);
      }
      if (window.NE8_DATA_STORE && typeof window.NE8_DATA_STORE.addRoadReport === "function") {
        window.NE8_DATA_STORE.addRoadReport({
          ...newItem,
          riskLevel: newItem.level,
          category: newItem.incident_type,
        });
      }
    } catch (saveErr) {
      console.warn("Local storage incident sync notice:", saveErr);
    }

    renderFeed();
    openPhotoModal(newItem);
  } finally {
    saveBtn.disabled = false;
  }
});

renderFeed();
window.addEventListener("i18n:change", renderFeed);
window.addEventListener("ne8:platform-updated", renderFeed);
window.addEventListener("ne8:incidents-synced", renderFeed);

document.addEventListener("DOMContentLoaded", () => {
  loadGoogleMaps("noopMaps");

  // Retrieve incidents from Supabase and display them using existing website UI
  if (typeof syncIncidentsFromSupabase === "function") {
    syncIncidentsFromSupabase().then(() => renderFeed());
  }

  // Real-time listener: updates existing feed when new incidents arrive
  if (window.NE8_SUPABASE && typeof window.NE8_SUPABASE.subscribeToIncidents === "function") {
    window.NE8_SUPABASE.subscribeToIncidents((newCloudItem) => {
      const current = loadIncidents();
      if (!current.some((i) => String(i.id) === String(newCloudItem.id))) {
        current.unshift(newCloudItem);
        saveIncidents(current);
        renderFeed();
      }
    });
  }
});

window.noopMaps = function noopMaps() {};
