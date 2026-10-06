/**
 * SafeRoute — Production Map Provider Configuration & Tile Factory
 * 
 * Configures OpenFreeMap (Liberty style via MapLibre GL Leaflet plugin)
 * as the primary production basemap (unmetered, free, OSM-derived, no API key),
 * with Esri World Street Map as a high-reliability raster fallback (no API key, zero 403 blocks).
 */

(function (window) {
  "use strict";

  const STORAGE_MAP_KEY = "saferoute_map_provider";

  const MAP_PROVIDERS = {
    "openfreemap": {
      name: "OpenFreeMap Liberty (Production Vector)",
      style: "https://tiles.openfreemap.org/styles/liberty",
      fallbackUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
    "esri-streets": {
      name: "Esri World Street Map (Production Raster)",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      fallbackUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
    "esri-satellite": {
      name: "Esri World Imagery (Satellite)",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      maxZoom: 19,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
    "esri-dark": {
      name: "Esri Dark Gray Canvas",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
    "maptiler-streets": {
      name: "MapTiler Streets (Requires API Key)",
      url: "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key={apiKey}",
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
  };

  const DEFAULT_PROVIDER = "openfreemap";

  function hasWebGLSupport() {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }

  function getActiveProviderKey() {
    try {
      const saved = localStorage.getItem(STORAGE_MAP_KEY);
      if (saved && MAP_PROVIDERS[saved]) return saved;
    } catch (e) {
      console.warn("Map provider storage error:", e);
    }
    const cfg = (window.NE8_CONFIG && window.NE8_CONFIG.mapProvider);
    if (cfg && MAP_PROVIDERS[cfg]) return cfg;
    return DEFAULT_PROVIDER;
  }

  function setActiveProviderKey(key) {
    if (MAP_PROVIDERS[key]) {
      try {
        localStorage.setItem(STORAGE_MAP_KEY, key);
      } catch (e) {
        console.warn("Failed to persist map provider:", e);
      }
    }
  }

  function getActiveProviderConfig() {
    const key = getActiveProviderKey();
    const config = MAP_PROVIDERS[key] || MAP_PROVIDERS[DEFAULT_PROVIDER];
    const apiKey = (window.NE8_CONFIG && window.NE8_CONFIG.mapApiKey) || localStorage.getItem("saferoute_map_api_key") || "";

    let tileUrl = config.url || "";
    if (tileUrl.includes("{apiKey}")) {
      tileUrl = tileUrl.replace("{apiKey}", apiKey);
    }

    return {
      key,
      ...config,
      resolvedUrl: tileUrl,
      apiKey,
    };
  }

  /**
   * Factory to create Leaflet TileLayer or MapLibre GL layer with correct settings and attribution.
   * Uses OpenFreeMap via MapLibre GL Leaflet if available, falling back to Esri World Street Map raster.
   * Completely avoids blocked volunteer-run OpenStreetMap tile servers.
   * @param {Object} overrideOptions - optional custom layer options
   * @returns {L.Layer} configured map layer
   */
  function createTileLayer(overrideOptions = {}) {
    if (typeof L === "undefined") {
      console.error("Leaflet is not loaded.");
      return null;
    }

    const prov = getActiveProviderConfig();

    // 1. If explicit MapTiler provider with an API key is requested
    if (prov.key === "maptiler-streets" && prov.apiKey && prov.apiKey !== "PASTE_YOUR_KEY_HERE") {
      return L.tileLayer(prov.resolvedUrl, {
        maxZoom: 19,
        attribution: prov.attribution,
        crossOrigin: true,
        ...overrideOptions,
      });
    }

    // 2. OpenFreeMap via MapLibre GL Leaflet plugin (Vector)
    if (
      typeof L.maplibreGL === "function" &&
      typeof maplibregl !== "undefined" &&
      hasWebGLSupport() &&
      prov.key !== "esri-streets" &&
      prov.key !== "esri-satellite" &&
      prov.key !== "esri-dark"
    ) {
      try {
        const styleUrl = prov.style || "https://tiles.openfreemap.org/styles/liberty";
        const layer = L.maplibreGL({
          style: styleUrl,
          attribution: prov.attribution || MAP_PROVIDERS["openfreemap"].attribution,
          ...overrideOptions,
        });
        return layer;
      } catch (err) {
        console.warn("MapLibre GL layer initialization error, falling back to raster:", err);
      }
    }

    // 3. High-reliability raster tile layer: Esri World Street Map (or specific Esri variant)
    const rasterUrl =
      prov.resolvedUrl ||
      prov.url ||
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
    const rasterAttr =
      prov.attribution ||
      '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

    const layer = L.tileLayer(rasterUrl, {
      maxZoom: prov.maxZoom || 19,
      attribution: rasterAttr,
      crossOrigin: true,
      ...overrideOptions,
    });

    layer.on("tileerror", function (error) {
      if (error && error.tile && error.coords && !error.tile.dataset.fallbackApplied) {
        error.tile.dataset.fallbackApplied = "true";
        // Fallback to Esri World Topo Map if primary fails, NEVER blocked OSM volunteer server
        error.tile.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${error.coords.z}/${error.coords.y}/${error.coords.x}`;
      }
      window.dispatchEvent(
        new CustomEvent("saferoute:tile-error", {
          detail: { provider: prov.key, url: (error && error.url) || "" },
        })
      );
    });

    return layer;
  }

  /**
   * Attaches an automatic tile error notification banner to a map container
   * @param {L.Map} map - Leaflet map instance
   * @param {string} containerId - Element ID containing the map
   */
  function attachTileErrorBanner(map, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let banner = container.querySelector(".map-tile-fallback-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.className = "map-tile-fallback-banner";
      banner.style.cssText = `
        display: none;
        position: absolute;
        bottom: 28px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999;
        background: #ffffff;
        color: #0f172a;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        padding: 8px 16px;
        border-radius: 99px;
        font-size: 12.5px;
        font-weight: 600;
        align-items: center;
        gap: 8px;
        pointer-events: auto;
      `;
      container.style.position = "relative";
      container.appendChild(banner);
    }

    let failureCount = 0;
    const onTileError = () => {
      failureCount++;
      if (failureCount >= 3) {
        const t = window.I18N ? window.I18N.t : (k, d) => d;
        const msg = t("map_unavailable", "Map imagery is temporarily unavailable.");
        const retryText = t("btn_retry_map", "Retry Map");
        banner.innerHTML = `
          <span>⚠️</span> <span>${msg}</span>
          <button type="button" style="background:#0284c7; color:#fff; border:none; border-radius:12px; padding:4px 10px; font-size:11.5px; font-weight:700; cursor:pointer;" onclick="window.SafeRouteMap.reloadMapTiles('${containerId}')">${retryText}</button>
        `;
        banner.style.display = "flex";
      }
    };

    window.addEventListener("saferoute:tile-error", onTileError);
  }

  function reloadMapTiles(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      const banner = container.querySelector(".map-tile-fallback-banner");
      if (banner) banner.style.display = "none";
    }
    window.location.reload();
  }

  window.SafeRouteMap = {
    MAP_PROVIDERS,
    getActiveProviderKey,
    setActiveProviderKey,
    getActiveProviderConfig,
    createTileLayer,
    attachTileErrorBanner,
    reloadMapTiles,
    hasWebGLSupport,
  };
})(window);
