#!/usr/bin/env node
"use strict";

/**
 * Predict2U v247 fast fixture snapshot.
 *
 * Purpose:
 * - Pull every scheduled fixture for today through DAYS_FWD with one request
 *   per date.
 * - Publish a small, prediction-independent fixtures.js feed.
 * - Keep future fixtures visible even while the full engine workflow is still
 *   enriching odds, H2H, standings and team statistics.
 */

const fs = require("fs");
const https = require("https");

const API_KEY = String(process.env.API_FOOTBALL_KEY || process.env.API_KEY || "").trim();
const DAYS_BACK = Math.max(0, Number.parseInt(process.env.DAYS_BACK || "0", 10) || 0);
const DAYS_FWD = Math.max(0, Math.min(14, Number.parseInt(process.env.DAYS_FWD || "6", 10) || 6));
const CONCURRENCY = Math.max(1, Math.min(5, Number.parseInt(process.env.FIXTURE_CONCURRENCY || "3", 10) || 3));
const MAX_RETRIES = 5;

if (!API_KEY) {
  console.error("Missing API_FOOTBALL_KEY or API_KEY.");
  process.exit(1);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const isoDate = date => date.toISOString().slice(0, 10);

function datesInWindow() {
  const dates = [];
  for (let offset = -DAYS_BACK; offset <= DAYS_FWD; offset += 1) {
    const date = new Date();
    date.setUTCHours(12, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() + offset);
    dates.push(isoDate(date));
  }
  return dates;
}

function apiRequest(path, attempt = 0) {
  return new Promise((resolve, reject) => {
    const request = https.request({
      method: "GET",
      hostname: "v3.football.api-sports.io",
      path,
      headers: {
        "x-apisports-key": API_KEY,
        "accept": "application/json"
      }
    }, response => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", chunk => { body += chunk; });
      response.on("end", async () => {
        const retryable = response.statusCode === 429 || response.statusCode >= 500;
        if (retryable && attempt < MAX_RETRIES) {
          const wait = Math.min(30000, 2500 * (attempt + 1));
          console.warn(`API ${response.statusCode}; retrying in ${wait}ms (${attempt + 1}/${MAX_RETRIES})`);
          await sleep(wait);
          try { resolve(await apiRequest(path, attempt + 1)); }
          catch (error) { reject(error); }
          return;
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`API request failed (${response.statusCode}) for ${path}: ${body.slice(0, 500)}`));
          return;
        }
        let payload;
        try { payload = JSON.parse(body); }
        catch (_) { reject(new Error(`Invalid JSON returned for ${path}`)); return; }
        const errors = payload && payload.errors;
        if (errors && ((Array.isArray(errors) && errors.length) || (!Array.isArray(errors) && Object.keys(errors).length))) {
          reject(new Error(`API error for ${path}: ${JSON.stringify(errors)}`));
          return;
        }
        resolve(payload);
      });
    });
    request.setTimeout(45000, () => request.destroy(new Error(`Timeout for ${path}`)));
    request.on("error", reject);
    request.end();
  });
}

async function pool(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runner() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runner));
  return results;
}

function normalize(raw, requestedDate) {
  const fixture = raw && raw.fixture || {};
  const league = raw && raw.league || {};
  const teams = raw && raw.teams || {};
  const goals = raw && raw.goals || {};
  const score = raw && raw.score || {};
  const status = fixture.status || {};
  const kickoff = fixture.date || null;
  const matchDate = String(kickoff || requestedDate || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(matchDate)) return null;
  if (!teams.home || !teams.away) return null;

  return {
    id: fixture.id != null ? Number(fixture.id) : null,
    home: teams.home.name || "Home",
    away: teams.away.name || "Away",
    league: league.name || `League ${league.id || ""}`.trim(),
    leagueId: league.id != null ? Number(league.id) : null,
    season: league.season != null ? String(league.season) : null,
    round: league.round || null,
    country: league.country || null,
    flag: league.flag || null,
    homeTeamId: teams.home.id != null ? Number(teams.home.id) : null,
    awayTeamId: teams.away.id != null ? Number(teams.away.id) : null,
    homeLogo: teams.home.logo || null,
    awayLogo: teams.away.logo || null,
    status: status.short || "NS",
    statusLong: status.long || null,
    elapsed: status.elapsed != null ? Number(status.elapsed) : null,
    kickoff,
    timezone: fixture.timezone || "UTC",
    matchDate,
    venue: fixture.venue || null,
    referee: fixture.referee || null,
    homeGoals: goals.home != null ? Number(goals.home) : null,
    awayGoals: goals.away != null ? Number(goals.away) : null,
    htHome: score.halftime && score.halftime.home != null ? Number(score.halftime.home) : null,
    htAway: score.halftime && score.halftime.away != null ? Number(score.halftime.away) : null,
    fixtureOnly: true,
    analysisPending: true,
    enrichmentStatus: "fixture-only",
    dataCoverage: 0
  };
}

function fixtureKey(row) {
  if (row.id != null) return `id:${row.id}`;
  return [row.matchDate, row.kickoff, row.homeTeamId || row.home, row.awayTeamId || row.away].join("|");
}

(async () => {
  const dates = datesInWindow();
  console.log(`Fetching fixture snapshot: ${dates[0]} through ${dates[dates.length - 1]}`);

  const perDay = await pool(dates, CONCURRENCY, async date => {
    const endpoint = `/fixtures?date=${encodeURIComponent(date)}&timezone=UTC`;
    const payload = await apiRequest(endpoint);
    const response = Array.isArray(payload && payload.response) ? payload.response : [];
    console.log(`${date}: ${response.length} fixture(s)`);
    return { date, raw: response };
  });

  const map = new Map();
  const dateCounts = Object.fromEntries(dates.map(date => [date, 0]));
  const leagueCounts = {};

  for (const day of perDay) {
    for (const raw of day.raw) {
      const row = normalize(raw, day.date);
      if (!row) continue;
      const key = fixtureKey(row);
      if (map.has(key)) continue;
      map.set(key, row);
      dateCounts[row.matchDate] = (dateCounts[row.matchDate] || 0) + 1;
      const leagueKey = `${row.leagueId || ""}|${row.league}`;
      leagueCounts[leagueKey] = (leagueCounts[leagueKey] || 0) + 1;
    }
  }

  const fixtures = [...map.values()].sort((a, b) =>
    String(a.matchDate).localeCompare(String(b.matchDate)) ||
    String(a.kickoff || "").localeCompare(String(b.kickoff || "")) ||
    String(a.league || "").localeCompare(String(b.league || ""))
  );

  if (!fixtures.length) throw new Error("The API returned zero fixtures for the requested window.");

  const generatedAt = new Date().toISOString();
  const metadata = {
    generatedAt,
    windowStart: dates[0],
    windowEnd: dates[dates.length - 1],
    totalFixtures: fixtures.length,
    daysRequested: dates.length,
    dateCounts
  };

  const js = [
    `/* AUTO-GENERATED by Predict2U v247 fixture snapshot on ${generatedAt}. */`,
    `window.FIXTURE_DATA_UPDATED = ${JSON.stringify(generatedAt)};`,
    `window.FIXTURE_WINDOW = ${JSON.stringify(metadata, null, 2)};`,
    `window.FIXTURES = ${JSON.stringify(fixtures, null, 2)};`,
    ""
  ].join("\n");

  fs.writeFileSync("fixtures.js", js, "utf8");
  fs.writeFileSync("fixture-snapshot-report.json", JSON.stringify({
    ...metadata,
    leagues: Object.entries(leagueCounts)
      .map(([key, games]) => {
        const [leagueId, league] = key.split("|");
        return { leagueId: leagueId ? Number(leagueId) : null, league, games };
      })
      .sort((a, b) => b.games - a.games || a.league.localeCompare(b.league))
  }, null, 2) + "\n", "utf8");

  console.log(`Published ${fixtures.length} fixture(s) to fixtures.js.`);
})().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
