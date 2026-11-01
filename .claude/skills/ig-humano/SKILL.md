---
name: ig-humano
description: >-
  Humanizador en español: quita de un borrador (caption, guion, comentario, DM) las muletillas de IA, los caracteres invisibles y las frases de relleno, y lo revisa contra la voz de Daniel antes de entregarlo. Úsala siempre antes de dar un texto final de redes, o cuando Daniel diga "suena a IA", "humaniza esto" o "límpialo".
---

# ig-humano

Todo texto para redes pasa por aquí antes de llegar a Daniel. La meta no es esconder que se usó IA: es que el texto suene a una persona concreta con experiencia, no a un folleto.

## Tres pasadas

**1. Mecánica** (la hace `humanizar.py`, o tú a mano si no hay Python):
- Borra caracteres invisibles (espacio de ancho cero, marcas de dirección, BOM, guion blando) y cambia el espacio de no separación por un espacio normal.
- Reemplaza la raya (—) usada **dentro** de una oración por coma o punto. La raya al comienzo de una línea (viñeta) se deja.
- Cambia los puntos suspensivos tipográficos (…) por tres puntos. Las comillas angulares «» se conservan: son correctas en español.

**2. Léxico**: marca y reescribe, con palabras simples, lo que el detector señala:
- Aperturas vacías: «en el mundo actual», «en la era de la IA», «hoy en día», «es importante destacar».
- Cierres vacíos: «en conclusión», «sin duda», «al final del día».
- Palabras de folleto: «revolucionario», «increíble», «innovador», «potencia», «desbloquea», «sumérgete», «descubre cómo», «no te lo pierdas», «game changer», «llevar al siguiente nivel».
- La estructura «no es solo X, sino Y» y los tríos de adjetivos.
- Saludos de reel: «hola a todos», «hoy les voy a hablar de».

**3. Panel de cinco preguntas** (respóndelas contra el texto, sin pasar al siguiente hasta resolver):
1. **Concreción**: ¿hay al menos un dato, nombre, cifra o situación que solo Daniel o el caso real podrían dar?
2. **Voz**: ¿suena a Daniel, en primera persona y de tú, sin exagerar?
3. **Ritmo**: ¿mezcla frases cortas y largas, o todas miden lo mismo?
4. **Verdad**: ¿todo lo que afirma salió del encargo, del caso del Agentario o de la ficha del libro? Si no, bórralo.
5. **Un solo llamado**: ¿pide una sola cosa?

## Reglas de Daniel

- Máximo un emoji.
- Nada de promesas infladas.
- El agente se revisa antes de enviar, pagar o firmar, y el texto debe decirlo cuando corresponda.
- No inventes citas ni resultados.

## Cómo entregar

Entrega el texto limpio y, debajo, una línea con lo que cambiaste (por ejemplo: «quité 2 rayas y la apertura "en la era de la IA"»). Si el borrador era mejor antes de la limpieza en algún punto, dilo.

Para correr las herramientas: `python3 humanizar.py texto.txt` (limpia y muestra el informe) y `python3 humanizar.py texto.txt --solo-detectar` (solo el informe).
