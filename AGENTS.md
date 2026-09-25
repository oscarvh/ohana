# AGENTS.md

## Project
Static songbook ("Cancionero") for the Orquesta Escuela de Punta Indio. Eleventy v3 (CommonJS `.eleventy.js`), Spanish-language content and UI. Deployed to GitHub Pages at https://oscarvh.github.io/ohana/ (repo `oscarvh/ohana`, branch `main`, Pages source = GitHub Actions).

## Mini-CMS (/editar)
Non-technical editors (a teacher) manage songs at `/ohana/editar/` with plain username/password — no GitHub account involved. The page (`src/editar/index.html`, passed through) is a vanilla JS SPA that talks to the Cloudflare Worker **ohana-cms-api** (source in `~/proyectos/ohana-cms-api`, deploys with wrangler; URL `https://ohana-cms-api.oscarvh.workers.dev`). The worker authenticates the editor (secrets `ADMIN_USER`/`ADMIN_PASSWORD`, HMAC session tokens signed with `SESSION_SECRET`) and commits song changes to `oscarvh/ohana` via the GitHub API using secret `GH_TOKEN` (a `gho_` token from `gh auth`). Every save/delete is a normal commit on `main`, which triggers the Pages deploy (~1 min). Song file format written by the worker must match the frontmatter contract in "Gotchas" below (JSON-quoted strings via `JSON.stringify`, `orden` as bare int). Sveltia CMS was removed (2026-09): no `src/admin/`, no `sveltia-cms-auth` worker, no GitHub OAuth app.

## Environment gotcha (Windows)
This repo lives in WSL and is opened from Windows over a UNC path. `npm run ...` fails there because cmd.exe rejects UNC paths. Run Node commands inside WSL instead:
```
wsl -d Ubuntu-24.04 bash -lc "cd ~/proyectos/ohana && npm run build"
```

The dev port must be free on the **Windows** side too, not just inside WSL: Windows `localhost` wins over the WSL forward. SearXNG holds 8080 and Wondershare `WsToastNotification.exe` holds 8090 (returns HTTP 501). Check with `Get-NetTCPConnection -State Listen` on Windows before picking a port; the `dev` script pins `--port=8765`.

## Commands
- `npm install`
- `npm run dev` — Eleventy dev server at http://localhost:8765/ohana/ (ports 8080/8090 are taken by other programs on this machine; the script pins `--port=8765`)
- `npm run build` — writes `_site/`
- No test, lint, typecheck, or format scripts exist.

## Gotchas
- `pathPrefix: "/ohana/"` (`.eleventy.js:13`). Every internal link must use the `| url` filter (e.g. `{{ '/' | url }}`); hardcoded `/...` hrefs break on GitHub Pages. Note: collection item `url` (e.g. `cancion.url`) does NOT include the prefix — always write `{{ cancion.url | url }}`.
- Tailwind v4 is loaded from the browser CDN in `src/_includes/layouts/base.njk`. No build step, no `tailwind.config.js` — don't add one.
- Design tokens (colors, fonts, text sizes, spacing) live in the `@theme { ... }` block inside `base.njk` (the Stitch "Cancionero Ohana" design system). Headings use `font-serif` (Playfair Display), body `font-sans` (Plus Jakarta Sans); icons are Material Symbols Outlined. Use the token-based utilities (`bg-surface-container-lowest`, `text-headline-md`, `p-space-md`, ...) rather than arbitrary values.
- Routes: `/` is the welcome splash (`src/index.njk`, sets `hideNav: true`), `/canciones/` is the list (`src/canciones.njk`), `/canciones/<slug>/` is a song detail. Nav/back links target `/canciones/`, not `/`.
- Songs are one Markdown file per song in `src/content/canciones/`. Frontmatter: `titulo`, `autor`, `categoria`, `orden` (last three optional). The lyric body is exposed to templates as `content`, not as a frontmatter field.
- `src/content/canciones/canciones.json` is the directory data file: sets `layout: layouts/cancion.njk`, `tags: canciones`, and `permalink: /canciones/{{ titulo | slugify }}/`.
- The `canciones` collection (`.eleventy.js:6`) sorts by `orden`, defaulting missing values to `999`.
- `_site/` is generated output; never edit it by hand.
- `src/editar/index.html` and `src/compartir.njk` each carry their own copy of the `@theme` block — when changing design tokens, update `base.njk`, `editar/index.html` and (for compartir) keep it in sync. The `/editar/` page talks to the worker at a hardcoded `API` const in its inline script.
- `atril.js` is referenced with a manual cache-buster (`?v=3` in `cancion.njk`) because GitHub Pages caches assets for 10 min. Bump the version whenever `atril.js` changes, or users may get stale JS.
- Fullscreen reading mode: clicking "Pantalla completa" requests fullscreen AND toggles class `modo-letra` on `<html>`/`<body>`; plain CSS in `cancion.njk` (`.modo-letra` + `:fullscreen` selectors) hides header, `#nav-inferior` and `#info-cancion`. On browsers without the Fullscreen API (iPhone) it degrades to a wake-lock-only reading mode. Letter size steps live in `atril.js` (`sizes`/`lines`, max 2.4rem).
- QR in `src/images/qr-ohana.png` is a static pre-generated image (QRCode npm pkg, teal `#00565a` on cream `#fbf9f5`). If the site URL ever changes, regenerate it; the displayed URL is also hardcoded in `compartir.njk` (ENLACE const).

## Pendientes / seguridad (2026-09-25)
- Secrets exposed in chat during the session — rotate when convenient: the `gho_` GitHub token (`gh auth token`, used by the worker as `GH_TOKEN`), the `ADMIN_PASSWORD`, and delete the GitHub OAuth app "Cancionero Ohana CMS" (https://github.com/settings/developers) plus any leftover fine-grained/classic PATs in https://github.com/settings/tokens.
- A stray Cloudflare Worker named **ohana** (static-assets deploy of the repo, ohana.oscarvh.workers.dev) is unused — candidate for deletion.
- `~/proyectos/sveltia-cms-auth` local clone is dead code (worker deleted) — can be removed.
- Helper scripts deleted from `~/proyectos/ohana-cms-api` because they contained the admin password; recreate them via the /editar UI or env-var-free methods if needed.
- Dev server may still be running in WSL on port 8765 (check `ss -tlnp | grep 8765` inside WSL).

## Spec vs. reality
`ohana-especificaciones.md` is the full intended design. Implemented: the ohana-cms-api Worker + `/editar/` mini-CMS (see above), `.github/workflows/deploy.yml`, git repo on `main` pushed to `oscarvh/ohana`, and Pages enabled (source = GitHub Actions). Still pending:
- `src/css/style.css` is a placeholder; `src/images/` holds `logo-ohana.png` and `qr-ohana.png` and is passed through to `/images`.
