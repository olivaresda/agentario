#!/usr/bin/env python3
"""Muestra el caption como lo ve el feed y lo revisa contra las reglas de Daniel.

Uso: python3 caption.py caption.txt
"""
import re
import sys

LIMITE_FEED = 125
MAX_IG = 2200
PROHIBIDAS = ["revolucionari", "increíble", "increible", "game changer", "desbloquea",
              "potencia tu", "sumérgete", "no te lo pierdas", "en la era de",
              "en el mundo actual"]
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")
LLAMADOS = re.compile(r"(link de mi bio|guárdalo|guardalo|compártelo|comparte|escríbeme|"
                      r"comenta|suscríbete|únete|unete|precompra|reserva)", re.I)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    with open(sys.argv[1], encoding="utf-8") as f:
        texto = f.read().strip()

    visible = texto[:LIMITE_FEED].replace("\n", " ")
    print("LO QUE MUESTRA EL FEED (primeros 125 caracteres)")
    print("+" + "-" * 70 + "+")
    for i in range(0, len(visible), 68):
        print("| " + visible[i:i + 68].ljust(68) + " |")
    print("+" + "-" * 70 + "+")
    cortado = len(texto) > LIMITE_FEED
    if cortado:
        print(f"Corta en: «…{texto[max(0, LIMITE_FEED - 20):LIMITE_FEED]}» + más")

    sin_hashtags = re.sub(r"#\w+", "", texto)
    palabras = len(sin_hashtags.split())
    hashtags = re.findall(r"#\w+", texto)
    emojis = len(EMOJI.findall(texto))
    problemas, avisos = [], []

    if len(texto) > MAX_IG:
        problemas.append(f"{len(texto)} caracteres: Instagram admite {MAX_IG}.")
    if palabras < 80 or palabras > 160:
        avisos.append(f"{palabras} palabras (sin hashtags): apunta a 80-160.")
    if not 5 <= len(hashtags) <= 8:
        avisos.append(f"{len(hashtags)} hashtags: usa 5 a 8.")
    if emojis > 1:
        problemas.append(f"{emojis} emojis: máximo uno.")
    if re.search(r"https?://", texto):
        problemas.append("Contiene un enlace: en Instagram no es clicable. Usa «link de mi bio».")
    for p in PROHIBIDAS:
        if p in texto.lower():
            problemas.append(f"Palabra o frase prohibida: «{p}».")
    n_llamados = len(set(m.lower() for m in LLAMADOS.findall(texto)))
    if n_llamados == 0:
        avisos.append("No hay llamado a la acción.")
    if "link de mi bio" not in texto.lower():
        avisos.append("Falta cerrar con «el link está en mi bio».")
    if len(re.findall(r"[—–]", re.sub(r"(?m)^\s*[—–]", "", texto))):
        avisos.append("Hay rayas dentro de una oración: usa coma o punto.")
    if not cortado:
        avisos.append("El caption entero cabe en el feed: ¿falta desarrollo?")
    if "\n\n" not in texto:
        avisos.append("Sin párrafos separados: cuesta leerlo en el celular.")

    print(f"\n{len(texto)} caracteres · {palabras} palabras · {len(hashtags)} hashtags · {emojis} emojis")
    for p in problemas:
        print("✗", p)
    for a in avisos:
        print("!", a)
    if not problemas and not avisos:
        print("✓ Sin observaciones.")
    sys.exit(1 if problemas else 0)


if __name__ == "__main__":
    main()
