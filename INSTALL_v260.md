# Predict2U v260 — Desktop Board + Z Fold Nav + News polish

## What this patch fixes
- Cleans the desktop board rail area: date chips, engine pills and personalization bar.
- Stops engine pills from overflowing awkwardly on desktop widths.
- Gives Z Fold and tablet users the bottom dock navigation instead of a squeezed top rail.
- Refines the News page layout for unfolded Z Fold and tablets.
- Bumps the PWA cache to v260 so the new CSS loads cleanly.

## Replace these files
- board-redesign-v220.css
- personalization.css
- unified-shell-v245.css
- unified-shell-v227.css
- ui-polish-v259.css
- sw.js
- BUILD_VERSION.txt

## After upload
1. Commit and push to `main`.
2. Hard refresh the browser or fully close and reopen the installed PWA.
3. If needed, go to site settings and clear cached files once so `v260` activates immediately.
