# Agente de redes

Publica a diario en X, LinkedIn e Instagram los casos del Agentario y, cuando ya no queden casos sin publicar, el libro *La experiencia es el código*. No usa Metricool ni otros servicios pagados: solo las APIs oficiales de cada red.

## Cómo funciona

1. **Cada mañana** una tarea programada de Claude sigue [`INSTRUCCIONES.md`](INSTRUCCIONES.md): elige el caso (`herramientas/social/elegir.mjs`), escribe los tres textos, genera las imágenes con la plantilla de marca (`herramientas/social/imagen.mjs`), los valida (`validar.mjs`) y abre un pull request `Redes · <fecha>`.
2. **Tú apruebas** haciendo *Merge* del pull request (desde la app de GitHub en el celular). Si no lo apruebas, no se publica nada y al día siguiente lo reemplaza otra propuesta.
3. **Al aprobar**, la acción [`Publicar en redes`](../.github/workflows/publicar-redes.yml) publica con `herramientas/social/publicar.mjs`, guarda los enlaces en `historial.json` y mueve la propuesta a `publicados/`.

Orden de publicación: casos nuevos → casos más copiados (`TOP_PROMPTS`) → resto de los casos, del más reciente al más antiguo → ángulos del libro (`angulos-libro.json`).

## Carpetas

| Ruta | Qué es |
|---|---|
| `marca/` | Plantilla de marca: `marca.json` (colores, fuentes, voz, formatos), `plantilla-caso.html`, `plantilla-libro.html` y las fuentes |
| `cola/` | Propuestas por aprobar o con publicaciones pendientes |
| `publicados/` | Propuestas ya publicadas en todas sus redes |
| `img/` | Imágenes generadas: `-vertical.jpg` 1080×1350 (Instagram y LinkedIn) y `-horizontal.jpg` 1200×675 (X) |
| `historial.json` | Qué se publicó, cuándo y dónde |

## Credenciales (Settings → Secrets and variables → Actions)

| Secret | Red | De dónde sale |
|---|---|---|
| `X_API_KEY`, `X_API_SECRET` | X | Consola de desarrolladores de X → tu app → *Keys and tokens* (API Key and Secret) |
| `X_ACCESS_TOKEN`, `X_ACCESS_SECRET` | X | Misma pantalla → *Access Token and Secret*, generados **después** de dar permiso de lectura y escritura |
| `LINKEDIN_TOKEN` | LinkedIn | Token de 60 días con el permiso `w_member_social` (producto *Share on LinkedIn*) y `openid profile` |
| `LINKEDIN_AUTOR` | LinkedIn | Opcional. `urn:li:person:…` (si falta, se obtiene solo) o `urn:li:organization:…` para la página de empresa |
| `IG_TOKEN` | Instagram | Token de larga duración de la *Instagram API con inicio de sesión de Instagram* (`instagram_business_basic`, `instagram_business_content_publish`) |
| `IG_USER_ID` | Instagram | Opcional; si falta, se obtiene solo |

Variables opcionales: `LINKEDIN_VERSION` (AAAAMM, por defecto 202608) e `IG_VERSION` (por defecto v24.0).

Si faltan las credenciales de una red, esa red se omite y las demás se publican igual.

**Vencimientos:** los tokens de LinkedIn e Instagram duran 60 días. Renuévalos antes y actualiza el Secret.

## Probar sin publicar

Actions → *Publicar en redes* → *Run workflow* → marca *Solo simular*. También sirve para reintentar una red que falló (deja su nombre en *redes*).

En local: `PRUEBA=1 node herramientas/social/publicar.mjs`.

## Medición

Cada enlace lleva `utm_source=<red>&utm_medium=social&utm_campaign=agente-redes` (y `utm_content=<ángulo>` en los posts del libro). En GoatCounter se ve cuántas visitas trae cada red y, con los eventos `clic-libro/…` y `libro/compra`, cuántas terminan en la preventa.
