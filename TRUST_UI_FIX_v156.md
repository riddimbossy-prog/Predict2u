# Predict2U Trust UI Fix v156

This patch fixes the unstyled Trust Center and legal pages by making them self-contained.

## What changed
- Embedded the full shared site styles directly inside:
  - `trust.html`
  - `responsible-gambling.html`
  - `terms.html`
  - `privacy.html`
  - `disclaimer.html`
- Kept the external stylesheet links too, so the pages still work normally when cached assets are healthy.
- Added page-level fallback styles for the Trust Center and legal-page layouts.
- Bumped the service-worker cache to `predict2u-v156`.

## Result
If `intelligence.css` or `site-health.css` ever fails to load because of cache staleness or deployment timing, the Trust Center and legal pages will still render with the correct dark Predict2U UI.

## Replace
- `trust.html`
- `responsible-gambling.html`
- `terms.html`
- `privacy.html`
- `disclaimer.html`
- `sw.js`

No data rerun is required. Upload the files and hard refresh once.
