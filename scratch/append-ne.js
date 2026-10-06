const fs = require("fs");
const path = require("path");

const i18nPath = path.join(__dirname, "..", "js", "i18n.js");
let content = fs.readFileSync(i18nPath, "utf8");

const neKeys = {
  nav_trip_planner: "ट्रिप प्लानर",
  trip_planner_title: "चालक यात्रा योजना तथा मार्ग तालिका",
  plan_your_journey: "चालक यात्रा योजना बनाउनुहोस्",
  freight_engine_badge: "अखिल भारतीय माल ढुवानी इन्जिन",
  label_origin: "१. सुरुवाती स्थान (प्रस्थान)",
  ph_origin: "जस्तै: केरला, कोच्चि, दिल्ली, कोलकाता...",
  label_dest: "२. अन्तिम गन्तव्य",
  ph_dest: "जस्तै: असम, गुवाहाटी, मुम्बई, चेन्नई...",
  quick_presets_label: "द्रुत:",
  title_use_gps: "हालको जीपीएस स्थान प्रयोग गर्नुहोस्",
  title_swap_cities: "सुरुवात र गन्तव्य साटासाट गर्नुहोस्",
  label_vehicle_category: "सवारी साधन श्रेणी र माल ढुवानी प्रोफाइल",
  vehicle_heavy_truck: "भारी व्यावसायिक ट्रक (१०-१८ पाङ्ग्रा · ४५-५० किमी/घण्टा)",
  vehicle_trailer: "मल्टी-एक्सल कन्टेनर ट्रेलर (लामो दूरी · ४५ किमी/घण्टा)",
  vehicle_medium_truck: "मध्यम मालवाहक (६ पाङ्ग्रा / आइशर · ५५ किमी/घण्टा)",
  vehicle_lcv: "हल्का व्यावसायिक सवारी / पिकअप (६० किमी/घण्टा)",
  btn_generate_schedule: "दिन-वार यात्रा योजना गणना गर्नुहोस्",
  sample_freight_corridors: "नमूना राष्ट्रिय माल ढुवानी करिडोरहरू:",
  feasibility_unrealistic_title: "माल ढुवानीका लागि अवास्तविक तालिका",
  feasibility_demanding_title: "चुनौतीपूर्ण लामो दूरीको तालिका",
  feasibility_optimal_title: "उत्तम माल ढुवानी तालिका",
  feasibility_relaxed_title: "आरामदायी यात्रा तालिका",
  btn_apply_realistic: "यथार्थवादी तालिका लागू गर्नुहोस्",
  metric_total_dist: "कुल दूरी",
  metric_travel_days: "यात्रा दिनहरू",
  metric_avg_daily: "औसत / दिन",
  metric_driving_time: "कुल पारवहन समय",
  btn_print_manifest: "यात्रा विवरण प्रिन्ट गर्नुहोस्",
  btn_listen_plan: "योजना सुन्नुहोस्",
  btn_open_full_gmaps: "गुगल नक्सामा पूरा यात्रा खोल्नुहोस्",
  waiting_for_inputs: "रूट तालिका गणना गर्न सुरुवाती बिन्दु, गन्तव्य र दिनहरू प्रविष्ट गर्नुहोस्।",
  waiting_for_inputs_desc: "SafeRoute ले स्वचालित रूपमा मध्यवर्ती बिसौनी सहरहरू, दैनिक दूरी, यात्रा समय र विश्राम प्लाजाहरू गणना गर्दछ।",
  day_card_badge: "दिन {0} / {1}",
  corridor_label: "करिडोर",
  transit_label: "पारवहन",
  label_facility: "सुविधा केन्द्र:",
  label_amenities: "सुविधाहरू:",
  label_target_city: "लक्षित सहर:",
  label_facilities: "सुविधा विवरण:",
  btn_open_day_gmaps: "दिन {0} गुगल नक्सामा खोल्नुहोस्",
  btn_view_leg_map: "नक्सामा यो चरण हेर्नुहोस्",
  days_suffix: "दिन",
  day_suffix: "दिन",
  hrs_suffix: "घण्टा",
  day_dest_popup: "दिन {0} गन्तव्य",
  journey_start_popup: "यात्राको सुरुवाती बिन्दु",
};

const needle = '"btn_sos": "🚨 आपतकालीन SOS"';
const idx = content.indexOf(needle);
if (idx === -1) {
  console.error("Could not find needle in content");
  process.exit(1);
}

const lines = [];
for (const [k, v] of Object.entries(neKeys)) {
  const escapedV = v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  lines.push(`    "${k}": "${escapedV}",`);
}
const replacement = needle + ",\n" + lines.join("\n");

content = content.replace(needle, replacement);
fs.writeFileSync(i18nPath, content, "utf8");
console.log("Successfully updated Nepali in i18n.js!");
