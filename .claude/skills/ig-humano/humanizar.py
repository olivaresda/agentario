#!/usr/bin/env python3
"""Humanizador en español: limpia y detecta rastros de IA. Sin dependencias, sin red.

Uso:
  python3 humanizar.py texto.txt                  # limpia, imprime el texto y el informe
  python3 humanizar.py texto.txt --solo-detectar  # solo el informe
  python3 humanizar.py texto.txt -o limpio.txt    # guarda el texto limpio
"""
import re
import sys

INVISIBLES = ["​", "‌", "‍", "⁠", "﻿", "­", "᠎",
              "؜", "‎", "‏"]
FRASES = [
    "en el mundo actual", "en la era de la ia", "en la era digital", "hoy en día", "hoy en dia",
    "es importante destacar", "cabe destacar", "cabe mencionar", "en conclusión",
    "en conclusion", "sin duda", "al final del día", "al final del dia", "sumérgete",
    "descubre cómo", "no te lo pierdas", "game changer", "al siguiente nivel",
    "panorama", "tapiz", "desbloquea", "potencia tu", "revolucionario", "revolucionaria",
    "increíble", "increible", "innovador", "innovadora", "hola a todos",
    "hoy les voy a hablar", "hoy te voy a contar", "en este video te voy a",
]
ESTRUCTURAS = [
    (r"\bno (es|son|se trata de) (solo|solamente|sólo|únicamente)\b[^.!?\n]{0,80}\b(sino|es|son)\b",
     "estructura «no es solo X, sino Y»"),
    (r"\b(\w+), (\w+) y (\w+)\b(?=[^.]*\b(clave|poderos|eficaz|innovador))", "trío de adjetivos"),
]
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")


def contar_invisibles(t):
    return sum(t.count(c) for c in INVISIBLES) + len(re.findall("[\U000E0000-\U000E007F]", t))


def rayas_internas(t):
    return len(re.findall(r"(?<=\S)\s*[—–]\s*(?=\S)", re.sub(r"(?m)^\s*[—–]", "", t)))


def limpiar(t):
    for c in INVISIBLES:
        t = t.replace(c, "")
    t = re.sub("[\U000E0000-\U000E007F]", "", t)
    t = t.replace(" ", " ")
    t = t.replace("…", "...")
    # rayas dentro de una oración -> coma (las de inicio de línea, viñetas, se conservan)
    lineas = []
    for linea in t.split("\n"):
        m = re.match(r"^(\s*[—–]\s*)(.*)$", linea)
        cabeza, resto = (m.group(1), m.group(2)) if m else ("", linea)
        resto = re.sub(r"\s*[—–]\s*", ", ", resto)
        lineas.append(cabeza + resto)
    return "\n".join(lineas)


def informe(t):
    bajo = t.lower()
    hallazgos = []
    n = contar_invisibles(t)
    if n:
        hallazgos.append(f"{n} carácter(es) invisible(s)")
    r = rayas_internas(t)
    if r:
        hallazgos.append(f"{r} raya(s) dentro de oraciones")
    for f in FRASES:
        if f in bajo:
            hallazgos.append(f"frase de relleno o folleto: «{f}»")
    for patron, nombre in ESTRUCTURAS:
        if re.search(patron, bajo):
            hallazgos.append(nombre)
    e = len(EMOJI.findall(t))
    if e > 1:
        hallazgos.append(f"{e} emojis (máximo uno)")
    frases = [s for s in re.split(r"[.!?\n]+", t) if s.strip()]
    largos = [len(s.split()) for s in frases]
    if len(largos) >= 5 and max(largos) - min(largos) <= 4:
        hallazgos.append("todas las frases miden casi lo mismo: falta ritmo")
    return hallazgos


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    ruta = args[0]
    with open(ruta, encoding="utf-8") as f:
        original = f.read()
    antes = informe(original)
    limpio = limpiar(original)
    despues = informe(limpio)

    print("INFORME")
    print("=" * 60)
    if not antes:
        print("✓ Sin rastros detectados.")
    for h in antes:
        print("-", h)
    if "--solo-detectar" in args:
        sys.exit(1 if antes else 0)
    if "-o" in args:
        destino = args[args.index("-o") + 1]
        with open(destino, "w", encoding="utf-8") as f:
            f.write(limpio)
        print(f"\nTexto limpio guardado en {destino}")
    else:
        print("\nTEXTO LIMPIO")
        print("=" * 60)
        print(limpio)
    pendientes = [h for h in despues if "invisible" not in h and "raya" not in h]
    if pendientes:
        print("\nQUEDA POR REESCRIBIR A MANO")
        for h in pendientes:
            print("-", h)


if __name__ == "__main__":
    main()
