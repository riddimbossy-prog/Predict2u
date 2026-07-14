import type { EngineResult, PredictionMarket } from "../schemas/engine-result";

export interface CandidateScore {
  market: PredictionMarket;
  weightedScore: number;
  engines: string[];
  contradictions: string[];
}

export function selectFinalCandidate(
  results: EngineResult[],
  weights: Record<string, number>,
  minimumScore = 82,
  minimumLead = 6
) {
  const candidates = aggregateByMarket(results, weights);
  const resolved = rejectHardConflicts(candidates);
  const ranked = resolved.sort((a, b) => b.weightedScore - a.weightedScore);

  if (!ranked.length) return noBet("CONTRADICTORY_ENGINES");
  const best = ranked[0];
  const second = ranked[1];

  if (best.weightedScore < minimumScore) return noBet("FINAL_SCORE_TOO_LOW");
  if (second && best.weightedScore - second.weightedScore < minimumLead) {
    return noBet("CANDIDATE_MARGIN_TOO_SMALL");
  }

  return {
    status: "published",
    candidate: best,
    confidence: best.weightedScore >= 88 ? "A1" : "A2"
  };
}

function aggregateByMarket(results: EngineResult[], weights: Record<string, number>): CandidateScore[] {
  const map = new Map<PredictionMarket, CandidateScore>();
  for (const result of results) {
    if (result.status !== "qualified" || !result.candidateMarket) continue;
    const weight = weights[result.engineId] ?? 0;
    const current = map.get(result.candidateMarket) ?? {
      market: result.candidateMarket,
      weightedScore: 0,
      engines: [],
      contradictions: []
    };
    current.weightedScore += result.finalScore * weight;
    current.engines.push(result.engineId);
    map.set(result.candidateMarket, current);
  }
  return [...map.values()];
}

function rejectHardConflicts(candidates: CandidateScore[]): CandidateScore[] {
  const markets = new Set(candidates.map(c => c.market));
  const conflicts: Array<[PredictionMarket, PredictionMarket]> = [
    ["OVER_25", "UNDER_25"],
    ["OVER_35", "UNDER_35"],
    ["BTTS_YES", "BTTS_NO"],
    ["HOME_WIN", "AWAY_DNB"],
    ["AWAY_WIN", "HOME_DNB"]
  ];
  for (const [a, b] of conflicts) {
    if (markets.has(a) && markets.has(b)) return [];
  }
  return candidates;
}

function noBet(reason: string) {
  return { status: "no_bet", reason };
}
