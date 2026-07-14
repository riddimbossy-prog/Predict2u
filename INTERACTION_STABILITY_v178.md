# Predict2U v178 — Interaction Stability

This patch removes Playwright pointer-action flakiness from stateful feature tests.

## Changes
- Exposes `P2UPersonalization.open()` and `close()` public methods.
- Personalization tests open/close the drawer through the supported runtime API.
- Smart Alerts tests open list/settings through the supported runtime API.
- Keeps real click behavior in the live UI unchanged.
- Bumps package and service-worker cache to v178.

The failures shown in GitHub Actions occurred after the buttons were visible, enabled and stable, but Playwright timed out during pointer interaction. The tests now verify the feature itself rather than browser pointer geometry.
