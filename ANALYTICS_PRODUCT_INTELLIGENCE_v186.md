# Predict2U v186 — Analytics & Product Intelligence

## Purpose

v186 adds privacy-first, first-party product analytics to Predict2U. It measures what parts of the product are useful, how quickly pages load on real devices, which pages and features receive attention, and where reliability needs improvement.

It does not use Google Analytics, Meta Pixel, advertising cookies, raw IP storage, full browser fingerprints, bookmaker credentials, payment information, stake values, or advertising identifiers.

## Included

- Consent-based first-party analytics
- Global Privacy Control and Do Not Track support
- Anonymous session measurement
- Page-view and feature-use tracking
- Search and filter usage
- Match, engine, league, Community and share interactions
- Push opt-in and account-sync events
- Client error reporting without stack traces or personal details
- Real-user Core Web Vitals: LCP, INP, CLS and FCP
- Admin Analytics dashboard with 7-, 30- and 90-day views
- Product funnel
- Device mix
- Top pages and top feature events
- Top match/league/engine entities
- CSV export
- 13-month retention cleanup control
- Supabase RLS and validated RPC ingestion

## Install website files

1. Extract `Predict2U_Analytics_Intelligence_v186_CHANGED_FILES.zip`.
2. Copy everything into the current `golden-banker-v2` repository.
3. Replace matching files.
4. Commit:

   `Install Predict2U v186 Analytics and Product Intelligence`

5. Push to GitHub.
6. Allow Predict2U Site Quality to run.
7. Hard-refresh the live site once.

## Required Supabase setup

Run `SUPABASE_ANALYTICS_v186.sql` in the same Supabase project already used by Accounts, Backend Admin and Push Notifications.

The script creates:

- `p2u_analytics_events`
- `p2u_ingest_analytics_events(jsonb)`
- `p2u_admin_analytics_overview(integer)`
- `p2u_admin_analytics_purge(timestamptz)`

No service-role key is added to the browser.

## Open the dashboard

After deployment and SQL setup:

1. Sign in as Owner, Admin or Moderator.
2. Open `https://predict2u.com/admin.html#analytics`.
3. Choose 7, 30 or 90 days.

The dashboard will remain empty until visitors allow analytics and begin using the site.

## Privacy behavior

- Analytics is off until the visitor chooses **Allow analytics**.
- Global Privacy Control and Do Not Track disable analytics automatically.
- Visitors can change the choice using the small **Privacy** button or the Account Center.
- Events contain a temporary anonymous session ID, coarse device class and viewport bucket.
- Raw IP addresses, exact user agents, advertising IDs, emails and payment information are not written to the analytics table.

## Retention

The Admin Analytics tab includes a control to remove events older than 13 months. The SQL function refuses deletion cutoffs newer than 90 days.

## Performance

The analytics client is a small deferred script, batches events, sends at most 40 events per request, retries quietly, and never blocks page rendering.

## Service worker

Cache version: `predict2u-v186`
