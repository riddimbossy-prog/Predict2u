#!/usr/bin/env node
"use strict";

/**
 * Predict2U generated-data compactor (size-safe).
 *
 * 1. Hoists the shared governance policy once to window.P2U_GOVERNANCE_CONTEXT.
 * 2. Drops every match older than RETENTION_DAYS (including stale NS rows).
 * 3. If still over the operating ceiling, strips bulky per-match fields, then
 *    tightens retention until data.js is under 95 MB / GitHub's 100 MB limit.
 */

const fs = require("fs");
const path = require("path");

const HARD_LIMIT_BYTES = 100 * 1024 * 1024;
const OPERATING_LIMIT_BYTES = 95 * 1024 * 1024;
const DEFAULT_RETENTION_DAYS = Number(process.env.P2U_DATA_RETENTION_DAYS || 14);
const HEAVY_KEYS = [
  "homeStats",
  "awayStats",
  "h2h",
  "leagueTrends",
  "homeStreaks",
  "awayStreaks",
  "venue",
  "governanceContext"
];

function findBalancedEnd(text, start, open, close) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const ch = text[index];
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
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function parseAssignment(text, name, open, close) {
  const marker = text.indexOf(`window.${name}`);
  if (marker < 0) return null;
  const equals = text.indexOf("=", marker);
  const start = text.indexOf(open, equals);
  if (equals < 0 || start < 0) throw new Error(`window.${name} assignment is invalid`);
  const end = findBalancedEnd(text, start, open, close);
  if (end < 0) throw new Error(`window.${name} value is incomplete`);
  return { marker, equals, start, end, value: JSON.parse(text.slice(start, end)) };
}

function newestGovernance(contexts) {
  if (!contexts.length) return null;
  return contexts.slice().sort((a, b) => {
    const at = Date.parse(String(a && a.generatedAt || "")) || 0;
    const bt = Date.parse(String(b && b.generatedAt || "")) || 0;
    return bt - at;
  })[0];
}

function removeExistingGlobal(prefix) {
  const marker = prefix.indexOf("window.P2U_GOVERNANCE_CONTEXT");
  if (marker < 0) return prefix;
  const equals = prefix.indexOf("=", marker);
  const start = prefix.indexOf("{", equals);
  if (equals < 0 || start < 0) return prefix;
  const end = findBalancedEnd(prefix, start, "{", "}");
  if (end < 0) return prefix;
  let statementEnd = end;
  while (statementEnd < prefix.length && /[;\s]/.test(prefix[statementEnd])) statementEnd += 1;
  return prefix.slice(0, marker) + prefix.slice(statementEnd);
}

function matchDateOf(item) {
  const direct = String(item && item.matchDate || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
  const kickoff = String(item && item.kickoff || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(kickoff) ? kickoff : "";
}

function cutoffIso(days) {
  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString().slice(0, 10);
}

function pruneByDate(matches, days) {
  const iso = cutoffIso(days);
  const pruned = [];
  let dropped = 0;
  for (const match of matches) {
    const d = matchDateOf(match);
    if (d && d >= iso) pruned.push(match);
    else dropped += 1;
  }
  return { pruned, dropped, cutoffIso: iso };
}

function stripHeavy(matches) {
  let stripped = 0;
  for (const match of matches) {
    if (!match || typeof match !== "object") continue;
    for (const key of HEAVY_KEYS) {
      if (match[key] != null) {
        delete match[key];
        stripped += 1;
      }
    }
    if (match.learningContext && match.learningContext.engineRules) {
      delete match.learningContext.engineRules;
      stripped += 1;
    }
  }
  return stripped;
}

function serialize(raw, parsed, matches, governance) {
  const prefix = removeExistingGlobal(raw.slice(0, parsed.marker));
  const globalLine = governance
    ? `window.P2U_GOVERNANCE_CONTEXT = ${JSON.stringify(governance)};\n`
    : "";
  const assignmentPrefix = raw.slice(parsed.marker, parsed.start);
  const suffix = raw.slice(parsed.end);
  return `${prefix}${globalLine}${assignmentPrefix}${JSON.stringify(matches)}${suffix}`;
}

function compactFile(file) {
  if (!fs.existsSync(file)) throw new Error(`${path.basename(file)} was not found`);
  const raw = fs.readFileSync(file, "utf8");
  const parsed = parseAssignment(raw, "MATCHES", "[", "]");
  if (!parsed || !Array.isArray(parsed.value)) throw new Error("window.MATCHES is not an array");

  let matches = parsed.value;
  const contexts = [];
  let removedGovernance = 0;
  for (const match of matches) {
    if (!match || typeof match !== "object" || !match.governanceContext) continue;
    contexts.push(match.governanceContext);
    delete match.governanceContext;
    removedGovernance += 1;
  }

  const existingGlobal = parseAssignment(raw, "P2U_GOVERNANCE_CONTEXT", "{", "}");
  const governance = newestGovernance(contexts) || (existingGlobal && existingGlobal.value) || null;
  const before = Buffer.byteLength(raw);

  let retention = DEFAULT_RETENTION_DAYS;
  let { pruned, dropped, cutoffIso: iso } = pruneByDate(matches, retention);
  matches = pruned;
  let strippedFields = 0;

  let compact = serialize(raw, parsed, matches, governance);
  let after = Buffer.byteLength(compact);

  if (after >= OPERATING_LIMIT_BYTES) {
    strippedFields = stripHeavy(matches);
    compact = serialize(raw, parsed, matches, governance);
    after = Buffer.byteLength(compact);
    console.log(`Stripped ${strippedFields} heavy field(s) after date prune.`);
  }

  for (const tighter of [10, 7]) {
    if (after < OPERATING_LIMIT_BYTES) break;
    retention = tighter;
    ({ pruned, dropped, cutoffIso: iso } = pruneByDate(matches, retention));
    matches = pruned;
    compact = serialize(raw, parsed, matches, governance);
    after = Buffer.byteLength(compact);
    console.log(`Tightened retention to ${retention}d (${matches.length} matches, ${(after / 1048576).toFixed(2)} MB).`);
  }

  fs.writeFileSync(file, compact, "utf8");
  const saved = before - after;
  console.log(
    `Compacted ${path.basename(file)}: ${(before / 1048576).toFixed(2)} MB -> ` +
    `${(after / 1048576).toFixed(2)} MB (saved ${(saved / 1048576).toFixed(2)} MB).`
  );
  console.log(
    `Governance hoisted from ${removedGovernance} rows; ` +
    `retention ${retention}d (cutoff ${iso}): kept ${matches.length}, dropped ${dropped}.`
  );

  if (after >= HARD_LIMIT_BYTES) {
    throw new Error(
      `${path.basename(file)} is still at or above GitHub's 100 MB hard limit ` +
      `after governance hoisting, heavy-field strip and ${retention}-day prune.`
    );
  }
  if (after >= OPERATING_LIMIT_BYTES) {
    throw new Error(
      `${path.basename(file)} exceeds Predict2U's 95 MB operating ceiling ` +
      `(${(after / 1048576).toFixed(2)} MB) after ${retention}-day prune.`
    );
  }

  return {
    before,
    after,
    saved,
    removedGovernance,
    matches: matches.length,
    dropped,
    cutoffIso: iso,
    retention,
    strippedFields,
    governance: !!governance
  };
}

function main() {
  const file = path.resolve(process.argv[2] || path.join(__dirname, "data.js"));
  compactFile(file);
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  }
}

module.exports = { compactFile, findBalancedEnd, parseAssignment, pruneByDate };
