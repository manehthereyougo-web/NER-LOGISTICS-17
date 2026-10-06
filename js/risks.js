const RISK_DEDUCTIONS = [
  {
    id: "landslide",
    label: "Landslide",
    deduct: 28,
    radiusKm: 14,
    severe: true,
    keywords: ["landslide", "landslip", "rockfall", "mudslide"],
  },
  {
    id: "flood",
    label: "Flood",
    deduct: 30,
    radiusKm: 16,
    severe: true,
    keywords: ["flood", "flooded", "washed out", "inundat", "standing water"],
  },
  {
    id: "heavy-rain",
    label: "Heavy rainfall",
    deduct: 12,
    radiusKm: 20,
    severe: false,
    keywords: ["heavy rain", "rainfall", "downpour", "monsoon", "night rain"],
  },
  {
    id: "road-damage",
    label: "Road damage",
    deduct: 16,
    radiusKm: 10,
    severe: false,
    keywords: ["road damage", "pothole", "broken road", "crack", "sinkhole", "damaged"],
  },
  {
    id: "closure",
    label: "Road closure",
    deduct: 32,
    radiusKm: 12,
    severe: true,
    keywords: ["closed", "closure", "blocked", "blockade", "impassable", "bandh"],
  },
  {
    id: "accident",
    label: "Accident",
    deduct: 22,
    radiusKm: 8,
    severe: true,
    keywords: ["accident", "crash", "collision", "pile-up"],
  },
];

function detectHazardIds(text) {
  const t = (text || "").toLowerCase();
  return RISK_DEDUCTIONS.filter((r) => r.keywords.some((k) => t.includes(k))).map((r) => r.id);
}

function hazardIdsForIncident(item) {
  if (Array.isArray(item.hazards) && item.hazards.length) return item.hazards;
  return detectHazardIds(`${item.title || ""} ${item.description || ""}`);
}

function riskById(id) {
  return RISK_DEDUCTIONS.find((r) => r.id === id);
}

function collectRouteDeductions(path, incidents) {
  const seen = new Set();
  const rows = [];
  (incidents || []).forEach((item) => {
    if (typeof item.lat !== "number") return;
    const ids = hazardIdsForIncident(item);
    if (!ids.length) return;
    ids.forEach((id) => {
      const def = riskById(id);
      if (!def) return;
      const near = path.some((p) => {
        const lat = typeof p.lat === "function" ? p.lat() : p.lat;
        const lng = typeof p.lng === "function" ? p.lng() : p.lng;
        return haversineKm({ lat, lng }, item) < def.radiusKm;
      });
      if (!near) return;
      const key = `${id}:${item.id || item.title}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push({
        id,
        label: def.label,
        deduct: def.deduct,
        severe: def.severe,
        title: item.title || def.label,
        lat: item.lat,
        lng: item.lng,
      });
    });
  });
  return rows;
}

function totalDeduction(rows) {
  return rows.reduce((sum, row) => sum + row.deduct, 0);
}

function googleMapsLocationUrl(lat, lng, title) {
  const query = (typeof lat === "number" && typeof lng === "number")
    ? `${lat},${lng}`
    : `${lat}`;
  const titleParam = title ? ` (${title})` : "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + titleParam)}`;
}

function googleMapsDirectionsToUrl(lat, lng, label) {
  const dest = (typeof lat === "number" && typeof lng === "number")
    ? `${lat},${lng}`
    : `${lat}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
}

function googleMapsNavigateUrl(origin, destination, waypoints) {
  let originStr = "";
  if (typeof origin === "string") {
    originStr = origin;
  } else if (origin && typeof origin.lat === "function") {
    originStr = `${origin.lat()},${origin.lng()}`;
  } else if (origin && typeof origin.lat === "number") {
    originStr = `${origin.lat},${origin.lng}`;
  }

  let destStr = "";
  if (typeof destination === "string") {
    destStr = destination;
  } else if (destination && typeof destination.lat === "function") {
    destStr = `${destination.lat()},${destination.lng()}`;
  } else if (destination && typeof destination.lat === "number") {
    destStr = `${destination.lat},${destination.lng}`;
  }

  const params = new URLSearchParams({
    api: "1",
    origin: originStr,
    destination: destStr,
    travelmode: "driving",
    dir_action: "navigate",
  });
  if (waypoints && waypoints.length) {
    params.set(
      "waypoints",
      waypoints
        .map((w) =>
          typeof w.lat === "function" ? `${w.lat()},${w.lng()}` : `${w.lat},${w.lng}`
        )
        .join("|")
    );
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

