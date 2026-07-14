# Golden Banker — CLOUD AUTO-REFRESH SETUP (runs daily, no PC needed)

This makes your site update itself once a day automatically, in the
cloud, whether your computer is on or off. It's a one-time setup.

There's no coding — you create two free accounts and paste a few things.
Take it slowly, one step at a time.

WHAT CHANGES: after this, you STOP dragging the folder to Netlify.
Instead, GitHub stores your project and updates it daily, and Netlify
auto-publishes from GitHub. Drag-and-drop is replaced by automation.

============================================================
PART 1 — PUT YOUR PROJECT ON GITHUB
============================================================

1. Make a free account at  https://github.com  (if you don't have one).

2. Create a new repository:
   - Click the "+" top-right -> "New repository".
   - Name it:  golden-banker
   - Set it to PRIVATE (important — keeps your stuff yours).
   - Do NOT tick "Add a README".
   - Click "Create repository".

3. Upload your files:
   - On the new empty repo page, click "uploading an existing file".
   - Open your banker-app folder, select ALL files (Ctrl+A), and drag
     them into the browser upload area.
     IMPORTANT: also include the hidden ".github" folder. If you can't
     see it, in your folder turn on: View -> Show -> Hidden items.
   - Wait for them to upload, then click "Commit changes".

   NOTE: config.txt will NOT upload (it's ignored on purpose, so your
   API key never goes to GitHub). That's correct — leave it.

============================================================
PART 2 — STORE YOUR SECRETS (API KEY ETC.)
============================================================

Your API key goes in GitHub's encrypted "Secrets", never in the code.

1. In your repo, click  Settings  (top menu).
2. Left menu: Secrets and variables -> Actions.
3. Click "New repository secret" and add these THREE, one at a time:

   Name:  API_KEY     Secret:  (paste your API-Football key)
   Name:  SEASON      Secret:  2026
   Name:  LEAGUES     Secret:  1,2,3,39,140,135,78,61,88,94,144,203,71,128,253,307,233,288,200,202,186,12,20

   (For LEAGUES, paste the same list that's in your config — or any
   IDs you want. For SEASON use 2026.)

4. Click "Add secret" after each one. You should end with 3 secrets.

============================================================
PART 3 — CONNECT NETLIFY TO GITHUB
============================================================

Now Netlify will auto-publish whenever the data updates.

1. Log in at  https://app.netlify.com
2. Click "Add new site" -> "Import an existing project".
3. Choose "Deploy with GitHub", authorise it, and pick your
   "golden-banker" repository.
4. Build settings: leave them basically empty —
   - Build command: (leave blank)
   - Publish directory:  .   (just a single dot, meaning the main folder)
5. Click "Deploy".

Netlify gives you a new web address. (If you want your old
goldenbanker.netlify.app name: Site settings -> Change site name, or
point your old site at this repo instead.)

============================================================
PART 4 — TEST IT
============================================================

1. In GitHub, click the "Actions" tab.
2. Click "Update Golden Banker data" on the left.
3. Click "Run workflow" -> "Run workflow" (this runs it now instead of
   waiting for tomorrow morning).
4. Wait ~1 minute. A green tick = success. Click into it to see the log
   (you'll see the per-league lines, just like the black window).
5. If data changed, Netlify auto-redeploys within a minute. Open your
   site — matches should appear.

After this, it runs by itself every day at 07:00 UTC. You don't touch
anything. To change the time, edit the "cron" line in
.github/workflows/update-data.yml (the time is in UTC).

============================================================
TROUBLESHOOTING
============================================================

Action fails with a red X -> click it, read the log. Most common:
  - "API token is invalid" -> the API_KEY secret is wrong; re-add it.
  - season error -> make sure your API-Football Pro plan is active.

No matches appear but Action is green -> likely off-season (no games
  today) or the leagues had no fixtures. The board keeps old days, so
  it won't wipe anything.

Netlify didn't update -> check it's connected to the repo (Part 3) and
  that the publish directory is a single dot ( . ).

============================================================
HONEST NOTE
============================================================
Automation means this updates a betting board daily on its own. That's
convenient, but a hands-off, always-fresh betting dashboard can quietly
pull you into checking and wagering more out of habit. It's still a
heuristic tool — it does not predict results and does not beat the
bookmaker's margin. Keep stakes to what you can comfortably lose. 18+.
