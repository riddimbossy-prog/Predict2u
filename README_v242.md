# Predict2U v242 — Date Coverage Fix

This patch fixes the situation where the all-games discovery succeeds but future dates still show “No games”.

## Root cause
The discovery job found fixtures by date, but each shard then re-fetched fixtures by league and a single resolved season. During season rollover and mixed tournament calendars, some future fixtures were dropped before `data.js` was built.

## Replace these files
- `discover-all-games.js`
- `fetch-data.js`
- `verify-week-data.js`
- `.github/workflows/future-fixtures.yml`
- `board.html`
- `bankers.html`

## What changed
- Discovery now saves the exact raw fixture list for every requested date.
- Shards enrich those exact fixtures instead of discovering them again.
- The merge is checked against discovery with a 95% minimum coverage gate.
- `matchDate` falls back to the kickoff date when needed.
- Every Picks and Bankers card now displays its fixture date beside the kickoff time.

## After replacement
Start a NEW run from Actions → Predict2U Fast All Games → Run workflow.
Do not use “Re-run jobs” on the old run.

After the green run, open `week-fixture-report.json` and compare `games`, `discovered`, and `discoveryCoverage` for each date.
