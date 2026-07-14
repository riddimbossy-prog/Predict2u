# Predict2U Secret-Name Correction v238

This release updates the fixture and live-score workflows to use the exact repository secret names visible in GitHub.

## Exact names used

- API_FOOTBALL_KEY
- API_KEY (fallback)
- STATS_API_KEY
- SEASON
- LEAGUES
- DAYS_BACK
- DAYS_FWD
- ODDS
- H2H
- MAX_LEAGUES
- MAX_PROBES
- REQUEST_BUDGET
- SLEEP_MS
- SUPABASE_URL
- SUPABASE_SECRET_KEY
- PUSH_DISPATCH_SECRET

## Replace these files

- .github/workflows/future-fixtures.yml
- .github/workflows/live-scores.yml
- queue-push-events.js
- config.example.txt

No new GitHub secret names are required. P2U_LEAGUES, P2U_SEASON and SUPABASE_SERVICE_ROLE_KEY are no longer referenced.
