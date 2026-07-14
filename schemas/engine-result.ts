export type PredictionMarket =
  | "HOME_WIN" | "AWAY_WIN" | "HOME_DNB" | "AWAY_DNB" | "DRAW"
  | "OVER_15" | "OVER_25" | "OVER_35"
  | "UNDER_15" | "UNDER_25" | "UNDER_35"
  | "BTTS_YES" | "BTTS_NO"
  | "HOME_TEAM_OVER_05" | "AWAY_TEAM_OVER_05"
  | "HOME_TEAM_OVER_15" | "AWAY_TEAM_OVER_15";

export interface RuleResult {
  ruleId: string;
  label: string;
  passed: boolean;
  actual: number | string | boolean | null;
  required: number | string | boolean | null;
  weight: number;
}

export interface ScoreAdjustment {
  code: string;
  label: string;
  points: number;
}

export interface EngineResult {
  engineId: string;
  engineName: string;
  version: string;
  fixtureId: string;
  status: "qualified" | "rejected" | "error";
  candidateMarket: PredictionMarket | null;
  candidateSide?: "home" | "away" | "both" | "none";
  rawScore: number;
  finalScore: number;
  confidence: "A1" | "A2" | "watchlist" | "rejected";
  passedRules: RuleResult[];
  failedRules: RuleResult[];
  warnings: string[];
  penalties: ScoreAdjustment[];
  calculations: Record<string, number | string | boolean | null>;
  shortReason: string;
  internalReason: string;
  generatedAt: string;
}

export interface FinalPrediction {
  predictionId: string;
  fixtureId: string;
  market: PredictionMarket;
  selection: string;
  confidence: "A1" | "A2";
  finalScore: number;
  decimalOdds: number | null;
  primaryEngine: string;
  supportingEngines: string[];
  shortReason: string;
  internalReason: string;
  riskFlags: string[];
  inputSnapshotId: string;
  engineVersions: Record<string, string>;
  publishedAt: string;
  settledAt: string | null;
  result: "pending" | "won" | "lost" | "void";
}
