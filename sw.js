/**
 * SafeRoute PWA — Service Worker
 * Provides offline caching for shell assets and offline fallback.
 */

const CACHE_NAME = "saferoute-pwa-v4";
const SHELL_ASSETS = [
  "./driver.html",
  "./index.html",
  "./login.html",
  "./logistics.html",
  "./official.html",
  "./trip-planner.html",
  "./manifest.json",
  "./css/tokens.css",
  "./css/base.css",
  "./css/layout.css",
  "./css/components.css",
  "./css/pages.css",
  "./css/role-views.css",
  "./css/sos.css",
  "./css/app.css",
  "./js/config.js",
  "./js/config/map-config.js",
  "./js/i18n.js",
  "./js/services/gemini-service.js",
  "./js/services/voice-service.js",
  "./js/services/route-provider.js",
  "./js/services/route-evaluation-service.js",
  "./js/services/data-store.js",
  "./js/services/auth-service.js",
  "./js/services/risk-engine.js",
  "./js/services/ai-explanation-service.js",
  "./js/services/location-service.js",
  "./js/services/report-service.js",
  "./js/services/trip-service.js",
  "./js/services/trip-planner-engine.js",
  "./js/services/sos-service.js",
  "./js/sos-ui.js",
  "./js/common.js",
];

// Install Event: Cache essential shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn("ServiceWorker pre-cache notice:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clear older caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network-first with cache fallback
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache valid responses
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("./driver.html");
          }
        });
      })
  );
});
