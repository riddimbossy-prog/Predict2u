# Predict2U v209 — Mobile Acca repair

## Problem corrected

The Acca renderer used one desktop flex row for the leg number, fixture, market and odds. On narrow phones the market chip consumed the available width, collapsing the home/away team block. Unpriced odds also rendered as an oversized green dash, and the full risk notice dominated the screen.

## Changes

- Rebuilt each Acca leg as a responsive grid.
- Keeps the fixture name and league visible at every supported phone width.
- Places the market on its own row on phones and compact foldable screens.
- Keeps the odds in a separate right-aligned cell.
- Replaces the oversized unpriced dash in the combined-odds summary with **Not priced**.
- Uses a shorter, readable risk notice on mobile while preserving the complete notice on larger screens.
- Makes **Add all to my slip** full width on mobile.
- Uses a CSS warning icon so the notice does not depend on an external icon font.
- Updates the PWA cache to v209.

## Scope

Only the Acca presentation in `board.html` and the mirrored renderer in `index.html` changed. Prediction logic, consensus selection, pricing logic, slip behavior and backend data were not altered.
