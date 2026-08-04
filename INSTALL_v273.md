# Predict2U v273 — Future Date Population Patch

## What was wrong

The published `current-data.js` ended on the current day because the heavy **Predict2U Fast All Games** workflow was manual-only. The separate `fixtures.js` snapshot was also manual-only and had become stale. Team Intelligence loaded only `current-data.js`, so it had no fallback source for tomorrow and the remaining dates.

## What this patch changes

1. Team Intelligence loads `fixtures.js`, then overlays enriched `current-data.js`.
2. The lightweight fixture snapshot runs automatically every six hours.
3. The full all-games discovery/enrichment runs automatically every day at 00:20 UTC.
4. The service worker moves to v273 and refreshes `fixtures.js` through the existing network-first data route.
5. The v273 release gate and targeted self-test check script order, schedules and cache wiring.

## Install

Copy the replacement files into the repository root, preserving the `.github/workflows/` folders, commit and push.

After the first deployment, open **GitHub → Actions** and manually run these once so the future dates appear immediately instead of waiting for the next schedule:

1. `Predict2U Fast Fixture Snapshot`
2. `Predict2U Fast All Games`

The first workflow fills the date tabs quickly. The second adds full stats, odds and Team Intelligence enrichment.

## Important

Do not put API keys in these files. The workflows continue to read `API_FOOTBALL_KEY` or `API_KEY` from GitHub Secrets.
