# Predict2U v246 — Fixture Report Publishing Fix

The all-games workflow was producing fixture data inside the GitHub runner, but the generated report files were not appearing in the repository. The previous commit command silently ignored missing or ignored JSON files.

## Replace these files

- `.github/workflows/future-fixtures.yml`
- `merge-fixture-shards.js`
- `verify-week-data.js`

## What changed

- The workflow now fails immediately when a required report was not generated.
- Generated reports are force-added with `git add -f` even if `.gitignore` excludes generated JSON files.
- `week-fixture-report.json` derives a date from `kickoff` when `matchDate` is missing.
- The commit log prints every staged file before publishing.

## After replacing

Start a brand-new **Predict2U Fast All Games** workflow run. Do not re-run an older job because old runs keep the workflow revision with which they started.

After the new run succeeds, these files must appear in the repository root:

- `all-games-discovery.json`
- `fixture-coverage-report.json`
- `week-fixture-report.json`
- `data.js`
