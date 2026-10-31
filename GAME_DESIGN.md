# One Piece Survivor - Game Design Notes

## Characters
- Luffy: ranged attacks (stretchy). Melee? no. Ranged by default.
- Zoro: melee (swords). Ranged abilities unlockable via level upgrades.
- Sanji: melee (legs). Ranged abilities unlockable via level upgrades.

## Maps
- Must be recognizable One Piece locations, well represented (Baratie, Alabasta, Skypiea, Water 7, etc.).

## Sprites
- Extracted from GBA sheets; animations mapped in CHAR_ANIMS (OPSURVIVOR.html).
- Keep character abilities consistent with manga/anime.

## Notes
- Be efficient; resume answers.
## Gears de Luffy (js/gears.js)
- La carta "Gears" (id interno `gear2`) ocupa un solo slot. Llena un medidor (kills + carga pasiva) que se activa con ESPACIO o con el botón G.
- Techo dentro de la partida: carta nv1 → G2, nv3 → G3, evolución → G4, G4 + minuto 6 → G5 (que se recarga en 3 min).
- Efectos: G2 da +vel., −40% CD y drena vida. G3 da daño ×1.6, área ×1.6 y Elephant Gun; al acabar, Luffy queda encogido 4 s. G4 da daño ×1.8, −50% daño recibido y Kong Gun; al acabar, agotado 10 s. G5 da daño ×2.2, invulnerabilidad, enemigos al 50% de velocidad, Bajrang Gun y Dawn Whip; al acabar, agotado 12 s y vida máxima al 40%.
- Persistente (`meta.gear`): G3, G4 y G5 se desbloquean con logros (ganar con Luffy; ganar con Luffy en Clima 2 o más; ganar con Luffy en Clima 4). La tienda vende 3 mejoras menores (medidor inicial, carga y recuperación) que no dan daño.
