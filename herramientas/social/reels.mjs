// Genera reels de texto (1080×1920, ~20 s) con la marca del libro a partir de social/reels/reels.json.
// Cada pantalla es HTML renderizado con Playwright; ffmpeg las une con fundidos y una pista de audio en silencio.
//
// Uso: node herramientas/social/reels.mjs [id]   → social/reels/<nn>-<id>.mp4
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { execSync, execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const RAIZ = new URL('../../', import.meta.url).pathname;
const SALIDA = join(RAIZ, 'social/reels');
const PLANTILLA = join(RAIZ, 'social/marca/plantilla-libro.html');
const F = 'file://' + join(RAIZ, 'social/marca/fuentes/');
const { chromium } = createRequire(join(execSync('npm root -g').toString().trim(), 'x.js'))('playwright');

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  .replace(/\*(.+?)\*/g, '<span class="k">$1</span>');

const css = oscuro => `
@font-face{font-family:Lit;font-weight:700;src:url(${F}literata-latin-700-normal.woff2)}
@font-face{font-family:Lit;font-weight:400;src:url(${F}literata-latin-400-normal.woff2)}
@font-face{font-family:Plex;src:url(${F}ibm-plex-sans-condensed-latin-500-normal.woff2)}
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1920px;background:${oscuro ? '#14233A' : '#E9EEF2'};color:${oscuro ? '#E9EEF2' : '#14233A'};
 font-family:Lit;font-weight:700;display:flex;flex-direction:column;justify-content:center;padding:0 110px;position:relative}
.big{font-size:104px;line-height:1.12}.mid{font-size:80px;line-height:1.18}
.sub{font-weight:400;font-size:54px;line-height:1.32;color:${oscuro ? '#B9C4D0' : '#3d4f66'};margin-top:44px}
.k{color:#C9962B}.bar{width:140px;height:12px;background:#C9962B;margin-bottom:60px}
.tag{position:absolute;top:190px;left:110px;right:110px;font-family:Plex;font-size:42px;color:${oscuro ? '#9fb0c2' : '#5a6b80'}}
.pie{position:absolute;bottom:250px;left:110px;font-family:Plex;font-size:48px}
.lista{margin-top:56px;display:flex;flex-direction:column;gap:40px}
.item{background:${oscuro ? '#1d3150' : '#F7F9FB'};border-left:10px solid #C9962B;padding:34px 40px}
.item b{display:block;font-family:Plex;font-weight:500;font-size:38px;color:${oscuro ? '#9fb0c2' : '#5a6b80'};margin-bottom:10px}
.item span{font-size:50px;line-height:1.25}
.cita{font-weight:400;font-style:italic;font-size:76px;line-height:1.2}.quien{font-family:Plex;font-size:42px;margin-top:50px;color:${oscuro ? '#B9C4D0' : '#3d4f66'}}`;

function pantalla(p, tag) {
  const t = tag ? `<div class="tag">${esc(tag)}</div>` : '';
  if (p.lista) return `${t}<div class="mid">${esc(p.titulo)}</div><div class="lista">${p.lista.map(([e, v]) => `<div class="item"><b>${esc(e)}</b><span>${esc(v)}</span></div>`).join('')}</div>`;
  if (p.cita) return `${t}<div class="bar"></div><div class="cita">«${esc(p.cita)}»</div><div class="quien">${esc(p.quien)}</div>`;
  if (p.cierre) return `<div class="bar"></div><div class="big">${esc(p.cierre)}</div><div class="sub">El link está en mi bio.</div><div class="pie">laexperienciaeselcodigo.com</div>`;
  return `${t}${p.barra ? '<div class="bar"></div>' : ''}<div class="${p.grande ? 'big' : 'mid'}">${esc(p.texto)}</div>${p.sub ? `<div class="sub">${esc(p.sub)}</div>` : ''}`;
}

const datos = JSON.parse(readFileSync(join(SALIDA, 'reels.json'), 'utf8'));
const solo = process.argv[2];
mkdirSync(SALIDA, { recursive: true });
const navegador = await chromium.launch();
const page = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + PLANTILLA);
for (const [n, r] of datos.reels.entries()) {
  if (solo && r.id !== solo) continue;
  const tmp = join(tmpdir(), 'reel-' + r.id); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp);
  const dur = [];
  for (const [i, p] of r.pantallas.entries()) {
    await page.setContent(`<style>${css(r.oscuro)}</style>${pantalla(p, i === 0 ? r.tag : p.tag)}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(tmp, `s${i}.png`) });
    const palabras = Object.values(p).flat(2).join(' ').split(/\s+/).length;
    dur.push(p.seg ?? Math.min(6.5, Math.max(2.8, 1.2 + palabras * 0.3)));
  }
  const X = 0.4, entradas = [], filtros = [];
  dur.forEach((d, i) => entradas.push('-loop', '1', '-t', d.toFixed(2), '-i', join(tmp, `s${i}.png`)));
  let previo = '[0]', t = 0;
  for (let i = 1; i < dur.length; i++) {
    t += dur[i - 1] - X; const sal = i === dur.length - 1 ? '[x]' : `[v${i}]`;
    filtros.push(`${previo}[${i}]xfade=transition=fade:duration=${X}:offset=${t.toFixed(2)}${sal}`); previo = sal;
  }
  const total = t + dur.at(-1);
  const archivo = join(SALIDA, `${String(n + 1).padStart(2, '0')}-${r.id}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-f', 'lavfi', '-t', total.toFixed(2), '-i', 'anullsrc=r=44100:cl=stereo',
    '-filter_complex', filtros.join(';') + ';[x]format=yuv420p,fps=30[v]', '-map', '[v]', '-map', `${dur.length}:a`, '-shortest',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', archivo]);
  rmSync(tmp, { recursive: true, force: true });
  console.log(`${archivo.replace(RAIZ, '')}  ${total.toFixed(1)} s`);
}
await navegador.close();
