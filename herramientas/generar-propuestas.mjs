// Genera propuestas/<slug>/index.html (diseño premium por rubro) y un JSON con links para Bigin.
// Uso: node herramientas/generar-propuestas.mjs [ruta-json-salida]
// Datos de cada negocio: propuestas-datos.mjs · Textos, colores y fotos por rubro: propuestas-rubros.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE, PAGO, WSP_DANIEL, NEGOCIOS } from './propuestas-datos.mjs';
import { RUBROS_PRO, U } from './propuestas-rubros.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const digitos = t => t.replace(/\D/g, '');
const esMovil = t => /^\+56 9/.test(t || '');
const nota = n => n.toFixed(1).replace('.', ',');
const q = s => encodeURIComponent(s).replace(/%20/g, '+');
export const CUOTAS = '12 cuotas precio contado con Mercado Pago';

const ICONOS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-wa" viewBox="0 0 24 24"><path fill="currentColor" d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01Zm-7.01 15.24h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.24 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z"/></symbol>
<symbol id="i-tel" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/></symbol>
<symbol id="i-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></symbol>
</svg>`;

function estilos(r) {
  return `:root{--ink:#0b1720;--ink2:#46576a;--muted:#7a8a99;--line:#e3e9ef;--bg:#fff;--soft:#f4f6f8;--brand:${r.color};--brand-dk:${r.oscuro};--brand-lt:${r.claro};--hi:${r.acento2};--accent:#ff8a3d;--wa:#25d366;--mp:#009ee3;--r:22px;--sh:0 30px 60px -30px rgba(11,23,32,.35);--serif:"Fraunces",Georgia,serif}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font-family:Manrope,system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit}.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;font-weight:700;border-radius:14px;padding:15px 24px;font-size:15.5px;transition:transform .2s,box-shadow .2s,background .2s;border:0}
.btn:hover{transform:translateY(-2px)}.btn svg{width:20px;height:20px;flex:none}
.wa{background:var(--wa);color:#04351a;box-shadow:0 14px 30px -14px rgba(37,211,102,.8)}
.prim{background:#fff;color:var(--brand-dk)}
.ghost{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.35);backdrop-filter:blur(8px)}
.line{background:transparent;border:1.5px solid var(--line);color:var(--ink)}
.dir{background:var(--ink);color:#fff}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--brand);margin:0}
.eyebrow:before{content:"";width:22px;height:2px;background:currentColor}
h2.t{font-family:var(--serif);font-weight:600;font-size:clamp(30px,4.4vw,52px);line-height:1.06;letter-spacing:-.02em;margin:14px 0}
p.s{color:var(--ink2);font-size:17.5px;max-width:34em;margin:0}
.cinta{background:#081117;color:#cfe0ea;font-size:13px;position:relative;z-index:30}
.cinta .wrap{display:flex;gap:12px;align-items:center;justify-content:space-between;padding-top:9px;padding-bottom:9px}
.cinta b{color:#fff}.cinta a{background:var(--accent);color:#1d0d00;text-decoration:none;font-weight:800;padding:6px 14px;border-radius:999px;font-size:12px;white-space:nowrap}
.nav{position:absolute;left:0;right:0;z-index:20;padding:20px 0;transition:background .3s,padding .3s}
.nav.fija{position:fixed;top:0;background:rgba(255,255,255,.94);backdrop-filter:blur(14px);padding:12px 0;box-shadow:0 1px 0 var(--line)}
.nav .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px}
.logo{display:flex;align-items:center;gap:11px;text-decoration:none;color:#fff;font-weight:800;font-size:18px;letter-spacing:-.01em;min-width:0}
.logo span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nav.fija .logo{color:var(--ink)}
.logo i{width:38px;height:38px;border-radius:12px;background:#fff;color:var(--brand);display:grid;place-items:center;font-style:normal;font-family:var(--serif);font-size:20px;flex:none}
.nav.fija .logo i{background:var(--brand);color:#fff}
.menu{display:flex;gap:28px;font-size:14.5px;font-weight:600}
.menu a{text-decoration:none;color:rgba(255,255,255,.88)}.nav.fija .menu a{color:var(--ink2)}
.nav .btn{padding:11px 18px;font-size:14.5px;flex:none}
.hero{position:relative;min-height:min(92vh,860px);display:flex;align-items:flex-end;color:#fff;background:var(--brand-dk) center/cover no-repeat;isolation:isolate}
.hero:before{content:"";position:absolute;inset:0;background:linear-gradient(100deg,rgba(8,17,23,.93) 0%,rgba(8,17,23,.72) 45%,rgba(8,17,23,.25) 100%);z-index:-1}
.hero .wrap{width:100%;padding-top:150px;padding-bottom:70px;display:grid;grid-template-columns:1.3fr .7fr;gap:40px;align-items:end}
.chip{display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);backdrop-filter:blur(8px);padding:7px 14px 7px 8px;border-radius:999px;font-size:13.5px;font-weight:600}
.chip b{background:var(--accent);color:#1d0d00;border-radius:999px;padding:2px 9px;font-size:12px}
.hero h1{font-family:var(--serif);font-weight:600;font-size:clamp(42px,7vw,88px);line-height:.98;letter-spacing:-.03em;margin:22px 0 20px}
.hero h1 em{font-style:italic;color:var(--hi)}
.hero p.lead{font-size:clamp(17px,1.6vw,20px);color:rgba(255,255,255,.86);max-width:31em;margin:0 0 32px}
.ctas{display:flex;gap:12px;flex-wrap:wrap}
.panel{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(14px);border-radius:var(--r);padding:24px}
.panel .big{font-family:var(--serif);font-size:64px;line-height:1;font-weight:600}
.stars{color:#ffc24b;letter-spacing:3px;font-size:17px}
.panel p{margin:6px 0 0;color:rgba(255,255,255,.8);font-size:14px}
.panel hr{border:0;border-top:1px solid rgba(255,255,255,.18);margin:18px 0}
.panel ul{list-style:none;padding:0;margin:0;display:grid;gap:10px;font-size:14.5px}
.panel li{display:flex;gap:10px;align-items:flex-start}.panel li svg{width:18px;height:18px;color:var(--hi);flex:none;margin-top:3px}
.franja{background:var(--ink);color:#fff}
.franja .wrap{display:grid;grid-template-columns:repeat(4,1fr)}
.franja .d{padding:28px 24px;border-left:1px solid rgba(255,255,255,.1)}.franja .d:first-child{border-left:0;padding-left:0}
.franja b{display:block;font-family:var(--serif);font-size:28px;font-weight:600;line-height:1.2}
.franja span{font-size:13px;color:#9fb4c3;font-weight:600}
section.b{padding:110px 0}
.cab{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;margin-bottom:46px;flex-wrap:wrap}
.servicios{display:grid;grid-template-columns:repeat(2,1fr);gap:22px}
.serv{position:relative;border-radius:var(--r);overflow:hidden;min-height:380px;display:flex;align-items:flex-end;color:#fff;background:var(--brand-dk) center/cover no-repeat;isolation:isolate;box-shadow:var(--sh)}
.serv:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,17,23,.05) 30%,rgba(8,17,23,.9) 100%);z-index:-1}
.serv .in{padding:28px}.serv .num{font-size:12.5px;font-weight:800;letter-spacing:.14em;color:var(--hi)}
.serv h3{font-family:var(--serif);font-weight:600;font-size:30px;margin:8px 0;line-height:1.1}
.serv p{margin:0;color:rgba(255,255,255,.86);font-size:15.5px;max-width:28em}
.nota-fotos{font-size:12px;color:var(--muted);margin-top:14px}
.split{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}
.foto{position:relative}
.foto .img{aspect-ratio:4/5;border-radius:28px;background:var(--brand-lt) center/cover no-repeat;box-shadow:var(--sh)}
.foto .badge{position:absolute;right:-22px;bottom:40px;background:#fff;border-radius:18px;padding:18px 20px;box-shadow:var(--sh);display:flex;gap:14px;align-items:center;max-width:280px}
.foto .badge i{width:46px;height:46px;border-radius:14px;background:var(--brand-lt);color:var(--brand);display:grid;place-items:center;flex:none}
.foto .badge i svg{width:22px;height:22px}
.foto .badge b{display:block;font-size:15px}.foto .badge span{font-size:13px;color:var(--muted)}
.pasos{margin-top:34px}
.paso{display:grid;grid-template-columns:54px 1fr;gap:16px;padding:18px 0;border-bottom:1px solid var(--line)}.paso:last-child{border-bottom:0}
.paso .n{width:54px;height:54px;border-radius:16px;background:var(--soft);display:grid;place-items:center;font-family:var(--serif);font-size:22px;color:var(--brand);font-weight:600}
.paso h3{margin:4px 0 2px;font-size:18px}.paso p{margin:0;color:var(--ink2);font-size:15px}
.resenas{background:var(--soft)}
.rgrid{display:grid;grid-template-columns:.8fr 1.2fr;gap:24px}
.rbig{background:var(--brand);color:#fff;border-radius:var(--r);padding:38px;display:flex;flex-direction:column;justify-content:space-between;min-height:320px;position:relative;overflow:hidden}
.rbig:after{content:"“";position:absolute;right:20px;top:-40px;font-family:var(--serif);font-size:260px;color:rgba(255,255,255,.08);line-height:1}
.rbig .big{font-family:var(--serif);font-size:96px;line-height:.9;font-weight:600}
.rbig p{color:rgba(255,255,255,.86);margin:10px 0 0}
.rbig a{color:#fff;font-weight:700;font-size:14px;position:relative;z-index:1}
.rtexto{display:grid;gap:16px;align-content:start}
.rcard{background:#fff;border-radius:18px;padding:28px;border:1px solid var(--line)}
.rcard blockquote{margin:0;font-family:var(--serif);font-size:24px;line-height:1.3}
.rcard cite{display:block;margin-top:12px;font-style:normal;font-size:13px;color:var(--muted);font-weight:600}
.rcard p{margin:0;color:var(--ink2);font-size:17px}
.rcard h3{margin:0 0 8px;font-size:15px;color:var(--brand);text-transform:uppercase;letter-spacing:.1em}
.faq{max-width:820px}
details{border-bottom:1px solid var(--line);padding:22px 0}
summary{list-style:none;cursor:pointer;font-weight:700;font-size:18px;display:flex;justify-content:space-between;gap:20px;align-items:center}
summary::-webkit-details-marker{display:none}
summary:after{content:"+";font-size:26px;font-weight:400;color:var(--brand);transition:transform .2s}
details[open] summary:after{transform:rotate(45deg)}
details p{margin:12px 0 0;color:var(--ink2);font-size:16px}
.mapa{position:relative;height:580px;background:var(--soft)}
.mapa iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.mapa .card{position:absolute;left:max(24px,calc((100vw - 1180px)/2 + 24px));top:50%;transform:translateY(-50%);background:#fff;border-radius:var(--r);padding:32px;width:min(410px,calc(100% - 48px));box-shadow:0 40px 80px -30px rgba(11,23,32,.45)}
.card h2{font-family:var(--serif);font-weight:600;font-size:32px;margin:10px 0;line-height:1.1}
.card p{margin:0 0 18px;color:var(--ink2)}
.card table{width:100%;border-collapse:collapse;font-size:15px;margin-bottom:22px}
.card td{padding:8px 0;border-bottom:1px solid var(--line);vertical-align:top}.card td:last-child{text-align:right;font-weight:700;padding-left:12px}
.card .acc{display:flex;gap:10px;flex-wrap:wrap}.card .btn{padding:13px 18px;font-size:14.5px}
.cta{padding:110px 0;background:var(--ink) center/cover no-repeat;position:relative;isolation:isolate;color:#fff;text-align:center}
.cta:before{content:"";position:absolute;inset:0;background:rgba(8,17,23,.82);z-index:-1}
.cta h2{font-family:var(--serif);font-weight:600;font-size:clamp(34px,5vw,60px);line-height:1.05;margin:0 0 16px;letter-spacing:-.02em}
.cta p{color:rgba(255,255,255,.8);font-size:18px;margin:0 0 30px}
footer.pie{background:#081117;color:#8ea3b2;font-size:13.5px}
footer.pie .wrap{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:26px;padding-bottom:26px}
.flota{position:fixed;right:22px;bottom:22px;z-index:40;display:flex;align-items:center;gap:10px;transition:opacity .3s,transform .3s}
.flota.oculto{opacity:0;transform:translateY(20px);pointer-events:none}
.flota span{background:#fff;color:var(--ink);font-weight:700;font-size:13.5px;padding:9px 14px;border-radius:12px;box-shadow:var(--sh);white-space:nowrap}
.flota a{width:62px;height:62px;border-radius:50%;background:var(--wa);display:grid;place-items:center;box-shadow:0 14px 30px -10px rgba(18,140,75,.8);position:relative}
.flota a.tel{background:var(--brand)}
.flota a svg{width:30px;height:30px;color:#fff}
.flota a:after{content:"";position:absolute;inset:-7px;border-radius:50%;border:2px solid var(--wa);animation:pulso 2.2s infinite}
.flota a.tel:after{border-color:var(--brand)}
@keyframes pulso{0%{transform:scale(.9);opacity:.7}100%{transform:scale(1.3);opacity:0}}
.plan{background:linear-gradient(180deg,#081117 0,#081117 260px,var(--soft) 260px);padding:0 0 100px}
.plan .titulo{color:#fff;text-align:center;padding:56px 0 34px}.plan .titulo b{color:var(--accent);font-weight:600}
.pgrid{display:grid;grid-template-columns:1.15fr .85fr;gap:22px}
.pcard{background:#fff;border-radius:var(--r);padding:36px;box-shadow:var(--sh)}.pcard.dest{border:2px solid var(--brand)}
.pcard h2{font-family:var(--serif);font-weight:600;font-size:34px;margin:10px 0 4px;line-height:1.1}
.precio{font-size:58px;font-weight:800;letter-spacing:-.03em;margin:14px 0 0;line-height:1}
.precio small{font-size:17px;font-weight:600;color:var(--muted);letter-spacing:0}
.cuotas{display:inline-block;margin-top:12px;background:#e6f6fd;color:#006a99;font-weight:800;font-size:14.5px;padding:7px 14px;border-radius:999px}
.lista{list-style:none;padding:0;margin:24px 0 26px;display:grid;gap:12px}
.lista li{display:flex;gap:12px;font-size:15.5px}
.lista li:before{content:"✓";width:22px;height:22px;flex:none;border-radius:50%;background:var(--brand-lt);color:var(--brand);display:grid;place-items:center;font-size:12px;font-weight:800;margin-top:1px}
.mp{background:var(--mp);color:#fff;width:100%;font-size:17px;padding:17px}.mp:hover{background:#0089c7}
.chico{font-size:13px;color:var(--muted);text-align:center;margin:12px 0 0}
.porque h3{margin:0 0 18px;font-size:20px}
.porque .r{display:flex;gap:14px;margin-bottom:18px;font-size:15px;color:var(--ink2)}
.porque .r b{color:var(--ink);display:block;font-size:15.5px}
.porque .n{width:34px;height:34px;border-radius:10px;background:var(--brand-lt);color:var(--brand-dk);display:grid;place-items:center;font-weight:800;flex:none}
.porque .btn{width:100%;margin-top:6px}
.rev{opacity:0;transform:translateY(28px);transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1)}.rev.vis{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.rev{opacity:1;transform:none;transition:none}.flota a:after{animation:none}}
@media (max-width:940px){.menu{display:none}.hero .wrap{grid-template-columns:1fr;padding-top:130px;padding-bottom:44px}
.franja .wrap{grid-template-columns:1fr 1fr;column-gap:24px}.franja .d{padding:20px 0;border-left:0;border-top:1px solid rgba(255,255,255,.1)}.franja .d:nth-child(-n+2){border-top:0}
section.b{padding:72px 0}.servicios,.split,.rgrid,.pgrid{grid-template-columns:1fr}.split{gap:44px}.foto .badge{right:12px}.serv{min-height:320px}
.mapa{height:auto;display:flex;flex-direction:column}.mapa iframe{position:relative;height:340px}
.mapa .card{position:relative;left:auto;top:auto;transform:none;width:auto;margin:0;border-radius:0;box-shadow:none}
.flota span{display:none}.pcard{padding:26px}.precio{font-size:46px}.plan{background:linear-gradient(180deg,#081117 0,#081117 300px,var(--soft) 300px)}}
@media (max-width:520px){.nav .btn span{display:none}.cinta .txt{font-size:12px}.logo{font-size:16px}}`;
}

function filasHorario(h) {
  if (!h) return [];
  return h.split(' · ').map(t => {
    const m = t.match(/^(.*?)\s(\d{1,2}:\d{2}\sa\s\d{1,2}:\d{2}.*)$/);
    return m ? [m[1], m[2]] : ['Horario', t];
  });
}

export function pagina(n) {
  const r = RUBROS_PRO[n.rubro];
  const nom = esc(n.nombre);
  const movil = esMovil(n.tel);
  const urlWa = movil ? `https://wa.me/${digitos(n.tel)}` : null;
  const urlTel = n.tel ? `tel:+${digitos(n.tel)}` : null;
  const lugar = `${n.nombre}, ${n.dir}, ${n.comuna}, Santiago, Chile`;
  const urlDir = `https://www.google.com/maps/dir/?api=1&destination=${q(lugar)}`;
  const urlMaps = `https://www.google.com/maps/search/?api=1&query=${q(n.nombre + ' ' + n.comuna)}`;
  const embed = `https://www.google.com/maps?q=${q(lugar)}&z=16&output=embed`;
  // Acción principal según el contacto disponible
  const acc = movil ? { url: urlWa, ico: 'i-wa', txt: 'Escríbenos por WhatsApp', corto: 'WhatsApp', cls: 'wa' }
    : n.tel ? { url: urlTel, ico: 'i-tel', txt: `Llama al ${n.tel}`, corto: 'Llamar', cls: 'wa' }
    : { url: urlDir, ico: 'i-pin', txt: 'Cómo llegar', corto: 'Cómo llegar', cls: 'wa' };
  const boton = (t, extra = '') => `<a class="btn ${acc.cls} ${extra}" href="${acc.url}"><svg><use href="#${acc.ico}"/></svg>${t}</a>`;
  const horario = filasHorario(n.horario);
  const conNota = !!n.nota;

  const panel = conNota
    ? `<div class="big">${nota(n.nota)}</div><div class="stars">★★★★★</div><p>Promedio de ${n.resenas} reseñas en Google</p><hr><ul>
${horario.slice(0, 2).map(([a, b]) => `<li><svg><use href="#i-ok"/></svg>${esc(a)}: ${esc(b)}</li>`).join('')}
<li><svg><use href="#i-ok"/></svg>${esc(n.dir)}, ${esc(n.comuna)}</li></ul>`
    : `<p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Atención</p><ul style="margin-top:14px">
${horario.map(([a, b]) => `<li><svg><use href="#i-ok"/></svg>${esc(a)}: ${esc(b)}</li>`).join('')}
<li><svg><use href="#i-ok"/></svg>${esc(n.dir)}, ${esc(n.comuna)}</li></ul>`;

  const franja = [
    conNota ? [`${nota(n.nota)} ★`, 'Nota en Google'] : [r.tipo.split(' ')[0], 'Servicio profesional'],
    conNota ? [String(n.resenas), 'Reseñas en Google'] : ['Pymes', 'Y personas'],
    [esc(n.comuna), esc(n.dir)],
    [movil ? 'WhatsApp' : n.tel ? 'Teléfono' : 'Visítanos', movil || n.tel ? esc(n.tel) : 'Atención presencial'],
  ];

  const resenas = conNota ? `
<section class="b resenas" id="resenas"><div class="wrap">
  <div class="cab rev"><div><p class="eyebrow">Reseñas</p><h2 class="t">Lo que dicen<br>de nosotros.</h2></div>
  <p class="s">Resumen de las reseñas públicas de ${nom} en Google.</p></div>
  <div class="rgrid">
    <div class="rbig rev"><div><div class="big">${nota(n.nota)}</div><div class="stars">★★★★★</div><p>Promedio de ${n.resenas} reseñas en Google</p></div>
    <a href="${urlMaps}">Ver reseñas en Google →</a></div>
    <div class="rtexto">
      ${n.cita ? `<div class="rcard rev"><blockquote>“${esc(n.cita)}”</blockquote><cite>Reseña en Google</cite></div>` : ''}
      <div class="rcard rev"><h3>Lo que más destacan</h3><p>${esc(n.resumen)}</p></div>
    </div>
  </div>
</div></section>` : '';

  const faqs = [
    [`¿Cómo ${r.unidad === 'paciente' ? 'pido hora' : 'agendo'}?`, movil ? 'Escríbenos por WhatsApp y coordinamos tu hora.' : n.tel ? `Llámanos al ${esc(n.tel)} y coordinamos tu hora.` : 'Visítanos en nuestro local y te atendemos.'],
    ['¿Dónde están?', `En ${esc(n.dir)}, ${esc(n.comuna)}. Más abajo tienes el mapa con cómo llegar.`],
    ...(n.horario ? [['¿Qué horario tienen?', esc(n.horario) + '.']] : []),
  ];

  const filasTabla = horario.length ? `<table>${horario.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>` : '';
  const flota = movil ? `<div class="flota" id="flota"><span>¿Hablamos por WhatsApp?</span><a href="${urlWa}" aria-label="WhatsApp de ${nom}"><svg><use href="#i-wa"/></svg></a></div>`
    : n.tel ? `<div class="flota" id="flota"><span>Llámanos</span><a class="tel" href="${urlTel}" aria-label="Llamar a ${nom}"><svg><use href="#i-tel"/></svg></a></div>` : '';
  const msgDaniel = encodeURIComponent(`Hola Daniel, vi la propuesta de página web para ${n.nombre}. Me interesa.`);
  const inicial = esc(n.nombre.replace(/^(Centro|Clínica|Barbería|Peluquería|Mecánica|Servicio|The|La|Le)\s+/i, '').charAt(0).toUpperCase());

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Propuesta de página web · ${nom}</title>
<meta property="og:title" content="Propuesta de página web para ${nom}">
<meta property="og:description" content="Así se vería su sitio web. $250.000 por un año, en ${CUOTAS}.">
<meta property="og:image" content="${U(r.hero, 1200, 70)}&h=630">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${estilos(r)}
.hero{background-image:url("${U(r.hero, 2000)}")}.foto .img{background-image:url("${U(r.split)}")}.cta{background-image:url("${U(r.cta, 2000, 60)}")}
${r.servicios.map((s, i) => `.s${i + 1}{background-image:url("${U(s[2])}")}`).join('')}</style></head>
<body>
${ICONOS}
<div class="cinta"><div class="wrap"><span class="txt"><b>Propuesta para ${nom}</b> · así se vería su sitio web</span><a href="#plan">Ver precio</a></div></div>

<header class="nav" id="nav"><div class="wrap">
  <a class="logo" href="#"><i>${inicial}</i><span>${nom}</span></a>
  <nav class="menu"><a href="#servicios">Servicios</a><a href="#metodo">Cómo trabajamos</a>${conNota ? '<a href="#resenas">Reseñas</a>' : ''}<a href="#ubicacion">Ubicación</a></nav>
  <a class="btn wa" href="${acc.url}"><svg><use href="#${acc.ico}"/></svg><span>${acc.corto}</span></a>
</div></header>

<section class="hero"><div class="wrap">
  <div>
    <span class="chip">${conNota ? `<b>★ ${nota(n.nota)}</b>${n.resenas} reseñas en Google · ` : '<b>Atención</b>'}${esc(r.tipo)} en ${esc(n.comuna)}</span>
    <h1>${r.h1}</h1>
    <p class="lead">${r.lead}</p>
    <div class="ctas">${boton(acc.txt)}<a class="btn ghost" href="#servicios">Ver servicios</a></div>
  </div>
  <div class="panel">${panel}</div>
</div></section>

<div class="franja"><div class="wrap">${franja.map(([a, b]) => `<div class="d"><b>${a}</b><span>${b}</span></div>`).join('')}</div></div>

<section class="b" id="servicios"><div class="wrap">
  <div class="cab rev"><div><p class="eyebrow">Servicios</p><h2 class="t">${r.servTitulo}</h2></div><p class="s">${r.servSub}</p></div>
  <div class="servicios">${r.servicios.map((s, i) => `<article class="serv s${i + 1} rev"><div class="in"><span class="num">0${i + 1}</span><h3>${s[0]}</h3><p>${s[1]}</p></div></article>`).join('')}</div>
  <p class="nota-fotos">Fotos y servicios referenciales: en el sitio final se usan fotos de su local y su lista real de servicios.</p>
</div></section>

<section class="b" id="metodo" style="padding-top:20px"><div class="wrap split">
  <div class="foto rev"><div class="img" role="img" aria-label="${esc(r.tipo)}"></div>
  <div class="badge"><i><svg><use href="#i-ok"/></svg></i><div><b>${r.badge[0]}</b><span>${r.badge[1]}</span></div></div></div>
  <div class="rev"><p class="eyebrow">Cómo trabajamos</p><h2 class="t">${r.metodoTitulo}</h2><p class="s">${r.metodoSub}</p>
  <div class="pasos">${r.pasos.map((p, i) => `<div class="paso"><span class="n">${i + 1}</span><div><h3>${p[0]}</h3><p>${p[1]}</p></div></div>`).join('')}</div></div>
</div></section>
${resenas}
<section class="b"><div class="wrap">
  <div class="rev"><p class="eyebrow">Preguntas frecuentes</p><h2 class="t">Antes de tu visita</h2></div>
  <div class="faq rev">${faqs.map(([a, b], i) => `<details${i === 0 ? ' open' : ''}><summary>${a}</summary><p>${b}</p></details>`).join('')}</div>
</div></section>

<section class="mapa" id="ubicacion">
  <iframe title="Mapa de ${nom}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${embed}"></iframe>
  <div class="card"><p class="eyebrow">Ubicación</p><h2>Te esperamos en ${esc(n.comuna)}</h2><p>${esc(n.dir)}, ${esc(n.comuna)}, Santiago.</p>${filasTabla}
  <div class="acc"><a class="btn dir" href="${urlDir}">Cómo llegar</a>${movil || n.tel ? `<a class="btn wa" href="${acc.url}"><svg><use href="#${acc.ico}"/></svg>${acc.corto}</a>` : ''}</div></div>
</section>

<section class="cta"><div class="wrap rev"><h2>${r.cierre}</h2><p>${movil ? 'Escríbenos y te respondemos.' : n.tel ? 'Llámanos y coordinamos.' : 'Te esperamos en nuestro local.'}</p>${boton(acc.txt)}</div></section>

<footer class="pie"><div class="wrap"><span>© 2026 ${nom} · ${esc(n.dir)}, ${esc(n.comuna)}</span><span>${n.tel ? esc(n.tel) : ''}</span></div></footer>
${flota}

<section class="plan" id="plan"><div class="wrap">
  <div class="titulo"><p class="eyebrow" style="color:var(--hi)">Propuesta comercial</p><h2 class="t" style="color:#fff;margin-top:8px">Este sitio puede ser suyo <b>esta semana</b>.</h2></div>
  <div class="pgrid">
    <div class="pcard dest"><p class="eyebrow">Plan anual</p><h2>Sitio web profesional para ${nom}</h2>
      <p class="precio">$250.000 <small>por un año</small></p><span class="cuotas">${CUOTAS}</span>
      <ul class="lista">
        <li>Dominio .cl a su nombre (sugerido: ${esc(n.dominio)}, sujeto a disponibilidad)</li>
        <li>Diseño como este, adaptado a celular, tablet y computador</li>
        <li>${movil ? 'Botón de WhatsApp flotante' : 'Botón de contacto flotante'} y mapa de Google con cómo llegar</li>
        <li>Fotos de su local${conNota ? ', reseñas' : ''} y horario</li>
        <li>Correo de contacto con su dominio</li>
        <li>Publicado en 5 días hábiles y 2 cambios al mes incluidos</li>
      </ul>
      <a class="btn mp" href="${PAGO}">Pagar con Mercado Pago</a>
      <p class="chico">Fotos, textos y servicios se ajustan con ustedes antes de publicar.</p></div>
    <div class="pcard porque"><h3>Por qué una web propia</h3>
      <div class="r"><span class="n">1</span><span><b>Aparecen en Google</b>Quien busca “${r.busqueda} ${esc(n.comuna)}” encuentra su sitio, no solo la ficha.</span></div>
      <div class="r"><span class="n">2</span><span><b>Más consultas</b>${movil ? 'Un toque desde cualquier sección y les escriben por WhatsApp.' : 'Teléfono, mapa y horario a un toque desde el celular.'}</span></div>
      <div class="r"><span class="n">3</span><span>${conNota ? `<b>Sus ${n.resenas} reseñas venden por ustedes</b>La confianza que ya ganaron, visible para ${r.unidad}s nuevos.` : '<b>Confianza desde el primer clic</b>Un sitio profesional transmite seriedad antes del primer contacto.'}</span></div>
      <div class="r"><span class="n">4</span><span><b>Menos de $21.000 al mes</b>Con un ${r.unidad} nuevo al año, el sitio ya se pagó.</span></div>
      <a class="btn line" href="https://wa.me/${WSP_DANIEL}?text=${msgDaniel}">¿Dudas? Escríbale a Daniel</a></div>
  </div>
</div></section>

<script>
(function(){
  var nav=document.getElementById('nav'),hero=document.querySelector('.hero');
  function onScroll(){nav.classList.toggle('fija',window.scrollY>hero.offsetTop+hero.offsetHeight-90);}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  var f=document.getElementById('flota'),plan=document.getElementById('plan');
  if('IntersectionObserver' in window){
    if(f)new IntersectionObserver(function(e){f.classList.toggle('oculto',e[0].isIntersecting)},{threshold:.1}).observe(plan);
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vis');io.unobserve(e.target);}})},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.rev').forEach(function(el){io.observe(el)});
  }else{document.querySelectorAll('.rev').forEach(function(el){el.classList.add('vis')});}
})();
</script>
</body></html>`;
}

function mensaje(n) {
  const url = BASE + n.slug + '/';
  const prueba = n.nota ? `tienen ${n.resenas} reseñas en Google con nota ${nota(n.nota)}` : 'están en Google Maps';
  return `Hola, ¿hablo con ${n.nombre}? Soy Daniel, vivo en el sector. Vi que ${prueba} y les armé una propuesta de página web con sus datos: ${url}\n\nSi les gusta, la dejo publicada con dominio .cl por $250.000 el año, en 12 cuotas precio contado.\n\nSi no le interesa, responda NO y no le escribo más.`;
}

const salida = [];
for (const n of NEGOCIOS) {
  const dir = join('propuestas', n.slug);
  mkdirSync(dir, { recursive: true });
  if (!n.custom) writeFileSync(join(dir, 'index.html'), pagina(n)); // custom = página hecha a mano, no se sobrescribe
  const wa = esMovil(n.tel) ? `https://wa.me/${digitos(n.tel)}?text=${encodeURIComponent(mensaje(n))}` : null;
  salida.push({ id: n.id, nombre: n.nombre, url: BASE + n.slug + '/', wa, tel: n.tel });
}
writeFileSync(process.argv[2] || 'propuestas-bigin.json', JSON.stringify(salida, null, 1));
console.log(`${salida.length} propuestas (${salida.filter(s => s.wa).length} con WhatsApp)`);
