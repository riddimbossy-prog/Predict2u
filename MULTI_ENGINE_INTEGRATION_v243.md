# Predict2U Multi-Engine Integration v243

This patch adds the uploaded multi-engine family to the existing Predict2U engine registry without replacing the original engine file.

## Public engine count

- Existing engines: 16
- Added engines: 4
- New total: 20

## Added engines

1. **Control Edge v1.0** — superiority, attacking control, defensive protection and DNB/Win routing.
2. **League Signal Matrix v2.0** — exact league-market profiles with odds triggers and team confirmation.
3. **Market Flow v2.0** — 12/1X/X2 price routing with mandatory statistical confirmation.
4. **Goal Compression v1.0** — league-adjusted goals, Goal Index, defensive ratios, table compression and risk points.

The uploaded **Decision Core** is included as an orchestrator (`P2UMultiEngineDecisionCore`) and is intentionally not shown as a fifth engine.

## Replacement files

Replace:

- `board.html`
- `bankers.html`
- `engines.html`
- `proof.html`
- `scorecards.html`
- `league-dna.html`
- `community.html`
- `trust.html`
- `audit-site.js`
- `generate-site-health.js`

Add:

- `multi-engine-suite.js`
- `config/engine-weights.json`
- `config/league-profile-example.json`
- `config/no-bet-reasons.json`
- the included docs, schemas, pseudocode and test files

## Important

- Keep the existing `banker-engine.js`.
- Keep `data.js`, API keys, workflows and secrets unchanged.
- `multi-engine-suite.js` must load immediately after `banker-engine.js`; the supplied HTML files already do this.
- The new engines fail safely with `No Bet` when required samples, odds, league profiles or table data are missing.

## After deployment

1. Commit the patch to the repository root.
2. Start a new **Predict2U Site Quality** run.
3. Start a new **Predict2U Fast All Games** run so new fixtures are evaluated by all 20 engines.
4. Hard-refresh the site or reopen the PWA.
