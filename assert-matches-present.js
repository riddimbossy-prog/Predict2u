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

function main() {
  const dataFile = path.resolve(process.argv[2] || path.join(__dirname, "data.js"));
  const currentFile = path.resolve(process.argv[3] || path.join(__dirname, "current-data.js"));
  const dataCount = countMatches(dataFile);
  if (!dataCount) {
    throw new Error(
      "Refusing to publish: window.MATCHES is empty in data.js. " +
      "Dates and matches would disappear from the live board."
    );
  }
  if (fs.existsSync(currentFile)) {
    const publicCount = countMatches(currentFile);
    if (!publicCount) {
      throw new Error(
        "Refusing to publish: current-data.js has 0 public matches. " +
        "The site loads this file first, so the date strip would stay empty."
      );
    }
    console.log(`Publish check passed: ${dataCount} source match(es), ${publicCount} public match(es).`);
  } else {
    console.log(`Publish check passed: ${dataCount} source match(es).`);
  }
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  }
}

module.exports = { countMatches, main };
