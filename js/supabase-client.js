/**
 * Supabase Backend Integration for NER Logistics / NE8 Corridor
 * Connects photo uploads to the 'incident-photos' Storage bucket
 * and persists incident reports into the Supabase 'incidents' table.
 * Strictly uses only the public anon key (never exposes or uses service_role key).
 */

(function (window) {
  const STORE_URL_KEY = "ne8-supabase-url";
  const STORE_KEY_KEY = "ne8-supabase-anon-key";
  const BUCKET_NAME = "incident-photos";

  let clientInstance = null;
  let realtimeChannel = null;

  function getSupabaseCredentials() {
    const cfg = window.NE8_CONFIG || {};
    let url = (cfg.supabaseUrl || localStorage.getItem(STORE_URL_KEY) || "").trim();
    url = url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const anonKey = (cfg.supabaseAnonKey || localStorage.getItem(STORE_KEY_KEY) || "").trim();
    return { url, anonKey };
  }

  function isSupabaseConfigured() {
    const { url, anonKey } = getSupabaseCredentials();
    return Boolean(url && anonKey && url.startsWith("https://"));
  }

  function getSupabaseClient() {
    if (clientInstance) return clientInstance;
    const { url, anonKey } = getSupabaseCredentials();

    if (!url || !anonKey || !url.startsWith("https://")) {
      return null;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      console.warn("Supabase client library is not loaded.");
      return null;
    }

    try {
      clientInstance = window.supabase.createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return clientInstance;
    } catch (err) {
      console.error("Failed to initialize Supabase client:", err);
      return null;
    }
  }

  function dataUrlToBlob(dataUrl) {
    try {
      const parts = dataUrl.split(",");
      const mime = (parts[0].match(/:(.*?);/) || [])[1] || "image/jpeg";
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      return null;
    }
  }

  /**
   * Uploads an incident photo to the Supabase Storage bucket 'incident-photos'
   * @param {File|Blob|string} fileOrDataUrl - Photo file or base64 DataURL
   * @returns {Promise<{ publicUrl: string|null, error: any }>}
   */
  async function uploadPhoto(fileOrDataUrl) {
    const client = getSupabaseClient();
    if (!client) {
      return { publicUrl: null, error: new Error("Supabase is not configured.") };
    }
    if (!fileOrDataUrl) {
      return { publicUrl: null, error: new Error("No photo provided.") };
    }

    try {
      let uploadTarget = fileOrDataUrl;
      let contentType = "image/jpeg";
      let cleanExt = "jpg";

      if (typeof fileOrDataUrl === "string") {
        if (fileOrDataUrl.startsWith("http://") || fileOrDataUrl.startsWith("https://")) {
          return { publicUrl: fileOrDataUrl, error: null };
        }
        if (fileOrDataUrl.startsWith("data:")) {
          const blob = dataUrlToBlob(fileOrDataUrl);
          if (!blob) return { publicUrl: null, error: new Error("Invalid image data.") };
          uploadTarget = blob;
          contentType = blob.type || "image/jpeg";
          cleanExt = contentType.includes("png") ? "png" : "jpg";
        }
      } else if (fileOrDataUrl instanceof Blob || (typeof File !== "undefined" && fileOrDataUrl instanceof File)) {
        uploadTarget = fileOrDataUrl;
        contentType = fileOrDataUrl.type || "image/jpeg";
        const ext = (fileOrDataUrl.name && fileOrDataUrl.name.split(".").pop()) || "jpg";
        cleanExt = ext.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;
      const filePath = `reports/${fileName}`;

      const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .upload(filePath, uploadTarget, {
          contentType: contentType,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase Storage upload error:", error);
        return { publicUrl: null, error };
      }

      const { data: urlData } = client.storage.from(BUCKET_NAME).getPublicUrl(filePath);
      return { publicUrl: urlData ? urlData.publicUrl : null, error: null };
    } catch (err) {
      console.error("Photo upload exception:", err);
      return { publicUrl: null, error: err };
    }
  }

  /**
   * Saves an incident report into the Supabase 'incidents' table
   * @param {Object} item - Incident details
   * @returns {Promise<{ data: any, error: any }>}
   */
  async function saveIncident(item) {
    const client = getSupabaseClient();
    if (!client) {
      return { data: null, error: new Error("Supabase is not configured.") };
    }

    try {
      const row = {
        title: item.title || "Road hazard",
        description: item.description || "",
        photo_url: item.photo || item.photo_url || item.photoUrl || "",
        state: item.state || "Assam",
        place: item.place || "",
        incident_type: item.incident_type || item.category || "landslide",
        hazards: Array.isArray(item.hazards) ? item.hazards : (item.category ? [item.category] : []),
        risk_level: item.level || item.risk_level || item.riskLevel || "caution",
        risk_score: typeof item.risk_score === "number" ? item.risk_score : (typeof item.riskScore === "number" ? item.riskScore : 50),
        reasons: Array.isArray(item.reasons) ? item.reasons : (item.description ? [item.description] : []),
        lat: typeof item.lat === "number" ? item.lat : 26.1445,
        lng: typeof item.lng === "number" ? item.lng : 91.7362,
      };

      const { data, error } = await client
        .from("incidents")
        .insert([row])
        .select();

      if (error) {
        console.error("Supabase Database insert error:", error);
        return { data: null, error };
      }

      return { data: data && data[0] ? formatIncidentRow(data[0]) : null, error: null };
    } catch (err) {
      console.error("Database save exception:", err);
      return { data: null, error: err };
    }
  }

  /**
   * Retrieves incident reports from the Supabase 'incidents' table
   * @returns {Promise<{ items: Array, error: any }>}
   */
  async function fetchIncidents() {
    const client = getSupabaseClient();
    if (!client) {
      return { items: [], error: new Error("Supabase is not configured.") };
    }

    try {
      const { data, error } = await client
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Supabase Database fetch error:", error);
        return { items: [], error };
      }

      const items = (data || []).map(formatIncidentRow);
      return { items, error: null };
    } catch (err) {
      console.error("Database fetch exception:", err);
      return { items: [], error: err };
    }
  }

  function formatIncidentRow(row) {
    return {
      id: row.id,
      title: row.title || "Road hazard",
      description: row.description || "",
      photo: row.photo_url || (window.LIVE_PHOTOS ? window.LIVE_PHOTOS.sample1 : ""),
      state: row.state || "Assam",
      place: row.place || "",
      incident_type: row.incident_type || "landslide",
      hazards: row.hazards || [],
      level: row.risk_level || "caution",
      risk_score: row.risk_score || 50,
      reasons: row.reasons || [],
      lat: typeof row.lat === "number" ? row.lat : 26.1445,
      lng: typeof row.lng === "number" ? row.lng : 91.7362,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    };
  }

  /**
   * Subscribes to real-time additions to the 'incidents' table
   * @param {Function} onNewIncident - Callback when an incident is inserted
   */
  function subscribeToIncidents(onNewIncident) {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      if (realtimeChannel) {
        client.removeChannel(realtimeChannel);
      }

      realtimeChannel = client
        .channel("public_incidents_realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "incidents" },
          (payload) => {
            const item = formatIncidentRow(payload.new);
            if (typeof onNewIncident === "function") {
              onNewIncident(item);
            }
          }
        )
        .subscribe();

      return realtimeChannel;
    } catch (err) {
      console.warn("Realtime subscription warning:", err);
      return null;
    }
  }

  /**
   * Deletes an incident by ID from Supabase
   * @param {string|number} id
   */
  async function deleteIncident(id) {
    const client = getSupabaseClient();
    if (!client) return { error: new Error("Supabase is not configured.") };
    try {
      const { error } = await client.from("incidents").delete().eq("id", id);
      if (error) console.warn("Supabase delete warning:", error);
      return { error };
    } catch (err) {
      console.error("Database delete exception:", err);
      return { error: err };
    }
  }

  /**
   * Clears all incidents from Supabase
   */
  async function clearAllIncidents() {
    const client = getSupabaseClient();
    if (!client) return { error: new Error("Supabase is not configured.") };
    try {
      const { error } = await client.from("incidents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) console.warn("Supabase clear warning:", error);
      return { error };
    } catch (err) {
      console.error("Database clear exception:", err);
      return { error: err };
    }
  }

  window.NE8_SUPABASE = {
    isSupabaseConfigured,
    getSupabaseClient,
    uploadPhoto,
    uploadDriverPhoto: uploadPhoto,
    saveIncident,
    saveDriverIncident: saveIncident,
    fetchIncidents,
    fetchDriverIncidents: fetchIncidents,
    deleteIncident,
    clearAllIncidents,
    subscribeToIncidents,
    subscribeToDriverIncidents: subscribeToIncidents,
    formatIncidentRow,
  };
})(window);
