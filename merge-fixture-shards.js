#!/usr/bin/env node
"use strict";

/**
 * Predict2U v244 merge
 *
 * Guarantees that every fixture discovered for the active date window reaches
 * data.js. Enriched shard rows are layered over the exact raw discovery rows.
 * If enrichment cannot produce a full statistical record for a future match,
 * the fixture still appears as a fixture-only row instead of disappearing.
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const shardRoot = path.resolve(process.argv[2] || "shards");
const discoveryPath = path.resolve(process.argv[3] || "discovery/all-games-discovery.json");
const rawDiscoveryPath = path.resolve(
  process.argv[4] || path.join(path.dirname(discoveryPath), "all-games-fixtures.json")
);

function walk(dir, filename, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, filename, out);
    else if (entry.isFile() && entry.name === filename) out.push(full);
  }
  return out;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readMatches(file) {
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/window\.MATCHES\s*=\s*(\[[\s\S]*\]);?\s*$/);
  if (!match) throw new Error(`Could not parse window.MATCHES from ${file}`);
  const rows = JSON.parse(match[1]);
  if (!Array.isArray(rows)) throw new Error(`window.MATCHES is not an array in ${file}`);
  return rows;
}

function dateOf(item) {
  const explicit = String(item && item.matchDate || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(explicit)) return explicit;
  const kickoff = String(item && item.kickoff || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(kickoff) ? kickoff : "";
}

function uniqueKey(item) {
  if (item && item.id != null) return `id:${item.id}`;
  return `match:${dateOf(item)}|${item && item.kickoff || ""}|${item && (item.home || item.homeTeam) || ""}|${item && (item.away || item.awayTeam) || ""}`;
}

function neutralStatDefaults() {
  return {
    homePos: null,
    awayPos: null,
    tableSize: null,
    homePts: null,
    awayPts: null,
    homeGD: null,
    awayGD: null,
    homeForm: "",
    awayForm: "",
    homeScoredAtHome: null,
    homeConcededAtHome: null,
    awayScoredAway: null,
    awayConcededAway: null,
    homeStats: null,
    awayStats: null,
    homeStreaks: null,
    awayStreaks: null,
    leagueTrends: null,
    odds: null,
    h2h: null
  };
}

function rawFixtureToMatch(row) {
  const fx = row && row.fixture && row.fixture.fixture ? row.fixture : (row && row.fixture ? row.fixture : row);
  if (!fx || !fx.fixture || !fx.teams || !fx.league) return null;

  const matchDate = String((row && row.date) || fx.fixture.date || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(matchDate)) return null;

  const status = fx.fixture.status || {};
  const score = fx.score || {};
  const goals = fx.goals || {};

  return {
    ...neutralStatDefaults(),
    id: fx.fixture.id != null ? fx.fixture.id : null,
    home: fx.teams.home && fx.teams.home.name || "Home",
    away: fx.teams.away && fx.teams.away.name || "Away",
    league: fx.league.name || `League ${fx.league.id || ""}`.trim(),
    leagueId: fx.league.id != null ? Number(fx.league.id) : null,
    season: fx.league.season != null ? String(fx.league.season) : null,
    round: fx.league.round || null,
    homeTeamId: fx.teams.home && fx.teams.home.id != null ? Number(fx.teams.home.id) : null,
    awayTeamId: fx.teams.away && fx.teams.away.id != null ? Number(fx.teams.away.id) : null,
    homeLogo: fx.teams.home && fx.teams.home.logo || null,
    awayLogo: fx.teams.away && fx.teams.away.logo || null,
    country: fx.league.country || null,
    flag: fx.league.flag || null,
    status: status.short || "NS",
    statusLong: status.long || null,
    elapsed: status.elapsed != null ? status.elapsed : null,
    kickoff: fx.fixture.date || null,
    timezone: fx.fixture.timezone || null,
    matchDate,
    venue: fx.fixture.venue || null,
    referee: fx.fixture.referee || null,
    homeGoals: goals.home != null ? goals.home : null,
    awayGoals: goals.away != null ? goals.away : null,
    htHome: score.halftime && score.halftime.home != null ? score.halftime.home : null,
    htAway: score.halftime && score.halftime.away != null ? score.halftime.away : null,
    fixtureOnly: true,
    enrichmentStatus: "fixture-only",
    dataCoverage: 0
  };
}

function mergeCaches(files) {
  const merged = {};
  const now = Date.now();
  for (const file of files) {
    try {
      const cache = readJson(file);
      for (const [key, value] of Object.entries(cache || {})) {
        if (!value || Number(value.expiresAt || 0) <= now) continue;
        if (!merged[key] || Number(value.savedAt || 0) > Number(merged[key].savedAt || 0)) merged[key] = value;
      }
    } catch (error) {
      console.warn(`Cache skipped (${file}): ${error.message}`);
    }
  }
  const rows = Object.entries(merged)
    .sort((a, b) => Number(b[1].savedAt || 0) - Number(a[1].savedAt || 0))
    .slice(0, 20000);
  fs.writeFileSync(path.join(ROOT, "api-cache.json"), `${JSON.stringify(Object.fromEntries(rows), null, 2)}\n`);
}

if (!fs.existsSync(discoveryPath)) throw new Error(`Missing discovery manifest: ${discoveryPath}`);
if (!fs.existsSync(rawDiscoveryPath)) throw new Error(`Missing exact fixture discovery file: ${rawDiscoveryPath}`);

const manifest = readJson(discoveryPath);
const rawPayload = readJson(rawDiscoveryPath);
const rawRows = Array.isArray(rawPayload) ? rawPayload : (Array.isArray(rawPayload.fixtures) ? rawPayload.fixtures : []);
const windowDates = new Set(Array.isArray(manifest.dates) ? manifest.dates : []);
if (!windowDates.size) throw new Error("Discovery manifest contains no active dates.");

const shardFiles = walk(shardRoot, "data.js");
if (!shardFiles.length) throw new Error(`No shard data.js files found below ${shardRoot}`);

const mergedByKey = new Map();
const rawKeys = new Set();
const enrichedKeys = new Set();
let existing = [];
const rootData = path.join(ROOT, "data.js");
if (fs.existsSync(rootData)) {
  try { existing = readMatches(rootData); }
  catch (error) { console.warn(error.message); }
}

// Preserve settled/history rows outside this run's date window.
for (const item of existing) {
  const itemDate = dateOf(item);
  if (!windowDates.has(itemDate)) mergedByKey.set(uniqueKey(item), { ...item, matchDate: itemDate || item.matchDate });
}

// Seed the active window with every exact fixture from discovery.
for (const row of rawRows) {
  const base = rawFixtureToMatch(row);
  if (!base || !windowDates.has(base.matchDate)) continue;
  const key = uniqueKey(base);
  rawKeys.add(key);
  mergedByKey.set(key, base);
}

// Overlay enriched data. A shard can never remove its discovery fallback.
let shardRowsExamined = 0;
for (const file of shardFiles) {
  const rows = readMatches(file);
  for (const item of rows) {
    const itemDate = dateOf(item);
    if (!windowDates.has(itemDate)) continue;
    const normalized = { ...item, matchDate: itemDate };
    const key = uniqueKey(normalized);
    const base = mergedByKey.get(key) || neutralStatDefaults();
    mergedByKey.set(key, {
      ...base,
      ...normalized,
      matchDate: itemDate,
      fixtureOnly: false,
      enrichmentStatus: "enriched",
      dataCoverage: normalized.dataCoverage != null ? normalized.dataCoverage : 100
    });
    enrichedKeys.add(key);
    shardRowsExamined += 1;
  }
}

const merged = [...mergedByKey.values()];
merged.sort((a, b) => {
  const ad = dateOf(a), bd = dateOf(b);
  if (ad !== bd) return ad.localeCompare(bd);
  return String(a.kickoff || "").localeCompare(String(b.kickoff || ""));
});

const activeRows = merged.filter(item => windowDates.has(dateOf(item)));
const discoveredCount = rawKeys.size;
const enrichedCount = [...rawKeys].filter(key => enrichedKeys.has(key)).length;
const fixtureOnlyCount = Math.max(0, discoveredCount - enrichedCount);
const finalCoverage = discoveredCount ? activeRows.length / discoveredCount : 1;

fs.writeFileSync(
  rootData,
  `/* AUTO-GENERATED by Predict2U v244 fixture-safe merge on ${new Date().toISOString()} — do not edit by hand. */\n\n` +
  `window.DATA_UPDATED = ${JSON.stringify(new Date().toISOString())};\n` +
  `window.MATCHES = ${JSON.stringify(merged)};\n`,
  "utf8"
);

mergeCaches(
  walk(shardRoot, "api-cache.json").concat(
    fs.existsSync(path.join(ROOT, "api-cache.json")) ? [path.join(ROOT, "api-cache.json")] : []
  )
);
fs.copyFileSync(discoveryPath, path.join(ROOT, "all-games-discovery.json"));

const dateReport = {};
for (const date of windowDates) {
  const discovered = rawRows.map(rawFixtureToMatch).filter(Boolean).filter(item => item.matchDate === date).length;
  const saved = activeRows.filter(item => dateOf(item) === date).length;
  const enriched = activeRows.filter(item => dateOf(item) === date && item.enrichmentStatus === "enriched").length;
  dateReport[date] = { discovered, saved, enriched, fixtureOnly: Math.max(0, saved - enriched) };
}

const coverageReport = {
  generatedAt: new Date().toISOString(),
  expectedFromManifest: Number(manifest.fixtureCount || discoveredCount),
  discoveredExactFixtures: discoveredCount,
  savedActiveFixtures: activeRows.length,
  enrichedFixtures: enrichedCount,
  fixtureOnlyFallbacks: fixtureOnlyCount,
  finalCoveragePercent: Math.round(finalCoverage * 10000) / 100,
  dates: dateReport
};
fs.writeFileSync(path.join(ROOT, "fixture-coverage-report.json"), `${JSON.stringify(coverageReport, null, 2)}\n`);

console.log(`Merged ${shardFiles.length} shard(s).`);
console.log(`Exact discovery fixtures: ${discoveredCount}.`);
console.log(`Enriched fixtures: ${enrichedCount}.`);
console.log(`Fixture-only fallbacks kept visible: ${fixtureOnlyCount}.`);
console.log(`Final active-window rows: ${activeRows.length} (${coverageReport.finalCoveragePercent}% of exact discovery).`);
console.log(`Raw shard rows examined: ${shardRowsExamined}.`);

if (activeRows.length < discoveredCount) {
  throw new Error(`Fixture-safe merge failed: ${discoveredCount - activeRows.length} discovered fixture(s) are still missing.`);
}
