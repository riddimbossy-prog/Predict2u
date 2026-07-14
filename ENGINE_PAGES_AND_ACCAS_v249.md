# Predict2U v249 — Branded Engine Pages + Engine Accas

## Branded engine pages

Every engine in `all-engines.html` now opens `engine.html?engine=<key>`. The page changes its accent, name, family, version, description and picks for the selected engine. It shows the engine’s daily qualified picks and a top-three mini-acca.

## Today’s engine accas

`bankers.html` now starts with a dedicated Engine Accas section. Each active engine receives up to three of its own highest-ranked qualified selections. Banker outputs are ranked first. When fewer than two or three selections pass, no filler is invented.

## Navigation behavior

Active engine cards and individual engine pills now open the branded engine page instead of filtering an unbranded shared page.

## New files

- `engine.html`
- `engine-experience-v249.js`
- `engine-page-v249.js`
- `engine-page-v249.css`
- `engine-bankers-v249.js`
- `engine-bankers-v249.css`

## Existing files updated

- `all-engines.html`
- `bankers.html`
- `board.html`
- `sw.js`
- `BUILD_VERSION.txt`
