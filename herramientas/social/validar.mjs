// Revisa una propuesta de social/cola/ antes de pedir aprobación.
// Uso: node herramientas/social/validar.mjs social/cola/AAAA-MM-DD.json
// Termina con código 1 si hay errores; las advertencias no bloquean.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, REDES, CASOS, MARCA, leerJson, leerHistorial, largoX } from './datos.mjs';

const ruta = process.argv[2];
if (!ruta) { console.error('Uso: node herramientas/social/validar.mjs social/cola/AAAA-MM-DD.json'); process.exit(1); }
const p = leerJson(ruta);
const errores = [], avisos = [];
const hashtags = s => (s.match(/(^|\s)#[\p{L}\p{N}]+/gu) || []).length;

function medidasJpg(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  for (let i = 2; i < buf.length;) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1], largo = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return { alto: buf.readUInt16BE(i + 5), ancho: buf.readUInt16BE(i + 7) };
    i += 2 + largo;
  }
  return null;
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(p.fecha || '')) errores.push('Falta "fecha" (AAAA-MM-DD).');
if (!['caso', 'libro'].includes(p.tipo)) errores.push('"tipo" debe ser "caso" o "libro".');
if (p.tipo === 'caso' && !CASOS.some(c => c.id === p.id)) errores.push(`El caso "${p.id}" no existe en index.html.`);
if (p.tipo === 'caso' && leerHistorial().publicados.some(h => h.tipo === 'caso' && h.id === p.id)) errores.push(`El caso "${p.id}" ya se publicó.`);

for (const red of REDES) {
  const d = p.redes?.[red];
  if (!d) { avisos.push(`${red}: no hay texto; no se publicará en esta red.`); continue; }
  const t = d.texto || '';
  if (!t.trim()) errores.push(`${red}: el texto está vacío.`);
  if (d.estado && d.estado !== 'pendiente') errores.push(`${red}: estado "${d.estado}"; una propuesta nueva debe estar "pendiente".`);
  if (!d.alt) avisos.push(`${red}: falta el texto alternativo de la imagen ("alt").`);
  const enlace = p.enlaces?.[red];

  if (red === 'x') {
    if (largoX(t) > 280) errores.push(`x: ${largoX(t)} caracteres (máximo 280; cada enlace cuenta 23).`);
    if (enlace && !t.includes(enlace)) errores.push('x: falta el enlace con medición (p.enlaces.x).');
    if (hashtags(t) > 1) avisos.push(`x: ${hashtags(t)} hashtags; la marca usa uno o ninguno.`);
  }
  if (red === 'linkedin') {
    if (t.length > 3000) errores.push(`linkedin: ${t.length} caracteres (máximo 3000).`);
    if (enlace && !t.includes(enlace)) errores.push('linkedin: falta el enlace con medición (p.enlaces.linkedin).');
    if (hashtags(t) > 3) avisos.push(`linkedin: ${hashtags(t)} hashtags; la marca usa máximo 3.`);
  }
  if (red === 'instagram') {
    if (t.length > 2200) errores.push(`instagram: ${t.length} caracteres (máximo 2200).`);
    if (hashtags(t) > 30) errores.push(`instagram: ${hashtags(t)} hashtags (máximo 30).`);
    else if (hashtags(t) < 5 || hashtags(t) > 8) avisos.push(`instagram: ${hashtags(t)} hashtags; la marca usa entre 5 y 8.`);
    if (/https?:\/\//.test(t)) avisos.push('instagram: los enlaces no son clicables en el texto; usa "link en la bio".');
    if (!d.imagen) errores.push('instagram: necesita imagen.');
  }

  if (d.imagen) {
    const archivo = join(RAIZ, d.imagen);
    if (!existsSync(archivo)) { errores.push(`${red}: no existe la imagen ${d.imagen}.`); continue; }
    const m = medidasJpg(readFileSync(archivo));
    if (!m) errores.push(`${red}: ${d.imagen} no es JPEG.`);
    else {
      const formato = Object.values(MARCA.formatos).find(f => f.redes.includes(red));
      if (formato && (m.ancho !== formato.ancho || m.alto !== formato.alto)) avisos.push(`${red}: imagen de ${m.ancho}×${m.alto}, se esperaba ${formato.ancho}×${formato.alto}.`);
    }
  }
}

for (const a of avisos) console.log('⚠', a);
for (const e of errores) console.log('✗', e);
if (errores.length) process.exit(1);
console.log(`✓ ${ruta} está lista para aprobación.`);
