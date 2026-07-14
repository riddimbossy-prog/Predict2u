# Predict2U v180 — Accounts, Cloud Sync & Follow System

## What is included

- Passwordless email sign-in using the existing Supabase Community project.
- A dedicated `account.html` account center.
- A public `profile.html` view for Community members.
- Cloud sync for Personalization preferences, Smart Alert settings and the unfinished slip.
- Follow/unfollow persistence across signed-in devices.
- Saved account slip history from the existing `slips` table.
- Data export and account-deletion request controls.
- Local-first fallback when offline or when the cloud schema has not yet been installed.
- Mobile, tablet and Z Fold layouts.

## Required one-time Supabase setup

Open Supabase → SQL Editor and run `SUPABASE_CLOUD_SETUP_v180.sql` once. It creates only three new tables:

- `p2u_cloud_state`
- `p2u_follows`
- `p2u_account_deletion_requests`

All tables use Row Level Security. The browser contains only a public publishable key. Never add a service-role key to `cloud-config.js`.

## Authentication setup

In Supabase → Authentication → URL Configuration:

- Site URL: `https://predict2u.com`
- Add redirect URL: `https://predict2u.com/account.html`

Email OTP/magic-link authentication must be enabled.

## Sync behavior

- Existing local settings are preserved.
- On first sign-in, the newer copy wins between the device and cloud.
- Later changes are pushed after a short debounce.
- Alert history is kept local; only alert settings sync.
- No bookmaker credentials, payment data or notification stake/payout details are stored.

## Install

Copy the changed-files package over the current repository, commit, and push. Then run the SQL setup and hard-refresh once.
