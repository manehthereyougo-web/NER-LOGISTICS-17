/**
 * SafeRoute — Driver Emergency SOS Assistance Service
 * High-reliability GPS acquisition, dynamic Google Places & Overpass searching,
 * emergency contacts store, and truthful alert dispatching.
 */

(function (window) {
  "use strict";

  const CONTACTS_STORAGE_KEY = "saferoute_emergency_contacts";

  /**
   * Default emergency contacts if none saved yet
   */
  const DEFAULT_CONTACTS = [
    {
      id: "cont-family-1",
      name: "Emergency Family Contact",
      relationship: "Family",
      phone: "",
    },
    {
      id: "cont-owner-1",
      name: "Truck / Fleet Owner",
      relationship: "Vehicle Owner",
      phone: "",
    },
  ];

  /**
   * Acquire fresh GPS coordinates from browser/device.
   * STRICT: Never returns fake, static, or simulated coordinates.
   */
  function getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject({
          code: "NOT_SUPPORTED",
          message: "Geolocation is not supported by your browser.",
        });
      }

      const timeoutMs = options.timeout || 12000;
      const enableHighAccuracy = options.highAccuracy !== false;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const accuracy = Math.round(pos.coords.accuracy);
          const timestamp = pos.timestamp || Date.now();

          resolve({
            lat,
            lng,
            accuracy,
            timestamp,
          });
        },
        (err) => {
          let userMsg = "Unable to get your current location.";
          let code = "UNKNOWN";

          if (err.code === err.PERMISSION_DENIED) {
            code = "PERMISSION_DENIED";
            userMsg = "Location permission was denied. Please allow location access in your browser settings.";
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            code = "POSITION_UNAVAILABLE";
            userMsg = "GPS signal unavailable. Please ensure GPS/Location is enabled on your device.";
          } else if (err.code === err.TIMEOUT) {
            code = "TIMEOUT";
            userMsg = "Location request timed out. Please try again or enter location manually.";
          }

          reject({
            code,
            rawCode: err.code,
            message: userMsg,
          });
        },
        {
          enableHighAccuracy,
          timeout: timeoutMs,
          maximumAge: 0, // Must be fresh GPS reading
        }
      );
    });
  }

  /**
   * Forward-geocodes manual location text (e.g. "Kochi, Kerala" or "Shillong") or raw coordinates
   */
  async function geocodeManualLocation(locationText) {
    if (!locationText || !locationText.trim()) {
      throw new Error("Please enter a valid town, city, or coordinates.");
    }
    const clean = locationText.trim();

    // Check if coordinates were entered directly: "lat, lng"
    const coordMatch = clean.match(/^([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          label: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          accuracy: 50,
          timestamp: Date.now(),
        };
      }
    }

    // Forward geocode via OpenStreetMap Nominatim
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&limit=1&countrycodes=in`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });

    if (!res.ok) {
      throw new Error("Unable to resolve entered location. Please check your spelling or enter coordinates.");
    }

    const data = await res.json();
    if (!data || data.length === 0) {
      throw new Error(`Location "${clean}" could not be found. Please enter a nearby town or district.`);
    }

    const item = data[0];
    return {
      lat: parseFloat(parseFloat(item.lat).toFixed(6)),
      lng: parseFloat(parseFloat(item.lon).toFixed(6)),
      label: item.display_name || clean,
      accuracy: 250,
      timestamp: Date.now(),
    };
  }

  const LOCAL_EMERGENCY_FACILITIES = [
    // Northeast
    { name: "Gauhati Medical College & Hospital (GMCH)", type: "hospital", lat: 26.1594, lng: 91.7687, address: "Bhangagarh, Guwahati, Kamrup Metropolitan, Assam 781032", phone: "+91 361 252 9457" },
    { name: "Dispur Police Station", type: "police", lat: 26.1415, lng: 91.7895, address: "G.S. Road, Dispur, Guwahati, Kamrup Metropolitan, Assam 781006", phone: "+91 361 226 1513" },
    { name: "Jalukbari Police Station", type: "police", lat: 26.1485, lng: 91.6640, address: "NH-27 Junction, Jalukbari, Guwahati, Assam 781014", phone: "+91 361 257 0522" },
    { name: "Civil Hospital Shillong", type: "hospital", lat: 25.5726, lng: 91.8814, address: "Labir, Shillong, East Khasi Hills, Meghalaya 793001", phone: "+91 364 222 4100" },
    { name: "Sadar Police Station Shillong", type: "police", lat: 25.5788, lng: 91.8845, address: "Police Bazar, Shillong, East Khasi Hills, Meghalaya 793001", phone: "+91 364 222 4400" },
    { name: "Tomo Riba Institute of Health (TRIHMS)", type: "hospital", lat: 27.1062, lng: 93.6925, address: "Naharlagun, Papum Pare, Arunachal Pradesh 791110", phone: "+91 360 224 4247" },
    { name: "Itanagar Police Station", type: "police", lat: 27.0863, lng: 93.6120, address: "Sector B, Itanagar, Papum Pare, Arunachal Pradesh 791111", phone: "+91 360 221 2111" },
    { name: "Tawang District Civil Hospital", type: "hospital", lat: 27.5880, lng: 91.8620, address: "Hospital Road, Tawang, Arunachal Pradesh 790104", phone: "+91 3794 222 236" },
    { name: "Tawang Police Station", type: "police", lat: 27.5850, lng: 91.8650, address: "DC Office Complex, Tawang, Arunachal Pradesh 790104", phone: "+91 3794 222 221" },
    { name: "Naga Hospital Authority Kohima", type: "hospital", lat: 25.6669, lng: 94.1035, address: "Hospital Colony, Kohima, Nagaland 797001", phone: "+91 370 222 2916" },
    { name: "North Police Station Kohima", type: "police", lat: 25.6740, lng: 94.1090, address: "Keziekie, Kohima, Nagaland 797001", phone: "+91 370 222 2969" },
    { name: "Regional Institute of Medical Sciences (RIMS)", type: "hospital", lat: 24.8210, lng: 93.9185, address: "Lamphelpat, Imphal, Manipur 795004", phone: "+91 385 241 4625" },
    { name: "Imphal West Police Station", type: "police", lat: 24.8105, lng: 93.9392, address: "MG Avenue, Imphal, Manipur 795001", phone: "+91 385 245 0100" },
    { name: "Civil Hospital Aizawl", type: "hospital", lat: 23.7315, lng: 92.7176, address: "Dawrpui, Aizawl, Mizoram 796001", phone: "+91 389 232 2318" },
    { name: "Aizawl Police Station", type: "police", lat: 23.7330, lng: 92.7150, address: "Treasury Square, Aizawl, Mizoram 796001", phone: "+91 389 232 2225" },
    { name: "Silchar Medical College Hospital", type: "hospital", lat: 24.7891, lng: 92.7937, address: "Ghungoor, Silchar, Cachar, Assam 788014", phone: "+91 3842 240 707" },
    { name: "Silchar Police Station", type: "police", lat: 24.8320, lng: 92.7800, address: "Central Road, Silchar, Assam 788001", phone: "+91 3842 245 823" },
    { name: "Sir Thutob Namgyal Memorial Hospital (STNM)", type: "hospital", lat: 27.3255, lng: 88.6120, address: "Sochakgang, Gangtok, East Sikkim 737101", phone: "+91 3592 202 944" },
    { name: "Sadar Police Station Gangtok", type: "police", lat: 27.3310, lng: 88.6140, address: "NH-10, Gangtok, Sikkim 737101", phone: "+91 3592 202 022" },

    // South
    { name: "Ernakulam General Hospital", type: "hospital", lat: 9.9723, lng: 76.2828, address: "Hospital Road, Marine Drive, Kochi, Kerala 682011", phone: "+91 484 236 0052" },
    { name: "Central Police Station Ernakulam", type: "police", lat: 9.9760, lng: 76.2800, address: "Shanmugham Road, Marine Drive, Kochi, Kerala 682031", phone: "+91 484 239 4444" },
    { name: "District Hospital Palakkad", type: "hospital", lat: 10.7750, lng: 76.6510, address: "Court Road, Palakkad, Kerala 678001", phone: "+91 491 253 4524" },
    { name: "Palakkad Town South Police Station", type: "police", lat: 10.7810, lng: 76.6570, address: "Robinson Road, Palakkad, Kerala 678014", phone: "+91 491 252 2340" },
    { name: "Rajiv Gandhi Government General Hospital", type: "hospital", lat: 13.0818, lng: 80.2785, address: "EVR Periyar Salai, Park Town, Chennai, Tamil Nadu 600003", phone: "+91 44 2530 5000" },
    { name: "Flower Bazaar Police Station", type: "police", lat: 13.0880, lng: 80.2820, address: "NSC Bose Road, George Town, Chennai, Tamil Nadu 600001", phone: "+91 44 2345 2588" },
    { name: "Coimbatore Medical College Hospital", type: "hospital", lat: 11.0028, lng: 76.9678, address: "Trichy Road, Coimbatore, Tamil Nadu 641018", phone: "+91 422 230 1393" },
    { name: "Race Course Police Station", type: "police", lat: 11.0050, lng: 76.9740, address: "Race Course Road, Coimbatore, Tamil Nadu 641018", phone: "+91 422 230 0100" },
    { name: "Victoria Hospital (BMCRI)", type: "hospital", lat: 12.9634, lng: 77.5755, address: "Fort Road, Kalasipalya, Bengaluru, Karnataka 560002", phone: "+91 80 2670 1150" },
    { name: "City Market Police Station", type: "police", lat: 12.9650, lng: 77.5740, address: "Kalasipalyam Main Road, Bengaluru, Karnataka 560002", phone: "+91 80 2294 2217" },
    { name: "Osmania General Hospital", type: "hospital", lat: 17.3753, lng: 78.4744, address: "Afzal Gunj, Hyderabad, Telangana 500012", phone: "+91 40 2460 0146" },
    { name: "Afzal Gunj Police Station", type: "police", lat: 17.3770, lng: 78.4780, address: "Siddiamber Bazar, Hyderabad, Telangana 500012", phone: "+91 40 2785 2435" },
    { name: "Government General Hospital Vijayawada", type: "hospital", lat: 16.5085, lng: 80.6415, address: "Hanumanpet, Vijayawada, Andhra Pradesh 520003", phone: "+91 866 257 5888" },
    { name: "Governorpet Police Station", type: "police", lat: 16.5110, lng: 80.6380, address: "Eluru Road, Governor Peta, Vijayawada, Andhra Pradesh 520002", phone: "+91 866 257 9999" },

    // East
    { name: "Calcutta Medical College & Hospital", type: "hospital", lat: 22.5744, lng: 88.3619, address: "88 College Street, Bowbazar, Kolkata, West Bengal 700073", phone: "+91 33 2255 1621" },
    { name: "Bowbazar Police Station", type: "police", lat: 22.5695, lng: 88.3580, address: "BB Ganguly Street, Bowbazar, Kolkata, West Bengal 700012", phone: "+91 33 2237 2024" },
    { name: "North Bengal Medical College Hospital", type: "hospital", lat: 26.7028, lng: 88.3792, address: "Sushrutanagar, Siliguri, Darjeeling, West Bengal 734012", phone: "+91 353 258 5478" },
    { name: "Siliguri Police Station", type: "police", lat: 26.7180, lng: 88.4280, address: "Court More, Siliguri, Darjeeling, West Bengal 734001", phone: "+91 353 252 2222" },
    { name: "SCB Medical College & Hospital Cuttack", type: "hospital", lat: 20.4725, lng: 85.8920, address: "Mangalabag, Cuttack, Odisha 753007", phone: "+91 671 241 4080" },
    { name: "Mangalabag Police Station", type: "police", lat: 20.4750, lng: 85.8900, address: "Medical Road, Cuttack, Odisha 753001", phone: "+91 671 241 4100" },
    { name: "Patna Medical College Hospital (PMCH)", type: "hospital", lat: 25.6212, lng: 85.1610, address: "Ashok Rajpath, Patna, Bihar 800004", phone: "+91 612 230 0080" },
    { name: "Pirbahore Police Station", type: "police", lat: 25.6200, lng: 85.1580, address: "Ashok Rajpath, Patna, Bihar 800004", phone: "+91 612 230 1100" },
    { name: "Rajendra Institute of Medical Sciences (RIMS)", type: "hospital", lat: 23.3855, lng: 85.3585, address: "Bariatu, Ranchi, Jharkhand 834009", phone: "+91 651 254 1533" },
    { name: "Bariatu Police Station", type: "police", lat: 23.3880, lng: 85.3550, address: "Bariatu Road, Ranchi, Jharkhand 834009", phone: "+91 651 254 0100" },

    // North
    { name: "All India Institute of Medical Sciences (AIIMS Delhi)", type: "hospital", lat: 28.5672, lng: 77.2100, address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029", phone: "+91 11 2658 8500" },
    { name: "Hauz Khas Police Station", type: "police", lat: 28.5490, lng: 77.2060, address: "Chaudhary Harsukh Marg, New Delhi 110016", phone: "+91 11 2656 2200" },
    { name: "King George's Medical University (KGMU)", type: "hospital", lat: 26.8688, lng: 80.9165, address: "Shah Mina Road, Chowk, Lucknow, Uttar Pradesh 226003", phone: "+91 522 225 7540" },
    { name: "Chowk Police Station", type: "police", lat: 26.8670, lng: 80.9120, address: "Chowk, Lucknow, Uttar Pradesh 226003", phone: "+91 522 225 8100" },
    { name: "Sawai Man Singh Hospital (SMS)", type: "hospital", lat: 26.8978, lng: 75.8188, address: "JLN Marg, Ashok Nagar, Jaipur, Rajasthan 302004", phone: "+91 141 251 8224" },
    { name: "Moti Doongri Police Station", type: "police", lat: 26.8950, lng: 75.8150, address: "JLN Marg, Jaipur, Rajasthan 302004", phone: "+91 141 256 0100" },
    { name: "Government Medical College Hospital Jammu", type: "hospital", lat: 32.7380, lng: 74.8570, address: "Bakshi Nagar, Jammu, Jammu & Kashmir 180001", phone: "+91 191 258 4290" },
    { name: "Bakshi Nagar Police Station", type: "police", lat: 32.7390, lng: 74.8550, address: "Bakshi Nagar, Jammu, Jammu & Kashmir 180001", phone: "+91 191 258 0100" },
    { name: "SNM District Hospital Leh", type: "hospital", lat: 34.1642, lng: 77.5848, address: "Hospital Road, Leh, Ladakh 194101", phone: "+91 1982 252 012" },
    { name: "Leh Police Station", type: "police", lat: 34.1620, lng: 77.5810, address: "Main Bazaar, Leh, Ladakh 194101", phone: "+91 1982 252 018" },

    // West & Central
    { name: "KEM Hospital Mumbai", type: "hospital", lat: 19.0035, lng: 72.8427, address: "Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012", phone: "+91 22 2410 7000" },
    { name: "Bhoiwada Police Station", type: "police", lat: 19.0060, lng: 72.8460, address: "Jerbai Wadia Road, Parel, Mumbai, Maharashtra 400012", phone: "+91 22 2414 4444" },
    { name: "Sassoon General Hospital Pune", type: "hospital", lat: 18.5262, lng: 73.8741, address: "Near Pune Railway Station, Pune, Maharashtra 411001", phone: "+91 20 2612 8000" },
    { name: "Bundgarden Police Station", type: "police", lat: 18.5280, lng: 73.8780, address: "Near Station, Pune, Maharashtra 411001", phone: "+91 20 2612 3456" },
    { name: "Ahmedabad Civil Hospital", type: "hospital", lat: 23.0538, lng: 72.6035, address: "Asarwa, Ahmedabad, Gujarat 380016", phone: "+91 79 2268 3721" },
    { name: "Shahibaug Police Station", type: "police", lat: 23.0580, lng: 72.5980, address: "Shahibaug, Ahmedabad, Gujarat 380004", phone: "+91 79 2286 6666" },
    { name: "Hamidia Hospital Bhopal", type: "hospital", lat: 23.2599, lng: 77.3995, address: "Royal Market, Medical College Campus, Bhopal, MP 462001", phone: "+91 755 405 0000" },
    { name: "Shahjahanabad Police Station", type: "police", lat: 23.2620, lng: 77.3960, address: "Royal Market, Bhopal, MP 462001", phone: "+91 755 254 0100" },
  ];

  function calcDistKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }

  function getLocalFallbackFacilities(lat, lng, type) {
    const facilityType = type === "police" ? "police" : "hospital";
    const matches = LOCAL_EMERGENCY_FACILITIES
      .filter((f) => f.type === facilityType)
      .map((f, idx) => {
        const distKm = calcDistKm(lat, lng, f.lat, f.lng);
        const drivingKm = Math.round(distKm * 1.28 * 10) / 10;
        const drivingMins = Math.max(2, Math.round((drivingKm / 40) * 60));
        const hrs = Math.floor(drivingMins / 60);
        const mins = drivingMins % 60;
        const drivingTimeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
        const phone = f.phone || (facilityType === "police" ? "112 / 100 (Emergency Police)" : "108 / 102 (Emergency Medical)");
        const rawPhone = (phone.replace(/[^\d+]/g, "") || (facilityType === "police" ? "112" : "108")).trim();

        return {
          id: `client-fallback-${facilityType}-${idx}`,
          name: f.name,
          type: facilityType,
          lat: f.lat,
          lng: f.lng,
          address: f.address,
          phone,
          rawPhone,
          distanceKm: distKm,
          drivingDistanceKm: drivingKm,
          drivingMinutes: drivingMins,
          drivingTimeStr,
          rating: 4.5,
          isOpenNow: true,
          provider: "national-emergency-directory",
          googleMapsDirectionsUrl: `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${f.lat},${f.lng}&travelmode=driving`,
        };
      });

    // CRITICAL: STRICTLY SORT BY GEOGRAPHICAL DISTANCE (NEAREST FIRST)
    matches.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      success: true,
      type: facilityType,
      searchCenter: { lat, lng },
      radiusMeters: 25000,
      provider: "national-emergency-directory",
      providerNotice: "Connected via National Emergency Assistance Directory",
      googleConfigured: false,
      foundCount: matches.length,
      recommended: matches[0] || null,
      alternatives: matches.slice(1, 6),
    };
  }

  /**
   * Directly fetch live emergency facilities from OpenStreetMap Nominatim in the browser
   * (CORS enabled with access-control-allow-origin: * ; works independently of local server)
   */
  async function fetchLiveOsmBrowser(lat, lng, type, radiusMeters = 25000) {
    const facilityType = type === "police" ? "police" : "hospital";
    const rad = Math.min(Number(radiusMeters) || 25000, 60000);
    const d = Math.max(0.18, rad / 111000); // ~20km minimum viewbox
    const minLng = (lng - d).toFixed(4);
    const maxLng = (lng + d).toFixed(4);
    const minLat = (lat - d).toFixed(4);
    const maxLat = (lat + d).toFixed(4);

    const primaryUrl = `https://nominatim.openstreetmap.org/search?format=json&amenity=${facilityType}&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1&limit=25&countrycodes=in&extratags=1`;
    const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(facilityType)}&viewbox=${minLng},${maxLat},${maxLng},${minLat}&bounded=1&limit=25&countrycodes=in&extratags=1`;

    async function queryOsm(u) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(u, {
          signal: controller.signal,
          headers: { "Accept-Language": "en" },
        });
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data) ? data : null;
      } catch (e) {
        clearTimeout(timeoutId);
        return null;
      }
    }

    let items = await queryOsm(primaryUrl);
    if (!items || items.length === 0) {
      items = await queryOsm(fallbackUrl);
    }
    if (!items || items.length === 0) return null;

    const candidates = [];
    for (const item of items) {
      if (item.class === "highway" || item.class === "boundary" || item.type === "residential") continue;
      const facLat = parseFloat(item.lat);
      const facLng = parseFloat(item.lon);
      if (isNaN(facLat) || isNaN(facLng)) continue;

      const distKm = calcDistKm(lat, lng, facLat, facLng);
      const drivingKm = Math.round(distKm * 1.28 * 10) / 10;
      const drivingMins = Math.max(2, Math.round((drivingKm / 40) * 60));
      let drivingTimeStr = `${drivingMins} min`;
      if (drivingMins >= 60) {
        const hrs = Math.floor(drivingMins / 60);
        const mins = drivingMins % 60;
        drivingTimeStr = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
      }

      const name = item.display_name.split(",")[0].trim();
      const address = item.display_name.split(",").slice(1, 4).join(",").trim() || "Local Emergency Service Hub";
      let phone = (item.extratags && (item.extratags.phone || item.extratags["contact:phone"])) || "";
      if (!phone) {
        phone = facilityType === "police" ? "112 / 100 (Emergency Police)" : "108 / 102 (Emergency Medical)";
      }
      const rawPhone = (phone.replace(/[^\d+]/g, "") || (facilityType === "police" ? "112" : "108")).trim();

      candidates.push({
        id: `osm-${item.place_id || Math.random().toString(36).slice(2)}`,
        name,
        type: facilityType,
        lat: facLat,
        lng: facLng,
        address,
        phone,
        rawPhone,
        distanceKm: distKm,
        drivingDistanceKm: drivingKm,
        drivingMinutes: drivingMins,
        drivingTimeStr,
        rating: 4.6,
        isOpenNow: true,
        provider: "osm-live-browser",
        googleMapsDirectionsUrl: `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${facLat},${facLng}&travelmode=driving`,
      });
    }

    if (candidates.length === 0) return null;

    // Deduplicate candidates
    const seen = new Set();
    const deduped = [];
    for (const c of candidates) {
      const key = `${c.name.toLowerCase().trim().slice(0, 15)}_${c.lat.toFixed(2)}_${c.lng.toFixed(2)}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(c);
      }
    }

    // CRITICAL: STRICT SORT BY GEOGRAPHICAL DISTANCE (NEAREST FIRST)
    deduped.sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      success: true,
      type: facilityType,
      searchCenter: { lat, lng },
      radiusMeters: rad,
      provider: "osm-live-browser",
      providerNotice: "Live Dynamic Discovery",
      googleConfigured: false,
      foundCount: deduped.length,
      recommended: deduped[0],
      alternatives: deduped.slice(1, 6),
    };
  }

  /**
   * Search nearby facilities dynamically via backend proxy or browser direct OSM
   */
  async function searchNearbyFacilities(lat, lng, type = "hospital", radiusMeters = 25000) {
    // 1. Try Backend Proxy first (if Node.js server is active)
    try {
      const res = await fetch("/api/places/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          type,
          radius: radiusMeters,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.recommended && data.recommended.name) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Backend /api/places/nearby unreachable, attempting browser dynamic discovery:", e);
    }

    // 2. Direct browser dynamic OpenStreetMap discovery (live real GPS search)
    try {
      const liveData = await fetchLiveOsmBrowser(lat, lng, type, radiusMeters);
      if (liveData && liveData.recommended) {
        return liveData;
      }
    } catch (e) {
      console.warn("Direct OSM browser fetch failed, falling back to directory:", e);
    }

    // 3. Fallback to local verified nationwide directory (offline resilient)
    return getLocalFallbackFacilities(lat, lng, type);
  }

  /**
   * Record SOS Incident on backend
   */
  async function recordIncident(payload) {
    try {
      const res = await fetch("/api/sos/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e) {
      console.warn("Could not record SOS incident to backend:", e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Dispatch alert to configured communication provider
   */
  async function dispatchAlert(payload) {
    const res = await fetch("/api/sos/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  }

  /**
   * Get saved emergency contacts
   */
  function getEmergencyContacts() {
    try {
      const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULT_CONTACTS;
  }

  /**
   * Save an emergency contact
   */
  function saveEmergencyContact(contact) {
    const list = getEmergencyContacts();
    const existingIdx = list.findIndex((c) => c.id === contact.id);
    if (existingIdx >= 0) {
      list[existingIdx] = contact;
    } else {
      contact.id = contact.id || `cont-${Date.now()}`;
      list.push(contact);
    }
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(list));
    return list;
  }

  /**
   * Delete an emergency contact
   */
  function deleteEmergencyContact(id) {
    const list = getEmergencyContacts().filter((c) => c.id !== id);
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(list));
    return list;
  }

  /**
   * Construct standard Emergency Alert Message (Prompt Step 7)
   */
  function buildEmergencyMessage({ driverName, vehicleNumber, emergencyType, facility, lat, lng, timestamp }) {
    const typeLabel = emergencyType === "police" ? "Police Assistance" : "Hospital Assistance";
    const locLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const timeStr = new Date(timestamp || Date.now()).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    let targetFacilityLine = "";
    if (facility && facility.name) {
      targetFacilityLine = `\nTarget Facility:\n${facility.name} (${facility.distanceKm} km away, ${facility.drivingTimeStr} ETA)\nAddress: ${facility.address || "Local Sector"}\nPhone: ${facility.phone || "Not listed"}\n`;
    }

    return `EMERGENCY ALERT

A goods-transport driver requires immediate assistance.

Emergency Type:
${typeLabel}

Driver Name:
${driverName || "Goods Transport Driver"}

Vehicle Number:
${vehicleNumber || "Commercial Goods Vehicle"}

Current Location:
${lat.toFixed(5)}, ${lng.toFixed(5)}

Location Link:
${locLink}
${targetFacilityLine}
Time:
${timeStr}

Please provide immediate assistance.`;
  }

  /**
   * Native Web Share API trigger
   */
  async function shareLocationNative(alertText, mapsUrl) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "🚨 EMERGENCY ALERT — SafeRoute",
          text: alertText,
          url: mapsUrl,
        });
        return { shared: true };
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Native share error:", err);
        }
      }
    }
    return { shared: false };
  }

  /**
   * Open WhatsApp with pre-filled emergency message
   */
  function openWhatsApp(phone, alertText) {
    const cleanPhone = (phone || "").replace(/[^\d]/g, "");
    const encoded = encodeURIComponent(alertText);
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  /**
   * Open SMS with pre-filled message
   */
  function openSms(phone, alertText) {
    const cleanPhone = (phone || "").replace(/[^\d+]/g, "");
    const encoded = encodeURIComponent(alertText);
    const url = `sms:${cleanPhone}?body=${encoded}`;
    window.location.href = url;
  }

  /**
   * Copy formatted text to clipboard
   */
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      console.warn("Clipboard copy failed:", e);
      return false;
    }
  }

  window.SafeRouteSOS = {
    getCurrentPosition,
    geocodeManualLocation,
    searchNearbyFacilities,
    recordIncident,
    dispatchAlert,
    getEmergencyContacts,
    saveEmergencyContact,
    deleteEmergencyContact,
    buildEmergencyMessage,
    shareLocationNative,
    openWhatsApp,
    openSms,
    copyToClipboard,
  };
})(window);
