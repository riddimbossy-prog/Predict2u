#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Gate = require("../auto-picks-gatekeeper-v272.js");

const today = "2026-09-20";
const num = v => v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const rate = v => { const n = num(v); return n === null ? null : (n > 1.00001 ? n / 100 : n); };
const first = (...values) => { for (const value of values) { const n = num(value); if (n !== null) return n; } return null; };
const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const average = values => {
  const xs = values.filter(v => v !== null && Number.isFinite(v));
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
};

function sideRow(m, side) {
  const home = side === "home";
  const games = first(m[`${side}VenueGames`]) || 0;
  const win = rate(first(m[`${side}WinRate`]));
  const unbeaten = rate(first(m[`${side}UnbeatenRate`]));
  const draw = win !== null && unbeaten !== null ? Math.max(0, unbeaten - win) : null;
  const loss = unbeaten !== null ? Math.max(0, 1 - unbeaten) : null;
  const over15 = rate(first(m[`${side}Over15Rate`]));
  const over25 = rate(first(m[`${side}Over25Rate`]));
  const over35 = rate(first(m[`${side}Over35Rate`]));
  const cs = rate(first(m[`${side}CleanSheetRate`]));
  const fts = rate(first(m[`${side}FailedToScoreRate`]));
  const gf = home ? first(m.homeScoredAtHome) : first(m.awayScoredAway);
  const ga = home ? first(m.homeConcededAtHome) : first(m.awayConcededAway);
  const ppg = first(m[`${side}Recent10PPG`]);
  return {
    team: m[side], games, ppg, gf, ga, win, draw, loss, unbeaten, over15, over25, over35,
    under15: over15 === null ? null : 1 - over15, under25: over25 === null ? null : 1 - over25,
    btts: rate(first(m[`${side}BTTSRate`])),
    noBtts: rate(first(m[`${side}BTTSRate`])) === null ? null : 1 - rate(first(m[`${side}BTTSRate`])),
    scored: fts === null ? null : 1 - fts, conceded: cs === null ? null : 1 - cs, cs, fts,
    noDraw: first(m[`${side}Streaks`] && m[`${side}Streaks`].noDraw, 0) || 0,
    recentPPG: ppg, recentForm: Gate.formStats(m[`${side}Recent10Form`]), form: m[`${side}Recent10Form`] || "",
    profileSource: ""
  };
}

function candidatesFor(m) {
  const h = sideRow(m, "home"), a = sideRow(m, "away");
  const projection = ((h.gf ?? 1.2) + (a.ga ?? 1.2)) / 2 + ((a.gf ?? 1.1) + (h.ga ?? 1.1)) / 2;
  const sample = Math.min(h.games || 0, a.games || 0);
  const sampleScore = clamp((sample - 6) * 2, 0, 10);
  const oddsValue = key => first(m.odds && m.odds[key]);
  const out = [];
  const add = (id, market, canonical, score, oddsKey) => {
    const odds = oddsValue(oddsKey);
    if (odds === null) return;
    out.push({ id, market, canonical, score: clamp(score + sampleScore), odds });
  };
  const ppgEdge = (h.ppg ?? 1.2) - (a.ppg ?? 1.2);
  const awayEdge = (a.ppg ?? 1.2) - (h.ppg ?? 1.2);
  add("HOME_WIN", `${h.team} to win`, "Home Win", 64 + ppgEdge * 12 + ((h.win ?? 0.35) - (a.win ?? 0.35)) * 24, "home");
  add("AWAY_WIN", `${a.team} to win`, "Away Win", 64 + awayEdge * 12 + ((a.win ?? 0.35) - (h.win ?? 0.35)) * 24, "away");
  add("DC1X", `${h.team} or Draw`, "Double Chance 1X", 70 + ((h.unbeaten ?? 0.5) - 0.65) * 40, "dc1x");
  add("DCX2", `Draw or ${a.team}`, "Double Chance X2", 70 + ((a.unbeaten ?? 0.5) - 0.65) * 40, "dcx2");
  const o15 = average([h.over15, a.over15]);
  const o25 = average([h.over25, a.over25]);
  const o35 = average([h.over35, a.over35]);
  add("OVER15", "Over 1.5 Goals", "Over 1.5 Goals", (o15 ?? 0) * 86, "over15");
  add("UNDER15", "Under 1.5 Goals", "Under 1.5 Goals", ((o15 == null ? null : 1 - o15) ?? 0) * 90, "under15");
  add("OVER25", "Over 2.5 Goals", "Over 2.5 Goals", (o25 ?? 0) * 90, "over25");
  add("UNDER25", "Under 2.5 Goals", "Under 2.5 Goals", ((o25 == null ? null : 1 - o25) ?? 0) * 90, "under25");
  add("OVER35", "Over 3.5 Goals", "Over 3.5 Goals", (o35 ?? 0) * 92, "over35");
  add("UNDER35", "Under 3.5 Goals", "Under 3.5 Goals", ((o35 == null ? null : 1 - o35) ?? 0) * 88, "under35");
  add("BTTS_YES", "Both Teams to Score — Yes", "BTTS Yes", (average([h.btts, a.btts]) ?? 0) * 88, "bttsYes");
  add("BTTS_NO", "Both Teams to Score — No", "BTTS No", (average([h.noBtts, a.noBtts]) ?? 0) * 90, "bttsNo");
  add("NO_DRAW", "No Draw — 12", "Double Chance 12", (average([h.draw == null ? null : 1 - h.draw, a.draw == null ? null : 1 - a.draw]) ?? 0) * 88, "dc12");
  return { h, a, candidates: out, sample };
}

const src = fs.readFileSync(path.join(__dirname, "..", "current-data.js"), "utf8");
const match = src.match(/window\.MATCHES\s*=\s*(\[[\s\S]*\]);/);
assert(match, "current-data.js must expose MATCHES");
const MATCHES = eval(match[1]);
const current = MATCHES.filter(m => String(m.matchDate || m.kickoff || "").slice(0, 10) >= today);
const ready = current.filter(m => (m.homeVenueGames || 0) >= 8 && (m.awayVenueGames || 0) >= 8);
assert(current.length > 100, "current window should have a real fixture set");
assert(ready.length > 50, "profile-backed fixtures should be present");

const meta = { sourceUpdatedAt: "2026-08-26T00:33:16.095Z" };
let published = 0, observed = 0, autoApproved = 0;
for (const m of ready) {
  const pack = candidatesFor(m);
  const lab = Gate.select({ m, h: pack.h, a: pack.a, homeTrait: "", awayTrait: "", candidates: pack.candidates, meta, today, lab: true });
  if (lab.primary) published += 1;
  else if (lab.observation) observed += 1;
  const auto = Gate.select({ m, h: pack.h, a: pack.a, homeTrait: "wins", awayTrait: "losses", candidates: pack.candidates, meta, today, automatic: true });
  if (auto.primary) autoApproved += 1;
}

assert(published >= 40, `Lab should publish real classifications, got ${published}`);
assert.strictEqual(autoApproved, 0, "stale automatic path must stay closed");
assert(published + observed === ready.length, "every ready fixture should classify or observe");

const sample = ready.find(m => m.home === "Al Dhafra SSC") || ready[0];
const pack = candidatesFor(sample);
const lab = Gate.select({ m: sample, h: pack.h, a: pack.a, homeTrait: "draws", awayTrait: "gg", candidates: pack.candidates, meta, today, lab: true });
assert(lab.route && lab.route.source === "open", "unapproved pair uses open Lab scan");
assert(lab.primary || lab.observation, "sample fixture must not be a blank board");

console.log(JSON.stringify({
  current: current.length,
  ready: ready.length,
  labPublished: published,
  labObserved: observed,
  autoStillZero: autoApproved
}));
console.log("matchup-lab-v289.test.js passed");
