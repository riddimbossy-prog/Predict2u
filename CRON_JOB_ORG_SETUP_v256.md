# Predict2U v256 — External Cron Scheduler Setup

This patch makes cron-job.org the only scheduler for the five main Predict2U workflows.
All five GitHub workflows now use `workflow_dispatch` only. Internal GitHub schedules and workflow chaining are removed.

## Security first

The GitHub token shown in the earlier screenshot must be revoked and replaced. Never put the token in a repository file.
Use the replacement token only inside cron-job.org's `Authorization` header.

## Shared request settings

- Method: `POST`
- Body: `{ "ref": "main" }`
- Header: `Accept: application/vnd.github+json`
- Header: `Authorization: Bearer YOUR_NEW_TOKEN`
- Header: `X-GitHub-Api-Version: 2022-11-28`
- Header: `Content-Type: application/json`
- HTTP authentication switch: OFF
- Successful dispatch response: `204 No Content`

## Recommended UTC schedules

Ghana uses UTC, so these times match Ghana local time.

| Workflow | Workflow file | Dispatch URL | Cron |
|---|---|---|---|
| Predict2U Fast All Games | `future-fixtures.yml` | `https://api.github.com/repos/riddimbossy-prog/golden-banker-v2/actions/workflows/future-fixtures.yml/dispatches` | `30 2,14 * * *` |
| Predict2U Fast Fixture Snapshot | `fixture-snapshot.yml` | `https://api.github.com/repos/riddimbossy-prog/golden-banker-v2/actions/workflows/fixture-snapshot.yml/dispatches` | `20 0,6,12,18 * * *` |
| Predict2U Football News Sync | `news-sync.yml` | `https://api.github.com/repos/riddimbossy-prog/golden-banker-v2/actions/workflows/news-sync.yml/dispatches` | `7,27,47 * * * *` |
| Predict2U Live Scores | `live-scores.yml` | `https://api.github.com/repos/riddimbossy-prog/golden-banker-v2/actions/workflows/live-scores.yml/dispatches` | `5,20,35,50 0-1,5-13,17-23 * * *` |
| Predict2U Odds + HTFT Refresh | `odds-api-refresh.yml` | `https://api.github.com/repos/riddimbossy-prog/golden-banker-v2/actions/workflows/odds-api-refresh.yml/dispatches` | `10 5,17 * * *` |

The Live Scores windows deliberately pause while Fast All Games and Odds + HTFT are expected to run.

## Why workflow cancellation is reduced

GitHub concurrency allows only one running and one pending workflow in a group. A newer pending run may replace an older pending run even when `cancel-in-progress` is false.
This patch gives each workflow its own concurrency group, so Fast All Games, Fixture Snapshot, Live Scores, Odds Refresh, and News Sync no longer cancel one another merely because they share a group.

The schedules remain separated to reduce API-Football rate limits and simultaneous writes.

## Installation

1. Extract this patch.
2. Copy the `.github` folder into the root of `golden-banker-v2`.
3. Choose Replace when asked.
4. Commit and push to `main`.
5. In cron-job.org, configure and test one job at a time.
6. Confirm each test returns HTTP `204` and appears under GitHub Actions as `workflow_dispatch`.

Do not place the GitHub token in any YAML, JavaScript, JSON, or Markdown file.
