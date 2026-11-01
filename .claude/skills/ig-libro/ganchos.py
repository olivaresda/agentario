#!/usr/bin/env python3
"""Puntúa ganchos de Reel en español (uno por línea). Sin dependencias, sin red.

Uso: python3 ganchos.py ganchos.txt
"""
import re
import sys

SALUDOS = re.compile(r"^\s*(hola|buenas|hey|qué tal|que tal|bienvenid)", re.I)
RELLENO = re.compile(r"(hoy (les|te) voy a|hoy quiero (hablar|contar)|en este video|"
                     r"en el mundo actual|en la era de|no vas a creer|detente|para de scrollear|"
                     r"te voy a (contar|explicar))", re.I)
FOLLETO = re.compile(r"(revolucionari|increíble|increible|game changer|desbloquea|potencia tu|"
                     r"sumérgete|llev(a|ar) .* al siguiente nivel)", re.I)
CIFRA = re.compile(r"(\d[\d.,]*|\b(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce)\b)", re.I)
TU = re.compile(r"\b(tú|tu|tus|te|ti|contigo|si tienes|tienes)\b", re.I)
APUESTA = re.compile(r"(cost[óo]|perd[ií]|error|fall[óo]|mito|nadie|nunca|deja de|ya no|"
                     r"sin programar|antes|ahora|por qué|falso|mentira)", re.I)


def puntuar(h):
    palabras = h.split()
    n = len(palabras)
    notas = {}
    notas["ESPECIFICIDAD"] = 100 if CIFRA.search(h) else 55
    notas["BREVEDAD"] = 100 if n <= 14 else max(0, 100 - (n - 14) * 12)
    notas["INTERPELACIÓN"] = 100 if TU.search(h) else 60
    notas["APUESTA"] = 100 if APUESTA.search(h) else 55
    primeras = " ".join(palabras[:6])
    notas["FRENTE"] = 100 if not RELLENO.search(primeras) and not SALUDOS.search(h) else 0
    total = sum(notas.values()) / len(notas)
    ruptura = None
    if SALUDOS.search(h):
        ruptura = "Empieza con un saludo. Nadie llegó al feed para que lo saluden."
    elif RELLENO.search(h):
        ruptura = "Empieza con relleno. El video debe partir donde dirías la frase del segundo seis."
    elif FOLLETO.search(h):
        ruptura = "Palabra de folleto. Daniel no exagera: dilo con un hecho."
    if ruptura:
        total = min(total, 35)
    return total, notas, ruptura


def etiqueta(p):
    return "FUERTE" if p >= 75 else "REGULAR" if p >= 55 else "DÉBIL"


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    with open(sys.argv[1], encoding="utf-8") as f:
        lineas = [l.strip() for l in f if l.strip()]
    filas = []
    for h in lineas:
        total, notas, ruptura = puntuar(h)
        filas.append((total, h, notas, ruptura))
    filas.sort(key=lambda x: -x[0])
    print("RANKING DE GANCHOS")
    print("=" * 78)
    for i, (total, h, notas, ruptura) in enumerate(filas):
        marca = "->" if i == 0 else "  "
        corto = h if len(h) <= 60 else h[:57] + "..."
        print(f"{marca} {total:5.1f} {etiqueta(total):8} {corto}")
        peor = min(notas, key=notas.get)
        print(f"        punto débil: {peor} ({notas[peor]:.0f})")
        if ruptura:
            print(f"        descalificador: {ruptura}")
    print("-" * 78)
    print("Escribe además la versión de pantalla: 6 palabras o menos.")


if __name__ == "__main__":
    main()
