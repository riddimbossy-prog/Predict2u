# Predict2U v201 — News Comment Social Actions

## What this release adds

- Like and unlike News comments
- Visible like totals on each comment
- Targeted push alerts to the comment owner when another member likes the comment
- Owner-only comment editing
- Owner-only comment deletion
- Edited labels on updated comments
- Soft deletion so moderation and report history stay intact
- Direct links from like notifications to the exact story and comment
- Mobile, tablet, desktop and Z Fold layouts

## Trust and safety rules

- Users cannot like their own comments
- Only the comment owner can edit or delete a comment
- Editing keeps the existing length, spam and repeated-character checks
- Deleted comments are hidden from the discussion and removed from the story comment total
- Likes are unique per user and comment
- Liker IDs are not exposed publicly by the browser query

## Installation

1. Extract `Predict2U_Comment_Social_v201_CHANGED_FILES.zip` into the root of `predict2u-my-banker-v2`.
2. Replace files when prompted.
3. Commit and push the repository changes.
4. Open Supabase → SQL Editor → New query.
5. Run the complete contents of `SUPABASE_NEWS_COMMENT_SOCIAL_v201.sql`.
6. Hard-refresh `news.html`.

Suggested commit message:

`Install Predict2U v201 News comment social actions`

## Files changed

- `BUILD_VERSION.txt`
- `news.html`
- `news.css`
- `news-comments-v201.css`
- `news.js`
- `news-app-v201.js`
- `sw.js`
- `SUPABASE_RELIABILITY_COMMENTS_v198.sql` — corrected source copy
- `SUPABASE_NEWS_COMMENT_SOCIAL_v201.sql`
- `news-comment-social-selftest.js`

## Database objects

The migration adds:

- `p2u_news_comment_likes`
- `p2u_news_edit_comment`
- `p2u_news_delete_comment`
- `p2u_news_toggle_comment_like`
- `p2u_news_update_comment_like_count`
- `p2u_news_notify_comment_like`

It also adds these columns to `p2u_news_comments`:

- `like_count`
- `edited_at`
- `deleted_at`

## Like notifications

When a member likes another user’s comment, the database queues a targeted job in the existing `p2u_push_jobs` table. The current `p2u-push-dispatch` function sends it only to that comment owner’s registered devices.

No new Edge Function, VAPID key, GitHub secret or workflow is required.

## Test checklist

1. Sign in as User A and post a comment.
2. Sign in as User B and like User A’s comment.
3. Confirm the heart becomes active and the count increases.
4. Confirm User A receives a notification after the push dispatcher runs.
5. Sign back in as User A and edit the comment.
6. Confirm the updated text shows an `Edited` label.
7. Delete the comment.
8. Confirm it disappears and the story comment count decreases.

## Cache version

`predict2u-v201`
