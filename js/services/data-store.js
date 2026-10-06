/**
 * NE8 Logistics Safety Platform — Core Data Store & Entities
 * Manages Users, Companies, Drivers, Vehicles, Trips, RoadReports, and Alerts.
 * Clearly separates DEMO baseline data from LIVE production/driver-submitted telemetry.
 */

(function (window) {
  "use strict";

  const STORAGE_KEYS = {
    TRIPS: "ne8-store-trips",
    DRIVERS: "ne8-store-drivers",
    VEHICLES: "ne8-store-vehicles",
    COMPANIES: "ne8-store-companies",
    REPORTS: "ne8-store-reports",
    ALERTS: "ne8-store-alerts",
    ACTIVE_USER: "ne8-store-active-user",
    DATA_VERSION: "ne8-store-v2-initialized",
  };

  // -------------------------------------------------------------
  // DEMO BASELINE DATA (Distinctly tagged with isDemo: true)
  // -------------------------------------------------------------
  const DEMO_COMPANIES = [
    {
      id: "comp-1",
      name: "Northeast Essential Logistics (NE8)",
      hq: "Guwahati, Assam",
      contact: "+91 361 245 9901",
      fleetSize: 12,
      activeCorridors: ["NH-6", "NH-27", "NH-37", "NH-2"],
      isDemo: true,
    },
    {
      id: "comp-2",
      name: "Brahmaputra Hill Express Carriers",
      hq: "Silchar, Assam",
      contact: "+91 384 223 8812",
      fleetSize: 8,
      activeCorridors: ["NH-6", "NH-54"],
      isDemo: true,
    },
  ];

  const DEMO_DRIVERS = [
    {
      id: "drv-101",
      userId: "usr-drv-101",
      companyId: "comp-1",
      name: "R. Sharma",
      phone: "+91 98540 12345",
      license: "AS-01-2018-98421",
      vehicleId: "veh-101",
      activeTripId: "trip-001",
      status: "on_trip",
      rating: 4.9,
      isDemo: true,
    },
    {
      id: "drv-204",
      userId: "usr-drv-204",
      companyId: "comp-1",
      name: "A. Gogoi",
      phone: "+91 94350 67890",
      license: "AS-02-2016-11234",
      vehicleId: "veh-204",
      activeTripId: "trip-002",
      status: "on_trip",
      rating: 4.8,
      isDemo: true,
    },
    {
      id: "drv-308",
      userId: "usr-drv-308",
      companyId: "comp-1",
      name: "B. Das",
      phone: "+91 98640 45678",
      license: "AS-03-2019-55678",
      vehicleId: "veh-308",
      activeTripId: "trip-003",
      status: "on_trip",
      rating: 4.7,
      isDemo: true,
    },
    {
      id: "drv-412",
      userId: "usr-drv-412",
      companyId: "comp-1",
      name: "T. Ao",
      phone: "+91 94360 88990",
      license: "NL-01-2017-33445",
      vehicleId: "veh-412",
      activeTripId: "trip-004",
      status: "on_trip",
      rating: 4.9,
      isDemo: true,
    },
    {
      id: "drv-105",
      userId: "usr-drv-105",
      companyId: "comp-1",
      name: "M. Singh",
      phone: "+91 98560 22334",
      license: "MN-01-2015-77889",
      vehicleId: "veh-105",
      activeTripId: "trip-005",
      status: "on_trip",
      rating: 4.8,
      isDemo: true,
    },
  ];

  const DEMO_VEHICLES = [
    {
      id: "veh-101",
      code: "NE-MED-101",
      companyId: "comp-1",
      driverId: "drv-101",
      vehicleNo: "AS-01-EB-101",
      model: "Tata 407 Heavy Terrain",
      cargoType: "medicines",
      cargoLabel: "Medicines (Vaccines & Emergency Kits)",
      icon: "💊",
      status: "delayed",
      statusNote: "Slow crawl near Barapani",
      currentLat: 25.654,
      currentLng: 91.896,
      heading: 175,
      speedKm: 28,
      lastUpdate: Date.now() - 3 * 60 * 1000,
      isDemo: true,
    },
    {
      id: "veh-204",
      code: "NE-FOOD-204",
      companyId: "comp-1",
      driverId: "drv-204",
      vehicleNo: "AS-02-TC-204",
      model: "Ashok Leyland Ecomet",
      cargoType: "food",
      cargoLabel: "Food Supplies (Rice & Essential Grains)",
      icon: "🍚",
      status: "on_schedule",
      statusNote: "Smooth transit on NH-27",
      currentLat: 26.35,
      currentLng: 92.6,
      heading: 85,
      speedKm: 55,
      lastUpdate: Date.now() - 2 * 60 * 1000,
      isDemo: true,
    },
    {
      id: "veh-308",
      code: "NE-AGRI-308",
      companyId: "comp-1",
      driverId: "drv-308",
      vehicleNo: "AS-03-AG-308",
      model: "Eicher Pro 3015",
      cargoType: "agri",
      cargoLabel: "Agricultural Produce (Tea & Organic Greens)",
      icon: "🌾",
      status: "on_schedule",
      statusNote: "Passing Kolia Bhomora Bridge",
      currentLat: 26.6,
      currentLng: 92.85,
      heading: 260,
      speedKm: 48,
      lastUpdate: Date.now() - 5 * 60 * 1000,
      isDemo: true,
    },
    {
      id: "veh-412",
      code: "NE-MAT-412",
      companyId: "comp-1",
      driverId: "drv-412",
      vehicleNo: "NL-01-CR-412",
      model: "BharatBenz 2823C",
      cargoType: "materials",
      cargoLabel: "Construction Materials (Bridge Steel & Cement)",
      icon: "🏗️",
      status: "delayed",
      statusNote: "Ghat road crawl at Chumukedima",
      currentLat: 25.82,
      currentLng: 93.8,
      heading: 140,
      speedKm: 18,
      lastUpdate: Date.now() - 7 * 60 * 1000,
      isDemo: true,
    },
    {
      id: "veh-105",
      code: "NE-MED-105",
      companyId: "comp-1",
      driverId: "drv-105",
      vehicleNo: "MN-01-OX-105",
      model: "Tata Ultra T.11",
      cargoType: "medicines",
      cargoLabel: "Emergency Medical Oxygen Cylinders",
      icon: "💊",
      status: "rerouted",
      statusNote: "Detour via NH-2 (NH-37 Gorge Blocked)",
      currentLat: 24.78,
      currentLng: 93.15,
      heading: 90,
      speedKm: 32,
      lastUpdate: Date.now() - 1 * 60 * 1000,
      isDemo: true,
    },
  ];

  const DEMO_TRIPS = [
    {
      id: "trip-001",
      code: "TRIP-GHY-SHL-01",
      companyId: "comp-1",
      driverId: "drv-101",
      driverName: "R. Sharma",
      vehicleId: "veh-101",
      vehicleCode: "NE-MED-101",
      origin: "Guwahati, Assam",
      originCoords: { lat: 26.1445, lng: 91.7362 },
      destination: "Shillong, Meghalaya",
      destinationCoords: { lat: 25.5788, lng: 91.8933 },
      corridor: "NH-6 Hill Corridor",
      distanceKm: 98,
      estimatedTimeMin: 180,
      status: "in_progress", // assigned | in_progress | completed
      startTime: Date.now() - 90 * 60 * 1000,
      eta: "17:45 (+35m delay)",
      progressPercent: 65,
      riskLevel: "caution", // safe | caution | risk
      riskFactors: [
        "Moderate rainfall reported near Barapani",
        "Single-lane slow crawl active on NH-6 km stone 88",
      ],
      currentLocationDesc: "Near Barapani Lake approach, Meghalaya",
      alternativeRoute: {
        name: "Umiam Bypass (Via Old Shillong-Guwahati Road)",
        extraTimeMin: 18,
        reason: "Avoids recently reported narrow bridge bottleneck at Barapani",
      },
      isDemo: true,
    },
    {
      id: "trip-002",
      code: "TRIP-GHY-DBR-02",
      companyId: "comp-1",
      driverId: "drv-204",
      driverName: "A. Gogoi",
      vehicleId: "veh-204",
      vehicleCode: "NE-FOOD-204",
      origin: "Guwahati, Assam",
      originCoords: { lat: 26.1445, lng: 91.7362 },
      destination: "Dibrugarh, Assam",
      destinationCoords: { lat: 27.4728, lng: 94.912 },
      corridor: "NH-27 Trunk Corridor",
      distanceKm: 440,
      estimatedTimeMin: 540,
      status: "in_progress",
      startTime: Date.now() - 140 * 60 * 1000,
      eta: "21:30 (On Time)",
      progressPercent: 38,
      riskLevel: "safe",
      riskFactors: ["Clear expressway conditions", "Normal visibility"],
      currentLocationDesc: "Nagaon Bypass, Assam",
      alternativeRoute: null,
      isDemo: true,
    },
    {
      id: "trip-003",
      code: "TRIP-TEZ-GHY-03",
      companyId: "comp-1",
      driverId: "drv-308",
      driverName: "B. Das",
      vehicleId: "veh-308",
      vehicleCode: "NE-AGRI-308",
      origin: "Tezpur, Assam",
      originCoords: { lat: 26.6338, lng: 92.8 },
      destination: "Guwahati, Assam",
      destinationCoords: { lat: 26.1445, lng: 91.7362 },
      corridor: "NH-715 Corridor",
      distanceKm: 175,
      estimatedTimeMin: 240,
      status: "in_progress",
      startTime: Date.now() - 75 * 60 * 1000,
      eta: "18:15 (On Time)",
      progressPercent: 55,
      riskLevel: "safe",
      riskFactors: ["Dry surface", "Normal freight flow"],
      currentLocationDesc: "Near Kolia Bhomora Setu, Tezpur",
      alternativeRoute: null,
      isDemo: true,
    },
    {
      id: "trip-004",
      code: "TRIP-DMP-KOH-04",
      companyId: "comp-1",
      driverId: "drv-412",
      driverName: "T. Ao",
      vehicleId: "veh-412",
      vehicleCode: "NE-MAT-412",
      origin: "Dimapur, Nagaland",
      originCoords: { lat: 25.906, lng: 93.727 },
      destination: "Kohima, Nagaland",
      destinationCoords: { lat: 25.6751, lng: 94.1086 },
      corridor: "NH-2 Mountain Ghat",
      distanceKm: 74,
      estimatedTimeMin: 180,
      status: "in_progress",
      startTime: Date.now() - 60 * 60 * 1000,
      eta: "19:00 (+40m crawl)",
      progressPercent: 45,
      riskLevel: "caution",
      riskFactors: ["Sinking soil section at Phesama ghat", "Heavy fog reducing visibility"],
      currentLocationDesc: "Chumukedima Hill Section, Nagaland",
      alternativeRoute: null,
      isDemo: true,
    },
    {
      id: "trip-005",
      code: "TRIP-SIL-IMP-05",
      companyId: "comp-1",
      driverId: "drv-105",
      driverName: "M. Singh",
      vehicleId: "veh-105",
      vehicleCode: "NE-MED-105",
      origin: "Silchar, Assam",
      originCoords: { lat: 24.8333, lng: 92.7789 },
      destination: "Imphal, Manipur",
      destinationCoords: { lat: 24.817, lng: 93.9368 },
      corridor: "NH-37 / NH-2 Corridor",
      distanceKm: 260,
      estimatedTimeMin: 480,
      status: "in_progress",
      startTime: Date.now() - 110 * 60 * 1000,
      eta: "22:00 (Rerouted +90m)",
      progressPercent: 30,
      riskLevel: "risk",
      riskFactors: [
        "NH-37 gorge section impassable due to road bed collapse",
        "Traffic diverted via secondary link",
      ],
      currentLocationDesc: "Jiribam Border Checkpoint",
      alternativeRoute: {
        name: "Alternative: Southern Hill Detour via NH-2",
        extraTimeMin: 90,
        reason: "Circumnavigates the impassable fractured roadbed along NH-37 km 62",
      },
      isDemo: true,
    },
  ];

  const DEMO_ALERTS = [
    {
      id: "alt-101",
      type: "ROAD_HAZARD",
      severity: "CRITICAL",
      levelClass: "risk",
      icon: "🔴",
      title: "ROAD COLLAPSE: NH-37 Imphal–Jiribam Section",
      description: "Active road sinkhole and mudfall blocking freight transit near km 62.",
      location: "Manipur (NH-37 Gorge)",
      affectedTripId: "trip-005",
      affectedVehicleId: "veh-105",
      timestamp: Date.now() - 25 * 60 * 1000,
      source: "Driver Field Observation & District Admin",
      isDemo: true,
    },
    {
      id: "alt-102",
      type: "WEATHER_RISK",
      severity: "HIGH",
      levelClass: "caution",
      icon: "🟠",
      title: "POTENTIAL RISK: High-Altitude Snowpack & Black Ice",
      description: "Sub-zero freezing pass with dangerous road surface slippery conditions.",
      location: "Arunachal Pradesh (Sela Pass, NH-13)",
      affectedTripId: null,
      affectedVehicleId: null,
      timestamp: Date.now() - 45 * 60 * 1000,
      source: "India Meteorological Department (IMD)",
      isDemo: true,
    },
    {
      id: "alt-103",
      type: "ROUTE_DELAY",
      severity: "WARNING",
      levelClass: "caution",
      icon: "🚚",
      title: "SUPPLY DELAY ADVISORY: Medicine Truck NE-MED-101",
      description: "Vaccine shipment progressing at reduced speed through Barapani single-lane flow.",
      location: "Shillong Freight Corridor (NH-6)",
      affectedTripId: "trip-001",
      affectedVehicleId: "veh-101",
      timestamp: Date.now() - 35 * 60 * 1000,
      source: "NE8 Fleet Operations Dispatch",
      isDemo: true,
    },
  ];

  // -------------------------------------------------------------
  // STORE INITIALIZATION & HELPERS
  // -------------------------------------------------------------
  function getRaw(key, fallback = []) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  }

  function setRaw(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn("Storage write notice, attempting compaction:", e);
      if (Array.isArray(val)) {
        try {
          const compacted = val.slice(0, 25).map((item, idx) => {
            if (idx > 3 && item.photoUrl && typeof item.photoUrl === "string" && item.photoUrl.startsWith("data:") && item.photoUrl.length > 50000) {
              return { ...item, photoUrl: "" };
            }
            return item;
          });
          localStorage.setItem(key, JSON.stringify(compacted));
        } catch (e2) {
          console.warn("Storage write retry notice:", e2);
        }
      }
    }
  }

  function initDataStore() {
    if (!localStorage.getItem(STORAGE_KEYS.DATA_VERSION)) {
      setRaw(STORAGE_KEYS.COMPANIES, DEMO_COMPANIES);
      setRaw(STORAGE_KEYS.DRIVERS, DEMO_DRIVERS);
      setRaw(STORAGE_KEYS.VEHICLES, DEMO_VEHICLES);
      setRaw(STORAGE_KEYS.TRIPS, DEMO_TRIPS);
      setRaw(STORAGE_KEYS.ALERTS, DEMO_ALERTS);
      setRaw(STORAGE_KEYS.REPORTS, []);
      localStorage.setItem(STORAGE_KEYS.DATA_VERSION, "true");
    }
  }

  // -------------------------------------------------------------
  // TRIPS & JOURNEYS API
  // -------------------------------------------------------------
  function getTrips(filterCompanyId = null) {
    initDataStore();
    const trips = getRaw(STORAGE_KEYS.TRIPS, DEMO_TRIPS);
    if (filterCompanyId) {
      return trips.filter((t) => t.companyId === filterCompanyId);
    }
    return trips;
  }

  function getTripById(tripId) {
    return getTrips().find((t) => t.id === tripId) || null;
  }

  function getActiveTripForDriver(driverId) {
    const trips = getTrips();
    // Prefer in_progress, then assigned
    const inProg = trips.find((t) => t.driverId === driverId && t.status === "in_progress");
    if (inProg) return inProg;
    return trips.find((t) => t.driverId === driverId && t.status !== "completed") || trips[0] || null;
  }

  function createJourney({ origin, destination, routeName, distanceKm, estimatedTimeMin, waypoints, riskLevel, riskFactors, alternativeRoute, driverId, vehicleId }) {
    const trips = getTrips();
    const newJourney = {
      id: `jny-${Date.now()}`,
      code: `JNY-${(origin || "ORG").substring(0, 3).toUpperCase()}-${(destination || "DST").substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      companyId: "comp-1",
      driverId: driverId || "drv-101",
      driverName: (window.NE8_AUTH && window.NE8_AUTH.getCurrentUser().name) || "Driver",
      vehicleId: vehicleId || "veh-101",
      vehicleCode: "NE-MED-101",
      origin: origin || "Current Location",
      destination: destination || "Destination",
      corridor: routeName || "Selected Mountain Corridor",
      distanceKm: distanceKm || 95,
      estimatedTimeMin: estimatedTimeMin || 160,
      eta: `${Math.floor(estimatedTimeMin / 60 || 2)}h ${Math.round(estimatedTimeMin % 60 || 40)}m`,
      status: "in_progress", // User just started navigation
      startTime: Date.now(),
      progressPercent: 0,
      riskLevel: riskLevel || "safe",
      riskFactors: riskFactors || ["Normal road corridor visibility"],
      currentLocationDesc: `En route from ${origin} to ${destination}`,
      alternativeRoute: alternativeRoute || null,
      waypoints: waypoints || [],
      isDemo: false, // Live driver journey!
    };

    // Replace or prepend to journeys list
    trips.unshift(newJourney);
    setRaw(STORAGE_KEYS.TRIPS, trips);
    broadcastChange("journey", newJourney);
    return newJourney;
  }

  function updateTripStatus(tripId, newStatus) {
    const trips = getTrips();
    const target = trips.find((t) => t.id === tripId);
    if (target) {
      target.status = newStatus;
      if (newStatus === "in_progress" && !target.startTime) {
        target.startTime = Date.now();
      }
      if (newStatus === "completed") {
        target.completedTime = Date.now();
        target.progressPercent = 100;
      }
      setRaw(STORAGE_KEYS.TRIPS, trips);
      broadcastChange("trip", target);
    }
    return target;
  }

  function updateTripLocation(tripId, lat, lng, progressPercent = null) {
    const trips = getTrips();
    const target = trips.find((t) => t.id === tripId);
    if (target) {
      target.currentCoords = { lat, lng };
      if (typeof progressPercent === "number") {
        target.progressPercent = Math.min(100, Math.max(0, progressPercent));
      }
      setRaw(STORAGE_KEYS.TRIPS, trips);

      // Also update vehicle coords
      if (target.vehicleId) {
        updateVehicleLocation(target.vehicleId, lat, lng);
      }
      broadcastChange("location", { tripId, lat, lng });
    }
  }

  // -------------------------------------------------------------
  // VEHICLES API
  // -------------------------------------------------------------
  function getVehicles(filterCompanyId = null) {
    initDataStore();
    const vehs = getRaw(STORAGE_KEYS.VEHICLES, DEMO_VEHICLES);
    if (filterCompanyId) {
      return vehs.filter((v) => v.companyId === filterCompanyId);
    }
    return vehs;
  }

  function getVehicleById(vehicleId) {
    return getVehicles().find((v) => v.id === vehicleId) || null;
  }

  function updateVehicleLocation(vehicleId, lat, lng, speedKm = null) {
    const vehs = getVehicles();
    const v = vehs.find((item) => item.id === vehicleId);
    if (v) {
      v.currentLat = lat;
      v.currentLng = lng;
      v.lastUpdate = Date.now();
      if (typeof speedKm === "number") v.speedKm = speedKm;
      setRaw(STORAGE_KEYS.VEHICLES, vehs);
    }
  }

  // -------------------------------------------------------------
  // DRIVERS API
  // -------------------------------------------------------------
  function getDrivers(filterCompanyId = null) {
    initDataStore();
    const drvs = getRaw(STORAGE_KEYS.DRIVERS, DEMO_DRIVERS);
    if (filterCompanyId) {
      return drvs.filter((d) => d.companyId === filterCompanyId);
    }
    return drvs;
  }

  function getDriverById(driverId) {
    return getDrivers().find((d) => d.id === driverId) || null;
  }

  // -------------------------------------------------------------
  // ROAD REPORTS API (With Server-Enforced Soft-Delete Ownership)
  // -------------------------------------------------------------
  function getRoadReports(options = {}) {
    initDataStore();
    const all = getRaw(STORAGE_KEYS.REPORTS, []);
    // By default, exclude soft-deleted reports from active public signals
    if (options.includeDeleted) {
      return all;
    }
    return all.filter((r) => r.status !== "DELETED");
  }

  function getUserReports(userId) {
    initDataStore();
    const currentUserId = userId || (window.NE8_AUTH && window.NE8_AUTH.getCurrentUser().userId) || "usr-drv-101";
    const all = getRaw(STORAGE_KEYS.REPORTS, []);
    return all.filter((r) => (r.userId === currentUserId || r.driverId === currentUserId) && r.status !== "DELETED");
  }

  function getReportById(reportId) {
    initDataStore();
    return getRaw(STORAGE_KEYS.REPORTS, []).find((r) => r.id === reportId) || null;
  }

  function addRoadReport(reportData) {
    const reports = getRaw(STORAGE_KEYS.REPORTS, []);
    const currentUser = (window.NE8_AUTH && window.NE8_AUTH.getCurrentUser()) || { userId: "usr-drv-101", name: "R. Sharma" };

    const newReport = {
      id: reportData.id || `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: reportData.userId || currentUser.userId || "usr-drv-101",
      driverId: reportData.driverId || currentUser.driverId || "drv-101",
      driverName: reportData.driverName || currentUser.name || "Field Driver",
      vehicleId: reportData.vehicleId || currentUser.vehicleId || "veh-101",
      category: reportData.category || "road-damage", // flooding, road-damage, accident, obstruction, traffic, poor-visibility, weather-issue, other
      title: reportData.title || "Road Condition Report",
      description: reportData.description || "",
      photoUrl: reportData.photoUrl || "",
      lat: typeof reportData.lat === "number" ? reportData.lat : 25.5788,
      lng: typeof reportData.lng === "number" ? reportData.lng : 91.8933,
      accuracyMeters: reportData.accuracyMeters || null,
      state: reportData.state || "Meghalaya",
      place: reportData.place || "",
      riskLevel: reportData.riskLevel || "caution",
      riskScore: reportData.riskScore || 50,
      timestamp: reportData.timestamp || Date.now(),
      status: "ACTIVE", // ACTIVE | RESOLVED | EXPIRED | DELETED
      syncStatus: reportData.syncStatus || "synced", // synced | queued (for offline)
      isDemo: false, // User-submitted live data!
    };

    reports.unshift(newReport);
    setRaw(STORAGE_KEYS.REPORTS, reports);

    // Bridge to legacy incidents store
    bridgeToLegacyIncidents(newReport);

    // Broadcast alert if caution/risk
    if (newReport.riskLevel === "risk" || newReport.riskLevel === "caution") {
      addAlert({
        type: "DRIVER_HAZARD_REPORT",
        severity: newReport.riskLevel === "risk" ? "CRITICAL" : "WARNING",
        levelClass: newReport.riskLevel,
        icon: newReport.riskLevel === "risk" ? "🔴" : "🟠",
        title: `HAZARD REPORT: ${newReport.title}`,
        description: newReport.description || `Reported by ${newReport.driverName} near ${newReport.place || newReport.state}.`,
        location: `${newReport.state} (${newReport.place || "Highway"})`,
        affectedTripId: newReport.tripId || null,
        affectedVehicleId: newReport.vehicleId || null,
        timestamp: Date.now(),
        source: "Driver Observation",
        isDemo: false,
      });
    }

    broadcastChange("report", newReport);
    return newReport;
  }

  /**
   * Server/Service-Enforced Soft Deletion
   * Verifies the requesting user owns the report before permitting deletion.
   */
  function softDeleteReport(reportId, requestingUserId) {
    initDataStore();
    const reports = getRaw(STORAGE_KEYS.REPORTS, []);
    const report = reports.find((r) => String(r.id) === String(reportId));

    if (!report) {
      return { success: false, error: "Report not found." };
    }

    const currentUserId = requestingUserId || (window.NE8_AUTH && window.NE8_AUTH.getCurrentUser().userId) || "usr-drv-101";
    const isOwner = report.userId === currentUserId || report.driverId === currentUserId;
    const isAuthority = window.NE8_AUTH && window.NE8_AUTH.hasRole && window.NE8_AUTH.hasRole("official");

    if (!isOwner && !isAuthority) {
      console.warn("Unauthorized attempt to delete report:", { reportId, currentUserId, ownerId: report.userId });
      return { success: false, error: "Unauthorized: You can only delete reports submitted by your account." };
    }

    // Soft-delete: update lifecycle state
    report.status = "DELETED";
    report.deletedAt = Date.now();
    setRaw(STORAGE_KEYS.REPORTS, reports);

    // Remove from legacy incidents store so it disappears from maps and public feeds
    removeFromLegacyIncidents(reportId);

    broadcastChange("report:deleted", { reportId, deletedBy: currentUserId });
    return { success: true, report };
  }

  function updateReportVerification(reportId, verificationStatus) {
    initDataStore();
    const reports = getRaw(STORAGE_KEYS.REPORTS, []);
    const report = reports.find((r) => String(r.id) === String(reportId));

    if (!report) {
      return { success: false, error: "Report not found." };
    }

    report.verificationStatus = verificationStatus; // UNVERIFIED | VERIFIED | RESOLVED
    if (verificationStatus === "RESOLVED") {
      report.status = "RESOLVED";
      report.resolvedAt = Date.now();
    } else if (verificationStatus === "VERIFIED") {
      report.verifiedAt = Date.now();
    }

    setRaw(STORAGE_KEYS.REPORTS, reports);
    broadcastChange("report:verified", report);
    return { success: true, report };
  }

  function removeFromLegacyIncidents(reportId) {
    try {
      const key = "ne8-incidents";
      const raw = localStorage.getItem(key);
      if (raw) {
        const list = JSON.parse(raw);
        const filtered = list.filter((i) => String(i.id) !== String(reportId));
        localStorage.setItem(key, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent("ne8:platform-updated"));
      }
    } catch (e) {
      console.warn("Legacy incident remove notice:", e);
    }
  }

  function bridgeToLegacyIncidents(rep) {
    try {
      const key = "ne8-incidents";
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({
        id: rep.id,
        title: rep.title,
        description: rep.description,
        photo: rep.photoUrl,
        driver_name: rep.driverName,
        vehicle_no: rep.vehicleId,
        state: rep.state,
        place: rep.place,
        incident_type: rep.category,
        hazards: [rep.category],
        level: rep.riskLevel,
        risk_score: rep.riskScore,
        reasons: [`Reported by active driver ${rep.driverName}`],
        lat: rep.lat,
        lng: rep.lng,
        createdAt: rep.timestamp,
        isDemo: false,
      });
      localStorage.setItem(key, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("ne8:platform-updated", { detail: rep }));
    } catch (e) {
      console.warn("Legacy incident bridge notice:", e);
    }
  }

  // -------------------------------------------------------------
  // ALERTS API
  // -------------------------------------------------------------
  function getAlerts(limit = 20) {
    initDataStore();
    const alerts = getRaw(STORAGE_KEYS.ALERTS, DEMO_ALERTS);
    return alerts.slice(0, limit);
  }

  function addAlert(alertData) {
    const alerts = getRaw(STORAGE_KEYS.ALERTS, DEMO_ALERTS);
    const newAlert = {
      id: alertData.id || `alt-${Date.now()}`,
      type: alertData.type || "INFO",
      severity: alertData.severity || "INFO",
      levelClass: alertData.levelClass || "safe",
      icon: alertData.icon || "ℹ️",
      title: alertData.title,
      description: alertData.description,
      location: alertData.location || "Northeast Corridor",
      affectedTripId: alertData.affectedTripId || null,
      affectedVehicleId: alertData.affectedVehicleId || null,
      timestamp: alertData.timestamp || Date.now(),
      source: alertData.source || "System Alert",
      isDemo: alertData.isDemo || false,
    };
    alerts.unshift(newAlert);
    setRaw(STORAGE_KEYS.ALERTS, alerts.slice(0, 30));
    broadcastChange("alert", newAlert);
    return newAlert;
  }

  // -------------------------------------------------------------
  // EVENT BROADCASTER
  // -------------------------------------------------------------
  function broadcastChange(type, detail) {
    window.dispatchEvent(
      new CustomEvent("ne8:data-changed", {
        detail: { type, detail, timestamp: Date.now() },
      })
    );
  }

  // -------------------------------------------------------------
  // EXPOSE GLOBAL DATA STORE MODULE
  // -------------------------------------------------------------
  window.NE8_DATA_STORE = {
    initDataStore,
    getTrips,
    getTripById,
    getActiveTripForDriver,
    createJourney,
    updateTripStatus,
    updateTripLocation,
    getVehicles,
    getVehicleById,
    updateVehicleLocation,
    getDrivers,
    getDriverById,
    getRoadReports,
    getUserReports,
    getReportById,
    addRoadReport,
    softDeleteReport,
    updateReportVerification,
    getAlerts,
    addAlert,
    broadcastChange,
    STORAGE_KEYS,
  };

  // Initialize on load
  initDataStore();
})(window);
