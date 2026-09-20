#!/usr/bin/env node
"use strict";

/**
 * Refuse to publish a board with zero matches.
 * An empty window.MATCHES is what made dates and fixtures disappear on the live site.
 */

const fs = require("fs");
const path = require("path");
const { parseAssignment } = require("./compact-generated-data.js");

function countMatches(file) {
  if (!fs.existsSync(file)) throw new Error(`${path.basename(file)} was not found.`);
  const raw = fs.readFileSync(file, "utf8");
  const parsed = parseAssignment(raw, "MATCHES", "[", "]");
  if (!parsed || !Array.isArray(parsed.value)) {
    throw new Error(`${path.basename(file)} does not contain window.MATCHES.`);
  }
  return parsed.value.length;
}

function currentWindowCount(file, now=new Date()) {
  if (!fs.existsSync(file)) return 0;
  const raw = fs.readFileSync(file, "utf8");
  const parsed = parseAssignment(raw, "MATCHES", "[", "]");
  if (!parsed || !Array.isArray(parsed.value)) return 0;
  const today = now.toISOString().slice(0, 10);
  const from = new Date(`${today}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 1);
  const to = new Date(`${today}T00:00:00Z`);
  to.setUTCDate(to.getUTCDate() + 7);
  const fromIso = from.toISOString().slice(0, 10);
  const toIso = to.toISOString().slice(0, 10);
  return parsed.value.filter(item => {
    const date = String(item && (item.matchDate || item.kickoff) || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= fromIso && date <= toIso;
  }).length;
}

function main() {
  const dataFile = path.resolve(process.argv[2] || path.join(__dirname, "data.js"));
  const currentFile = path.resolve(process.argv[3] || path.join(__dirname, "current-data.js"));
  let dataCount = 0;
  try { dataCount = countMatches(dataFile); }
  catch (error) { console.warn(error.message); }
  const publicCount = fs.existsSync(currentFile) ? countMatches(currentFile) : 0;
  const publicCurrent = fs.existsSync(currentFile) ? currentWindowCount(currentFile) : 0;
  if (!dataCount && !publicCount) {
    throw new Error(
      "Refusing to publish: window.MATCHES is empty in data.js and current-data.js. " +
      "Dates and matches would disappear from the live board."
    );
  }
  if (!publicCurrent) {
    throw new Error(
      "Refusing to publish: current-data.js has no matches in the live date window. " +
      "Hydrate from SportyBet before pushing an empty date strip."
    );
  }
  console.log(`Publish check passed: ${dataCount} source match(es), ${publicCount} public match(es), ${publicCurrent} in the live window.`);
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  }
}

module.exports = { countMatches, main };
