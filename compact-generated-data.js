#!/usr/bin/env node
"use strict";

/**
 * Predict2U generated-data compactor (size-safe).
 *
 * 1. Hoists the shared governance policy once to window.P2U_GOVERNANCE_CONTEXT
 *    (removes the per-match duplicate that previously added 50–80 MB).
 * 2. Prunes matches older than RETENTION_DAYS so the committed data.js cannot
 *    grow without bound. The public bundle (current-data.js) already uses a
 *    tighter ±7 day window; this retention only protects the full data.js
 *    that GitHub must accept (< 100 MB hard limit).
 * 3. Enforces a 95 MB operating ceiling before publication.
 */

const fs = require("fs");
const path = require("path");

const HARD_LIMIT_BYTES = 100 * 1024 * 1024;
const OPERATING_LIMIT_BYTES = 95 * 1024 * 1024;
// Keep finished matches for this many days + every upcoming fixture.
const RETENTION_DAYS = Number(process.env.P2U_DATA_RETENTION_DAYS || 21);

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

function isFinished(item) {
  const status = String(item && item.status || "").toUpperCase();
  return ["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD", "PST"].includes(status)
    || (item && item.homeGoals != null && item.awayGoals != null);
}

function pruneOldMatches(matches, retentionDays) {
  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  let kept = 0;
  let dropped = 0;
  const pruned = [];
  for (const match of matches) {
    const d = matchDateOf(match);
    // Always keep upcoming / live; only drop finished rows older than the window.
    if (!d || d >= cutoffIso || !isFinished(match)) {
      pruned.push(match);
      kept += 1;
    } else {
      dropped += 1;
    }
  }
  return { pruned, kept, dropped, cutoffIso };
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
  const { pruned, kept, dropped, cutoffIso } = pruneOldMatches(matches, RETENTION_DAYS);
  matches = pruned;

  const prefix = removeExistingGlobal(raw.slice(0, parsed.marker));
  const globalLine = governance
    ? `window.P2U_GOVERNANCE_CONTEXT = ${JSON.stringify(governance)};\n`
    : "";
  const assignmentPrefix = raw.slice(parsed.marker, parsed.start);
  const suffix = raw.slice(parsed.end);
  const compact = `${prefix}${globalLine}${assignmentPrefix}${JSON.stringify(matches)}${suffix}`;
  fs.writeFileSync(file, compact, "utf8");

  const after = Buffer.byteLength(compact);
  const saved = before - after;
  console.log(
    `Compacted ${path.basename(file)}: ${(before / 1048576).toFixed(2)} MB -> ` +
    `${(after / 1048576).toFixed(2)} MB (saved ${(saved / 1048576).toFixed(2)} MB).`
  );
  console.log(
    `Governance hoisted from ${removedGovernance} rows; ` +
    `retention ${RETENTION_DAYS}d (cutoff ${cutoffIso}): kept ${kept}, dropped ${dropped} finished matches.`
  );

  if (after >= HARD_LIMIT_BYTES) {
    throw new Error(
      `${path.basename(file)} is still at or above GitHub's 100 MB hard limit ` +
      `after governance hoisting and ${RETENTION_DAYS}-day retention prune. ` +
      `Lower P2U_DATA_RETENTION_DAYS or strip additional heavy fields.`
    );
  }
  if (after >= OPERATING_LIMIT_BYTES) {
    throw new Error(
      `${path.basename(file)} exceeds Predict2U's 95 MB operating ceiling ` +
      `(${(after / 1048576).toFixed(2)} MB). Reduce retention or archive older rows.`
    );
  }

  return {
    before,
    after,
    saved,
    removedGovernance,
    matches: matches.length,
    dropped,
    cutoffIso,
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

module.exports = { compactFile, findBalancedEnd, parseAssignment, pruneOldMatches };
