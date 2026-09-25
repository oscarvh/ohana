# AGENTS.md

## Project
Static songbook ("Cancionero") for the Orquesta Escuela de Punta Indio. Eleventy v3 (CommonJS `.eleventy.js`), Spanish-language content and UI. Deployed to GitHub Pages at https://oscarvh.github.io/ohana/ (repo `oscarvh/ohana`, branch `main`, Pages source = GitHub Actions). Sveltia CMS admin lives in `src/admin/`.

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

## Spec vs. reality
`ohana-especificaciones.md` is the full intended design. Implemented: `src/admin/` (Sveltia CMS `index.html` + `config.yml`, passed through to `/admin/`), `.github/workflows/deploy.yml`, git repo on `main` pushed to `oscarvh/ohana`, and Pages enabled (source = GitHub Actions). Still pending:
- `src/admin/config.yml` needs `base_url` set once the `sveltia-cms-auth` Cloudflare Worker exists; until then the CMS login does not work in production.
- `src/css/style.css` is a placeholder; `src/images/` holds `logo-ohana.png` and is passed through to `/images` for CMS media.
