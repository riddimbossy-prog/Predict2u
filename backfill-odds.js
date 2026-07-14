#!/usr/bin/env node
/* ============================================================================
 * backfill-odds.js — STANDALONE historical-odds backfill + coverage probe
 * ----------------------------------------------------------------------------
 * Purpose: use TheStatsAPI's historical-odds endpoint to seed a REAL, backfilled
 * calibration ledger (per league -> market -> price band -> hit rate) from years
 * of settled matches — the "pull historical odds and how the market performed"
 * feature that API-Football could never provide.
 *
 * DESIGN PRINCIPLES (deliberate):
 *  1. STANDALONE. Does NOT touch fetch-data.js / fetch-scores.js / data.js.
 *     It can fail completely and your live board keeps running untouched.
 *  2. PROBES REALITY. It does not trust the vendor docs' example shape. It reads
 *     what the API actually returns for YOUR league IDs, adapts to the real
 *     field names, and reports honestly where odds are missing.
 *  3. HONEST COVERAGE REPORT. The whole point of the trial is to learn whether
 *     your OBSCURE leagues (Serie D, Copa Chile, Icelandic divs) actually carry
 *     historical odds — not just the Premier Leagues. This prints that truth.
 *  4. SECRET-SAFE. Reads the key from env (THESTATSAPI_KEY) or config.txt.
 *     Never hardcode a key. Never commit the key.
 *
 * OUTPUT: odds-history.json  — a persistent ledger in the SAME shape the engine
 *         already consumes (oddsCalibFor in banker-engine.js), so a later merge
 *         step can fold it into the live board IF coverage proves worthwhile.
 *
 * USAGE:
 *   THESTATSAPI_KEY=xxxx node backfill-odds.js                 (all mapped leagues)
 *   THESTATSAPI_KEY=xxxx node backfill-odds.js --probe         (coverage report only, no write)
 *   THESTATSAPI_KEY=xxxx node backfill-odds.js --leagues "Serie D,Copa Chile"
 *   THESTATSAPI_KEY=xxxx node backfill-odds.js --seasons 3     (how many seasons back; default 3)
 * ==========================================================================*/

const fs = require("fs");
const path = require("path");
const https = require("https");

const HERE = __dirname;
const BASE = "https://api.thestatsapi.com/api";

// ---- shared band + market logic: MUST match calib.js / banker-engine.js ----
let shared = null;
try { shared = require("./calib"); } catch (e) { /* fall back to inline below */ }

const band = shared ? shared.band : (o =>
  o < 1.45 ? "1.20-1.44" : o < 1.70 ? "1.45-1.69" : o < 2.00 ? "1.70-1.99"
  : o < 2.50 ? "2.00-2.49" : "2.50+");

// display market -> predicate(homeGoals, awayGoals). Mirrors calib.js MARKETS,
// but keyed here to the SETTLE logic so the backfill is self-contained.
const MARKET_PREDICATE = {
  "Home Win":        (h,a)=> h>a,
  "Away Win":        (h,a)=> a>h,
  "Over 1.5 Goals":  (h,a)=> h+a>=2,
  "Over 2.5 Goals":  (h,a)=> h+a>=3,
  "Under 2.5 Goals": (h,a)=> h+a<=2,
  "Under 3.5 Goals": (h,a)=> h+a<=3,
  "BTTS Yes":        (h,a)=> h>0 && a>0,
  "BTTS No":         (h,a)=> !(h>0 && a>0),
};
const MIN_BAND_SAMPLE = shared ? shared.MIN_BAND_SAMPLE : 5;

// ---------------------------------------------------------------------------
// key handling — env first, then config.txt (never hardcode, never log it)
// ---------------------------------------------------------------------------
function loadKey() {
  if (process.env.THESTATSAPI_KEY && process.env.THESTATSAPI_KEY.trim())
    return process.env.THESTATSAPI_KEY.trim();
  try {
    const raw = fs.readFileSync(path.join(HERE, "config.txt"), "utf8");
    // accept lines like  THESTATSAPI_KEY=xxxx   or   thestatsapi=xxxx
    const m = raw.match(/(?:THESTATSAPI_KEY|thestatsapi|stats_api_key)\s*=\s*(\S+)/i);
    if (m) return m[1].trim();
  } catch (e) {}
  return null;
}

// ---------------------------------------------------------------------------
// tiny HTTPS GET with auth + JSON parse; returns { status, json } or throws
// ---------------------------------------------------------------------------
function apiGet(urlPath, key) {
  const url = urlPath.startsWith("http") ? urlPath : BASE + urlPath;
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    }, res => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => {
        let json = null;
        try { json = data ? JSON.parse(data) : null; } catch (e) {}
        resolve({ status: res.statusCode, json, raw: data });
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(new Error("timeout")); });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// ADAPTIVE FIELD READERS — do NOT trust one doc shape. Probe several.
// The docs show matches with home_team.score / score.home / home_score in
// different examples, and odds under match_odds/total_goals with opening/
// last_seen. We read defensively and prefer last_seen (closing-ish) over
// opening, since that's the sharper number for calibration.
// ---------------------------------------------------------------------------
function readGoals(m) {
  const pick = (...vals) => { for (const v of vals) if (v != null && v !== "") return Number(v); return null; };
  const h = pick(m.home_score, m.home_goals,
    m.home_team && m.home_team.score, m.score && m.score.home,
    m.home && m.home.score, m.result && m.result.home);
  const a = pick(m.away_score, m.away_goals,
    m.away_team && m.away_team.score, m.score && m.score.away,
    m.away && m.away.score, m.result && m.result.away);
  return { h: Number.isFinite(h) ? h : null, a: Number.isFinite(a) ? a : null };
}
function isFinished(m) {
  const s = String(m.status || m.state || "").toLowerCase();
  return s.includes("finish") || s === "ft" || s === "complete" || s === "played";
}
function matchId(m) {
  return m.id || m.match_id || m.mt_id || (m.match && m.match.id) || null;
}
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }

// From an odds payload (per docs: bookmakers[].markets.match_odds / total_goals
// with opening/last_seen), pull the numbers we bucket. Prefer last_seen. Returns
// a flat { home, away, over25, under25, over15, under35, bttsYes, bttsNo } with
// nulls where absent. Adaptive to a few likely shapes.
function readOdds(oddsData) {
  if (!oddsData) return null;
  const out = {};
  const bookmakers = oddsData.bookmakers || (oddsData.data && oddsData.data.bookmakers) || [];
  const val = o => o == null ? null : (typeof o === "object" ? num(o.last_seen ?? o.closing ?? o.opening ?? o.price) : num(o));
  // prefer a sharp book if present, else first available
  const order = ["Pinnacle", "Betfair Exchange", "Bet365", "Kambi"];
  const books = [...bookmakers].sort((a,b) => {
    const ai = order.indexOf(a.bookmaker), bi = order.indexOf(b.bookmaker);
    return (ai<0?99:ai) - (bi<0?99:bi);
  });
  for (const bk of books) {
    const mk = bk.markets || bk.odds || {};
    const mo = mk.match_odds || mk["1x2"] || mk.match_result || {};
    const tg = mk.total_goals || mk.totals || mk.over_under || {};
    const btts = mk.btts || mk.both_teams_to_score || {};
    if (out.home == null && mo.home) out.home = val(mo.home);
    if (out.away == null && mo.away) out.away = val(mo.away);
    // totals may be keyed by line; try 2.5 explicitly, else generic over/under
    const line = k => tg[k] || (tg.lines && tg.lines[k]) || null;
    const o25 = line("2.5") || line("over_2_5") || (tg.over && tg.line == 2.5 ? tg : null) || tg;
    if (out.over25 == null && o25 && o25.over) out.over25 = val(o25.over);
    if (out.under25 == null && o25 && o25.under) out.under25 = val(o25.under);
    const l15 = line("1.5"), l35 = line("3.5");
    if (out.over15 == null && l15 && l15.over) out.over15 = val(l15.over);
    if (out.under35 == null && l35 && l35.under) out.under35 = val(l35.under);
    if (out.bttsYes == null && btts.yes) out.bttsYes = val(btts.yes);
    if (out.bttsNo == null && btts.no) out.bttsNo = val(btts.no);
  }
  // drop keys that stayed null so callers can tell what was really present
  for (const k of Object.keys(out)) if (out[k] == null) delete out[k];
  return Object.keys(out).length ? out : null;
}
const ODDS_FIELD = {
  "Home Win":"home","Away Win":"away","Over 1.5 Goals":"over15","Over 2.5 Goals":"over25",
  "Under 2.5 Goals":"under25","Under 3.5 Goals":"under35","BTTS Yes":"bttsYes","BTTS No":"bttsNo",
};

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
(async function main() {
  const args = process.argv.slice(2);
  const probeOnly = args.includes("--probe");
  const seasonsBack = (() => { const i = args.indexOf("--seasons"); return i>=0 ? Math.max(1, parseInt(args[i+1])||3) : 3; })();
  const leaguesArg = (() => { const i = args.indexOf("--leagues"); return i>=0 ? (args[i+1]||"").split(",").map(s=>s.trim()).filter(Boolean) : null; })();

  const key = loadKey();
  if (!key) {
    console.error("No API key found. Set THESTATSAPI_KEY env var, or add a line to config.txt:\n  THESTATSAPI_KEY=your_trial_key\n(Do NOT paste your key into any chat.)");
    process.exit(1);
  }

  console.log(`\nTheStatsAPI historical-odds backfill  ${probeOnly ? "(PROBE ONLY — no file written)" : ""}`);
  console.log(`Seasons back: ${seasonsBack}\n`);

  // --- 0. connectivity + auth check on a cheap endpoint ---
  const ping = await apiGet("/football/competitions?per_page=1", key);
  if (ping.status === 401 || ping.status === 403) {
    console.error(`Auth failed (HTTP ${ping.status}). Check the key / that the trial is active.`);
    process.exit(1);
  }
  if (ping.status === 429) { console.error("Rate limited on the very first call (HTTP 429). Wait and retry."); process.exit(1); }
  if (!ping.json) { console.error(`Unexpected response (HTTP ${ping.status}). Body was not JSON:\n${(ping.raw||"").slice(0,300)}`); process.exit(1); }
  console.log("Auth OK — connected to TheStatsAPI.\n");

  // --- 1. resolve which competitions to pull ---
  // Load all competitions (paginate), then match against the leagues we want.
  // Which leagues do we want? Either --leagues, or the distinct leagues already
  // in the live data.js (so we test exactly the board's real leagues).
  let wantNames = leaguesArg;
  if (!wantNames) {
    try {
      const raw = fs.readFileSync(path.join(HERE, "data.js"), "utf8");
      const mm = raw.match(/window\.MATCHES\s*=\s*(\[[\s\S]*?\]);?\s*$/);
      if (mm) {
        const M = JSON.parse(mm[1]);
        wantNames = [...new Set(M.map(x => x.league).filter(Boolean))];
      }
    } catch (e) {}
  }
  if (!wantNames || !wantNames.length) {
    console.error("No target leagues. Pass --leagues \"Serie D,Copa Chile\" or run where data.js exists.");
    process.exit(1);
  }
  console.log(`Target leagues (${wantNames.length}): ${wantNames.slice(0,12).join(", ")}${wantNames.length>12?" …":""}\n`);

  // fetch competition catalog (paginate up to a sane cap)
  const comps = [];
  for (let page = 1; page <= 40; page++) {
    const r = await apiGet(`/football/competitions?per_page=100&page=${page}`, key);
    const arr = (r.json && (r.json.data || r.json.competitions)) || [];
    comps.push(...arr);
    const meta = r.json && r.json.meta;
    if (!arr.length || (meta && meta.page >= meta.total_pages)) break;
    await sleep(250);
  }
  console.log(`Competition catalog loaded: ${comps.length} competitions.\n`);

  const norm = s => String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
  const compName = c => c.name || c.competition || c.title || "";
  const compId = c => c.id || c.competition_id || c.comp_id || null;
  const matched = [];
  for (const want of wantNames) {
    const hit = comps.find(c => norm(compName(c)) === norm(want))
             || comps.find(c => norm(compName(c)).includes(norm(want)) || norm(want).includes(norm(compName(c))));
    matched.push({ want, comp: hit || null });
  }
  const unmatched = matched.filter(m => !m.comp).map(m => m.want);
  if (unmatched.length) console.log(`No competition match for: ${unmatched.join(", ")}\n`);

  // --- 2. per matched league: pull finished matches across seasons, then odds ---
  const nowY = new Date().getFullYear();
  const seasons = []; for (let y = nowY; y > nowY - seasonsBack; y--) seasons.push(y);

  const coverage = [];   // per-league coverage report
  const perLg = {};      // league -> market -> band -> {n,hit}

  for (const { want, comp } of matched) {
    if (!comp) continue;
    const cid = compId(comp);
    let finished = 0, withOdds = 0, settledCells = 0;

    for (const season of seasons) {
      // pull matches for this competition+season (paginate)
      for (let page = 1; page <= 20; page++) {
        const r = await apiGet(`/football/matches?competition_id=${encodeURIComponent(cid)}&season=${season}&per_page=100&page=${page}`, key);
        if (r.status === 429) { console.log("  rate limited — pausing 5s"); await sleep(5000); page--; continue; }
        const arr = (r.json && (r.json.data || r.json.matches)) || [];
        if (!arr.length) break;

        for (const m of arr) {
          if (!isFinished(m)) continue;
          const { h, a } = readGoals(m);
          if (h == null || a == null) continue;
          finished++;
          const id = matchId(m);
          if (!id) continue;

          // fetch this match's historical odds
          const or = await apiGet(`/football/matches/${encodeURIComponent(id)}/odds`, key);
          if (or.status === 429) { await sleep(5000); }
          const odds = readOdds(or.json && (or.json.data || or.json));
          if (!odds) { continue; }
          withOdds++;

          // bucket every market we have odds for
          const L = compName(comp) || want;
          const C = perLg[L] = perLg[L] || {};
          for (const [mkName, pred] of Object.entries(MARKET_PREDICATE)) {
            const field = ODDS_FIELD[mkName];
            const price = odds[field];
            if (price == null || price < 1.05) continue;
            const b = band(price);
            const cm = C[mkName] = C[mkName] || {};
            const cb = cm[b] = cm[b] || { n:0, hit:0 };
            cb.n++; if (pred(h, a)) cb.hit++;
            settledCells++;
          }
          await sleep(120); // be polite to the API
        }
        const meta = r.json && r.json.meta;
        if (meta && meta.page >= meta.total_pages) break;
        await sleep(200);
      }
    }

    const pct = finished ? Math.round((withOdds/finished)*100) : 0;
    coverage.push({ league: compName(comp)||want, requested: want, finished, withOdds, oddsPct: pct });
    console.log(`  ${compName(comp)||want}: ${finished} finished, ${withOdds} with odds (${pct}%)`);
  }

  // --- 3. collapse to the engine's ledger shape (min sample guard) ---
  const ledger = {};
  for (const [L, C] of Object.entries(perLg)) {
    const outL = {}; let any = false;
    for (const [mk, bands] of Object.entries(C)) {
      const bo = {};
      for (const [b, v] of Object.entries(bands)) {
        if (v.n >= MIN_BAND_SAMPLE) { bo[b] = { n:v.n, hit: Math.round((v.hit/v.n)*100)/100 }; any = true; }
      }
      if (Object.keys(bo).length) outL[mk] = bo;
    }
    if (any) ledger[L] = outL;
  }

  // --- 4. honest coverage report ---
  console.log("\n================= COVERAGE REPORT =================");
  coverage.sort((a,b)=> b.oddsPct - a.oddsPct);
  const good = coverage.filter(c => c.withOdds >= 20);
  const thin = coverage.filter(c => c.withOdds > 0 && c.withOdds < 20);
  const empty = coverage.filter(c => c.withOdds === 0);
  console.log(`Leagues with USABLE historical odds (>=20 settled w/ odds): ${good.length}`);
  good.forEach(c => console.log(`   ${c.oddsPct}%  ${c.league}  (${c.withOdds}/${c.finished})`));
  if (thin.length) { console.log(`Thin (some odds, <20): ${thin.length}`); thin.forEach(c=>console.log(`   ${c.league} (${c.withOdds})`)); }
  if (empty.length) console.log(`NO historical odds returned: ${empty.length} — ${empty.map(c=>c.league).join(", ")}`);
  console.log(`Ledger leagues built (cleared min sample): ${Object.keys(ledger).length}`);
  console.log("===================================================\n");

  // --- 5. write (unless probe-only) ---
  if (probeOnly) {
    console.log("Probe only — no file written. Re-run without --probe to write odds-history.json once coverage looks worth it.\n");
    return;
  }
  const payload = {
    generated: new Date().toISOString(),
    source: "TheStatsAPI historical odds",
    seasonsBack, seasons,
    coverage,
    ledger,
  };
  fs.writeFileSync(path.join(HERE, "odds-history.json"), JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote odds-history.json — ${Object.keys(ledger).length} league ledgers.`);
  console.log("This is a SEPARATE persistent ledger. It does NOT touch data.js or the live pipeline.");
  console.log("If coverage looks good, the next step is a small merge that folds these into the live board's oddsCalib.\n");
})().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
