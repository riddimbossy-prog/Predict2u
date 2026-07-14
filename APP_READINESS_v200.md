# Predict2U v200 — PWA & Native-App Readiness

## Purpose
v200 turns the existing Predict2U website into a launch-candidate installable web app without changing engine calculations, fixture generation, Supabase secrets, VAPID keys or News Sync credentials.

## What changed

### Installable app experience
- Android, Chromium desktop and Windows use the browser install prompt when available.
- iPhone and iPad receive clear Safari **Add to Home Screen** instructions.
- Standalone mode is detected and the duplicate install chip is suppressed.
- Branded app icons, maskable icon, theme metadata and launch handling are declared in `manifest.webmanifest`.

### App shortcuts
The installed-app menu includes:
- Today’s Board
- Football News
- Community
- Proof Mode

### Offline shell and recovery
- `offline.html` provides useful navigation instead of a blank browser error.
- Board, News, Community, Account, Proof and core UI assets are cached individually.
- Navigation uses a bounded network-first strategy, then an offline fallback.
- Crests, flags and publisher images use a bounded runtime image cache.
- Runtime caches can be cleared from Admin without touching accounts or cloud records.

### Safe update flow
- The browser checks for a new service-worker version.
- A compact update prompt appears when a new release is waiting.
- **Update now** activates the waiting worker and reloads once.
- Cache version: `predict2u-v200`.

### Push deep links and badges
- Push clicks are restricted to same-origin Predict2U URLs.
- Notifications can open the exact story, match, Community post or Proof route supplied by the dispatcher.
- Supported browsers receive an unread app badge.

### Offline actions
- News comments can be queued while offline and retried after reconnection.
- News follows and Read Later changes remain available locally and queue their cloud update when the user is signed in.
- Browsers without Background Sync retry when the app comes online again.

### Admin App Readiness
Open:

`https://predict2u.com/admin.html#app-readiness`

The dashboard checks:
- HTTPS/secure context
- Web app manifest
- Active service worker
- 192px, 512px and maskable icons
- Offline page
- Install/update controller
- Push deep-link handler
- App shortcuts
- Share target
- Background Sync support

Recovery controls:
- Check for update
- Activate waiting update
- Clear runtime caches
- Preview offline page

## Installation
1. Extract the v200 changed-files ZIP into the repository root.
2. Choose **Replace files in destination**.
3. Commit and push.
4. Wait for **Predict2U Site Quality**.
5. Hard-refresh once.
6. Open Admin → App Readiness and run the checks.

Suggested commit:

`Install Predict2U v200 PWA and app readiness`

## No backend migration required
v200 requires no new:
- Supabase SQL
- Edge Function
- GitHub secret
- API key
- VAPID key

## Platform notes
- iOS does not expose the same automatic install prompt as Chromium; Safari’s Add to Home Screen flow is used.
- Background Sync support varies by browser. The online-resume fallback remains active.
- The supplied build snapshot does not contain generated `data.js` or `community.js`. The changed-files package does not delete or replace the live repository copies.
- Predict2U remains a records-and-analysis product. It does not handle stakes or payments. 18+ messaging remains in the existing trust surfaces.
