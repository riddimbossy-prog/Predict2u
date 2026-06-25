# GOLDEN BANKER — Complete Guide

A football "banker" dashboard. Pulls real match data, scores each match
with the Golden Banker rules, picks the safest bets, and shows results
(Won / Lost / Void) once games finish.

============================================================
THE FILES (keep them ALL in ONE folder)
============================================================
  index.html ........ the website
  banker-engine.js .. scoring + result rules
  fetch-data.js ..... pulls real matches (runs on your PC)
  write-config.js ... helper used by set-key.bat
  data.js ........... your matches (starts empty; the fetcher fills it)
  config.txt ........ your settings (token + leagues)
  set-key.bat ....... double-click to set your token the easy way
  run-fetch.bat ..... double-click to pull matches
  README.md / SETUP-LIVE-DATA.md ... guides

============================================================
SETUP (do this once)
============================================================
1. Install Node.js if you haven't: https://nodejs.org (click "LTS").

2. Use your API-Football Pro key:
   - Log in at https://dashboard.api-football.com
   - Open "My Access" and copy your API key.
   - Your FOOTBALL plan must show "Pro" and "Active" (Pro unlocks the
     current season; the free plan only allows 2022-2024).

3. Double-click  set-key.bat
   - Paste your key when it asks (right-click to paste), press Enter.
   - It writes a clean config.txt for you. No manual editing needed.

============================================================
DAILY ROUTINE (2 steps)
============================================================
1. Double-click  run-fetch.bat
2. Drag the whole folder to  app.netlify.com/drop

============================================================
OFF-SEASON NOTE
============================================================
The big European leagues rest in June/July. If you see "0 matches",
that's why. The World Cup (league ID 1) is in your config and active
in summer 2026, so you should still get games.

============================================================
HONEST NOTE
============================================================
A hobby dashboard built on rules of thumb. It does NOT predict results
and does NOT beat the bookmaker's margin. The results history is for
honest record-keeping, not a reason to bet more. Only stake what you
can comfortably lose. 18+. Free tier is for non-commercial use.

============================================================
FINDING LEAGUE IDs (any country, including African leagues)
============================================================
Not sure of a league's ID? Look it up directly from the API:

1. Open the banker-app folder.
2. Click the address bar at the top of the folder window, type:  cmd
   and press Enter (a black window opens in this folder).
3. Type one of these and press Enter:
     node find-leagues.js Nigeria
     node find-leagues.js "South Africa"
     node find-leagues.js Egypt
     node find-leagues.js Morocco
4. It lists every league/cup for that country with its ID number.
5. Put the IDs you want into the LEAGUES line of config.txt
   (double-click set-key.bat again is NOT needed — just edit and save).

This way you never have to guess an ID. Use the exact English country
name. If a league you added shows "no fixtures", it may be off-season
(most African leagues run Aug->May) or the ID needs checking this way.
