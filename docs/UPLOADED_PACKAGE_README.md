# Predict2U Multi-Engine Build Package v1

This package contains the complete implementation blueprint for integrating four independent football prediction engines into Predict2U:

1. Control Edge Engine v1.0
2. League Signal Matrix Engine v2.0
3. Market Flow Engine v2.0
4. Goal Compression Engine v1.0

A fifth component, the Predict2U Decision Core, combines the engine outputs and publishes one final market or No Bet.

## Package contents

- `docs/Predict2U_Multi_Engine_Master_Spec.md` — complete build and integration specification
- `docs/Implementation_Checklist.md` — staged implementation checklist
- `schemas/normalized-match.ts` — normalized fixture and statistics interfaces
- `schemas/engine-result.ts` — common engine-result and final-prediction contracts
- `config/engine-weights.json` — starter Decision Core weights
- `config/league-profile-example.json` — example league-market signal record
- `config/no-bet-reasons.json` — standardized rejection codes
- `pseudocode/prediction-runner.ts` — top-level orchestration example
- `pseudocode/decision-core.ts` — candidate aggregation and release-gate example
- `tests/Test_Plan.md` — required calculation, boundary, conflict, settlement and UI tests

## Critical rules

- One fixture produces one final market or No Bet.
- No engine publishes directly to the public board.
- Missing mandatory data means No Bet.
- League patterns propose; odds activate; team statistics confirm; compression protects.
- Historical predictions must retain the input snapshot and exact engine versions used.
