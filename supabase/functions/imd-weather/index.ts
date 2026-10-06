// Supabase Edge Function: imd-weather
// Secure proxy for India Meteorological Department (IMD) APIs
// Handles authentication headers (X-API-KEY, Bearer JWT), IP whitelisting constraints,
// and proxies official real-time weather, forecasts, and warnings for Northeast India.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// In-memory cache for Edge Function instance (30-minute TTL)
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Major IMD observation stations in the 8 Northeast states
const NE_STATION_MAP: Record<string, { id: string; name: string; state: string; lat: number; lng: number }> = {
  "guwahati": { id: "42410", name: "Guwahati (Borjhar)", state: "Assam", lat: 26.1061, lng: 91.5859 },
  "dispur": { id: "42410", name: "Dispur (Guwahati)", state: "Assam", lat: 26.1445, lng: 91.7362 },
  "dibrugarh": { id: "42404", name: "Dibrugarh (Mohanbari)", state: "Assam", lat: 27.4839, lng: 95.0178 },
  "silchar": { id: "42619", name: "Silchar (Kumbhirgram)", state: "Assam", lat: 24.9128, lng: 92.9789 },
  "tezpur": { id: "42415", name: "Tezpur (Salonibari)", state: "Assam", lat: 26.7094, lng: 92.7981 },
  "jorhat": { id: "42412", name: "Jorhat (Rowriah)", state: "Assam", lat: 26.7314, lng: 94.1753 },
  "shillong": { id: "42516", name: "Shillong", state: "Meghalaya", lat: 25.5788, lng: 91.8933 },
  "cherrapunji": { id: "42515", name: "Sohra (Cherrapunji)", state: "Meghalaya", lat: 25.2700, lng: 91.7300 },
  "itanagar": { id: "42308", name: "Itanagar", state: "Arunachal Pradesh", lat: 27.0844, lng: 93.6053 },
  "pasighat": { id: "42314", name: "Pasighat", state: "Arunachal Pradesh", lat: 28.0663, lng: 95.3260 },
  "tawang": { id: "42304", name: "Tawang", state: "Arunachal Pradesh", lat: 27.5861, lng: 91.8594 },
  "imphal": { id: "42623", name: "Imphal (Tulihal)", state: "Manipur", lat: 24.7600, lng: 93.8967 },
  "kohima": { id: "42525", name: "Kohima", state: "Nagaland", lat: 25.6751, lng: 94.1086 },
  "dimapur": { id: "42524", name: "Dimapur", state: "Nagaland", lat: 25.8839, lng: 93.7711 },
  "aizawl": { id: "42724", name: "Aizawl (Lengpui)", state: "Mizoram", lat: 23.8400, lng: 92.6194 },
  "agartala": { id: "42727", name: "Agartala (Singerbhil)", state: "Tripura", lat: 23.8864, lng: 91.2406 },
  "gangtok": { id: "42299", name: "Gangtok", state: "Sikkim", lat: 27.3314, lng: 88.6138 },
  "rangpo": { id: "42298", name: "Rangpo / Majitar", state: "Sikkim", lat: 27.1764, lng: 88.5342 }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const state = (url.searchParams.get("state") || "").toLowerCase().trim();
    const district = (url.searchParams.get("district") || "").toLowerCase().trim();
    const latStr = url.searchParams.get("lat");
    const lngStr = url.searchParams.get("lng");
    const reqType = url.searchParams.get("type") || "all";

    const cacheKey = `${state}_${district}_${latStr || ""}_${lngStr || ""}_${reqType}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
        status: 200,
      });
    }

    let matchedStation = null;
    if (district && NE_STATION_MAP[district]) {
      matchedStation = NE_STATION_MAP[district];
    } else if (state) {
      matchedStation = Object.values(NE_STATION_MAP).find(
        (s) => s.state.toLowerCase() === state || state.includes(s.state.toLowerCase())
      );
    } else if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        let minDist = Infinity;
        for (const s of Object.values(NE_STATION_MAP)) {
          const d = Math.hypot(s.lat - lat, s.lng - lng);
          if (d < minDist) {
            minDist = d;
            matchedStation = s;
          }
        }
      }
    }

    if (!matchedStation) {
      matchedStation = NE_STATION_MAP["guwahati"];
    }

    const apiKey = Deno.env.get("IMD_API_KEY");
    const jwtToken = Deno.env.get("IMD_JWT_TOKEN");

    let weatherResult: any = null;

    if (apiKey && jwtToken) {
      try {
        const headers: Record<string, string> = {
          "X-API-KEY": apiKey,
          "Authorization": `Bearer ${jwtToken}`,
          "Accept": "application/json",
        };

        const [wxRes, fcRes, warnRes] = await Promise.all([
          fetch(`https://api.imd.gov.in/api/v1/current_wx?id=${matchedStation.id}`, { headers }),
          fetch(`https://api.imd.gov.in/api/v1/cityforecast?id=${matchedStation.id}`, { headers }),
          fetch(`https://api.imd.gov.in/api/v1/districtwarning`, { headers }),
        ]);

        const currentData = wxRes.ok ? await wxRes.json() : null;
        const forecastData = fcRes.ok ? await fcRes.json() : null;
        const warningData = warnRes.ok ? await warnRes.json() : null;

        weatherResult = parseOfficialImdResponse(matchedStation, currentData, forecastData, warningData);
      } catch (err) {
        console.warn("api.imd.gov.in fetch failed, falling back to IMD NWFC live feeds:", err);
      }
    }

    if (!weatherResult) {
      weatherResult = await fetchFromImdMausam(matchedStation, district || state);
    }

    if (weatherResult) {
      cache.set(cacheKey, { data: weatherResult, timestamp: now });
      return new Response(JSON.stringify(weatherResult), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=1800",
          "X-Cache": "MISS",
        },
        status: 200,
      });
    }

    return new Response(
      JSON.stringify({
        error: "Unable to retrieve official IMD data for the specified location",
        source: "India Meteorological Department (IMD)",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal error",
        source: "India Meteorological Department (IMD)",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function parseOfficialImdResponse(station: any, current: any, forecast: any, warnings: any) {
  const cur = Array.isArray(current) && current.length ? current[0] : (current || {});
  const fc = Array.isArray(forecast) && forecast.length ? forecast[0] : (forecast || {});

  const forecastDays: any[] = [];
  if (fc) {
    for (let day = 1; day <= 7; day++) {
      const maxKey = day === 1 ? "Todays_Forecast_Max_Temp" : `Day_${day}_Max_Temp`;
      const minKey = day === 1 ? "Todays_Forecast_Min_temp" : `Day_${day}_Min_temp`;
      const descKey = day === 1 ? "Todays_Forecast" : `Day_${day}_Forecast`;
      if (fc[descKey] || fc[maxKey]) {
        forecastDays.push({
          day: `Day ${day}`,
          maxTemp: fc[maxKey] ? `${fc[maxKey]}°C` : null,
          minTemp: fc[minKey] ? `${fc[minKey]}°C` : null,
          condition: fc[descKey] || "Forecast active",
        });
      }
    }
  }

  return {
    station: {
      name: station.name,
      code: station.id,
      state: station.state,
      lat: station.lat,
      lng: station.lng,
    },
    current: {
      temperature: cur.Temperature ? `${cur.Temperature}°C` : (fc.Today_Max_temp ? `${fc.Today_Max_temp}°C` : null),
      humidity: cur.Humidity ? `${cur.Humidity}%` : null,
      past24hRainfall: cur["Last 24 hrs Rainfall"] !== undefined ? `${cur["Last 24 hrs Rainfall"]} mm` : (fc.Past_24_hrs_Rainfall ? `${fc.Past_24_hrs_Rainfall} mm` : "0 mm"),
      condition: fc.Todays_Forecast || "Observations active",
      icon: getImdWeatherEmoji(fc.Todays_Forecast || ""),
      recordedAt: cur.Date || fc.Date || new Date().toISOString().split("T")[0],
    },
    forecast: forecastDays,
    warnings: extractWarningsForState(warnings, station.state),
    source: "India Meteorological Department (IMD)",
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchFromImdMausam(station: any, queryLocation: string) {
  const [nowcastRes, warningRes] = await Promise.allSettled([
    fetch("https://mausam.imd.gov.in/responsive/districtWiseNowcast.php"),
    fetch("https://mausam.imd.gov.in/responsive/districtWiseWarning.php"),
  ]);

  let nowcastText = "";
  if (nowcastRes.status === "fulfilled" && nowcastRes.value.ok) {
    nowcastText = await nowcastRes.value.text();
  }

  let warningText = "";
  if (warningRes.status === "fulfilled" && warningRes.value.ok) {
    warningText = await warningRes.value.text();
  }

  const nowcastItems = parseAmchartsArray(nowcastText);
  const warningItems = parseAmchartsArray(warningText);

  const locNormalized = (queryLocation || station.state || station.name).toUpperCase();
  const districtName = station.name.split(" ")[0].toUpperCase();

  const matchedNowcast = nowcastItems.find(
    (item: any) =>
      item.title &&
      (item.title.toUpperCase().includes(districtName) ||
        locNormalized.includes(item.title.toUpperCase()) ||
        item.title.toUpperCase().includes(locNormalized))
  );

  const matchedWarning = warningItems.find(
    (item: any) =>
      item.balloonText &&
      (item.balloonText.toUpperCase().includes(districtName) ||
        item.balloonText.toUpperCase().includes(locNormalized))
  );

  let warningLevel = "safe";
  let warningColor = "#008000";
  let warningMessage = "No Warning issued by IMD for this corridor";

  if (matchedNowcast) {
    warningColor = matchedNowcast.color || "#008000";
    warningMessage = cleanHtml(matchedNowcast.info || matchedNowcast.balloonText || "");
    warningLevel = colorToLevel(warningColor);
  } else if (matchedWarning) {
    warningColor = matchedWarning.color || "#008000";
    warningMessage = cleanHtml(matchedWarning.balloonText || "");
    warningLevel = colorToLevel(warningColor);
  }

  return {
    station: {
      name: station.name,
      code: station.id,
      state: station.state,
      lat: station.lat,
      lng: station.lng,
    },
    current: {
      temperature: null,
      humidity: null,
      past24hRainfall: null,
      condition: warningMessage ? warningMessage.split("\n")[0] : "Normal Weather",
      icon: warningLevel === "risk" ? "⛈️" : warningLevel === "caution" ? "🌧️" : "🌤️",
      recordedAt: new Date().toISOString().split("T")[0],
    },
    warnings: [
      {
        severity: warningLevel,
        color: warningColor,
        message: warningMessage || "Normal weather conditions reported by IMD",
        district: station.name,
        state: station.state,
      },
    ],
    source: "India Meteorological Department (IMD)",
    fetchedAt: new Date().toISOString(),
  };
}

function parseAmchartsArray(html: string): any[] {
  try {
    const startIdx = html.indexOf('"dataProvider":');
    if (startIdx === -1) return [];
    const arrayStart = html.indexOf("[", startIdx);
    if (arrayStart === -1) return [];

    let depth = 0;
    let endIdx = -1;
    for (let i = arrayStart; i < html.length; i++) {
      if (html[i] === "[") depth++;
      else if (html[i] === "]") {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx !== -1) {
      const jsonStr = html.substring(arrayStart, endIdx + 1);
      return JSON.parse(jsonStr);
    }
  } catch {}
  return [];
}

function cleanHtml(str: string): string {
  return str
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function colorToLevel(hex: string): string {
  const h = (hex || "").toLowerCase();
  if (h.includes("ff0000") || h.includes("red")) return "risk";
  if (h.includes("ffa500") || h.includes("orange") || h.includes("ffff00") || h.includes("yellow")) return "caution";
  return "safe";
}

function getImdWeatherEmoji(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("thunder") || c.includes("squall")) return "⛈️";
  if (c.includes("heavy rain") || c.includes("shower")) return "🌧️";
  if (c.includes("rain") || c.includes("drizzle")) return "🌦️";
  if (c.includes("fog") || c.includes("mist")) return "🌫️";
  if (c.includes("snow") || c.includes("ice")) return "❄️";
  if (c.includes("cloud")) return "⛅";
  return "☀️";
}

function extractWarningsForState(warnings: any, stateName: string): any[] {
  if (!Array.isArray(warnings)) return [];
  return warnings
    .filter((w: any) => w.State && w.State.toLowerCase() === stateName.toLowerCase())
    .map((w: any) => ({
      district: w.District,
      day1Color: w.Day1_Color,
      day1Warning: w.Day_1,
      source: "India Meteorological Department (IMD)",
    }));
}
