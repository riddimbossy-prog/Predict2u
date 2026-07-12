# Predict2U v191 — Transfer Desk Art + Real Story Images

## What changed

- Replaced the previous Transfer Desk shield/logo artwork with the new cinematic Predict2U Transfer Desk banner.
- Added optimized hero and thumbnail WebP files using the same filenames already used by the News page.
- Upgraded `p2u-news-sync` to collect real publisher story images from:
  - RSS/Atom enclosures
  - `media:content` and `media:thumbnail`
  - feed HTML image and `srcset` fields
  - article Open Graph metadata such as `og:image`
  - Twitter card metadata such as `twitter:image`
  - `image_src` and supported structured-data image fields
- Existing articles are updated on the next sync, so stories already stored without an image can receive one.
- Added bounded concurrency, request timeouts, HTML size limits and private-network URL protection.
- Added resilient image rendering: a publisher image appears when available; the Predict2U Transfer Desk or football fallback remains underneath if the remote image fails.
- Kept publisher attribution and the original-source link on every story.

## Repository installation

1. Extract `Predict2U_Real_Story_Images_v191_CHANGED_FILES.zip`.
2. Copy everything into the root of `golden-banker-v2`.
3. Choose **Replace files in destination**.
4. Commit and push with:

```text
Install Predict2U v191 real story images
```

5. Hard-refresh the live News page after deployment.

## Required Edge Function redeploy

Redeploy the updated file under the existing function name:

```text
p2u-news-sync
```

Source file:

```text
supabase/functions/p2u-news-sync/index.ts
```

Do not delete the existing function. Deploy a new version of it.

## Populate images

After redeploying the function, run:

```text
GitHub → Actions → Predict2U Football News Sync → Run workflow
```

The next successful sync updates current stories and future stories with publisher images when those publishers expose usable image metadata.

## Setup impact

No new SQL, database table, GitHub secret, Supabase secret, VAPID key or push-function change is required.

Some publishers do not expose a usable image or may block remote loading. Those stories intentionally keep the branded fallback instead of showing a broken image.

## Version

- Build: `v191`
- Service-worker cache: `predict2u-v191`
