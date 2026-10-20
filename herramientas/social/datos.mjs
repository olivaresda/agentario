// Datos compartidos por las herramientas del agente de redes.
// La única fuente de los casos es index.html (CASOS, CATS, TOP_PROMPTS, TRAMOS_FUNDADOR).

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SOCIAL = join(RAIZ, 'social');
export const SITIO = 'https://agentario.laexperienciaeselcodigo.com';
export const LIBRO = 'https://laexperienciaeselcodigo.com';
export const ZONA = 'America/Santiago';
export const REDES = ['x', 'linkedin', 'instagram'];

const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');
// Lee una constante literal (arreglo u objeto) de index.html buscando su cierre balanceado.
function literal(nombre) {
  const marca = `const ${nombre} = `;
  const inicio = html.indexOf(marca);
  if (inicio < 0) throw new Error(`No encontré ${nombre} en index.html`);
  const desde = inicio + marca.length;
  let prof = 0, i = desde, comilla = null;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (comilla) { if (ch === '\\') i++; else if (ch === comilla) comilla = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') comilla = ch;
    else if (ch === '[' || ch === '{') prof++;
    else if ((ch === ']' || ch === '}') && --prof === 0) break;
  }
  return new Function(`return ${html.slice(desde, i + 1)}`)();
}

export const CATS = literal('CATS');
export const CASOS = literal('CASOS');
export const TOP_PROMPTS = literal('TOP_PROMPTS');
export const TRAMOS_FUNDADOR = literal('TRAMOS_FUNDADOR');
export const MARCA = JSON.parse(readFileSync(join(SOCIAL, 'marca', 'marca.json'), 'utf8'));

/* ---------- Fechas (hora de Chile) ---------- */
export function hoy(fecha = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
}
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const fechaLarga = f => { const [y, m, d] = f.split('-').map(Number); return `${d} de ${MESES[m - 1]} de ${y}`; };
export const fechaCorta = f => { const [, m, d] = f.split('-').map(Number); return `${d} de ${MESES[m - 1]}`; };
export const diasEntre = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

/* ---------- Enlaces con medición ---------- */
// utm_source = red, utm_medium = social, utm_campaign = agente-redes, utm_content = caso o ángulo.
export function conUtm(url, red, contenido) {
  const u = new URL(url);
  u.searchParams.set('utm_source', red);
  u.searchParams.set('utm_medium', MARCA.utm.medium);
  u.searchParams.set('utm_campaign', MARCA.utm.campaign);
  if (contenido) u.searchParams.set('utm_content', contenido);
  return u.toString();
}
export const urlCaso = id => `${SITIO}/casos/${id}/`;

/* ---------- Precio del lector fundador según la fecha ---------- */
export function tramoFundador(f = hoy()) {
  const i = TRAMOS_FUNDADOR.findIndex(t => f <= t.hasta);
  return { actual: TRAMOS_FUNDADOR[i], siguiente: TRAMOS_FUNDADOR[i + 1] || null };
}

/* ---------- Historial y cola ---------- */
const RUTA_HISTORIAL = join(SOCIAL, 'historial.json');
export function leerHistorial() {
  if (!existsSync(RUTA_HISTORIAL)) return { publicados: [] };
  return JSON.parse(readFileSync(RUTA_HISTORIAL, 'utf8'));
}
export function guardarHistorial(h) {
  writeFileSync(RUTA_HISTORIAL, JSON.stringify(h, null, 2) + '\n');
}
export const RUTA_COLA = join(SOCIAL, 'cola');
export function archivosCola() {
  if (!existsSync(RUTA_COLA)) return [];
  return readdirSync(RUTA_COLA).filter(n => /^\d{4}-\d{2}-\d{2}.*\.json$/.test(n)).sort().map(n => join(RUTA_COLA, n));
}
export const leerJson = r => JSON.parse(readFileSync(r, 'utf8'));
export const guardarJson = (r, o) => writeFileSync(r, JSON.stringify(o, null, 2) + '\n');

/* ---------- Textos ---------- */
// Largo de un post en X: cada enlace cuenta 23 caracteres y los emojis cuentan 2.
export function largoX(texto) {
  const sinUrls = texto.replace(/https?:\/\/\S+/g, () => 'x'.repeat(23));
  let n = 0;
  for (const ch of sinUrls) n += /\p{Extended_Pictographic}/u.test(ch) ? 2 : 1;
  return n;
}
