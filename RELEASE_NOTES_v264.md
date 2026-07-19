# Predict2U v264 — Stabilization, Trust and PWA Release

v264 is a stabilization release. It fixes the critical security, stale-data, performance, engine-governance, Team Intelligence, navigation and PWA issues found in the v263 professional audit. It deliberately does **not** add another public prediction machine.

## Main outcomes

- Primary pages now load `current-data.js` instead of the 22.58 MB full historical bundle.
- Current public data is 3.23 MB in this packaged sample, an 85.7% reduction.
- Old fixture data is never presented as today's picks. Publishing pauses automatically when freshness checks fail.
- Consensus counts independent model families rather than duplicated engine generations.
- Eleven governed engines remain public across seven independent model families; eleven are retained in shadow testing.
- GG Machine remains in shadow testing until it has a forward-settled sample.
- Old Mismatch v1 is shadowed; Mismatch v2 no longer competes with Goal Compression on total-goal markets.
- Team Intelligence enforces an eight-match venue sample and a current seven-day fixture window.
- The primary navigation is reduced to Home, Today, Bankers, Engines and Proof.
- News and Community remain available under More instead of competing with the core prediction product.
- The Tailwind browser CDN was removed from production prediction pages and replaced with a small local utility stylesheet.
- A branded football/engine launch overlay, three-step first-user walkthrough and official Bold P install icon are included.
- Release security, performance, PWA and repository gates now run in Site Quality.
- Data workflows rebuild and publish the compact public bundle automatically.

## Important packaged-data state

The source package is intentionally honest: its latest source update is July 14, 2026 and its latest fixture date is July 15, 2026. On July 19, 2026, v264 will show **Predictions temporarily paused** until the data workflows successfully refresh current fixtures. This is expected behavior, not a bug.
