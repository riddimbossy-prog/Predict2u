# Predict2U v165 — Speed & Freshness

v165 improves first-load speed, data freshness, offline behavior and release quality without bringing back the large public warning banner removed in v164.

## Public experience

- Adds a small, quiet **Last updated** indicator on data pages.
- Checks `data.js` automatically every 90 seconds during live fixtures and every five minutes otherwise.
- Applies newer board data in place on `index.html` and `board.html` without forcing a full-page reload.
- Shows a compact refresh option on pages that cannot update in place.
- Adds a clear board fallback when the fixture file is unavailable.
- Adds CSS-only loading placeholders for the first board paint.
- Keeps the removed full-width stale-data banner disabled.

## Performance improvements

- Adds CDN preconnect and DNS hints.
- Defers noncritical brand, health and freshness scripts.
- Uses `content-visibility:auto` for lower-page sections.
- Prefetches a limited set of likely next pages through the service worker during idle time.
- Gives images safer intrinsic sizing and keeps lazy-loaded crests lightweight.

## Service worker v165

- Cache: `predict2u-v165`
- Network waits are bounded to 4.5 seconds.
- HTML uses network-first with cached fallback.
- `data.js` and `site-health.json` use network-first with canonical cache keys.
- Query-string refresh checks do not create unlimited duplicate cache entries.
- Static assets remain cache-first with quiet background refresh.

## Release protection

GitHub Actions now runs:

1. Repository completeness preflight
2. Deterministic performance budget
3. Public health generation
4. Repository consistency audit
5. Mobile, tablet, Z Fold and desktop Playwright tests

The performance budget checks important HTML, JavaScript and CSS files, service-worker features, resource hints and the no-banner rule.

## Files added

- `performance-freshness.js`
- `performance-freshness.css`
- `performance-budget.js`
- `performance-budget.json`
- `tests/performance-freshness.spec.js`

## Deployment

Copy the changed files into the repository, commit them, push to the main branch and allow **Predict2U Site Quality** to run on the new commit. After deployment, hard-refresh once so service-worker cache `predict2u-v165` becomes active.
