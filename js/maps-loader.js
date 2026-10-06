window.USE_FALLBACK_MAP = false;

function showMapsNotice(message, isError = false) {
  const missing = document.getElementById("maps-key-missing");
  if (!missing) return;
  missing.classList.remove("hidden");
  missing.className = isError ? "notice alert-caution" : "notice";
  missing.innerHTML = message;
}

function getMapsKey() {
  const fromConfig = (window.NE8_CONFIG && window.NE8_CONFIG.mapsKey) || "";
  if (fromConfig.trim()) {
    return fromConfig.trim();
  }
  return (localStorage.getItem("ne8-google-maps-key") || "").trim();
}

function loadLeafletFallback(callbackName) {
  window.USE_FALLBACK_MAP = true;

  // Inject Leaflet CSS if not loaded
  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }

  // If Leaflet is already in window
  if (window.L) {
    if (typeof window[callbackName] === "function") window[callbackName]();
    return true;
  }

  if (document.getElementById("leaflet-sdk")) return true;

  const script = document.createElement("script");
  script.id = "leaflet-sdk";
  script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  script.onload = () => {
    if (typeof window[callbackName] === "function") window[callbackName]();
  };
  script.onerror = () => {
    console.warn("Unable to load Leaflet map engine. Please check internet connection.");
  };
  document.head.appendChild(script);
  return true;
}

function loadGoogleMaps(callbackName) {
  const key = getMapsKey();

  // If no Google Maps key is configured, seamlessly use the Leaflet engine
  if (!key) {
    window.USE_FALLBACK_MAP = true;
    return loadLeafletFallback(callbackName);
  }

  window.USE_FALLBACK_MAP = false;

  // If Google Maps JavaScript API is already present
  if (window.google && window.google.maps) {
    const missing = document.getElementById("maps-key-missing");
    if (missing) missing.classList.add("hidden");
    if (typeof window[callbackName] === "function") window[callbackName]();
    return true;
  }

  if (document.getElementById("google-maps-sdk")) return true;

  // If Google Maps authentication fails (e.g. wrong key, unbilled account, unauthorized domain)
  window.gm_authFailure = () => {
    console.warn(
      "Google Maps API authentication failed. Ensure Maps JavaScript API, Directions API, and Places API are enabled on Google Cloud Console. Falling back to OpenStreetMap."
    );
    window.USE_FALLBACK_MAP = true;
    loadLeafletFallback(callbackName);
  };

  const script = document.createElement("script");
  script.id = "google-maps-sdk";
  script.async = true;
  script.defer = true;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
    key
  )}&libraries=places,geometry&v=weekly&callback=${callbackName}`;
  script.onerror = () => {
    console.warn("Google Maps script failed to load. Falling back to OpenStreetMap.");
    window.USE_FALLBACK_MAP = true;
    loadLeafletFallback(callbackName);
  };
  document.head.appendChild(script);
  return true;
}
