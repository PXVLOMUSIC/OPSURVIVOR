# Fuentes de sprites (One Piece)

## Sitios de referencia
- Spriters Resource (GBA One Piece): https://www.spriters-resource.com/game_boy_advance/onepiece/
- DeviantArt - One Piece Sprites gallery: https://www.deviantart.com/one-piece-sprites/gallery/51550636/sprite-sheet
- DeviantArt - Morgan OPGB Sprite Sheet: https://www.deviantart.com/rayavenger/art/Morgan-OPGB-Sprite-Sheet-617519905
- Vamos a Jugar - Custom Sprites: https://vamosajugar.net/everyonepeace/Galerias/Sprites/Custom/index.htm
- Kuma: https://vamosajugar.net/everyonepeace/Galerias/Sprites/Custom/peke/kuma.png
- Moria: https://vamosajugar.net/everyonepeace/Galerias/Sprites/Custom/peke/moria.png
- Tararan: https://vamosajugar.net/everyonepeace/Galerias/Sprites/Custom/peke/tararan.png

## Sprites ya integrados (local)
- assets/extracted/<personaje>_gba/ (extraídos de los PNG locales)
- assets/sprites/ (representativos para el juego)
- source-art/ (hojas originales y frames limpios; no se cargan en el juego)
- source-art/sprites_originales/ (colección completa de hojas por juego, Luffy_Gears, CATALOGO_ROLES.txt y CREDITOS.txt; solo local, ignorada en .gitignore por ser material de uso no comercial y pesado)

## Notas
- Si se descargan nuevos sheets, procesar con source-art/process_animations.py (tratar fondo como transparente).
- Añadir nuevos personajes a CHAR_ANIMS y SPRITE_PATHS en js/core.js.
## Enemigos y jefes por mapa (2026-10-31)
Recortados de hojas de https://spritedatabase.net (ficha: https://spritedatabase.net/file/<ID>). Material ripeado con copyright; uso exclusivamente no comercial. Crédito a los rippers indicados en cada ficha.
- Baratie: piratas de Krieg de espada, pistola y bomba (GBA One Piece, 4034, 4035, 4037; rips de Croix y Grim), Pearl (4054, harsh29), Gin (4055, Grim).
- Alabasta: Crocodile, Mr. 1 y Mr. 2 (WonderSwan Grand Battle Swan Colosseum, 4316, 4314, 4315), Mr. 5, Miss Valentine, Mr. 4, Miss Merry Christmas y Miss Doublefinger (WonderSwan Treasure Wars 2, 4365, 4362, 4363, 4364, 4360; dimps), dugongos kung-fu (DS Gigant Battle, 12482, Maverick-PK).
- Skypiea: Enel (DS Gigant Battle, 12054, Nightmare), Wiper (DS Gigant Battle 2, 14722, Grim), guerreros shandia (DS Gigant Battle, 12483, Maverick-PK), Satori, Shura, Gedatsu y Ohm (3DS Great Pirate Colosseum, 21126, 21127, 21036, 21052; Megadoomer). Los de DS y 3DS están reescalados a la altura de los sprites GBA.

## Enemigos nuevos y tripulación (2026-11-01)
Misma fuente y licencia: spritedatabase.net, uso exclusivamente no comercial. El autor de cada rip está en la ficha https://spritedatabase.net/file/<ID>.
- Baratie: pirata hambriento de Krieg (GBA One Piece, 4034), pirata del cuchillo (GBA One Piece, 4036), marine de espada (GBA One Piece, 4038), Jango (GBA One Piece, 4052) y Fullbody (WonderSwan Treasure Wars 2, 4357).
- Alabasta: Tashigi (WonderSwan Treasure Wars 2, 4344).
- Tama de Satori, tiburón del cielo, Negative Hollow, barriles, vasijas y faroles: dibujados por código en `js/core.js` y `js/loot.js`, sin sprite externo.
- Nami, Usopp, Chopper y Robin: WonderSwan Grand Battle Swan Colosseum (4306, 4307, 4309, 4310), espejados para mirar a la izquierda como el resto de personajes. Sus carteles de Se Busca (`assets/wanted/`) están generados con el sprite y la recompensa del manga; el de Usopp es el de Sogeking.
- Enies Lobby: Rob Lucci, Kaku y Spandam (DS Gigant Battle, 12061 rip de Nightmare, 12058 rip de Bonzai, 12236 rip de Maverick-PK). Mapa: arte de Pablo (`source-art/maps/hd/enieslobby.png`), colisión sacada de su línea roja.
- Marineford: Almirantes Akainu (12761), Aokiji (12457) y Kizaru (9445), de DS Gigant Battle. Mapa: arte de Pablo (`source-art/maps/hd/marineford.png`), colisión elíptica ajustada a la cara superior de la plataforma.
- Water 7: Franky (DS Gigant Battle, 12153) y Rob Lucci con traje de Galley-La (frames humanos de 12061). Mapa: arte de Pablo (`source-art/maps/hd/water7.png`), colisión desde su línea roja.
- Wano (asalto a Onigashima): Kaido (21137, rip de Megadoomer), X Drake (21139, rip de Grim), Basil Hawkins (21133, Megadoomer) y Kurozumi Kanjuro con sus dibujos de tinta (21114, Megadoomer), de One Piece: Great Pirate Colosseum (3DS), vía The Sprite Database. Los piratas de las Bestias reutilizan los piratas genéricos de la GBA. Mapa: arte de Pablo (`source-art/maps/hd/wano.png`), con la misma colisión que Whole Cake. Jack (21138) no se usa porque su hoja solo trae el busto.

## Wano (Calamidades y Tobiroppo) y Whole Cake (2026-11-01)
No existen sprites 2D oficiales de estos arcos (los juegos 2D de spritedatabase.net acaban antes), así que se usan hojas hechas por fans en estilo One Piece Gigant Battle (DS), publicadas en DeviantArt. Uso exclusivamente no comercial; el crédito es de cada autor. Las hojas originales están en `source-art/sprites_originales/Wano` y `WholeCake` (solo local) y se recortan con `source-art/extraer_wano_wholecake.py`. A los personajes con un único frame el script les sintetiza la respiración y el golpe.
- Jack, Queen (cuerpo), Ulti, Page One y Black Maria: Hecbator, compendio «All My One Piece Gigant Battle Chars» (DeviantArt 1319624632). Queen con brazo cíborg: Hecbator 854884641. Sasaki: Hecbator 943936217.
- King en forma de pteranodon (vuelo y llamarada): drawkars 935467598.
- Big Mom con Prometheus y Zeus: drawkars 934598510. Katakuri: VolknerThanh 731173210. Smoothie: drawkars 718010975. Barón Tamago: Hecbator 336082452.
- Pekoms: rip oficial de One Piece: Great Pirate Colosseum (3DS), spritedatabase.net 21189, de Megadoomer, reducido a la altura de los demás.
- Soldados de ajedrez (blancos y negros): dibujados por código en `source-art/dibujar_soldado_ajedrez.py`.
- Hojas completas sin usar (con andar y más ataques; requieren sesión en DeviantArt): Big Mom de Gameinvader247 (1197000597, subida por Alexis2jj) y Katakuri de drawkars (724495953). Si se descargan, basta con recortarlas en el script.
