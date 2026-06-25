# Golden Banker — Setup (Windows, API-Football Pro)

============================================================
ONE-TIME SETUP
============================================================
1. Node.js installed already? Good.

2. Upgrade to Pro (unlocks the CURRENT season + 1,200+ leagues):
   - Log in at  dashboard.api-football.com
   - Left menu -> Pricing / My Subscriptions
   - Choose Pro ($19/month), pay via Stripe or PayPal.
   - Then go to "My Access" and copy your API key.
     (Same key as before — Pro just makes it work for this season.)

3. Double-click  set-key.bat
   - Paste your key when asked (right-click to paste), Enter.

============================================================
DAILY ROUTINE
============================================================
1. Double-click  run-fetch.bat
2. Drag the whole folder to  app.netlify.com/drop

============================================================
LEAGUES (numeric IDs in config.txt)
============================================================
  1   = World Cup (active now)   39  = Premier League
  140 = La Liga                  135 = Serie A
  78  = Bundesliga               61  = Ligue 1
  2   = Champions League         71  = Brazil Serie A
  Pro covers 1,200+ — find IDs in API-Football's dashboard and
  add any you like to the LEAGUES line.

============================================================
IF YOU SEE A PROBLEM
============================================================
"API_ERROR: ...season..." -> Pro upgrade not active yet, or wrong
   SEASON in config.txt. Check My Access shows an active paid plan.
"RATE LIMIT" -> Pro gives 7,500/day; just wait a minute if hit.
"no fixtures today" -> that league has no game today (normal).

The fetcher never wipes your saved board when a day is empty.

Honest reminder: hobby tool, not a predictor, doesn't beat the margin.
Only stake what you can afford to lose. 18+.
