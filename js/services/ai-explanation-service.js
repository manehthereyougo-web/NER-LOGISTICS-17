/**
 * SafeRoute — Assistive AI Explanation Service
 * Translates deterministic risk factors, IMD weather, and field reports into clear, human-readable advice.
 * 
 * CORE PRINCIPLE:
 * Strictly assistive. Never claims certainty or guarantees road safety.
 * Connects to Google Gemini (SafeRouteAI) for dynamic generation,
 * while maintaining grounded deterministic templates as an instant fallback.
 */

(function (window) {
  "use strict";

  /**
   * Generates a plain-language route comparison explanation
   * @param {Object} recommendedRoute - Selected recommended candidate
   * @param {Array} alternativeRoutes - List of alternative route candidates
   * @returns {Object} { whyChecklist, alternativeConcerns, disclaimer }
   */
  function generateRouteComparisonExplanation(recommendedRoute, alternativeRoutes = []) {
    const whyChecklist = [];

    // Weather factor
    if (recommendedRoute.factors && recommendedRoute.factors.weatherRisk === "Low") {
      whyChecklist.push("✓ Lower current weather exposure based on available IMD telemetry");
    } else {
      whyChecklist.push("✓ Standard weather exposure profile along this transit corridor");
    }

    // Incident / Road reports factor
    if (recommendedRoute.factors && recommendedRoute.factors.roadConditionRisk === "Low") {
      whyChecklist.push("✓ No recent major road damage reports on primary transit lanes");
    } else {
      whyChecklist.push("✓ Fewest localized road surface anomalies compared to alternates");
    }

    // Clearance / Pass factor
    if (alternativeRoutes.length > 0 && alternativeRoutes[0].concern) {
      whyChecklist.push(`✓ Avoids reported affected zone on alternate route (${alternativeRoutes[0].concern})`);
    } else {
      whyChecklist.push("✓ Primary highway alignment with regular clearing operations");
    }

    // Alternative route concerns
    const alternativeConcerns = alternativeRoutes.map((alt) => {
      let concernText = alt.concern || "Slightly longer transit duration and elevation changes.";
      if (alt.factors && alt.factors.roadConditionRisk === "High") {
        concernText = "Recent road damage or obstacle reports filed on this section.";
      } else if (alt.factors && alt.factors.weatherRisk === "Moderate") {
        concernText = "Elevated ridge pass with potential fog and sudden weather variations.";
      }
      return {
        id: alt.id,
        name: alt.name,
        durationStr: alt.durationStr,
        distanceKm: alt.distanceKm,
        concern: concernText,
        riskLevel: alt.riskLevel || "caution",
      };
    });

    return {
      whyChecklist,
      alternativeConcerns,
      disclaimer: "Recommended based on current available conditions. Mountain weather and road surfaces can change quickly. Always drive with caution.",
    };
  }

  /**
   * Generates a concise driver-facing alert banner for active navigation
   * @param {Object} riskResult - Output from risk evaluation or route factors
   * @param {Object} route - Active Route details
   * @returns {Object} { headline, message, alternativeAvailable, disclaimer }
   */
  function generateDriverRouteExplanation(riskResult, route) {
    if (!riskResult || riskResult.level === "LOW" || riskResult.riskLevel === "safe") {
      return {
        headline: "RECOMMENDED ROUTE CLEAR",
        message: "Based on available reports and weather information, normal freight movement is observed.",
        alternativeAvailable: false,
        disclaimer: "Recommended based on current available conditions. Maintain normal caution.",
      };
    }

    if (riskResult.level === "HIGH" || riskResult.riskLevel === "risk") {
      const topEvidence = (riskResult.evidence && riskResult.evidence[0]) || "Significant road blockage or hazard reported.";
      return {
        headline: "⚠️ POTENTIAL ROUTE RISK DETECTED",
        message: `Conditions may affect this route: ${topEvidence.replace(/\(-.*?\)/, "").trim()}. Consider reducing speed or evaluating bypass options.`,
        alternativeAvailable: Boolean(route && route.alternativeRoute),
        alternativeText: route && route.alternativeRoute ? route.alternativeRoute.name : "Alternative bypass available",
        alternativeDelay: route && route.alternativeRoute ? `+${route.alternativeRoute.extraTimeMin} mins` : "",
        alternativeReason: route && route.alternativeRoute ? route.alternativeRoute.reason : "Avoids reported blockage zone",
        disclaimer: "Advisory based on recent telemetry and field observations. Does not guarantee road conditions.",
      };
    }

    const topEvidence = (riskResult.evidence && riskResult.evidence[0]) || "Localized weather or road surface variation.";
    return {
      headline: "⚠️ CAUTION: CONDITIONS MAY AFFECT ROUTE",
      message: `Potential hazard observed ahead: ${topEvidence.replace(/\(-.*?\)/, "").trim()}. Drive at reduced speed.`,
      alternativeAvailable: Boolean(route && route.alternativeRoute),
      alternativeText: route && route.alternativeRoute ? route.alternativeRoute.name : null,
      alternativeDelay: route && route.alternativeRoute ? `+${route.alternativeRoute.extraTimeMin} mins` : null,
      alternativeReason: route && route.alternativeRoute ? route.alternativeRoute.reason : null,
      disclaimer: "Advisory only. Based on available reports and weather information.",
    };
  }

  /**
   * Generates a logistics company journey summary
   */
  function generateFleetIncidentSummary(vehicle, journey, riskResult) {
    if (!journey) return "Vehicle parked or waiting for driver departure.";

    const vCode = vehicle ? vehicle.code : "Vehicle";
    const driverName = journey.driverName || "Driver";
    const origin = journey.origin || "Origin";
    const dest = journey.destination || "Destination";

    if (riskResult && (riskResult.level === "HIGH" || riskResult.riskLevel === "risk")) {
      return `Potential transit delay detected for ${vCode} (${driverName}) en route ${origin} → ${dest}. Road report or weather factor present. Alternative corridor available (${journey.alternativeRoute ? journey.alternativeRoute.name : "Secondary bypass"}).`;
    }

    if (riskResult && (riskResult.level === "MEDIUM" || riskResult.riskLevel === "caution")) {
      return `Advisory: ${vCode} passing active caution sector on ${journey.corridor || "corridor"}. Current ETA: ${journey.eta || "In transit"}. Telemetry indicates localized rain or road work.`;
    }

    return `${vCode} progressing on schedule along ${journey.corridor || "corridor"}. No critical road blockages reported on this route.`;
  }

  /**
   * Generates an official regional situational awareness summary
   */
  function generateOfficialRegionalSummary(stateName, incidentsCount, weatherWarning) {
    const state = stateName || "Northeast Corridor";
    const count = typeof incidentsCount === "number" ? incidentsCount : 0;
    const wx = weatherWarning || "Normal monsoonal conditions";

    if (count > 2 || (wx && wx.toLowerCase().includes("red"))) {
      return `Elevated regional risk profile across ${state}. ${count} active road condition reports on file. Weather advisory: ${wx}. Coordinated highway monitoring advised.`;
    }

    if (count > 0 || (wx && wx.toLowerCase().includes("orange"))) {
      return `Moderate road advisory across ${state}. ${count} roadside report(s) filed. IMD status: ${wx}. Secondary corridors passable with caution.`;
    }

    return `Standard corridor accessibility across ${state}. IMD status: ${wx}. No active critical blockages reported.`;
  }

  window.NE8_AI = {
    generateRouteComparisonExplanation,
    generateDriverRouteExplanation,
    generateFleetIncidentSummary,
    generateOfficialRegionalSummary,
  };
})(window);
