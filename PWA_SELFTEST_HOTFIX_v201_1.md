# Predict2U v201.1 — PWA Quality Gate Hotfix

## Problem

The PWA self-test still required the old service-worker cache name `predict2u-v200`, while the live v201 worker correctly uses `predict2u-v201`. GitHub Actions therefore failed even though the worker itself was current.

## Fix

- Reads the current release from `BUILD_VERSION.txt`.
- Validates the matching service-worker cache dynamically.
- Confirms the worker `VERSION` matches the build.
- Keeps the IndexedDB outbox name stable so offline actions survive future releases.
- Removes the hard-coded Admin v200 assertion.

## Install

Replace only `pwa-selftest.js` in the repository root, commit, push, and start a new Site Quality run.

No Supabase SQL, Edge Function, GitHub secret, VAPID key, or website deployment setting changes are required.
