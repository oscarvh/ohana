# ohana — Cancionero de la Orquesta Escuela de Punta Indio

Especificación técnica del proyecto para desarrollo asistido con OpenCode.
Pegar este archivo como contexto/instrucciones al agente antes de pedirle que arranque.

---

## 1. Objetivo

Sitio web donde la directora de la orquesta sube, edita y borra letras de canciones desde un panel simple, y los padres las consultan (sin login) para poder cantar junto a la orquesta.

## 2. Alcance v1 (MVP)

**Incluido:**
- Listado de canciones (título + autor) en la home.
- Página de detalle por canción con la letra completa.
- Buscador simple por título (client-side, sin backend).
- Panel de administración (Sveltia CMS) para crear, editar y borrar canciones.
- Deploy automático a GitHub Pages en cada cambio.

**Fuera de alcance v1** (para después si hace falta):
- Multi-usuario con roles distintos.
- Categorías/filtros avanzados.
- Modo offline / PWA.
- Audio o video embebido.

## 3. Stack técnico

| Capa | Herramienta |
|---|---|
| Generador de sitio estático | Eleventy (11ty) v3 |
| Panel de administración | Sveltia CMS (vía CDN, sin build propio) |
| Repositorio / control de versiones | GitHub |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |
| Autenticación del panel (producción) | OAuth vía Cloudflare Worker (sveltia-cms-auth) |
| Autenticación del panel (desarrollo local) | Repositorio Git local — Sveltia CMS puede editar un repo local directamente desde el navegador, sin proxy ni configuración extra |

## 4. Estructura de carpetas del repo

```
ohana/
├── src/
│   ├── _includes/
│   │   └── layouts/
│   │       ├── base.njk
│   │       └── cancion.njk
│   ├── content/
│   │   └── canciones/
│   │       ├── canciones.json        # metadata compartida (layout, permalink)
│   │       └── ejemplo-cancion.md    # una canción de prueba
│   ├── admin/
│   │   ├── index.html                # entrypoint de Sveltia CMS
│   │   └── config.yml                # definición de la colección "canciones"
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── buscador.js
│   └── index.njk                     # listado / home
├── .eleventy.js
├── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml
└── README.md
```

## 5. Modelo de contenido

Cada canción es un archivo Markdown en `src/content/canciones/`, con este frontmatter:

```yaml
---
titulo: "Nombre de la canción"
autor: "Autor o arreglador"       # opcional
categoria: "Navideña"             # opcional
orden: 1                          # opcional, para ordenar manualmente
---
La letra va acá abajo, en el cuerpo del archivo Markdown.
Cada línea nueva es un salto de línea normal.
```

El campo `body` de Sveltia CMS (ver sección 6) escribe directamente en esta parte del archivo, así que en las plantillas de Eleventy la letra se accede como `content`, no como un campo de frontmatter.

`src/content/canciones/canciones.json` (metadata por directorio de Eleventy):

```json
{
  "layout": "layouts/cancion.njk",
  "tags": "canciones",
  "permalink": "/canciones/{{ titulo | slugify }}/"
}
```

## 6. Configuración de Sveltia CMS

`src/admin/index.html`:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Panel — Cancionero</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script type="module" src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
  </body>
</html>
```

`src/admin/config.yml`:

```yaml
backend:
  name: github
  repo: TU-USUARIO/ohana      # <-- reemplazar por el repo real
  branch: main
  # base_url: https://sveltia-cms-auth.TU-SUBDOMINIO.workers.dev   # <-- descomentar cuando esté el worker de auth

media_folder: "src/images"
public_folder: "/images"

collections:
  - name: "canciones"
    label: "Canciones"
    folder: "src/content/canciones"
    create: true
    delete: true
    slug: "{{slug}}"
    identifier_field: titulo
    fields:
      - { label: "Título", name: "titulo", widget: "string" }
      - { label: "Autor / Arreglo", name: "autor", widget: "string", required: false }
      - label: "Categoría"
        name: "categoria"
        widget: "select"
        required: false
        options: ["Navideña", "Patria", "Infantil", "Otra"]
      - { label: "Orden", name: "orden", widget: "number", required: false, value_type: "int" }
      - { label: "Letra", name: "body", widget: "markdown" }
```

**Nota sobre `TU-USUARIO/ohana`:** hay que reemplazarlo por el owner/nombre reales del repo antes de usar el panel, tanto en producción como al probar contra el repo local.

## 7. Configuración de Eleventy

`.eleventy.js`:

```js
module.exports = function (eleventyConfig) {
  // "src/css" es opcional: solo hace falta si en algún momento se agrega
  // un style.css propio además de las clases de Tailwind (ver sección 9).
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });

  eleventyConfig.addCollection("canciones", (api) =>
    api.getFilteredByGlob("src/content/canciones/*.md")
       .sort((a, b) => (a.data.orden ?? 999) - (b.data.orden ?? 999))
  );

  return {
    dir: { input: "src", includes: "_includes", output: "_site" },
    // Solo necesario si el sitio se publica en usuario.github.io/ohana/
    // (no hace falta si usan dominio propio o usuario.github.io como raíz)
    pathPrefix: "/ohana/"
  };
};
```

`package.json`:

```json
{
  "name": "ohana",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "eleventy --serve",
    "build": "eleventy"
  },
  "devDependencies": {
    "@11ty/eleventy": "^3.0.0"
  }
}
```

## 8. Plantillas

`src/_includes/layouts/base.njk`:

```njk
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ title or "Cancionero" }}</title>
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
</head>
<body class="bg-slate-50 text-slate-800">
  <header class="p-4 border-b bg-white">
    <h1 class="text-xl font-bold"><a href="{{ '/' | url }}">🎶 Cancionero</a></h1>
  </header>
  <main class="max-w-2xl mx-auto p-4">{{ content | safe }}</main>
</body>
</html>
```

**Nota:** el script de `@tailwindcss/browser` compila Tailwind directo en el navegador (sucesor del viejo Play CDN, ya sobre Tailwind v4) — cero configuración, cero paso de build. Para el tamaño y tráfico de este sitio es la opción correcta; si algún día hace falta optimizar el CSS final, se reemplaza por la CLI de Tailwind sin tocar las plantillas.

`src/index.njk` (listado + buscador):

```njk
---
layout: layouts/base.njk
title: Inicio
---
<input type="search" id="buscador" placeholder="Buscar canción..." aria-label="Buscar canción"
  class="w-full p-3 mb-4 rounded-lg border border-slate-300 text-lg">
<ul id="lista-canciones" class="divide-y divide-slate-200 bg-white rounded-lg">
{% for cancion in collections.canciones %}
  <li data-titulo="{{ cancion.data.titulo | lower }}" class="p-3">
    <a href="{{ cancion.url }}" class="text-lg font-medium text-slate-900">{{ cancion.data.titulo }}</a>
    {% if cancion.data.autor %}<small class="block text-slate-500"> {{ cancion.data.autor }}</small>{% endif %}
  </li>
{% endfor %}
</ul>
<script src="{{ '/js/buscador.js' | url }}" defer></script>
```

`src/_includes/layouts/cancion.njk` (detalle de una canción):

```njk
---
layout: layouts/base.njk
---
<article class="bg-white rounded-lg p-5">
  <h2 class="text-2xl font-bold mb-1">{{ titulo }}</h2>
  {% if autor %}<p class="text-slate-500 mb-4">{{ autor }}</p>{% endif %}
  <div class="text-lg leading-relaxed whitespace-pre-line">{{ content | safe }}</div>
  <p class="mt-6"><a href="{{ '/' | url }}" class="text-blue-600">← Volver al listado</a></p>
</article>
```

`src/js/buscador.js` (filtro simple, sin dependencias):

```js
const input = document.getElementById("buscador");
const items = document.querySelectorAll("#lista-canciones li");
input?.addEventListener("input", () => {
  const q = input.value.toLowerCase();
  items.forEach((li) => {
    li.style.display = li.dataset.titulo.includes(q) ? "" : "none";
  });
});
```

## 9. Estilo

Mobile-first: la mayoría de los padres va a entrar desde el celular. Tipografía grande y legible para la letra (mínimo 18px en las plantillas de arriba), buen contraste.

**Tailwind vía CDN** (`@tailwindcss/browser`), sin paso de build — clases utilitarias directo en las plantillas, como ya está en la sección 8. No hace falta `tailwind.config.js` ni carpeta `src/css/` para esto; si más adelante hace falta algún estilo puntual que Tailwind no resuelva bien con utilidades, ahí sí se agrega un `src/css/style.css` chico y se linkea aparte.

**Diseño de las pantallas:** para bocetar el listado y el detalle de canción antes de tocar código, conviene usar [Google Stitch](https://stitch.withgoogle.com) — describís las dos pantallas, exporta HTML/CSS o Tailwind directo, y ese marcado se traslada casi tal cual a los `.njk` de la sección 8 (son HTML + un poco de sintaxis de plantilla), reemplazando las clases de ejemplo que puse ahí por las que genere Stitch.

## 10. GitHub Actions — deploy a GitHub Pages

`.github/workflows/deploy.yml`:

```yaml
name: Deploy a GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

En GitHub: **Settings → Pages → Source → GitHub Actions** (no "Deploy from branch").

## 11. Autenticación del panel

- **Desarrollo en el servidor casero:** Sveltia CMS puede trabajar directo contra un repositorio Git local desde el navegador, sin proxy ni OAuth. Ideal para que la directora (o vos primero, de prueba) edite canciones contra el repo clonado localmente antes de tocar producción.
- **Producción (GitHub Pages):** hace falta el backend `github` con OAuth. Se resuelve desplegando el worker `sveltia-cms-auth` en Cloudflare Workers (gratis) y registrando una OAuth App en GitHub que apunte a ese worker. Recién ahí se completa `base_url` en `config.yml`. Este paso se hace una sola vez.

## 12. Datos a definir antes de arrancar

- [ ] Nombre de usuario/organización y del repo en GitHub (reemplaza `TU-USUARIO/ohana`).
- [ ] ¿El sitio va en `usuario.github.io/ohana/` (repo normal → necesita `pathPrefix`) o en `usuario.github.io` (repo raíz → sin `pathPrefix`) o en dominio propio?
- [ ] Usuario de GitHub que va a usar la directora para loguearse al panel (necesita permiso de escritura sobre el repo).

## 13. Orden sugerido de tareas para OpenCode

1. Inicializar el proyecto Node + estructura de carpetas de la sección 4.
2. Crear `.eleventy.js`, `package.json` y las plantillas de la sección 7-8.
3. Cargar 2-3 canciones de ejemplo para probar listado y detalle.
4. Verificar `npm run dev` sirviendo el sitio correctamente en local.
5. Agregar `src/admin/index.html` y `config.yml` de la sección 6.
6. Probar el panel contra el repo local (sección 11) creando/editando/borrando una canción de prueba.
7. Agregar el workflow de GitHub Actions (sección 10).
8. Push a GitHub, activar Pages con source "GitHub Actions", verificar el primer deploy.
9. Recién ahí: desplegar el worker de auth y habilitar el login remoto para la directora.
