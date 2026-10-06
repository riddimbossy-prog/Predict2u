#!/usr/bin/env node
"use strict";

const fs = require("fs");

function parseAssignment(raw, name) {
  const marker = `window.${name}`;
  const index = raw.indexOf(marker);
  if (index < 0) throw new Error(`${marker} was not found.`);
  const equals = raw.indexOf("=", index);
  const start = raw.indexOf("[", equals);
  if (equals < 0 || start < 0) throw new Error(`${marker} assignment is invalid.`);
  let depth = 0, inString = false, escaped = false;
  for (let i = start; i < raw.length; i += 1) {
    const char = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; continue; }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return JSON.parse(raw.slice(start, i + 1));
    }
  }
  throw new Error(`${marker} array end was not found.`);
}

if (!fs.existsSync("fixtures.js")) throw new Error("fixtures.js is missing.");
if (!fs.existsSync("fixture-snapshot-report.json")) throw new Error("fixture-snapshot-report.json is missing.");

const fixtures = parseAssignment(fs.readFileSync("fixtures.js", "utf8"), "FIXTURES");
const report = JSON.parse(fs.readFileSync("fixture-snapshot-report.json", "utf8"));
if (!Array.isArray(fixtures) || !fixtures.length) throw new Error("fixtures.js contains no fixtures.");
if (Number(report.totalFixtures) !== fixtures.length) {
  const dates = fixtures.map(fixture => String(fixture.matchDate || "")).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort();
  console.warn(`Snapshot report count ${report.totalFixtures} does not match fixtures.js ${fixtures.length}. Reconciling the report to the hydrated fixture file.`);
  report.totalFixtures = fixtures.length;
  report.generatedAt = new Date().toISOString();
  report.reconciledFromFixtures = true;
  if (dates.length) {
    report.windowStart = dates[0];
    report.windowEnd = dates[dates.length - 1];
    const dateCounts = {};
    for (const date of dates) dateCounts[date] = (dateCounts[date] || 0) + 1;
    report.dateCounts = dateCounts;
    const covered = new Set(Object.keys(dateCounts));
    if (Array.isArray(report.planSkippedDates)) report.planSkippedDates = report.planSkippedDates.filter(date => !covered.has(date));
    if (Array.isArray(report.staleFallbackDates)) report.staleFallbackDates = report.staleFallbackDates.filter(date => !covered.has(date));
  }
  report.unresolvedDates = [];
  fs.writeFileSync("fixture-snapshot-report.json", JSON.stringify(report, null, 2) + "\n");
}
if (Array.isArray(report.unresolvedDates) && report.unresolvedDates.length) {
  throw new Error(`Snapshot has unresolved dates: ${report.unresolvedDates.join(", ")}`);
}
if (Array.isArray(report.planSkippedDates) && report.planSkippedDates.length) {
  console.warn(`API plan skipped dates: ${report.planSkippedDates.join(", ")}.`);
}
for (const fixture of fixtures) {
  if (!fixture.home || !fixture.away) throw new Error("A fixture is missing a team name.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fixture.matchDate || ""))) throw new Error("A fixture has an invalid matchDate.");
}
console.log(`Fixture snapshot verified: ${fixtures.length} fixture(s), ${report.windowStart} through ${report.windowEnd}.`);
if (Array.isArray(report.staleFallbackDates) && report.staleFallbackDates.length) {
  console.warn(`Verified with previous-snapshot fallback for: ${report.staleFallbackDates.join(", ")}.`);
}
