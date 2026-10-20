// Decide qué se publica hoy en redes y lo imprime como JSON.
//
// Orden de prioridad:
//   1. Casos nuevos: agregados a index.html después de la última publicación.
//   2. Casos más copiados (TOP_PROMPTS) que aún no se publican.
//   3. El resto de los casos sin publicar, del más reciente al más antiguo.
//   4. Si ya se publicaron todos los casos: un ángulo del libro (el que lleva más tiempo sin salir).
// Entre candidatos del mismo nivel, evita repetir la categoría de la última publicación.
//
// Uso: node herramientas/social/elegir.mjs [--fecha AAAA-MM-DD]

import { join } from 'node:path';
import {
  CASOS, CATS, TOP_PROMPTS, MARCA, SOCIAL, REDES, hoy, fechaLarga, fechaCorta, diasEntre,
  conUtm, urlCaso, tramoFundador, leerHistorial, leerJson
} from './datos.mjs';

const arg = process.argv.indexOf('--fecha');
const FECHA = arg > 0 ? process.argv[arg + 1] : hoy();

const historial = leerHistorial();
const publicadosCaso = new Set(historial.publicados.filter(p => p.tipo === 'caso').map(p => p.id));
const ultima = historial.publicados.at(-1) || null;
const ultimaFecha = ultima?.fecha || null;
const ultimaCat = ultima?.tipo === 'caso' ? CASOS.find(c => c.id === ultima.id)?.c : null;

const pendientes = CASOS.filter(c => !publicadosCaso.has(c.id) && c.f <= FECHA);
const recientes = (a, b) => b.f.localeCompare(a.f) || a.t.localeCompare(b.t, 'es');
const variar = lista => {
  const otra = lista.filter(c => c.c !== ultimaCat);
  return otra.length ? otra : lista;
};

const nuevos = ultimaFecha ? pendientes.filter(c => c.f >= ultimaFecha).sort(recientes) : [];
const top = TOP_PROMPTS.map(id => pendientes.find(c => c.id === id)).filter(Boolean);
const resto = [...pendientes].sort(recientes);

let eleccion;
const nivel = [
  ['caso nuevo', nuevos],
  ['caso más copiado', top],
  ['caso sin publicar', resto]
].find(([, lista]) => lista.length);

if (nivel) {
  const [motivo, lista] = nivel;
  const caso = variar(lista)[0];
  const enlace = urlCaso(caso.id);
  eleccion = {
    fecha: FECHA,
    tipo: 'caso',
    id: caso.id,
    motivo,
    quedan_sin_publicar: pendientes.length - 1,
    caso: {
      titulo: caso.t,
      descripcion: caso.d,
      resultado: caso.r || null,
      agente: caso.a,
      categoria: CATS[caso.c] || caso.c,
      fecha: caso.f,
      prompt: caso.p,
      fuente: caso.fo || null
    },
    enlace,
    enlaces: Object.fromEntries(REDES.map(r => [r, conUtm(enlace, r)])),
    imagen: {
      plantilla: 'caso',
      campos: {
        categoria: CATS[caso.c] || caso.c,
        agente: caso.a,
        titulo: caso.t,
        prompt: caso.p,
        url: 'agentario.laexperienciaeselcodigo.com',
        etiqueta: motivo === 'caso nuevo' ? 'Nuevo' : ''
      }
    }
  };
} else {
  const { angulos } = leerJson(join(SOCIAL, 'angulos-libro.json'));
  const usoAngulo = id => historial.publicados.filter(p => p.tipo === 'libro' && p.id === id).map(p => p.fecha).sort().at(-1) || '0000';
  const angulo = [...angulos].sort((a, b) => usoAngulo(a.id).localeCompare(usoAngulo(b.id)))[0];
  const { actual, siguiente } = tramoFundador(FECHA);
  const vars = {
    precio: actual.usd,
    hasta: fechaCorta(actual.hasta),
    siguiente: siguiente?.usd ?? 85,
    dias: diasEntre(FECHA, MARCA.libro.lanzamiento),
    lanzamiento: fechaLarga(MARCA.libro.lanzamiento),
    casos: CASOS.length
  };
  const llenar = s => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  const a = JSON.parse(llenar(JSON.stringify(angulo)));
  eleccion = {
    fecha: FECHA,
    tipo: 'libro',
    id: a.id,
    motivo: 'no quedan casos sin publicar',
    libro: { tema: a.tema, ...vars },
    enlace: a.enlace,
    enlaces: Object.fromEntries(REDES.map(r => [r, conUtm(a.enlace, r, a.id)])),
    imagen: {
      plantilla: 'libro',
      campos: {
        antetitulo: 'La experiencia es el código · un libro que se escribe en vivo',
        titular: a.titular,
        bajada: a.bajada,
        ficha: a.ficha,
        dato: a.dato,
        url: a.enlace.replace(/^https:\/\//, '').replace(/[/#].*$/, '')
      }
    }
  };
}

process.stdout.write(JSON.stringify(eleccion, null, 2) + '\n');
