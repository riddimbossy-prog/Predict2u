#!/usr/bin/env node
"use strict";

/**
 * Predict2U v276 generated-data compactor.
 *
 * The governance report is identical for every match. Older builds embedded
 * the full policy object on every row, adding roughly 50–80 MB to data.js.
 * This compactor hoists that shared object to one global assignment while
 * preserving the public window.MATCHES API and every match-specific field.
 */

const fs = require("fs");
const path = require("path");

const HARD_LIMIT_BYTES = 100 * 1024 * 1024;
const OPERATING_LIMIT_BYTES = 95 * 1024 * 1024;

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

function compactFile(file) {
  if (!fs.existsSync(file)) throw new Error(`${path.basename(file)} was not found`);
  const raw = fs.readFileSync(file, "utf8");
  const parsed = parseAssignment(raw, "MATCHES", "[", "]");
  if (!parsed || !Array.isArray(parsed.value)) throw new Error("window.MATCHES is not an array");

  const matches = parsed.value;
  const contexts = [];
  let removed = 0;
  for (const match of matches) {
    if (!match || typeof match !== "object" || !match.governanceContext) continue;
    contexts.push(match.governanceContext);
    delete match.governanceContext;
    removed += 1;
  }

  const existingGlobal = parseAssignment(raw, "P2U_GOVERNANCE_CONTEXT", "{", "}");
  const governance = newestGovernance(contexts) || (existingGlobal && existingGlobal.value) || null;
  const before = Buffer.byteLength(raw);
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
    `${(after / 1048576).toFixed(2)} MB (saved ${(saved / 1048576).toFixed(2)} MB; ` +
    `hoisted governance from ${removed} match rows).`
  );

  if (after >= HARD_LIMIT_BYTES) {
    throw new Error(`${path.basename(file)} is still at or above GitHub's 100 MB hard limit after governance hoisting`);
  }
  if (after >= OPERATING_LIMIT_BYTES) {
    throw new Error(`${path.basename(file)} exceeds Predict2U's 95 MB operating ceiling; archive or trim historical rows before publishing`);
  }

  return { before, after, saved, removed, matches: matches.length, governance: !!governance };
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

module.exports = { compactFile, findBalancedEnd, parseAssignment };
