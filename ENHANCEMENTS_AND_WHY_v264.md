# Predict2U v264 — Enhancements and Why They Were Added

## 1. Compact rolling data bundle

**Enhancement:** `build-public-data.js` generates `current-data.js` and `data-meta.json` for the current rolling window.

**Why:** Loading 22.58 MB of match data on every public page caused slow startup, heavy JavaScript parsing and poor Fold/mobile performance. The packaged v264 public bundle is 3.23 MB, reducing the main data payload by 85.7%.

**Behavior:** Workflows still keep `data.js` as the complete internal source, but public pages load only the rolling bundle. Proof and reporting can still use settled records from `track-log.json`.

## 2. Automatic stale-data publication gate

**Enhancement:** `data-freshness-v264.js` checks the source update time, latest fixture date and availability of current/future fixtures.

**Why:** A prediction product should never relabel old unresolved fixtures as today's picks.

**Behavior:** When data is stale, Home, Today, Bankers and engine pages show a clear paused state and publish no old selections. The site resumes automatically after a successful workflow creates fresh data.

## 3. Independent model-family governance

**Enhancement:** `engine-governance-v264.js` classifies engines as Active or Shadow and assigns independent model families.

**Why:** Normal, Strict, Ultra, Elite, Apex, Prime, Expert and Pro are related generations. Counting them as eight independent votes could exaggerate agreement.

**Behavior:** Public consensus counts one vote per family for an exact market. Superseded engines remain visible in the Engine Hub as Shadow but cannot inflate Bankers, ACCAs or public agreement.

## 4. Safer specialist ownership

**Enhancement:** Mismatch Engine v2 no longer selects Over 1.5 or Under 3.5; Goal Compression owns total-goal routes. GG Machine now requires direct split BTTS confirmation and remains Shadow.

**Why:** This reduces duplicated logic and keeps each specialist focused on a distinct problem.

**Behavior:** Mismatch focuses on clear opposite-team statistics for result, team-goal, BTTS No and half markets. GG publishes nothing publicly until governance changes its status after a meaningful forward sample.

## 5. Reliable Team Intelligence

**Enhancement:** Team lists now separate Next Match Edge from Season Power and enforce at least eight venue matches.

**Why:** The previous page could rank teams using old fixtures, very small samples and mixed league context.

**Behavior:** Only unsettled fixtures from today through the next seven days are considered. Every card shows sample size, PPG, scoring, conceding, clean sheets, next odds and exact qualification reasons. No qualifying team produces an honest empty state.

## 6. Core-first navigation and homepage

**Enhancement:** The main navigation is Home, Today, Bankers, Engines and Proof. Homepage actions are reduced to Today and Bankers.

**Why:** Too many top-level destinations and buttons diluted the product's purpose.

**Behavior:** Teams, Full Board, Scorecards, League DNA, News, Community, Trust and Account are under More. The same five destinations appear in the mobile/Z Fold bottom dock.

## 7. Local production utility CSS

**Enhancement:** `tailwind-lite-v264.css` replaces the Tailwind browser CDN on prediction pages.

**Why:** The Tailwind CDN is intended for development, adds runtime work and weakens offline reliability.

**Behavior:** Board, Bankers, Full Board and Strict Bankers retain their responsive utility layout without downloading the Tailwind compiler in the browser.

## 8. Branded PWA launch and first-user walkthrough

**Enhancement:** A short in-app splash uses football, stadium and engine graphics. A three-step walkthrough explains Today, Bankers, engines, slips, proof and installation.

**Why:** Native Android/iOS splash screens are partly controlled by the operating system and cannot always display a full custom cinematic design. The in-app overlay gives consistent branding across devices.

**Behavior:** The launch splash appears once per browser session on Home. The walkthrough appears once for a first user and can be replayed from More. Installing the PWA uses the official Bold P icon on the home screen.

## 9. Stronger release and workflow safety

**Enhancement:** Security scanning, v264 release checks, performance budgets and PWA validation are part of Site Quality. Data workflows rebuild the public bundle before committing.

**Why:** Earlier general audits could pass while detailed performance/PWA checks failed, and a real `config.txt` was packaged.

**Behavior:** The release fails when secret/config files are present, critical files are missing, the compact data bundle exceeds its budget, old repository URLs return, or the PWA contract breaks.

## 10. Security cleanup

**Enhancement:** `config.txt` is removed. Workflows create temporary config files from GitHub Secrets and delete them before publication. `cleanup-production-v264.js` removes unsafe local files and obsolete backups.

**Why:** API keys must never be shipped in a public ZIP or repository.

**Behavior:** The site continues to use GitHub Secrets. Previously exposed API keys still need to be rotated manually at their providers and updated in GitHub Secrets.
