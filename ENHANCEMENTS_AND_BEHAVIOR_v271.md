# Predict2U v271 — Enhancements and behaviour

## Why this release was needed

The previous Auto Picks version could search too many profile combinations, over-favour one market type and use fallback fixtures when current data was unavailable. Its displayed strength score could also be mistaken for a probability.

## What changed

### Current fixtures only

Daily Auto Picks now uses only current, unresolved, pre-kickoff fixtures. Historical fallback fixtures remain available for research elsewhere on Team Intelligence, but they cannot become new automatic selections.

### Approved profile routes

The engine no longer tests every profile against every market. A profile pair must have an approved route to a compatible market family. Unsupported combinations return **No Bet**.

### Stronger release gate

Each automatic selection must pass:

- Split-sample and data-quality checks
- Recent-versus-season confirmation where relevant
- Market-specific price protection
- Historical price-band protection when enough evidence exists
- Direct comparison against the strongest conflicting outcome
- Private learning restrictions

The public page does not disclose internal learning rules or adjustment details.

### Model Grade

Cards now display a **Model Grade out of 100**. It is a release score, not a claimed chance of winning.

### Daily Core

The Auto Picks tab now has:

- **Daily Core** — three or four diversified selections
- **All Qualified** — every fixture that passed its individual gate
- **Settled** — compact verified outcomes

Daily Core limits repeated leagues, repeated exact markets and excessive concentration in one market family. When fewer than three independent selections qualify, no Daily Core is published.

### Slip integration

Users can add one Auto Pick or the complete Daily Core to My Slip. Saving or posting the slip continues to use the existing sign-in rules.

### Safer learning

Learning now considers more than wins and losses. Private evaluation also considers price performance, return, sample size and losing sequences. Public learning instructions are fixture-specific rather than reusable profile-rule hashes.

### Direct settlement recovery

When an older selection is no longer present in the rolling public data file, the private workflow can retrieve its final result by fixture ID using the existing football API secret.

## What users should expect

- Fewer low-value or repetitive selections
- More honest No Bet results
- No old fixture silently appearing as a new pick
- A smaller, more balanced Daily Core
- Short public explanations
- Detailed audit and learning data kept private
