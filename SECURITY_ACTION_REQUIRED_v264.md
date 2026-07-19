# Predict2U v264 — One Manual Security Action Still Required

The v263 full package contained real API credentials in `config.txt`. v264 removes that file, adds a release security scanner and changes workflows to use temporary secret configuration.

The build cannot rotate credentials at external API providers. Complete these steps once:

1. Revoke/regenerate the affected API credentials in each provider dashboard.
2. Update the matching values under **GitHub → Repository Settings → Secrets and variables → Actions**.
3. Confirm these secrets are present as needed: `API_FOOTBALL_KEY` or `API_KEY`, `STATS_API_KEY`, and `ODDS_API_KEY`.
4. Delete `config.txt` from the repository if it still exists.
5. Run **Predict2U Site Quality** and confirm the security scan passes.

Never paste the replacement keys into a chat, screenshot, source file or downloadable ZIP.
