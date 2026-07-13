# Predict2U Fast All Games v241 — matrix fix

Replace only:

`.github/workflows/future-fixtures.yml`

## Why v240 failed

The discovery job successfully created the league list, but GitHub Actions could not parse the large dynamic JSON job output used by `fromJSON(...)` in the matrix strategy.

## What changed

- Uses a fixed six-shard matrix: 0 through 5.
- Each shard downloads `all-games-discovery.json`.
- Each shard reads only its own league list from that manifest.
- No large JSON is passed through GitHub job outputs.
- Empty shards safely skip themselves.
- All active leagues are still processed.

After replacing the workflow, run **Predict2U Fast All Games** again. Do not use **Re-run failed jobs** on the old run because that run still references the broken workflow revision.
