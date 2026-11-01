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
| `js/arsenal.js` | Armas y pasivas compartidas nuevas, sus evoluciones y el arranque de Nami, Usopp, Chopper y Robin |
| `js/waves.js` | Oleadas con guion por minuto |
| `js/loot.js` | Ruleta de los cofres, barriles y faroles que se rompen, y objetos que se desbloquean con logros |
| `js/modes.js` | Modos Haki e Inverso y tabla de récords |
| `js/vfx.js` | Efectos de habilidades: dibujo de cada ataque, impactos, partículas temáticas y polvo según el mapa |
| `js/render.js` | Dibujado |
| `js/main.js` | Arranque, que se ejecuta cuando todo lo demás ya está cargado |

**Regla:** una función solo se puede llamar al cargar un archivo si está definida en ese archivo o en uno anterior. Las llamadas de inicialización que usen funciones de varios archivos van en `js/main.js`.

`source-art/` guarda el material original: hojas de sprites, frames limpios, retratos y el script `process_animations.py`. El juego no lo carga.

## Efectos de habilidades (`js/vfx.js`)
- Cada ataque se dibuja con la forma de su hitbox: proyectil, cono, área en el objetivo o aura alrededor del jugador.
- Luffy: extremidades de goma que se estiran y vuelven (Pistol, Gatling, Bazooka, Muchi, Ono). Gear 2 tiñe la piel de rosa y suelta vapor. Red Hawk lleva el antebrazo con Haki y el puño en llamas.
- Zoro: tajos y medias lunas de aire (Santoryu, 36/108 Pound Ho). Oni Giri deja el corte cruzado después del dash. Tatsumaki es un tornado con el polvo del mapa.
- Sanji: pierna negra que no se estira, ondas de patada y fuego (Diable Jambe, Collier, Concassé, Party Table).
- Los golpes "en el objetivo" (Bazooka, Ono, Concassé, granada, hacha) avisan con una sombra y hacen daño al caer (`hitDelay`).
- Polvo y restos según el mapa (`VFX_MAP`): astillas en Baratie, arena en Alabasta, nubes en Skypiea.
- Las armas compartidas reutilizan la lógica de otro tipo y se distinguen con `vis` (knife, rifle, bolt, spear, axe, grenade, shuriken, haki).

## Interfaz
- HUD como cartel de Se Busca: retrato, nombre completo, nivel, vida, experiencia y los Berries de la partida como recompensa.
- Armas equipadas en fichas de papel con una franja del color del personaje (rojo Luffy, verde Zoro, amarillo Sanji, gris compartida) y dorada si están evolucionadas.
- Cartas de mejora como viñetas de manga: tinta negra, trama y onomatopeya según el personaje (DON!! Luffy, ZUBA!! Zoro, DOGA!! Sanji). Se pinta por CSS con `data-char`, `data-kind` y `.evo`.
- Menú con una sola tipografía (Bangers y Pirata One), las opciones de isla y clima en un panel, y un botón principal rojo para zarpar.

## Partida
- Dura 8 minutos. Al minuto 8 aparece el jefe del mapa, y la victoria llega al derrotarlo.
- Hay un Modo Infinito, con un jefe nuevo cada 5 minutos y un 60% más de vida cada vez.
- Clima peligroso (Maldición 0 a 4): cada nivel suma un 25% de peligro y un 25% de Berries. A partir del 2 hay más oleadas, desde el 3 aparece un segundo Shichibukai y en el 4 hay dos jefes.
- Aparición de enemigos: el intervalo baja de 1,0 s a 0,4 s de forma lineal hasta el minuto 4. Después sigue una curva geométrica hasta unos 0,05 s en el minuto 8, con un mínimo de 0,04 s, y se divide por la Maldición. No depende de los FPS.
- La vida de los enemigos se multiplica por 1,28 cada minuto (`1.28^min × maldición`).
- Oleadas con guion (`WAVE_SCRIPT`, js/waves.js) hasta el minuto 8: enjambres que cruzan la pantalla, emboscadas en círculo con un hueco, cargas en fila, hordas y el aviso del jefe. Algunas solo salen con Clima 2 o más. En Modo Infinito, pasado el minuto 8, vuelven las oleadas aleatorias.
- Cofres: al pisarlos se abre una ruleta que revela 1, 3 o 5 objetos (más con Suerte) y los aplica sola, como en VS. Los de plata y oro además evolucionan las armas que cumplan los requisitos.
- Objetos del suelo: cada pocos segundos aparecen barriles (vasijas en Alabasta, faroles en Thriller Bark) que se rompen a golpes y sueltan carne, Berries, el Imán, la Campana de Skypiea o el Den Den Mushi dorado. Los enemigos sueltan menos carne que antes (4%).
- Modos (`RUN_MODES`): Haki, todo un 30% más rápido y +50% Berries (se desbloquea conquistando 2 islas). Inverso, +60% de peligro, +100% Berries y +20% Suerte, con los colores del mundo invertidos (se desbloquea ganando con Clima 2 o más). Se combinan con el Clima.
- Récords: la mejor partida de cada personaje en cada isla (gana una victoria, después el clima, el tiempo y las bajas) y los récords generales de bajas, nivel y Berries. Se guardan en `meta.records`.

## Personajes
- Luffy: ataques a distancia (Pistol, Gatling, Bazooka, Gear 2, Muchi y Ono).
- Zoro: cuerpo a cuerpo con espadas (Santoryu, Oni Giri, Flying Slash, Tatsumaki, 108 Pound Ho y Haki del Rey).
- Sanji: cuerpo a cuerpo con patadas (Diable Jambe, Collier, Joue Shot, Concassé, Party Table y Raid Suit).
- Nami, Usopp, Chopper y Robin, al estilo de VS: empiezan con su arma (Clima-Tact, Kabuto, Kokutei Roseo Mirror, Seis Fleur: Clutch) y un bonus propio; su arma es exclusiva y el resto lo sacan del arsenal compartido. Se desbloquean con logros: Usopp sobreviviendo 5 minutos, Nami conquistando el Baratie, Chopper con 1.500 bajas y Robin conquistando Alabasta.
- Las habilidades tienen que ser fieles al manga y al anime.

## Mapas
- Tienen que ser lugares reconocibles de One Piece. Todas las imágenes miden 1408x768 y se dibujan con `MAP_SCALE` 2, sin suavizado.
- Mapas en HD (decisión de Pablo, 2026-11-01: sin pixelado, para que el fondo no tenga menos definición que los sprites): `assets/maps/<mapa>.jpg` se genera desde el original (`source-art/maps/hd/`, 1408x768) con `source-art/escalar_mapas.py` (x2 Lanczos + enfoque suave, JPEG q85, ~0,9 MB). El código usa el tamaño lógico `MAP_PX_W`x`MAP_PX_H` (1408x768) y dibuja el mapa con suavizado; nunca uses `mapImg.width` para coordenadas. `pixelar_mapas.py` queda solo como referencia.
- Solo hay colisiones en el borde de la arena, sin obstáculos en el interior (decisión de Pablo del 31-10-2026). Las cápsulas de obstáculos detectadas están en el commit `a863eaa`, y `MAP_OBSTACLES` sigue disponible pero vacío.
- **Baratie**: borde detectado por color (madera frente a agua). Jefe Don Krieg (9000 PV) y minijefe el Capitán Morgan (min 3).
- **Alabasta**, **Skypiea** y **Thriller Bark** comparten el trazado de plaza de palacio (`PALACE_ARENA_POLY`, sacado de la línea verde de Alabasta).
  - Alabasta: jefe Crocodile (14000 PV).
  - Skypiea: jefe Enel (18000 PV).
  - Thriller Bark: jefe Gekko Moria (16000 PV) y minijefes Absalom (min 4) y Kuma (min 6). Todo el roster de zombis de Thriller Bark (Inuppen, Tararan, Kumashi, Hogback, Cindry, Perona, Absalom y Ryuma).
- Enemigos por mapa: `MAP_ENEMIES` y `ENEMY_STATS` (`js/core.js`), que definen la lista de aparición, los minijefes, el jefe y las oleadas. Baratie, Alabasta y Skypiea usan marines de relleno hasta tener sprites de su arco (piratas de Krieg, Baroque Works y el ejército de Enel). Crocodile y Enel siguen usando el sprite de Krieg.
- El origen vertical de cada imagen está en `MAP_ORIGIN_Y` (`js/render.js`). La cámara no deja ver nada fuera de la imagen. `mapLocked()` (`js/core.js`) permite bloquear un mapa.

## Progreso permanente
Economía (`ECONOMY` y `beliScale()` en js/core.js, como en VS): el oro sale sobre todo de jefes, cofres y barriles; los enemigos normales sueltan una moneda de 5 al 4% y, con todo al máximo, cada subida de nivel da 25 Berries (50 en cofre). Las islas difíciles pagan más (raíz de `hpMult` relativo al Baratie). `addBeli(valor, fuente)` registra cada ganancia en `window.beliSrc` y el bot la devuelve. Medido con el bot en los 9 mapas (2026-11-01): ~2,7k Berries por partida sin mejoras y ~4,1k con la mitad (2,3-2,9k por victoria en el Baratie, ~9k en Wano). Comprarlo todo (tienda, transformaciones y personajes, ~336k) lleva ~90-100 partidas, unas 11-12 horas.

Tienda con 15 mejoras (`META_UPGRADES`): al principio solo Poder, Salud, Velocidad, Recogida y Avaricia; las otras 10 tienen `lock` y se desbloquean con un logro `shop_*` (Tekkai, Log Pose, Yomi Yomi no Mi...), que la tienda muestra en la carta bloqueada. El monedero está en la cabecera fija de la tienda y solo la lista hace scroll. 10 Voluntades de D, logros (`ACHIEVEMENTS`) y evoluciones de armas (`EVOLUTIONS`). Algunos logros desbloquean contenido: personajes, los modos Haki e Inverso y objetos del arsenal (`ITEM_LOCK` en js/loot.js: Dial de Impacto y Bandera Pirata).

Pool de cartas por personaje: las técnicas de `CHAR_SKILLS` (js/core.js) solo le salen a su dueño, incluidas las armas de Nami, Usopp, Chopper y Robin. `ITEM_CHARS` limita lo que el canon reserva: Rumble Ball solo Chopper; Haoshoku (pulso y pasiva) Luffy y Zoro; Busoshoku Luffy, Zoro y Sanji; Kenbunshoku además Usopp. `itemAllowed()` aplica ambas reglas. Velocidad base del jugador en `BALANCE.playerSpeed`.
- Orden de `possibleUpgrades` (js/game.js): el reparto de cartas usa un sort aleatorio que favorece a los primeros de la lista, y el balance está medido así. Los objetos nuevos van siempre al final. Se guarda en localStorage (`op_survivor_meta` y `op_survivor_opts`).

## Sprites
Están extraídos de hojas de GBA, en `assets/extracted/<personaje>/`. Los frames de cada acción se eligen en `CHAR_ANIMS` y `ENEMY_ANIMS` (`js/core.js`). Las fuentes están en `SPRITES_SOURCES.md`.

## Balance (2026-10-31)
- Los valores globales viven en `BALANCE` (js/core.js): daño por contacto, crecimiento de vida enemiga, tope de 300 enemigos, intervalo mínimo de spawn, primer evento, fusileros y distancia mínima de spawn. Cada mapa tiene `hpMult` en `MAP_ENEMIES`.
- `ENEMY_DRAW_SCALE` (js/core.js) ajusta el tamaño de dibujo de sprites desproporcionados (Tararan a 0.36).
- Medir el balance: `tools/balance-sim.js` (bot en Chromium headless) y `tools/balance-report.py`. Referencia tras el ajuste: ~65% de victorias sin mejoras permanentes, ~100% con la mitad o todas.

## Gears de Luffy (js/gears.js)
- La carta "Gears" (id interno `gear2`) ocupa un solo slot. Llena un medidor (kills + carga pasiva) que se activa con ESPACIO o con el botón G.
- Techo dentro de la partida: carta nv1 → G2, nv3 → G3, evolución → G4, G4 + minuto 6 → G5 (que se recarga en 3 min).
- Efectos: G2 da +vel., −40% CD y drena vida. G3 da daño ×1.6, área ×1.6 y Elephant Gun (puño de Gigant Battle); al acabar, Luffy queda encogido 4 s (daño ×0.7, velocidad ×0.8). G4 da daño ×2.2, CD ×0.7, −50% daño recibido y Kong Gun; al acabar, agotado 8 s (velocidad ×0.8, CD ×1.3). G5 da daño ×2.6, CD ×0.6, invulnerabilidad, enemigos al 50% de velocidad, Bajrang Gun y Dawn Whip; al acabar, agotado 12 s.
- Sprites: G4 (Boundman, Great Pirate Colosseum 3DS) y G5 (TheCube513) en assets/sprites/gears; G2 conserva el sprite base con piel rosada y vapor.
- Balance medido con bot (tools/balance-sim.js, argumentos [gear max] y 'evo'): Luffy 73% solo con G2, 79% con todos los Gears desbloqueados; con la carta evolucionada desde el minuto 4, G2 y G4/G5 quedan parejos (90% y 89%).
- Persistente (`meta.gear`): G3, G4 y G5 se desbloquean con logros (ganar con Luffy; ganar con Luffy en Clima 2 o más; ganar con Luffy en Clima 4). La tienda vende 3 mejoras menores (medidor inicial, carga y recuperación) que no dan daño.

## Transformaciones de Zoro y Sanji (js/gears.js, tabla `FORMS`)
- Mismo sistema que los Gears: carta propia (`zoroform` "Haki del Rey", `sanjiform` "Raid Suit"), medidor, ESPACIO o botón, y techo por carta (nv1 → nivel 1, nv3 → nivel 2, evolución → nivel 3).
- Zoro: Ryuo (daño ×1.3, CD ×0.7, −15% daño recibido) → Kyutoryu Asura (daño ×1.6, área ×1.3, Ashura Ichibugin de nueve cortes; al acabar, agotado 4 s) → Rey del Infierno con Enma (daño ×2.2, −50% daño recibido, tajo de Haoshoku; al acabar, Enma le chupa el Haki y queda agotado 8 s). Evoluciona con Poder.
- Sanji: Sky Walk (velocidad ×1.45, −20% daño recibido) → Raid Suit Stealth Black (invisible: −55% daño recibido, patadas invisibles) → Ifrit Jambe (daño ×2.2, llamas azules en área; al acabar, agotado 6 s). Evoluciona con Armadura de Haki.
- Desbloqueo (`meta.gear.forms`): el nivel 2 con una victoria del personaje y el nivel 3 con una victoria en Clima 2 o más.
- Balance con bot, todo desbloqueado (gear max 5): Luffy 83%, Sanji 78%, Zoro 73% (dentro de ±10). Para ello, Diable Jambe sube su daño base de 16 a 18.
- Renombrados para no repetir nombres: la evolución de Santoryu pasa a "Rokudo no Tsuji" y la de Concassé a "Bien Cuit: Grill Shot".

## Rendimiento y compatibilidad
- Medir con `tools/perf-bench.js` (servir el repo y `node tools/perf-bench.js http://localhost:8765/index.html luffy thrillerbark 6 4 300 high`; el 4 simula una CPU 4 veces más lenta). Es determinista: si cambia `level` o `ent`, ha cambiado la simulación y por tanto el balance.
- `updateUI()` durante la partida solo marca la interfaz como pendiente; `gameLoop` la vuelca una vez por frame. No escribir en el DOM del HUD cada frame.
- Lo que se dibuja en el mundo debe respetar el culling: `onScreen(x, y, margen)` con `VIEW_RECT` (js/render.js).
- No usar `ctx.filter` al dibujar cada frame: lento y sin soporte en Safari < 18. Usar `filteredSprite(img, 'filtro css')` (js/core.js), que lo cachea y tiene alternativa por matriz de color.
- Resolución interna: `RS` (1, 0.75 o 0.5) según la opción Calidad gráfica; la automática baja si el juego va por debajo de ~45 FPS. Para dibujar en coordenadas de pantalla usar `ctx.setTransform(RS, 0, 0, RS, 0, 0)`, nunca `(1, 0, 0, 1, 0, 0)`. `lowFx()` indica calidad baja (sin sombras).
- Imágenes bajo demanda: `ENEMY_IMG[tipo]` y `CHAR_IMG[personaje]` cargan sus frames la primera vez que se piden, y `loadImg(ruta)` descarga cada archivo una sola vez. `prefetchRun(mapa, personaje)` precarga el mapa y todo lo que nombra `MAP_ENEMIES[mapa]`.
- `sw.js`: imágenes y sonidos primero desde la caché; HTML, JS y CSS primero desde la red. Sube `CACHE_VER` si cambias un asset sin cambiarle el nombre.
