#!/usr/bin/env node
"use strict";

const assert = require("assert");
const {
  foldName,
  poissonRates,
  ratesFromGames,
  enrichMatches,
  MIN_SAMPLE
} = require("../enrich-fixtures-from-profiles.js");

assert.strictEqual(foldName("Al Jazira (UAE)").folded, "al jazira");
assert.ok(foldName("Besiktas Istanbul").tokens.has("besiktas"));

const pois = poissonRates(1.8, 0.7);
assert.ok(pois.win > 0.5, "strong home attack should be favourite");
assert.ok(pois.over15 > pois.over35);

const games = [];
for (let i = 0; i < 10; i += 1) games.push({ venue: "H", gf: 2, ga: i % 4 === 0 ? 2 : 0 });
const emp = ratesFromGames(games);
assert.strictEqual(emp.n, 10);
assert.ok(emp.win >= 0.7);
assert.ok(emp.cs >= 0.7);

const ledger = {
  teams: {
    "Alpha FC|1": {
      name: "Alpha FC",
      league: "Premier Test League",
      seed: { venue: "H", gfPm: 1.9, gaPm: 0.6, n: 12 },
      games: games.map(g => ({ ...g, d: "2026-08-01" }))
    },
    "Beta FC|1": {
      name: "Beta FC",
      league: "Premier Test League",
      seed: { venue: "A", gfPm: 0.7, gaPm: 1.8, n: 12 },
      games: Array.from({ length: 10 }, (_, i) => ({ venue: "A", gf: i % 5 === 0 ? 1 : 0, ga: 2, d: "2026-08-01" }))
    }
  }
};

const matches = [{
  id: "sr:match:1",
  home: "Alpha FC",
  away: "Beta FC",
  league: "Premier Test League",
  matchDate: "2026-09-20",
  status: "NS",
  fixtureOnly: true,
  analysisPending: true,
  enrichmentStatus: "sportybet-fixture",
  dataCoverage: 0,
  odds: { home: 1.55, draw: 4.1, away: 6.2, dc1x: 1.12, over15: 1.22, over25: 1.72 }
}];

const stats = enrichMatches(matches, ledger);
assert.strictEqual(stats.bothReady, 1);
assert.strictEqual(matches[0].fixtureOnly, false);
assert.strictEqual(matches[0].analysisPending, false);
assert.strictEqual(matches[0].enrichmentStatus, "profile-ledger");
assert.ok(matches[0].homeVenueGames >= MIN_SAMPLE);
assert.ok(matches[0].awayVenueGames >= MIN_SAMPLE);
assert.ok(matches[0].homeWinRate > 0.5);
assert.ok(matches[0].awayWinRate < 0.4);
assert.ok(matches[0].homeStreaks.htft.ftWin > 0);
assert.ok(matches[0].homeBTTSRate != null);
assert.ok(matches[0].homeProfile.games >= MIN_SAMPLE);

const already = [{
  home: "Alpha FC", away: "Beta FC", league: "Premier Test League",
  homeVenueGames: 14, awayVenueGames: 14, homeWinRate: 0.91, awayWinRate: 0.11
}];
const skipped = enrichMatches(already, ledger);
assert.strictEqual(skipped.skippedExisting, 2);
assert.strictEqual(already[0].homeWinRate, 0.91, "do not overwrite live API-Football rates");

const unknown = enrichMatches([{ home: "Selaya FC", away: "SD Atletico Albericia", league: "Tercera", fixtureOnly: true }], ledger);
assert.strictEqual(unknown.bothReady, 0);
assert.strictEqual(unknown.matches ? true : unknown.unmatched >= 2, true);

console.log("enrich-fixtures-from-profiles.test.js passed");
