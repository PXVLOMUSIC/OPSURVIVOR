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
