# Predict2U v202 — Performance & Native Install

## What changed

### Native installation

- On supported Chrome/Edge/Chromium browsers, the Predict2U **Install** button now opens the browser's native installation confirmation directly.
- The old duplicate install listener in Growth & Sharing was removed.
- Install prompts are offered only after the browser confirms that the PWA is installable.
- iPhone/iPad still requires Safari's **Add to Home Screen** flow because Apple does not expose a programmatic PWA-install prompt.
- Browsers that do not expose a native prompt show a fallback explanation only after the user asks to install.
- First-time service-worker activation no longer forces an unnecessary page reload.

A website cannot silently install itself. The browser must show a user confirmation.

### Performance

- Reduced the service-worker install shell from dozens of assets to a small core shell.
- Other pages and files cache only after use or during a quiet idle period.
- Reduced image cache from 220 to 90 entries.
- Cache trimming now happens in batches instead of after every image.
- Static assets revalidate only once per service-worker session.
- Removed duplicate page-prefetch logic.
- Limited idle prefetch to one likely next page and disabled it on Data Saver/2G connections.
- Deferred multi-table account synchronization until after initial rendering.
- Deferred noncritical analytics event binding.
- Batched share-button decoration instead of rescanning the page for every DOM insertion.
- Added `content-visibility` to long News, Community, engine and proof feeds.
- Service-worker update checks run at most once every six hours per browser.

## Install

1. Extract the changed-files ZIP into the root of `golden-banker-v2`.
2. Choose **Replace files in destination**.
3. Commit and push:

```text
Install Predict2U v202 performance and native install upgrade
```

4. Allow the Site Quality workflow to finish.
5. Hard-refresh once.
6. Existing installed users should accept the **Update now** prompt.

No Supabase SQL, Edge Function, API key, GitHub secret or VAPID-key change is required.

## Test installation

### Android Chrome / desktop Chrome or Edge

1. Open Predict2U in the browser.
2. Wait for **Install app** to appear.
3. Tap it.
4. The browser's native install confirmation should open immediately.

### iPhone/iPad

Safari requires Share → Add to Home Screen. This cannot be started automatically by website code.

## Validation

- PWA readiness self-test passed.
- Repository preflight passed.
- Performance budget passed with zero errors and zero warnings.
- JavaScript syntax passed for every changed JavaScript file.
- Release-specific native-install and performance checks passed.

The supplied source snapshot still omits generated `data.js` and `community.js`; the changed-files patch does not replace or remove the live repository copies.
