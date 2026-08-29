#!/usr/bin/env node
'use strict';

/**
 * Predict2U SportyBet odds overlay.
 * Collects SportyBet markets the same way Stats2Pitch does, then writes a
 * compact browser feed (sportybet-odds.js). Matching onto MATCHES happens
 * client-side so we do not rewrite the 40MB+ current-data.js bundle.
 */

const fs = require('fs');
const path = require('path');
const { sportyUpcoming } = require('./sportybet-collect');

const ROOT = __dirname;
const OUT_JS = path.join(ROOT, 'sportybet-odds.js');
const OUT_REPORT = path.join(ROOT, 'sportybet-odds-coverage.json');

function compactOdds(odds) {
  const out = {};
  for (const [k, v] of Object.entries(odds || {})) {
    if (Number.isFinite(Number(v)) && Number(v) > 1) out[k] = Number(Number(v).toFixed(3));
  }
  return out;
}

async function main() {
  const started = Date.now();
  const pack = await sportyUpcoming({
    timeline: Number(process.env.SPORTYBET_TIMELINE || 168)
  });
  const rows = pack.rows
    .filter(row => row.home && row.away && row.kickoff)
    .map(row => ({
      eventId: row.eventId,
      gameId: row.gameId,
      home: row.home,
      away: row.away,
      league: row.league,
      country: row.country,
      kickoff: row.kickoff,
      matchDate: row.matchDate,
      odds: compactOdds(row.odds)
    }))
    .filter(row => Object.keys(row.odds).length);

  const payload = {
    version: 'v286',
    generatedAt: new Date().toISOString(),
    provider: 'sportybet',
    country: pack.country,
    timelineHours: pack.timeline,
    events: pack.rows.length,
    priced: rows.length
  };

  const js = `/* AUTO-GENERATED SportyBet odds overlay — do not edit. */\nwindow.P2U_SPORTYBET=${JSON.stringify({ ...payload, rows })};\n`;
  fs.writeFileSync(OUT_JS, js, 'utf8');
  fs.writeFileSync(OUT_REPORT, JSON.stringify({
    ...payload,
    bytes: Buffer.byteLength(js),
    elapsedMs: Date.now() - started,
    sample: rows.slice(0, 5).map(r => ({ home: r.home, away: r.away, league: r.league, keys: Object.keys(r.odds) }))
  }, null, 2) + '\n', 'utf8');

  console.log(`SportyBet overlay: ${rows.length}/${pack.rows.length} priced events, ${(Buffer.byteLength(js) / 1024).toFixed(1)} KB.`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = { main };
