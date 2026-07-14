# Predict2U v187 — Quality Gate Stability

This maintenance release fixes the three Playwright failures reported after v186 without changing live data, Supabase tables, push secrets, or public product behavior.

## Fixes

- Admin publishing test now opens the panel through the supported admin API and clicks the visible custom switch rather than the intentionally hidden checkbox input.
- Community freshness test now isolates `community-freshness.js` from asynchronous Community/data rendering and injects its fixture clock after page load.
- Push readiness is now emitted only after the Account Center push card has actually mounted.
- The push observer retries a full refresh when the account grid appears, closing the early-ready race.
- Service-worker and package versions advanced to v187.

## Installation

Copy the changed files over v186, commit, push, and start a new Predict2U Site Quality run.

No SQL, Edge Function, VAPID, GitHub secret, or Supabase update is required.
