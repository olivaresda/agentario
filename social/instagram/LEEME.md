# Skills de Instagram para «La experiencia es el código»

Tres skills en español para preparar contenido de Instagram que impulse el libro
*La experiencia es el código* y el Agentario. Redactan; Daniel aprueba y publica.

| skill | para qué |
|---|---|
| `ig-libro` | Reels (12 ganchos, puntuados), captions de 125 caracteres, carruseles, stories y plan semanal |
| `ig-humano` | Limpia el texto de rastros de IA y lo revisa contra la voz de Daniel |
| `ig-comunidad` | Comentarios, respuestas, mensajes directos y embudo hacia la preventa |

## Herramientas (Python 3, sin dependencias ni red)

```bash
python3 .claude/skills/ig-libro/ganchos.py ganchos.txt        # ranking de ganchos
python3 .claude/skills/ig-libro/caption.py caption.txt        # vista del feed y revisión
python3 .claude/skills/ig-humano/humanizar.py texto.txt       # limpieza e informe
```

## Instalar en Claude Code

```bash
cp -r .claude/skills/ig-* ~/.claude/skills/
```

Sin Claude Code, cada `SKILL.md` funciona pegado al inicio de un chat; se pierden los scripts.

## Uso con el agente de redes de `agentario`

El agente diario (`social/INSTRUCCIONES.md`) puede invocar `ig-humano` antes de
`validar.mjs`, y `caption.py` como revisión extra del texto de Instagram.

## Crédito

Inspirado en la estructura del proyecto MIT *instagram-agent-skill* de Jake Schincariol
(https://github.com/Jakeschincariol/instagram-agent-skill). Los textos, fórmulas, reglas
y scripts de este paquete están escritos de nuevo para español y para este libro.
