# Predict2U v249 Full Build

This repository contains 615 files and includes the complete v248 build plus the v249 engine experience.

## v249 additions

- Every engine card opens a branded engine page at `engine.html?engine=<engine-key>`.
- Each engine page displays that engine's name, family, version, visual identity and qualified daily picks.
- Each engine page builds its own top-three mini-acca from real qualified outputs.
- `bankers.html` shows a separate mini-acca for every active engine, using up to three top picks per engine.
- Banker outputs rank first; no filler selection is invented when fewer picks qualify.
- Active-engine cards and individual engine pills open the branded page.
- The v247 separated fixture feed and v248 generated-file conflict protection remain included.

## Deployment

Upload the contents of this folder to the root of the GitHub repository. Preserve the `.github` directory and existing GitHub Secrets.

After deployment, run **Predict2U Fast Fixture Snapshot** once, then run **Predict2U Fast All Games**.
