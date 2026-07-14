# Predict2U Test Plan

## Calculation tests
- LATG classification at 2.39, 2.40, 3.00, 3.01, 3.40 and 3.41
- Attack and defensive ratios
- Goal Index
- PPG and venue PPG gaps
- Table tier and position gap
- Dual raw-GA defence confirmation

## Odds-trigger boundary tests
- 1X/X2/12 immediately below, equal to and above every configured threshold
- All-DC range inclusive endpoints
- Balanced 1X2 spread at 0.19, 0.20 and 0.21
- Missing/stale odds

## Engine tests
- Control Edge: elite defence with average attack routes to DNB, not Win
- League Signal Matrix: hard avoid overrides statistical pass
- Market Flow: odds signal cannot publish without confirmation
- Goal Compression: same-tier risk downgrades aggressive goals

## Decision Core tests
- Exact-market specialist consensus
- Directional Over consensus at different lines
- Hard Over/Under conflict
- BTTS Yes/No conflict
- Best candidate lead at 5.99, 6.00 and 6.01
- Final score at 81.99, 82.00, 87.99 and 88.00
- One engine error with remaining engines safe

## Settlement tests
- Home/Away Win
- DNB win, void and loss
- Over/Under 1.5, 2.5 and 3.5 boundaries
- BTTS Yes/No
- Team totals
- Postponed, abandoned and cancelled fixtures

## Data-quality tests
- Unknown league
- Cross-season stats
- Six vs five venue matches
- Reversed home/away values
- Missing xG fallback behavior
- Missing table positions for compression

## UI regression
- 360px Android width
- iPhone width
- Samsung Z Fold folded
- Samsung Z Fold unfolded
- Tablet portrait
- Desktop
- No horizontal overflow
- Date tabs usable
- Add to Slip visible
- Floating slip control movable and non-blocking
- Empty engines hidden and active count accurate
