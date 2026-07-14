# Predict2U v220 — Today’s Board Redesign

This release replaces the old prediction-card section in both `index.html` and `board.html` with a functional production UI based on the approved mockup.

## Replaced UI

- Premium dark-navy board container with lime Predict2U accents.
- New Today’s Board heading, live board count, and compact filter toolbar.
- Functional **All Picks**, **Top Value**, and **High Confidence** filters.
- League dropdown and expandable match/league search.
- Three-column desktop card grid, two-column tablet grid, and one-column phone/Fold layout.
- Balanced team-versus-team presentation with crests and kickoff/status information.
- Dedicated prediction and odds panel.
- Exact Support progress bar with the real engine agreement count.
- Cleaner signal badges for agreement, conflict, and data coverage.
- Horizontal Details, Proof, Slip, and Share actions.
- Smaller movable slip button styling while preserving drag behavior.

## Preserved functionality

- Active-engine filtering and real `x/total` engine counts.
- Date switching and league filtering.
- ACCA generation and Add All to My Slip.
- Details expansion and engine reasoning.
- Proof deep links.
- Per-card sharing.
- Movable floating slip drawer.
- Live, pending, won, lost, and void states.

## Release validation

- Board redesign checks: **25 passed**
- Core release checks: **23 passed**
- Active-engine board checks: **32 passed**
- ACCA mobile checks: **20 passed**
- Movable slip checks: **15 passed**

The service-worker cache is rolled to `predict2u-v220` and precaches `board-redesign-v220.css`.
