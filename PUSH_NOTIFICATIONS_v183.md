# Predict2U v183 — Real Push Notifications

v183 adds permission-based Web Push delivery for signed-in Predict2U accounts. It works with the existing v168 Smart Alerts inbox, v180 cloud accounts and v181/v182 backend admin.

## Included

- Background browser notifications while Predict2U is closed
- Signed-in device registration and removal
- Cloud-synced push preferences
- Board-published notifications
- Favorite league and favorite engine match-status notifications
- Community verification and followed-user notifications
- Admin announcements and targeted test notifications
- Quiet hours using each device's local time offset
- Duplicate-resistant queued jobs
- Delivery metrics, failures and expired-subscription cleanup
- Supabase RLS, protected RPCs and permanent delivery logs
- GitHub Actions bridge for live match-status changes

## Install the repository files

Copy the v183 changed-files package into the current repository, replace matching files, commit and push.

Suggested commit:

`Install Predict2U v183 Real Push Notifications`

## 1. Run the SQL

In the same Supabase project used by v180 and v181, run:

`SUPABASE_PUSH_SETUP_v183.sql`

It creates:

- `p2u_push_public_config`
- `p2u_push_subscriptions`
- `p2u_push_preferences`
- `p2u_push_jobs`
- `p2u_push_delivery_log`

It also adds protected RPCs, board/announcement triggers, Community verification triggers and an optional trigger for new public `slips` records when that table exists.

## 2. Generate VAPID keys

Open `VAPID_KEY_GENERATOR_v183.html` in a browser and press **Generate new keys**.

Keep these values:

- Public key
- Private key
- Dispatch secret

The generator runs locally in the browser. It does not upload or save the keys.

## 3. Deploy the Supabase Edge Function

Create an Edge Function named:

`p2u-push-dispatch`

Use the code from:

`supabase/functions/p2u-push-dispatch/index.ts`

Deploy with JWT verification enabled.

Add these Edge Function secrets:

- `VAPID_PUBLIC_KEY` — generated public key
- `VAPID_PRIVATE_KEY` — generated private key
- `VAPID_SUBJECT` — `mailto:predict2u@gmail.com`
- `PUSH_DISPATCH_SECRET` — generated dispatch secret

Supabase normally provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Confirm they are available in the function environment.

Never place the VAPID private key, service-role key or dispatch secret in browser JavaScript or GitHub files.

## 4. Activate the public key

Sign in as Owner and open:

`https://predict2u.com/admin.html#push`

In **Push → Delivery configuration**:

1. Paste only the VAPID public key.
2. Turn on **Enable device registration**.
3. Save the public key.

## 5. Add GitHub repository secrets

In GitHub:

`Settings → Secrets and variables → Actions`

Add:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PUSH_DISPATCH_SECRET`

The live-scores workflow uses these secrets to queue meaningful status changes and dispatch pending or scheduled notifications. The service-role key remains inside GitHub Actions secrets and is never committed.

## 6. Enable a device

On a signed-in phone or desktop browser, open:

`https://predict2u.com/account.html`

Under **Push notifications**:

1. Choose categories and quiet hours.
2. Press **Enable on this device**.
3. Allow notifications when the browser asks.

Each browser or installed PWA is registered as a separate device.

## 7. Test delivery

Open Backend Admin → Push and press **Test my devices**. The current admin account must have at least one enabled device.

The Push dashboard shows active devices, pending jobs, delivered messages and failures.

## Platform notes

- Android Chrome, desktop Chromium browsers and installed PWAs support Web Push.
- On iPhone/iPad, web push requires a supported iOS version and typically an installed Home Screen web app.
- Users must grant notification permission; Predict2U never bypasses browser permission controls.
- Quiet hours and category preferences are checked by the Edge Function before delivery.
- Smart Alerts remains the in-app notification center when the site is open.

## Rollback

Rolling back the public files does not delete subscriptions or logs. Disable `p2u_push_public_config.enabled` or use the Admin Push panel to stop new device registrations. Existing jobs can be marked cancelled directly in Supabase if required.
