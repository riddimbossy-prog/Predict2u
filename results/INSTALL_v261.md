# Predict2U v261 — Bankers Add-All + Sign-In Redirect

## Fixed
- The Bankers page now adds the top three selections to My Slip.
- The engine mini-ACCA `Add all 3` buttons now work.
- Individual engine page bulk-add buttons now work.
- My Slip opens immediately after a successful bulk add.
- Adding picks does not require an account; it stays locally on the device.
- Saving privately or posting publicly redirects signed-out users to `account.html` to sign in.
- PWA cache bumped to v261.

## Replace
- bankers.html
- slip.js
- engine-bankers-v249.js
- engine-page-v249.js
- sw.js
- BUILD_VERSION.txt

No football workflow is required. Commit, push, then fully close and reopen the PWA.
