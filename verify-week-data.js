"use strict";

const fs = require("fs");
const path = require("path");

const HERE = __dirname;
const DATA_FILE = path.join(HERE, "data.js");
const REPORT_FILE = path.join(HERE, "week-fixture-report.json");

function utcDate(offsetDays = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function parseMatches(raw) {
  const match = raw.match(/window\.MATCHES\s*=\s*(\[[\s\S]*\]);?\s*$/m);
  if (!match) throw new Error("Could not parse window.MATCHES from data.js");
  const rows = JSON.parse(match[1]);
  if (!Array.isArray(rows)) throw new Error("window.MATCHES is not an array");
  return rows;
}

function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error("Missing data.js. Run node fetch-data.js first.");
    process.exit(1);
  }

  let matches;
  try {
    matches = parseMatches(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error(`Invalid data.js: ${error.message}`);
    process.exit(1);
  }

  const dates = Array.from({ length: 7 }, (_, index) => utcDate(index));
  const rows = dates.map((date) => {
    const dayMatches = matches.filter((item) => item && item.matchDate === date);
    return {
      date,
      games: dayMatches.length,
      leagues: [...new Set(dayMatches.map((item) => item.league).filter(Boolean))].length,
      upcoming: dayMatches.filter((item) => item.homeGoals == null && item.awayGoals == null).length,
      finished: dayMatches.filter((item) => item.homeGoals != null && item.awayGoals != null).length,
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    windowStart: dates[0],
    windowEnd: dates[dates.length - 1],
    totalSavedMatches: matches.length,
    totalGamesInWindow: rows.reduce((sum, row) => sum + row.games, 0),
    daysWithGames: rows.filter((row) => row.games > 0).length,
    daysWithoutGames: rows.filter((row) => row.games === 0).map((row) => row.date),
    dates: rows,
  };

  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("\nPredict2U seven-day fixture report");
  console.log("---------------------------------");
  for (const row of rows) {
    console.log(`${row.date}: ${row.games} game(s), ${row.leagues} league(s)`);
  }
  console.log(`\nSaved ${report.totalGamesInWindow} game(s) across ${report.daysWithGames}/7 day(s).`);
  console.log(`Report written to ${path.basename(REPORT_FILE)}.`);
}

main();
