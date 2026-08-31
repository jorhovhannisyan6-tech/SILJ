#!/usr/bin/env node
/**
 * Lightweight production QA runner.
 * It does not modify calculator rules. It reports discovered regression fixtures.
 */
import fs from "node:fs";
import path from "node:path";

const roots = ["tests", "test", "__tests__", "fixtures"];

const found = [];
for (const root of roots) {
  const dir = path.join(process.cwd(), root);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir, {recursive: true})) {
    if (typeof file === "string" && /\.(json|csv)$/i.test(file)) {
      found.push(path.join(root, file));
    }
  }
}
console.log(`Regression fixtures discovered: ${found.length}`);
for (const f of found) console.log(`- ${f}`);
console.log("No insurance rule was changed by this QA runner.");
