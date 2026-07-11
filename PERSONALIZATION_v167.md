# Predict2U v167 — Personalization

## What this release adds

Predict2U now remembers each visitor's preferred board setup locally in the browser. No account or password is required.

### Favorite engines
- Mark any of the 16 engines as a favorite.
- Favorite engine pills display a star.
- My Board can filter picks to matches supported by favorite engines.

### Favorite and hidden leagues
- Mark leagues as favorites.
- Favorite leagues are identified with a star in the league selector.
- Hide leagues that should not appear on the board.
- Hidden leagues can be restored from the Personalize panel.

### My Board
- A new My Board control filters the board to favorite engines and favorite leagues.
- It stays off until at least one favorite exists.
- Visitors may choose to start on My Board automatically.

### Saved filters
- Engine, league, and search filters can be restored on the next visit.
- Filter memory can be disabled.
- A default engine can be selected for visitors who do not want filter memory.

### Card views
- Compact: smaller cards and fewer secondary signals.
- Standard: the normal Predict2U card layout.
- Detailed: adds engine support, league, coverage, and conflict information directly to each card.

### Recently viewed matches
- Opening Details or Proof adds a match to Recently Viewed.
- Up to eight recent matches are stored.
- History can be cleared at any time.

### Privacy
All personalization is stored in localStorage on the current device. It is not uploaded to Predict2U and does not require sign-in.

## Installation

Replace the files in the changed-files package, commit, and push. The GitHub Site Quality workflow will validate personalization, mobile layouts, performance budgets, repository completeness, and service-worker caching.

Suggested commit message:

```text
Install Predict2U v167 Personalization
```

After deployment, hard-refresh once with Ctrl + Shift + R so the v167 service worker becomes active.
