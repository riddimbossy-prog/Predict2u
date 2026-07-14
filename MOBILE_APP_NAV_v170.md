# Predict2U v170 — Mobile App Navigation

## Added
- Fixed four-item bottom navigation on every public page: Board, Games, Results and Community.
- Automatic active-page highlighting.
- Safe-area support for gesture bars, iPhone and foldable devices.
- Z Fold cover and landscape sizing.
- Removal of the old Community-only mobile navigation to prevent duplicates.
- Mobile suppression of stale/degraded/critical floating health badges, including the former “Action Needed” badge.
- Desktop health information remains available through Trust Center.

## Routes
- Board → `index.html`
- Games → `engines.html`
- Results → `scorecards.html`
- Community → `community.html`

## Scope
The operator-only `admin.html` keeps its existing admin navigation and is not exposed in the public bottom bar.
