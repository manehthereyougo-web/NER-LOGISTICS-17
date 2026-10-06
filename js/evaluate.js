const RISK_WORDS = [
  "landslide",
  "landslip",
  "rockfall",
  "flood",
  "washed",
  "fire",
  "blocked",
  "blockade",
  "bandh",
  "collapse",
  "ice",
  "snowed",
  "sinkhole",
  "accident",
  "crash",
  "debris",
  "impassable",
  "closed",
  "washed out",
  "bridge out",
];

const CAUTION_WORDS = [
  "mud",
  "fog",
  "wet",
  "slow",
  "pothole",
  "crack",
  "one lane",
  "narrow",
  "visibility",
  "construction",
  "rain",
];

const SAFE_WORDS = [
  "clear",
  "open",
  "passable",
  "dry",
  "good",
  "normal",
  "safe",
  "no debris",
  "fully open",
];

function scoreDescription(text) {
  const t = (text || "").toLowerCase();
  let score = 20;
  const reasons = [];
  RISK_WORDS.forEach((w) => {
    if (t.includes(w)) {
      score += 22;
      reasons.push(`Hazard language: “${w}”`);
    }
  });
  CAUTION_WORDS.forEach((w) => {
    if (t.includes(w)) {
      score += 9;
      reasons.push(`Caution language: “${w}”`);
    }
  });
  SAFE_WORDS.forEach((w) => {
    if (t.includes(w)) {
      score -= 14;
      reasons.push(`Clear-road language: “${w}”`);
    }
  });
  return { score, reasons };
}

function analyzePixels(imageEl) {
  // Uploaded disaster photos are supporting visual evidence only — NOT analyzed by AI
  return { score: 0, reasons: imageEl ? ["Disaster photo attached as verified supporting field evidence"] : [] };
}

function toLevel(score) {
  if (score >= 55) return "risk";
  if (score >= 28) return "caution";
  return "safe";
}

function evaluateReport({ description, imageEl, selectedHazards }) {
  const selected = selectedHazards || [];
  const detected = detectHazardIds(description);
  const hazardIds = [...new Set([...selected, ...detected])];
  const deductRows = hazardIds
    .map((id) => riskById(id))
    .filter(Boolean)
    .map((def) => ({ id: def.id, label: def.label, deduct: def.deduct }));
  const deductTotal = deductRows.reduce((sum, row) => sum + row.deduct, 0);
  const textPart = scoreDescription(description);
  // Uploaded photo serves purely as visual supporting evidence, not analyzed by AI heuristics
  const imagePart = analyzePixels(imageEl);
  const score = Math.max(0, Math.min(100, 10 + deductTotal + textPart.score * 0.35));
  const level = toLevel(score);
  const reasons = [
    ...deductRows.map((row) => `${row.label} deduction −${row.deduct}`),
    ...textPart.reasons,
    ...imagePart.reasons,
  ].slice(0, 8);
  if (!reasons.length) reasons.push("No listed hazard types in the field notes");
  return { score, level, reasons, hazards: hazardIds, deductRows };
}

function levelLabel(level) {
  if (level === "risk") return typeof t === "function" ? t("level_high_risk", "High risk — avoid if possible") : "High risk — avoid if possible";
  if (level === "caution") return typeof t === "function" ? t("level_caution", "Use with caution") : "Use with caution";
  return typeof t === "function" ? t("level_safe", "Good to use") : "Good to use";
}
