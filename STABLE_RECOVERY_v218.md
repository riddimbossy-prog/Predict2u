# Predict2U v218 — Stable Recovery

v217's global UI layer was removed because it could override critical page geometry and break the Full Board header.

## Preserved
- Active-engine daily filtering and the real `x/16` counter.
- Today's Board showing all qualified picks from active engines.
- Mobile, tablet and Z Fold fixes through v212.
- Movable floating My Slip button.
- News and Acca mobile visibility repairs.

## Fixed
- Full Board logo is hard-capped and can never expand over the page.
- Desktop navigation hides before links become crowded.
- Full Board critical layout no longer depends on Tailwind loading from a CDN.
- Desktop, tablet, foldable and phone grids have explicit local rules.
- Acca Add All uses a batch method, ignores duplicate matches, respects the 10-leg limit and opens My Slip.
- Service worker cache bumped to `predict2u-v218` to remove the broken v217 assets.

Deploy the complete ZIP and replace all matching files. Reopen the site or installed app online so the v218 service worker activates.
