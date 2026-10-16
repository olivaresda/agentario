// Genera páginas estáticas para que Google pueda indexar cada caso de Agentario.
//
// Lee CATS y CASOS desde index.html (la única fuente de datos) y escribe:
//   casos/index.html              índice de todos los casos
//   casos/<id>/index.html         una página por caso
//   categoria/<slug>/index.html   una página por categoría
//   agente/<slug>/index.html      una página por agente con 2 casos o más
//   sitemap.xml
//
// Uso: node herramientas/generar-paginas.mjs
// Se ejecuta solo en GitHub Actions cada vez que cambia index.html en main.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITIO = 'https://agentario.laexperienciaeselcodigo.com';
const LIBRO = 'https://laexperienciaeselcodigo.com/';
const AUTOR_ID = 'https://laexperienciaeselcodigo.com/#autor';
const MIN_CASOS_AGENTE = 2;
// "Agente propio" no es una herramienta: no tiene página de agente.
const SIN_PAGINA_AGENTE = new Set(['Agente propio']);

/* ---------- Datos ---------- */
const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');
function literal(nombre, abre, cierra) {
  const inicio = html.indexOf(`const ${nombre} = ${abre}`);
  if (inicio < 0) throw new Error(`No encontré ${nombre} en index.html`);
  const fin = html.indexOf(`\n${cierra};`, inicio);
  return new Function(`return ${html.slice(inicio + `const ${nombre} = `.length, fin + 2)}`)();
}
const CATS = literal('CATS', '{', '}');
const CASOS = literal('CASOS', '[', ']');

const INTRO_CAT = {
  dinero: 'Agentes de IA que te ayudan con cuentas, cobros, seguros, impuestos y trámites: revisan documentos, comparan cifras y preparan los argumentos por ti.',
  ventas: 'Agentes de IA para prospectar, preparar reuniones, hacer seguimiento a clientes y ordenar la cobranza sin perder horas en tareas repetitivas.',
  ops: 'Agentes de IA para el día a día de una PYME: facturas, cotizaciones, agendas, inventario y procesos que hoy se hacen a mano.',
  marketing: 'Agentes de IA para crear y reutilizar contenido, investigar a tu audiencia y mantener tus canales activos con menos esfuerzo.',
  research: 'Agentes de IA que investigan por ti: buscan fuentes, comparan alternativas y te entregan un resumen con lo importante.',
  software: 'Agentes de IA para programar, analizar datos y automatizar planillas, incluso si no eres desarrollador.',
  vida: 'Agentes de IA para la vida diaria: viajes, compras, reclamos, ventas de segunda mano y trámites personales.'
};

/* ---------- Utilidades ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fecha = f => { const [y, m, d] = f.split('-').map(Number); return `${d} de ${MESES[m - 1]} de ${y}`; };
const recorta = (s, max) => s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max - 1)).replace(/[,;:.]$/, '') + '…';
const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const recientes = (a, b) => b.f.localeCompare(a.f) || a.t.localeCompare(b.t, 'es');

const urlCaso = c => `/casos/${c.id}/`;
const urlCat = k => `/categoria/${slug(CATS[k])}/`;
const urlAgente = a => `/agente/${slug(a)}/`;

const porCat = {}, porAgente = {};
for (const c of CASOS) {
  (porCat[c.c] ||= []).push(c);
  (porAgente[c.a] ||= []).push(c);
}
Object.values(porCat).forEach(l => l.sort(recientes));
Object.values(porAgente).forEach(l => l.sort(recientes));
const tienePaginaAgente = a => porAgente[a].length >= MIN_CASOS_AGENTE && !SIN_PAGINA_AGENTE.has(a);
const ultima = l => l.reduce((m, c) => c.f > m ? c.f : m, '0');
const total = CASOS.length;

/* ---------- Plantilla ---------- */
function pagina({ ruta, titulo, descripcion, tipoOg = 'website', datos, caso = '', cuerpo }) {
  const url = SITIO + ruta;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${tipoOg}">
<meta property="og:site_name" content="Agentario">
<meta property="og:locale" content="es_CL">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITIO}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/recursos/paginas.css">
${datos.map(ld).join('\n')}
</head>
<body${caso ? ` data-caso="${esc(caso)}"` : ''}>
<header class="top">
  <div class="wrap">
    <a class="brand" href="/"><span class="dot" aria-hidden="true"></span>Agentario</a>
    <nav class="main" aria-label="Principal">
      <a href="/casos/">Todos los casos</a>
      <a class="libro" href="${LIBRO}" data-libro="menu">El libro</a>
    </nav>
  </div>
</header>
<main class="wrap">
${cuerpo}
</main>
<footer>
  <div class="wrap">
    <p>Agentario es curado por <a href="https://www.linkedin.com/in/dolivares/" target="_blank" rel="noopener">Daniel Olivares</a> y es el adelanto abierto del libro <a href="${LIBRO}" data-libro="pie">La experiencia es el código</a>. Los casos son ideas para probar: revisa siempre lo que hace el agente antes de enviar, pagar o firmar.</p>
    <p><a href="/">Inicio</a> · <a href="/casos/">Todos los casos</a> · <a href="/#/aporta">Aporta tu caso</a></p>
  </div>
</footer>
<script src="/recursos/paginas.js" defer></script>
</body>
</html>
`;
}

function migas(items) {
  const html = `<nav class="migas" aria-label="Ruta"><ol>${items.map(([n, u], i) =>
    i < items.length - 1 ? `<li><a href="${u}">${esc(n)}</a></li>` : `<li aria-current="page">${esc(n)}</li>`).join('')}</ol></nav>`;
  const datos = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: SITIO + u }))
  };
  return { html, datos };
}

function agenteHTML(a) {
  return tienePaginaAgente(a) ? `<a class="agent" href="${urlAgente(a)}">${esc(a)}</a>` : `<span class="agent">${esc(a)}</span>`;
}

function itemLista(c, { conCat = true } = {}) {
  return `<li class="case">
    <h3><a href="${urlCaso(c)}">${esc(c.t)}</a></h3>
    <p class="desc">${esc(c.d)}</p>
    <p class="meta">${agenteHTML(c.a)}${conCat ? `<a href="${urlCat(c.c)}">${esc(CATS[c.c])}</a>` : ''}<span>${fecha(c.f)}</span></p>
  </li>`;
}

function listaItems(lista, url) {
  return {
    '@context': 'https://schema.org', '@type': 'ItemList', url: SITIO + url, numberOfItems: lista.length,
    itemListElement: lista.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: SITIO + urlCaso(c), name: c.t }))
  };
}

const bandaLibro = lugar => `<aside class="band">
  <div>
    <h2>Tu experiencia vale más que el código</h2>
    <p>Este caso es parte de <em>La experiencia es el código</em>, un libro para profesionales que quieren crear sus propios agentes de IA sin programar.</p>
  </div>
  <a class="btn" href="${LIBRO}#preventa" data-libro="${lugar}">Conocer el libro</a>
</aside>`;

/* ---------- Escritura ---------- */
const archivos = [];
function escribe(ruta, contenido) {
  const destino = join(RAIZ, ruta, 'index.html');
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, contenido);
  archivos.push(ruta);
}
for (const dir of ['casos', 'categoria', 'agente']) rmSync(join(RAIZ, dir), { recursive: true, force: true });

/* Casos */
for (const c of CASOS) {
  const ruta = urlCaso(c);
  const cat = CATS[c.c];
  const m = migas([['Agentario', '/'], [cat, urlCat(c.c)], [c.t, ruta]]);
  const titulo = (c.t + ' con ' + c.a).length <= 58 ? `${c.t} con ${c.a} | Agentario` : `${c.t} | Agentario`;
  const relacionados = porCat[c.c].filter(x => x.id !== c.id).slice(0, 5);
  const fuentes = [
    c.fo ? `<a class="fo" href="${esc(c.fo.u)}" target="_blank" rel="noopener">Fuente original: ${esc(c.fo.n)}</a>` : '',
    c.src ? `<a class="via" href="${esc(c.src)}" target="_blank" rel="noopener">Vía Agent Use Cases</a>` : ''
  ].filter(Boolean).join('');
  const cuerpo = `${m.html}
<article class="caso">
  <h1>${esc(c.t)}</h1>
  <p class="lead">${esc(c.d)}</p>
  <p class="meta">Agente: ${agenteHTML(c.a)}<a href="${urlCat(c.c)}">${esc(cat)}</a><span>Publicado el ${fecha(c.f)}</span></p>
  ${c.r ? `<p class="res"><strong>Resultado real:</strong> ${esc(c.r)}</p>` : ''}
  <h2>El prompt</h2>
  <p class="tip">Cópialo en ${esc(c.a)} y reemplaza lo que está entre [corchetes] con tus datos.</p>
  <pre class="prompt" id="prompt">${esc(c.p)}</pre>
  <button class="btn copiar" type="button" data-copiar="prompt">Copiar prompt</button>
  ${fuentes ? `<p class="fuentes">${fuentes}</p>` : ''}
</article>
${bandaLibro('caso-pagina')}
${relacionados.length ? `<section class="block">
  <h2>Más casos de ${esc(cat.toLowerCase())}</h2>
  <ol class="cases">${relacionados.map(x => itemLista(x, { conCat: false })).join('')}</ol>
  <p><a class="ver" href="${urlCat(c.c)}">Ver los ${porCat[c.c].length} casos de ${esc(cat.toLowerCase())}</a></p>
</section>` : ''}`;
  escribe(ruta, pagina({
    ruta, titulo, descripcion: recorta(c.d, 155), tipoOg: 'article', caso: c.id, cuerpo,
    datos: [{
      '@context': 'https://schema.org', '@type': 'Article',
      headline: recorta(c.t, 110), description: c.d, inLanguage: 'es',
      datePublished: c.f, dateModified: c.f, image: SITIO + '/og.png',
      mainEntityOfPage: SITIO + ruta, articleSection: cat,
      about: { '@type': 'SoftwareApplication', name: c.a, applicationCategory: 'AI agent' },
      author: { '@type': 'Person', '@id': AUTOR_ID, name: 'Daniel Olivares Martínez' },
      publisher: { '@type': 'Person', '@id': AUTOR_ID, name: 'Daniel Olivares Martínez' },
      isPartOf: { '@type': 'WebSite', '@id': SITIO + '/#sitio', name: 'Agentario', url: SITIO + '/' }
    }, m.datos]
  }));
}

/* Categorías */
const catsUsadas = Object.keys(CATS).filter(k => porCat[k]);
for (const k of catsUsadas) {
  const ruta = urlCat(k), lista = porCat[k], nombre = CATS[k];
  const m = migas([['Agentario', '/'], [nombre, ruta]]);
  const otras = catsUsadas.filter(x => x !== k).map(x => `<li><a href="${urlCat(x)}">${esc(CATS[x])}</a> <span>${porCat[x].length}</span></li>`).join('');
  escribe(ruta, pagina({
    ruta,
    titulo: `${nombre}: ${lista.length} casos de agentes de IA | Agentario`,
    descripcion: recorta(`${lista.length} casos de uso de agentes de IA para ${nombre.toLowerCase()}, con el prompt listo para copiar. ${INTRO_CAT[k] || ''}`, 155),
    cuerpo: `${m.html}
<h1>${esc(nombre)}: casos de uso de agentes de IA</h1>
<p class="lead">${esc(INTRO_CAT[k] || '')} ${lista.length === 1 ? 'Un caso' : lista.length + ' casos'}, cada uno con el prompt listo para copiar.</p>
<ol class="cases">${lista.map(c => itemLista(c, { conCat: false })).join('')}</ol>
${bandaLibro('categoria')}
<section class="block"><h2>Otras categorías</h2><ul class="lista">${otras}</ul></section>`,
    datos: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: nombre, url: SITIO + ruta, inLanguage: 'es', isPartOf: { '@id': SITIO + '/#sitio' }, mainEntity: listaItems(lista, ruta) }, m.datos]
  }));
}

/* Agentes */
const agentes = Object.keys(porAgente).sort((a, b) => porAgente[b].length - porAgente[a].length || a.localeCompare(b, 'es'));
const agentesConPagina = agentes.filter(tienePaginaAgente);
for (const a of agentesConPagina) {
  const ruta = urlAgente(a), lista = porAgente[a];
  const m = migas([['Agentario', '/'], [a, ruta]]);
  const otros = agentesConPagina.filter(x => x !== a).map(x => `<li><a href="${urlAgente(x)}">${esc(x)}</a> <span>${porAgente[x].length}</span></li>`).join('');
  escribe(ruta, pagina({
    ruta,
    titulo: `Qué puedes hacer con ${a}: ${lista.length} casos de uso | Agentario`,
    descripcion: recorta(`${lista.length} casos de uso reales de ${a} en español, cada uno con el prompt listo para copiar y probar hoy.`, 155),
    cuerpo: `${m.html}
<h1>Casos de uso de ${esc(a)}</h1>
<p class="lead">${lista.length} ideas concretas de lo que puedes delegar a ${esc(a)}, cada una con el prompt listo para copiar y probar hoy.</p>
<ol class="cases">${lista.map(c => itemLista(c)).join('')}</ol>
${bandaLibro('agente')}
<section class="block"><h2>Otros agentes</h2><ul class="lista">${otros}</ul></section>`,
    datos: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Casos de uso de ${a}`, url: SITIO + ruta, inLanguage: 'es', isPartOf: { '@id': SITIO + '/#sitio' }, mainEntity: listaItems(lista, ruta) }, m.datos]
  }));
}

/* Índice de todos los casos */
{
  const ruta = '/casos/';
  const m = migas([['Agentario', '/'], ['Todos los casos', ruta]]);
  const secciones = catsUsadas.map(k => `<section class="block">
  <h2><a href="${urlCat(k)}">${esc(CATS[k])}</a></h2>
  <ol class="cases">${porCat[k].map(c => itemLista(c, { conCat: false })).join('')}</ol>
</section>`).join('\n');
  escribe(ruta, pagina({
    ruta,
    titulo: `${total} casos de uso de agentes de IA en español | Agentario`,
    descripcion: `Los ${total} casos de uso de agentes de IA de Agentario, ordenados por categoría y con el prompt listo para copiar. En español y pensados para Latinoamérica.`,
    cuerpo: `${m.html}
<h1>Todos los casos de uso de agentes de IA</h1>
<p class="lead">${total} ideas concretas de lo que ya puedes delegar a un agente de IA, ordenadas por categoría. Cada una trae el prompt listo para copiar.</p>
<section class="block"><h2>Por agente</h2><ul class="lista">${agentesConPagina.map(a => `<li><a href="${urlAgente(a)}">${esc(a)}</a> <span>${porAgente[a].length}</span></li>`).join('')}</ul></section>
${secciones}`,
    datos: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Todos los casos de Agentario', url: SITIO + ruta, inLanguage: 'es', isPartOf: { '@id': SITIO + '/#sitio' }, mainEntity: listaItems([...CASOS].sort(recientes), ruta) }, m.datos]
  }));
}

/* Sitemap */
const lastmod = {
  '/': ultima(CASOS), '/casos/': ultima(CASOS),
  ...Object.fromEntries(CASOS.map(c => [urlCaso(c), c.f])),
  ...Object.fromEntries(catsUsadas.map(k => [urlCat(k), ultima(porCat[k])])),
  ...Object.fromEntries(agentesConPagina.map(a => [urlAgente(a), ultima(porAgente[a])]))
};
writeFileSync(join(RAIZ, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.entries(lastmod).map(([u, f]) => `  <url>
    <loc>${SITIO}${u}</loc>
    <lastmod>${f}</lastmod>
  </url>`).join('\n')}
</urlset>
`);

console.log(`Listo: ${CASOS.length} casos, ${catsUsadas.length} categorías, ${agentesConPagina.length} agentes, ${Object.keys(lastmod).length} URLs en el sitemap.`);
