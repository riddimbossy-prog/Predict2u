"use strict";

const fs = require("fs");
const path = require("path");

const HERE = __dirname;
const DATA_FILE = path.join(HERE, "data.js");
const REPORT_FILE = path.join(HERE, "week-fixture-report.json");
const DISCOVERY_FILE = path.join(HERE, "all-games-discovery.json");

function utcDate(offsetDays = 0) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function parseMatches(raw) {
  const match = raw.match(/window\.MATCHES\s*=\s*(\[[\s\S]*\]);?\s*$/m);
  if (!match) throw new Error("Could not parse window.MATCHES from data.js");
  const rows = JSON.parse(match[1]);
  if (!Array.isArray(rows)) throw new Error("window.MATCHES is not an array");
  return rows;
}

function dateOf(item) {
  const explicit = String(item && item.matchDate || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(explicit)) return explicit;
  const kickoff = String(item && item.kickoff || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(kickoff) ? kickoff : "";
}

function main() {
  if (!fs.existsSync(DATA_FILE)) throw new Error("Missing data.js. Run the fixture workflow first.");
  const matches = parseMatches(fs.readFileSync(DATA_FILE, "utf8"));

  let discovery = null;
  if (fs.existsSync(DISCOVERY_FILE)) {
    try { discovery = JSON.parse(fs.readFileSync(DISCOVERY_FILE, "utf8")); }
    catch (error) { throw new Error(`Invalid all-games-discovery.json: ${error.message}`); }
  }

  const dates = discovery && Array.isArray(discovery.dates) && discovery.dates.length
    ? discovery.dates.slice(0, 7)
    : Array.from({ length: 7 }, (_, index) => utcDate(index));
  const discoveredByDate = discovery && discovery.dateCounts && typeof discovery.dateCounts === "object"
    ? discovery.dateCounts
    : {};

  const rows = dates.map(date => {
    const dayMatches = matches.filter(item => dateOf(item) === date);
    const discovered = Number(discoveredByDate[date] || 0);
    const saved = dayMatches.length;
    const enriched = dayMatches.filter(item => item && item.enrichmentStatus === "enriched").length;
    const fixtureOnly = dayMatches.filter(item => item && item.fixtureOnly === true).length;
    return {
      date,
      games: saved,
      discovered,
      missingFromDiscovery: Math.max(0, discovered - saved),
      discoveryCoverage: discovered > 0 ? Math.round((saved / discovered) * 10000) / 100 : null,
      enriched,
      fixtureOnly,
      leagues: [...new Set(dayMatches.map(item => item && item.league).filter(Boolean))].length,
      upcoming: dayMatches.filter(item => item && item.homeGoals == null && item.awayGoals == null).length,
      finished: dayMatches.filter(item => item && item.homeGoals != null && item.awayGoals != null).length
    };
  });

  const totalDiscovered = rows.reduce((sum, row) => sum + row.discovered, 0);
  const totalSaved = rows.reduce((sum, row) => sum + row.games, 0);
  const report = {
    generatedAt: new Date().toISOString(),
    windowStart: dates[0],
    windowEnd: dates[dates.length - 1],
    totalSavedMatches: matches.length,
    totalGamesInWindow: totalSaved,
    totalDiscoveredFixtures: totalDiscovered,
    totalMissingFromDiscovery: rows.reduce((sum, row) => sum + row.missingFromDiscovery, 0),
    daysWithGames: rows.filter(row => row.games > 0).length,
    daysWithoutGames: rows.filter(row => row.games === 0).map(row => row.date),
    dates: rows
  };

  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("\nPredict2U exact seven-day coverage report");
  console.log("----------------------------------------");
  for (const row of rows) {
    console.log(`${row.date}: discovered ${row.discovered}, saved ${row.games}, enriched ${row.enriched}, fixture-only ${row.fixtureOnly}`);
  }
  console.log(`\nSaved ${totalSaved}/${totalDiscovered || totalSaved} discovered fixture(s).`);

  const minCoverage = Math.max(0, Math.min(1, Number(process.env.P2U_MIN_DISCOVERY_COVERAGE || "1")));
  const failures = rows.filter(row => row.discovered > 0 && row.games / row.discovered < minCoverage);
  if (failures.length) {
    throw new Error(`Per-day coverage failed for: ${failures.map(row => `${row.date} (${row.games}/${row.discovered})`).join(", ")}`);
  }
  if (totalDiscovered > 0 && totalSaved < totalDiscovered) {
    throw new Error(`Total coverage failed: saved ${totalSaved}/${totalDiscovered}.`);
  }
}

try { main(); }
catch (error) {
  console.error(error.stack || error.message || error);
  process.exit(2);
}
