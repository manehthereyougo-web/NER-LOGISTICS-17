/**
 * SafeRoute — Road Condition Reporting & Offline Queue Service
 * Handles rapid 1-tap reporting with auto-attached metadata (GPS, Driver, Timestamp).
 * Automatically queues reports offline and synchronizes when online connectivity resumes.
 * Enforces report ownership for view and soft-delete capabilities.
 */

(function (window) {
  "use strict";

  const OFFLINE_QUEUE_KEY = "ne8-offline-report-queue";

  // EXACT 8 CATEGORIES
  const REPORT_CATEGORIES = [
    { id: "flooded", icon: "🌊", label: "Road flooded", riskLevel: "risk", baseScore: 35 },
    { id: "damaged", icon: "🚧", label: "Road damaged", riskLevel: "caution", baseScore: 48 },
    { id: "accident", icon: "💥", label: "Accident", riskLevel: "risk", baseScore: 30 },
    { id: "blocked", icon: "⛔", label: "Road blocked", riskLevel: "risk", baseScore: 25 },
    { id: "traffic", icon: "🚗", label: "Heavy traffic", riskLevel: "caution", baseScore: 60 },
    { id: "visibility", icon: "🌫️", label: "Poor visibility", riskLevel: "caution", baseScore: 55 },
    { id: "weather", icon: "⛈️", label: "Weather issue", riskLevel: "caution", baseScore: 50 },
    { id: "other", icon: "⚠️", label: "Other", riskLevel: "caution", baseScore: 50 },
  ];

  function getOfflineQueue() {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveOfflineQueue(queue) {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      window.dispatchEvent(
        new CustomEvent("ne8:queue-updated", {
          detail: { count: queue.length },
        })
      );
    } catch (e) {
      console.warn("Queue save notice:", e);
    }
  }

  /**
   * Fast 1-Tap report submission with auto-attached metadata
   */
  async function submitReport({ category, photoFile, description, customTitle, lat, lng }) {
    const user = window.NE8_AUTH ? window.NE8_AUTH.getCurrentUser() : { userId: "usr-drv-101", driverId: "drv-101", name: "R. Sharma", vehicleId: "veh-101" };
    const catMeta = REPORT_CATEGORIES.find((c) => c.id === category) || REPORT_CATEGORIES[1];

    // Auto-acquire current location if not explicitly provided
    let reportLat = lat;
    let reportLng = lng;
    let accuracy = null;

    if (typeof reportLat !== "number" || typeof reportLng !== "number") {
      let loc = window.NE8_LOCATION ? window.NE8_LOCATION.getLastKnownLocation() : null;
      if (!loc && window.NE8_LOCATION) {
        try {
          loc = await window.NE8_LOCATION.requestCurrentPosition();
        } catch (e) {
          loc = window.NE8_LOCATION.getCorridorFallbackPosition();
        }
      }
      reportLat = loc ? loc.lat : 25.654;
      reportLng = loc ? loc.lng : 91.896;
      accuracy = loc ? loc.accuracy : null;
    }

    // Compress photo for safe offline/local storage and rapid upload
    let photoDataUrl = "";
    if (photoFile) {
      if (typeof window.compressImage === "function") {
        photoDataUrl = await window.compressImage(photoFile, 1200, 1200, 0.75);
      } else if (typeof photoFile === "string") {
        photoDataUrl = photoFile;
      } else {
        photoDataUrl = await readFileAsDataUrl(photoFile);
      }
    }

    let finalPhotoUrl = photoDataUrl || (window.LIVE_PHOTOS ? window.LIVE_PHOTOS.sample1 : "");

    // If online and Supabase is configured, upload to Supabase Storage bucket first
    if (navigator.onLine && photoDataUrl && window.NE8_SUPABASE && window.NE8_SUPABASE.isSupabaseConfigured()) {
      try {
        const { publicUrl, error: uploadErr } = await window.NE8_SUPABASE.uploadPhoto(photoDataUrl);
        if (publicUrl) {
          finalPhotoUrl = publicUrl;
        } else if (uploadErr) {
          console.warn("Storage upload notice (falling back to compressed local):", uploadErr);
        }
      } catch (uploadEx) {
        console.warn("Storage upload exception:", uploadEx);
      }
    }

    const reportPayload = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.userId || "usr-drv-101",
      driverId: user.driverId || user.userId || "drv-101",
      driverName: user.name || "Field Driver",
      vehicleId: user.vehicleId || "veh-101",
      category: catMeta.id,
      title: customTitle || `${catMeta.icon} ${catMeta.label}`,
      description: description || `${catMeta.label} reported near highway section.`,
      photo: finalPhotoUrl,
      photo_url: finalPhotoUrl,
      photoUrl: finalPhotoUrl,
      lat: reportLat,
      lng: reportLng,
      accuracyMeters: accuracy,
      state: "Meghalaya",
      place: "Hill Section",
      riskLevel: catMeta.riskLevel,
      riskScore: catMeta.baseScore,
      timestamp: Date.now(),
      status: "ACTIVE", // ACTIVE | RESOLVED | EXPIRED | DELETED
      syncStatus: navigator.onLine ? "synced" : "queued",
      isDemo: false,
    };

    // If online, save directly to Data Store & Supabase
    if (navigator.onLine) {
      if (window.NE8_DATA_STORE) {
        window.NE8_DATA_STORE.addRoadReport(reportPayload);
      }
      if (window.NE8_SUPABASE && window.NE8_SUPABASE.isSupabaseConfigured()) {
        try {
          await window.NE8_SUPABASE.saveIncident(reportPayload);
        } catch (e) {
          console.warn("Supabase background save notice:", e);
        }
      }
      return { success: true, queued: false, report: reportPayload };
    }

    // If offline, queue locally
    const queue = getOfflineQueue();
    queue.push(reportPayload);
    saveOfflineQueue(queue);

    // Still persist locally so driver sees their own reports
    if (window.NE8_DATA_STORE) {
      window.NE8_DATA_STORE.addRoadReport(reportPayload);
    }

    return { success: true, queued: true, report: reportPayload };
  }

  /**
   * Retrieves reports submitted by a specific user
   */
  function getUserReports(userId) {
    if (window.NE8_DATA_STORE) {
      return window.NE8_DATA_STORE.getUserReports(userId);
    }
    return [];
  }

  /**
   * Soft-deletes a report, enforcing ownership verification
   */
  function deleteUserReport(reportId, userId) {
    const targetUserId = userId || (window.NE8_AUTH && window.NE8_AUTH.getCurrentUser().userId) || "usr-drv-101";

    // Remove from offline queue if queued
    const queue = getOfflineQueue();
    const filteredQueue = queue.filter((item) => String(item.id) !== String(reportId));
    if (filteredQueue.length !== queue.length) {
      saveOfflineQueue(filteredQueue);
    }

    // Delegate to data-store soft-delete
    if (window.NE8_DATA_STORE) {
      return window.NE8_DATA_STORE.softDeleteReport(reportId, targetUserId);
    }
    return { success: false, error: "Data store unavailable" };
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  async function syncQueuedReports() {
    if (!navigator.onLine) return;
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline report(s) now...`);
    const remaining = [];

    for (const item of queue) {
      try {
        if (window.NE8_SUPABASE && window.NE8_SUPABASE.isSupabaseConfigured()) {
          await window.NE8_SUPABASE.saveIncident(item);
        }
        item.syncStatus = "synced";
      } catch (err) {
        console.warn("Could not sync item, will retry:", err);
        remaining.push(item);
      }
    }

    saveOfflineQueue(remaining);
    window.dispatchEvent(new CustomEvent("ne8:data-changed", { detail: { type: "sync" } }));
  }

  // Listen for connection recovery
  window.addEventListener("online", () => {
    syncQueuedReports();
  });

  window.NE8_REPORTS = {
    REPORT_CATEGORIES,
    submitReport,
    getUserReports,
    deleteUserReport,
    getOfflineQueue,
    syncQueuedReports,
  };
})(window);
