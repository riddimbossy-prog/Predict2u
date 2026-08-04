# Predict2U v274 Validation

- Confirmed the failed run stopped in `actions/checkout@v4` after approximately 30 minutes.
- Confirmed the checkout command was fetching all branches and tags.
- Root cause: `fetch-depth: 0` in the v273 fixture snapshot workflow.
- Replaced all remaining full-history workflow checkouts with `fetch-depth: 1`.
- Covered fixture snapshot, full future-fixture merge, live scores, odds refresh and auto-picks learning workflows.
- Preserved all existing schedules, API secrets, generated-data steps and commit/push behavior.
- `node workflow-checkout-selftest-v274.js` passes.
- All workflow YAML files parse successfully.
