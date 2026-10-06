/**
 * SafeRoute — Public Client Runtime Configuration
 * 
 * SECURITY AUDIT COMPLIANCE:
 * - NO private API keys (Gemini, ORS, Weather, Database) exist in this file.
 * - Private credentials remain strictly server-side (server.js / Supabase Edge Secrets).
 * - Drivers receive processed telemetry & AI data; credentials never enter browser bundles.
 */

window.NE8_CONFIG = {
  // Public browser-facing Google Maps key (restricted by domain HTTP referrer)
  mapsKey: "",

  // Supabase Public Backend Configuration (Public Anon Key)
  supabaseUrl: "https://ddilzlkdqeupcrolodyb.supabase.co",
  supabaseAnonKey: "sb_publishable_05AqaOYDNMBDeqqci_rDeg_3KLOT8-f",

  // Secure Backend Proxy Endpoints
  backendApiUrl: "/api",

  // Map Provider Configuration (OpenFreeMap Liberty with Esri raster fallback)
  mapProvider: "openfreemap",

  // Video and asset feeds
  cameraSrc:
    "https://videos.pexels.com/video-files/9338498/9338498-hd_1280_720_24fps.mp4",
};
