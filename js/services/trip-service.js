/**
 * NE8 Logistics Safety Platform — Trip Lifecycle & Route Recommendation Service
 * Handles:
 * - Starting, updating, and completing trips
 * - Connecting trips to live route recommendations and alternatives
 */

(function (window) {
  "use strict";

  function getDriverActiveTrip(driverId) {
    if (!window.NE8_DATA_STORE) return null;
    return window.NE8_DATA_STORE.getActiveTripForDriver(driverId);
  }

  function startTrip(tripId) {
    if (!window.NE8_DATA_STORE) return null;
    const trip = window.NE8_DATA_STORE.updateTripStatus(tripId, "in_progress");
    if (window.NE8_LOCATION) {
      window.NE8_LOCATION.startLiveTracking();
    }
    return trip;
  }

  function completeTrip(tripId) {
    if (!window.NE8_DATA_STORE) return null;
    const trip = window.NE8_DATA_STORE.updateTripStatus(tripId, "completed");
    if (window.NE8_LOCATION) {
      window.NE8_LOCATION.stopLiveTracking();
    }
    return trip;
  }

  /**
   * Evaluates trip risk and checks if alternative route is advisable
   */
  function evaluateTripSafety(trip) {
    if (!trip || !window.NE8_RISK_ENGINE) {
      return {
        level: "LOW",
        levelClass: "safe",
        score: 88,
        evidence: ["Normal baseline freight corridor"],
        freshness: "Just now",
      };
    }

    // Check if any recent reports fall along this trip's corridor
    const allReports = window.NE8_DATA_STORE ? window.NE8_DATA_STORE.getRoadReports() : [];
    const tripReports = allReports.filter((r) => {
      const stateMatch = trip.destination.toLowerCase().includes(r.state.toLowerCase()) || trip.origin.toLowerCase().includes(r.state.toLowerCase());
      return stateMatch;
    });

    // Evaluate risk deterministically
    const riskResult = window.NE8_RISK_ENGINE.evaluateRouteRisk({
      weather: { warningColor: trip.riskLevel === "risk" ? "orange" : "yellow" },
      reports: tripReports,
      terrainType: trip.corridor.includes("Pass") || trip.corridor.includes("Ghat") ? "unstableGhatSection" : null,
      distanceKm: trip.distanceKm,
    });

    return riskResult;
  }

  window.NE8_TRIPS = {
    getDriverActiveTrip,
    startTrip,
    completeTrip,
    evaluateTripSafety,
  };
})(window);
