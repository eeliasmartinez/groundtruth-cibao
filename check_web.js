// Proves that the web page (web/engine.js) calculates exactly like the Python
// engine (rotation.py). Run with:  node check_web.js
// build_web.py writes the sample scenarios and the Python answers.
const fs = require("fs");
const path = require("path");

global.window = {};
require("./web/data.js");
const data = global.window.GT_DATA;
const engine = require("./web/engine.js");
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, "web", "test_cases.json"), "utf8"));

let compared = 0;
let failed = 0;

function same(a, b, where) {
  compared += 1;
  if (typeof a === "number" && typeof b === "number") {
    if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(a), Math.abs(b))) {
      failed += 1;
      console.log("DIFFERENT", where, a, b);
    }
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      failed += 1;
      console.log("DIFFERENT length", where, JSON.stringify(a), JSON.stringify(b));
      return;
    }
    a.forEach((item, i) => same(item, b[i], `${where}[${i}]`));
  } else if (a && b && typeof a === "object" && typeof b === "object") {
    Object.keys(b).forEach((key) => same(a[key], b[key], `${where}.${key}`));
  } else if (a !== b) {
    failed += 1;
    console.log("DIFFERENT", where, a, b);
  }
}

cases.compare.forEach((item, index) => {
  const s = item.scenario;
  const result = engine.compare(
    data, data.needs[s.key], s.soil, s.area, s.allocation, s.priority, s.rice_allowed, s.salty
  );
  same(result.budget_m3, item.budget_m3, `case ${index} budget`);
  same(result.ranked, item.strategies, `case ${index} (${s.key})`);
});

cases.basin.forEach((item, index) => {
  const result = engine.basinSavings(data, item.basin, item.rice, item.other, item.share);
  same(result, item.expected, `basin ${index}`);
});

console.log(`${cases.compare.length + cases.basin.length} scenarios, ${compared} values compared, ${failed} different`);
process.exit(failed ? 1 : 0);
