# Predict2U v244 — Future Date Fallback Fix

## Root cause
The discovery job found all seven days, but the old merge step only copied rows that completed full enrichment. Any future fixture that lacked standings, H2H, odds or team statistics could disappear before `data.js` was published.

## Fix
The merge now starts with every exact raw fixture from `all-games-fixtures.json`, then overlays enriched shard data. A future match can remain fixture-only, but it cannot disappear.

## Replace these files
- `merge-fixture-shards.js`
- `verify-week-data.js`
- `.github/workflows/future-fixtures.yml`

## After replacing
Start a completely new **Predict2U Fast All Games** workflow run. Do not re-run the old workflow execution.

The merge writes:
- `data.js`
- `fixture-coverage-report.json`
- `week-fixture-report.json`

The workflow now fails before publishing if even one discovered fixture is missing from a day that discovery reported.
