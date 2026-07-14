#!/usr/bin/env node
"use strict";

/**
 * Predict2U v246 seven-day report publisher.
 * Creates week-fixture-report.json from the merged data.js file and uses
 * matchDate with a kickoff-date fallback.
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data.js");
const REPORT_FILE = path.join(ROOT, "week-fixture-report.json");
const COVERAGE_FILE = path.join(ROOT, "fixture-coverage-report.json");
const DISCOVERY_FILE = path.join(ROOT, "all-games-discovery.json");

function utcDate(offsetDays = 0) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function matchDateOf(item) {
  const direct = String(item && item.matchDate || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
  const kickoff = String(item && item.kickoff || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(kickoff) ? kickoff : "";
}

function parseMatches(raw) {
  const marker = "window.MATCHES";
  const markerIndex = raw.indexOf(marker);
  if (markerIndex < 0) throw new Error("window.MATCHES was not found in data.js");
  const equalsIndex = raw.indexOf("=", markerIndex);
  if (equalsIndex < 0) throw new Error("window.MATCHES assignment is invalid");
  const start = raw.indexOf("[", equalsIndex);
  if (start < 0) throw new Error("window.MATCHES array start was not found");

  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;

  for (let index = start; index < raw.length; index += 1) {
    const character = raw[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === "[") depth += 1;
    if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }

  if (end < 0) throw new Error("window.MATCHES array end was not found");
  const rows = JSON.parse(raw.slice(start, end));
  if (!Array.isArray(rows)) throw new Error("window.MATCHES is not an array");
  return rows;
}

function readJsonIfPresent(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    console.warn(`Could not read ${path.basename(file)}: ${error.message}`);
    return null;
  }
}

function main() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error("Missing data.js. Merge the fixture shards before verification.");
  }

  const matches = parseMatches(fs.readFileSync(DATA_FILE, "utf8"));
  const dates = Array.from({ length: 7 }, (_, index) => utcDate(index));
  const rows = dates.map((date) => {
    const dayMatches = matches.filter((item) => matchDateOf(item) === date);
    return {
      date,
      games: dayMatches.length,
      leagues: new Set(dayMatches.map((item) => item && item.league).filter(Boolean)).size,
      enriched: dayMatches.filter((item) => item && item.enrichmentStatus === "enriched").length,
      fixtureOnly: dayMatches.filter((item) => item && (item.fixtureOnly === true || item.enrichmentStatus === "fixture-only")).length,
      upcoming: dayMatches.filter((item) => item && item.homeGoals == null && item.awayGoals == null).length,
      live: dayMatches.filter((item) => item && ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(String(item.status || "").toUpperCase())).length,
      finished: dayMatches.filter((item) => item && ["FT", "AET", "PEN"].includes(String(item.status || "").toUpperCase())).length
    };
  });

  const coverage = readJsonIfPresent(COVERAGE_FILE);
  const discovery = readJsonIfPresent(DISCOVERY_FILE);
  const report = {
    generatedAt: new Date().toISOString(),
    windowStart: dates[0],
    windowEnd: dates[dates.length - 1],
    totalSavedMatches: matches.length,
    totalGamesInWindow: rows.reduce((sum, row) => sum + row.games, 0),
    daysWithGames: rows.filter((row) => row.games > 0).length,
    daysWithoutGames: rows.filter((row) => row.games === 0).map((row) => row.date),
    discoveryFixtureCount: discovery && Number(discovery.fixtureCount || 0) || null,
    coveragePercent: coverage && Number(coverage.finalCoveragePercent || 0) || null,
    dates: rows
  };

  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("Predict2U seven-day fixture report");
  console.log("---------------------------------");
  for (const row of rows) {
    console.log(`${row.date}: ${row.games} game(s), ${row.leagues} league(s), ${row.enriched} enriched, ${row.fixtureOnly} fixture-only`);
  }
  console.log(`Report written to ${path.basename(REPORT_FILE)}.`);
}

try {
  main();
} catch (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
}
