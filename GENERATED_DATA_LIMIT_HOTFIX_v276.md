# Predict2U v276 — Generated Data Limit Hotfix

## Failure fixed

`Predict2U Fast All Games` completed discovery, enrichment and report rebuilding, but failed at **Compact generated match data** because `data.js` remained about 137.40 MB. GitHub rejects any single committed file at or above 100 MB.

## Root cause

The complete model-governance policy object was attached to every match as `governanceContext`. The object is shared global policy, not match-specific data. Repeating it thousands of times added tens of megabytes and ordinary whitespace compaction could not reduce it.

## Repair

- Hoist the shared governance policy once to `window.P2U_GOVERNANCE_CONTEXT`.
- Remove only the duplicate `governanceContext` copy from each match.
- Preserve all match-specific statistics, odds, profiles, trends and learning context.
- Teach the governance supervisor and consensus engine to read the shared global policy.
- Carry the shared policy into `current-data.js`.
- Enforce a 95 MB operating ceiling before publication, leaving safety below GitHub's 100 MB hard limit.

No API key, Auto Picks rule, prediction threshold, settlement rule or Supabase table is changed.
