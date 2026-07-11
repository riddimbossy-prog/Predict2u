# Predict2U Workflow Fix v159

## Failure shown in GitHub Actions

The Site Quality job stopped inside `actions/setup-node@v4` with:

```text
Dependencies lock file is not found.
Supported file patterns: package-lock.json, npm-shrinkwrap.json, yarn.lock
```

## Cause

The workflow enabled:

```yaml
cache: npm
```

`setup-node` requires a dependency lock file before it can prepare the npm cache. The repository currently has `package.json` but no `package-lock.json`, so the action failed before the install and browser tests began.

## Fix applied

- Removed `cache: npm` from `actions/setup-node`.
- Added a preflight check for `package.json`, `playwright.config.js`, and the mobile test file.
- Changed the install command to:

```bash
npm install --no-audit --no-fund --package-lock=false
```

- Added `if-no-files-found: ignore` to the failure-artifact upload, preventing a secondary warning when a job fails before reports exist.

## Deployment

Replace:

```text
.github/workflows/site-quality.yml
package.json
```

Then commit and re-run **Predict2U Site Quality**.

No website data update and no service-worker refresh are required because this patch changes only the CI workflow and test package metadata.
