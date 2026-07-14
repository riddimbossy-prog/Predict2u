#!/usr/bin/env node
"use strict";

/**
 * Predict2U v248 generated-file conflict repair.
 * Generated files should never be hand-merged. This utility builds the two
 * complete conflict candidates, validates them, and keeps the freshest valid
 * generated version.
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const FILES = ["data.js", "track-log.json"];
const MARKERS = /^(<<<<<<< |=======\s*$|>>>>>>> )/m;

function conflictCandidates(text) {
  const lines = text.match(/.*(?:\r?\n|$)/g).filter(Boolean);
  const current = [];
  const incoming = [];
  let found = false;

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.startsWith("<<<<<<< ")) {
      current.push(line);
      incoming.push(line);
      index += 1;
      continue;
    }

    found = true;
    index += 1;
    const left = [];
    while (index < lines.length && !lines[index].startsWith("=======")) {
      left.push(lines[index]);
      index += 1;
    }
    if (index >= lines.length) throw new Error("Conflict block is missing =======");

    index += 1;
    const right = [];
    while (index < lines.length && !lines[index].startsWith(">>>>>>> ")) {
      right.push(lines[index]);
      index += 1;
    }
    if (index >= lines.length) throw new Error("Conflict block is missing >>>>>>>");
    index += 1;

    current.push(...left);
    incoming.push(...right);
  }

  return { found, current: current.join(""), incoming: incoming.join("") };
}

function parseMatches(text) {
  const markerIndex = text.indexOf("window.MATCHES");
  if (markerIndex < 0) throw new Error("window.MATCHES was not found");
  const equalsIndex = text.indexOf("=", markerIndex);
  const start = text.indexOf("[", equalsIndex);
  if (equalsIndex < 0 || start < 0) throw new Error("window.MATCHES assignment is invalid");

  let depth = 0;
  let quote = null;
  let escaped = false;
  let end = -1;

  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
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

  if (end < 0) throw new Error("window.MATCHES array is incomplete");
  const matches = JSON.parse(text.slice(start, end));
  if (!Array.isArray(matches)) throw new Error("window.MATCHES is not an array");
  return matches;
}

function dateValue(value) {
  const stamp = Date.parse(String(value || ""));
  return Number.isFinite(stamp) ? stamp : 0;
}

function evaluate(file, text, side) {
  if (MARKERS.test(text)) return null;

  if (file === "track-log.json") {
    const value = JSON.parse(text);
    if (!value || !Array.isArray(value.picks)) throw new Error("track-log.json has no picks array");
    return {
      side,
      text: `${JSON.stringify(value, null, 2)}\n`,
      score: [dateValue(value.meta && value.meta.updated), value.picks.length]
    };
  }

  if (file === "data.js") {
    const matches = parseMatches(text);
    const latest = matches.reduce((max, item) => {
      const value = dateValue(item && (item.kickoff || item.matchDate));
      return Math.max(max, value);
    }, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const future = matches.filter((item) => dateValue(item && (item.kickoff || item.matchDate)) >= today.getTime()).length;
    return { side, text, score: [latest, future, matches.length] };
  }

  return null;
}

function compareScores(left, right) {
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = Number(left[index] || 0);
    const b = Number(right[index] || 0);
    if (a !== b) return a - b;
  }
  return 0;
}

function repair(file) {
  const target = path.join(ROOT, file);
  if (!fs.existsSync(target)) {
    console.log(`${file}: not present; skipped.`);
    return false;
  }

  const original = fs.readFileSync(target, "utf8");
  if (!MARKERS.test(original)) {
    // Validate clean files too, so broken generated output cannot be committed.
    evaluate(file, original, "clean");
    console.log(`${file}: clean and valid.`);
    return false;
  }

  const split = conflictCandidates(original);
  const options = [];
  for (const [side, text] of [["current", split.current], ["incoming", split.incoming]]) {
    try {
      const result = evaluate(file, text, side);
      if (result) options.push(result);
    } catch (error) {
      console.warn(`${file}: ${side} side is invalid: ${error.message}`);
    }
  }

  if (!options.length) throw new Error(`${file}: neither conflict side is valid`);
  options.sort((a, b) => compareScores(b.score, a.score));
  fs.writeFileSync(target, options[0].text.endsWith("\n") ? options[0].text : `${options[0].text}\n`, "utf8");
  console.log(`${file}: repaired using the ${options[0].side} generated version.`);
  return true;
}

try {
  let changed = false;
  for (const file of FILES) changed = repair(file) || changed;
  console.log(changed ? "Generated-file conflicts repaired." : "No generated-file conflicts found.");
} catch (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
}
