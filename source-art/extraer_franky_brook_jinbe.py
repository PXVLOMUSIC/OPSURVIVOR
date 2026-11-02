# Recorta a Franky, Brook y Jinbe jugables de sus hojas de One Piece: Gigant Battle! (DS, spritedatabase.net 12153, 12359 y 12117).
# Uso: python3 source-art/extraer_franky_brook_jinbe.py <carpeta sprites_originales> <assets/extracted>
# Las hojas miran a la derecha: se espejan para mirar a la izquierda como el resto de la tripulación.
# Orden de cada set: reposo, caminar, ataque, golpe (los índices de CHAR_ANIMS en js/core.js salen de aquí).
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
src, dst = sys.argv[1], sys.argv[2]
_argv = sys.argv; sys.argv = [_argv[0], src, '/tmp/_eb_dummy']
code = open(os.path.join(os.path.dirname(__file__), 'extraer_eastblue.py'), encoding='utf-8').read().split('# tipo:')[0]
exec(code)  # comps, trim y save_set
sys.argv = _argv
G = 'DS_GigantBattle1/'
SETS = {
    # reposo 0-1 · guardia 3 (la hoja no trae caminar: se anda con reposo + guardia) · Weapons Left 10-15 · golpe 36
    'franky_gb': (G + '12153_Franky.png', None, [0, 1, 3] + [10, 11, 12, 13, 14, 15] + [36]),
    # reposo con el bastón 1-6 · caminar con la espada 61-64 · estocada 17, 18, 21, 22 · golpe 23
    'brook_gb':  (G + '12359_Brook.png', None, [1, 2, 3, 4, 5, 6] + [61, 62, 63, 64] + [17, 18, 21, 22] + [23]),
    # reposo 0-3 · caminar de perfil 9-13 · Samegawara Seiken 14-18 · golpe 65
    'jinbe_gb':  (G + '12117_Jinbe.png', (0, 0, 1030, 1100), [0, 1, 2, 3] + [9, 10, 11, 12, 13] + [14, 15, 16, 17, 18] + [65]),
}
for t, (sheet, crop, idx) in SETS.items():
    p = os.path.join(src, sheet)
    if crop:
        tmp = '/tmp/_crop_' + t + '.png'; Image.open(p).convert('RGBA').crop(crop).save(tmp); p = tmp
    im, boxes = comps(p, 1)
    frames = [im.crop(boxes[i]).transpose(Image.FLIP_LEFT_RIGHT) for i in idx]
    save_set(frames, os.path.join(dst, t))
    print(t, len(idx))
