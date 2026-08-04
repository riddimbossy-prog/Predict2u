# Predict2U v276 — Installation

1. Copy every file from the v276 patch into the repository root and replace matching files.
2. Commit and push:

```powershell
git add -A
git commit -m "Fix Predict2U generated data size limit v276"
git push origin main
```

3. Start a **new** run from:

```text
Actions → Predict2U Fast All Games → Run workflow
```

Do not use **Re-run jobs** on run #879 because that run used the old compactor from the commit that started it.

No Supabase SQL and no new secret are required.
