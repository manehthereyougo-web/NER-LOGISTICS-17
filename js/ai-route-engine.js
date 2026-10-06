/**
 * NE8 Local AI Safe Route Engine
 * Dedicated client-side AI model for mountain pass routing, hazard evaluation, and detour strategy.
 * Zero external API dependencies — runs 100% locally in browser.
 */

(function () {
  const MOUNTAIN_PASSES = [
    { name: "Sonapur Tunnel Pass", highway: "NH-6", state: "Meghalaya", ele: 1250, risk: "High Landslide & Mudslip Risk", lat: 25.1167, lng: 92.3667 },
    { name: "Sela Pass", highway: "NH-13", state: "Arunachal Pradesh", ele: 4170, risk: "Snowfall & Black Ice Alert", lat: 27.5028, lng: 92.1039 },
    { name: "Imphal-Jiribam Gorge", highway: "NH-37", state: "Manipur", ele: 780, risk: "Road Sinking & Mudslides", lat: 24.817, lng: 93.35 },
    { name: "Rangpo-Teesta Pass", highway: "NH-10", state: "Sikkim", ele: 350, risk: "River Undercut & Rockfalls", lat: 27.1764, lng: 88.5342 },
    { name: "Naga Hill Corridor", highway: "NH-2", state: "Nagaland", ele: 1444, risk: "Heavy Fog & Narrow Curves", lat: 25.6751, lng: 94.1086 },
    { name: "Barapani Lake Highway", highway: "NH-6", state: "Meghalaya", ele: 990, risk: "Fog & Potholes", lat: 25.65, lng: 91.9 },
  ];

  const CITY_COORDS = {
    "Guwahati, Assam": { lat: 26.1445, lng: 91.7362, ele: 55 },
    "Shillong, Meghalaya": { lat: 25.5788, lng: 91.8933, ele: 1525 },
    "Silchar, Assam": { lat: 24.8333, lng: 92.7789, ele: 35 },
    "Imphal, Manipur": { lat: 24.817, lng: 93.9368, ele: 786 },
    "Dimapur, Nagaland": { lat: 25.906, lng: 93.727, ele: 145 },
    "Kohima, Nagaland": { lat: 25.6751, lng: 94.1086, ele: 1444 },
    "Itanagar, Arunachal Pradesh": { lat: 27.0844, lng: 93.6053, ele: 320 },
    "Aizawl, Mizoram": { lat: 23.7271, lng: 92.7176, ele: 1132 },
    "Agartala, Tripura": { lat: 23.8315, lng: 91.2868, ele: 128 },
    "Gangtok, Sikkim": { lat: 27.3314, lng: 88.6138, ele: 1650 },
    "Tawang, Arunachal Pradesh": { lat: 27.5861, lng: 91.8594, ele: 3048 },
    "Dibrugarh, Assam": { lat: 27.4728, lng: 94.912, ele: 108 },
    "Tezpur, Assam": { lat: 26.6338, lng: 92.8, ele: 48 },
  };

  function haversineKm(c1, c2) {
    const R = 6371;
    const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
    const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((c1.lat * Math.PI) / 180) *
        Math.cos((c2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  class NE8AiRouteEngine {
    constructor() {
      this.initialized = true;
    }

    resolveLocation(query) {
      const trimmed = (query || "").trim().toLowerCase();
      if (!trimmed) return { lat: 26.1445, lng: 91.7362, ele: 55 };

      for (const [key, val] of Object.entries(CITY_COORDS)) {
        if (key.toLowerCase() === trimmed) return val;
      }

      for (const [key, val] of Object.entries(CITY_COORDS)) {
        const cityName = key.split(",")[0].trim().toLowerCase();
        if (cityName === trimmed || key.toLowerCase().includes(trimmed) || trimmed.includes(cityName)) {
          return val;
        }
      }

      const stateMatch = window.NE_STATES
        ? window.NE_STATES.find(
            (s) =>
              s.name.toLowerCase().includes(trimmed) ||
              s.capital.toLowerCase().includes(trimmed) ||
              trimmed.includes(s.name.toLowerCase()) ||
              trimmed.includes(s.capital.toLowerCase())
          )
        : null;
      if (stateMatch && stateMatch.center) {
        return { lat: stateMatch.center.lat, lng: stateMatch.center.lng, ele: 500 };
      }

      const parts = trimmed.split(",");
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, ele: 200 };
      }

      return { lat: 26.1445, lng: 91.7362, ele: 100 };
    }

    generateSafeRoute(originName, destName, incidentInput, routeMetrics) {
      const orig = this.resolveLocation(originName);
      const dest = this.resolveLocation(destName);
      const dist = haversineKm(orig, dest);

      // Resolve incident / disaster location if specified
      let incidentLoc = null;
      let incidentNearRoute = false;
      let minDistToIncident = 9999;
      const exclusionRadiusKm = 10;

      if (incidentInput && typeof incidentInput === "string" && incidentInput.trim()) {
        incidentLoc = this.resolveLocation(incidentInput);
      } else if (incidentInput && typeof incidentInput.lat === "number") {
        incidentLoc = incidentInput;
      }

      if (incidentLoc) {
        // Distance of incident from straight line connecting orig and dest
        const d1 = haversineKm(orig, incidentLoc);
        const d2 = haversineKm(dest, incidentLoc);
        // If incident is between orig and dest corridor
        if (d1 + d2 <= dist * 1.35 || d1 < exclusionRadiusKm * 1.5 || d2 < exclusionRadiusKm * 1.5) {
          incidentNearRoute = true;
          // Approximate perpendicular distance
          const s = (d1 + d2 + dist) / 2;
          const area = Math.sqrt(Math.max(0, s * (s - d1) * (s - d2) * (s - dist)));
          minDistToIncident = dist > 0 ? (2 * area) / dist : d1;
        }
      }

      // Check proximity to active mountain passes & live incidents
      const nearbyPasses = MOUNTAIN_PASSES.filter((pass) => {
        const d1 = haversineKm(orig, pass);
        const d2 = haversineKm(dest, pass);
        return d1 + d2 <= dist * 1.45 || d1 < 50 || d2 < 50;
      });

      // Load live incidents if available
      const incidents = typeof loadIncidents === "function" ? loadIncidents() : [];
      const routeIncidents = incidents.filter((inc) => {
        if (typeof inc.lat !== "number") return false;
        const d1 = haversineKm(orig, inc);
        const d2 = haversineKm(dest, inc);
        return d1 + d2 <= dist * 1.35;
      });

      // Calculate AI Safety Score & Hazard Detour Waypoint
      let score = 92;
      const riskFactors = [];
      let detourWaypoint = null;
      let detourActive = false;
      let detourMessage = "Direct highway clear of severe blockades";
      let originalRouteBlocked = false;

      if (dist > 300) {
        score -= 8;
        riskFactors.push("Long mountain corridor — multiple high-altitude weather transitions.");
      }

      const eleDiff = Math.abs(dest.ele - orig.ele);
      if (eleDiff > 1000) {
        score -= 12;
        riskFactors.push(`Steep elevation gradient climb (${dest.ele}m vs ${orig.ele}m) — downshift required on hairpins.`);
      }

      // If incident location falls inside route corridor
      if (incidentLoc && (incidentNearRoute || minDistToIncident <= exclusionRadiusKm * 1.5)) {
        originalRouteBlocked = true;
        detourActive = true;
        const incidentName = typeof incidentInput === "string" ? incidentInput : "Disaster Hazard Zone";
        score -= 35;
        riskFactors.unshift(`Active disaster exclusion zone (${exclusionRadiusKm} km radius) at ${incidentName}.`);

        // Deterministic bypass waypoint calculation:
        // Calculate perpendicular unit vector to corridor line, offset outside the 10km exclusion zone
        const dLat = dest.lat - orig.lat;
        const dLng = dest.lng - orig.lng;
        const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1;
        // Perpendicular normal (-dLng, dLat)
        const perpLat = -dLng / len;
        const perpLng = dLat / len;
        // 0.18 degrees ≈ 20 km offset (well outside 10 km exclusion radius)
        const bypassOffset = 0.18;
        const bpLat = incidentLoc.lat + perpLat * bypassOffset;
        const bpLng = incidentLoc.lng + perpLng * bypassOffset;

        detourWaypoint = {
          lat: parseFloat(bpLat.toFixed(5)),
          lng: parseFloat(bpLng.toFixed(5)),
          name: `Safe Bypass around ${incidentName}`,
        };
        detourMessage = `⚡ Safe Detour: Bypassing ${exclusionRadiusKm} km exclusion zone near ${incidentName}`;
      } else if (nearbyPasses.length > 0 || routeIncidents.length > 0) {
        const hazard = nearbyPasses[0] || routeIncidents[0];
        detourActive = true;
        originalRouteBlocked = true;
        const midLat = (orig.lat + dest.lat) / 2 + 0.12;
        const midLng = (orig.lng + dest.lng) / 2 + 0.12;
        detourWaypoint = { lat: midLat, lng: midLng, name: `Bypass near ${hazard.name || hazard.title || "Hazard Zone"}` };
        detourMessage = `⚡ Safe Detour: Bypassing risk zone near ${hazard.name || hazard.title || "Disaster Pass"}`;
      }

      nearbyPasses.forEach((p) => {
        score -= 10;
        riskFactors.push(`Pass hazard near ${p.name} (${p.highway}, ${p.state}): ${p.risk}`);
      });

      routeIncidents.forEach((inc) => {
        const p = inc.level === "risk" ? 18 : 8;
        score -= p;
        riskFactors.push(`Active field alert: ${inc.title || "Road issue"} (${inc.location || "Northeast"})`);
      });

      // Night driving check
      const hr = new Date().getHours();
      if (hr < 5 || hr > 19) {
        score -= 10;
        riskFactors.push("Night travel active — reduced visibility on mountain curves.");
      }

      score = Math.max(25, Math.min(98, Math.round(score)));

      let bandLabel = "HIGH SAFETY CONTINUITY";
      let bandClass = "level-safe";
      let riskLevel = "LOW";
      let estDelayMins = 0;

      if (score < 55) {
        bandLabel = "HIGH HAZARD ALERT — CAUTION REQUIRED";
        bandClass = "level-risk";
        riskLevel = "CRITICAL";
        estDelayMins = 60;
      } else if (score < 70) {
        bandLabel = "HIGH HAZARD ALERT — CAUTION REQUIRED";
        bandClass = "level-risk";
        riskLevel = "HIGH";
        estDelayMins = 45;
      } else if (score < 85) {
        bandLabel = "MODERATE CAUTION RECOMMENDED";
        bandClass = "level-caution";
        riskLevel = "MODERATE";
        estDelayMins = 20;
      }

      // Use real route distance if available from routing engine
      const realDistKm = (routeMetrics && routeMetrics.distanceKm) ? routeMetrics.distanceKm : Math.round(dist);
      const realMins = (routeMetrics && routeMetrics.durationMin) ? routeMetrics.durationMin : Math.round((dist / 38) * 60) + estDelayMins;

      let riskPrediction = "Normal smooth mountain corridor travel expected.";
      if (detourActive) {
        riskPrediction = `Disaster exclusion bypass active (+${estDelayMins} mins delay): Safe alternative routing avoids hazard perimeter.`;
      } else if (riskLevel !== "LOW") {
        riskPrediction = `Moderate delay risk (+${estDelayMins} mins): Monsoon moisture & steep elevation climbs active.`;
      }

      // Construct elevation profile points
      const profilePoints = [
        { name: originName.split(",")[0], ele: orig.ele, dist: 0 },
        { name: detourWaypoint ? detourWaypoint.name : "Mid Mountain Pass", ele: Math.max(orig.ele, dest.ele) + 420, dist: Math.round(realDistKm * 0.5) },
        { name: destName.split(",")[0], ele: dest.ele, dist: Math.round(realDistKm) },
      ];

      const voiceAdvisory = `AI Safe Route analysis for ${originName} to ${destName}. Distance is approximately ${realDistKm} kilometers. Disruption risk level is ${riskLevel}. AI Safety Score is ${score} out of 100, status ${bandLabel}. ${
        detourActive ? detourMessage + ". " : ""
      }${riskFactors.length > 0 ? "Caution: " + riskFactors[0] : "All major passes are clear."} Drive safely and follow mountain speed limits.`;

      return {
        origin: originName,
        destination: destName,
        incidentInput: incidentInput || "",
        incidentLoc,
        originalRouteBlocked,
        exclusionRadiusKm,
        score,
        bandLabel,
        bandClass,
        riskLevel,
        estDelayMins,
        riskPrediction,
        distanceKm: realDistKm,
        estMins: realMins,
        recommendedWindow: "06:00 - 16:00 (Daylight Driving Optimal)",
        passes: nearbyPasses,
        incidents: routeIncidents,
        riskFactors: riskFactors.slice(0, 6),
        profilePoints,
        voiceAdvisory,
        detourActive,
        detourWaypoint,
        detourMessage,
        isSimulatedMvp: true,
      };
    }
  }

  window.NE8AiRouteEngine = new NE8AiRouteEngine();
})();
