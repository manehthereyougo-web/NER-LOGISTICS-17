const http = require("http");
const { server } = require("../server.js");

const PORT = 3789;

function postJson(urlPath, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: "localhost",
        port: PORT,
        path: urlPath,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function getJson(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: PORT,
        path: urlPath,
        method: "GET",
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

server.listen(PORT, async () => {
  console.log(`SOS Test Server running on port ${PORT}\n`);
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      process.exitCode = 1;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Nearby Hospital Search
    // -------------------------------------------------------------
    console.log("TEST 1: Nearby Hospital Discovery (Guwahati Area: 26.1445, 91.7362)");
    const hospRes = await postJson("/api/places/nearby", {
      lat: 26.1445,
      lng: 91.7362,
      type: "hospital",
      radius: 25000,
    });

    console.log("hospRes status:", hospRes.status, "data:", hospRes.data || hospRes.raw);
    assert(hospRes.status === 200, `Expected HTTP 200, got ${hospRes.status}`);
    assert(hospRes.data && hospRes.data.success === true, "Response has success: true");
    assert(hospRes.data && hospRes.data.recommended, "Recommended nearest hospital returned");
    if (hospRes.data && hospRes.data.recommended) {
      const rec = hospRes.data.recommended;
      console.log(`    Recommended Hospital: "${rec.name}"`);
      console.log(`    Distance: ${rec.distanceKm} km | ETA: ${rec.drivingTimeStr}`);
      console.log(`    Address: ${rec.address}`);
      console.log(`    Phone: ${rec.phone || "No direct phone listed"}`);
      console.log(`    Provider: ${rec.provider}`);
      assert(typeof rec.distanceKm === "number" && rec.distanceKm >= 0, "DistanceKm is a valid number");
      assert(Boolean(rec.drivingTimeStr), "DrivingTimeStr is present");
      assert(Boolean(rec.googleMapsDirectionsUrl), "Google Maps navigation URL is present");
    }
    assert(Array.isArray(hospRes.data.alternatives), "Alternatives is an array");
    console.log(`    Found ${hospRes.data.alternatives.length} alternative hospitals\n`);

    // -------------------------------------------------------------
    // TEST 2: Nearby Police Station Search
    // -------------------------------------------------------------
    console.log("TEST 2: Nearby Police Station Discovery (Guwahati Area: 26.1445, 91.7362)");
    const polRes = await postJson("/api/places/nearby", {
      lat: 26.1445,
      lng: 91.7362,
      type: "police",
      radius: 25000,
    });

    assert(polRes.status === 200, `Expected HTTP 200, got ${polRes.status}`);
    assert(polRes.data && polRes.data.success === true, "Response has success: true");
    assert(polRes.data && polRes.data.recommended, "Recommended nearest police station returned");
    if (polRes.data && polRes.data.recommended) {
      const rec = polRes.data.recommended;
      console.log(`    Recommended Police: "${rec.name}"`);
      console.log(`    Distance: ${rec.distanceKm} km | ETA: ${rec.drivingTimeStr}`);
      console.log(`    Address: ${rec.address}`);
      console.log(`    Phone: ${rec.phone || "No direct phone listed"}`);
      assert(typeof rec.distanceKm === "number", "Police distance is a valid number");
    }
    console.log(`    Found ${polRes.data.alternatives.length} alternative police stations\n`);

    // -------------------------------------------------------------
    // TEST 3: SOS Incident Lifecycle Recording
    // -------------------------------------------------------------
    console.log("TEST 3: SOS Incident Logging & Status Transitions");
    const testIncidentId = `sos-test-${Date.now()}`;
    const incRes1 = await postJson("/api/sos/incident", {
      incidentId: testIncidentId,
      driverId: "usr-drv-test-99",
      driverName: "S. Roy",
      vehicleNumber: "AS-01-XX-9999",
      emergencyType: "hospital",
      latitude: 26.1445,
      longitude: 91.7362,
      lifecycleState: "SOS_TRIGGERED",
    });

    assert(incRes1.status === 200, `Incident creation HTTP 200, got ${incRes1.status}`);
    assert(incRes1.data && incRes1.data.success === true, "Incident creation success: true");
    assert(incRes1.data.incident.incidentId === testIncidentId, "Incident ID matches");

    // Update incident with facility found
    const incRes2 = await postJson("/api/sos/incident", {
      incidentId: testIncidentId,
      selectedFacility: { name: "City Care Hospital", distanceKm: 3.2 },
      lifecycleState: "FACILITY_FOUND",
    });
    assert(incRes2.data.incident.lifecycleState === "FACILITY_FOUND", "Incident updated to FACILITY_FOUND");

    // Retrieve via GET /api/sos/incidents
    const listRes = await getJson("/api/sos/incidents");
    assert(listRes.status === 200, "GET /api/sos/incidents returns HTTP 200");
    const found = (listRes.data.incidents || []).find((i) => i.incidentId === testIncidentId);
    assert(Boolean(found), "Saved incident found in audit logs\n");

    // -------------------------------------------------------------
    // TEST 4: Truthful Alert Dispatch (Zero Fabrication Test)
    // -------------------------------------------------------------
    console.log("TEST 4: Truthful Alert Dispatch (Never Fakes Delivery)");
    const alertRes = await postJson("/api/sos/alert", {
      incidentId: testIncidentId,
      emergencyType: "hospital",
      driverName: "S. Roy",
      vehicleNumber: "AS-01-XX-9999",
      latitude: 26.1445,
      longitude: 91.7362,
      facilityName: "City Care Hospital",
      alertMessage: "Test emergency alert message",
    });

    assert(alertRes.status === 200, `Alert endpoint HTTP 200, got ${alertRes.status}`);
    // Since ALERT_WEBHOOK_URL is not set in test environment, it MUST return success: false and CHANNEL_UNAVAILABLE
    assert(alertRes.data && alertRes.data.success === false, "Truthful response: success is FALSE when gateway not configured");
    assert(alertRes.data.status === "CHANNEL_UNAVAILABLE", "Status correctly reports CHANNEL_UNAVAILABLE");
    console.log(`    Verified server message: "${alertRes.data.message}"\n`);

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log(`============================================================`);
    console.log(`RESULT: ${passed} / ${total} tests passed successfully!`);
    console.log(`============================================================`);
  } catch (err) {
    console.error("Test execution exception:", err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      process.exit(process.exitCode || 0);
    });
  }
});
