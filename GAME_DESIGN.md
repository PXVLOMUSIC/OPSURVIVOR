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
- Tienen que ser lugares reconocibles de One Piece. Todas las imágenes miden 1408x768 y se dibujan con `MAP_SCALE` 2, sin suavizado.
- Estilo GBA: los mapas de `assets/maps/` se generan desde los originales HD (`source-art/maps/hd/`) con `source-art/pixelar_mapas.py` (mitad de resolución, color de 15 bits). Si cambias un mapa, guarda el HD ahí y vuelve a pasar el script.
- Solo hay colisiones en el borde de la arena, sin obstáculos en el interior (decisión de Pablo del 31-10-2026). Las cápsulas de obstáculos detectadas están en el commit `a863eaa`, y `MAP_OBSTACLES` sigue disponible pero vacío.
- **Baratie**: borde detectado por color (madera frente a agua). Jefe Don Krieg (9000 PV) y minijefe el Capitán Morgan (min 3).
- **Alabasta**, **Skypiea** y **Thriller Bark** comparten el trazado de plaza de palacio (`PALACE_ARENA_POLY`, sacado de la línea verde de Alabasta).
  - Alabasta: jefe Crocodile (14000 PV).
  - Skypiea: jefe Enel (18000 PV).
  - Thriller Bark: jefe Gekko Moria (16000 PV) y minijefes Absalom (min 4) y Kuma (min 6). Todo el roster de zombis de Thriller Bark (Inuppen, Tararan, Kumashi, Hogback, Cindry, Perona, Absalom y Ryuma).
- Enemigos por mapa: `MAP_ENEMIES` y `ENEMY_STATS` (`js/core.js`), que definen la lista de aparición, los minijefes, el jefe y las oleadas. Baratie, Alabasta y Skypiea usan marines de relleno hasta tener sprites de su arco (piratas de Krieg, Baroque Works y el ejército de Enel). Crocodile y Enel siguen usando el sprite de Krieg.
- El origen vertical de cada imagen está en `MAP_ORIGIN_Y` (`js/render.js`). La cámara no deja ver nada fuera de la imagen. `mapLocked()` (`js/core.js`) permite bloquear un mapa.

## Progreso permanente
Tienda con 15 mejoras (`META_UPGRADES`), 10 Voluntades de D, 12 logros y 15 evoluciones de armas. Se guarda en localStorage (`op_survivor_meta` y `op_survivor_opts`).

## Sprites
Están extraídos de hojas de GBA, en `assets/extracted/<personaje>/`. Los frames de cada acción se eligen en `CHAR_ANIMS` y `ENEMY_ANIMS` (`js/core.js`). Las fuentes están en `SPRITES_SOURCES.md`.
