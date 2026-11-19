# MONARO8 site tools

The site is plain static HTML on Vercel. There is no build step on Vercel: you run the build here and commit the output.

## Everyday edits

| To change | Edit | Then |
|---|---|---|
| A venture (name, stage, copy, link, waypoint) | `data/ventures.json` | `node tools/build.mjs` |
| Add a venture | add an entry to `data/ventures.json`, then `node tools/capture-ventures.mjs <id>` | `node tools/build.mjs` |
| Studio Ledger | add a line at the top of `data/ledger.json`, bump `updated` | `node tools/build.mjs` |
| On the bench (ideas pipeline) | `data/pipeline.json`; set `"show": true` to put it on the home page | `node tools/build.mjs` |
| How we work / Advisory / Contact copy | `pages/thesis.html`, `pages/advisory.html`, `pages/contact.html` | `node tools/build.mjs` |
| Home and Ventures copy | the templates in `build.mjs` | `node tools/build.mjs` |
| Styles, behaviour, terrain | `../styles.css`, `../script.js`, `../terrain.js` | nothing to build |

`build.mjs` counts commits in the local venture repos listed under `repo` in `ventures.json` and caches them in `data/stats.json`. Run with `--no-git` to reuse the cache.

Don't edit the generated files directly (`index.html`, `ventures/`, `thesis/`, `advisory/`, `contact/`, `llms.txt`, `sitemap.xml`): the next build overwrites them.

## Occasional jobs

- **Refresh venture screenshots:** `node tools/capture-ventures.mjs` (or one id). Needs `npm install` in `tools/` once.
- **Share images:** serve the repo (`python3 -m http.server 8787` from the root), then `node tools/og.mjs`. Writes `og/*.png`.
- **Terrain data:** `node tools/build-dem.mjs <tile-dir> ../assets/terrain` rebuilds the DEM, metadata and contours from AWS Terrain Tiles (zoom 12, x 3741–3745, y 2489–2492). To use ELVIS LiDAR, add a `glb` entry to `assets/terrain/cooma-dem.json` (see the top of `terrain.js`).

## Preview

From the repo root: `python3 -m http.server 8787`, then open http://127.0.0.1:8787.
