/**
 * NE8 Logistics Safety Platform — Geolocation & Telemetry Service
 * Robust browser geolocation wrapper with accuracy tracking, permission handling,
 * and stale-location detection.
 */

(function (window) {
  "use strict";

  const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
  const LOW_ACCURACY_THRESHOLD_METERS = 250;

  let watchId = null;
  let lastKnownLocation = null;
  let locationStatus = "idle"; // 'idle' | 'acquiring' | 'live' | 'stale' | 'denied' | 'unavailable'
  let listeners = [];

  function getStatus() {
    if (!lastKnownLocation) return locationStatus;
    if (Date.now() - lastKnownLocation.timestamp > STALE_THRESHOLD_MS) {
      return "stale";
    }
    return locationStatus;
  }

  function getLastKnownLocation() {
    return lastKnownLocation;
  }

  function subscribeLocation(cb) {
    if (typeof cb === "function") {
      listeners.push(cb);
      if (lastKnownLocation) {
        cb(lastKnownLocation, getStatus());
      }
    }
    return () => {
      listeners = listeners.filter((l) => l !== cb);
    };
  }

  function notifyListeners(loc, status) {
    listeners.forEach((fn) => {
      try {
        fn(loc, status);
      } catch (e) {
        console.error("Location listener error:", e);
      }
    });
  }

  function requestCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        locationStatus = "unavailable";
        notifyListeners(null, locationStatus);
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      locationStatus = "acquiring";
      notifyListeners(null, locationStatus);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: parseFloat(pos.coords.latitude.toFixed(5)),
            lng: parseFloat(pos.coords.longitude.toFixed(5)),
            accuracy: Math.round(pos.coords.accuracy),
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null,
            heading: pos.coords.heading || null,
            timestamp: pos.timestamp || Date.now(),
            isLowAccuracy: pos.coords.accuracy > LOW_ACCURACY_THRESHOLD_METERS,
            isStale: false,
          };
          lastKnownLocation = loc;
          locationStatus = "live";
          notifyListeners(loc, locationStatus);
          resolve(loc);
        },
        (err) => {
          console.warn("Geolocation error:", err);
          if (err.code === err.PERMISSION_DENIED) {
            locationStatus = "denied";
          } else {
            locationStatus = "unavailable";
          }
          notifyListeners(lastKnownLocation, locationStatus);
          resolve(lastKnownLocation || getCorridorFallbackPosition());
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }

  function startLiveTracking() {
    if (!navigator.geolocation) {
      locationStatus = "unavailable";
      return;
    }

    if (watchId !== null) return;

    locationStatus = "acquiring";
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          lat: parseFloat(pos.coords.latitude.toFixed(5)),
          lng: parseFloat(pos.coords.longitude.toFixed(5)),
          accuracy: Math.round(pos.coords.accuracy),
          speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null,
          heading: pos.coords.heading || null,
          timestamp: pos.timestamp || Date.now(),
          isLowAccuracy: pos.coords.accuracy > LOW_ACCURACY_THRESHOLD_METERS,
          isStale: false,
        };
        lastKnownLocation = loc;
        locationStatus = "live";
        notifyListeners(loc, locationStatus);
      },
      (err) => {
        console.warn("Watch position notice:", err);
        if (err.code === err.PERMISSION_DENIED) {
          locationStatus = "denied";
        }
        notifyListeners(lastKnownLocation, locationStatus);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    );
  }

  function stopLiveTracking() {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  function getCorridorFallbackPosition() {
    // Standard Northeast default (Guwahati/Barapani central hub)
    return {
      lat: 25.654,
      lng: 91.896,
      accuracy: 500,
      timestamp: Date.now() - 10 * 60 * 1000,
      isFallback: true,
      isStale: true,
      label: "Estimated Corridor Position (Meghalaya NH-6)",
    };
  }

  window.NE8_LOCATION = {
    requestCurrentPosition,
    startLiveTracking,
    stopLiveTracking,
    getLastKnownLocation,
    getStatus,
    subscribeLocation,
    getCorridorFallbackPosition,
    STALE_THRESHOLD_MS,
  };
})(window);
