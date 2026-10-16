# Agentario

Casos de uso de agentes de IA en español, con el prompt listo para copiar.

- Sitio: https://agentario.laexperienciaeselcodigo.com/
- Todo el contenido está en `index.html`, en el bloque `DATOS` del script (`CASOS`, `SPONSORS`, `DONANTES`).

## Páginas de cada caso (SEO)

Cada caso, categoría y agente (con 2 casos o más) tiene su propia página estática para que Google pueda indexarla: `casos/<id>/`, `categoria/<nombre>/` y `agente/<nombre>/`, más el índice `casos/` y `sitemap.xml`.

- **No se editan a mano.** Las genera `node herramientas/generar-paginas.mjs` a partir de `CATS` y `CASOS` de `index.html`.
- Al hacer push a `main` con cambios en `index.html`, la acción `.github/workflows/paginas.yml` las regenera, las guarda y vuelve a publicar GitHub Pages. También se puede correr a mano desde la pestaña *Actions*.
- El `id` de un caso es parte de su dirección: no lo cambies después de publicarlo.

## Alianza con Agent Use Cases

Los casos con `src` vienen de [agentusecases.ai](https://agentusecases.ai/), traducidos y adaptados al español. Cada uno enlaza a su página en Agent Use Cases (`src`) y a la fuente original (`fo`), e incluye el resultado real (`r`).

## Aporta tu caso

La sección `#/aporta` tiene un formulario para que cualquiera envíe su caso. En GitHub Pages llega por correo a `SUSCRIPCION_EMAIL` (FormSubmit); dentro de claude.ai se guarda en la colección `aportes` del artefacto, visible solo para el dueño.

## Suscripción a novedades

La página muestra un pop-up que pide el correo del visitante (a los 12 segundos o al bajar por la página; se puede abrir también con `#novedades`).

- En GitHub Pages, cada suscripción se envía por correo a `SUSCRIPCION_EMAIL` mediante [FormSubmit](https://formsubmit.co). La primera vez llega un correo de activación que hay que confirmar.
- Dentro de claude.ai (artefacto), se guarda en la base de datos del artefacto, colección `suscriptores`, visible solo para el dueño.

## Analítica

La página mide visitas y acciones con [GoatCounter](https://www.goatcounter.com) (sin cookies). Para activarla, escribe tu código en la constante `GOATCOUNTER` de `index.html`. Se registran: secciones visitadas, casos abiertos por enlace, búsquedas (marcando las que no tienen resultados), filtros de categoría, agente y alianza, prompts vistos, copiados, compartidos y guardados, clics a Agent Use Cases y a las fuentes, suscripciones y aportes enviados.

## Embudo hacia el libro

Agentario existe para llevar lectores a la preventa de *La experiencia es el código* (laexperienciaeselcodigo.com).

- **Tarjeta al copiar un prompt:** invita a precomprar el libro, conocerlo o leer el capítulo 1.
- **Página "El libro"** (`#/libro`): qué aprendes, para quién es y niveles de preventa. El precio del lector fundador cambia solo según `TRAMOS_FUNDADOR`.
- **Pop-up "capítulo 1 gratis"**: pide correo, nombre y rubro (opcional) y regala los prompts de `TOP_PROMPTS`. Si `CAPITULO1_URL` tiene un enlace, se entrega al instante y en el correo automático.
- **Medición de punta a punta:** cada enlace al libro lleva `utm_source=agentario`, `utm_medium=<lugar>` y `utm_content=<caso>`, y se registra en GoatCounter como `clic-libro/<lugar>/<caso>`. En el sitio del libro hay que pegar `libro/medicion-goatcounter.html`, que registra `libro/visita`, `libro/ve-preventa`, `libro/clic-pagar` y `libro/compra`.
