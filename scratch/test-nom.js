const https = require("https");
const lat = 26.1445, lng = 91.7362;
const d = 0.2;
const url = `https://nominatim.openstreetmap.org/search?format=json&q=police&viewbox=${lng - d},${lat + d},${lng + d},${lat - d}&bounded=1&limit=10&countrycodes=in`;

https.get(url, { headers: { "User-Agent": "SafeRoute-SOS-Testing/1.0" } }, (res) => {
  let body = "";
  res.on("data", (c) => (body += c));
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    const data = JSON.parse(body);
    console.log("Count:", data.length);
    if (data[0]) {
      console.log("First police station:", data[0].display_name, "Lat:", data[0].lat, "Lon:", data[0].lon);
    }
  });
});

