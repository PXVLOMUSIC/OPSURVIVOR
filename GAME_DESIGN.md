# One Piece Survivor: notas de diseño

## Estructura del código
Es un juego estático sin build. Se abre con `index.html` desde cualquier servidor estático. Los scripts son clásicos, no módulos ES, y comparten el ámbito global. Por eso el orden de carga importa.

| Archivo | Contenido |
|---|---|
| `css/style.css` | Todos los estilos |
| `js/core.js` | Canvas, carga de sprites, animaciones, iconos, personajes, jefes y maldición |
| `js/audio.js` | Música y efectos de sonido |
| `js/state.js` | Sprites procedurales, estado de la partida y progreso permanente (tienda) |
| `js/maps.js` | Polígonos de colisión y fondos de cada mapa |
| `js/systems.js` | Rejilla espacial, controles, Voluntades de D (arcanas), logros y bestiario |
| `js/ui.js` | Opciones, pausa y menús |
| `js/game.js` | Bucle principal, update, armas, aparición de enemigos, XP y evoluciones |
| `js/render.js` | Dibujado |
| `js/main.js` | Arranque, que se ejecuta cuando todo lo demás ya está cargado |

**Regla:** una función solo se puede llamar al cargar un archivo si está definida en ese archivo o en uno anterior. Las llamadas de inicialización que usen funciones de varios archivos van en `js/main.js`.

`source-art/` guarda el material original: hojas de sprites, frames limpios, retratos y el script `process_animations.py`. El juego no lo carga.

## Partida
- Dura 8 minutos. Al minuto 8 aparece el jefe del mapa, y la victoria llega al derrotarlo.
- Hay un Modo Infinito, con un jefe nuevo cada 5 minutos y un 60% más de vida cada vez.
- Clima peligroso (Maldición 0 a 4): cada nivel suma un 25% de peligro y un 25% de Berries. A partir del 2 hay más oleadas, desde el 3 aparece un segundo Shichibukai y en el 4 hay dos jefes.
- Aparición de enemigos: el intervalo baja de 1,0 s a 0,4 s de forma lineal hasta el minuto 4. Después sigue una curva geométrica hasta unos 0,05 s en el minuto 8, con un mínimo de 0,04 s, y se divide por la Maldición. No depende de los FPS.
- La vida de los enemigos se multiplica por 1,28 cada minuto (`1.28^min × maldición`).

## Personajes
- Luffy: ataques a distancia (Pistol, Gatling, Bazooka, Gear 2, Muchi y Ono).
- Zoro: cuerpo a cuerpo con espadas (Santoryu, Oni Giri, Flying Slash, Tatsumaki y 108 Pound Ho).
- Sanji: cuerpo a cuerpo con patadas (Diable Jambe, Collier, Joue Shot, Concassé y Party Table).
- Las habilidades tienen que ser fieles al manga y al anime.

## Mapas
- Tienen que ser lugares reconocibles de One Piece.
- **Baratie** (jugable): jefe Don Krieg (9000 PV). El Capitán Morgan aparece hacia el minuto 1. Moria es miniboss en el minuto 4 y Kuma en el 6. Los enemigos de Thriller Bark se mantienen hasta que haya sprites del East Blue (decisión del 31-10-2026).
- **Alabasta** (jugable): jefe Crocodile (14000 PV). Mapa nuevo y colisiones `ALABASTA_POLY` sacadas de la línea verde de referencia. Falta el sprite de Crocodile, que ahora usa el de Krieg.
- **Skypiea** (bloqueado): jefe Enel (18000 PV). Faltan las imágenes nuevas del mapa, ajustar las colisiones y el sprite de Enel.
- Se desbloquean en `mapLocked()` (`js/core.js`). Las colisiones están en `WALK_POLYS` (`js/maps.js`). El origen vertical de cada imagen está en `MAP_ORIGIN_Y` (`js/render.js`). La cámara no deja ver nada fuera de la imagen.
- Obstáculos: `MAP_OBSTACLES` (`js/maps.js`) son cápsulas (rejas, barandillas, farolas, palmeras, bancos...) detectadas sobre cada imagen. Bloquean al jugador y a los enemigos normales; los jefes y minijefes las atraviesan. Punto de restauración previo a obstáculos: commit `7fe313e`.

## Progreso permanente
Tienda con 15 mejoras (`META_UPGRADES`), 10 Voluntades de D, 12 logros y 15 evoluciones de armas. Se guarda en localStorage (`op_survivor_meta` y `op_survivor_opts`).

## Sprites
Están extraídos de hojas de GBA, en `assets/extracted/<personaje>/`. Los frames de cada acción se eligen en `CHAR_ANIMS` y `ENEMY_ANIMS` (`js/core.js`). Las fuentes están en `SPRITES_SOURCES.md`.
