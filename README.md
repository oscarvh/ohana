# ohana — Cancionero de la Orquesta Escuela de Punta Indio

Sitio estático (Eleventy v3) con panel de administración (Sveltia CMS) para
publicar las letras de las canciones de la orquesta.

## Desarrollo

```bash
npm install
npm run dev
```

El sitio queda disponible en `http://localhost:8765/ohana/` (el script fija `--port=8765` porque 8080 y 8090 están ocupados por otros programas en esta máquina).

## Estructura

```
src/
├── _includes/layouts/   plantillas base y de canción
├── content/canciones/   letras en Markdown + metadata del directorio
├── admin/               entrypoint y config de Sveltia CMS
├── css/                 estilos puntuales (opcional)
├── js/                  buscador y atril client-side
├── index.njk            pantalla de bienvenida (splash)
└── canciones.njk        listado + buscador
```

Ver `ohana-especificaciones.md` para la especificación completa.
