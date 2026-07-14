# Predict2U Implementation Checklist

## Repository audit
- [ ] Identify frontend, backend and database frameworks
- [ ] Map existing fixture, odds and result data shapes
- [ ] Identify current board, full-board, slip and proof files
- [ ] Identify scheduled jobs and provider rate limits
- [ ] Record existing engine count and active/inactive behavior

## Core data layer
- [ ] Add normalized match contract
- [ ] Add league registry and aliases
- [ ] Add odds normalization
- [ ] Add Data Quality Gate
- [ ] Add immutable input snapshots

## Engines
- [ ] Implement Control Edge v1.0
- [ ] Implement League Signal Matrix v2.0
- [ ] Implement Market Flow v2.0
- [ ] Implement Goal Compression v1.0
- [ ] Add isolated tests for each engine

## Decision Core
- [ ] Add market-specific weights
- [ ] Add compatible-direction grouping
- [ ] Add hard-conflict detection
- [ ] Add six-point candidate lead rule
- [ ] Add A1/A2/Watchlist/No Bet release gate

## Persistence
- [ ] Save engine run and output records
- [ ] Save final prediction and supporting engines
- [ ] Save configuration and engine versions
- [ ] Save audit records for manual changes

## API and UI
- [ ] Board endpoint
- [ ] Full Board endpoint
- [ ] Engine status endpoint
- [ ] Prediction detail endpoint
- [ ] Proof endpoint
- [ ] Accurate active-engine count
- [ ] Hide engines without picks for selected day
- [ ] Mobile and Z Fold responsive regression
- [ ] Add to Slip works on all cards
- [ ] Floating slip button does not block actions

## Settlement
- [ ] Settle every supported market
- [ ] DNB draws are void
- [ ] Postponed/cancelled rules are explicit
- [ ] Proof uses immutable pre-match records

## Backtesting and release
- [ ] Historical backtest by league/profile/market
- [ ] Track ROI and losing streak, not win rate only
- [ ] Profile lifecycle states implemented
- [ ] Version every threshold or weight change
- [ ] Production rollout behind feature flag
