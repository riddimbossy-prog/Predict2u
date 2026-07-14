# Predict2U v248 — generated file conflict fix

The uploaded file is `track-log.json`. It contained real Git conflict markers around `meta.updated`, so it was invalid JSON.

## Root cause
Several active workflows were writing `data.js` and `track-log.json` on different concurrency lanes:
- future-fixtures.yml
- live-scores.yml
- update-data.yml
- update-scores.yml
- tracker-email.yml

The same generated files were rebased at the same time, producing committed conflict markers.

## Replace
- track-log.json (cleaned copy from the uploaded file; newest `updated` value retained)
- repair-generated-conflicts.js
- .github/workflows/future-fixtures.yml
- .github/workflows/live-scores.yml
- .github/workflows/update-data.yml
- .github/workflows/update-scores.yml
- .github/workflows/tracker-email.yml

## Important
Do not upload or manually merge a `data.js` from this patch. Keep the repository copy and let `Predict2U Fast All Games` regenerate it.

The two legacy workflows are kept as manual-only emergency actions. The current scheduled writers use the same `predict2u-data-write` queue. Tracker email is read-only because live-scores already maintains `track-log.json`.

After replacing the files, start a NEW `Predict2U Fast All Games` run. Then start `Predict2U Live Scores` once.
