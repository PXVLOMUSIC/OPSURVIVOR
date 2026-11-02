# Recorta los sprites de Shell Town y Arlong Park de las hojas de la GBA (One Piece / Grand Battle, spritedatabase.net)
# Uso: python3 source-art/extraer_eastblue.py <carpeta sprites_originales/GBA_OnePiece> <assets/extracted>
# Cada tipo se guarda como sprite_000..N alineado por los pies (mismo lienzo para todos sus frames),
# así el sprite no baila al pasar de reposo a ataque. idle = primeros frames, attack = el resto (ver ENEMY_ANIMS).
import os, sys, colorsys
import numpy as np
from PIL import Image
from collections import deque

def comps(path, minpx=150):
    a = np.array(Image.open(path).convert('RGBA'))
    bg = a[0, 0, :3].copy()
    fg = np.any(a[:, :, :3] != bg, axis=2)
    H, W = fg.shape
    p = np.pad(fg, 1)
    d = np.zeros_like(fg)
    for dy in range(3):
        for dx in range(3):
            d |= p[dy:dy + H, dx:dx + W]
    lab = np.zeros((H, W), bool); boxes = []
    for y in range(H):
        for x in range(W):
            if d[y, x] and not lab[y, x]:
                q = deque([(y, x)]); lab[y, x] = True; x0 = x1 = x; y0 = y1 = y
                while q:
                    cy, cx = q.popleft()
                    x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < H and 0 <= nx < W and d[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = True; q.append((ny, nx))
                if fg[y0:y1 + 1, x0:x1 + 1].sum() >= minpx:
                    boxes.append((x0, y0, x1 + 1, y1 + 1))
    boxes.sort(key=lambda b: (b[1] // 40, b[0]))
    a[np.all(a[:, :, :3] == bg, axis=2), 3] = 0
    return Image.fromarray(a), boxes

def trim(im):
    bb = im.getbbox(); return im.crop(bb) if bb else im

def save_set(frames, out):
    frames = [trim(f) for f in frames]
    anchors = []
    for f in frames:
        al = np.array(f)[:, :, 3] > 0
        cols = np.where(al[-8:].any(axis=0))[0]
        anchors.append(int(cols.mean()) if len(cols) else f.width // 2)
    half = max(max(a, f.width - a) for a, f in zip(anchors, frames))
    H = max(f.height for f in frames)
    os.makedirs(out, exist_ok=True)
    for i, (f, a) in enumerate(zip(frames, anchors)):
        c = Image.new('RGBA', (half * 2, H), (0, 0, 0, 0))
        c.paste(f, (half - a, H - f.height), f)
        c.save(os.path.join(out, 'sprite_%03d.png' % i))

def hue_shift(im, dh):
    a = np.array(im).astype(np.float32) / 255
    out = a.copy()
    for y in range(a.shape[0]):
        for x in range(a.shape[1]):
            if a[y, x, 3] > 0:
                h, l, s = colorsys.rgb_to_hls(*a[y, x, :3])
                if s > 0.15: out[y, x, :3] = colorsys.hls_to_rgb((h + dh) % 1, l, s)
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8))

# tipo: (hoja, índices de componentes: reposo + ataque)
SETS = {
    'helmeppo':   ('4045_Helmeppo.gif',  [3, 4, 5, 6] + [7, 8, 9, 10]),
    'merman':     ('4041_Mermen.gif',    [0, 1, 9, 10] + [2, 3, 4]),
    'fat_merman': ('4042_FatMerman.gif', [4, 5] + [0, 1]),
    'kuroobi':    ('4057_ArlongsCrew.gif', [7, 8] + [4, 5, 6]),
    'chew':       ('4057_ArlongsCrew.gif', [29, 30, 31] + [23, 24, 25]),
    'hachi':      ('4057_ArlongsCrew.gif', [56, 57, 58, 59] + [46, 47]),
    'arlong':     ('4058_Arlong.gif',    [0, 1, 2, 3, 4] + [9, 10, 11, 12]),
}
src, dst = sys.argv[1], sys.argv[2]
cache = {}
for t, (sheet, idx) in SETS.items():
    if sheet not in cache: cache[sheet] = comps(os.path.join(src, sheet))
    im, boxes = cache[sheet]
    save_set([im.crop(boxes[i]) for i in idx], os.path.join(dst, t))
    print(t, len(idx))
# hombre-pez de piel azul (paleta cambiada; la hoja solo trae un frame azul)
m = os.path.join(dst, 'merman'); os.makedirs(os.path.join(dst, 'merman_b'), exist_ok=True)
for f in sorted(os.listdir(m)):
    hue_shift(Image.open(os.path.join(m, f)).convert('RGBA'), 0.33).save(os.path.join(dst, 'merman_b', f))
print('merman_b')
