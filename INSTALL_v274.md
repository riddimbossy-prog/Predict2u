# Predict2U v274 — GitHub Checkout Timeout Hotfix

## What the screenshot proves

The fixture job did not reach the API step. It spent the full 30-minute job limit inside **Checkout repository** and GitHub cancelled it.

The v273 snapshot workflow used `fetch-depth: 0`, which tells `actions/checkout` to download the repository's complete history, every branch and every tag. Predict2U has many generated-data commits, so that full-history fetch can exceed the 30-minute workflow timeout.

## Install

1. Copy the contents of this patch into the root of the `Predict2u` repository.
2. Allow the `.github/workflows` files to replace the existing copies.
3. Commit and push the changes.
4. Open **GitHub → Actions → Predict2U Fast Fixture Snapshot**.
5. Choose **Run workflow**. Do not use **Re-run jobs** on the old cancelled run, because that old run uses the workflow file from the old commit.

## Expected result

- `Checkout repository` should complete quickly instead of downloading all Git history.
- The job should continue to `Set up Node`, `Pull every fixture by date safely`, `Verify fixture snapshot`, and `Commit fixture feed`.
- The future date cards will populate after the generated `fixtures.js` commit reaches the repository and the site refreshes.

No API secret names, site UI, prediction engines or match rules were changed.
