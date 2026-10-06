function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreBand(score) {
  if (score >= 75) return { key: "safe", label: typeof t === "function" ? t("band_high", "High accessibility") : "High accessibility" };
  if (score >= 50) return { key: "caution", label: typeof t === "function" ? t("band_limited", "Limited accessibility") : "Limited accessibility" };
  return { key: "risk", label: typeof t === "function" ? t("band_poor", "Poor accessibility") : "Poor accessibility" };
}

function accessibilityScore(route, incidents) {
  const notes = [];
  let continuity = 82;
  let terrain = 78;
  let hazards = 88;
  let network = 86;

  const legs = route.legs || [];
  const km = legs.reduce((s, l) => s + l.distance.value, 0) / 1000;
  const hours = legs.reduce((s, l) => s + l.duration.value, 0) / 3600;
  const speed = hours ? km / hours : 0;
  const steps = legs.reduce((s, l) => s + (l.steps || []).length, 0);
  const text = legs
    .flatMap((l) => l.steps || [])
    .map((s) => s.instructions || "")
    .join(" ")
    .toLowerCase();

  if (speed < 22) {
    terrain -= 32;
    notes.push("Average speed is very low for a freight run — steep ghats or closures are likely.");
  } else if (speed < 35) {
    terrain -= 16;
    notes.push("Below highway speed. Expect hill grades, towns, or narrow two-lane stretches.");
  } else {
    notes.push("Average speed is workable for Northeast highways.");
  }

  if (steps > 45) {
    continuity -= 18;
    notes.push("Many turns — the line is fragmented through towns and local roads.");
  } else if (steps > 25) {
    continuity -= 8;
  }

  if (/nh-?\d|asian highway|ah-?1|ah-?2/.test(text)) {
    continuity += 8;
    network += 6;
    notes.push("National Highway / Asian Highway is on this line.");
  }

  if (/ferry/.test(text)) {
    network -= 22;
    notes.push("A ferry crossing sits on this run.");
  }

  (route.warnings || []).forEach((w) => {
    continuity -= 8;
    notes.push(w);
  });

  const path = route.overview_path || [];
  const deductions = collectRouteDeductions(path, incidents);
  const deducted = totalDeduction(deductions);
  hazards -= deducted;
  deductions.forEach((row) => {
    notes.push(`${row.label} −${row.deduct}: ${row.title}`);
  });
  if (!deductions.length) {
    notes.push("No landslide, flood, rainfall, damage, closure, or accident reports sit on this line.");
  }

  const hour = new Date().getHours();
  if (hour < 5 || hour > 20) {
    terrain -= 8;
    notes.push("Night hours in the hills reduce sight distance and raise landslide risk.");
  }

  continuity = clamp(continuity, 0, 100);
  terrain = clamp(terrain, 0, 100);
  hazards = clamp(hazards, 0, 100);
  network = clamp(network, 0, 100);

  const overall = Math.round(continuity * 0.3 + terrain * 0.3 + hazards * 0.25 + network * 0.15);
  const band = scoreBand(overall);
  return {
    overall,
    continuity,
    terrain,
    hazards,
    network,
    notes: notes.slice(0, 8),
    band,
    km,
    minutes: hours * 60,
    deductions,
    deducted,
  };
}

function renderScore(el, score, extras) {
  if (!el || !score) return;
  el.classList.remove("hidden");
  const openHazardText = typeof t === "function" ? t("open_hazard_gmaps", "📍 Open hazard in Google Maps") : "📍 Open hazard in Google Maps";
  const deductionRows = (score.deductions || [])
    .map((row) => {
      const rowMapUrl = googleMapsLocationUrl(row.lat, row.lng, row.title);
      return `<li class="deduct-item">
        <div class="deduct-info">
          <span class="deduct-title">${row.label} · ${row.title}</span>
          <a class="deduct-gmap-link" href="${rowMapUrl}" target="_blank" rel="noopener">${openHazardText}</a>
        </div>
        <strong class="deduct-val">−${row.deduct}</strong>
      </li>`;
    })
    .join("");
  const extraHtml = extras || "";
  const titleDeducts = typeof t === "function" ? t("risk_deductions_title", "Risk deductions") : "Risk deductions";
  const noHazards = typeof t === "function" ? t("no_hazards_listed", "No listed hazards on this line.") : "No listed hazards on this line.";
  const totalDeductText = typeof t === "function" ? t("total_deducted", "Total deducted from hazards") : "Total deducted from hazards";
  
  const labelContinuity = typeof t === "function" ? t("bar_continuity", "Continuity") : "Continuity";
  const labelTerrain = typeof t === "function" ? t("bar_terrain", "Terrain") : "Terrain";
  const labelHazards = typeof t === "function" ? t("bar_hazards", "Hazards") : "Hazards";
  const labelNetwork = typeof t === "function" ? t("bar_network", "Network") : "Network";

  el.innerHTML = `
    <div class="score-box">
      <div class="score-number">
        <b>${score.overall}</b>
        <span>${score.band.label}</span>
      </div>
      <div class="bars">
        ${bar(labelContinuity, score.continuity)}
        ${bar(labelTerrain, score.terrain)}
        ${bar(labelHazards, score.hazards)}
        ${bar(labelNetwork, score.network)}
      </div>
    </div>
    <div class="deduct-box">
      <h3>${titleDeducts}</h3>
      ${
        deductionRows
          ? `<ul class="deduct-list">${deductionRows}</ul><p class="deduct-total">${totalDeductText}: −${score.deducted}</p>`
          : `<p>${noHazards}</p>`
      }
    </div>
    <p class="score-notes">${score.notes.join(" ")}</p>
    <p class="score-meta">${score.km.toFixed(0)} km · about ${Math.round(score.minutes)} min</p>
    ${extraHtml}
  `;
}

function bar(label, value) {
  return `<div class="bar-row"><span>${label}</span><div class="bar-track"><div class="bar-fill" style="width:${value}%"></div></div><span>${value}</span></div>`;
}
