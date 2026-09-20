#!/usr/bin/env node
"use strict";

/**
 * Predict2U fixture hydrator.
 *
 * API-Football outages (suspended account, invalid key, daily cap) used to
 * leave MATCHES empty and the date strip blank. SportyBet already publishes
 * a live 8-day football list every few hours — use it as the board source
 * whenever the primary provider has no current dates.
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SPORTY_FILE = path.join(ROOT, "sportybet-odds.js");
const FIXTURES_FILE = path.join(ROOT, "fixtures.js");

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function dateOf(item) {
  const direct = String(item && item.matchDate || "").slice(0, 10);
  if (isIsoDate(direct)) return direct;
  const kickoff = String(item && item.kickoff || "").slice(0, 10);
  return isIsoDate(kickoff) ? kickoff : "";
}

function utcTodayIso(now = new Date()) {
  return new Date(now).toISOString().slice(0, 10);
}

function parseAssignment(raw, name, open, close) {
  const marker = raw.indexOf(`window.${name}`);
  if (marker < 0) return null;
  const equals = raw.indexOf("=", marker);
  const start = raw.indexOf(open, equals);
  if (equals < 0 || start < 0) return null;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === open) depth += 1;
    else if (ch === close && --depth === 0) {
      try {
        return JSON.parse(raw.slice(start, i + 1));
      } catch (_) {
        return null;
      }
    }
  }
  return null;
}

function readSportybetRows(file = SPORTY_FILE) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8");
  const parsed = parseAssignment(raw, "P2U_SPORTYBET", "{", "}");
  const rows = parsed && Array.isArray(parsed.rows) ? parsed.rows : [];
  return rows.filter(row => row && row.home && row.away && dateOf(row));
}

function sportyRowToFixture(row) {
  const matchDate = dateOf(row);
  return {
    id: row.eventId || row.gameId || `${matchDate}|${row.home}|${row.away}`,
    home: row.home,
    away: row.away,
    league: row.league || "Football",
    leagueId: null,
    season: null,
    round: null,
    country: row.country || null,
    flag: null,
    homeTeamId: null,
    awayTeamId: null,
    homeLogo: null,
    awayLogo: null,
    status: "NS",
    statusLong: "Not Started",
    elapsed: null,
    kickoff: row.kickoff || `${matchDate}T12:00:00.000Z`,
    timezone: "UTC",
    matchDate,
    venue: null,
    referee: null,
    homeGoals: null,
    awayGoals: null,
    htHome: null,
    htAway: null,
    fixtureOnly: true,
    analysisPending: true,
    enrichmentStatus: "sportybet-fixture",
    dataCoverage: 0,
    odds: row.odds && typeof row.odds === "object" ? row.odds : {},
    sportyEventId: row.eventId || null,
    sportyGameId: row.gameId || null,
    source: "sportybet"
  };
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(fc|cf|sc|afc|ac|cd|fk|bk|if|sk|sv|calcio|utd|united)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function fixtureDedupeKey(row) {
  return [
    dateOf(row),
    normalizeName(row && row.home),
    normalizeName(row && row.away)
  ].join("|");
}

function hasCurrentDates(rows, now = new Date()) {
  const today = utcTodayIso(now);
  return (rows || []).some(row => dateOf(row) >= today);
}

function mergeCurrentFixtures(existing, sportyRows, now = new Date()) {
  const today = utcTodayIso(now);
  const sportyFixtures = (sportyRows || []).map(sportyRowToFixture).filter(row => dateOf(row) >= today);
  const map = new Map();
  for (const row of existing || []) {
    const key = fixtureDedupeKey(row);
    if (!key.startsWith("|")) map.set(key, row);
  }
  let added = 0;
  for (const row of sportyFixtures) {
    const key = fixtureDedupeKey(row);
    if (map.has(key)) {
      const prior = map.get(key);
      map.set(key, {
        ...prior,
        ...(!prior.odds && row.odds ? { odds: row.odds } : {}),
        sportyEventId: prior.sportyEventId || row.sportyEventId,
        sportyGameId: prior.sportyGameId || row.sportyGameId
      });
      continue;
    }
    map.set(key, row);
    added += 1;
  }
  const fixtures = [...map.values()].sort((a, b) =>
    dateOf(a).localeCompare(dateOf(b)) ||
    String(a.kickoff || "").localeCompare(String(b.kickoff || ""))
  );
  return { fixtures, added, sportyCount: sportyFixtures.length, today };
}

function writeFixturesJs(fixtures, extraMeta = {}) {
  const generatedAt = new Date().toISOString();
  const dates = fixtures.map(dateOf).filter(isIsoDate).sort();
  const dateCounts = {};
  for (const date of dates) dateCounts[date] = (dateCounts[date] || 0) + 1;
  const metadata = {
    generatedAt,
    windowStart: dates[0] || extraMeta.windowStart || null,
    windowEnd: dates[dates.length - 1] || extraMeta.windowEnd || null,
    totalFixtures: fixtures.length,
    hydratedFromSportybet: true,
    ...extraMeta,
    dateCounts
  };
  const js = [
    `/* AUTO-GENERATED by Predict2U sportybet hydrator on ${generatedAt}. */`,
    `window.FIXTURE_DATA_UPDATED = ${JSON.stringify(generatedAt)};`,
    `window.FIXTURE_WINDOW = ${JSON.stringify(metadata, null, 2)};`,
    `window.FIXTURES = ${JSON.stringify(fixtures, null, 2)};`,
    ""
  ].join("\n");
  fs.writeFileSync(FIXTURES_FILE, js, "utf8");
  return metadata;
}

function hydrateFixturesFile(now = new Date()) {
  const sportyRows = readSportybetRows();
  if (!sportyRows.length) {
    return { skipped: true, reason: "sportybet-odds.js has no rows" };
  }
  let existing = [];
  if (fs.existsSync(FIXTURES_FILE)) {
    const parsed = parseAssignment(fs.readFileSync(FIXTURES_FILE, "utf8"), "FIXTURES", "[", "]");
    if (Array.isArray(parsed)) existing = parsed;
  }
  if (hasCurrentDates(existing, now) && hasCurrentDates(sportyRows, now) === false) {
    return { skipped: true, reason: "fixtures.js already has current dates" };
  }
  const merged = mergeCurrentFixtures(hasCurrentDates(existing, now) ? existing : [], sportyRows, now);
  if (!merged.fixtures.length) {
    return { skipped: true, reason: "sportybet rows are also outside the current window" };
  }
  const meta = writeFixturesJs(merged.fixtures, {
    source: hasCurrentDates(existing, now) ? "api+sportybet" : "sportybet",
    addedFromSportybet: merged.added,
    sportyCurrentCount: merged.sportyCount
  });
  try {
    const { enrichMatches, loadLedger, writeSmtBundle } = require("./enrich-fixtures-from-profiles.js");
    const stats = enrichMatches(merged.fixtures, loadLedger());
    if (stats && stats.attached) {
      writeFixturesJs(merged.fixtures, {
        ...meta,
        profileReady: stats.bothReady,
        profileAttached: stats.attached
      });
      console.log(`SportyBet fixture hydrate: attached profile rates to ${stats.bothReady}/${merged.fixtures.length} fixture(s).`);
    }
    try {
      const smtRows = writeSmtBundle(merged.fixtures);
      console.log(`SMT board: ${smtRows} similar-market tip(s).`);
    } catch (error) {
      console.warn(`SMT board skipped: ${error && error.message ? error.message : error}`);
    }
  } catch (error) {
    console.warn(`Profile enrich after SportyBet hydrate skipped: ${error && error.message ? error.message : error}`);
  }
  return { skipped: false, added: merged.added, total: merged.fixtures.length, meta };
}

function main() {
  const result = hydrateFixturesFile();
  if (result.skipped) {
    console.warn(`SportyBet fixture hydrate skipped: ${result.reason}`);
    return result;
  }
  console.log(`SportyBet fixture hydrate: added ${result.added}, published ${result.total} fixture(s).`);
  return result;
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  }
}

module.exports = {
  dateOf,
  utcTodayIso,
  readSportybetRows,
  sportyRowToFixture,
  hasCurrentDates,
  mergeCurrentFixtures,
  hydrateFixturesFile,
  parseAssignment
};
