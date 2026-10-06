const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../trip-planner.html'), 'utf8');

// Match text nodes in html body
const bodyMatch = html.match(/<body[\s\S]*<\/body>/i);
if (!bodyMatch) {
  console.log("No body found");
  process.exit(1);
}

const body = bodyMatch[0];

// Find any elements with visible text that don't have data-i18n
const textRegex = />([^<>\n\r\t]+)</g;
let m;
const foundStrings = new Set();
while ((m = textRegex.exec(body)) !== null) {
  const str = m[1].trim();
  if (str && str.length > 1 && !/^[0-9\s.,:\-–—\(\)\/➔\?⚡🌴⛰️🏛️🌊🚢🏭❄️📅🛣️⏱️☕🏨🔍🔊🧭📍🖨️✅⚠️🚨ℹ️]+$/.test(str)) {
    foundStrings.add(str);
  }
}

console.log("Visible text strings in trip-planner.html:");
for (const s of foundStrings) {
  console.log(`- "${s}"`);
}
