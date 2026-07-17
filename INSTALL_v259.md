# Predict2U v259 UI Polish

## Replace
- All top-level HTML pages
- `ui-polish-v259.css`
- `sw.js`
- `BUILD_VERSION.txt`

## Main repairs
- Engine cards no longer inherit purple browser-link styling.
- Engine directory is compact, readable, searchable and sticky on phones.
- One-column cards on narrow Z Fold cover screens; two columns on wider phones/tablets.
- Desktop page widths, spacing, shadows and hierarchy are cleaned up.
- News uses a three-column desktop grid, two-column tablet/unfolded Fold grid, and compact one-column cover-screen layout.
- News filters scroll horizontally and remain sticky; search always fits.
- News discussion and action buttons stay usable across Fold postures.

No football workflow is required. Commit and push, then fully close and reopen the PWA/browser so service worker v259 activates.
