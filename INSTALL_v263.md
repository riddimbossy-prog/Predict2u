# Predict2U v263 — Teams page visible from the main page

## Fixed
- Adds **Best & Worst Teams** as a prominent button in the homepage hero.
- Adds a dedicated **Best & Worst Teams** card inside **Explore Predict2U**.
- Adds **Teams** to the desktop navigation used by the main page and other legacy-shell pages.
- Adds **Best/Worst Teams** to the mobile **More** navigation.
- Keeps the existing `team-rankings.html` page and all v262 ranking logic.
- Bumps the PWA cache to v263.

## Replace
- `index.html`
- `overview-engines-v245.css`
- `unified-shell-v234.js`
- `sw.js`
- `BUILD_VERSION.txt`

## Deploy
Copy these files into the repository root, replace the old copies, commit and push to `main`. Then fully close and reopen the PWA or hard refresh once.
