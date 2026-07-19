# Predict2U v266 — Enhancements and Expected Behaviour

## Why the Team page was expanded
The old page only ranked best, worst, attack and defence profiles. v266 adds reusable trend lists so users can study the exact patterns that often matter before a match: wins, losses, winless, unbeaten, draws, no draws, Over/Under 1.5, 2.5 and 3.5, GG and NG.

## Why the Matchup Lab uses real loaded fixtures
The Lab does not allow two unrelated clubs to be combined into an imaginary match. A home and away team are offered only when they are already paired in a loaded fixture and both satisfy the chosen profiles. This keeps venue splits, league context and odds relevant.

## Matchup Lab behaviour
- Default example: Home Winless versus Away No Draws.
- The home selector lists loaded fixtures passing both profiles.
- The away selector automatically locks to the real opponent.
- Analysis checks split PPG, W/D/L rates, streaks, attack, defence, goal-line rates, direct BTTS rates, league trends, sample size and available odds.
- It produces one safest qualifying pick, up to two supporting markets, or `No Bet` when no market clears the strict threshold.
- No market is forced when the data is borderline or the required odds are missing.

## Mobile navigation change
Proof is removed from the fixed mobile dock and moved into More. The mobile dock now contains Home, Today, Bankers, Engines and More, reducing crowding on small phones and Z Fold cover screens. Desktop navigation still shows Proof directly.

## Freshness message change
The large `Predictions temporarily paused` banner is removed. Data freshness continues to be tracked quietly. Pages can still show the loaded fixture set, while date filters and the Matchup Lab identify whether current-window or latest loaded unresolved fixtures are being used.
