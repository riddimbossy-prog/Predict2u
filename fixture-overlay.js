/* Predict2U v247 fixture + analysis overlay.
 * Loads every scheduled fixture from fixtures.js, then overlays enriched rows
 * from data.js. This keeps future matches visible even when prediction analysis
 * is still running or an engine correctly returns No Bet.
 */
(function(root){
  "use strict";

  const fixtures = Array.isArray(root.FIXTURES) ? root.FIXTURES : [];
  const analysed = Array.isArray(root.MATCHES) ? root.MATCHES : [];

  const dateOf = item => {
    const direct = String(item && item.matchDate || "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
    const kickoff = String(item && item.kickoff || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(kickoff) ? kickoff : "";
  };

  const keyOf = item => {
    if (item && item.id != null) return `id:${item.id}`;
    return [
      dateOf(item),
      item && item.kickoff || "",
      item && (item.homeTeamId || item.home) || "",
      item && (item.awayTeamId || item.away) || ""
    ].join("|");
  };

  const alreadyAnalysed = item => {
    if (!item) return false;
    if (item.profileEnriched === true) return true;
    if (item.enrichmentStatus === "profile-ledger" || item.enrichmentStatus === "analysed") return true;
    const homeReady = Number(item.homeVenueGames) >= 8 && item.homeWinRate != null;
    const awayReady = Number(item.awayVenueGames) >= 8 && item.awayWinRate != null;
    return homeReady && awayReady;
  };

  const merged = new Map();
  for (const fixture of fixtures) {
    const matchDate = dateOf(fixture);
    const analysed = alreadyAnalysed(fixture);
    const row = {
      ...fixture,
      matchDate,
      fixtureOnly: analysed ? false : true,
      analysisPending: analysed ? false : true,
      enrichmentStatus: fixture.enrichmentStatus || (analysed ? "profile-ledger" : "fixture-only"),
      dataCoverage: Number.isFinite(Number(fixture.dataCoverage)) ? Number(fixture.dataCoverage) : (analysed ? 70 : 0)
    };
    merged.set(keyOf(row), row);
  }

  for (const analysis of analysed) {
    const key = keyOf(analysis);
    const existing = merged.get(key) || {};
    const mergedRow = { ...existing, ...analysis };
    const explicitlyFixtureOnly = analysis && (
      (analysis.fixtureOnly === true || analysis.enrichmentStatus === "fixture-only" || analysis.enrichmentStatus === "sportybet-fixture") &&
      !alreadyAnalysed(mergedRow)
    );
    const row = {
      ...mergedRow,
      matchDate: dateOf(analysis) || dateOf(existing),
      fixtureOnly: explicitlyFixtureOnly,
      analysisPending: explicitlyFixtureOnly,
      enrichmentStatus: analysis.enrichmentStatus || (explicitlyFixtureOnly ? "fixture-only" : "analysed")
    };
    merged.set(key, row);
  }

  const rows = [...merged.values()].filter(item => item && item.home && item.away);
  rows.sort((a, b) =>
    dateOf(a).localeCompare(dateOf(b)) ||
    String(a.kickoff || "").localeCompare(String(b.kickoff || "")) ||
    String(a.league || "").localeCompare(String(b.league || ""))
  );

  root.P2U_ANALYSED_MATCHES = analysed;
  root.ALL_FIXTURES = fixtures;
  root.MATCHES = rows;
  root.FIXTURE_OVERLAY_INFO = {
    generatedAt: new Date().toISOString(),
    fixtureRows: fixtures.length,
    analysedRows: analysed.length,
    mergedRows: rows.length,
    pendingRows: rows.filter(row => row.analysisPending || row.fixtureOnly).length
  };

  try {
    root.dispatchEvent(new CustomEvent("p2u:fixtures-ready", { detail: root.FIXTURE_OVERLAY_INFO }));
  } catch (_) {}
})(window);
