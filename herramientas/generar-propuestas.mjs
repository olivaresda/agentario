// Genera propuestas/<slug>/index.html y propuestas-bigin.json (para actualizar las fichas de Bigin).
// Uso: node herramientas/generar-propuestas.mjs [carpeta-salida-json]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE, PAGO, WSP_DANIEL, RUBROS, NEGOCIOS } from './propuestas-datos.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const digitos = t => t.replace(/\D/g, '');
const esMovil = t => /^\+56 9/.test(t);
const nota = n => n.toFixed(1).replace('.', ',');

function pagina(n) {
  const r = RUBROS[n.rubro];
  const url = BASE + n.slug + '/';
  const msgDaniel = encodeURIComponent(`Hola Daniel, vi la propuesta de página web para ${n.nombre}. Me interesa.`);
  const contacto = !n.tel ? '' : esMovil(n.tel)
    ? `<a class="btn verde" href="https://wa.me/${digitos(n.tel)}">Cotizar por WhatsApp</a>`
    : `<a class="btn verde" href="tel:${digitos(n.tel)}">Llamar al ${esc(n.tel)}</a>`;
  const estrellas = n.nota ? `<p class="estrellas">★ ${nota(n.nota)} · ${n.resenas} reseñas en Google</p>` : '';
  const cita = n.cita ? `<blockquote>“${esc(n.cita)}”<span>Reseña en Google</span></blockquote>` : '';
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Propuesta de página web · ${esc(n.nombre)}</title>
<meta property="og:title" content="Propuesta de página web para ${esc(n.nombre)}">
<meta property="og:description" content="Así se vería su página, con sus datos y reseñas de Google. $250.000 por un año, hasta 12 cuotas.">
<style>
:root{--tx:#1d1d1b;--tx2:#5f5e5a;--bg:#f6f5f1;--card:#fff;--line:#e3e1da;--acc:#0f6e56;--acc-bg:#e1f5ee;--azul:#185fa5}
@media (prefers-color-scheme:dark){:root{--tx:#f1efe8;--tx2:#b4b2a9;--bg:#1b1b1a;--card:#262624;--line:#3a3936;--acc:#5dcaa5;--acc-bg:#11352b;--azul:#85b7eb}}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--tx);line-height:1.55}
main{max-width:560px;margin:0 auto;padding:24px 16px 48px}
.eyebrow{font-size:13px;color:var(--tx2);margin:0}h1{font-size:24px;margin:2px 0 6px;line-height:1.25}.intro{color:var(--tx2);margin:0 0 20px;font-size:15px}
.marco{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.barra{font-size:12px;color:var(--tx2);padding:8px 14px;border-bottom:1px solid var(--line)}
.hero{background:var(--acc-bg);padding:22px 18px}.hero h2{margin:0;font-size:21px;color:var(--acc)}.hero p{margin:2px 0 0;color:var(--acc);font-size:14px}
.estrellas{margin-top:10px!important;font-weight:600}
.btn{display:block;text-align:center;text-decoration:none;font-weight:600;border-radius:10px;padding:13px;margin-top:14px;font-size:15px}
.verde{background:var(--acc);color:#fff}.azul{background:var(--azul);color:#fff}
@media (prefers-color-scheme:dark){.verde,.azul{color:#111}}
.cuerpo{padding:18px}.cuerpo h3{font-size:15px;margin:18px 0 8px}.cuerpo h3:first-child{margin-top:0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.grid div{background:var(--bg);border-radius:10px;padding:10px;font-size:14px}
blockquote{margin:0 0 8px;border-left:3px solid var(--acc);padding:4px 12px;font-family:Georgia,serif;font-size:16px}blockquote span{display:block;font-family:system-ui,sans-serif;font-size:12px;color:var(--tx2);margin-top:4px}
.resumen,.dato{font-size:14px;color:var(--tx2);margin:0}
.plan{background:var(--card);border:2px solid var(--azul);border-radius:16px;padding:18px;margin-top:20px}
.precio{font-size:30px;font-weight:700;margin:2px 0 0}.precio small{font-size:14px;font-weight:400;color:var(--tx2)}.cuotas{margin:0;color:var(--azul);font-weight:600;font-size:14px}
.plan ul{padding:0;margin:14px 0 4px;list-style:none;font-size:14px}.plan li{padding:4px 0}.plan li:before{content:"✓ ";color:var(--acc);font-weight:700}
.nota{font-size:12px;color:var(--tx2);text-align:center;margin:10px 0 0}.wsp{display:block;text-align:center;margin-top:12px;color:var(--acc);font-weight:600;font-size:14px}
</style></head><body><main>
<p class="eyebrow">Propuesta para</p>
<h1>${esc(n.nombre)}</h1>
<p class="intro">Así se vería su página web, armada con sus datos y sus reseñas de Google.</p>
<div class="marco">
<div class="barra">🔒 ${esc(n.dominio)}</div>
<div class="hero"><h2>${esc(n.nombre)}</h2><p>${r.nombre} en ${esc(n.comuna)}</p>${estrellas}${contacto}</div>
<div class="cuerpo">
<h3>Servicios</h3><div class="grid">${r.servicios.map(s => `<div>${r.icono} ${s}</div>`).join('')}</div>
<h3>Lo que dicen sus clientes</h3>${cita}<p class="resumen">${esc(n.resumen)}</p>
<h3>Horario y ubicación</h3><p class="dato">${n.horario ? esc(n.horario) + '<br>' : ''}${esc(n.dir)}, ${esc(n.comuna)}</p>
</div></div>
<div class="plan">
<p class="eyebrow">Plan anual</p>
<p class="precio">$250.000 <small>por un año</small></p>
<p class="cuotas">Hasta 12 cuotas con Mercado Pago</p>
<ul>
<li>Dominio .cl a su nombre (sugerido: ${esc(n.dominio)}, sujeto a disponibilidad)</li>
<li>Botón de WhatsApp, mapa y horario</li>
<li>Correo de contacto con su dominio</li>
<li>Publicada en 5 días hábiles</li>
<li>2 cambios al mes incluidos</li>
</ul>
<a class="btn azul" href="${PAGO}">Pagar con Mercado Pago</a>
<p class="nota">Servicios, fotos y textos se ajustan con usted antes de publicar.</p>
<a class="wsp" href="https://wa.me/${WSP_DANIEL}?text=${msgDaniel}">¿Dudas? Escríbale a Daniel por WhatsApp</a>
</div>
</main></body></html>`;
}

function mensaje(n) {
  const url = BASE + n.slug + '/';
  const prueba = n.nota ? `tienen ${n.resenas} reseñas en Google con nota ${nota(n.nota)}` : 'están en Google Maps';
  return `Hola, ¿hablo con ${n.nombre}? Soy Daniel, vivo en el sector. Vi que ${prueba} y les armé una propuesta de página web con sus datos: ${url}\n\nSi les gusta, la dejo publicada con dominio .cl por $250.000 el año, en hasta 12 cuotas.\n\nSi no le interesa, responda NO y no le escribo más.`;
}

const salida = [];
for (const n of NEGOCIOS) {
  const dir = join('propuestas', n.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), pagina(n));
  const url = BASE + n.slug + '/';
  const wa = n.tel && esMovil(n.tel) ? `https://wa.me/${digitos(n.tel)}?text=${encodeURIComponent(mensaje(n))}` : null;
  salida.push({ id: n.id, nombre: n.nombre, url, wa, tel: n.tel });
}
writeFileSync(process.argv[2] || 'propuestas-bigin.json', JSON.stringify(salida, null, 1));
console.log(`${salida.length} propuestas generadas; ${salida.filter(s => s.wa).length} con link de WhatsApp`);
