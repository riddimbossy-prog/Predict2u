#!/usr/bin/env node
"use strict";

const assert = require("assert");
const {
  parsePlanWindow,
  isPlanWindowError,
  clampDates,
  dateInWindow,
  orderDatesNearToday,
  flattenErrors
} = require("./api-plan-window.js");

const message = "Free plans do not have access to this date, try from 2026-09-15 to 2026-09-17.";
assert.deepStrictEqual(parsePlanWindow(message), {
  from: "2026-09-15",
  to: "2026-09-17",
  message
});
assert.strictEqual(isPlanWindowError(message), true);
assert.strictEqual(isPlanWindowError("Too many requests"), false);
assert.strictEqual(
  isPlanWindowError({ plan: message }),
  true
);
assert.strictEqual(flattenErrors({ plan: message }).includes("try from"), true);

const dates = [
  "2026-09-14",
  "2026-09-15",
  "2026-09-16",
  "2026-09-17",
  "2026-09-18",
  "2026-09-22"
];
assert.deepStrictEqual(
  clampDates(dates, "2026-09-15", "2026-09-17"),
  ["2026-09-15", "2026-09-16", "2026-09-17"]
);
assert.strictEqual(dateInWindow("2026-09-16", "2026-09-15", "2026-09-17"), true);
assert.strictEqual(dateInWindow("2026-09-14", "2026-09-15", "2026-09-17"), false);

const ordered = orderDatesNearToday(dates, new Date("2026-09-16T12:00:00Z"));
assert.strictEqual(ordered[0], "2026-09-16");
assert.ok(ordered.indexOf("2026-09-15") < ordered.indexOf("2026-09-14"));
assert.ok(ordered.indexOf("2026-09-17") < ordered.indexOf("2026-09-22"));

console.log("api-plan-window tests passed");
