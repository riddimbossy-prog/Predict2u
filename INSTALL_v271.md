# Predict2U v271 — Auto Picks Gatekeeper v2

## Install

1. Copy every file from the v271 patch into the repository root and replace matching files.
2. In Supabase, open **SQL Editor** and run:

```text
supabase/auto-picks-learning-v271.sql
```

3. Keep these existing GitHub Actions secrets:

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
API_FOOTBALL_KEY
AUTO_LEARNING_POLICY_B64
```

No new secret is required.

4. Commit and push:

```powershell
git add -A
git commit -m "Install Predict2U v271 Auto Picks Gatekeeper v2"
git push origin main
```

5. Run these workflows:

```text
Predict2U Fast All Games
Predict2U Odds + HTFT Refresh
Predict2U Auto Picks Learning
```

6. Fully close and reopen the PWA so cache **v271** becomes active.

## Important first result

The packaged fixture data is old, so v271 correctly produces no public Auto Picks from that package. Fresh fixtures and odds must be published before current selections appear.
