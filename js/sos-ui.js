/**
 * SafeRoute — Driver Emergency SOS Assistance UI Controller
 * Manages full-screen emergency modal, geolocation flows, smart facility selection,
 * emergency contacts notification, multi-language localization (11 languages),
 * and Leaflet emergency maps.
 */

(function (window) {
  "use strict";

  // State Management
  const state = {
    isOpen: false,
    view: "CHOICE", // 'CHOICE' | 'LOCATING' | 'LOC_ERROR' | 'SEARCHING' | 'FACILITY' | 'NO_RESULTS' | 'CONTACTS'
    emergencyType: "hospital", // 'hospital' | 'police'
    driverLoc: null, // { lat, lng, accuracy, timestamp }
    radiusMeters: 25000,
    facility: null, // Top recommended
    alternatives: [],
    incidentId: null,
    alertDispatchState: "IDLE", // 'IDLE' | 'SENDING' | 'SENT' | 'FAILED' | 'UNAVAILABLE'
    alertDispatchMsg: "",
    leafletMap: null,
    leafletLayers: null,
    locationUpdateInterval: null,
  };

  /**
   * Safe multi-language translation lookup helper
   */
  function tr(key, fallback) {
    if (window.I18N && typeof window.I18N.t === "function") {
      const val = window.I18N.t(key);
      if (val && val !== key) return val;
    }
    return fallback || key;
  }

  /**
   * Helper to retrieve currently signed-in driver or fallback
   */
  function getDriverProfile() {
    const authUser = (window.NE8_AUTH && window.NE8_AUTH.getCurrentUser()) || null;
    return {
      driverName: (authUser && authUser.name) || "Goods Transport Driver",
      vehicleNumber: (authUser && authUser.vehicleCode) || "Commercial Vehicle",
      driverId: (authUser && (authUser.driverId || authUser.userId)) || "drv-emergency",
    };
  }

  /**
   * Update all SOS trigger labels across the page in current language
   */
  function updateSosButtonLabels() {
    const floatLabel = document.getElementById("sos-floating-label");
    if (floatLabel) {
      floatLabel.textContent = tr("sos_floating_btn", "🚨 SOS EMERGENCY");
    }
    document.querySelectorAll(".btn-sos-nav").forEach((btn) => {
      const labelSpan = btn.querySelector(".sos-nav-label") || btn.querySelector('[data-i18n="btn_sos"]');
      if (labelSpan) {
        labelSpan.textContent = tr("sos_btn", "🚨 SOS");
      }
    });
  }

  /**
   * Inject SOS button into page navigation and floating bottom trigger
   */
  function initSosButtons() {
    // 1. Add floating trigger button on mobile/desktop
    if (!document.getElementById("btn-floating-sos")) {
      const floatBtn = document.createElement("button");
      floatBtn.type = "button";
      floatBtn.id = "btn-floating-sos";
      floatBtn.className = "btn-sos-floating";
      floatBtn.setAttribute("aria-label", "Trigger Emergency SOS");
      floatBtn.innerHTML = `<span class="sos-pulse-ring"></span> <span id="sos-floating-label">${tr("sos_floating_btn", "🚨 SOS EMERGENCY")}</span>`;
      floatBtn.addEventListener("click", () => openSosModal());
      if (document.body) {
        document.body.appendChild(floatBtn);
      } else {
        document.addEventListener("DOMContentLoaded", () => {
          if (!document.getElementById("btn-floating-sos") && document.body) {
            document.body.appendChild(floatBtn);
          }
        });
      }
    }

    // 2. Bind any existing navigation SOS buttons with data-action="open-sos" or class .btn-sos-nav
    document.querySelectorAll('.btn-sos-nav, [data-action="open-sos"]').forEach((btn) => {
      if (!btn.querySelector(".sos-nav-label") && !btn.querySelector('[data-i18n="btn_sos"]')) {
        const ring = btn.querySelector(".sos-pulse-ring");
        const ringHtml = ring ? ring.outerHTML : '<span class="sos-pulse-ring"></span>';
        btn.innerHTML = `${ringHtml} <span class="sos-nav-label" data-i18n="btn_sos">${tr("sos_btn", "🚨 SOS")}</span>`;
      }
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openSosModal();
      });
    });
  }

  /**
   * Build the base modal container
   */
  function ensureModalElement() {
    let overlay = document.getElementById("saferoute-sos-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "saferoute-sos-overlay";
      overlay.className = "sos-overlay";
      overlay.style.display = "none";
      overlay.innerHTML = `
        <div class="sos-modal-card" role="dialog" aria-modal="true" aria-labelledby="sos-modal-title">
          <header class="sos-header">
            <div class="sos-header-left">
              <div class="sos-badge-icon" id="sos-header-badge">🚨</div>
              <div>
                <h3 class="sos-header-title" id="sos-modal-title">${tr("sos_modal_title", "Emergency Assistance")}</h3>
                <div class="sos-header-subtitle" id="sos-header-sub">${tr("sos_modal_sub", "Direct Hospital & Police Dispatch")}</div>
              </div>
            </div>
            <button type="button" class="sos-btn-close" id="btn-sos-modal-close" aria-label="Close Emergency SOS">&times;</button>
          </header>
          <div class="sos-body" id="sos-modal-body"></div>
        </div>
      `;
      if (document.body) {
        document.body.appendChild(overlay);
      }

      document.getElementById("btn-sos-modal-close").addEventListener("click", () => {
        cancelSos();
      });

      // Close on backdrop click (with confirmation)
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          cancelSos();
        }
      });
    }
    return overlay;
  }

  /**
   * Update modal title and subtitle in active language
   */
  function updateModalHeader() {
    const titleEl = document.getElementById("sos-modal-title");
    if (titleEl) {
      titleEl.textContent = tr("sos_modal_title", "Emergency Assistance");
    }
    const subEl = document.getElementById("sos-header-sub");
    if (subEl) {
      if (state.view === "CHOICE") {
        subEl.textContent = tr("sos_modal_sub", "Direct Hospital & Police Dispatch");
      } else if (state.view === "CONTACTS") {
        subEl.textContent = tr("sos_contacts_title", "Emergency Contacts");
      } else if (state.emergencyType === "police") {
        subEl.textContent = tr("sos_find_police", "FIND NEAREST POLICE STATION");
      } else {
        subEl.textContent = tr("sos_find_hospital", "FIND NEAREST HOSPITAL");
      }
    }
  }

  /**
   * Open the SOS Modal
   */
  function openSosModal(initialType) {
    const overlay = ensureModalElement();
    state.isOpen = true;
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Create incident record
    state.incidentId = `sos-${Date.now()}`;
    const profile = getDriverProfile();
    if (window.SafeRouteSOS) {
      window.SafeRouteSOS.recordIncident({
        incidentId: state.incidentId,
        driverId: profile.driverId,
        driverName: profile.driverName,
        vehicleNumber: profile.vehicleNumber,
        emergencyType: initialType || "hospital",
        lifecycleState: "SOS_TRIGGERED",
      });
    }

    if (initialType) {
      selectEmergencyType(initialType);
    } else {
      renderChoiceView();
    }
  }

  /**
   * Close or cancel SOS
   */
  function cancelSos() {
    const overlay = document.getElementById("saferoute-sos-overlay");
    if (overlay) {
      overlay.style.display = "none";
    }
    state.isOpen = false;
    document.body.style.overflow = "";

    // Clean up map
    if (state.leafletMap) {
      try {
        state.leafletMap.remove();
      } catch (e) {}
      state.leafletMap = null;
      state.leafletLayers = null;
    }

    // Update incident state to CANCELLED if closed
    if (state.incidentId && window.SafeRouteSOS) {
      window.SafeRouteSOS.recordIncident({
        incidentId: state.incidentId,
        lifecycleState: "SOS_CANCELLED",
      });
    }
  }

  // =========================================================================
  // VIEW RENDERERS
  // =========================================================================

  /**
   * VIEW 1: Emergency Choice Selection (Hospital vs Police)
   */
  function renderChoiceView() {
    state.view = "CHOICE";
    updateModalHeader();
    const body = document.getElementById("sos-modal-body");

    const contacts = window.SafeRouteSOS ? window.SafeRouteSOS.getEmergencyContacts() : [];
    const contactsCount = contacts.filter((c) => c.phone && c.phone.trim()).length;

    body.innerHTML = `
      <div class="sos-prompt-lead">${tr("sos_prompt_lead", "How can we assist you?")}</div>
      <div class="sos-prompt-sub">
        ${tr("sos_prompt_sub", "Select the emergency service you require. SafeRoute will immediately acquire your GPS coordinates and discover the nearest verified facility.")}
      </div>

      <div class="sos-choices-grid">
        <button type="button" class="sos-choice-btn hospital-choice" id="btn-select-hospital">
          <div class="sos-choice-icon">🏥</div>
          <div>
            <div class="sos-choice-title">${tr("sos_find_hospital", "FIND NEAREST HOSPITAL")}</div>
            <div class="sos-choice-desc">${tr("sos_hospital_desc", "Accident, medical emergency, ambulance routing, trauma centers")}</div>
          </div>
        </button>

        <button type="button" class="sos-choice-btn police-choice" id="btn-select-police">
          <div class="sos-choice-icon">🚔</div>
          <div>
            <div class="sos-choice-title">${tr("sos_find_police", "FIND NEAREST POLICE STATION")}</div>
            <div class="sos-choice-desc">${tr("sos_police_desc", "Road theft, highway blockade, security threat, traffic accident desk")}</div>
          </div>
        </button>
      </div>

      <div class="sos-extra-actions">
        <button type="button" class="sos-btn-secondary" id="btn-open-contacts">
          ${tr("sos_btn_contacts", "👥 Emergency Contacts")} (${contactsCount})
        </button>
        <button type="button" class="sos-btn-secondary" id="btn-cancel-sos" style="color:#b91c1c; background:#fef2f2; border-color:#fecaca;">
          ${tr("sos_btn_cancel", "Cancel SOS")}
        </button>
      </div>
    `;

    document.getElementById("btn-select-hospital").onclick = () => selectEmergencyType("hospital");
    document.getElementById("btn-select-police").onclick = () => selectEmergencyType("police");
    document.getElementById("btn-open-contacts").onclick = () => renderContactsManagerView();
    document.getElementById("btn-cancel-sos").onclick = () => cancelSos();
  }

  /**
   * Action: Driver selects Hospital or Police
   */
  function selectEmergencyType(type) {
    state.emergencyType = type;
    state.radiusMeters = 25000; // default 25km radius
    updateModalHeader();

    // Step 2: Acquire Location
    startLocationAcquisition();
  }

  /**
   * VIEW 2: Getting Driver Location (GPS)
   */
  function startLocationAcquisition() {
    state.view = "LOCATING";
    updateModalHeader();
    const body = document.getElementById("sos-modal-body");
    const serviceName = state.emergencyType === "police" ? tr("sos_police", "Police Station") : tr("sos_hospital", "Hospital");

    body.innerHTML = `
      <div class="sos-loading-box">
        <div class="sos-radar-spinner"></div>
        <div class="sos-loading-title">${tr("sos_locating_title", "Getting your current location...")}</div>
        <div class="sos-loading-sub">
          ${tr("sos_locating_sub", "Acquiring high-accuracy GPS satellite coordinates from your device...")} (${serviceName})
        </div>
        <div style="margin-top:20px;">
          <button type="button" class="sos-btn-secondary" id="btn-cancel-locating">${tr("sos_btn_cancel", "Cancel SOS")}</button>
        </div>
      </div>
    `;

    document.getElementById("btn-cancel-locating").onclick = () => renderChoiceView();

    if (!window.SafeRouteSOS) {
      renderLocationErrorView({ message: tr("sos_err_loc_sub", "Please enable device GPS / location permissions or enter your location manually to find nearby facilities.") });
      return;
    }

    // Fresh GPS acquisition
    window.SafeRouteSOS.getCurrentPosition()
      .then((loc) => {
        state.driverLoc = loc;
        const profile = getDriverProfile();
        window.SafeRouteSOS.recordIncident({
          incidentId: state.incidentId,
          driverId: profile.driverId,
          emergencyType: state.emergencyType,
          latitude: loc.lat,
          longitude: loc.lng,
          lifecycleState: "LOCATION_FOUND",
        });
        startFacilitySearch();
      })
      .catch((err) => {
        renderLocationErrorView(err);
      });
  }

  /**
   * VIEW 2b: Location Failure / Manual Fallback
   */
  function renderLocationErrorView(err) {
    state.view = "LOC_ERROR";
    const body = document.getElementById("sos-modal-body");

    body.innerHTML = `
      <div class="sos-error-box">
        <div class="sos-error-icon">⚠️</div>
        <div class="sos-error-title">${tr("sos_err_loc_title", "Unable to get your current location.")}</div>
        <div class="sos-error-desc">
          ${escapeHtml(err && err.message) || tr("sos_err_loc_sub", "Please enable device GPS / location permissions or enter your location manually to find nearby facilities.")}
        </div>
        
        <div class="sos-action-row">
          <button type="button" class="btn btn-primary" id="btn-retry-gps" style="background:#dc2626; border-color:#dc2626; color:#ffffff; font-weight:700;">
            🔄 ${tr("sos_btn_try_again", "Try Again")}
          </button>
          <button type="button" class="sos-btn-secondary" id="btn-show-manual-input">
            ✏️ ${tr("sos_btn_manual", "Enter Location Manually")}
          </button>
          <button type="button" class="sos-btn-secondary" id="btn-cancel-from-error">
            ${tr("sos_btn_cancel", "Cancel SOS")}
          </button>
        </div>

        <div id="manual-loc-wrap" style="display:none; margin-top:16px; text-align:left;">
          <label style="font-size:12.5px; font-weight:700; color:#334155;">
            ${tr("sos_btn_manual", "Enter Nearest City, Town, Highway Milepost, or Coordinates (lat, lng):")}
          </label>
          <input type="text" id="manual-loc-input" class="sos-input-manual" placeholder="e.g. Kochi, Kerala or Guwahati or 26.14, 91.73" />
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn btn-primary" id="btn-submit-manual-loc" style="background:#2563eb; color:#ffffff; font-weight:700; flex:1;">
              ${tr("btn_find_route", "Search from this Location")}
            </button>
            <button type="button" class="sos-btn-secondary" id="btn-hide-manual-input">
              ${tr("btn_cancel", "Back")}
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-retry-gps").onclick = () => startLocationAcquisition();
    document.getElementById("btn-cancel-from-error").onclick = () => renderChoiceView();

    const manualWrap = document.getElementById("manual-loc-wrap");
    const manualInput = document.getElementById("manual-loc-input");
    const showManualBtn = document.getElementById("btn-show-manual-input");

    showManualBtn.onclick = () => {
      manualWrap.style.display = "block";
      showManualBtn.style.display = "none";
      manualInput.focus();
    };

    document.getElementById("btn-hide-manual-input").onclick = () => {
      manualWrap.style.display = "none";
      showManualBtn.style.display = "inline-flex";
    };

    document.getElementById("btn-submit-manual-loc").onclick = async () => {
      const query = manualInput.value.trim();
      if (!query) {
        alert("Please enter a valid location or town name.");
        return;
      }
      try {
        const submitBtn = document.getElementById("btn-submit-manual-loc");
        submitBtn.disabled = true;
        submitBtn.innerText = "Resolving...";
        const resolved = await window.SafeRouteSOS.geocodeManualLocation(query);
        state.driverLoc = resolved;
        startFacilitySearch();
      } catch (geocodeErr) {
        alert(geocodeErr.message || "Could not resolve entered location.");
        const submitBtn = document.getElementById("btn-submit-manual-loc");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = tr("btn_find_route", "Search from this Location");
        }
      }
    };
  }

  /**
   * VIEW 3: Searching Nearby Facilities
   */
  async function startFacilitySearch() {
    state.view = "SEARCHING";
    updateModalHeader();
    const body = document.getElementById("sos-modal-body");
    const isPolice = state.emergencyType === "police";
    const searchTitle = isPolice ? tr("sos_searching_police", "Searching nearby police stations...") : tr("sos_searching_hospital", "Searching nearby hospitals...");

    body.innerHTML = `
      <div class="sos-loading-box">
        <div class="sos-radar-spinner"></div>
        <div class="sos-loading-title">${searchTitle}</div>
        <div class="sos-loading-sub">
          ${tr("sos_searching_sub", "Querying dynamic location services around your coordinates...")} [${state.driverLoc.lat.toFixed(4)}, ${state.driverLoc.lng.toFixed(4)}]...
        </div>
      </div>
    `;

    try {
      const data = await window.SafeRouteSOS.searchNearbyFacilities(
        state.driverLoc.lat,
        state.driverLoc.lng,
        state.emergencyType,
        state.radiusMeters
      );

      if (data && data.recommended) {
        state.facility = data.recommended;
        state.alternatives = data.alternatives || [];
        state.alertDispatchState = "IDLE";

        // Log incident update
        const profile = getDriverProfile();
        window.SafeRouteSOS.recordIncident({
          incidentId: state.incidentId,
          driverId: profile.driverId,
          emergencyType: state.emergencyType,
          latitude: state.driverLoc.lat,
          longitude: state.driverLoc.lng,
          selectedFacility: {
            name: state.facility.name,
            address: state.facility.address,
            phone: state.facility.phone,
            distanceKm: state.facility.distanceKm,
            drivingDistanceKm: state.facility.drivingDistanceKm,
          },
          lifecycleState: "FACILITY_FOUND",
        });

        renderFacilityResultView();
      } else {
        renderNoResultsView();
      }
    } catch (err) {
      renderSearchErrorView(err);
    }
  }

  /**
   * Search Error View
   */
  function renderSearchErrorView(err) {
    const body = document.getElementById("sos-modal-body");
    body.innerHTML = `
      <div class="sos-error-box">
        <div class="sos-error-icon">⚠️</div>
        <div class="sos-error-title">Facility Search Error</div>
        <div class="sos-error-desc">
          ${escapeHtml(err && err.message) || "An error occurred while communicating with the emergency discovery service."}
        </div>
        <div class="sos-action-row">
          <button type="button" class="btn btn-primary" id="btn-retry-search" style="background:#dc2626; color:#ffffff; font-weight:700;">
            🔄 ${tr("sos_btn_try_again", "Retry Search")}
          </button>
          <button type="button" class="sos-btn-secondary" id="btn-back-choice">
            ${tr("sos_modal_title", "Back to Options")}
          </button>
        </div>
      </div>
    `;

    document.getElementById("btn-retry-search").onclick = () => startFacilitySearch();
    document.getElementById("btn-back-choice").onclick = () => renderChoiceView();
  }

  /**
   * VIEW 4: Recommended Emergency Facility Card & Actions
   */
  function renderFacilityResultView() {
    state.view = "FACILITY";
    updateModalHeader();
    const body = document.getElementById("sos-modal-body");
    const facility = state.facility;
    const isPolice = state.emergencyType === "police";
    const themeClass = isPolice ? "police-theme" : "hospital-theme";
    const badgeText = isPolice ? tr("sos_rec_police_badge", "🚔 NEAREST RECOMMENDED POLICE STATION") : tr("sos_rec_hospital_badge", "🏥 NEAREST RECOMMENDED HOSPITAL");

    const hasPhone = Boolean(facility.phone && facility.phone.trim());
    const phoneDisplay = hasPhone ? facility.phone : tr("sos_no_phone", "No direct phone publicly listed");
    const profile = getDriverProfile();

    // Prepare standard emergency alert message
    const alertMessage = window.SafeRouteSOS.buildEmergencyMessage({
      driverName: profile.driverName,
      vehicleNumber: profile.vehicleNumber,
      emergencyType: state.emergencyType,
      facility: facility,
      lat: state.driverLoc.lat,
      lng: state.driverLoc.lng,
      timestamp: state.driverLoc.timestamp,
    });
    state.alertMessage = alertMessage;

    // Contacts count
    const contacts = window.SafeRouteSOS.getEmergencyContacts();
    const validContacts = contacts.filter((c) => c.phone && c.phone.trim());

    body.innerHTML = `
      <!-- Recommended Emergency Facility Card -->
      <div class="sos-facility-card ${themeClass}">
        <div class="sos-facility-tag">${badgeText}</div>
        <h4 class="sos-facility-name">${escapeHtml(facility.name)}</h4>

        <div class="sos-facility-metrics">
          <span class="sos-metric-chip accent">
            📍 <strong>${facility.distanceKm} km</strong> ${tr("sos_away", "away")}
          </span>
          <span class="sos-metric-chip">
            🚗 ${tr("sos_eta_label", "ETA:")} <strong>${facility.drivingTimeStr}</strong>
          </span>
          <span class="sos-metric-chip" style="font-size:11px; color:#64748b;">
            ${facility.provider === "google-places" ? "Google Places" : "Live Directory"}
          </span>
        </div>

        <div class="sos-facility-detail-row">
          <span>📍</span>
          <div><strong>${tr("sos_address_label", "Address:")}</strong> ${escapeHtml(facility.address || "Local Highway District Sector")}</div>
        </div>

        <div class="sos-facility-phone-row">
          <span>📞</span>
          <span style="${hasPhone ? 'color:#15803d;' : 'color:#94a3b8; font-weight:500; font-size:13px;'}">
            <strong>${tr("sos_phone_label", "Phone:")}</strong> ${escapeHtml(phoneDisplay)}
          </span>
        </div>

        <!-- Primary Emergency Action Buttons -->
        <div class="sos-actions-grid">
          <a class="sos-btn-call ${hasPhone ? '' : 'disabled'}" href="${hasPhone ? 'tel:' + facility.rawPhone : '#'}" ${hasPhone ? '' : 'aria-disabled="true"'}>
            <span>📞</span> <span>${tr("sos_btn_call", "CALL NOW")}</span>
          </a>

          <a class="sos-btn-nav" href="${facility.googleMapsDirectionsUrl}" target="_blank" rel="noopener">
            <span>🧭</span> <span>${tr("sos_btn_navigate", "NAVIGATE")}</span>
          </a>

          <button type="button" class="sos-btn-share" id="btn-sos-share-loc">
            <span>📤</span> <span>${tr("sos_btn_share", "SHARE LOCATION")}</span>
          </button>
        </div>
      </div>

      <!-- Real-Time Emergency Map -->
      <div style="font-size:12.5px; font-weight:700; color:#334155; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
        <span>🗺️ ${tr("nav_live_map", "Live Route Overview")}</span>
        <button type="button" id="btn-refresh-loc" style="background:none; border:none; color:#2563eb; font-size:11.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
          <span>🔄</span> <span>${tr("btn_use_gps", "Update GPS")}</span>
        </button>
      </div>
      <div class="sos-map-wrap">
        <div id="sos-leaflet-map"></div>
      </div>

      <!-- Alternative Candidates Section -->
      ${
        state.alternatives.length > 0
          ? `
        <div class="sos-alternatives-section">
          <div class="sos-alternatives-title">
            <span>${isPolice ? tr("sos_alt_police", "Alternative Police Stations") : tr("sos_alt_hospitals", "Alternative Hospitals")}</span>
            <span style="font-size:12px; font-weight:600; color:#64748b;">${state.alternatives.length}</span>
          </div>
          <div id="sos-alternatives-list">
            ${state.alternatives
              .map(
                (alt, idx) => `
              <div class="sos-alt-card">
                <div class="sos-alt-info">
                  <div class="sos-alt-name">${escapeHtml(alt.name)}</div>
                  <div class="sos-alt-meta">
                    📍 ${alt.distanceKm} km · 🚗 ${alt.drivingTimeStr} ${alt.phone ? '· 📞 ' + escapeHtml(alt.phone) : ''}
                  </div>
                </div>
                <div class="sos-alt-actions">
                  <button type="button" class="sos-btn-alt-sm" data-switch-idx="${idx}" style="background:#e0f2fe; color:#0369a1;">
                    ${tr("sos_btn_view_map", "View on Map")}
                  </button>
                  <a class="sos-btn-alt-sm" href="${alt.googleMapsDirectionsUrl}" target="_blank" rel="noopener" style="background:#2563eb; color:#ffffff;">
                    ${tr("sos_btn_navigate", "Navigate")}
                  </a>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }

      <!-- Emergency Contacts Notification -->
      <div class="sos-contacts-card">
        <div class="sos-contacts-head">
          <div class="sos-contacts-title">👨‍👩‍👧 ${tr("sos_contacts_title", "Emergency Contacts Alert")} (${validContacts.length})</div>
          <button type="button" id="btn-edit-contacts-link" style="background:none; border:none; color:#15803d; font-size:12px; font-weight:700; cursor:pointer;">
            ${tr("sos_contacts_title", "Manage")}
          </button>
        </div>
        ${
          validContacts.length > 0
            ? `
          <div style="font-size:12px; color:#166534; margin-bottom:8px;">
            ${tr("sos_contacts_sub", "One-tap notify your personal family or contractor contacts with your live location link:")}
          </div>
          <div class="sos-contacts-list">
            ${validContacts
              .map(
                (c) => `
              <div class="sos-contact-item">
                <div>
                  <strong>${escapeHtml(c.name)}</strong> <small style="color:#64748b;">(${escapeHtml(c.relationship || 'Contact')})</small>
                  <div style="color:#334155; font-size:11px;">${escapeHtml(c.phone)}</div>
                </div>
                <div style="display:flex; gap:6px;">
                  <button type="button" class="sos-btn-alt-sm" data-wa-phone="${escapeHtml(c.phone)}" style="background:#22c55e; color:#ffffff;">
                    WhatsApp
                  </button>
                  <button type="button" class="sos-btn-alt-sm" data-sms-phone="${escapeHtml(c.phone)}" style="background:#0f172a; color:#ffffff;">
                    SMS
                  </button>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : `
          <div style="font-size:12px; color:#166534;">
            ${tr("sos_contacts_sub", "Add family/contractor phone numbers to alert them in one click.")}
          </div>
        `
        }
      </div>

      <!-- Footer Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; padding-top:14px; border-top:1px solid #e2e8f0;">
        <button type="button" class="sos-btn-secondary" id="btn-switch-service">
          ← ${tr("sos_modal_title", "Emergency Assistance")}
        </button>
        <button type="button" class="sos-btn-secondary" id="btn-close-sos-card" style="color:#b91c1c;">
          ${tr("sos_btn_close", "Close SOS")}
        </button>
      </div>
    `;

    // Initialize Leaflet map
    setTimeout(() => {
      initEmergencyLeafletMap(state.driverLoc, state.facility);
    }, 50);

    // Event Bindings
    document.getElementById("btn-sos-share-loc").onclick = () => {
      openShareActionSheet(state.alertMessage, facility.googleMapsDirectionsUrl);
    };

    document.getElementById("btn-refresh-loc").onclick = () => {
      startLocationAcquisition();
    };

    document.getElementById("btn-switch-service").onclick = () => {
      renderChoiceView();
    };

    document.getElementById("btn-close-sos-card").onclick = () => {
      cancelSos();
    };

    const editContactsLink = document.getElementById("btn-edit-contacts-link");
    if (editContactsLink) {
      editContactsLink.onclick = () => renderContactsManagerView();
    }

    // Switch alternative facility into recommended focus
    document.querySelectorAll("[data-switch-idx]").forEach((btn) => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute("data-switch-idx"), 10);
        if (!isNaN(idx) && state.alternatives[idx]) {
          const oldRec = state.facility;
          state.facility = state.alternatives[idx];
          state.alternatives.splice(idx, 1);
          state.alternatives.unshift(oldRec);
          renderFacilityResultView();
        }
      };
    });

    // WhatsApp / SMS quick buttons for contacts
    document.querySelectorAll("[data-wa-phone]").forEach((btn) => {
      btn.onclick = () => {
        const phone = btn.getAttribute("data-wa-phone");
        window.SafeRouteSOS.openWhatsApp(phone, state.alertMessage);
      };
    });

    document.querySelectorAll("[data-sms-phone]").forEach((btn) => {
      btn.onclick = () => {
        const phone = btn.getAttribute("data-sms-phone");
        window.SafeRouteSOS.openSms(phone, state.alertMessage);
      };
    });
  }

  /**
   * Leaflet Map Initialization for Emergency Route
   */
  function initEmergencyLeafletMap(driverLoc, facility) {
    const container = document.getElementById("sos-leaflet-map");
    if (!container || typeof L === "undefined") return;

    if (state.leafletMap) {
      try {
        state.leafletMap.remove();
      } catch (e) {}
      state.leafletMap = null;
    }

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: false,
    });

    if (window.SafeRouteMap && window.SafeRouteMap.createTileLayer) {
      window.SafeRouteMap.createTileLayer().addTo(map);
    } else {
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
        crossOrigin: true,
      }).addTo(map);
    }

    const layerGroup = L.layerGroup().addTo(map);

    const driverPt = [driverLoc.lat, driverLoc.lng];
    const facilityPt = [facility.lat, facility.lng];

    // Driver Marker (Pulsing Blue)
    const driverIcon = L.divIcon({
      className: "custom-driver-pin",
      html: `
        <div style="background:#2563eb; color:#ffffff; font-weight:800; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 0 0 4px rgba(37,99,235,0.4); font-size:14px;">
          🚚
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker(driverPt, { icon: driverIcon })
      .addTo(layerGroup)
      .bindPopup(`<strong>${tr("nav_live_map", "Your Current Location")}</strong><br/>Driver GPS Position`);

    // Facility Marker (Red for Hospital, Blue for Police)
    const isPolice = state.emergencyType === "police";
    const facColor = isPolice ? "#1d4ed8" : "#dc2626";
    const facEmoji = isPolice ? "🚔" : "🏥";

    const facilityIcon = L.divIcon({
      className: "custom-facility-pin",
      html: `
        <div style="background:${facColor}; color:#ffffff; font-weight:800; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 3px 8px rgba(0,0,0,0.3); font-size:16px;">
          ${facEmoji}
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    L.marker(facilityPt, { icon: facilityIcon })
      .addTo(layerGroup)
      .bindPopup(`<strong>${escapeHtml(facility.name)}</strong><br/>${facility.distanceKm} km ${tr("sos_away", "away")} · ${facility.drivingTimeStr}`);

    // Polyline connecting driver to facility
    L.polyline([driverPt, facilityPt], {
      color: facColor,
      weight: 4,
      dashArray: "6, 6",
      opacity: 0.85,
    }).addTo(layerGroup);

    map.fitBounds(L.latLngBounds([driverPt, facilityPt]), {
      padding: [40, 40],
    });

    state.leafletMap = map;
    state.leafletLayers = layerGroup;
  }

  // Note: Automated server alert transmission is disabled per configuration ("dont send").
  // Direct driver-controlled emergency actions (Call Now, Navigate, Share Location, Emergency Contacts) are active.


  /**
   * Share Location & Emergency Alert Action Sheet
   */
  function openShareActionSheet(alertText, navUrl) {
    if (navigator.share) {
      window.SafeRouteSOS.shareLocationNative(alertText, navUrl).then((res) => {
        if (!res.shared) {
          showShareModal(alertText);
        }
      });
    } else {
      showShareModal(alertText);
    }
  }

  /**
   * Inline Share Modal if Web Share is unavailable
   */
  function showShareModal(alertText) {
    const existing = document.getElementById("sos-share-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "sos-share-modal";
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000000;
      display: flex; align-items: center; justify-content: center; padding: 16px;
    `;
    modal.innerHTML = `
      <div style="background:#fff; border-radius:16px; max-width:480px; width:100%; padding:20px; box-shadow:0 20px 40px rgba(0,0,0,0.3);">
        <h4 style="margin:0 0 10px 0; font-size:16px; font-weight:800; color:#0f172a;">📤 ${tr("sos_btn_share", "Share Emergency Alert")}</h4>
        <textarea id="sos-share-textarea" readonly style="width:100%; height:160px; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:8px; font-family:monospace; font-size:11.5px; resize:none;">${escapeHtml(alertText)}</textarea>
        
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:14px;">
          <button type="button" class="btn btn-primary" id="btn-copy-alert-text" style="background:#0f172a; color:#ffffff; flex:1;">
            📋 Copy Message
          </button>
          <button type="button" class="btn btn-primary" id="btn-wa-alert-text" style="background:#22c55e; color:#ffffff; flex:1;">
            💬 WhatsApp
          </button>
          <button type="button" class="sos-btn-secondary" id="btn-close-share-modal" style="flex-basis:100%;">
            ${tr("sos_btn_close", "Close")}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("btn-copy-alert-text").onclick = async () => {
      const ok = await window.SafeRouteSOS.copyToClipboard(alertText);
      alert(ok ? "Emergency alert copied to clipboard!" : "Unable to copy to clipboard.");
    };

    document.getElementById("btn-wa-alert-text").onclick = () => {
      window.SafeRouteSOS.openWhatsApp("", alertText);
    };

    document.getElementById("btn-close-share-modal").onclick = () => {
      modal.remove();
    };
  }

  /**
   * VIEW 5: No Results State
   */
  function renderNoResultsView() {
    state.view = "NO_RESULTS";
    updateModalHeader();
    const body = document.getElementById("sos-modal-body");
    const isPolice = state.emergencyType === "police";
    const noResultsTitle = isPolice ? tr("sos_no_results_police", "No nearby police stations found") : tr("sos_no_results_hospital", "No nearby hospitals found");

    body.innerHTML = `
      <div class="sos-error-box" style="background:#fffbeb; border-color:#fef3c7;">
        <div class="sos-error-icon">🔍</div>
        <div class="sos-error-title" style="color:#92400e;">
          ${noResultsTitle}
        </div>
        <div class="sos-error-desc" style="color:#78350f;">
          ${tr("sos_no_results_desc", "No facility found within current radius.")} (${Math.round(state.radiusMeters / 1000)} km)
        </div>

        <div class="sos-action-row">
          <button type="button" class="btn btn-primary" id="btn-expand-radius" style="background:#dc2626; color:#ffffff; font-weight:700;">
            🔍 ${tr("sos_btn_expand", "Expand Search Area (50 km)")}
          </button>
          <button type="button" class="btn btn-secondary" id="btn-search-again">
            🔄 ${tr("sos_btn_try_again", "Search Again")}
          </button>
          <button type="button" class="sos-btn-secondary" id="btn-manual-from-noresults">
            ✏️ ${tr("sos_btn_manual", "Enter Location Manually")}
          </button>
          <button type="button" class="sos-btn-secondary" id="btn-share-loc-anyway">
            📤 ${tr("sos_btn_share_anyway", "Share Location Anyway")}
          </button>
        </div>
      </div>
      
      <div style="text-align:center; margin-top:14px;">
        <button type="button" class="sos-btn-secondary" id="btn-noresults-back">
          ← ${tr("sos_modal_title", "Emergency Assistance")}
        </button>
      </div>
    `;

    document.getElementById("btn-expand-radius").onclick = () => {
      state.radiusMeters = 50000; // 50km
      startFacilitySearch();
    };

    document.getElementById("btn-search-again").onclick = () => {
      startFacilitySearch();
    };

    document.getElementById("btn-manual-from-noresults").onclick = () => {
      renderLocationErrorView({ message: tr("sos_err_loc_sub", "Please specify your location or nearest town manually.") });
    };

    document.getElementById("btn-share-loc-anyway").onclick = () => {
      const profile = getDriverProfile();
      const msg = window.SafeRouteSOS.buildEmergencyMessage({
        driverName: profile.driverName,
        vehicleNumber: profile.vehicleNumber,
        emergencyType: state.emergencyType,
        facility: null,
        lat: state.driverLoc.lat,
        lng: state.driverLoc.lng,
        timestamp: state.driverLoc.timestamp,
      });
      openShareActionSheet(msg, `https://www.google.com/maps?q=${state.driverLoc.lat},${state.driverLoc.lng}`);
    };

    document.getElementById("btn-noresults-back").onclick = () => {
      renderChoiceView();
    };
  }

  /**
   * VIEW 6: Emergency Contacts Manager View
   */
  function renderContactsManagerView() {
    state.view = "CONTACTS";
    updateModalHeader();
    const body = document.getElementById("sos-modal-body");
    const contacts = window.SafeRouteSOS.getEmergencyContacts();

    body.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h4 style="margin:0; font-size:16px; font-weight:800; color:#0f172a;">👨‍👩‍👧 ${tr("sos_contacts_title", "Emergency Contacts")}</h4>
        <button type="button" class="sos-btn-secondary" id="btn-back-from-contacts">
          ← ${tr("btn_cancel", "Back")}
        </button>
      </div>
      <p style="font-size:12.5px; color:#64748b; margin-top:0; margin-bottom:16px;">
        ${tr("sos_contacts_sub", "Save trusted phone numbers (family member, vehicle owner, contractor, friend). In an emergency, you can notify them with a single click.")}
      </p>

      <div class="sos-contacts-list" style="margin-bottom:20px;">
        ${contacts
          .map(
            (c) => `
          <div class="sos-contact-item">
            <div>
              <strong>${escapeHtml(c.name)}</strong>
              <span style="font-size:11px; background:#e2e8f0; color:#334155; padding:2px 6px; border-radius:4px; margin-left:6px;">${escapeHtml(c.relationship || 'Contact')}</span>
              <div style="font-size:12px; color:#0f172a; margin-top:3px;">📞 ${escapeHtml(c.phone || 'No phone set')}</div>
            </div>
            <button type="button" class="sos-btn-alt-sm" data-delete-contact="${escapeHtml(c.id)}" style="background:#fee2e2; color:#991b1b;">
              ${tr("btn_delete", "Delete")}
            </button>
          </div>
        `
          )
          .join("")}
      </div>

      <!-- Add Contact Form -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
        <h5 style="margin:0 0 10px 0; font-size:13.5px; font-weight:800; color:#0f172a;">${tr("sos_contacts_title", "Add Emergency Contact")}</h5>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
          <div>
            <label style="font-size:11px; font-weight:700; color:#475569;">Name</label>
            <input type="text" id="contact-name-input" class="sos-input-manual" style="margin:4px 0 0 0;" placeholder="e.g. Ramesh" />
          </div>
          <div>
            <label style="font-size:11px; font-weight:700; color:#475569;">Relationship</label>
            <select id="contact-rel-select" class="sos-input-manual" style="margin:4px 0 0 0; background:#fff;">
              <option value="Family">${tr("sos_role_family", "Family Member")}</option>
              <option value="Friend">${tr("sos_role_friend", "Friend")}</option>
              <option value="Vehicle Owner">${tr("sos_role_owner", "Vehicle / Fleet Owner")}</option>
              <option value="Contractor">${tr("sos_role_contractor", "Contractor / Broker")}</option>
              <option value="Logistics">${tr("sos_role_logistics", "Logistics Company")}</option>
            </select>
          </div>
        </div>
        <div style="margin-bottom:12px;">
          <label style="font-size:11px; font-weight:700; color:#475569;">${tr("sos_phone_label", "Phone Number")}</label>
          <input type="tel" id="contact-phone-input" class="sos-input-manual" style="margin:4px 0 0 0;" placeholder="e.g. +91 98765 43210" />
        </div>
        <button type="button" class="btn btn-primary" id="btn-save-new-contact" style="background:#16a34a; color:#ffffff; font-weight:700; width:100%;">
          ${tr("sos_btn_save_contacts", "Save Emergency Contact")}
        </button>
      </div>
    `;

    document.getElementById("btn-back-from-contacts").onclick = () => {
      if (state.facility) {
        renderFacilityResultView();
      } else {
        renderChoiceView();
      }
    };

    document.getElementById("btn-save-new-contact").onclick = () => {
      const name = document.getElementById("contact-name-input").value.trim();
      const relationship = document.getElementById("contact-rel-select").value;
      const phone = document.getElementById("contact-phone-input").value.trim();

      if (!name || !phone) {
        alert("Please provide both a contact name and phone number.");
        return;
      }

      window.SafeRouteSOS.saveEmergencyContact({
        name,
        relationship,
        phone,
      });

      renderContactsManagerView();
    };

    document.querySelectorAll("[data-delete-contact]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-delete-contact");
        window.SafeRouteSOS.deleteEmergencyContact(id);
        renderContactsManagerView();
      };
    });
  }

  // =========================================================================
  // UTILITY HELPERS & REACTIVE LANGUAGE LISTENER
  // =========================================================================

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // React immediately whenever user changes language anywhere on website
  window.addEventListener("saferoute:lang-changed", () => {
    updateSosButtonLabels();
    if (state.isOpen) {
      updateModalHeader();
      if (state.view === "CHOICE") {
        renderChoiceView();
      } else if (state.view === "FACILITY" && state.facility) {
        renderFacilityResultView();
      } else if (state.view === "LOCATING") {
        startLocationAcquisition();
      } else if (state.view === "NO_RESULTS") {
        renderNoResultsView();
      } else if (state.view === "CONTACTS") {
        renderContactsManagerView();
      }
    }
  });

  // Auto-initialize buttons when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSosButtons);
  } else {
    initSosButtons();
  }

  // Global Window API
  window.SafeRouteSOS_UI = {
    openSosModal,
    cancelSos,
    updateSosButtonLabels,
  };
})(window);
