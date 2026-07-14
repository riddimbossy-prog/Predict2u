#!/usr/bin/env node
"use strict";

/**
 * Predict2U v250 generated-data compactor.
 * Keeps the public data.js API unchanged while removing indentation that can
 * push generated files over GitHub's 100 MB hard limit.
 */

const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "data.js");

function findArrayEnd(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const ch = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function main() {
  if (!fs.existsSync(file)) throw new Error("data.js was not found");
  const raw = fs.readFileSync(file, "utf8");
  const marker = raw.indexOf("window.MATCHES");
  if (marker < 0) throw new Error("window.MATCHES was not found in data.js");
  const equals = raw.indexOf("=", marker);
  const start = raw.indexOf("[", equals);
  if (equals < 0 || start < 0) throw new Error("window.MATCHES assignment is invalid");
  const end = findArrayEnd(raw, start);
  if (end < 0) throw new Error("window.MATCHES array is incomplete");

  const matches = JSON.parse(raw.slice(start, end));
  if (!Array.isArray(matches)) throw new Error("window.MATCHES is not an array");

  const before = Buffer.byteLength(raw);
  const compact = raw.slice(0, start) + JSON.stringify(matches) + raw.slice(end);
  fs.writeFileSync(file, compact, "utf8");
  const after = Buffer.byteLength(compact);
  const saved = before - after;
  console.log(`Compacted data.js: ${(before / 1048576).toFixed(2)} MB -> ${(after / 1048576).toFixed(2)} MB (saved ${(saved / 1048576).toFixed(2)} MB).`);
  if (after >= 100 * 1024 * 1024) {
    throw new Error("data.js is still at or above GitHub's 100 MB hard limit after compaction");
  }
}

try {
  main();
} catch (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
}
