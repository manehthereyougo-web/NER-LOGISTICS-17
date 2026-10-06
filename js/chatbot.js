// Upgraded Multi-Lingual Local AI Assistant for NE8 Corridor

const CHAT_INTENTS = {
  GREETING: ["hello", "hi", "hey", "namaste", "pranam", "help", "assistant", "नमस्ते", "हेलो", "হ্যালো", "নমস্কাৰ", "সাহায্য", "সহায়"],
  EMERGENCY: ["emergency", "sos", "police", "helpline", "accident", "hospital", "trapped", "helpdesk", "आपातकालीन", "हेल्पलाइन", "दुर्घटना", "জৰুৰীকালীন", "জরুরি", "দুর্ঘটনা"],
  SONAPUR: ["sonapur", "jaintia", "nh-6", "nh6", "barapani", "shillong highway", "सोनापुर", "সোণাপুৰ", "সোনাপুর"],
  SELA: ["sela", "sela pass", "tawang", "nh-13", "snow", "ice", "arunachal pass", "सेला", "চেলা", "সেলা"],
  IMPHAL: ["imphal", "jiribam", "nh-37", "nh37", "manipur road", "sinkhole", "इम्फाल", "ইম্ফল", "ইমফল"],
  GANGTOK: ["gangtok", "rangpo", "sikkim", "nh-10", "nh10", "teesta", "गंगटोक", "গ্যাংটক", "গ্যাংটক"],
  GUWAHATI: ["guwahati", "dibrugarh", "nh-27", "nh27", "assam trunk", "गुवाहाटी", "গুৱাহাটী", "গুয়াহাটি"],
  KOHIMA: ["kohima", "dimapur", "nagaland", "nh-2", "nh2", "कोहिमा", "কহিমা", "কোহিমা"],
  SAFETY: ["safe", "safest", "danger", "worst", "risk", "landslide", "avoid", "caution", "सुरक्षा", "खतरा", "বিপদ", "ঝুঁকি", "সুৰক্ষা"],
  WEATHER: ["weather", "rain", "temperature", "forecast", "climate", "storm", "fog", "मौसम", "बारिश", "বতৰ", "বৰষুণ", "আবহাওয়া", "বৃষ্টি"],
  ROUTE_HELP: ["route", "plot", "navigate", "directions", "how to map", "gmaps", "मार्ग", "दिशा", "পথ", "ৰুট", "রুট"],
  PHOTO_HELP: ["photo", "upload", "report", "picture", "camera", "disaster photo", "फोटो", "तस्वीर", "ছবি", "ফটো", "চিত্র"],
};

const NE_CITIES_DATA = [
  { name: "Guwahati", state: "Assam" },
  { name: "Shillong", state: "Meghalaya" },
  { name: "Itanagar", state: "Arunachal Pradesh" },
  { name: "Tawang", state: "Arunachal Pradesh" },
  { name: "Imphal", state: "Manipur" },
  { name: "Gangtok", state: "Sikkim" },
  { name: "Agartala", state: "Tripura" },
  { name: "Kohima", state: "Nagaland" },
  { name: "Dimapur", state: "Nagaland" },
  { name: "Aizawl", state: "Mizoram" },
  { name: "Silchar", state: "Assam" },
  { name: "Dibrugarh", state: "Assam" },
  { name: "Tezpur", state: "Assam" },
  { name: "Jorhat", state: "Assam" },
  { name: "Jiribam", state: "Manipur" },
  { name: "Rangpo", state: "Sikkim" },
  { name: "Sonapur", state: "Meghalaya" },
  { name: "Cherrapunji", state: "Meghalaya" },
  { name: "Barapani", state: "Meghalaya" }
];
window.NE_CITIES = NE_CITIES_DATA;
window.NL_CITIES = NE_CITIES_DATA;

function queryLiveIncidents() {
  if (typeof loadIncidents !== "function") return { count: 0, highRisks: 0, recent: [] };
  const incidents = loadIncidents();
  const highRisks = incidents.filter((i) => i.level === "risk").length;
  return {
    count: incidents.length,
    highRisks,
    recent: incidents,
  };
}

function renderDashboardAiRouteEvaluation(ai) {
  let container = document.getElementById("ai-eval-box");
  if (!container) {
    const planner = document.getElementById("ai-route-planner");
    if (planner) {
      container = document.createElement("div");
      container.id = "ai-eval-box";
      container.className = "ai-eval-report";
      container.style.marginTop = "16px";
      planner.appendChild(container);
    }
  }
  if (!container || !ai) return;

  container.classList.remove("hidden");
  const origStatusText = ai.detourActive
    ? `⚠️ Blocked / High Hazard Zone on Direct Pass`
    : `✅ Normal / Open Mountain Pass Conditions`;
  const safetyVerdictText = ai.score >= 70 ? `SAFE (via AI Detour Reroute)` : `UNSAFE / CAUTION REQUIRED`;
  const altRouteText = ai.detourActive ? ai.detourMessage : `Direct Mountain Highway (${ai.origin} ➔ ${ai.destination})`;
  const estTimeText = `${Math.floor(ai.estMins / 60)}h ${ai.estMins % 60}m (${ai.estMins} mins)`;
  const rerouteReasonText = ai.riskFactors && ai.riskFactors.length ? ai.riskFactors[0] : `Mountain pass clear of active blockades.`;

  container.innerHTML = `
    <div class="ai-eval-header">
      <strong style="color:var(--accent); font-size:13px;">🤖 LOCAL AI SAFE ROUTE EVALUATION</strong>
      <span class="ai-eval-badge ${ai.bandClass}">${ai.score}/100 SCORE</span>
    </div>

    <div class="ai-eval-fields-grid" style="display:grid; grid-template-columns: 1fr; gap: 8px; margin: 10px 0; font-size: 12px;">
      <div style="background:rgba(15,23,42,0.6); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
        <strong style="color:#94a3b8;">1. Route Status:</strong>
        <span style="color:#e2e8f0; margin-left:6px;">${origStatusText}</span>
      </div>
      <div style="background:rgba(15,23,42,0.6); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
        <strong style="color:#94a3b8;">2. Safety Verdict (Safe/Unsafe):</strong>
        <span style="color:${ai.score >= 70 ? '#34d399' : '#f87171'}; font-weight:700; margin-left:6px;">${safetyVerdictText}</span>
      </div>
      <div style="background:rgba(15,23,42,0.6); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
        <strong style="color:#94a3b8;">3. Suggested Alternative Route:</strong>
        <span style="color:#38bdf8; font-weight:600; margin-left:6px;">${altRouteText}</span>
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="background:rgba(15,23,42,0.6); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
          <strong style="color:#94a3b8;">4. Estimated Distance:</strong>
          <span style="color:#e2e8f0; font-weight:600; margin-left:6px;">${ai.distanceKm} km</span>
        </div>
        <div style="background:rgba(15,23,42,0.6); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
          <strong style="color:#94a3b8;">5. Estimated Travel Time:</strong>
          <span style="color:#e2e8f0; font-weight:600; margin-left:6px;">${estTimeText}</span>
        </div>
      </div>
      <div style="background:rgba(15,23,42,0.6); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
        <strong style="color:#94a3b8;">6. Reason for Rerouting:</strong>
        <span style="color:#fbbf24; margin-left:6px;">${rerouteReasonText}</span>
      </div>
    </div>

    <div style="margin-bottom:10px;">
      ${ai.riskFactors.map((r) => `<span class="ai-risk-tag">⚠️ ${r}</span>`).join("")}
    </div>
  `;
}

// Global AI helper to plot route directly on map from Chatbot or external cards
window.triggerAIRoutePlot = function (origin, destination, incident, incidentDesc, incidentType) {
  const origInputs = [
    document.getElementById("origin"),
    document.getElementById("ai-orig-quick"),
    document.getElementById("dash-origin"),
  ];
  const destInputs = [
    document.getElementById("destination"),
    document.getElementById("ai-dest-quick"),
    document.getElementById("dash-dest"),
  ];
  const incInputs = [
    document.getElementById("incident-location"),
    document.getElementById("ai-incident-quick"),
  ];
  const incDescInput = document.getElementById("incident-desc");
  const incTypeInput = document.getElementById("incident-type");

  let rawOrig = origin;
  let rawDest = destination;
  let rawInc = incident;

  if (!rawOrig || typeof rawOrig !== "string") {
    const foundOrig = origInputs.find((el) => el && el.value.trim());
    rawOrig = foundOrig ? foundOrig.value.trim() : "Guwahati, Assam";
  }
  if (!rawDest || typeof rawDest !== "string") {
    const foundDest = destInputs.find((el) => el && el.value.trim());
    rawDest = foundDest ? foundDest.value.trim() : "";
  }
  if (!rawInc || typeof rawInc !== "string") {
    const foundInc = incInputs.find((el) => el && el.value.trim());
    rawInc = foundInc ? foundInc.value.trim() : "Barapani, Meghalaya";
  }

  // Show clear message if no destination entered
  if (!rawDest) {
    const status = document.getElementById("map-status");
    if (status) {
      status.style.color = "#ef4444";
      status.textContent = "⚠️ Please enter a destination to calculate a safe route.";
    }
    const scoreEl = document.getElementById("route-score");
    if (scoreEl) {
      scoreEl.classList.remove("hidden");
      scoreEl.innerHTML = `<div style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#f87171; padding:10px 14px; border-radius:8px; font-size:13px; font-weight:600;">⚠️ Validation Error: Please enter a destination to calculate a safe route.</div>`;
    }
    alert("Please enter a destination to calculate a safe route.");
    return;
  }

  origInputs.forEach((el) => {
    if (el) el.value = rawOrig;
  });
  destInputs.forEach((el) => {
    if (el) el.value = rawDest;
  });
  incInputs.forEach((el) => {
    if (el) el.value = rawInc;
  });
  if (incDescInput && incidentDesc) {
    incDescInput.value = incidentDesc;
  }
  if (incTypeInput && incidentType) {
    let matched = false;
    for (let i = 0; i < incTypeInput.options.length; i++) {
      if (incTypeInput.options[i].value.toLowerCase() === incidentType.toLowerCase() ||
          incTypeInput.options[i].text.toLowerCase().includes(incidentType.toLowerCase())) {
        incTypeInput.selectedIndex = i;
        matched = true;
        break;
      }
    }
    if (!matched) {
      try { incTypeInput.value = incidentType; } catch (e) {}
    }
  }

  if (typeof plotRoute === "function") {
    plotRoute();
  } else if (window.NE8AiRouteEngine) {
    const aiReport = window.NE8AiRouteEngine.generateSafeRoute(rawOrig, rawDest, rawInc);
    renderDashboardAiRouteEvaluation(aiReport);
  }

  const mapSection = document.getElementById("map") || document.getElementById("ai-route-planner");
  if (mapSection) {
    mapSection.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};
window.triggerAiRoutePlot = window.triggerAIRoutePlot;

window.openAIChatbotWithQuery = function (query) {
  if (typeof initChatbotUI === "function" && !document.getElementById("chatbot-widget")) {
    initChatbotUI();
  }
  const win = document.getElementById("chatbot-window");
  const input = document.getElementById("chatbot-input");
  const form = document.getElementById("chatbot-form");
  if (win && win.classList.contains("hidden")) {
    win.classList.remove("hidden");
  }
  if (input) {
    const rawQuery = (typeof query === "string" ? query : "").trim();
    const cleanQuery = rawQuery.replace(/^to\s+route$/i, "").replace(/^\s*to\s*/i, "").trim();
    if (cleanQuery && cleanQuery !== "to route" && !cleanQuery.startsWith("to ")) {
      input.value = cleanQuery;
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    } else {
      input.value = "";
    }
    setTimeout(() => {
      input.focus();
    }, 100);
  }
};
window.openAiChatbotWithQuery = window.openAIChatbotWithQuery;
window.openAIChatbot = window.openAIChatbotWithQuery;
window.openAiChatbot = window.openAIChatbotWithQuery;

function parseRouteQuery(msg) {
  const cleanMsg = msg.toLowerCase();
  let origin = null;
  let destination = null;

  // Direct regex matches: "from X to Y", "X to Y", "between X and Y", "X -> Y"
  const regexes = [
    /(?:from|to|between)?\s*([a-zA-Z\s,]+)\s+(?:to|and|->|➔)\s+([a-zA-Z\s,]+)/i,
    /([a-zA-Z\s,]+)\s+route\s+to\s+([a-zA-Z\s,]+)/i
  ];

  for (const r of regexes) {
    const match = msg.match(r);
    if (match && match[1] && match[2]) {
      const p1 = match[1].trim();
      const p2 = match[2].trim();
      if (p1.length > 2 && p2.length > 2 && p1.toLowerCase() !== p2.toLowerCase()) {
        origin = p1;
        destination = p2;
        break;
      }
    }
  }

  // Fallback: Search for known cities in message
  if (!origin || !destination) {
    const foundCities = NE_CITIES_DATA.filter((c) => cleanMsg.includes(c.name.toLowerCase()));
    if (foundCities.length >= 2) {
      origin = foundCities[0].name;
      destination = foundCities[1].name;
    } else if (foundCities.length === 1) {
      const foundState = window.NE_STATES ? NE_STATES.find((s) => cleanMsg.includes(s.name.toLowerCase())) : null;
      if (foundState) {
        origin = foundCities[0].name;
        destination = foundState.capital;
      }
    }
  }

  if (origin && destination && origin.toLowerCase() !== destination.toLowerCase()) {
    return { origin, destination };
  }
  return null;
}

function getEmergencyResponse(lang) {
  if (lang === "ta") {
    return {
      text: `🚨 **வடகிழக்கு நெடுஞ்சாலை 24x7 அவசர உதவி எண்கள்**:\n\n• **BRO எல்லை சாலை கட்டுப்பாட்டு அறை**: 📞 1800-11-2026\n• **வடகிழக்கு பேரிடர் மேலாண்மை மையம்**: 📞 1070\n• **நெடுஞ்சாலை காவல் & அவசர உதவி**: 📞 112\n• **மருத்துவ ஆம்புலன்ஸ்**: 📞 108\n• **NE8 சரக்கு கட்டுப்பாட்டு மையம்**: 📞 +91-361-2237000\n\nநிலச்சரிவு அல்லது வெள்ளத்தில் சிக்கினால், உடனடியாக வாகனத்தை நிறுத்தி இந்த எண்களைத் தொடர்பு கொள்ளவும்!`,
      actionHtml: `<div class="chat-card"><div class="chat-card-header">🚨 அவசர நேரடி அழைப்பு</div><a class="btn btn-primary btn-sm" href="tel:112">📞 112 அழைக்கவும்</a></div>`
    };
  } else if (lang === "ne") {
    return {
      text: `🚨 **पूर्वोत्तर राजमार्ग २४x७ आपतकालीन हेल्पलाइन**:\n\n• **सीमा सडक संगठन (BRO) नियन्त्रण कक्ष**: 📞 1800-11-2026\n• **पूर्वोत्तर विपद् व्यवस्थापन नियन्त्रण कक्ष**: 📞 1070\n• **राजमार्ग प्रहरी तथा आपतकालीन सेवा**: 📞 112\n• **चिकित्सा एम्बुलेन्स**: 📞 108\n• **NE8 फ्रेट नियन्त्रण डेस्क**: 📞 +91-361-2237000\n\nपहिरो वा खराब मौसममा फस्नुभएमा सवारी रोकेर तुरुन्त सम्पर्क गर्नुहोस्!`,
      actionHtml: `<div class="chat-card"><div class="chat-card-header">🚨 आपतकालीन द्रुत कल</div><a class="btn btn-primary btn-sm" href="tel:112">📞 112 डायल गर्नुहोस्</a></div>`
    };
  } else if (lang === "hi") {
    return {
      text: `🚨 **पूर्वोत्तर राजमार्ग 24x7 आपातकालीन हेल्पलाइन**:\n\n• **सीमा सड़क संगठन (BRO) कंट्रोल रूम**: 📞 1800-11-2026\n• **पूर्वोत्तर आपदा प्रबंधन नियंत्रण कक्ष**: 📞 1070\n• **राजमार्ग पुलिस एवं आपातकालीन**: 📞 112\n• **चिकित्सा एम्बुलेंस**: 📞 108\n• **NE8 फ्रेट कंट्रोल डेस्क**: 📞 +91-361-2237000\n\nयदि आप भूस्खलन या खराब मौसम में फंसे हैं, तो वाहन रोककर तुरंत इन नंबरों पर संपर्क करें!`,
      actionHtml: `<div class="chat-card"><div class="chat-card-header">🚨 आपातकालीन त्वरित कॉल</div><a class="btn btn-primary btn-sm" href="tel:112">📞 112 डायल करें</a></div>`
    };
  } else if (lang === "as") {
    return {
      text: `🚨 **উত্তৰ-পূৰ্ব ৰাষ্ট্ৰীয় ঘাইপথ জৰুৰীকালীন সাহায্য নম্বৰ**:\n\n• **সীমা পথ সংস্থা (BRO) নিয়ন্ত্ৰণ কক্ষ**: 📞 1800-11-2026\n• **দুৰ্যোগ ব্যৱস্থাপনা নিয়ন্ত্ৰণ কক্ষ**: 📞 1070\n• **ঘাইপথ আৰক্ষী আৰু জৰুৰীকালীন সেৱা**: 📞 112\n• **চিকিৎসা এম্বুলেন্স**: 📞 108\n• **NE8 ফ্ৰেইট নিয়ন্ত্ৰণ কক্ষ**: 📞 +91-361-2237000`,
      actionHtml: `<div class="chat-card"><div class="chat-card-header">🚨 জৰুৰীকালীন কল</div><a class="btn btn-primary btn-sm" href="tel:112">📞 112 ডায়েল কৰক</a></div>`
    };
  } else if (lang === "bn") {
    return {
      text: `🚨 **উত্তর-পূর্ব মহাসড়ক ২৪x৭ জরুরি হেল্পলাইন**:\n\n• **সীমান্ত সড়ক সংস্থা (BRO) নিয়ন্ত্রণ কক্ষ**: 📞 1800-11-2026\n• **দুর্যোগ ব্যবস্থাপনা নিয়ন্ত্রণ কক্ষ**: 📞 1070\n• **হাইওয়ে পুলিশ ও জরুরি সেবা**: 📞 112\n• **মেডিকেল অ্যাম্বুলেন্স**: 📞 108\n• **NE8 ফ্রেইট নিয়ন্ত্রণ ডেস্ক**: 📞 +91-361-2237000`,
      actionHtml: `<div class="chat-card"><div class="chat-card-header">🚨 জরুরি কল</div><a class="btn btn-primary btn-sm" href="tel:112">📞 112 ডায়াল করুন</a></div>`
    };
  } else {
    return {
      text: `🚨 **Northeast Highway 24x7 Emergency Helplines**:\n\n• **BRO Hill Control Room**: 📞 1800-11-2026\n• **NE Disaster Control Room**: 📞 1070\n• **Highway Patrol & Emergency**: 📞 112\n• **Medical Ambulance**: 📞 108\n• **NE8 Freight Dispatch Helpdesk**: 📞 +91-361-2237000\n\nIf you are stuck in a landslide or flash flood zone, park safely and call immediately!`,
      actionHtml: `<div class="chat-card"><div class="chat-card-header">🚨 Emergency Direct Call</div><a class="btn btn-primary btn-sm" href="tel:112">📞 Call 112 Emergency</a></div>`
    };
  }
}

function getPhotoResponse(lang) {
  const live = queryLiveIncidents();
  if (live.recent && live.recent.length > 0) {
    const item = live.recent[0];
    let msgText = "";
    if (lang === "ta") {
      msgText = `📸 **சமீபத்திய பேரிடர் அறிக்கை**: ${item.title || "சாலை சேத அறிக்கை"}\n• **இடம்**: ${item.location || item.state || "வடகிழக்கு நெடுஞ்சாலை"}\n• **ஆபத்து நிலை**: ${item.level === "risk" ? "உயர் ஆபத்து" : "எச்சரிக்கை"}\n• **விவரம்**: ${item.description || "ஓட்டுநரால் சமர்ப்பிக்கப்பட்ட கள அறிக்கை."}`;
    } else if (lang === "ne") {
      msgText = `📸 **पछिल्लो फिल्ड विपद् तस्बिर**: ${item.title || "सडक क्षति रिपोर्ट"}\n• **स्थान**: ${item.location || item.state || "पूर्वोत्तर राजमार्ग"}\n• **जोखिम स्तर**: ${item.level === "risk" ? "उच्च जोखिम" : "सावधानी"}\n• **रिपोर्ट**: ${item.description || "फिल्ड रिपोर्ट संकलित"}`;
    } else if (lang === "hi") {
      msgText = `📸 **नवीनतम आपदा रिपोर्ट**: ${item.title || "सड़क क्षति रिपोर्ट"}\n• **स्थान**: ${item.location || item.state || "पूर्वोत्तर"}\n• **जोखिम स्तर**: ${item.level === "risk" ? "उच्च जोखिम" : "सावधानी"}\n• **विवरण**: ${item.description || "फील्ड रिपोर्ट संकलित"}`;
    } else if (lang === "as") {
      msgText = `📸 **শেহতীয়া দুৰ্যোগ ৰিপৰ্ট**: ${item.title || "পথৰ ক্ষতিৰ ৰিপৰ্ট"}\n• **স্থান**: ${item.location || item.state || "উত্তৰ-পূৰ্ব"}\n• **বিপদৰ মাত্ৰা**: ${item.level === "risk" ? "উচ্চ বিপদ" : "সাৱধানতা"}`;
    } else if (lang === "bn") {
      msgText = `📸 **সাম্প্রতিক দুর্যোগ রিপোর্ট**: ${item.title || "রাস্তার ক্ষতির রিপোর্ট"}\n• **স্থান**: ${item.location || item.state || "উত্তর-পূর্ব"}\n• **ঝুঁকির মাত্রা**: ${item.level === "risk" ? "উচ্চ ঝুঁকি" : "সতর্কতা"}`;
    } else {
      msgText = `📸 **Latest Field Hazard Photo**: ${item.title || "Road Damage Report"}\n• **Location**: ${item.location || item.state || "Northeast Highway"}\n• **Severity**: ${item.level === "risk" ? "HIGH RISK" : "CAUTION"}\n• **Report**: ${item.description || "Field report filed by driver."}`;
    }

    const photoUrl = item.photo || (window.LIVE_PHOTOS ? window.LIVE_PHOTOS.sample1 : "");
    const actionHtml = `
      <div class="chat-card">
        <div class="chat-card-header">🖼️ Verified Field Photo Preview</div>
        ${photoUrl ? `<img src="${photoUrl}" alt="Hazard preview" class="chat-photo-preview" onclick="window.triggerChatbotPhotoModal(0)" title="Click for full-screen photo dialog" />` : ""}
        <div style="display:flex; gap:6px; margin-top:6px;">
          <button class="btn btn-primary btn-sm" onclick="window.triggerChatbotPhotoModal(0)">🔍 Open Photo Viewer Modal</button>
          <a class="btn btn-secondary btn-sm" href="incidents.html">📸 Disaster Gallery</a>
        </div>
      </div>
    `;
    return { text: msgText, actionHtml };
  } else {
    return {
      text: `📸 Currently no disaster photos recorded in memory. You can upload roadside disaster photos on the Disaster Photos page!`,
      actionHtml: `<div style="margin-top:8px;"><a class="btn btn-primary btn-sm" href="incidents.html">📸 Go to Disaster Photos</a></div>`
    };
  }
}

function getLocalAiResponse(userMessage) {
  const msg = userMessage.toLowerCase().trim();
  const lang = typeof getCurrentLanguage === "function" ? getCurrentLanguage() : "en";
  const liveIncidents = queryLiveIncidents();

  // 0. Check Emergency Intent
  if (CHAT_INTENTS.EMERGENCY.some((k) => msg.includes(k))) {
    return getEmergencyResponse(lang);
  }

  // 1. Check Route Parsing
  const parsedRoute = parseRouteQuery(msg);
  if (parsedRoute) {
    const { origin, destination } = parsedRoute;
    const gmapsDirUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    
    let aiReport = window.NE8AiRouteEngine ? window.NE8AiRouteEngine.generateSafeRoute(origin, destination) : null;
    let score = aiReport ? aiReport.score : 88;
    let distKm = aiReport ? aiReport.distanceKm : 100;
    let windowText = aiReport ? aiReport.recommendedWindow : "06:00 - 16:00 Daylight Driving";
    let riskNotes = aiReport && aiReport.riskFactors.length ? aiReport.riskFactors[0] : "Mountain pass clear";

    let text = "";
    if (lang === "hi") {
      text = `🗺️ **AI सुरक्षित मार्ग विश्लेषण**: ${origin} ➔ ${destination}\n• **दूरी**: ~${distKm} किमी | **AI सुरक्षा स्कोर**: ${score}/100\n• **सर्वोत्तम यात्रा समय**: ${windowText}\n• **लाइव AI जांच**: ${riskNotes}\n• **सलाह**: मोड़ पर धीमी गति रखें और फॉग लाइट चालू रखें।`;
    } else if (lang === "as") {
      text = `🗺️ **AI সুৰক্ষিত পথ বিশ্লেষণ**: ${origin} ➔ ${destination}\n• **দূৰত্ব**: ~${distKm} কিমি | **AI স্ক’ৰ**: ${score}/100\n• **যাত্ৰাৰ সময়**: ${windowText}\n• **পৰামৰ্শ**: সাৱধানে গাড়ী চলাওক।`;
    } else if (lang === "bn") {
      text = `🗺️ **AI নিরাপদ রুট বিশ্লেষণ**: ${origin} ➔ ${destination}\n• **দূরত্ব**: ~${distKm} কিমি | **AI স্কোর**: ${score}/100\n• **যাত্রার সময়**: ${windowText}\n• **পরামর্শ**: সতর্কতার সাথে গাড়ি চালান।`;
    } else {
      text = `🗺️ **AI Safe Route Analysis**: ${origin} ➔ ${destination}\n• **Distance**: ~${distKm} km | **AI Safety Score**: ${score}/100\n• **Recommended Travel Window**: ${windowText}\n• **AI Hazard Check**: ${riskNotes}\n• **Advisory**: Maintain low gear on steep descents. Use fog lights in mountain pass zones.`;
    }

    const actionHtml = `
      <div class="chat-card">
        <div class="chat-card-header">📍 Google Maps GPS Navigation & Live Plot</div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
          <button class="btn btn-primary btn-sm" onclick="window.triggerAiRoutePlot('${origin}', '${destination}')">🗺️ Plot Safe Route on Map</button>
          <a class="btn btn-google btn-sm" href="${gmapsDirUrl}" target="_blank" rel="noopener">📍 Google Maps GPS Nav</a>
        </div>
      </div>
    `;
    return { text, actionHtml };
  }

  // 2. Check Photo Intent
  if (CHAT_INTENTS.PHOTO_HELP.some((k) => msg.includes(k)) && (msg.includes("show") || msg.includes("see") || msg.includes("view") || msg.includes("picture") || msg.includes("disaster photo") || msg.includes("फोटो") || msg.includes("ছবি"))) {
    return getPhotoResponse(lang);
  }

  // 3. Check for specific NE States
  const matchedState = window.NE_STATES ? NE_STATES.find((s) => msg.includes(s.name.toLowerCase()) || msg.includes(s.capital.toLowerCase())) : null;

  if (matchedState) {
    const b = typeof baselineForState === "function" ? baselineForState(matchedState) : { overall: 75, band: { label: "High accessibility" } };
    const imdData = window.NE8_IMD ? window.NE8_IMD.getWeatherSync(matchedState.name) : null;
    const cur = imdData && imdData.current ? imdData.current : {};
    const wTemp = cur.temperature || "Observation Active";
    const wCond = cur.condition || "Monitored by IMD";
    const wIcon = cur.icon || "🌤️";
    const imdAttr = window.NE8_IMD ? window.NE8_IMD.ATTRIBUTION : "Source: India Meteorological Department (IMD)";

    let text = "";
    if (lang === "hi") {
      text = `📍 **${matchedState.name}** (${matchedState.capital}):\n• **मौसम (IMD)**: ${wIcon} ${wTemp} (${wCond})\n• **मुख्य कॉरिडोर**: ${matchedState.corridor}\n• **सुगमता स्कोर**: ${b.overall}/100 (${b.band.label})\n*${imdAttr}*`;
    } else if (lang === "as") {
      text = `📍 **${matchedState.name}** (${matchedState.capital}):\n• **বতৰ (IMD)**: ${wIcon} ${wTemp} (${wCond})\n• **প্ৰধান কৰিডৰ**: ${matchedState.corridor}\n• **সুগমতা স্ক’ৰ**: ${b.overall}/100 (${b.band.label})\n*${imdAttr}*`;
    } else if (lang === "bn") {
      text = `📍 **${matchedState.name}** (${matchedState.capital}):\n• **আবহাওয়া (IMD)**: ${wIcon} ${wTemp} (${wCond})\n• **প্রধান করিডোর**: ${matchedState.corridor}\n• **সুগমতা স্কোর**: ${b.overall}/100 (${b.band.label})\n*${imdAttr}*`;
    } else {
      text = `📍 **${matchedState.name} Corridor Status** (${matchedState.capital}):\n• **Weather (IMD)**: ${wIcon} ${wTemp} (${wCond})\n• **Trunk Route**: ${matchedState.corridor}\n• **Accessibility Score**: ${b.overall}/100 (${b.band.label})\n*${imdAttr}*`;
    }

    const actionHtml = `<div style="margin-top:8px;"><a class="btn btn-primary btn-sm" href="trip-planner.html?origin=${encodeURIComponent(matchedState.capital)}&destination=${encodeURIComponent(matchedState.name)}">🗺️ Plot Route to ${matchedState.name}</a></div>`;
    return { text, actionHtml };
  }

  // 3.5 Check Platform Intent Queries: Road Accessibility, Essential Goods Vehicles, Active Alerts
  if (msg.includes("nh-") || msg.includes("nh ") || msg.includes("highway") || msg.includes("road status") || msg.includes("accessibility") || msg.includes("is open") || msg.includes("is blocked")) {
    const roads = typeof loadRoads === "function" ? loadRoads() : (window.DEFAULT_ROADS || []);
    const nhMatch = msg.match(/nh[- ]?(\d+)/i);
    if (nhMatch) {
      const num = nhMatch[1];
      const targetRoad = roads.find(r => r.name.toLowerCase().includes(`nh-${num}`) || r.id === `nh-${num}`);
      if (targetRoad) {
        let statusBadge = targetRoad.status === "OPEN" ? "🟢 OPEN" : (targetRoad.status === "BLOCKED" ? "🔴 BLOCKED" : "🟡 " + targetRoad.status);
        let text = `🛣️ **${targetRoad.name} Highway Status** (${targetRoad.district}):\n• **Accessibility State**: ${statusBadge}\n• **Condition / Hazard**: ${targetRoad.incident}\n• **Last Updated**: ${targetRoad.lastUpdate}`;
        let actionHtml = `<div style="margin-top:8px;"><a class="btn btn-primary btn-sm" href="trip-planner.html">🗺️ Plan Route & Detours</a></div>`;
        return { text, actionHtml };
      }
    }
    const openRoads = roads.filter(r => r.status === "OPEN").map(r => r.name).join(", ");
    const limitedRoads = roads.filter(r => r.status === "LIMITED ACCESS" || r.status === "HIGH RISK").map(r => r.name).join(", ");
    const blockedRoads = roads.filter(r => r.status === "BLOCKED").map(r => r.name).join(", ") || "None";
    let text = `🛣️ **NE Corridor Road Accessibility Monitoring**:\n• 🟢 **OPEN**: ${openRoads}\n• 🟡 **LIMITED / HIGH RISK**: ${limitedRoads}\n• 🔴 **BLOCKED**: ${blockedRoads}\n\nYou can ask about specific highways (e.g. "Is NH-6 open?" or "Status of NH-37").`;
    let actionHtml = `<div style="margin-top:8px;"><a class="btn btn-primary btn-sm" href="trip-planner.html">🗺️ Check Interactive Trip Planner</a></div>`;
    return { text, actionHtml };
  }

  if (msg.includes("vehicle") || msg.includes("medicine") || msg.includes("food") || msg.includes("truck") || msg.includes("cargo") || msg.includes("delayed") || msg.includes("essential goods")) {
    const vehicles = typeof loadVehicles === "function" ? loadVehicles() : (window.DEFAULT_VEHICLES || []);
    const delayedVehicles = vehicles.filter(v => v.status !== "Moving" || v.statusClass !== "safe");
    
    if (msg.includes("medicine") || msg.includes("vaccine") || msg.includes("oxygen")) {
      const medVehicles = vehicles.filter(v => v.cargoType === "medicines");
      let details = medVehicles.map(v => `• **${v.code}** (${v.cargo}): ${v.status === "Moving" ? "🟢 Moving" : "🟡 " + v.status} - ${v.location} (ETA: ${v.eta})`).join("\n");
      let text = `💊 **Medicine & Emergency Supply Vehicles**:\n${details}\n\nAll medicine trucks are tracked in real-time with automated detour rerouting when mountain pass blockades occur.`;
      let actionHtml = `<div style="margin-top:8px;"><a class="btn btn-primary btn-sm" href="logistics.html">🚚 View Live Logistics Map</a></div>`;
      return { text, actionHtml };
    }

    let details = vehicles.map(v => `• **${v.code}** (${v.icon} ${v.cargoLabel || v.cargo}): ${v.status === "Moving" ? "🟢 Moving" : "🟡 " + v.status} (${v.location})`).join("\n");
    let text = `🚚 **Essential Goods & Vehicle Fleet Tracking**:\n${details}\n\n• **Active Transports**: ${vehicles.length} essential supply trucks\n• **Delayed Vehicles**: ${delayedVehicles.length} undergoing pass detours`;
    let actionHtml = `<div style="margin-top:8px;"><a class="btn btn-primary btn-sm" href="logistics.html">🚚 View Vehicle Map</a></div>`;
    return { text, actionHtml };
  }

  if (msg.includes("alert") || msg.includes("warning") || msg.includes("disruption") || msg.includes("notice")) {
    const alerts = typeof loadAlerts === "function" ? loadAlerts() : (window.DEFAULT_ALERTS || []);
    let details = alerts.map(a => `• ${a.icon} **[${a.severity}]** ${a.title} (${a.location})`).join("\n");
    let text = `🚨 **Automated Alert Center (${alerts.length} Active Alerts)**:\n${details}`;
    let actionHtml = `<div style="margin-top:8px;"><a class="btn btn-secondary btn-sm" href="index.html">📊 Central Command Center</a></div>`;
    return { text, actionHtml };
  }

  // 4. Specific Danger Passes
  if (CHAT_INTENTS.SONAPUR.some((k) => msg.includes(k))) {
    let text = "";
    if (lang === "hi") {
      text = `⚠️ **सोनापुर टनल एवं ईस्ट जयंतिया हिल्स (NH-6 मेघालय)**:\n• **स्थिति**: सक्रिय भूस्खलन एवं कीचड़ क्षेत्र\n• **प्रभाव**: गुवाहाटी से सिलचर, मिजोरम एवं त्रिपुरा को जोड़ने वाला मुख्य राजमार्ग।\n• **सलाह**: बारिश के दौरान धीमी गति से चलें। भारी ट्रकों को किमी 114 के पास सावधानी बरतनी चाहिए।`;
    } else if (lang === "as") {
      text = `⚠️ **সোণাপুৰ সুৰংগ (NH-6 মেঘালয়)**:\n• **অৱস্থা**: ভূমিস্খলন প্ৰৱণ স্থান\n• **পৰামৰ্শ**: বৰষুণৰ সময়ত সাৱধানে গাড়ী চলাওক।`;
    } else if (lang === "bn") {
      text = `⚠️ **সোনাপুর টানেল (NH-6 মেঘালয়)**:\n• **অবস্থা**: পাহাড় ধস এলাকা\n• **পরামর্শ**: বৃষ্টির সময় সতর্কতার সাথে গাড়ি চালান।`;
    } else {
      text = `⚠️ **Sonapur Tunnel & East Jaintia Hills (NH-6 Meghalaya)**:\n• **Status**: Active Landslide & Mudslip Hotspot\n• **Freight Impact**: Primary highway connecting Guwahati to Silchar, Mizoram & Tripura.\n• **Advisory**: Single-lane crawling during monsoon rain. Heavy trucks exercise extreme caution near km 114.`;
    }
    const actionHtml = `<div style="margin-top:8px;"><a class="btn btn-google btn-sm" href="https://www.google.com/maps/search/Sonapur+Tunnel+Meghalaya" target="_blank" rel="noopener">📍 Open Sonapur in Google Maps</a></div>`;
    return { text, actionHtml };
  } 

  if (CHAT_INTENTS.SELA.some((k) => msg.includes(k))) {
    let text = "";
    if (lang === "hi") {
      text = `🏔️ **सेला पास (NH-13 अरुणाचल प्रदेश)**:\n• **ऊंचाई**: 13,700 फीट\n• **स्थिति**: रात एवं सुबह बर्फबारी तथा ब्लैक आइस का खतरा।\n• **सलाह**: तवांग जाने वाले वाहनों के लिए 4-व्हील ड्राइव और एंटी-स्किड चेन आवश्यक।`;
    } else {
      text = `🏔️ **Sela Pass High Altitude Pass (NH-13 Arunachal Pradesh)**:\n• **Elevation**: 13,700 ft\n• **Status**: Snowfall & Black Ice Alert during night & early morning.\n• **Advisory**: Four-wheel drive & anti-skid tire chains required for heavy supply trucks bound for Tawang.`;
    }
    const actionHtml = `<div style="margin-top:8px;"><a class="btn btn-google btn-sm" href="https://www.google.com/maps/search/Sela+Pass+Arunachal+Pradesh" target="_blank" rel="noopener">📍 Open Sela Pass in Google Maps</a></div>`;
    return { text, actionHtml };
  }

  if (CHAT_INTENTS.IMPHAL.some((k) => msg.includes(k))) {
    const text = `🚧 **Imphal–Jiribam Section (NH-37 Manipur)**:\n• **Status**: Road Sinking Zone & Mudslides near km 62.\n• **Advisory**: Essential supply lifeline into Imphal Valley. Expect delay; check local highway control before night runs.`;
    return { text, actionHtml: "" };
  }

  if (CHAT_INTENTS.GANGTOK.some((k) => msg.includes(k))) {
    const text = `🌊 **Rangpo–Teesta River Gorge (NH-10 Sikkim)**:\n• **Status**: River Erosion & Falling Boulders\n• **Advisory**: Single lane movement active near Singtam. Teesta undercut monitored daily.`;
    return { text, actionHtml: "" };
  }

  // 5. Safety Summary
  if (CHAT_INTENTS.SAFETY.some((k) => msg.includes(k))) {
    let text = "";
    if (lang === "hi") {
      text = `📊 **लाइव सुरक्षा रिपोर्ट**:\n• **कुल फ़ील्ड रिपोर्ट**: ${liveIncidents.count}\n• **उच्च जोखिम वाले स्थल**: ${liveIncidents.highRisks}\n• **सबसे सुरक्षित क्षेत्र**: असम (NH-27) एवं त्रिपुरा (NH-8)\n• **सावधानी वाले मार्ग**: मेघालय NH-6, सिक्किम NH-10, मणिपुर NH-37`;
    } else if (lang === "as") {
      text = `📊 **সজীৱ সুৰক্ষা প্ৰতিবেদন**:\n• **ফিল্ড ৰিপৰ্ট**: ${liveIncidents.count}\n• **উচ্চ বিপদাশংকা স্থান**: ${liveIncidents.highRisks}\n• **সুৰক্ষিত পথ**: অসম (NH-27) আৰু ত্ৰিপুৰা (NH-8)`;
    } else if (lang === "bn") {
      text = `📊 **লাইভ নিরাপত্তা রিপোর্ট**:\n• **ফিল্ড রিপোর্ট**: ${liveIncidents.count}\n• **উচ্চ ঝুঁকিপূর্ণ স্থান**: ${liveIncidents.highRisks}\n• **নিরাপদ রুট**: আসাম (NH-27) ও ত্রিপুরা (NH-8)`;
    } else {
      text = `📊 **Live Corridor Safety Summary**:\n• **Active Field Reports**: ${liveIncidents.count} photos on file\n• **High-Risk Danger Sites**: ${liveIncidents.highRisks} sites to avoid\n• **High Risk Passes**: Sonapur Tunnel (NH-6), Sela Pass (NH-13), Imphal-Jiribam (NH-37)\n• **Weather Source**: India Meteorological Department (IMD)`;
    }
    return { text, actionHtml: "" };
  }

  // 6. Weather Summary (Queried dynamically from IMD)
  if (CHAT_INTENTS.WEATHER.some((k) => msg.includes(k))) {
    const states = window.NE_STATES || [];
    const lines = states.map((s) => {
      const imd = window.NE8_IMD ? window.NE8_IMD.getWeatherSync(s.name) : null;
      const cur = imd && imd.current ? imd.current : {};
      const t = cur.temperature || "Active";
      const c = cur.condition || "Monitored";
      const ic = cur.icon || "🌤️";
      return `• **${s.name}**: ${ic} ${t} (${c})`;
    });

    const imdAttr = window.NE8_IMD ? window.NE8_IMD.ATTRIBUTION : "Source: India Meteorological Department (IMD)";
    const text = `🌦️ **Northeast 8-State IMD Weather Radar**:\n${lines.join("\n")}\n\n📍 *${imdAttr}*`;
    return { text, actionHtml: "" };
  }

  // 7. Route & Photo Help
  if (CHAT_INTENTS.ROUTE_HELP.some((k) => msg.includes(k))) {
    let text = "";
    if (lang === "hi") {
      text = `🗺️ **सुरक्षित मार्ग कैसे बनाएं**:\n1. 'सड़क एवं मानचित्र' पर क्लिक करें।\n2. प्रारंभिक और गंतव्य स्थान दर्ज करें।\n3. 'सर्वश्रेष्ठ मार्ग गूगल मैप्स में खोलें' पर क्लिक करें!`;
    } else {
      text = `🗺️ **How to Plot a Safe Route**:\n1. Click **'Road & map'** in top navigation.\n2. Enter Origin & Destination inside the 8 Northeast states.\n3. Click **'Plot the right way'**.\n4. View safety deductions & click **'Open best route in Google Maps'** for turn-by-turn navigation!`;
    }
    const actionHtml = `<div style="margin-top:8px;"><a class="btn btn-primary btn-sm" href="trip-planner.html">🗺️ Go to Trip Planner</a></div>`;
    return { text, actionHtml };
  }

  if (CHAT_INTENTS.GREETING.some((k) => msg.includes(k))) {
    let text = "";
    if (lang === "ta") {
      text = `👋 **SafeRoute NE8 வழித்தட AI உதவியாளருக்கு வரவேற்கிறோம்!**\nஅருணாச்சலப் பிரதேசம், அசாம், மணிப்பூர், மேகாலயா, மிசோரம், நாகாலாந்து, சிக்கிம் & திரிபுரா நெடுஞ்சாலைகளை நேரலையாகக் கண்காணிக்கிறேன்.\n\nநீங்கள் கேட்கலாம்:\n• *சோனாபூர் சுரங்கப்பாதை அல்லது சேலா கணவாய் நிலை*\n• *குவஹாத்தி முதல் ஷில்லாங் செல்லும் பாதை*\n• *அவசர உதவி எண்கள் & பேரிடர் புகைப்படங்கள்*`;
    } else if (lang === "ne") {
      text = `👋 **NE8 करिडोर AI सहायकमा स्वागत छ!**\nम पूर्वोत्तरका आठ राज्यका राजमार्ग तथा मौसमको प्रत्यक्ष निगरानी गर्दछु।\n\nतपाईंले सोध्न सक्नुहुन्छ:\n• *सोनापुर सुरुङ वा सेला पासको स्थिति*\n• *गुवाहाटी देखि शिलोङको सुरक्षित मार्ग*\n• *आपतकालीन हेल्पलाइन (SOS)*`;
    } else if (lang === "hi") {
      text = `👋 **NE8 कॉरिडोॉर AI सहायक में आपका स्वागत है!**\nमैं पूर्वोत्तर के आठों राज्यों के राजमार्गों और मौसम की लाइव निगरानी करता हूँ।\n\nआप मुझसे पूछ सकते हैं:\n• *सोनापुर टनल या सेला पास की स्थिति*\n• *गुवाहाटी से शिलोंग का मार्ग*\n• *आपातकालीन हेल्पलाइन (SOS)*`;
    } else if (lang === "as") {
      text = `👋 **NE8 কৰিডৰ AI সহায়কৈ স্বাগতম!**\nমই উত্তৰ-পূৰ্বাঞ্চলৰ পাহাৰীয়া ৰাষ্ট্ৰীয় ঘাইপথসমূহ নিৰীক্ষণ কৰোঁ।`;
    } else if (lang === "bn") {
      text = `👋 **NE8 করিডোর AI অ্যাসিস্ট্যান্টে স্বাগতম!**\nআমি উত্তর-পূর্বের পার্বত্য মহাসড়ক ও আবহাওয়া পর্যবেক্ষণ করি।`;
    } else {
      text = `👋 **Welcome to NE8 Corridor AI Assistant!**\nI monitor Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim & Tripura highways in real-time.\n\nAsk me about:\n• *Sonapur Tunnel or Sela Pass status*\n• *Route from Guwahati to Shillong*\n• *Emergency helpline & disaster photos*`;
    }
    return { text, actionHtml: "" };
  }

  // Fallback
  let text = "";
  if (lang === "ta") {
    text = `🤖 உங்கள் கேள்வி பகுப்பாய்வு செய்யப்பட்டது. நீங்கள் கேட்கக்கூடியவை:\n• **மாநில நிலை**: "அசாம்", "மேகாலயா", "மணிப்பூர்"\n• **பாதை திட்டமிடல்**: "குவஹாத்தி முதல் ஷில்லாங்"\n• **ஆபத்து கணவாய்**: "சோனாபூர்", "சேலா கணவாய்"\n• **அவசர உதவி**: "அவசரம்" அல்லது "SOS"`;
  } else if (lang === "ne") {
    text = `🤖 मलाई तपाईंको प्रश्न थाहा भयो। तपाईंले यी सोध्न सक्नुहुन्छ:\n• **राज्य स्थिति**: "असम", "मेघालय", "सिक्किम"\n• **मार्ग**: "गुवाहाटी देखि शिलोङ"\n• **खतरा पास**: "सोनापुर", "सेला पास"\n• **आपतकालीन**: "आपतकालीन" वा "SOS"`;
  } else if (lang === "hi") {
    text = `🤖 मुझे आपका प्रश्न समझ आया। आप यह पूछ सकते हैं:\n• **राज्य स्थिति**: "असम", "मेघालय", "सिक्किम"\n• **मार्ग**: "गुवाहाटी से शिलांग"\n• **खतरा दर्रा**: "सोनापुर", "सेला पास"\n• **आपातकालीन**: "आपातकालीन" या "SOS"`;
  } else {
    text = `🤖 I analyzed your query. Here is what I can help you with:\n• **Check a state**: Type "Assam", "Meghalaya", "Sikkim", etc.\n• **Plot a route**: Type "Guwahati to Shillong" or "Agartala to Silchar"\n• **Check a danger pass**: Type "Sonapur", "Sela Pass", "Imphal"\n• **Emergency Helpline**: Type "Emergency" or "SOS"`;
  }
  return { text, actionHtml: "" };
}

function speakText(text) {
  // Strip Markdown & HTML
  const clean = text.replace(/<[^>]*>?/gm, "").replace(/[\*\_#\`📍⚠️🏔️🚧🌊📊🌦️🗺️📸👋🤖📞🚨]/g, "");
  const lang = typeof getCurrentLanguage === "function" ? getCurrentLanguage() : (window.I18N ? window.I18N.getLanguage() : "en");

  const voiceSvc = window.SafeRouteVoice || window.NE8Voice;
  if (voiceSvc && typeof voiceSvc.speak === "function") {
    voiceSvc.speak(clean, { lang });
  } else if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    const speechMap = {
      en: "en-IN", ta: "ta-IN", hi: "hi-IN", bn: "bn-IN", as: "as-IN",
      ne: "ne-NP", meitei: "mni-IN", mizo: "lus-IN", khasi: "en-IN", nishi: "en-IN", konyak: "en-IN"
    };
    utterance.lang = speechMap[lang] || "en-IN";
    window.speechSynthesis.speak(utterance);
  }
}

// Global modal trigger helper for chatbot inline photo previews
window.triggerChatbotPhotoModal = function (index = 0) {
  const live = queryLiveIncidents();
  if (live.recent && live.recent.length > 0 && typeof openPhotoModal === "function") {
    openPhotoModal(live.recent[index] || live.recent[0]);
  }
};

function getChipsForLanguage() {
  const lang = typeof getCurrentLanguage === "function" ? getCurrentLanguage() : (window.I18N ? window.I18N.getLanguage() : "en");
  if (lang === "ta") {
    return [
      { label: "🛣️ NH-6 திறக்கப்பட்டுள்ளதா?", query: "Is NH-6 open?" },
      { label: "💊 மருந்து சரக்கு வாகனங்கள்", query: "Are medicine trucks delayed?" },
      { label: "🚨 நேரலை எச்சரிக்கைகள்", query: "Show active alerts" },
      { label: "📍 குவஹாத்தி முதல் ஷில்லாங்", query: "Route Guwahati to Shillong" },
      { label: "📸 பேரிடர் புகைப்படம்", query: "Show disaster photo" },
    ];
  } else if (lang === "ne") {
    return [
      { label: "🛣️ के NH-6 खुला छ?", query: "Is NH-6 open?" },
      { label: "💊 औषधि ढुवानी ट्रकहरू", query: "Are medicine trucks delayed?" },
      { label: "🚨 सक्रिय अलर्टहरू", query: "Show active alerts" },
      { label: "📍 गुवाहाटी देखि शिलोङ", query: "Route Guwahati to Shillong" },
      { label: "📸 विपद् तस्बिर", query: "Show disaster photo" },
    ];
  } else if (lang === "hi") {
    return [
      { label: "⚠️ सोनापुर टनल", query: "सोनापुर टनल स्थिति" },
      { label: "🏔️ सेला पास", query: "सेला पास स्थिति" },
      { label: "📍 गुवाहाटी से शिलांग", query: "Guwahati to Shillong route" },
      { label: "🚨 आपातकालीन SOS", query: "आपातकालीन हेल्पलाइन" },
      { label: "🌦️ मौसम समाचार", query: "पूर्वोत्तर मौसम" },
    ];
  } else if (lang === "as") {
    return [
      { label: "⚠️ সোণাপুৰ সুৰংগ", query: "Sonapur Tunnel status" },
      { label: "🏔️ চেলা পাছ", query: "Sela Pass condition" },
      { label: "📍 গুৱাহাটীৰ পৰা শ্বিলং", query: "Guwahati to Shillong" },
      { label: "🚨 জৰুৰীকালীন সাহায্য", query: "Emergency helpline" },
      { label: "🌦️ বতৰৰ সংবাদ", query: "Weather Today" },
    ];
  } else if (lang === "bn") {
    return [
      { label: "⚠️ সোনাপুর টানেল", query: "Sonapur Tunnel status" },
      { label: "🏔️ সেলা পাস", query: "Sela Pass condition" },
      { label: "📍 গুয়াহাটি থেকে শিলং", query: "Guwahati to Shillong" },
      { label: "🚨 জরুরি হেল্পলাইন", query: "Emergency helpline" },
      { label: "🌦️ আবহাওয়া পূর্বাভাস", query: "Northeast weather alert" },
    ];
  } else {
    return [
      { label: "🛣️ Is NH-6 Open?", query: "Is NH-6 open?" },
      { label: "💊 Medicine Trucks", query: "Are medicine trucks delayed?" },
      { label: "🚨 Active Alerts", query: "Show active alerts" },
      { label: "📍 Guwahati to Shillong", query: "Route Guwahati to Shillong" },
      { label: "📸 Disaster Photo", query: "Show disaster photo" },
    ];
  }
}

function renderQuickChipsContainer(container, handler) {
  if (!container) return;
  const chips = getChipsForLanguage();
  container.innerHTML = chips
    .map((c) => `<button class="chip-btn" data-query="${c.query}">${c.label}</button>`)
    .join("");

  container.querySelectorAll(".chip-btn").forEach((chip) => {
    chip.addEventListener("click", () => handler(chip.dataset.query));
  });
}

function initChatbotUI() {
  if (document.getElementById("chatbot-widget")) return;

  const chatHtml = `
    <div id="chatbot-widget" class="chatbot-widget">
      <button id="chatbot-toggle" class="chatbot-toggle" aria-label="Open NE8 AI Assistant">
        <span class="chatbot-badge-icon">🤖</span>
        <span class="chatbot-toggle-text">NE8 AI Assistant</span>
      </button>

      <div id="chatbot-window" class="chatbot-window hidden" role="dialog" aria-label="NE8 AI Assistant Chat">
        <div class="chatbot-header">
          <div class="chatbot-header-title">
            <span style="font-size:20px;">🤖</span>
            <div>
              <strong>NE8 Corridor Local AI</strong>
              <small style="display:block; color:var(--accent); font-size:10px;">Smart Multi-Lingual Road & Voice Assistant</small>
            </div>
          </div>
          <div style="display:flex; gap:4px; align-items:center;">
            <button id="chatbot-voice-toggle" class="chatbot-header-btn" title="Toggle Voice Advisory Speech">🔊</button>
            <button id="chatbot-clear-btn" class="chatbot-header-btn" title="Clear Chat">🗑️</button>
            <button id="chatbot-close" class="chatbot-close-btn" aria-label="Close Chat">✕</button>
          </div>
        </div>

        <div id="chatbot-messages" class="chatbot-messages">
          <div class="chat-msg bot-msg">
            👋 Hello! I am your <strong>NE8 Corridor Local AI Assistant</strong>. Ask me about road blockades, Sonapur Tunnel, Sela Pass, weather, routes, emergency numbers, or disaster photos!
          </div>
        </div>

        <div id="chatbot-quick-chips" class="chatbot-quick-chips"></div>

        <form id="chatbot-form" class="chatbot-input-form">
          <button type="button" id="chatbot-mic-btn" class="chatbot-mic-btn" title="Speak Query (Voice Recognition)">🎤</button>
          <input id="chatbot-input" type="text" placeholder="Ask AI about roads, routes, SOS..." autocomplete="off" />
          <button type="submit" class="btn btn-primary btn-sm">Send</button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", chatHtml);

  const toggleBtn = document.getElementById("chatbot-toggle");
  const closeBtn = document.getElementById("chatbot-close");
  const clearBtn = document.getElementById("chatbot-clear-btn");
  const voiceBtn = document.getElementById("chatbot-voice-toggle");
  const micBtn = document.getElementById("chatbot-mic-btn");
  const chatWin = document.getElementById("chatbot-window");
  const form = document.getElementById("chatbot-form");
  const input = document.getElementById("chatbot-input");
  const msgs = document.getElementById("chatbot-messages");
  const chipsContainer = document.getElementById("chatbot-quick-chips");

  let voiceEnabled = false;
  let recognition = null;
  let isListening = false;

  // Initialize Speech Recognition if available
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListening = true;
      micBtn.classList.add("listening");
      micBtn.title = "Listening... Speak your query now!";
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        input.value = transcript;
        handleUserQuery(transcript);
      }
    };

    recognition.onerror = () => {
      stopListening();
    };

    recognition.onend = () => {
      stopListening();
    };
  } else {
    micBtn.style.display = "none";
  }

  function stopListening() {
    isListening = false;
    if (micBtn) {
      micBtn.classList.remove("listening");
      micBtn.title = "Speak Query (Voice Recognition)";
    }
  }

  micBtn.addEventListener("click", () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      stopListening();
    } else {
      const lang = typeof getCurrentLanguage === "function" ? getCurrentLanguage() : "en";
      if (lang === "hi") recognition.lang = "hi-IN";
      else if (lang === "bn") recognition.lang = "bn-IN";
      else if (lang === "as") recognition.lang = "hi-IN";
      else recognition.lang = "en-US";

      try {
        recognition.start();
      } catch (err) {
        stopListening();
      }
    }
  });

  renderQuickChipsContainer(chipsContainer, handleUserQuery);

  // Sync quick chips on language change
  window.addEventListener("i18n:change", () => {
    renderQuickChipsContainer(chipsContainer, handleUserQuery);
  });

  toggleBtn.addEventListener("click", () => {
    chatWin.classList.toggle("hidden");
    if (!chatWin.classList.contains("hidden")) {
      renderQuickChipsContainer(chipsContainer, handleUserQuery);
      input.focus();
    }
  });

  document.querySelectorAll("#ask-ai-btn, #ask-ai-dash, .btn-ask-ai").forEach((b) => {
    b.addEventListener("click", () => {
      window.openAiChatbotWithQuery();
    });
  });

  closeBtn.addEventListener("click", () => chatWin.classList.add("hidden"));

  clearBtn.addEventListener("click", () => {
    msgs.innerHTML = `
      <div class="chat-msg bot-msg">
        Chat cleared. Ask me anything about Northeast mountain roads, routes, emergency SOS, weather, or hazard detours!
      </div>
    `;
  });

  voiceBtn.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;
    voiceBtn.style.color = voiceEnabled ? "#10b981" : "#94a3b8";
    if (voiceEnabled) {
      voiceBtn.title = "Voice Speech ON";
      speakText("Voice advisory speech enabled.");
    } else {
      voiceBtn.title = "Voice Speech OFF";
      if (window.NE8Voice) window.NE8Voice.stop();
      else if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  });

  function appendMessage(text, isUser = false, actionHtml = "") {
    const div = document.createElement("div");
    div.className = `chat-msg ${isUser ? "user-msg" : "bot-msg"}`;
    const formattedText = text
      .replace(/\n/g, "<br/>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
    div.innerHTML = formattedText + (actionHtml || "");
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;

    if (!isUser && voiceEnabled) {
      speakText(text);
    }
  }

  function handleUserQuery(query) {
    if (!query || !query.trim()) return;
    appendMessage(query, true);
    input.value = "";

    const typing = document.createElement("div");
    typing.className = "chat-msg bot-msg typing";
    typing.innerHTML = `
      <div class="typing-indicator">
        <span>NE8 AI analyzing</span>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;

    setTimeout(() => {
      typing.remove();
      const res = getLocalAiResponse(query);
      appendMessage(res.text, false, res.actionHtml);
    }, 350);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleUserQuery(input.value);
  });
}

document.addEventListener("DOMContentLoaded", initChatbotUI);

