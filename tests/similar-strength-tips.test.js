#!/usr/bin/env node
"use strict";
const assert = require("assert");
const peer = require("../similar-strength-tips.js");
const enrich = require("../enrich-fixtures-from-profiles.js");

function games(rows) {
  return rows.map(([d, venue, gf, ga]) => ({ d, venue, gf, ga, xg: null, xga: null, sot: null, sotc: null }));
}

function team(name, league, rows, seed) {
  return { name, league, games: games(rows), seed: seed || { venue: "H", gfPm: 1.2, gaPm: 1.2, n: 8 } };
}

const league = "Test Premier";
const ledger = {
  updated: "2026-08-26T00:00:00.000Z",
  teams: {
    "Alpha FC|1": team("Alpha FC", league, [
      ["2026-08-01", "H", 2, 0],
      ["2026-08-02", "A", 1, 0],
      ["2026-08-03", "H", 3, 1],
      ["2026-08-04", "A", 2, 2],
      ["2026-08-05", "H", 1, 0],
      ["2026-08-09", "A", 2, 1],
      ["2026-08-10", "H", 2, 0],
      ["2026-08-11", "A", 1, 1]
    ], { venue: "H", gfPm: 1.9, gaPm: 0.6, n: 10 }),
    "Beta FC|1": team("Beta FC", league, [
      ["2026-08-01", "A", 0, 2],
      ["2026-08-02", "H", 2, 0],
      ["2026-08-03", "A", 1, 1],
      ["2026-08-04", "H", 1, 0],
      ["2026-08-05", "A", 2, 1],
      ["2026-08-09", "H", 1, 2],
      ["2026-08-12", "A", 2, 0],
      ["2026-08-13", "H", 1, 0]
    ], { venue: "H", gfPm: 1.7, gaPm: 0.8, n: 10 }),
    "Gamma FC|1": team("Gamma FC", league, [
      ["2026-08-01", "H", 1, 1],
      ["2026-08-02", "A", 0, 2],
      ["2026-08-03", "H", 1, 1],
      ["2026-08-04", "A", 2, 2],
      ["2026-08-06", "H", 1, 0],
      ["2026-08-10", "A", 0, 2],
      ["2026-08-12", "H", 0, 2]
    ], { venue: "H", gfPm: 1.3, gaPm: 1.2, n: 10 }),
    "Delta FC|1": team("Delta FC", league, [
      ["2026-08-01", "A", 1, 1],
      ["2026-08-02", "H", 0, 1],
      ["2026-08-03", "A", 1, 3],
      ["2026-08-04", "H", 2, 2],
      ["2026-08-06", "A", 0, 1],
      ["2026-08-11", "H", 1, 1],
      ["2026-08-13", "A", 0, 1]
    ], { venue: "H", gfPm: 1.1, gaPm: 1.4, n: 10 }),
    "Echo FC|1": team("Echo FC", league, [
      ["2026-08-03", "H", 1, 1],
      ["2026-08-04", "A", 0, 1],
      ["2026-08-05", "H", 0, 1],
      ["2026-08-06", "A", 1, 2],
      ["2026-08-07", "H", 0, 2]
    ], { venue: "H", gfPm: 0.7, gaPm: 1.8, n: 10 }),
    "Foxtrot FC|1": team("Foxtrot FC", league, [
      ["2026-08-05", "A", 1, 2],
      ["2026-08-06", "H", 2, 1],
      ["2026-08-07", "A", 2, 0],
      ["2026-08-08", "H", 0, 3],
      ["2026-08-08", "A", 1, 3]
    ], { venue: "H", gfPm: 0.8, gaPm: 1.7, n: 10 })
  }
};

const helpers = {
  lookup: enrich.lookup,
  buildIndex: enrich.buildIndex,
  ratesFromGames: enrich.ratesFromGames,
  poissonRates: enrich.poissonRates
};

const ctx = peer.buildContext(ledger, helpers);
assert.ok(ctx.ranked.size >= 6, "six-team league should rank");
assert.ok(ctx.paired.size >= 4, "unique complementary scores should pair");

const alphaKey = "Alpha FC|1";
const alphaPairs = ctx.paired.get(alphaKey) || [];
assert.ok(alphaPairs.some(g => g.oppName === "Beta FC"), "Alpha 2-0 on 08-01 should uniquely pair with Beta");

const ambiguousLedger = {
  teams: {
    "A|1": team("A", league, [["2026-08-01", "H", 1, 0]]),
    "B|1": team("B", league, [["2026-08-01", "H", 1, 0]]),
    "C|1": team("C", league, [["2026-08-01", "A", 0, 1]]),
    "D|1": team("D", league, [["2026-08-01", "A", 0, 1]]),
    "E|1": team("E", league, [["2026-08-02", "H", 2, 0], ["2026-08-03", "H", 2, 1], ["2026-08-04", "A", 1, 0], ["2026-08-05", "A", 0, 0]]),
    "F|1": team("F", league, [["2026-08-02", "A", 0, 2], ["2026-08-03", "A", 1, 2], ["2026-08-04", "H", 0, 1], ["2026-08-05", "H", 0, 0]])
  }
};
const amb = peer.buildContext(ambiguousLedger, helpers);
const aPairs = amb.paired.get("A|1") || [];
assert.strictEqual(aPairs.length, 0, "two 1-0 homes on the same day must not guess an opponent");

assert.ok(peer.isSimilarStrength({ ppg: 1.4, rank: 8 }, { ppg: 1.5, rank: 10 }, 18));
assert.ok(!peer.isSimilarStrength({ ppg: 2.2, rank: 1 }, { ppg: 0.6, rank: 18 }, 18));

const thinTips = peer.buildTips({ n: 3, win: 0.9, unbeaten: 0.9, over15: 1, over25: 1, over35: 0.6, btts: 0.8 }, null);
assert.strictEqual(thinTips.length, 0, "do not publish tips under 4 similar-strength games");

const fatTips = peer.buildTips(
  { n: 5, win: 0.8, unbeaten: 0.8, over15: 1, over25: 0.8, over35: 0.4, btts: 0.6 },
  { n: 4, win: 0.25, unbeaten: 0.5, over15: 0.75, over25: 0.5, over35: 0.25, btts: 0.75 }
);
assert.ok(fatTips.some(t => t.id === "HOME_WIN"), "strong home peer sample should tip home win");

const matches = [
  { id: "t1", home: "Alpha FC", away: "Beta FC", league, odds: { home: 1.9, over25: 1.8 } },
  { id: "t2", home: "Alpha FC", away: "Echo FC", league, odds: { home: 1.4, over25: 1.7 } }
];
const stats = peer.attachPeerIntel(matches, ledger, helpers);
assert.strictEqual(stats.attached, 2);
assert.ok(matches[0].peerIntel, "fixture receives peerIntel");
assert.ok(["similar", "home-stronger", "away-stronger"].includes(matches[0].peerIntel.class));
assert.ok(matches[0].peerIntel.tips.length, "similar matchup with unique pairs should publish at least one peer tip");
assert.ok(matches[0].peerIntel.tips.every(t => t.sample >= peer.MIN_PEER), "every published tip meets the sample floor");

const enriched = [
  { id: "t3", home: "Alpha FC", away: "Beta FC", league, homeVenueGames: 12, homeWinRate: 0.6, awayVenueGames: 12, awayWinRate: 0.4 }
];
const enrichStats = enrich.enrichMatches(enriched, ledger);
assert.ok(enriched[0].peerIntel, "enrich still attaches peer intel when rates already exist");
assert.ok(enrichStats.peerAttached >= 1);

const friendly = peer.fromFixture({
  homeVenueGames: 10, homeVenuePts: 14, awayVenueGames: 10, awayVenuePts: 13.5
});
assert.strictEqual(friendly.class, "similar");
assert.strictEqual(friendly.tips.length, 0, "live PPG class does not invent historical tips");

console.log("similar-strength-tips.test.js passed", {
  ranked: ctx.ranked.size,
  pairedTeams: ctx.paired.size,
  alphaPairs: alphaPairs.length,
  classAB: matches[0].peerIntel.class,
  tipsAB: matches[0].peerIntel.tips.map(t => t.id),
  sampleHome: matches[0].peerIntel.home.sample
});
