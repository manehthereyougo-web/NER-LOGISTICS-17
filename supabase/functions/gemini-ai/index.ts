// Supabase Edge Function: gemini-ai
// Secure proxy for Google Gemini REST API
// Keeps GEMINI_API_KEY strictly in Supabase server-side environment secrets.
// Enforces that Gemini only explains deterministic evidence and never claims a route is 100% safe.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CANONICAL_CATEGORIES = [
  "flooded",
  "damaged",
  "accident",
  "blocked",
  "traffic",
  "visibility",
  "weather",
  "other",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_KEY_NOT_CONFIGURED_IN_SUPABASE_SECRETS" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const action = body.action || "explain";
    const language = body.language || "en";

    const langNames: Record<string, string> = {
      en: "English",
      ta: "Tamil",
      hi: "Hindi",
      bn: "Bengali",
      as: "Assamese",
      nishi: "Nishi (Nyishi)",
      meitei: "Meitei (Manipuri)",
      khasi: "Khasi",
      mizo: "Mizo",
      konyak: "Konyak Naga",
      ne: "Nepali",
    };
    const targetLang = langNames[language] || "English";

    let prompt = "";
    let maxTokens = 240;
    let model = "gemini-2.5-flash";

    if (action === "explain") {
      const { structuredEvidence } = body;
      if (!structuredEvidence || !structuredEvidence.recommendedRoute) {
        return new Response(JSON.stringify({ error: "structuredEvidence required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      prompt = `You are the SafeRoute logistics safety advisor explaining an already evaluated mountain route to a driver.
DO NOT decide which route is safest. The route was already chosen deterministically based on verified road data.
Explain the evidence in 2-3 calm, practical, reassuring sentences in ${targetLang}.
Strict rules:
1. Respond STRICTLY in ${targetLang}.
2. Use wording: "Recommended based on current available conditions."
3. NEVER say "100% safe" or "guaranteed safe".
4. State reasons clearly (weather exposure, road closures avoided, passability).

Evidence:
- Origin: ${structuredEvidence.origin?.name || "Origin"}
- Destination: ${structuredEvidence.destination?.name || "Destination"}
- Recommended Route: ${structuredEvidence.recommendedRoute.name} (${structuredEvidence.recommendedRoute.distanceKm} km, ${structuredEvidence.recommendedRoute.durationStr})
- Reasons: ${JSON.stringify(structuredEvidence.recommendedRoute.reasons || [])}
- Weather: ${structuredEvidence.recommendedRoute.conditions?.weather || "Normal"}
- Active Field Reports: ${structuredEvidence.recommendedRoute.conditions?.road_reports ?? 0}
- Road Closures: ${structuredEvidence.recommendedRoute.conditions?.active_closures ?? 0}
- Traffic: ${structuredEvidence.recommendedRoute.conditions?.traffic || "Normal"}

RESPONSE (${targetLang} ONLY):`;
    } else if (action === "classify") {
      model = "gemini-2.5-flash-lite";
      maxTokens = 80;
      const text = body.text || "";
      prompt = `Classify this road hazard report from a driver into exactly ONE of the 8 canonical categories:
flooded, damaged, accident, blocked, traffic, visibility, weather, other

Report: "${text.trim()}"

Output strictly in valid JSON format:
{"category":"CATEGORY_NAME","summary":"One concise sentence summary in English","confidence":0.9}`;
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: "UPSTREAM_GEMINI_ERROR", details: errText.slice(0, 200) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await geminiRes.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (action === "classify") {
      let parsed: any = null;
      try {
        parsed = JSON.parse(resultText.replace(/```json|```/g, "").trim());
      } catch (_) {}
      const cat = parsed?.category?.toLowerCase()?.trim() || "other";
      const validCat = CANONICAL_CATEGORIES.includes(cat) ? cat : "other";

      return new Response(
        JSON.stringify({
          category: validCat,
          summary: parsed?.summary || body.text?.slice(0, 100) || "Hazard reported",
          confidence: parsed?.confidence || 0.85,
          validated: true,
          isAiLive: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ explanation: resultText, modelUsed: model, isAiLive: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
