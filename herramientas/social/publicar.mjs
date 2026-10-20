// Publica en X, LinkedIn e Instagram las propuestas aprobadas que están en social/cola/.
// Lo corre la acción .github/workflows/publicar-redes.yml cuando se aprueba (merge) una propuesta.
//
// Credenciales (Secrets de GitHub). Si faltan las de una red, esa red se omite:
//   X:         X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
//   LinkedIn:  LINKEDIN_TOKEN  [LINKEDIN_AUTOR=urn:li:person:… o urn:li:organization:…]  [LINKEDIN_VERSION=AAAAMM]
//   Instagram: IG_TOKEN  [IG_USER_ID]  [IG_VERSION=v24.0]
// Opciones: PRUEBA=1 (simula sin publicar) · REDES=x,linkedin (solo esas redes)
//
// Uso: node herramientas/social/publicar.mjs

import { readFileSync, renameSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createHmac, randomBytes } from 'node:crypto';
import {
  RAIZ, SOCIAL, REDES, archivosCola, leerJson, guardarJson, leerHistorial, guardarHistorial, largoX
} from './datos.mjs';

const E = process.env;
const PRUEBA = E.PRUEBA === '1' || E.PRUEBA === 'true';
const SOLO = (E.REDES || '').split(',').map(s => s.trim()).filter(Boolean);
const REPO = E.GITHUB_REPOSITORY || 'olivaresda/agentario';
const REF = E.GITHUB_SHA || 'main';
const urlPublica = ruta => `https://raw.githubusercontent.com/${REPO}/${REF}/${ruta}`;
const esperar = ms => new Promise(r => setTimeout(r, ms));

async function http(url, opciones = {}, { esperado = [200, 201], json = true } = {}) {
  const r = await fetch(url, opciones);
  const texto = await r.text();
  if (!esperado.includes(r.status)) throw new Error(`${opciones.method || 'GET'} ${url.split('?')[0]} → ${r.status}: ${texto.slice(0, 500)}`);
  return { respuesta: r, datos: json && texto ? JSON.parse(texto) : texto };
}

/* ======================= X (OAuth 1.0a de usuario) ======================= */
const credX = () => E.X_API_KEY && E.X_API_SECRET && E.X_ACCESS_TOKEN && E.X_ACCESS_SECRET;
const rfc3986 = s => encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());

function firmaX(metodo, url) {
  const u = new URL(url);
  const oauth = {
    oauth_consumer_key: E.X_API_KEY,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: E.X_ACCESS_TOKEN,
    oauth_version: '1.0'
  };
  const params = [...Object.entries(oauth), ...u.searchParams.entries()]
    .map(([k, v]) => [rfc3986(k), rfc3986(v)])
    .sort(([a, x], [b, y]) => (a === b ? x.localeCompare(y) : a.localeCompare(b)))
    .map(([k, v]) => `${k}=${v}`).join('&');
  const base = [metodo.toUpperCase(), rfc3986(u.origin + u.pathname), rfc3986(params)].join('&');
  const clave = `${rfc3986(E.X_API_SECRET)}&${rfc3986(E.X_ACCESS_SECRET)}`;
  oauth.oauth_signature = createHmac('sha1', clave).update(base).digest('base64');
  return 'OAuth ' + Object.entries(oauth).map(([k, v]) => `${rfc3986(k)}="${rfc3986(v)}"`).join(', ');
}

async function subirImagenX(ruta) {
  const bytes = readFileSync(join(RAIZ, ruta));
  const formulario = () => {
    const f = new FormData();
    f.append('media', new Blob([bytes], { type: 'image/jpeg' }), basename(ruta));
    f.append('media_category', 'tweet_image');
    return f;
  };
  try {
    const url = 'https://api.x.com/2/media/upload';
    const { datos } = await http(url, { method: 'POST', headers: { Authorization: firmaX('POST', url) }, body: formulario() });
    return datos.data.id;
  } catch (e) {
    // Respaldo: endpoint anterior de subida de medios.
    const url = 'https://upload.twitter.com/1.1/media/upload.json';
    const { datos } = await http(url, { method: 'POST', headers: { Authorization: firmaX('POST', url) }, body: formulario() })
      .catch(e2 => { throw new Error(`${e.message} | respaldo: ${e2.message}`); });
    return datos.media_id_string;
  }
}

async function publicarX({ texto, imagen, alt }) {
  if (largoX(texto) > 280) throw new Error(`El texto para X tiene ${largoX(texto)} caracteres (máximo 280).`);
  const cuerpo = { text: texto };
  if (imagen) {
    const id = await subirImagenX(imagen);
    if (alt) {
      const url = 'https://api.x.com/2/media/metadata';
      await http(url, {
        method: 'POST', headers: { Authorization: firmaX('POST', url), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, metadata: { alt_text: { text: alt.slice(0, 1000) } } })
      }).catch(e => console.warn('  (X) no se pudo agregar el texto alternativo:', e.message));
    }
    cuerpo.media = { media_ids: [id] };
  }
  const url = 'https://api.x.com/2/tweets';
  const { datos } = await http(url, {
    method: 'POST', headers: { Authorization: firmaX('POST', url), 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo)
  });
  return { id: datos.data.id, url: `https://x.com/i/web/status/${datos.data.id}` };
}

/* ======================= LinkedIn (Posts API) ======================= */
const credLinkedin = () => E.LINKEDIN_TOKEN;
const LI_VERSION = E.LINKEDIN_VERSION || '202608';
const encabezadosLi = extra => ({
  Authorization: `Bearer ${E.LINKEDIN_TOKEN}`,
  'LinkedIn-Version': LI_VERSION,
  'X-Restli-Protocol-Version': '2.0.0',
  ...extra
});

// El texto de LinkedIn usa "little text format": hay que escapar los caracteres reservados.
// Los #hashtags se convierten en hashtags reales.
function textoLinkedin(s) {
  const tags = [];
  const conMarcas = s.replace(/(^|\s)#([\p{L}\p{N}]+)/gu, (_, pre, tag) => `${pre}\u0000${tags.push(tag) - 1}\u0000`);
  const escapado = conMarcas.replace(/[\\|{}@[\]()<>#*_~]/g, c => '\\' + c);
  return escapado.replace(/\u0000(\d+)\u0000/g, (_, i) => `{hashtag|\\#|${tags[i]}}`);
}

async function autorLinkedin() {
  if (E.LINKEDIN_AUTOR) return E.LINKEDIN_AUTOR;
  const { datos } = await http('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${E.LINKEDIN_TOKEN}` } });
  return `urn:li:person:${datos.sub}`;
}

async function publicarLinkedin({ texto, imagen, alt }) {
  if (texto.length > 3000) throw new Error(`El texto para LinkedIn tiene ${texto.length} caracteres (máximo 3000).`);
  const autor = await autorLinkedin();
  const post = {
    author: autor,
    commentary: textoLinkedin(texto),
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false
  };
  if (imagen) {
    const { datos } = await http('https://api.linkedin.com/rest/images?action=initializeUpload', {
      method: 'POST', headers: encabezadosLi({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ initializeUploadRequest: { owner: autor } })
    });
    const { uploadUrl, image } = datos.value;
    await http(uploadUrl, {
      method: 'PUT', headers: { Authorization: `Bearer ${E.LINKEDIN_TOKEN}`, 'Content-Type': 'image/jpeg' },
      body: readFileSync(join(RAIZ, imagen))
    }, { esperado: [200, 201], json: false });
    for (let i = 0; i < 10; i++) {
      const { datos: img } = await http(`https://api.linkedin.com/rest/images/${encodeURIComponent(image)}`, { headers: encabezadosLi() })
        .catch(() => ({ datos: {} }));
      if (img.status === 'AVAILABLE') break;
      await esperar(2000);
    }
    post.content = { media: { id: image, altText: (alt || '').slice(0, 4086) } };
  }
  const { respuesta } = await http('https://api.linkedin.com/rest/posts', {
    method: 'POST', headers: encabezadosLi({ 'Content-Type': 'application/json' }), body: JSON.stringify(post)
  }, { esperado: [201], json: false });
  const urn = respuesta.headers.get('x-restli-id');
  return { id: urn, url: `https://www.linkedin.com/feed/update/${urn}/` };
}

/* ======================= Instagram (API con inicio de sesión de Instagram) ======================= */
const credInstagram = () => E.IG_TOKEN;
const IG = `https://graph.instagram.com/${E.IG_VERSION || 'v24.0'}`;

async function publicarInstagram({ texto, imagen, alt }) {
  if (!imagen) throw new Error('Instagram necesita una imagen.');
  if (texto.length > 2200) throw new Error(`El texto para Instagram tiene ${texto.length} caracteres (máximo 2200).`);
  const token = E.IG_TOKEN;
  let usuario = E.IG_USER_ID;
  if (!usuario) {
    const { datos } = await http(`${IG}/me?fields=user_id&access_token=${encodeURIComponent(token)}`);
    usuario = datos.user_id || datos.id;
  }
  const crear = async conAlt => {
    const p = new URLSearchParams({ image_url: urlPublica(imagen), caption: texto, access_token: token });
    if (conAlt && alt) p.set('alt_text', alt.slice(0, 1000));
    return http(`${IG}/${usuario}/media`, { method: 'POST', body: p });
  };
  const { datos: contenedor } = await crear(true).catch(e => {
    if (/alt_text/i.test(e.message)) return crear(false);
    throw e;
  });
  for (let i = 0; i < 20; i++) {
    const { datos } = await http(`${IG}/${contenedor.id}?fields=status_code&access_token=${encodeURIComponent(token)}`);
    if (datos.status_code === 'FINISHED') break;
    if (datos.status_code === 'ERROR' || datos.status_code === 'EXPIRED') throw new Error(`Instagram no pudo procesar la imagen (${datos.status_code}).`);
    await esperar(3000);
  }
  const { datos: medio } = await http(`${IG}/${usuario}/media_publish`, {
    method: 'POST', body: new URLSearchParams({ creation_id: contenedor.id, access_token: token })
  });
  const { datos: info } = await http(`${IG}/${medio.id}?fields=permalink&access_token=${encodeURIComponent(token)}`).catch(() => ({ datos: {} }));
  return { id: medio.id, url: info.permalink || null };
}

/* ======================= Orquestación ======================= */
const PUBLICADORES = {
  x: { credenciales: credX, publicar: publicarX },
  linkedin: { credenciales: credLinkedin, publicar: publicarLinkedin },
  instagram: { credenciales: credInstagram, publicar: publicarInstagram }
};
const TERMINADO = new Set(['publicado', 'omitido']);

const historial = leerHistorial();
let errores = 0;
const archivos = archivosCola();
if (!archivos.length) console.log('No hay propuestas en social/cola/.');
// Sin ninguna credencial no se toca nada: las propuestas esperan en la cola hasta que haya al menos una red conectada.
if (!PRUEBA && !REDES.some(r => PUBLICADORES[r].credenciales())) {
  console.log('No hay credenciales de ninguna red todavía; las propuestas quedan en social/cola/ sin cambios.');
  process.exit(0);
}

for (const ruta of archivos) {
  const propuesta = leerJson(ruta);
  console.log(`\n▶ ${basename(ruta)} · ${propuesta.tipo} · ${propuesta.id}${PRUEBA ? ' · PRUEBA (no publica)' : ''}`);
  let entrada = historial.publicados.find(p => p.fecha === propuesta.fecha && p.id === propuesta.id);

  for (const red of REDES) {
    const datos = propuesta.redes?.[red];
    if (!datos || TERMINADO.has(datos.estado)) continue;
    if (SOLO.length && !SOLO.includes(red)) continue;
    const yaPublicado = historial.publicados.some(p => p.id === propuesta.id && p.tipo === propuesta.tipo && p.enlaces?.[red] && p !== entrada);
    if (yaPublicado && propuesta.tipo === 'caso') {
      Object.assign(datos, { estado: 'omitido', motivo: 'este caso ya se publicó antes en esta red' });
      console.log(`  ${red}: omitido (ya publicado antes)`);
      continue;
    }
    const { credenciales, publicar } = PUBLICADORES[red];
    if (!credenciales()) {
      Object.assign(datos, { estado: 'omitido', motivo: 'faltan credenciales' });
      console.log(`  ${red}: omitido (faltan credenciales)`);
      continue;
    }
    if (PRUEBA) {
      console.log(`  ${red}: se publicaría ${datos.texto.length} caracteres${datos.imagen ? ' + ' + datos.imagen : ''}`);
      continue;
    }
    try {
      const r = await publicar(datos);
      Object.assign(datos, { estado: 'publicado', id: r.id, url: r.url, publicado_en: new Date().toISOString() });
      delete datos.error;
      console.log(`  ${red}: publicado ${r.url || r.id}`);
      if (!entrada) {
        entrada = { fecha: propuesta.fecha, tipo: propuesta.tipo, id: propuesta.id, enlaces: {} };
        historial.publicados.push(entrada);
      }
      entrada.enlaces[red] = r.url || r.id;
    } catch (e) {
      errores++;
      Object.assign(datos, { estado: 'error', error: e.message });
      console.error(`  ${red}: ERROR ${e.message}`);
    }
  }

  if (PRUEBA) continue;
  guardarJson(ruta, propuesta);
  const listo = REDES.every(r => !propuesta.redes?.[r] || TERMINADO.has(propuesta.redes[r].estado));
  if (listo) {
    mkdirSync(join(SOCIAL, 'publicados'), { recursive: true });
    renameSync(ruta, join(SOCIAL, 'publicados', basename(ruta)));
    console.log(`  → movido a social/publicados/`);
  }
}

if (!PRUEBA) guardarHistorial(historial);
if (errores) {
  console.error(`\n${errores} publicación(es) con error. Revisa el detalle arriba; puedes reintentar desde Actions → Publicar en redes → Run workflow.`);
  process.exit(1);
}
