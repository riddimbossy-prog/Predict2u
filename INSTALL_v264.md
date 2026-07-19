# Install Predict2U v264

## Recommended method — patch over v263

1. Extract `Predict2U_Stabilization_v264_PATCH.zip`.
2. Copy everything inside the patch folder into the root of `predict2u-my-banker-v2`.
3. Replace existing files when Windows asks.
4. Open PowerShell in the repository folder and run:

```powershell
node cleanup-production-v264.js
node release-security-scan.js
node build-public-data.js
npm run quality
```

5. Commit and push:

```powershell
git add -A
git commit -m "Install Predict2U v264 stabilization and PWA release"
git push origin main
```

6. Rotate the previously exposed API keys and update GitHub Secrets.
7. Run these workflows in this order:
   - Predict2U Fast All Games
   - Predict2U Odds + HTFT Refresh
   - Predict2U Live Scores
8. Open Predict2U in a private browser tab first. Confirm the stale banner disappears after fresh data is published.
9. Fully close and reopen the installed PWA so cache v264 activates.

## Important

Before the workflows refresh current fixtures, the site is expected to pause predictions. Do not disable the freshness guard to make old picks appear.
