export interface NormalizedTeam {
  teamId: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
}

export interface TeamStats {
  matchesOverall: number;
  matchesVenue: number;
  pointsPerGameOverall: number | null;
  pointsPerGameVenue: number | null;
  goalsForOverall: number | null;
  goalsAgainstOverall: number | null;
  goalsForVenue: number | null;
  goalsAgainstVenue: number | null;
  xGOverall: number | null;
  xGAOverall: number | null;
  xGVenue: number | null;
  xGAVenue: number | null;
  winRateOverall: number | null;
  winRateVenue: number | null;
  drawRateOverall: number | null;
  drawRateVenue: number | null;
  nonLossRateVenue: number | null;
  scoringRateOverall: number | null;
  scoringRateVenue: number | null;
  failedToScoreRateOverall: number | null;
  failedToScoreRateVenue: number | null;
  cleanSheetRateOverall: number | null;
  cleanSheetRateVenue: number | null;
  bttsRateOverall: number | null;
  bttsRateVenue: number | null;
  over15Rate: number | null;
  over25Rate: number | null;
  over35Rate: number | null;
  under15Rate: number | null;
  under25Rate: number | null;
  under35Rate: number | null;
  shotsOnTargetFor?: number | null;
  shotsOnTargetAgainst?: number | null;
  bigChancesFor?: number | null;
  bigChancesAgainst?: number | null;
  recentFormPoints?: number | null;
  recentOpponentStrength?: number | null;
}

export interface LeagueStats {
  completedMatches: number;
  averageHomeGoals: number | null;
  averageAwayGoals: number | null;
  averageTotalGoals: number | null;
  homeWinRate: number | null;
  drawRate: number | null;
  awayWinRate: number | null;
  bttsRate: number | null;
  over15Rate: number | null;
  over25Rate: number | null;
  over35Rate: number | null;
  under25Rate: number | null;
  under35Rate: number | null;
}

export interface MatchOdds {
  homeWin: number | null;
  draw: number | null;
  awayWin: number | null;
  oneX: number | null;
  xTwo: number | null;
  twelve: number | null;
  homeDnb: number | null;
  awayDnb: number | null;
  over15: number | null;
  over25: number | null;
  over35: number | null;
  under15: number | null;
  under25: number | null;
  under35: number | null;
  bttsYes: number | null;
  bttsNo: number | null;
  homeTeamOver05: number | null;
  awayTeamOver05: number | null;
  homeTeamOver15: number | null;
  awayTeamOver15: number | null;
  opening?: Partial<MatchOdds>;
  lastUpdatedAt: string | null;
}

export interface TableContext {
  leagueSize: number | null;
  homePosition: number | null;
  awayPosition: number | null;
  homeTier: string | null;
  awayTier: string | null;
  positionGap: number | null;
}

export interface MatchContext {
  isFriendly: boolean;
  isYouth: boolean;
  isReserve: boolean;
  isCup: boolean;
  lineupKnown: boolean;
  motivationRisk: boolean;
}

export interface DataQualityResult {
  passed: boolean;
  score: number;
  missingFields: string[];
  warnings: string[];
  reason?: string;
}

export interface NormalizedMatch {
  fixtureId: string;
  providerFixtureId: string;
  kickoffUtc: string;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  country: string;
  leagueId: string;
  leagueName: string;
  normalizedLeagueName: string;
  season: string;
  round?: string;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  leagueStats: LeagueStats;
  homeStats: TeamStats;
  awayStats: TeamStats;
  odds: MatchOdds;
  table: TableContext;
  context: MatchContext;
  fetchedAt: string;
  dataQuality: DataQualityResult;
}
