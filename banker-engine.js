/* ============================================================
   GOLDEN BANKER ENGINE
   Applies the Final Golden Banker Rules to match data.

   INPUT: an array of match objects (see SCHEMA below).
   OUTPUT: scored matches + the Top 4 Bankers selection.

   This is heuristic scoring, not a statistical model. It turns
   the written rules into numbers so the UI can rank picks. It
   does NOT make betting safe — see the notes in the README.
   ============================================================ */

/* ------------------------------------------------------------
   SCHEMA — this is the shape your backend must produce per match
   (map your API response onto this object).

   {
     home: "Team A",
     away: "Team B",
     league: "Premier League",

     // table / quality (lower position number = higher in table)
     homePos: 2,            // league position 1..N
     awayPos: 18,
     tableSize: 20,
     homePts: 55,
     awayPts: 21,
     homeGD: 30,            // goal difference
     awayGD: -25,

     // form: last ~5-6 games as a string of W/D/L, most recent last
     homeForm: "WWDWW",
     awayForm: "LLDLL",

     // venue-specific (per game averages over the season)
     homeScoredAtHome: 2.1,    // avg goals scored at home
     homeConcededAtHome: 0.8,  // avg goals conceded at home
     awayScoredAway: 0.9,      // avg goals scored away
     awayConcededAway: 2.2,    // avg goals conceded away

     // draw tendency (share of games drawn, 0..1) — optional
     homeDrawRate: 0.20,
     awayDrawRate: 0.35,

     // motivation flags — optional, set true if applicable
     homeMotivation: true,   // title race / survival / playoff push
     awayMotivation: false
   }
   ------------------------------------------------------------ */

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function formPoints(form) {
  if (!form) return 0;
  let pts = 0, n = 0;
  for (const c of form.toUpperCase()) {
    if (c === "W") pts += 3;
    else if (c === "D") pts += 1;
    n++;
  }
  return n ? pts / (n * 3) : 0; // 0..1, share of max points
}

/* ---------------- OVER 2.5 SCORING (Rule 7) ---------------- */
function scoreOver25(m) {
  const reasons = [];
  // expected goals proxy: blend of both teams' venue scoring + opp conceding
  const homeExp = ((m.homeScoredAtHome ?? 1.3) + (m.awayConcededAway ?? 1.3)) / 2;
  const awayExp = ((m.awayScoredAway ?? 1.0) + (m.homeConcededAtHome ?? 1.0)) / 2;
  const totalExp = homeExp + awayExp;

  let score = clamp((totalExp - 1.5) * 3.2, 0, 10); // ~2.5 total -> ~3.2; 3.6 -> ~6.7; 4.5 -> 9.6

  if ((m.homeConcededAtHome ?? 0) >= 1.6 || (m.awayConcededAway ?? 0) >= 1.8) {
    reasons.push("A defence concedes heavily at this venue");
    score += 1;
  }
  if (totalExp >= 3.2) reasons.push(`High combined goal expectation (~${totalExp.toFixed(1)})`);
  else if (totalExp >= 2.7) reasons.push(`Moderate combined goal expectation (~${totalExp.toFixed(1)})`);
  else reasons.push(`Low combined goal expectation (~${totalExp.toFixed(1)})`);

  // Rule 7: avoid if it relies on a poor attacking team
  if ((m.awayScoredAway ?? 1) < 0.8 || (m.homeScoredAtHome ?? 1) < 0.9) {
    reasons.push("Relies partly on a weak attack — capped");
    score = Math.min(score, 6.5);
  }

  score = clamp(Math.round(score * 10) / 10, 0, 10);
  return { score, verdict: verdictFor(score, 8, 6), reasons, totalExp };
}

/* ---------------- BTTS SCORING (Rule 8) ---------------- */
function scoreBTTS(m) {
  const reasons = [];
  const homeScores = clamp(((m.homeScoredAtHome ?? 1.2) / 1.6) * 5, 0, 5);
  const awayScores = clamp(((m.awayScoredAway ?? 1.0) / 1.4) * 5, 0, 5);
  let score = homeScores + awayScores;

  if ((m.awayScoredAway ?? 1) >= 1.2 && (m.homeScoredAtHome ?? 1) >= 1.2)
    reasons.push("Both sides score regularly at this venue");
  if ((m.homeConcededAtHome ?? 0) >= 1.2 && (m.awayConcededAway ?? 0) >= 1.2)
    reasons.push("Both defences leak at this venue");

  // Rule 8: avoid if underdog may fail to score
  const weakerScores = Math.min(m.homeScoredAtHome ?? 1, m.awayScoredAway ?? 1);
  if (weakerScores < 0.8) {
    reasons.push("One side struggles to score — BTTS risk");
    score = Math.min(score, 5.5);
  }
  if (reasons.length === 0) reasons.push("Scoring profile is mixed");

  score = clamp(Math.round(score * 10) / 10, 0, 10);
  return { score, verdict: verdictFor(score, 7.5, 6), reasons };
}

/* ---------------- WIN / DNB SCORING (Rules 1,2,3,5,6,10,11,12) -------- */
function scoreWinDNB(m) {
  const reasons = [];
  const size = m.tableSize ?? 20;

  // table gap, normalised
  const posGap = ((m.awayPos ?? size/2) - (m.homePos ?? size/2)) / size; // +ve favours home
  const ptsGap = ((m.homePts ?? 0) - (m.awayPts ?? 0));
  const gdGap = ((m.homeGD ?? 0) - (m.awayGD ?? 0));

  // form edge
  const formEdge = formPoints(m.homeForm) - formPoints(m.awayForm); // -1..1

  // Decide favourite: positive aggregate => home favourite
  const aggregate = posGap * 4 + (ptsGap / 30) * 2 + (gdGap / 30) * 1.5 + formEdge * 2;
  const homeIsFav = aggregate >= 0;
  const favSide = homeIsFav ? "Home" : "Away";
  const favTeam = homeIsFav ? m.home : m.away;

  let score = clamp(5 + Math.abs(aggregate) * 1.3, 0, 10);

  // Rule 11: table gap
  const absPosGap = Math.abs((m.homePos ?? 0) - (m.awayPos ?? 0));
  if (absPosGap >= size * 0.5) reasons.push(`Large table gap (${absPosGap} places)`);
  else if (absPosGap >= size * 0.3) reasons.push(`Moderate table gap (${absPosGap} places)`);
  else reasons.push(`Small table gap (${absPosGap} places)`);

  // Rule 12: defensive weakness of underdog
  const underdogConceded = homeIsFav ? (m.awayConcededAway ?? 0) : (m.homeConcededAtHome ?? 0);
  if (underdogConceded >= 1.8) { reasons.push("Underdog defence is leaky"); score += 0.7; }

  // form note
  if (Math.abs(formEdge) >= 0.25)
    reasons.push(`${formEdge > 0 ? m.home : m.away} has the stronger recent form`);

  // ---- DNB protection logic (Rules 2, 6) ----
  let drawRisk = 0;
  const favDrawRate = homeIsFav ? (m.homeDrawRate ?? 0.25) : (m.awayDrawRate ?? 0.25);
  if (favDrawRate >= 0.30) { drawRisk += 1; reasons.push("Favourite is draw-heavy"); }
  if (!homeIsFav) { drawRisk += 1; reasons.push("Favourite is away — draw risk higher"); }
  if (absPosGap < size * 0.3) drawRisk += 1;
  if (score < 7) drawRisk += 1;

  // Motivation (Rule 10) — only nudges, never creates a banker alone
  const favMotivation = homeIsFav ? m.homeMotivation : m.awayMotivation;
  if (favMotivation) { reasons.push("Favourite has a motivation edge"); score += 0.4; }

  score = clamp(Math.round(score * 10) / 10, 0, 10);

  // choose market: straight win only for clear mismatch (Rule 3,5,6)
  const clearMismatch = score >= 7.5 && absPosGap >= size * 0.4 && drawRisk <= 1;
  const strongHomeMismatch = homeIsFav && clearMismatch && (m.homeScoredAtHome ?? 0) >= 1.4;

  let market;
  if (strongHomeMismatch) market = "Home Win";
  else if (clearMismatch && homeIsFav) market = "Home Win";
  else if (clearMismatch && !homeIsFav) market = "Away Win";
  else market = homeIsFav ? "Home DNB" : "Away DNB"; // default protection

  return {
    score, verdict: verdictFor(score, 7.5, 6), reasons,
    favSide, favTeam, homeIsFav, drawRisk, market, absPosGap, clearMismatch
  };
}

function verdictFor(score, strongAt, modAt) {
  if (score >= strongAt) return "Strong";
  if (score >= modAt) return "Moderate";
  return "Weak";
}

/* ---------------- FINAL RECOMMENDATION (Rules 1,9,13) -------- */
function recommend(m) {
  const over = scoreOver25(m);
  const btts = scoreBTTS(m);
  const wdnb = scoreWinDNB(m);

  let primary = "Skip";
  let confidence = "Low";
  let banker = false;
  const candidates = [];

  // Rule 9: combo only if both legs strong
  const comboOK = over.score >= 7 && btts.score >= 7;

  // Qualification (Rule 1)
  if (wdnb.score >= 7) candidates.push({ bet: wdnb.market, weight: wdnb.score, kind: "wdnb" });
  if (over.score >= 8) candidates.push({ bet: "Over 2.5", weight: over.score, kind: "over" });
  if (comboOK) candidates.push({ bet: "Over 2.5 + BTTS", weight: (over.score + btts.score) / 2, kind: "combo" });

  if (candidates.length) {
    candidates.sort((a, b) => b.weight - a.weight);
    primary = candidates[0].bet;
    banker = true;
    // confidence (Rule 15)
    const top = candidates[0];
    if (top.kind === "wdnb") {
      confidence = (wdnb.clearMismatch && wdnb.score >= 8) ? "High"
                 : wdnb.score >= 7 ? "Medium" : "Low";
    } else if (top.kind === "over") {
      confidence = over.score >= 8.5 ? "High" : "Medium";
    } else {
      confidence = (over.score >= 7.5 && btts.score >= 7.5) ? "High" : "Medium";
    }
  }

  // Skip rule (Rule 13): nothing qualified
  if (!banker) { primary = "Skip"; confidence = "Low"; }

  // a single ranking weight for Top-4 selection (Rule 14)
  let rankWeight = 0;
  if (banker) {
    rankWeight = candidates[0].weight;
    // Rule 14 ordering bonuses
    if (primary === "Home Win" && wdnb.clearMismatch) rankWeight += 1.5;       // strong home mismatch
    else if (primary.includes("DNB") && wdnb.absPosGap >= (m.tableSize ?? 20) * 0.4) rankWeight += 1.0;
    else if (primary === "Away Win") rankWeight += 0.8;
    else if (primary === "Over 2.5") rankWeight += 0.3;
    if (confidence === "High") rankWeight += 0.6;
  }

  const summary = banker
    ? `${wdnb.favTeam} edge — ${primary} is the safest read.`
    : "No clear edge; protect the stake and skip.";

  return { match: m, over, btts, wdnb, primary, confidence, banker, rankWeight, summary };
}

/* ---------------- SETTLE: grade a pick against a final score ----
   Returns "Won" / "Lost" / "Void" / "" (empty = not finished yet).
   homeGoals/awayGoals are the final score numbers.
   ---------------------------------------------------------------- */
function settle(primary, homeGoals, awayGoals) {
  if (homeGoals == null || awayGoals == null) return ""; // not played yet
  const total = homeGoals + awayGoals;
  const bothScored = homeGoals > 0 && awayGoals > 0;
  const homeWon = homeGoals > awayGoals;
  const awayWon = awayGoals > homeGoals;
  const draw = homeGoals === awayGoals;

  switch (primary) {
    case "Home Win": return homeWon ? "Won" : "Lost";
    case "Away Win": return awayWon ? "Won" : "Lost";
    case "Home DNB": return draw ? "Void" : (homeWon ? "Won" : "Lost");
    case "Away DNB": return draw ? "Void" : (awayWon ? "Won" : "Lost");
    case "Over 2.5": return total >= 3 ? "Won" : "Lost";
    case "BTTS Yes": return bothScored ? "Won" : "Lost";
    case "Over 2.5 + BTTS": return (total >= 3 && bothScored) ? "Won" : "Lost";
    case "Skip": return ""; // no bet was placed
    default: return "";
  }
}

/* ---------------- TOP-LEVEL: analyse all + pick Top 4 -------- */
function analyseAll(matches) {
  const results = matches.map(recommend);
  const bankers = results
    .filter(r => r.banker)
    .sort((a, b) => b.rankWeight - a.rankWeight)
    .slice(0, 4); // Rule 1: max 4
  return { results, bankers };
}

if (typeof module !== "undefined") module.exports = { analyseAll, recommend, scoreOver25, scoreBTTS, scoreWinDNB, settle };
