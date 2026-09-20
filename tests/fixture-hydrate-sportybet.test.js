#!/usr/bin/env node
"use strict";

const assert = require("assert");
const {
  dateOf,
  hasCurrentDates,
  mergeCurrentFixtures,
  sportyRowToFixture
} = require("../hydrate-fixtures-from-sportybet.js");
const { isPermanentProviderError } = require("../api-plan-window.js");

const now = new Date("2026-09-20T19:00:00Z");

const sporty = [
  { home: "AC Milan", away: "Lecce", league: "Serie A", country: "Italy", kickoff: "2026-09-20T18:45:00.000Z", matchDate: "2026-09-20", eventId: "sr:match:1", odds: { home: 1.5, draw: 4, away: 6 } },
  { home: "Marseille", away: "PSG", league: "Ligue 1", country: "France", kickoff: "2026-09-20T18:45:00.000Z", matchDate: "2026-09-20", eventId: "sr:match:2", odds: { home: 3.2, draw: 3.4, away: 2.1 } }
];

const stale = [
  { id: 1, home: "Libertad", away: "Macara", matchDate: "2026-08-25", kickoff: "2026-08-25T00:00:00Z", status: "FT", homeGoals: 1, awayGoals: 0 }
];

assert.strictEqual(dateOf(sporty[0]), "2026-09-20");
assert.strictEqual(hasCurrentDates(stale, now), false);
assert.strictEqual(hasCurrentDates(sporty, now), true);

const emptyMerge = mergeCurrentFixtures([], sporty, now);
assert.strictEqual(emptyMerge.added, 2);
assert.strictEqual(emptyMerge.fixtures.length, 2);
assert.strictEqual(emptyMerge.fixtures[0].enrichmentStatus, "sportybet-fixture");
assert.strictEqual(emptyMerge.fixtures[0].homeGoals, null);

const keepStaleOut = mergeCurrentFixtures(stale, sporty, now);
assert.ok(keepStaleOut.fixtures.some(row => row.home === "AC Milan"));
assert.ok(keepStaleOut.fixtures.some(row => row.home === "Libertad"), "historical rows stay available");

const duplicate = mergeCurrentFixtures(
  [sportyRowToFixture(sporty[0])],
  sporty,
  now
);
assert.strictEqual(duplicate.added, 1, "already-present Milan/Lecce is not duplicated");
assert.strictEqual(duplicate.fixtures.filter(row => row.home === "AC Milan").length, 1);

assert.strictEqual(isPermanentProviderError("Your account is suspended, check on https://dashboard.api-football.com."), true);
assert.strictEqual(isPermanentProviderError("Free plans do not have access to this date, try from 2026-09-19 to 2026-09-21."), false);
assert.strictEqual(isPermanentProviderError("Too many requests. Rate limit exceeded."), false);

console.log("fixture-hydrate-sportybet.test.js passed");
