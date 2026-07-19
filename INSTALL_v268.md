# Predict2U v268 — Team Intelligence Date Filter

## Added
A single fixture-date filter now controls all three Team Intelligence sections:
- Power Rankings
- Trend Lists
- Matchup Lab

## Behaviour
- **All loaded dates** remains the default, so existing results do not disappear after installation.
- The dropdown is populated only with dates actually present in the loaded fixture data.
- Each option displays the date and number of loaded matches.
- Selecting a date refreshes rankings, trends, league choices and Matchup Lab immediately.
- The selected date is stored in the page URL as `?date=YYYY-MM-DD`, so a filtered view can be refreshed or shared.
- An empty result is shown honestly when no team clears the selected thresholds on that date.

## Replace these files
- team-rankings.html
- team-rankings.js
- team-date-filter-v268.css
- sw.js
- BUILD_VERSION.txt
- performance-budget.js
- release-gate-v268.js
- package.json

## Install
Copy the patch files into the repository root, replace existing files, commit and push. Then fully close and reopen the PWA so cache v268 activates.
