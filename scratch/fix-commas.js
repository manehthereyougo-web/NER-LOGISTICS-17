const fs = require("fs");
const path = require("path");

const i18nPath = path.join(__dirname, "..", "js", "i18n.js");
let content = fs.readFileSync(i18nPath, "utf8");

// Any line before "freight_engine_badge" or other inserted keys that ends with "quote but no comma
content = content.replace(/("btn_sos":\s*"[^"]+")(\r?\n\s*"[a-zA-Z0-9_]+":)/g, '$1,$2');

// Also remove trailing comma before } if any
content = content.replace(/,(\r?\n\s*})/g, '$1');

fs.writeFileSync(i18nPath, content, "utf8");
console.log("Fixed commas in i18n.js!");
