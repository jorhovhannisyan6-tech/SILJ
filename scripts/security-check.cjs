#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const forbidden = [
  "GEMINI_API_KEY=",
  "SIL_ADMIN_PASSWORD=",
  "AIza"
];
const roots = ["src", "server", "app", "pages"];
const hits = [];
function scan(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) scan(p);
    else if (/\.(js|jsx|ts|tsx|json)$/i.test(ent.name)) {
      const s = fs.readFileSync(p, "utf8");
      for (const needle of forbidden) if (s.includes(needle)) hits.push(`${p}: ${needle}`);
    }
  }
}
for (const r of roots) scan(path.join(process.cwd(), r));
if (hits.length) {
  console.error("Potential secret exposure detected:");
  for (const h of hits) console.error(h);
  process.exit(1);
}
console.log("Secret exposure scan: PASS");
