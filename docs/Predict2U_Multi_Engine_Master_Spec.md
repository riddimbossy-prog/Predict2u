# PREDICT2U MULTI-ENGINE PREDICTION SYSTEM
## Complete ChatGPT Build and Integration Specification

**Project:** Predict2U  
**System:** Four-Engine Football Prediction Platform  
**Primary objective:** Generate one defensible prediction per qualifying fixture, reject weak matches, populate the Predict2U board automatically, and track every published prediction through settlement.

---

# 1. INSTRUCTION TO CHATGPT

Act as the senior software engineer, football-model architect, data engineer and quality-assurance lead for Predict2U.

Inspect the complete Predict2U codebase before editing. Preserve working pages, routes, authentication, community features, slip functionality, proof/results logic and deployment workflows unless a change is required.

You must:

1. Preserve the existing Predict2U visual language and responsive behavior.
2. Reuse existing fixture, statistics and odds pipelines where practical.
3. Never invent fixture statistics, odds, league identities, results or lineups.
4. Keep every engine deterministic: identical inputs must produce identical outputs.
5. Produce one final market per fixture or `NO_BET`.
6. Store the exact engine versions, input snapshot, calculations, passed rules, failed rules and rejection reason.
7. Keep public explanations short while retaining full internal audit details.
8. Optimize all new interfaces for Android phones, iPhones, tablets, Samsung Z Fold folded/unfolded and desktop.
9. Provide complete replacement files when full-file replacement is required.
10. Do not mix calculation logic into frontend page components.

Before changing code, inspect:

- Project structure and framework
- `package.json` and lockfile
- Current data-provider integrations
- Existing match and odds objects
- Current engine code
- Board, Full Board, Acca, Proof and News pages
- Slip state and persistence
- Authentication and admin permissions
- Scheduled jobs and deployment YAML
- Environment-variable handling

Do not guess framework, filenames or database technology. Adapt this architecture to the actual repository.

---

# 2. ENGINE LINEUP

| Engine | Version | Primary responsibility |
|---|---:|---|
| Control Edge Engine | v1.0 | Team superiority, attack/defence quality, Straight Win and DNB |
| League Signal Matrix Engine | v2.0 | Exact league-market profiles, odds triggers, approved markets and avoid lists |
| Market Flow Engine | v2.0 | Fast Group D and 12/1X/X2 odds routing |
| Goal Compression Engine | v1.0 | League-adjusted ratios, Goal Index, table tiers, compression and goal-market safety |

A fifth component, the **Predict2U Decision Core**, combines the four independent outputs. It is an orchestrator, not a prediction engine.

No individual engine may publish directly to the public board.

---

# 3. END-TO-END FLOW

```text
Fixture ingestion
      ↓
Data normalization
      ↓
Data-quality validation
      ↓
League identity normalization
      ↓
Odds normalization
      ↓
Shared calculations
      ↓
Run four engines independently
      ↓
Persist every engine result
      ↓
Decision Core aggregation
      ↓
Conflict resolution
      ↓
Release gate
      ↓
Publish one pick or No Bet
      ↓
Store immutable prediction snapshot
      ↓
Settle after full-time
      ↓
Update engine/profile performance
```

---

# 4. SUPPORTED FINAL MARKETS

The first production release should support:

- Home Win
- Away Win
- Home DNB
- Away DNB
- Over 1.5
- Over 2.5
- Over 3.5
- Under 1.5
- Under 2.5
- Under 3.5
- GG / BTTS Yes
- BTTS No
- Home Team Over 0.5
- Away Team Over 0.5
- Home Team Over 1.5
- Away Team Over 1.5
- Draw
- No Bet

Combination rules such as `GG + Over 3.5` must be split into separate candidates. The Decision Core releases only one market.

---

# 5. NORMALIZED MATCH CONTRACT

All providers must be converted into one internal representation before any engine executes.

```ts
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
```

Each statistic must declare whether it is overall, home-only or away-only. Never compare a home venue split to an opponent overall split without explicitly applying a fallback rule.

---

# 6. DATA QUALITY GATE

The Data Quality Gate runs before all engines.

Minimum requirements:

- Exact fixture and provider IDs
- Confirmed competition, season and teams
- Eight overall matches per team
- Six relevant home/away matches
- At least 30 completed league matches
- Valid table positions when compression rules are used
- Required odds for each candidate market
- Non-stale data timestamps

Automatic rejection conditions:

- Unknown or ambiguous league
- Cross-season statistics mixed together
- Reversed home/away splits
- Impossible values or percentages outside 0–100
- Missing market odds required by a trigger
- Cancelled or postponed fixture
- Friendly, youth or reserve fixture without stable data
- Insufficient current-season sample
- Major provider disagreement that cannot be reconciled

A rejected fixture may be stored for diagnostics but must not appear as a public prediction.

---

# 7. LEAGUE REGISTRY

Create a centralized registry with stable IDs and approved aliases.

```json
{
  "id": "eng-premier-league",
  "canonicalName": "England Premier League",
  "country": "England",
  "aliases": ["Premier League", "English Premier League", "England PL", "EPL"],
  "active": true
}
```

Matching order:

1. Provider league ID
2. Exact canonical name
3. Exact approved alias
4. Explicit mapping rule
5. Reject if unresolved

Never merge Bundesliga, 2. Bundesliga, 3. Liga, Regionalliga and Oberliga. Replace broad labels such as “Argentina all” and “Italy all” with explicit lists of competitions.

---

# 8. COMMON ENGINE RESULT CONTRACT

Every engine returns the same machine-readable structure.

```ts
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
```

A rule result must contain the rule ID, actual value, required value, weight and pass/fail state. Do not store only prose.

---

# 9. CONTROL EDGE ENGINE v1.0

## Purpose

Control Edge evaluates team superiority and determines whether control is best expressed through Straight Win, DNB, a goals market or No Bet.

## Analysis sequence

```text
Strength relationship
→ Stronger-team attack
→ Stronger-team defence
→ Weaker-team attack
→ Venue risk
→ Draw risk
→ Market confirmation
```

## Clearly stronger team

At least four should pass:

- Overall PPG advantage ≥ 0.50
- Venue PPG advantage ≥ 0.60
- Goal-difference-per-game advantage ≥ 0.70
- xG difference advantage ≥ 0.50
- Win-rate advantage ≥ 20 percentage points
- Recent form advantage adjusted for opponent quality
- Table superiority confirmed by underlying data
- Odds confirm the same favorite

## Dominant team

- At least five strength conditions pass
- PPG gap ≥ 0.75
- Venue PPG gap ≥ 0.80
- Goal-difference-per-game gap ≥ 1.00

## Routing

- Strong attack + elite/solid defence + weak opponent attack → Straight Win candidate
- Real superiority + meaningful draw risk → DNB candidate
- Strong favorite attack + leaky favorite defence + capable opponent → Over 2.5 candidate
- Elite defence + average attack → DNB, not automatic Win
- Unclear superiority → No Bet

Master principle:

> Defence reduces the probability of losing. Attack determines whether control becomes a win.

---

# 10. LEAGUE SIGNAL MATRIX ENGINE v2.0

## Purpose

Store exact league-market profiles. The profile proposes a candidate; the odds trigger activates it; current league and team data confirm it.

Suggested profile:

```json
{
  "leagueId": "usa-mls",
  "market": "BTTS_YES",
  "groups": ["A", "B"],
  "trigger": {"type": "TWELVE_MAX", "value": 1.18},
  "avoid": false,
  "enabled": true,
  "minimumHistoricalSample": 100,
  "notes": "Requires team and current-season confirmation"
}
```

Supported trigger types:

- `ONE_X_MAX`
- `X_TWO_MAX`
- `TWELVE_MAX`
- `TWELVE_MIN`
- `ALL_DC_RANGE`
- `BALANCED_1X2_SPREAD`
- `NO_SPECIAL_TRIGGER`

`NO_SPECIAL_TRIGGER` replaces “Any odds.” It gives no trigger bonus and requires stronger statistics.

Hard avoid rule:

> When the exact league is on a market’s avoid list, reject that market unless an administrator changes the versioned configuration.

A league may support multiple markets. Score each independently.

---

# 11. MARKET FLOW ENGINE v2.0

## Purpose

Market Flow produces a fast odds-direction candidate. It never publishes automatically and has lower weight than specialist engines.

## Base routing

```text
Group D league?
  Yes → generate low-goal candidates requiring statistical confirmation
  No  → inspect 12 odds
```

```text
12 ≤ 1.10       → Over 3.5 candidate
12 ≤ 1.18       → Over 2.5 candidate
12 ≤ 1.28       → Over 2.5 candidate
12 ≤ 1.34       → Over 1.5 candidate
12 1.35–1.40    → Skip / No Bet signal
12 ≥ 1.40       → Under candidate
```

Then inspect:

- 1X ≤ 1.10 → home-control signal
- X2 ≤ 1.10 → away-control signal
- balanced 1X2 prices → draw-pressure signal

Critical safety rules:

- Group D does not automatically mean Under 1.5
- 12 ≤ 1.10 does not automatically mean Over 3.5
- 1X ≤ 1.10 does not automatically mean Home Win
- X2 ≤ 1.10 does not automatically mean Away Win
- Balanced odds do not automatically mean Draw

The engine should return the candidate, signal strength and required confirming engines.

---

# 12. GOAL COMPRESSION ENGINE v1.0

## Purpose

Goal Compression evaluates league scoring environment, ratios, Goal Index, raw defensive confirmation, table tiers, competitive compression and risk points.

## LATG

```text
LATG = League average home goals + League average away goals
```

| Classification | LATG |
|---|---:|
| Low Scoring | < 2.40 |
| Medium Scoring | 2.40–3.00 |
| High Scoring | 3.01–3.40 |
| Inflated / Chaos | > 3.40 |

## Rates

```text
Home Attack Rate = Home venue GF ÷ Home venue matches
Home Defensive Rate = Home venue GA ÷ Home venue matches
Away Attack Rate = Away venue GF ÷ Away venue matches
Away Defensive Rate = Away venue GA ÷ Away venue matches
```

## Ratios

```text
Attack Ratio = Team Attack Rate ÷ League Average Team Goals × 100
Defensive Ratio = Team Defensive Rate ÷ League Average Team Goals × 100
```

## Goal Index

```text
Goal Index =
(Home Attack Rate + Home Defensive Rate + Away Attack Rate + Away Defensive Rate)
÷ (2 × LATG) × 100
```

## Dual defensive confirmation

A defence is leaky only when both its ratio and raw GA floor pass. A high percentage alone is insufficient.

## Compression

Calculate:

- Same-tier match
- Top-tier clash
- Position gap
- Strong away leader visiting top-half home opposition
- Market balance
- Goal-market disagreement

Compression generally adds risk to Over 2.5, Team Over 1.5 and short-price favorite wins. It can strengthen Under 3.5.

## Risk tiers

| Risk points | Internal tier | Publication treatment |
|---:|---|---|
| 0–1 | Tier A | A1 candidate |
| 2–3 | Tier B | A2 candidate |
| 4–5 | Watchlist | Do not publish as banker |
| 6+ | No Bet | Reject |

---

# 13. DECISION CORE

The Decision Core does not count votes equally. Use market-specific specialist weights stored in configuration.

## Starter weights

### Straight Win / DNB

- Control Edge: 45%
- League Signal Matrix: 25%
- Market Flow: 15%
- Goal Compression: 15%

### Over markets

- Goal Compression: 40%
- League Signal Matrix: 30%
- Market Flow: 20%
- Control Edge: 10%

### Under markets

- Goal Compression: 45%
- League Signal Matrix: 30%
- Control Edge: 15%
- Market Flow: 10%

### BTTS

- Goal Compression: 35%
- League Signal Matrix: 35%
- Control Edge: 20%
- Market Flow: 10%

### Team goals

- Control Edge: 35%
- Goal Compression: 35%
- League Signal Matrix: 20%
- Market Flow: 10%

Missing support contributes zero. Explicit contradiction should apply a configurable penalty.

---

# 14. AGREEMENT AND CONFLICT

- Full consensus: three or four engines support the same exact market or compatible direction.
- Strong consensus: two relevant specialist engines agree and no strong contradiction exists.
- Directional consensus: engines agree on Over or Under direction but disagree on line.
- Conflict: opposite directions or incompatible team-result markets.

Examples of hard conflict:

- Over 2.5 vs Under 2.5
- BTTS Yes vs BTTS No
- Home Win vs Away DNB
- Over 3.5 vs Under 3.5

Hard conflict normally means No Bet.

---

# 15. MARKET RESOLUTION

## Straight Win vs DNB

Release Straight Win only when it leads DNB by at least six points and Control Edge confirms dominant attack plus controlled draw risk. Otherwise use DNB.

## Over lines

- Over 3.5 requires final score ≥ 90
- Over 2.5 must lead Over 1.5 by at least six points
- Otherwise choose Over 1.5

## Under lines

- Under 1.5 requires final score ≥ 90
- Under 2.5 must lead Under 3.5 by at least six points
- Otherwise choose Under 3.5

## BTTS vs Over 2.5

- Choose BTTS when both teams have verified scoring routes
- Choose Over 2.5 when one dominant attack may carry the total
- If within five points, No Bet

## Win vs goals

- Prefer Win when favorite defence is elite/solid and opponent attack is poor
- Prefer goals when favorite defence is open and opponent can contribute

---

# 16. RELEASE GATE

## A1 Banker

- Final score ≥ 88
- Strong Data Quality result
- At least two meaningful confirmations
- No hard contradiction
- All mandatory market rules pass
- Candidate leads second place by at least six points
- No hard avoid, stale odds or major lineup warning

## A2 Strong Pick

- Final score 82–87
- Mandatory rules pass
- No major contradiction
- No more than one minor warning
- Six-point candidate lead

## Watchlist

- Score 76–81
- Store internally only

## No Bet

- Score below 82
- Mandatory failure
- Candidate margin below six
- Opposing markets qualify
- Unknown league
- Missing/stale odds
- Hard avoid rule
- Data-quality failure

---

# 17. DATABASE / COLLECTIONS

Recommended logical entities:

- `fixtures`
- `teams`
- `league_registry`
- `league_profiles`
- `team_stat_snapshots`
- `league_stat_snapshots`
- `odds_snapshots`
- `engine_runs`
- `engine_outputs`
- `final_predictions`
- `prediction_results`
- `engine_performance`
- `profile_performance`
- `audit_log`

Every public prediction must reference an immutable input snapshot and exact engine/configuration versions.

---

# 18. MODULE STRUCTURE

Adapt to the repository rather than forcing this path exactly.

```text
src/
  engines/
    control-edge/
    league-signal-matrix/
    market-flow/
    goal-compression/
  decision-core/
  data/
  config/
    leagues/
    league-signals/
    thresholds/
    decision-core/
  services/
    prediction-runner
    prediction-publisher
    result-settler
    performance-calculator
  api/
    board/
    full-board/
    predictions/
    proof/
    admin/
```

---

# 19. DAILY PIPELINE

```text
Fetch configured competitions
→ Fetch date-range fixtures
→ Deduplicate
→ Fetch league statistics once per league
→ Fetch standings once per league
→ Fetch team data once per team/context
→ Fetch odds in batches
→ Cache reusable responses
→ Normalize
→ Validate
→ Run engines
→ Save outputs
→ Run Decision Core
→ Publish board data
```

Requirements:

- Controlled concurrency
- Provider rate-limit handling
- Exponential retry for temporary failures
- Progress checkpoints
- No repeated fetches for completed fixtures
- Structured logs for every skipped fixture

---

# 20. BOARD AND FULL BOARD

Public match cards should show:

- Kickoff time
- League
- Teams
- Final pick
- Current odds
- A1/A2 badge
- Primary engine
- Add to Slip

Expanded details should show no more than three short reasons and supporting engines.

Full Board should support:

- Date tabs generated from real dates
- Market filter
- Odds filter
- Engine filter
- Confidence filter
- League search
- Kickoff, confidence and odds sorting

Only engines with qualifying picks for the selected date should appear active. If 3 of 16 engines have picks, show `3/16 engines active`.

Mobile requirements:

- No horizontal overflow
- Filters in a bottom sheet or drawer
- Tap targets around 44px or larger
- Add to Slip never hidden
- Floating slip control must not cover match actions
- Z Fold folded and unfolded layouts tested explicitly

---

# 21. PROOF AND SETTLEMENT

Settlement examples:

- Over 2.5 wins at three or more total goals
- Under 3.5 wins at zero to three total goals
- BTTS Yes wins only when both score
- Home DNB: home win = won, draw = void, away win = lost

Proof must use the stored pre-match prediction, not a recalculated post-match prediction.

Never mutate a historical selection after kickoff without an audit entry.

---

# 22. BACKTESTING AND PERFORMANCE

Track by:

- Engine and version
- League profile and version
- Market
- Odds band
- Confidence
- Season
- Home/away side
- Sample size
- Win/void/loss rate
- Average odds
- Unit profit and ROI
- Maximum losing streak

One-unit profit:

```text
Win = odds − 1
Loss = −1
Void = 0
```

Profile lifecycle:

- Testing
- Watchlist
- Active
- Weakened
- Suspended
- Retired

Do not activate a profile because of win rate alone. Review ROI, sample size and losing streak.

---

# 23. VERSIONING

Every threshold or weight change must create a new configuration version with:

- Engine/profile name
- New version
- Changed field
- Previous value
- New value
- Reason
- Effective date
- Backtest comparison

Historical predictions retain the version used when published.

---

# 24. TESTING

Required tests:

- PPG, ratios and Goal Index
- League classification boundaries
- Trigger parsing boundaries
- Table-tier assignment
- Compression risk calculations
- Weighted Decision Core aggregation
- Conflict resolution
- A1/A2 release thresholds
- Market settlement, especially DNB voids
- Missing xG, odds, standings and venue samples
- Unknown league and postponed fixture handling
- Engine error isolation
- Small Android, iPhone, Z Fold folded/unfolded, tablet and desktop UI

Boundary examples should test immediately below, equal to and above every threshold.

---

# 25. LOGGING

Each batch must log:

- Fixtures discovered
- Fixtures normalized
- Data-quality rejects
- Fixtures analyzed
- Engine errors
- A1 and A2 counts
- No Bet count
- Provider calls, cache hits and rate-limit responses
- Processing duration

Standard No Bet reasons:

- `NO_LEAGUE_PROFILE`
- `DATA_QUALITY_FAILED`
- `TRIGGER_FAILED`
- `MANDATORY_RULE_FAILED`
- `CONTRADICTORY_ENGINES`
- `CANDIDATE_MARGIN_TOO_SMALL`
- `FINAL_SCORE_TOO_LOW`
- `MARKET_AVOIDED`
- `ODDS_STALE`
- `UNKNOWN_LEAGUE`

---

# 26. SECURITY

- Keep provider keys server-side
- Never expose secrets in frontend bundles
- Validate admin permissions
- Rate-limit engine-run and reprocess endpoints
- Sanitize rendered league/team text
- Validate fixture IDs
- Audit manual publish, unpublish and settlement changes
- Never commit `.env` files

---

# 27. IMPLEMENTATION PHASES

## Phase 1 — Audit and normalization

Inspect repository, document current data objects, build league registry and Data Quality Gate.

## Phase 2 — Independent engines

Implement and unit-test Control Edge, Goal Compression, League Signal Matrix and Market Flow separately.

## Phase 3 — Decision Core

Implement weighting, aggregation, conflict resolution and release gate.

## Phase 4 — Storage and API

Persist snapshots, engine outputs and final predictions. Add board, detail, proof and admin endpoints.

## Phase 5 — UI

Integrate Top Picks, Full Board, filters, engine status, Add to Slip and responsive explanations.

## Phase 6 — Settlement

Fetch final results, settle exact markets and update Proof and performance tables.

## Phase 7 — Backtest and calibration

Run historical samples, weaken or suspend poor profiles, and version every adjustment.

---

# 28. DEFINITION OF DONE

The build is complete when:

1. All four engines run independently.
2. Every engine returns the common contract.
3. Decision Core returns one market or No Bet.
4. Missing mandatory data never produces a public selection.
5. Input snapshots and versions are stored.
6. Exact league aliases resolve correctly.
7. Combination profiles are split into single markets.
8. Hard avoid rules are enforced.
9. Conflicting directions resolve deterministically.
10. A1/A2 thresholds and six-point lead rules work.
11. Full Board supports real multi-day date ranges.
12. Filters and Add to Slip work on mobile and desktop.
13. Empty engines hide for the selected date and active counts are accurate.
14. Proof settles DNB draws as void.
15. Z Fold folded/unfolded layouts pass regression tests.
16. Engine errors do not crash the whole batch.
17. Every published or rejected fixture has an explainable reason.

---

# 29. FINAL BUILD COMMAND

> Inspect the complete Predict2U repository before editing. Implement Control Edge Engine v1.0, League Signal Matrix Engine v2.0, Market Flow Engine v2.0 and Goal Compression Engine v1.0 as independent deterministic modules connected through the Predict2U Decision Core. Preserve all working features and responsive behavior. Use the repository’s actual framework and file structure. Build normalized data contracts, league identity mapping, data-quality rejection, versioned configuration, engine result persistence, conflict resolution, one-pick publication, exact market settlement, backtesting support, audit logs and responsive board integration. Never fabricate missing data and never publish a fixture that fails mandatory requirements. Return complete replacement files, migrations, configuration files, tests and a final replacement list.

---

# 30. FINAL PRINCIPLE

> League patterns suggest. Odds activate. Team statistics confirm. Compression protects. The Decision Core selects. No Bet prevents forced predictions.
