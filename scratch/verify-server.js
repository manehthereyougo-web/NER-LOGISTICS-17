const http = require("http");
const { server } = require("../server.js");

const PORT = 3456;

server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);

  const endpoints = [
    { url: "/", expectedStatus: 200 },
    { url: "/index.html", expectedStatus: 200 },
    { url: "/trip-planner.html", expectedStatus: 200 },
    { url: "/driver.html", expectedStatus: 200 },
    { url: "/routes.html", expectedStatus: 302 },
    { url: "/logistics.html", expectedStatus: 200 },
    { url: "/js/services/trip-planner-engine.js", expectedStatus: 200 }
  ];

  let completed = 0;

  endpoints.forEach(({ url, expectedStatus }) => {
    http.get(`http://localhost:${PORT}${url}`, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        console.log(`[HTTP ${res.statusCode}] ${url} (Expected: ${expectedStatus}, Location: ${res.headers.location || 'none'})`);
        if (res.statusCode !== expectedStatus) {
          console.error(`ERROR: Expected ${expectedStatus} for ${url}, got ${res.statusCode}`);
          process.exit(1);
        }
        completed++;
        if (completed === endpoints.length) {
          console.log("\nALL SERVER ENDPOINTS VERIFIED SUCCESSFULLY!");
          server.close(() => {
            process.exit(0);
          });
        }
      });
    }).on("error", (err) => {
      console.error(`Request error on ${url}:`, err);
      process.exit(1);
    });
  });
});
