import type { NormalizedMatch } from "../schemas/normalized-match";
import type { EngineResult } from "../schemas/engine-result";

export async function runPrediction(match: NormalizedMatch) {
  const quality = validateMatchData(match);
  if (!quality.passed) return createNoBet("DATA_QUALITY_FAILED", quality);

  const results: EngineResult[] = await Promise.all([
    safelyRunEngine("control-edge", () => runControlEdge(match)),
    safelyRunEngine("league-signal-matrix", () => runLeagueSignalMatrix(match)),
    safelyRunEngine("market-flow", () => runMarketFlow(match)),
    safelyRunEngine("goal-compression", () => runGoalCompression(match))
  ]);

  await saveEngineResults(match.fixtureId, results);
  const decision = runDecisionCore({ match, engineResults: results });
  await saveDecision(match.fixtureId, decision);

  if (decision.status === "published") {
    await publishPrediction(decision.prediction);
  }

  return decision;
}

async function safelyRunEngine(name: string, fn: () => Promise<EngineResult>): Promise<EngineResult> {
  try {
    return await fn();
  } catch (error) {
    return {
      engineId: name,
      engineName: name,
      version: "unknown",
      fixtureId: "unknown",
      status: "error",
      candidateMarket: null,
      rawScore: 0,
      finalScore: 0,
      confidence: "rejected",
      passedRules: [],
      failedRules: [],
      warnings: ["ENGINE_ERROR"],
      penalties: [],
      calculations: {},
      shortReason: "Engine failed safely.",
      internalReason: error instanceof Error ? error.message : String(error),
      generatedAt: new Date().toISOString()
    };
  }
}

// Replace the declarations below with the repository's real imports.
declare function validateMatchData(match: NormalizedMatch): any;
declare function createNoBet(code: string, detail: any): any;
declare function runControlEdge(match: NormalizedMatch): Promise<EngineResult>;
declare function runLeagueSignalMatrix(match: NormalizedMatch): Promise<EngineResult>;
declare function runMarketFlow(match: NormalizedMatch): Promise<EngineResult>;
declare function runGoalCompression(match: NormalizedMatch): Promise<EngineResult>;
declare function runDecisionCore(input: any): any;
declare function saveEngineResults(fixtureId: string, results: EngineResult[]): Promise<void>;
declare function saveDecision(fixtureId: string, decision: any): Promise<void>;
declare function publishPrediction(prediction: any): Promise<void>;
