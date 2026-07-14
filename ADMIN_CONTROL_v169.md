# Predict2U v169 — Admin Control Center

## Purpose

v169 adds a private-by-convention operator console at `admin.html`. It is not linked from the public navigation and is excluded from search indexing. The console is designed for the current static GitHub Pages architecture.

## Included controls

- Local operator PIN lock using salted SHA-256 in the browser
- Build, service-worker, engine-registry, data-freshness and audit status
- Publish or unpublish the public board
- Compact, dismissible announcements without a full-width warning banner
- Featured engines and leagues
- Verify or hide Community records by public slip ID
- GitHub repository, Site Quality and Live Scores workflow shortcuts
- Downloadable `admin-config.js`
- Downloadable support bundle
- Local operator activity log
- Phone, tablet, Z Fold and desktop layouts

## Important security boundary

The PIN is a local privacy lock only. Static GitHub Pages cannot provide true server-side admin authentication. The console never asks for or stores API keys, GitHub tokens or passwords.

For a permanent change:

1. Open `admin.html` directly.
2. Unlock the local console.
3. Make changes and choose **Download config**.
4. Replace the repository-root `admin-config.js` with the downloaded file.
5. Commit and push.
6. Let **Predict2U Site Quality** complete.

## Public controls

`site-controls.js` applies the committed configuration:

- Shows a small quiet announcement when enabled.
- Hides board records when `board.published` is false.
- Hides or verifies Community cards matching configured public slip IDs.
- Exposes featured engines and leagues through `window.P2USiteControls`.

## Files added

- `admin.html`
- `admin-control.css`
- `admin-control.js`
- `admin-config.js`
- `site-controls.css`
- `site-controls.js`
- `tests/admin-control.spec.js`

No credentials, API keys, generated match data or Community account data are included.
