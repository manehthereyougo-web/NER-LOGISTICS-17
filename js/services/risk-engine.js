/**
 * NE8 Logistics Safety Platform — Deterministic Risk Engine
 * Independent, multi-factor risk assessment algorithm.
 * DOES NOT rely on LLM hallucinations for safety calculations.
 * Weights are fully configurable.
 */

(function (window) {
  "use strict";

  // Configurable Weights & Thresholds
  const DEFAULT_CONFIG = {
    // Score deductions (base score: 100)
    weatherWeights: {
      red: 45, // Heavy monsoonal cloudburst / blizzard
      orange: 25, // Moderate/Heavy rainfall warning
      yellow: 12, // Watch alert / localized showers
      green: 0, // Normal clear weather
    },
    reportFreshnessWeights: {
      under2Hours: 1.0, // 100% impact
      under6Hours: 0.75, // 75% impact
      under24Hours: 0.4, // 40% impact
      stale: 0.15, // >24h reduced impact
    },
    hazardCategoryDeductions: {
      flooding: 35,
      "road-damage": 30,
      obstruction: 25,
      landslide: 40,
      closure: 50,
      "poor-visibility": 15,
      traffic: 10,
      other: 10,
    },
    terrainPenalty: {
      highMountainPass: 20, // e.g. Sela Pass (13,700 ft)
      unstableGhatSection: 15, // e.g. Sonapur Tunnel, Phesama Ghat
      riverBasinCauseway: 10, // e.g. Barapani / Teesta River
    },
    // Risk Level Thresholds
    thresholds: {
      highRiskMaxScore: 49, // Score <= 49 -> HIGH
      mediumRiskMaxScore: 74, // Score 50..74 -> MEDIUM
      // Score >= 75 -> LOW
    },
  };

  let activeConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  function configureWeights(customWeights) {
    if (customWeights && typeof customWeights === "object") {
      activeConfig = Object.assign({}, activeConfig, customWeights);
    }
    return activeConfig;
  }

  function getFreshnessMultiplier(timestamp) {
    if (!timestamp) return activeConfig.reportFreshnessWeights.stale;
    const ageHours = (Date.now() - timestamp) / (1000 * 60 * 60);
    if (ageHours <= 2) return activeConfig.reportFreshnessWeights.under2Hours;
    if (ageHours <= 6) return activeConfig.reportFreshnessWeights.under6Hours;
    if (ageHours <= 24) return activeConfig.reportFreshnessWeights.under24Hours;
    return activeConfig.reportFreshnessWeights.stale;
  }

  function formatFreshnessText(timestamp) {
    if (!timestamp) return "No recent reports";
    const minutes = Math.round((Date.now() - timestamp) / 60000);
    if (minutes < 1) return "Just now (<1 min ago)";
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hrs ago`;
    return `${Math.round(hours / 24)} days ago`;
  }

  /**
   * Deterministic evaluation of a route or location context
   * @param {Object} context
   * @param {Object} [context.weather] - IMD weather object with warning color ('red', 'orange', 'yellow', 'green')
   * @param {Array}  [context.reports] - Nearby road condition reports
   * @param {string} [context.terrainType] - 'highMountainPass', 'unstableGhatSection', 'riverBasinCauseway'
   * @param {number} [context.distanceKm] - Route length
   */
  function evaluateRouteRisk(context = {}) {
    let score = 100;
    const evidence = [];
    let latestReportTime = null;

    // 1. Weather Factor (Source: Official IMD Telemetry)
    const wx = context.weather;
    if (wx) {
      const color = (wx.warningColor || wx.color || "").toLowerCase();
      const deduct = activeConfig.weatherWeights[color] || 0;
      if (deduct > 0) {
        score -= deduct;
        evidence.push(
          `IMD Weather Alert (${color.toUpperCase()}): ${wx.condition || wx.summary || "Severe weather potential"} (-${deduct} pts)`
        );
      }
    }

    // 2. Driver-Submitted Field Reports & Freshness
    const reports = Array.isArray(context.reports) ? context.reports : [];
    if (reports.length > 0) {
      reports.forEach((rep) => {
        const cat = (rep.category || rep.incident_type || "road-damage").toLowerCase();
        const baseDeduct = activeConfig.hazardCategoryDeductions[cat] || 15;
        const multiplier = getFreshnessMultiplier(rep.timestamp || rep.createdAt);
        const actualDeduct = Math.round(baseDeduct * multiplier);

        if (!latestReportTime || (rep.timestamp && rep.timestamp > latestReportTime)) {
          latestReportTime = rep.timestamp || rep.createdAt;
        }

        if (actualDeduct > 0) {
          score -= actualDeduct;
          const timeLabel = formatFreshnessText(rep.timestamp || rep.createdAt);
          evidence.push(
            `Recent Driver Report: ${rep.title || cat} reported ${timeLabel} (-${actualDeduct} pts)`
          );
        }
      });
    }

    // 3. Terrain & Elevation Hazard Factor
    const terrain = context.terrainType;
    if (terrain && activeConfig.terrainPenalty[terrain]) {
      const deduct = activeConfig.terrainPenalty[terrain];
      score -= deduct;
      const terrainLabels = {
        highMountainPass: "High-Altitude Mountain Pass (>12,000 ft, steep incline & freeze risk)",
        unstableGhatSection: "Unstable Ghat Section (Fractured soil & landslide prone slope)",
        riverBasinCauseway: "River Basin Causeway (Flash flood & erosion risk zone)",
      };
      evidence.push(`Corridor Terrain: ${terrainLabels[terrain] || terrain} (-${deduct} pts)`);
    }

    // Clamp score 0 to 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Determine deterministic risk level
    let level = "LOW";
    let levelClass = "safe";
    if (score <= activeConfig.thresholds.highRiskMaxScore) {
      level = "HIGH";
      levelClass = "risk";
    } else if (score <= activeConfig.thresholds.mediumRiskMaxScore) {
      level = "MEDIUM";
      levelClass = "caution";
    }

    if (evidence.length === 0) {
      evidence.push("Normal corridor travel conditions. No active severe alerts on file.");
    }

    return {
      score,
      level, // 'LOW' | 'MEDIUM' | 'HIGH'
      levelClass, // 'safe' | 'caution' | 'risk'
      evidence,
      freshness: formatFreshnessText(latestReportTime),
      evaluatedAt: Date.now(),
      isDeterministic: true,
    };
  }

  window.NE8_RISK_ENGINE = {
    evaluateRouteRisk,
    configureWeights,
    getActiveConfig: () => JSON.parse(JSON.stringify(activeConfig)),
    formatFreshnessText,
  };
})(window);
