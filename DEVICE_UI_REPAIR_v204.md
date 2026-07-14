# Predict2U v204 — Mobile, Tablet and Z Fold UI Repair

## Repairs

- Adds one final responsive layer across every public page.
- Keeps the five-tab app navigation available through phone, tablet and unfolded/fold-landscape widths.
- Adds safe-area spacing for gesture bars, notches and foldable browser chrome.
- Prevents page-level horizontal overflow while preserving intentional horizontal rails and data tables.
- Makes Overview and Board cards use one or two readable columns based on available width.
- Makes date rails, engine filters and News tabs touch-scrollable rather than squeezed.
- Rebuilds News into one readable story lane on phones, tablets and unfolded Fold displays.
- Uses stacked News cards on narrow phones and compact image-and-copy cards on larger mobile screens.
- Keeps News search, Follow controls, Share actions and the discussion drawer within the viewport.
- Constrains Community, Account, Profile, Proof, Scorecards, League DNA, Trust and legal surfaces.
- Adds compact landscape rules for unfolded Z Fold and tablet layouts.

## Files added

- `device-responsive-v204.css`
- `DEVICE_UI_REPAIR_v204.md`
- `VALIDATION_v204.json`

## Files updated

- Public HTML pages: the v204 stylesheet is loaded last so it can safely correct older page-specific rules.
- `sw.js`: cache version raised to v204 and the new responsive stylesheet added to the light core shell.
- `BUILD_VERSION.txt`: raised to v204.

## Install

Copy the contents of the full ZIP into the repository root and choose **Replace files in destination**.
Do not delete live generated files that are not present in this source snapshot, especially `data.js` and `community.js`.

Suggested commit:

`Fix Predict2U mobile tablet and Z Fold layouts v204`

After deployment, hard-refresh once or accept the PWA **Update now** prompt.

No Supabase SQL, Edge Function, API key, GitHub secret or VAPID change is required.
