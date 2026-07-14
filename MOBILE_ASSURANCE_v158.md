# Predict2U v158 — Mobile, Tablet & Z Fold Assurance

## Responsive coverage
The quality suite now explicitly checks:

- 280×653 very small screens
- 320×700 small phones
- 344×882 Galaxy Z Fold cover screen
- 360×800 Android phones
- 375×812 iPhone-sized screens
- 390×844 and 412×915 large phones
- 600×960 small tablets
- 768×1024 and 820×1180 tablets
- 768×904 Galaxy Z Fold inner display
- 904×768 Galaxy Z Fold landscape
- 1024×768 tablet landscape
- 1440×1000 desktop

All public pages are included in the regression matrix.

## CSS improvements
- Safe-area padding for notches and foldable browser chrome
- Scrollable onboarding modal when screen height is limited
- Stacked action buttons on very narrow Z Fold cover screens
- Two-column rank cards on fold-inner and tablet widths
- Long team, league, and alert text wraps instead of overflowing
- Landscape-height rules for foldables and tablets

## Important test correction
The v157 Playwright file contained literal `\n` characters before the final tests, which caused a JavaScript syntax error. v158 corrects the file and expands it with explicit Z Fold and tablet viewport profiles.

## Deployment
Replace:

- `brand-experience.css`
- `tests/mobile-layout.spec.js`
- `package.json`
- `sw.js`

Then run the GitHub workflow:

`Predict2U Site Quality`

Cache version: `predict2u-v158`.
