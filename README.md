# Ecos de Evermore — Alquimia & Ceniza

Roguelite de acción top-down (isométrico) hecho con HTML5 Canvas y JavaScript puro.
Sin build, sin dependencias, sin framework: abre `index.html` y juega.

## Jugar en local

Necesitas un servidor HTTP estático (los navegadores bloquean la carga de assets vía `file://`):

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

## Desplegar en Vercel (web)

El proyecto es 100 % estático: **no requiere configuración de build**.

1. Entra en [vercel.com/new](https://vercel.com/new).
2. Selecciona el repositorio `DilesZ/RogueZZ` (si no aparece, pulsa *Adjust GitHub App Permissions* y dale acceso).
3. Pulsa **Deploy** sin tocar ninguna opción (Framework: *Other*, Build: vacío, Output: vacío).
4. En segundos tendrás la URL pública `https://roguezz-<hash>.vercel.app`.

Cada `git push` a `main` desplegará automáticamente una nueva versión.

El archivo `vercel.json` ya incluye caché para assets y cabeceras de seguridad básicas.

## Controles

| Acción | Tecla |
|---|---|
| Mover | WASD / Flechas |
| Apuntar | Ratón |
| Atacar | Clic izquierdo |
| Esquivar | Espacio |
| Alquimia | Tab |
| Pausa | Esc |

## Estructura

```
index.html        Punto de entrada (canvas 480×270, escalado pixelado)
src/
  core.js         Utilidades y estado global
  input.js        Teclado, ratón y táctil
  audio.js        Audio procedural (WebAudio)
  gfx.js          Renderizado de bajo nivel
  art.js          Sprites procedurales y paletas
  nara.js         Heroína Nara (spritesheet assets/nara/)
  rig.js          Esqueleto de animación
  alchemy.js      Sistema de alquimia
  hero.js         Jugador
  dog.js          Compañero canino
  foes.js         Enemigos
  world.js        Generación del mundo y biomas
  ui.js           HUD e interfaz
  game.js         Estados de juego y bucle
  main.js         Arranque
  enrich.js       Capa de expansión (FX, ambiente, enemigos extra)
assets/nara/      Spritesheets de Nara
```
