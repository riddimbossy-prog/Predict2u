# Predict2U Reliable Fixture Feed v247

This release separates fixture visibility from prediction enrichment.

## New fast feed

`fetch-fixtures-snapshot.js` makes one API-Football request per date and writes:

- `fixtures.js` — every scheduled match for today through six days ahead
- `fixture-snapshot-report.json` — daily totals and league totals

The independent workflow `.github/workflows/fixture-snapshot.yml` runs every three hours and normally finishes in minutes.

## Website behavior

- Overview counts the shared fixture feed.
- Picks and Bankers show complete date totals while retaining strict selection rules.
- Full Board shows every fixture.
- Matches without completed engine enrichment display **Analysis pending**.
- Enriched rows from `data.js` automatically replace fixture-only placeholders.

## GitHub secrets

The workflow uses the existing names:

- `API_FOOTBALL_KEY` (preferred) or `API_KEY`
- `DAYS_FWD` with value `6`

No new secret is required.

## Run after deployment

Open **Actions → Predict2U Fast Fixture Snapshot → Run workflow**.
The long **Predict2U Fast All Games** workflow can continue separately for detailed predictions.
