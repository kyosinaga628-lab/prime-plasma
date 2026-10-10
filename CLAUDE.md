# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"SEISMIC JP" (repo/README name: Sismic JP) is a static, client-only web app that visualizes earthquake activity around Japan as a time-series animation on a Leaflet map, with magnitude-based circle sizing/coloring and generated audio feedback. There is no build step, bundler, or backend — `index.html` loads Leaflet, Driver.js, `css/style.css`, and `js/*.js` directly via CDN `<script>`/`<link>` tags, and JS fetches static JSON files under `data/` at runtime.

Live site (production, Vercel — auto-deploys on push to `main`): https://prime-plasma.vercel.app/
The old GitHub Pages URL (kyosinaga628-lab.github.io/prime-plasma/) is no longer the canonical site; all canonical/OGP/sitemap URLs point to Vercel.

## Commands

There is no package.json, build tool, linter, or test suite in this repo — it's plain HTML/CSS/JS served as static files.

**Run locally:**
```bash
python -m http.server 8080
# open http://localhost:8080
```

**Fetch/refresh earthquake data** (requires `pip install requests`):
```bash
python scripts/fetch_data.py           # last 1 year -> data/earthquakes.json
python scripts/fetch_1month_data.py    # last 1 month -> data/earthquakes_1month.json
python scripts/fetch_current_year.py   # Jan 1 of current year -> now -> data/earthquakes_<year>.json
python scripts/fetch_archive_data.py   # full backfill, 2011 -> current year, one file per year (data/earthquakes_<year>.json); sleeps 2s between requests for USGS rate limits
```
There is no way to "test" changes other than reloading the page in a browser and watching the map/console; there is no CI test job.

## Data pipeline & automation

- Data source: USGS Earthquake API (`https://earthquake.usgs.gov/fdsnws/event/1/query`), filtered to a Japan bounding box (~lat 20–50N, lon 120–155E) and `minmagnitude=2.5`.
- `.github/workflows/update-data.yml` runs daily at 00:00 UTC (09:00 JST) via `workflow_dispatch`/cron: it runs `fetch_data.py`, `fetch_1month_data.py`, and `fetch_current_year.py`, then commits `data/earthquakes*.json` back to `main` with `[skip ci]` if anything changed. `fetch_archive_data.py` is a one-off/manual backfill script, not run by CI.
- `data/earthquakes_<year>.json` files exist per year from 2011 to the current year; `data/earthquakes.json` is the rolling "last 1 year" view; `data/earthquakes_1month.json` is the rolling "last 1 month" view. These are large (multi-MB) generated GeoJSON `FeatureCollection`s — don't hand-edit them.
- `data/plates.geojson` and `data/active_faults.geojson` are present (added for future plate-boundary/fault-line overlays) but are **not currently referenced** by any JS/CSS/HTML — there is no rendering code for them yet.
- `ARCHIVE_START_YEAR` in [js/app.js](js/app.js) (currently `2011`) must stay in sync with the start year hardcoded in `scripts/fetch_archive_data.py`.

## Front-end architecture

Everything client-side lives in three files that all load on every page view:

- **[index.html](index.html)** — static shell: header/stats/info-panel overlay, an empty `#year-tabs-scroll` container (tabs are generated at runtime, not hardcoded), the timeline/playback control bar, the legend, and the loading overlay. Heavy on SEO/Open Graph/JSON-LD meta tags — preserve these if editing `<head>`.
- **[js/app.js](js/app.js)** — all app logic, single `DOMContentLoaded` closure with a plain-object `state` (data array, start/end/current time, play state, current year, playback speed). Key flows:
  - **Map setup**: base layer = Esri "World_Light_Gray_Base" tiles (no API key needed — this replaced CARTO Positron, which started requiring a key and watermarking tiles), an optional GSI relief (陰影起伏図) overlay toggled by the user, and an Esri label reference layer on top. Layer z-index ordering matters (base=1, relief=2, labels=3).
  - **Year tabs**: `buildYearTabs()` generates tabs at runtime — "直近1か月" (1month), "直近1年" (latest), then one tab per year from the current year down to `ARCHIVE_START_YEAR` — instead of hardcoding them in HTML, so a new year appears automatically. `dropUnavailableYearTab()` does a `HEAD` request for the current year's file and removes its tab if the data doesn't exist yet (e.g. early January before the first CI run of the year).
  - **Data loading**: `getDataUrl(year)` maps a tab's year key (`'latest'`, `'1month'`, or a year string) to a `data/earthquakes*.json` path; `loadYear()` fetches and swaps in new data, clearing markers and showing `#loading-overlay` during the fetch.
  - **Animation loop**: `requestAnimationFrame`-driven `animate()` advances `state.currentTime` at a rate derived from a fixed base duration (90s to play a full year at 1x) divided by `playbackSpeed` (0.5x/1x/2x/4x buttons), looping back to `startTime` at the end. `triggerEvents()` walks `state.data` (pre-sorted by time) via `state.eventIndex` and calls `spawnEvent()` for anything newly in range.
  - **Marker rendering**: `spawnEvent()` creates a short-lived (2s) pulsing `L.divIcon` marker sized by `Math.pow(1.8, mag) * 3` and colored by `getMagColor()` (cyan <5, orange 5–6, red 6+), then removes it via `setTimeout`. Markers are NOT persistent — the map only shows recent/animating events, not a cumulative view.
  - **Audio**: Web Audio API oscillator per event (`playSound()`), pitch/volume/duration all derived from magnitude; `AudioContext` is created lazily on first user interaction (`togglePlay` → `initAudio()`) to satisfy browser autoplay policies.
- **[js/tutorial.js](js/tutorial.js)** — Driver.js-based onboarding tour (`window.startTutorial`/`window.checkFirstVisit`), attached to DOM elements by CSS selector/id. If you rename/restructure an element referenced in the tutorial steps (`.header-overlay`, `#map`, `.year-tabs-overlay`, `.controls-overlay`, `.stats-container`, `#relief-toggle`, `#tutorial-toggle`), update the matching step here too. First-visit state is tracked via `localStorage['seismic_tutorial_seen']`.
- **[css/style.css](css/style.css)** — all UI is `position`-based `.ui-overlay` panels floating over the full-bleed `#map`; responsive breakpoints are handled with `@media` blocks near the bottom of the file (tablet, small-laptop, mobile, small-mobile, and a coarse-pointer touch adjustment), plus overrides for Driver.js's own `.driver-popover*` classes to match the app's dark theme.
  - **Overlay stacking**: `.year-tabs-overlay` sits at the top-center and `.header-overlay` is pushed down below it (`top` = 92px desktop / 86px tablet / 70px ≤768px / 58px ≤480px). If you change the tab bar's height or padding, re-check that the two panels don't overlap at every breakpoint.

## Conventions to preserve

- UI copy and code comments are primarily Japanese; keep new user-facing strings and comments consistent with that (README is bilingual EN/JA).
- No frameworks/bundlers are introduced — this is intentionally a no-build static site. Third-party libs (Leaflet, Driver.js) are pulled from CDNs in `index.html`, not installed via npm.
- Data files under `data/` are generated artifacts (fetched from USGS) — treat them as build output, not source to hand-edit, and regenerate via the `scripts/fetch_*.py` scripts instead.

## SEO & sharing assets

- `<head>` in [index.html](index.html) carries title/description, canonical, Open Graph (incl. `og:image:width/height/alt`), Twitter card, and JSON-LD — all with absolute `https://prime-plasma.vercel.app/` URLs. Keep them in sync when renaming or changing the domain.
- Copy describes the data as **daily-updated** (毎日更新), not "real-time" — the data refreshes once a day via CI, so don't reintroduce リアルタイム wording.
- [images/og-image.png](images/og-image.png) is a designed 1200×630 graphic (not a screenshot). Its title was hand-corrected from a "SISMIC" typo to "SEISMIC JP" using the Outfit font; if you regenerate it, double-check the spelling and keep it under ~400KB (it is a 256-color PNG).
- `robots.txt`, `sitemap.xml` (single URL, update `<lastmod>` on major changes), and `google70a12f1405272d9f.html` (Google Search Console verification — do not delete) live at the repo root.
- The info panel links to the sister site SEISMIC WORLD (https://prime-plasma-world-1yze.vercel.app/) and the hub site enepen (https://enepen.vercel.app/). External links use `target="_blank" rel="noopener"`.
