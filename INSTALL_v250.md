# Predict2U v250 — GitHub Large-File Fix

## What failed

GitHub rejected the workflow push because `api-cache.json` reached about 115.70 MB. GitHub has a hard 100 MB limit per normal Git object. `data.js` was about 80.91 MB, which was accepted only with a warning.

## What v250 changes

- `api-cache.json` is never committed to Git.
- The API cache is restored/saved with GitHub Actions Cache instead.
- `data.js` is compacted before every active data commit.
- All major `data.js` writers now output compact JSON.
- Retry logic amends repaired/compacted generated files before pushing.
- The patch does not contain `data.js`, `track-log.json`, or other live generated match files.

## Recommended installation

1. Abort any local merge in GitHub Desktop.
2. Use a clean clone of `golden-banker-v2`.
3. Copy the contents of the v250 PATCH folder into the clean clone and replace matching files.
4. Commit with: `Install Predict2U v250 large-file fix`.
5. Push to `main`.
6. Start a completely new `Predict2U Fast All Games` workflow run. Do not re-run failed run #9.

The full ZIP is a complete repository snapshot. Use the patch for an existing repository because it avoids replacing current generated match data.
