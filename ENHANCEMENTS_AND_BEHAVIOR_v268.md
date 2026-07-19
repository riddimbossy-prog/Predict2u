# v268 Enhancement and Expected Behaviour

## Why this enhancement was added
Team Intelligence now contains rankings, trend profiles and matchup analysis. A global date filter makes those tools easier to inspect without adding separate date controls to every section.

## Expected behaviour
1. The page opens on **All loaded dates**.
2. The date menu lists only fixture dates available in the current public data bundle.
3. Choosing a date updates all Team Intelligence sections together.
4. League menus are recalculated for the chosen date, preventing irrelevant leagues from remaining selected.
5. Matchup Lab only offers fixtures scheduled on the selected date.
6. Changing between Power Rankings, Trend Lists and Matchup Lab keeps the selected date.
7. Refreshing a URL containing `date=YYYY-MM-DD` restores that date when it still exists in the loaded dataset.
8. When fresh workflows replace the public data bundle, the available date list updates automatically.
