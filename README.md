# FARQIAYH · Game Awards 2025

An Arabic, right-to-left awards ceremony with nominations, winner reveals,
honorable mentions and a final winners summary.

## Build

Requires Node.js 22 or newer.

```sh
npm ci
npm run check
```

The deployable site is generated in `dist/`. Serve that directory with a static
HTTP server. GitHub Pages is currently configured to publish the repository
root, so run `npm run publish:root` after source changes and commit the generated
root `index.html`, `assets/`, font license, favicon and `.nojekyll` file. The HTML
build template is `src/index.template.html`.

## Source

- `src/App.jsx`: welcome screen and application shell.
- `src/Awards.jsx`: nominations, reveals, honorable mentions and summary.
- `src/styles.css`: responsive dark-and-gold theme and motion preferences.
- `src/data.js`: original ballots, normalization and ranking rules.
- `src/categories.js`: category order, titles and icons.
- `src/ceremony.js`: navigation and reveal state.

Vote totals are computed at build time. Only display data is included in the
deferred ceremony bundle. Original ballots, results, ties, the fifth-place
nomination cutoff and the custom multiplayer ranking rule are covered by the
regression fixture captured from commit `1a64292`. Intentional changes to votes
or ranking rules should include a reviewed fixture update.

## Loading and accessibility

The welcome screen is prerendered as HTML and hydrated with React 18. JavaScript
and CSS are compiled, minified and content-hashed; no browser-side Babel,
Tailwind CDN, external JavaScript, GIF background or full-screen blur is needed.
The Arabic variable font is self-hosted with preload and font-display: swap.
The awards code loads on demand, with a loading state and retry guidance.

Layouts use natural page scrolling, explicit text direction for game names,
visible keyboard focus, a skip link and native buttons. Winner celebrations stop
after 2.4 seconds and honor reduced-motion preferences.

## GitHub Pages

Pull requests build and verify the static output. Merging into `main` uses the
existing GitHub Pages deployment destination and publishes only `dist/`.
All asset paths are relative so the site works under `/farqiayh/`.

The build checker verifies asset references, JavaScript syntax, prerendered HTML
and these uncompressed budgets: initial JavaScript <180 kB, all JavaScript
<215 kB, CSS <25 kB. It also reports gzip sizes; these are bundle measurements,
not Lighthouse scores or measured network load times.

The verified production build uses 49.9 kB of initial JavaScript (gzip), 4.3 kB
of CSS (gzip), 4.7 kB of prerendered HTML and a 166 kB WOFF2 Arabic font. The
on-demand awards chunk adds about 4.4 kB of JavaScript (gzip).

Before release, visually review the welcome, nomination, reveal, tied winner,
honorable mention and summary screens at desktop and mobile widths, with
keyboard navigation, 200% text enlargement and reduced motion.
