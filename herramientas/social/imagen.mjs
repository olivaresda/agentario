// Genera las imágenes de una propuesta con la plantilla de marca (social/marca/).
//
//   vertical   1080×1350  → Instagram y LinkedIn
//   horizontal 1200×675   → X
//
// Uso: node herramientas/social/imagen.mjs social/cola/AAAA-MM-DD.json
// Lee el bloque "imagen" de la propuesta, escribe social/img/<fecha>-<id>-<formato>.jpg
// y deja la ruta de cada imagen en redes.<red>.imagen. Necesita Playwright con Chromium.

import { readFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { RAIZ, SOCIAL, MARCA, leerJson, guardarJson } from './datos.mjs';

async function cargarPlaywright() {
  try { return await import('playwright'); } catch {}
  const global = execSync('npm root -g').toString().trim();
  return createRequire(join(global, 'x.js'))('playwright');
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const resaltar = s => esc(s).replace(/\[([^\]]+)\]/g, '<mark>[$1]</mark>');

function rellenar(plantilla, campos, formato) {
  const valores = { ...campos, formato };
  return plantilla.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (k === 'formato') return formato;
    if (k === 'prompt') return resaltar(valores.prompt);
    if (k === 'ficha') return (valores.ficha || []).map(f => `<dt>${esc(f.etiqueta)}</dt><dd>${esc(f.valor)}</dd>`).join('');
    return esc(valores[k]);
  });
}

// Achica el título hasta que quepa en el número de líneas permitido.
async function ajustarTitulo(page, maxLineas) {
  await page.evaluate(async maxLineas => {
    await document.fonts.ready;
    const h1 = document.querySelector('h1');
    h1.style.webkitLineClamp = 'unset';
    let px = parseFloat(getComputedStyle(h1).fontSize);
    const cabe = () => h1.scrollHeight <= Math.ceil(parseFloat(getComputedStyle(h1).lineHeight) * maxLineas) + 2;
    while (!cabe() && px > 30) { px -= 2; h1.style.fontSize = px + 'px'; }
  }, maxLineas);
}

export async function renderizar(propuesta, { salida = join(SOCIAL, 'img') } = {}) {
  const { chromium } = await cargarPlaywright();
  const { plantilla, campos } = propuesta.imagen;
  const archivo = join(SOCIAL, 'marca', `plantilla-${plantilla}.html`);
  const base = readFileSync(archivo, 'utf8');
  mkdirSync(salida, { recursive: true });

  const navegador = await chromium.launch();
  const rutas = {};
  try {
    for (const [formato, { ancho, alto }] of Object.entries(MARCA.formatos)) {
      const page = await navegador.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
      // Se carga desde la carpeta de la plantilla para que encuentre las fuentes.
      await page.goto(pathToFileURL(archivo).href);
      await page.setContent(rellenar(base, campos, formato), { waitUntil: 'load' });
      await ajustarTitulo(page, formato === 'vertical' ? 4 : 3);
      const ruta = join(salida, `${propuesta.fecha}-${propuesta.id}-${formato}.jpg`);
      await page.screenshot({ path: ruta, type: 'jpeg', quality: 90 });
      rutas[formato] = relative(RAIZ, ruta);
      await page.close();
    }
  } finally {
    await navegador.close();
  }
  return rutas;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ruta = process.argv[2];
  if (!ruta) { console.error('Uso: node herramientas/social/imagen.mjs social/cola/AAAA-MM-DD.json'); process.exit(1); }
  const propuesta = leerJson(ruta);
  const rutas = await renderizar(propuesta);
  for (const [red, datos] of Object.entries(propuesta.redes || {})) {
    const formato = Object.entries(MARCA.formatos).find(([, f]) => f.redes.includes(red))?.[0];
    if (formato) datos.imagen = rutas[formato];
  }
  guardarJson(ruta, propuesta);
  console.log(JSON.stringify(rutas, null, 2));
}
