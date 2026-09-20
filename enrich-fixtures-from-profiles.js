#!/usr/bin/env node
"use strict";

/**
 * Attach venue rates from team-profiles.json onto SportyBet/fixture-only rows.
 *
 * API-Football is suspended, so discovery publishes names + odds with
 * analysisPending=true and no homeWinRate / venue sample. Every pick engine
 * (Market Edges, Auto Picks, Full Board) then returns No Bet because
 * MIN_SAMPLE is 8 and win/over/BTTS rates are null.
 *
 * The August profile ledger still has season seeds and settled game rows.
 * Reconstruct the same top-level rate fields fetch-data.js used to write,
 * without inventing teams that are not in the ledger.
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const LEDGER_FILE = path.join(ROOT, "team-profiles.json");
const MIN_SAMPLE = 8;
const MIN_MATCH_SCORE = 60;
const STOP = new Set("fc cf sc afc ac cd fk bk if sk sv calcio utd united ssc club sad pae nk kf ca ue de la el the of and city town athletic".split(" "));

function parseAssignment(raw, name, open, close) {
  const marker = raw.indexOf(`window.${name}`);
  if (marker < 0) return null;
  const equals = raw.indexOf("=", marker);
  const start = raw.indexOf(open, equals);
  if (equals < 0 || start < 0) return null;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
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
    else if (ch === close && --depth === 0) {
      try { return { start, end: i + 1, value: JSON.parse(raw.slice(start, i + 1)) }; }
      catch (_) { return null; }
    }
  }
  return null;
}

function foldName(value) {
  const raw = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const stripped = raw.replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, " ");
  const tokens = stripped.split(" ").filter(tok => tok && tok.length > 1 && !STOP.has(tok));
  return { folded: tokens.join(" "), tokens: new Set(tokens) };
}

function poissonPmf(lambda, k) {
  if (!(lambda > 0)) return k === 0 ? 1 : 0;
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i += 1) p *= lambda / i;
  return p;
}

function poissonRates(gf, ga) {
  const lamH = Math.max(0.2, Math.min(4.5, Number(gf) || 1.2));
  const lamA = Math.max(0.2, Math.min(4.5, Number(ga) || 1.2));
  let win = 0, draw = 0, loss = 0, over15 = 0, over25 = 0, over35 = 0, btts = 0, cs = 0, fts = 0;
  for (let i = 0; i <= 8; i += 1) {
    const pi = poissonPmf(lamH, i);
    for (let j = 0; j <= 8; j += 1) {
      const p = pi * poissonPmf(lamA, j);
      if (i > j) win += p;
      else if (i === j) draw += p;
      else loss += p;
      const total = i + j;
      if (total >= 2) over15 += p;
      if (total >= 3) over25 += p;
      if (total >= 4) over35 += p;
      if (i >= 1 && j >= 1) btts += p;
      if (j === 0) cs += p;
      if (i === 0) fts += p;
    }
  }
  const fhLambda = 0.45 * (lamH + lamA);
  let fhOver05 = 0, fhOver15 = 0;
  for (let k = 0; k <= 8; k += 1) {
    const p = poissonPmf(fhLambda, k);
    if (k >= 1) fhOver05 += p;
    if (k >= 2) fhOver15 += p;
  }
  return {
    win, draw, loss, unbeaten: win + draw,
    over15, over25, over35, btts, cs, fts,
    gf: lamH, ga: lamA,
    ppg: win * 3 + draw,
    fhOver05, fhUnder15: 1 - fhOver15
  };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function ratesFromGames(games) {
  const n = games.length;
  if (!n) return null;
  let wins = 0, draws = 0, over15 = 0, over25 = 0, over35 = 0, btts = 0, cs = 0, fts = 0, gf = 0, ga = 0;
  const form = [];
  for (const game of games) {
    const forGoals = Number(game.gf);
    const against = Number(game.ga);
    if (!Number.isFinite(forGoals) || !Number.isFinite(against)) continue;
    gf += forGoals;
    ga += against;
    if (forGoals > against) { wins += 1; form.push("W"); }
    else if (forGoals === against) { draws += 1; form.push("D"); }
    else form.push("L");
    const total = forGoals + against;
    if (total >= 2) over15 += 1;
    if (total >= 3) over25 += 1;
    if (total >= 4) over35 += 1;
    if (forGoals > 0 && against > 0) btts += 1;
    if (against === 0) cs += 1;
    if (forGoals === 0) fts += 1;
  }
  const used = form.length || n;
  const losses = used - wins - draws;
  const ppg = used ? (wins * 3 + draws) / used : null;
  let noWin = 0, noLoss = 0, noDraw = 0, winStreak = 0, lossStreak = 0;
  for (let i = form.length - 1; i >= 0; i -= 1) {
    if (form[i] !== "W") break;
    winStreak += 1;
  }
  for (let i = form.length - 1; i >= 0; i -= 1) {
    if (form[i] !== "L") break;
    lossStreak += 1;
  }
  for (let i = form.length - 1; i >= 0; i -= 1) {
    if (form[i] === "W") break;
    noWin += 1;
  }
  for (let i = form.length - 1; i >= 0; i -= 1) {
    if (form[i] === "L") break;
    noLoss += 1;
  }
  for (let i = form.length - 1; i >= 0; i -= 1) {
    if (form[i] === "D") break;
    noDraw += 1;
  }
  const pois = poissonRates(gf / used, ga / used);
  return {
    n: used,
    win: wins / used,
    draw: draws / used,
    loss: losses / used,
    unbeaten: (wins + draws) / used,
    over15: over15 / used,
    over25: over25 / used,
    over35: over35 / used,
    btts: btts / used,
    cs: cs / used,
    fts: fts / used,
    gf: gf / used,
    ga: ga / used,
    ppg,
    form: form.slice(-10).join(""),
    noWin, noLoss, noDraw, winStreak, lossStreak,
    fhOver05: pois.fhOver05,
    fhUnder15: pois.fhUnder15,
    empirical: true
  };
}

function blend(emp, seedRates, seedN) {
  if (emp && emp.n >= 6) return emp;
  if (!seedRates && emp) return emp;
  if (!emp) {
    return {
      ...seedRates,
      n: Math.max(seedN || 10, MIN_SAMPLE),
      form: "",
      noWin: 0, noLoss: 0, noDraw: 0, winStreak: 0, lossStreak: 0,
      empirical: false
    };
  }
  const w = Math.min(0.5, emp.n * 0.1);
  const out = { ...emp, empirical: false, n: Math.max(emp.n, seedN || MIN_SAMPLE) };
  for (const key of ["win", "draw", "loss", "unbeaten", "over15", "over25", "over35", "btts", "cs", "fts", "gf", "ga", "ppg", "fhOver05", "fhUnder15"]) {
    if (emp[key] == null) out[key] = seedRates[key];
    else if (seedRates[key] != null) out[key] = emp[key] * (1 - w) + seedRates[key] * w;
  }
  return out;
}

function sideRates(entry, venue) {
  if (!entry) return null;
  const games = Array.isArray(entry.games) ? entry.games : [];
  const split = games.filter(game => game && game.venue === venue);
  const use = split.length >= 4 ? split : games;
  const emp = ratesFromGames(use);
  const seed = entry.seed;
  const seedRates = seed && seed.gfPm != null && seed.gaPm != null ? poissonRates(seed.gfPm, seed.gaPm) : null;
  const seedN = seed && Number.isFinite(Number(seed.n)) ? Number(seed.n) : (seedRates ? 10 : 0);
  if (emp && emp.n >= 6) {
    if (emp.n < MIN_SAMPLE && seedRates) return blend(emp, seedRates, seedN);
    return emp;
  }
  if (seedRates) return blend(emp, seedRates, seedN);
  return emp;
}

function scoreHit(query, rec) {
  if (!rec.folded) return 0;
  let score = 0;
  if (rec.folded === query.folded) score += 100;
  else if (rec.folded.startsWith(query.folded) || query.folded.startsWith(rec.folded)) score += 70;
  else if (query.folded && (rec.folded.includes(query.folded) || query.folded.includes(rec.folded))) score += 55;
  if (query.tokens.size && rec.tokens.size) {
    let inter = 0;
    for (const tok of query.tokens) if (rec.tokens.has(tok)) inter += 1;
    const uni = query.tokens.size + rec.tokens.size - inter;
    if (uni) score += 40 * (inter / uni);
    if (inter === query.tokens.size || inter === rec.tokens.size) score += 15;
  }
  if (query.league && rec.league && (query.league === rec.league || rec.league.includes(query.league) || query.league.includes(rec.league))) {
    score += 20;
  }
  return score;
}

function buildIndex(teams) {
  const exact = new Map();
  const byToken = new Map();
  const rows = [];
  for (const [key, value] of Object.entries(teams || {})) {
    const name = (value && value.name) || String(key).split("|")[0];
    const folded = foldName(name);
    const league = foldName(value && value.league).folded;
    const rec = { key, value, name, folded: folded.folded, tokens: folded.tokens, league };
    rows.push(rec);
    if (!exact.has(folded.folded)) exact.set(folded.folded, []);
    exact.get(folded.folded).push(rec);
    for (const tok of folded.tokens) {
      if (!byToken.has(tok)) byToken.set(tok, []);
      const list = byToken.get(tok);
      if (list.length < 80) list.push(rec);
    }
  }
  return { exact, byToken, rows };
}

function lookup(index, name, league) {
  const query = foldName(name);
  query.league = foldName(league).folded;
  if (!query.folded) return null;
  const cands = [];
  const seen = new Set();
  const push = rec => {
    if (!rec || seen.has(rec.key)) return;
    seen.add(rec.key);
    cands.push(rec);
  };
  for (const rec of index.exact.get(query.folded) || []) push(rec);
  for (const tok of query.tokens) {
    for (const rec of index.byToken.get(tok) || []) push(rec);
  }
  let best = null;
  let bestScore = -1;
  for (const rec of cands) {
    const score = scoreHit(query, rec);
    const games = (rec.value && rec.value.games && rec.value.games.length) || 0;
    if (score > bestScore || (score === bestScore && best && games > ((best.value.games || []).length))) {
      best = rec;
      bestScore = score;
    }
  }
  if (!best || bestScore < MIN_MATCH_SCORE) return null;
  return { rec: best, score: bestScore };
}

function hasUsableStats(match, side) {
  return Number(match && match[`${side}VenueGames`]) >= MIN_SAMPLE && match[`${side}WinRate`] != null;
}

function attachSide(match, side, rates, profileName, league) {
  if (!rates || !rates.n) return false;
  const prefix = side;
  match[`${prefix}VenueGames`] = rates.n;
  match[`${prefix}VenuePts`] = round2((rates.ppg || 0) * rates.n);
  match[`${prefix}WinRate`] = round2(rates.win);
  match[`${prefix}UnbeatenRate`] = round2(rates.unbeaten);
  match[`${prefix}CleanSheetRate`] = round2(rates.cs);
  match[`${prefix}FailedToScoreRate`] = round2(rates.fts);
  match[`${prefix}Over15Rate`] = round2(rates.over15);
  match[`${prefix}Over25Rate`] = round2(rates.over25);
  match[`${prefix}Over35Rate`] = round2(rates.over35);
  match[`${prefix}BTTSRate`] = round2(rates.btts);
  match[`${prefix}FHOver05Rate`] = round2(rates.fhOver05);
  match[`${prefix}FHUnder15Rate`] = round2(rates.fhUnder15);
  match[`${prefix}Recent10PPG`] = round2(rates.ppg);
  if (rates.form) match[`${prefix}Recent10Form`] = rates.form;
  if (side === "home") {
    match.homeScoredAtHome = round2(rates.gf);
    match.homeConcededAtHome = round2(rates.ga);
  } else {
    match.awayScoredAway = round2(rates.gf);
    match.awayConcededAway = round2(rates.ga);
  }
  match[`${prefix}Streaks`] = {
    sample: rates.n,
    win: rates.winStreak || 0,
    loss: rates.lossStreak || 0,
    noWin: rates.noWin || 0,
    noLoss: rates.noLoss || 0,
    noDraw: rates.noDraw || 0,
    htft: {
      ftSample: rates.n,
      ftWin: round2(rates.win),
      ftDraw: round2(rates.draw),
      ftLoss: round2(rates.loss),
      ftCS: round2(rates.cs),
      ftFTS: round2(rates.fts),
      ftBtts: round2(rates.btts),
      fhOver05: round2(rates.fhOver05),
      fhUnder15: round2(rates.fhUnder15)
    }
  };
  match[`${prefix}Profile`] = {
    name: profileName,
    league,
    usedSplit: side === "home" ? "H" : "A",
    games: rates.n,
    goalsFor: { v: round2(rates.gf), n: rates.n },
    goalsAg: { v: round2(rates.ga), n: rates.n }
  };
  return true;
}

function loadLedger(file = LEDGER_FILE) {
  if (!fs.existsSync(file)) return { updated: null, teams: {} };
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (_) { return { updated: null, teams: {} }; }
}

function enrichMatches(matches, ledger) {
  const teams = (ledger && ledger.teams) || {};
  const index = buildIndex(teams);
  const stats = { considered: 0, attached: 0, bothReady: 0, skippedExisting: 0, unmatched: 0 };
  for (const match of matches || []) {
    if (!match || !match.home || !match.away) continue;
    stats.considered += 1;
    let ready = 0;
    for (const [side, venue] of [["home", "H"], ["away", "A"]]) {
      if (hasUsableStats(match, side)) {
        stats.skippedExisting += 1;
        ready += 1;
        continue;
      }
      const hit = lookup(index, match[side], match.league);
      if (!hit) {
        stats.unmatched += 1;
        continue;
      }
      const rates = sideRates(hit.rec.value, venue);
      if (attachSide(match, side, rates, hit.rec.name, hit.rec.value.league || match.league)) {
        stats.attached += 1;
        if (rates.n >= MIN_SAMPLE) ready += 1;
      }
    }
    if (ready === 2) {
      stats.bothReady += 1;
      match.analysisPending = false;
      match.fixtureOnly = false;
      match.enrichmentStatus = "profile-ledger";
      match.dataCoverage = 70;
      match.statsReal = false;
      match.profileEnriched = true;
    } else if (ready === 1 || match.homeWinRate != null || match.awayWinRate != null) {
      match.enrichmentStatus = match.enrichmentStatus === "analysed" ? match.enrichmentStatus : "profile-ledger-partial";
      match.dataCoverage = Math.max(Number(match.dataCoverage) || 0, 35);
      match.profileEnriched = true;
    }
  }
  try {
    const peer = require("./similar-strength-tips.js");
    const peerStats = peer.attachPeerIntel(matches, ledger, {
      lookup,
      buildIndex,
      ratesFromGames,
      poissonRates
    });
    stats.peerRanked = peerStats.ranked;
    stats.peerTipped = peerStats.tipped;
    stats.peerSimilar = peerStats.similar;
    stats.peerAttached = peerStats.attached;
  } catch (error) {
    stats.peerError = error && error.message;
  }
  return stats;
}

function rewriteArrayFile(file, name, rows) {
  const raw = fs.readFileSync(file, "utf8");
  const parsed = parseAssignment(raw, name, "[", "]");
  if (!parsed) throw new Error(`${path.basename(file)} does not contain window.${name}`);
  const next = raw.slice(0, parsed.start) + JSON.stringify(rows) + raw.slice(parsed.end);
  fs.writeFileSync(file, next, "utf8");
}

function writeSmtBundle(matches, now = new Date()) {
  const peer = require("./similar-strength-tips.js");
  const rows = peer.buildSmtRows(matches, now.toISOString().slice(0, 10));
  const body =
    "/* Predict2U SMT similar market tips */\n" +
    "window.P2U_SMT=" + JSON.stringify(rows) + ";\n" +
    "window.P2U_SMT_META=" + JSON.stringify({
      generatedAt: now.toISOString(),
      count: rows.length,
      version: "smt-v291"
    }) + ";\n";
  fs.writeFileSync(path.join(ROOT, "smt-data.js"), body, "utf8");
  return rows.length;
}

function enrichFile(file, name, ledger) {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const parsed = parseAssignment(raw, name, "[", "]");
  if (!parsed || !Array.isArray(parsed.value)) return null;
  const stats = enrichMatches(parsed.value, ledger);
  rewriteArrayFile(file, name, parsed.value);
  return { file: path.basename(file), count: parsed.value.length, rows: parsed.value, ...stats };
}

function enrichPublishedFiles(now = new Date()) {
  const ledger = loadLedger();
  const results = [];
  const fixtures = path.join(ROOT, "fixtures.js");
  const current = path.join(ROOT, "current-data.js");
  const dataFile = path.join(ROOT, "data.js");
  if (fs.existsSync(fixtures)) results.push(enrichFile(fixtures, "FIXTURES", ledger));
  if (fs.existsSync(current)) results.push(enrichFile(current, "MATCHES", ledger));
  else if (fs.existsSync(dataFile)) results.push(enrichFile(dataFile, "MATCHES", ledger));
  const smtSource = results.filter(Boolean).slice(-1)[0];
  if (smtSource && Array.isArray(smtSource.rows)) {
    try { smtSource.smtRows = writeSmtBundle(smtSource.rows, now); }
    catch (error) { smtSource.smtError = error && error.message; }
  }
  return { generatedAt: now.toISOString(), ledgerUpdated: ledger.updated || null, results: results.filter(Boolean) };
}

function main() {
  const report = enrichPublishedFiles();
  for (const row of report.results) {
    console.log(
      `Profile enrich ${row.file}: ${row.bothReady}/${row.count} fixtures ready for picks, ` +
      `${row.attached} side(s) attached, ${row.unmatched} unmatched, ${row.skippedExisting} already had stats` +
      (row.peerTipped!=null?`, ${row.peerTipped} similar-strength tip sheet(s).` : '.')
    );
  }
  if (!report.results.length) {
    console.warn("Profile enrich skipped: no fixtures.js or current-data.js");
  }
  return report;
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  }
}

module.exports = {
  MIN_SAMPLE,
  foldName,
  poissonRates,
  ratesFromGames,
  sideRates,
  buildIndex,
  lookup,
  enrichMatches,
  enrichPublishedFiles,
  writeSmtBundle,
  parseAssignment,
  loadLedger
};
