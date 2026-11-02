# Genera los iconos pixel art de técnicas, armas y pasivas (cartas de nivel, HUD y pausa).
# Cada icono se dibuja a 20x20 y el contorno oscuro lo deja en 22x22 (se escala x1/x2 con image-rendering: pixelated).
# Salida: source-art/iconos_habilidades.png (hoja), source-art/iconos_habilidades_x4.png (vista previa)
#         y js/pixicons.js (hoja incrustada en data URL + índice por id).
# Uso: python3 source-art/dibujar_iconos_habilidades.py
from PIL import Image, ImageDraw
import os, math, base64, io, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
N = 20           # lienzo de dibujo
CELL = N + 2     # con contorno
OUT_LINE = (26, 14, 22, 255)

def C(h, a=255):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

# Paleta común (tonos del anime: piel cálida, rojo Mugiwara, verde Zoro, azul Sanji...)
P = {k: C(v) for k, v in dict(
    skin='f4c49a', skinL='ffe1c4', skinD='c98a5e',
    red='d93a2f', redL='ff6b4a', redD='8f1d1d',
    yel='f7c948', yelL='fff09a', yelD='c98a1c',
    ora='f28c28', oraL='ffc163',
    grn='3fa34d', grnL='8fe08a', grnD='1f6b33',
    blu='3b7dd8', bluL='8cc4ff', bluD='1f4a8f',
    cya='5fd4f0', cyaL='c9f4ff',
    pur='7b3fc4', purL='b48af0', purD='45207a',
    pnk='f07ab4', pnkL='ffc2df', pnkD='b8457f',
    wht='f6f2e8', gry='a6a9b6', gryD='61646f', stl='d4dae6', stlD='8b93a6',
    blk='2a2533', blkL='4a4458', brn='8a5a32', brnL='b98552', brnD='5a3518',
    straw='f2d27a', strawD='c9a24a', sea='2f6fb0',
).items()}

def new():
    im = Image.new('RGBA', (N, N)); return im, ImageDraw.Draw(im)

def px(d, pts, col):
    for p in pts: d.point(p, fill=col)

def outline(im):
    w, h = im.size
    src = im.load()
    out = Image.new('RGBA', (w + 2, h + 2)); out.paste(im, (1, 1)); p = out.load()
    for y in range(h + 2):
        for x in range(w + 2):
            if p[x, y][3]: continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                sx, sy = x + dx - 1, y + dy - 1
                if 0 <= sx < w and 0 <= sy < h and src[sx, sy][3] >= 128:
                    p[x, y] = OUT_LINE; break
    return out

# ---------- piezas reutilizables ----------
def fist(d, x, y, base='skin', light='skinL', dark='skinD'):
    """Puño visto de lado mirando a la derecha; (x,y) esquina sup. izq., 8x7."""
    d.rounded_rectangle([x, y, x + 7, y + 6], 2, fill=P[base])
    d.line([(x + 1, y), (x + 5, y)], fill=P[light])
    for k in (2, 4, 6):  # nudillos
        d.line([(x + k, y + 1), (x + k, y + 3)], fill=P[dark])
    d.line([(x + 1, y + 4), (x + 5, y + 4)], fill=P[dark])  # pulgar

def sword(d, a, b, hilt, guard='yel', blade='stl'):
    """Katana de a (punta) a b (pomo)."""
    ax, ay = a; bx, by = b
    L = math.hypot(bx - ax, by - ay); ux, uy = (bx - ax) / L, (by - ay) / L
    hx, hy = bx - ux * 5, by - uy * 5
    d.line([a, (hx, hy)], fill=P[blade], width=2)
    d.line([a, (hx - uy * 0.0, hy)], fill=P['wht'], width=1)
    gx, gy = hx, hy
    d.line([(gx - uy * 2, gy + ux * 2), (gx + uy * 2, gy - ux * 2)], fill=P[guard], width=2)
    d.line([(hx + ux, hy + uy), b], fill=P[hilt], width=2)

def cloud(d, x, y, col='gry', light='wht', w=12):
    d.ellipse([x, y + 2, x + 6, y + 7], fill=P[col])
    d.ellipse([x + 3, y, x + 10, y + 7], fill=P[col])
    d.ellipse([x + w - 6, y + 2, x + w, y + 7], fill=P[col])
    d.rectangle([x + 2, y + 5, x + w - 2, y + 7], fill=P[col])
    d.line([(x + 4, y + 1), (x + 7, y + 1)], fill=P[light])

def flame(d, cx, by, h, w, outer='red', mid='ora', inner='yel'):
    d.polygon([(cx, by - h), (cx + w, by - h // 3), (cx + w - 1, by), (cx - w + 1, by), (cx - w, by - h // 3)], fill=P[outer])
    d.polygon([(cx, by - h + 3), (cx + w - 2, by - h // 3), (cx + w - 3, by - 1), (cx - w + 3, by - 1), (cx - w + 2, by - h // 3)], fill=P[mid])
    d.polygon([(cx, by - h + 6), (cx + 1, by - 3), (cx - 1, by - 3)], fill=P[inner])
    d.ellipse([cx - 2, by - 5, cx + 2, by - 1], fill=P[inner])

def shoe(d, x, y, col='blk', light='blkL', flip=False):
    """Zapato de vestir de Sanji (punta a la derecha), 9x4."""
    pts = [(x, y), (x + 4, y), (x + 5, y + 1), (x + 8, y + 2), (x + 8, y + 4), (x, y + 4)]
    d.polygon(pts, fill=P[col]); d.line([(x + 1, y + 1), (x + 4, y + 1)], fill=P[light])

def star(d, cx, cy, r1, r2, col, n=5, rot=-90):
    pts = []
    for i in range(n * 2):
        r = r1 if i % 2 == 0 else r2
        a = math.radians(rot + i * 180 / n)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(pts, fill=P[col])

def bolt(d, x, y, col='yel', light='yelL'):
    d.polygon([(x + 4, y), (x, y + 6), (x + 3, y + 6), (x + 1, y + 11), (x + 7, y + 4), (x + 4, y + 4), (x + 6, y)], fill=P[col])
    d.line([(x + 4, y + 1), (x + 2, y + 5)], fill=P[light])

def arc_lines(d, box, a0, a1, col, w=1):
    d.arc(box, a0, a1, fill=P[col], width=w)

def arm_sprout(d, x, y, h, skin='skin', sleeve=None):
    """Brazo de Robin que brota hacia arriba con la mano abierta (ancho 4)."""
    d.rectangle([x + 1, y + 4, x + 2, y + h], fill=P[skin])
    d.rectangle([x, y + 1, x + 3, y + 4], fill=P[skin])
    px(d, [(x, y), (x + 2, y), (x + 3, y - 0)], P[skin])
    d.line([(x + 1, y + 1), (x + 1, y + 3)], fill=P['skinD'])
    px(d, [(x + 1, y + h)], P['skinD'])

def petals(d, pts, col='pnk', light='pnkL'):
    for (x, y) in pts:
        px(d, [(x, y), (x + 1, y), (x, y + 1)], P[col]); px(d, [(x, y)], P[light])

# ---------- iconos ----------
ICONS = {}
def icon(name):
    def deco(fn):
        ICONS[name] = fn; return fn
    return deco

# ===== LUFFY =====
@icon('pistol')
def _():
    im, d = new()
    # brazo de goma estirándose con la manga roja del chaleco y el puño
    d.rectangle([0, 8, 3, 13], fill=P['red']); d.line([(0, 8), (3, 8)], fill=P['redL'])
    d.rectangle([4, 9, 11, 12], fill=P['skin']); d.line([(4, 9), (11, 9)], fill=P['skinL']); d.line([(4, 12), (11, 12)], fill=P['skinD'])
    fist(d, 11, 7)
    for yy in (4, 16):
        d.line([(5, yy), (10, yy)], fill=P['wht'])
    return im

@icon('gatling')
def _():
    im, d = new()
    # ráfaga de puños con estelas
    for (x, y, k) in ((1, 1, 0), (11, 4, 1), (3, 8, 1), (12, 12, 0), (2, 14, 0)):
        d.line([(max(0, x - 6), y + 3), (x, y + 3)], fill=P['skinL'] if k else P['wht'])
        fist(d, x, y)
    return im

@icon('bazooka')
def _():
    im, d = new()
    # las dos palmas abiertas empujando (Gomu Gomu no Bazooka)
    for y0 in (2, 11):
        d.rectangle([0, y0 + 2, 6, y0 + 5], fill=P['skin']); d.line([(0, y0 + 2), (6, y0 + 2)], fill=P['skinL'])
        d.rounded_rectangle([7, y0, 13, y0 + 7], 1, fill=P['skin'])
        for k in range(4):
            d.rectangle([14, y0 + k * 2, 16, y0 + k * 2], fill=P['skin'])
        d.line([(9, y0 + 1), (9, y0 + 6)], fill=P['skinD'])
        px(d, [(17, y0 + 1), (17, y0 + 3), (17, y0 + 5)], P['skinL'])
    d.line([(18, 2), (19, 0)], fill=P['wht']); d.line([(18, 17), (19, 19)], fill=P['wht']); d.line([(18, 9), (19, 9)], fill=P['wht'])
    return im

@icon('gear2')
def _():
    im, d = new()
    # Gear Second: piel rosada humeante
    d.rounded_rectangle([5, 7, 15, 15], 3, fill=C('f5a3a3'))
    d.line([(6, 7), (13, 7)], fill=C('ffd1cc'))
    for k in (8, 10, 12):
        d.line([(k, 8), (k, 11)], fill=C('c0606a'))
    d.line([(6, 13), (12, 13)], fill=C('c0606a'))
    d.rectangle([1, 9, 5, 13], fill=C('f5a3a3'))
    for (x, y, r) in ((3, 1, 3), (9, 0, 3), (15, 2, 3), (17, 9, 2), (1, 15, 2)):
        d.ellipse([x - r, y, x + r, y + r * 2], fill=P['wht'])
        px(d, [(x - r + 1, y + 1)], C('ffffff'))
    return im

@icon('muchi')
def _():
    im, d = new()
    # Muchi: la pierna barre en horizontal dejando un abanico de estelas
    for k, col in enumerate(('wht', 'skinL', 'wht')):
        d.arc([2 + k * 2, 1 + k * 2, 19 - k * 2, 18 - k * 2], 190, 350, fill=P[col], width=1)
    d.rectangle([0, 13, 5, 18], fill=C('3b5ba8')); d.line([(0, 13), (5, 13)], fill=C('6f8fd8'))
    d.line([(5, 15), (15, 15)], fill=P['skin'], width=3)
    d.line([(5, 14), (15, 14)], fill=P['skinL'])
    d.polygon([(15, 12), (19, 13), (19, 17), (15, 17)], fill=P['skin'])
    d.line([(15, 17), (19, 17)], fill=P['strawD'])
    return im

@icon('ono')
def _():
    im, d = new()
    # Ono: la pierna estirada al cielo cae como un hacha (estela en arco e impacto)
    d.arc([1, 0, 21, 22], 200, 270, fill=P['wht'], width=1)
    d.arc([3, 2, 19, 20], 200, 260, fill=P['skinL'], width=1)
    d.line([(14, 0), (8, 14)], fill=P['skin'], width=3)
    d.line([(13, 0), (7, 13)], fill=P['skinL'])
    d.polygon([(5, 13), (10, 13), (10, 16), (4, 16)], fill=P['skin'])
    d.line([(3, 16), (10, 16)], fill=P['strawD'], width=1)
    d.rectangle([13, 0, 18, 2], fill=C('3b5ba8'))
    d.line([(0, 18), (19, 18)], fill=P['brn'], width=2)
    for (a, b) in (((1, 13), (3, 16)), ((13, 13), (11, 16)), ((15, 15), (12, 17))):
        d.line([a, b], fill=P['yel'])
    return im

@icon('hakiPulse')
def _():
    im, d = new()
    # Haoshoku: onda negra con relámpagos rojos
    d.ellipse([2, 2, 17, 17], outline=P['blk'], width=2)
    d.ellipse([6, 6, 13, 13], fill=P['blk'])
    for (a, b, c2) in (((9, 0), (7, 4), (10, 6)), ((19, 9), (15, 8), (14, 11)), ((10, 19), (12, 15), (9, 13)), ((0, 10), (4, 11), (5, 8))):
        d.line([a, b, c2], fill=P['red'], width=1)
    px(d, [(9, 9), (10, 10)], P['redL'])
    return im

# ===== ZORO =====
@icon('zoroform')
def _():
    im, d = new()
    # Haki del Rey: Enma (empuñadura morada) envuelta en aura negra y relámpagos rojos
    d.polygon([(3, 1), (7, 0), (19, 15), (16, 19)], fill=P['blk'])
    sword(d, (3, 2), (17, 17), 'purD', guard='yel')
    for (a, b) in (((0, 9), (4, 12)), ((8, 19), (11, 15)), ((12, 1), (10, 5)), ((19, 6), (15, 7))):
        d.line([a, b], fill=P['red'])
    return im

@icon('santoryu')
def _():
    im, d = new()
    # tres katanas: Wado Ichimonji (blanca), Sandai Kitetsu (granate) y Shusui/Enma (negra)
    sword(d, (1, 1), (17, 18), 'wht', guard='yel')
    sword(d, (18, 1), (2, 18), 'redD', guard='yelD')
    sword(d, (10, 0), (10, 19), 'blk', guard='yel')
    return im

@icon('onigiri')
def _():
    im, d = new()
    # Oni Giri: dos katanas cruzadas (Wado y Kitetsu) sobre el tajo verde en X
    d.line([(0, 2), (19, 17)], fill=P['grnL'], width=3)
    d.line([(0, 17), (19, 2)], fill=P['grnL'], width=3)
    d.line([(1, 2), (18, 16)], fill=P['wht']); d.line([(1, 17), (18, 3)], fill=P['wht'])
    sword(d, (3, 9), (17, 12), 'wht', guard='yel')
    sword(d, (16, 6), (2, 15), 'redD', guard='yelD')
    return im

@icon('flyingslash')
def _():
    im, d = new()
    # Sanjuroku Pound Ho: media luna de aire cortante
    d.pieslice([0, 0, 19, 19], 300, 60, fill=P['cyaL'])
    d.pieslice([-4, 0, 15, 19], 300, 60, fill=(0, 0, 0, 0))
    d.arc([0, 0, 19, 19], 300, 60, fill=P['wht'], width=1)
    d.line([(0, 6), (6, 6)], fill=P['cya']); d.line([(0, 10), (8, 10)], fill=P['cya']); d.line([(0, 14), (6, 14)], fill=P['cya'])
    return im

@icon('tatsumaki')
def _():
    im, d = new()
    # Tatsumaki: tornado verde
    for i, (w, y) in enumerate(((18, 1), (15, 4), (12, 7), (10, 10), (7, 13), (4, 16))):
        x0 = 10 - w // 2 + (i % 2)
        d.rectangle([x0, y, x0 + w, y + 2], fill=P['grn'] if i % 2 else P['grnL'])
        d.line([(x0 + 1, y), (x0 + w // 2, y)], fill=P['wht'])
    d.rectangle([9, 18, 10, 19], fill=P['grnD'])
    return im

@icon('poundho')
def _():
    im, d = new()
    # 108 Pound Ho: cañonazo de tres medias lunas (una por espada)
    for k, col in enumerate(('cyaL', 'cya', 'wht')):
        x = 4 + k * 5
        d.arc([x - 6, 1, x + 4, 18], 300, 60, fill=P[col], width=2)
    d.line([(0, 9), (5, 9)], fill=P['wht'])
    return im

# ===== SANJI =====
@icon('sanjiform')
def _():
    im, d = new()
    # Raid Suit: casco negro de Germa con visor y la ceja en espiral de Sanji
    d.rounded_rectangle([3, 2, 16, 17], 4, fill=P['blk'])
    d.line([(5, 3), (13, 3)], fill=P['blkL'])
    d.rectangle([4, 8, 15, 11], fill=P['bluD']); d.line([(5, 9), (14, 9)], fill=P['bluL'])
    px(d, [(12, 5), (13, 5), (14, 6), (13, 7), (12, 6)], P['yel'])  # ceja en espiral
    d.text((8, 12), '3', fill=P['yel'])
    d.rectangle([7, 17, 12, 19], fill=P['blk'])
    return im

@icon('diablejambe')
def _():
    im, d = new()
    # pierna en llamas
    flame(d, 10, 18, 18, 8)
    d.line([(3, 19), (13, 7)], fill=P['blk'], width=3)
    shoe(d, 11, 3)
    return im

@icon('collier')
def _():
    im, d = new()
    # patada al cuello: zapato subiendo con estallido de impacto
    star(d, 13, 6, 6, 3, 'yel', n=6)
    star(d, 13, 6, 3, 1, 'wht', n=6)
    d.line([(1, 19), (8, 10)], fill=P['blk'], width=3)
    d.polygon([(6, 9), (10, 6), (12, 7), (9, 12)], fill=P['blk'])
    d.line([(7, 9), (10, 7)], fill=P['blkL'])
    d.line([(2, 13), (5, 9)], fill=P['wht']); d.line([(5, 17), (9, 13)], fill=P['wht'])
    return im

@icon('joueshot')
def _():
    im, d = new()
    # Joue Shot: zapato de Sanji con onda de choque hacia delante
    d.line([(0, 17), (5, 13)], fill=P['blk'], width=4)
    d.polygon([(3, 9), (8, 9), (10, 11), (14, 12), (14, 15), (3, 15)], fill=P['blk'])
    d.line([(4, 10), (8, 10)], fill=P['blkL']); d.line([(3, 15), (14, 15)], fill=P['gryD'])
    for k, col in enumerate(('ora', 'yel', 'wht')):
        d.arc([11 + k * 2, 3 + k, 19, 19 - k], 290, 70, fill=P[col], width=1)
    return im

@icon('concasse')
def _():
    im, d = new()
    # Concassé: talón cayendo con grietas
    d.rectangle([8, 0, 11, 9], fill=P['blk']); d.line([(8, 0), (8, 9)], fill=P['blkL'])
    d.polygon([(7, 9), (12, 9), (13, 13), (6, 13)], fill=P['blk'])
    d.line([(0, 15), (19, 15)], fill=P['brn'], width=2)
    d.line([(9, 14), (6, 19)], fill=P['brnD']); d.line([(11, 14), (14, 19)], fill=P['brnD']); d.line([(10, 14), (10, 19)], fill=P['brnD'])
    for (a, b) in (((3, 9), (5, 12)), ((16, 9), (14, 12))):
        d.line([a, b], fill=P['yel'])
    return im

@icon('partycourse')
def _():
    im, d = new()
    # Party Table Kick Course: patadas girando en círculo
    d.ellipse([1, 1, 18, 18], outline=P['wht'], width=1)
    d.arc([3, 3, 16, 16], 0, 300, fill=P['ora'], width=2)
    for ang in (0, 120, 240):
        a = math.radians(ang)
        cx, cy = 10 + 7 * math.cos(a), 10 + 7 * math.sin(a)
        d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=P['blk'])
    d.ellipse([8, 8, 11, 11], fill=P['yel'])
    return im

# ===== ARMAS COMPARTIDAS =====
@icon('cuchillo')
def _():
    im, d = new()
    d.polygon([(19, 0), (8, 9), (10, 11)], fill=P['stl'])
    d.line([(18, 1), (9, 9)], fill=P['wht'])
    d.line([(6, 8), (11, 13)], fill=P['yelD'], width=2)
    d.line([(8, 12), (2, 18)], fill=P['brn'], width=3)
    d.line([(7, 12), (2, 17)], fill=P['brnL'])
    return im

@icon('granada')
def _():
    im, d = new()
    # bomba de mano pirata con la mecha encendida
    d.ellipse([2, 5, 16, 19], fill=P['blk'])
    d.ellipse([4, 7, 8, 11], fill=P['blkL']); px(d, [(5, 8)], P['gry'])
    d.rectangle([8, 3, 11, 6], fill=P['gryD'])
    d.line([(10, 3), (13, 1), (15, 2)], fill=P['brnL'])
    star(d, 16, 2, 3, 1, 'yel', n=4, rot=0); px(d, [(16, 2)], P['wht'])
    return im

@icon('rifle')
def _():
    im, d = new()
    # mosquete de la Marina
    d.line([(1, 17), (18, 2)], fill=P['gryD'], width=2)
    d.line([(2, 16), (18, 2)], fill=P['stl'])
    d.polygon([(0, 19), (2, 14), (8, 9), (10, 11), (4, 18)], fill=P['brn'])
    d.line([(1, 17), (7, 11)], fill=P['brnL'])
    d.line([(8, 12), (9, 15)], fill=P['gryD'])
    return im

@icon('ballesta')
def _():
    im, d = new()
    d.arc([1, 1, 18, 14], 190, 350, fill=P['brn'], width=2)
    d.line([(3, 6), (10, 11), (16, 6)], fill=P['wht'])
    d.line([(10, 2), (10, 19)], fill=P['brnD'], width=2)
    d.polygon([(10, 0), (8, 3), (12, 3)], fill=P['stl'])
    d.line([(10, 3), (10, 12)], fill=P['stl'])
    return im

@icon('lanza')
def _():
    im, d = new()
    d.line([(1, 19), (13, 7)], fill=P['brn'], width=2)
    d.line([(1, 18), (12, 7)], fill=P['brnL'])
    d.polygon([(19, 0), (11, 5), (14, 8)], fill=P['stl'])
    d.line([(18, 1), (13, 6)], fill=P['wht'])
    d.line([(11, 7), (14, 10)], fill=P['red'], width=2)
    return im

@icon('hacha')
def _():
    im, d = new()
    d.line([(3, 19), (13, 3)], fill=P['brn'], width=2)
    d.polygon([(10, 1), (18, 2), (19, 9), (14, 10), (12, 6)], fill=P['stl'])
    d.line([(17, 3), (18, 8)], fill=P['wht'])
    d.line([(11, 2), (14, 9)], fill=P['stlD'])
    return im

@icon('shuriken')
def _():
    im, d = new()
    star(d, 10, 10, 9, 3, 'stl', n=4, rot=-90)
    star(d, 10, 10, 6, 2, 'stlD', n=4, rot=-45)
    d.ellipse([8, 8, 11, 11], fill=P['blk'])
    px(d, [(10, 2), (10, 3), (3, 10)], P['wht'])
    return im

@icon('dial')
def _():
    im, d = new()
    # Impact Dial: concha de Skypiea en espiral
    d.ellipse([1, 4, 18, 18], fill=C('f3dfc0'))
    d.arc([4, 7, 15, 16], 180, 520, fill=C('c49a6c'), width=1)
    d.arc([7, 9, 12, 14], 0, 300, fill=C('c49a6c'), width=1)
    d.polygon([(14, 4), (19, 1), (18, 7)], fill=C('e8c79c'))
    d.line([(3, 7), (6, 5)], fill=P['wht'])
    return im

# ===== TRIPULACIÓN: armas insignia =====
@icon('kabuto')
def _():
    im, d = new()
    # Kabuto: tirachinas de Usopp con la bola
    d.line([(8, 19), (8, 10)], fill=P['brn'], width=3)
    d.line([(8, 11), (2, 2)], fill=P['brn'], width=3)
    d.line([(8, 11), (14, 2)], fill=P['brn'], width=3)
    d.line([(7, 11), (2, 3)], fill=P['brnL'])
    d.rectangle([7, 12, 9, 14], fill=P['red'])
    d.line([(2, 2), (8, 7), (14, 2)], fill=P['gry'])
    d.ellipse([13, 9, 19, 15], fill=P['ora']); px(d, [(15, 10), (14, 11)], P['oraL'])
    return im

@icon('climatact')
def _():
    im, d = new()
    # Clima-Tact azul con nube de trueno
    d.line([(2, 19), (11, 10)], fill=P['blu'], width=3)
    d.line([(2, 18), (10, 10)], fill=P['bluL'])
    d.line([(5, 15), (7, 17)], fill=P['bluD'], width=1); d.line([(8, 12), (10, 14)], fill=P['bluD'])
    cloud(d, 7, 0, 'gryD', 'gry')
    bolt(d, 13, 6)
    return im

@icon('roseo')
def _():
    im, d = new()
    # Kokutei Roseo Mirror: pezuña de Chopper y flor de cerezo
    d.rounded_rectangle([1, 4, 10, 14], 3, fill=P['brn'])
    d.line([(2, 5), (8, 5)], fill=P['brnL'])
    d.rectangle([1, 13, 10, 16], fill=C('3a2a20'))
    d.line([(5, 13), (5, 16)], fill=P['brnD'])
    for ang in range(0, 360, 72):
        a = math.radians(ang - 90)
        cx, cy = 14 + 3.5 * math.cos(a), 11 + 3.5 * math.sin(a)
        d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=P['pnk'])
    d.ellipse([13, 10, 15, 12], fill=P['yel']); px(d, [(13, 7)], P['pnkL'])
    return im

@icon('clutch')
def _():
    im, d = new()
    # Seis Fleur Clutch: brazos que brotan entre pétalos
    for x, y, h in ((2, 4, 15), (8, 1, 18), (14, 5, 14)):
        arm_sprout(d, x, y, h)
    petals(d, [(6, 12), (12, 16), (17, 1), (0, 1), (11, 8)])
    return im

# ===== NAMI =====
@icon('gustsword')
def _():
    im, d = new()
    for k, col in enumerate(('cyaL', 'wht', 'cya')):
        y = 4 + k * 5
        d.line([(0, y + 3), (6, y + 1), (13, y), (19, y - 2)], fill=P[col], width=2)
    d.polygon([(19, 0), (15, 1), (18, 4)], fill=P['wht'])
    return im

@icon('tornado')
def _():
    im, d = new()
    # piezas del Clima-Tact girando dentro de un tornado azul
    for i, (w, y) in enumerate(((16, 2), (13, 6), (10, 10), (7, 14))):
        x0 = 10 - w // 2
        d.arc([x0, y, x0 + w, y + 4], 0, 360, fill=P['cyaL'] if i % 2 else P['cya'], width=1)
    d.line([(10, 17), (10, 19)], fill=P['cya'])
    d.line([(2, 4), (5, 1)], fill=P['blu'], width=2); d.line([(15, 13), (18, 10)], fill=P['blu'], width=2)
    return im

@icon('thunderbreed')
def _():
    im, d = new()
    cloud(d, 2, 0, 'blkL', 'gryD', w=16)
    bolt(d, 4, 8); bolt(d, 11, 7)
    return im

@icon('raintempo')
def _():
    im, d = new()
    cloud(d, 2, 0, 'gry', 'wht', w=16)
    for (x, y) in ((3, 10), (8, 11), (13, 10), (5, 15), (11, 16), (16, 14)):
        d.line([(x + 1, y), (x, y + 3)], fill=P['bluL'])
    return im

@icon('namiform')
def _():
    im, d = new()
    # Sorcery Clima-Tact con Zeus (nube con cara) y estrellas
    d.line([(1, 19), (9, 11)], fill=P['blu'], width=3)
    d.ellipse([8, 8, 12, 12], fill=P['bluL'])
    cloud(d, 6, 1, 'wht', 'wht', w=13)
    px(d, [(10, 4), (13, 4)], P['blk']); d.line([(10, 6), (13, 6)], fill=P['blk'])
    star(d, 3, 4, 3, 1, 'yel', n=4, rot=0)
    star(d, 17, 13, 2.5, 1, 'yel', n=4, rot=0)
    return im

# ===== USOPP =====
@icon('namari')
def _():
    im, d = new()
    for (x, y, r) in ((14, 8, 4), (6, 4, 2), (5, 13, 3), (1, 9, 1)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=P['gryD'])
        px(d, [(x - r + 1, y - r + 1)], P['stl'])
    d.line([(0, 2), (3, 2)], fill=P['wht']); d.line([(0, 17), (4, 17)], fill=P['wht'])
    return im

@icon('kaen')
def _():
    im, d = new()
    flame(d, 9, 19, 14, 7)
    d.ellipse([12, 1, 18, 7], fill=P['blk']); px(d, [(14, 2)], P['blkL'])
    d.line([(9, 6), (12, 4)], fill=P['ora'])
    return im

@icon('tabasco')
def _():
    im, d = new()
    # Tabasco Boshi: frasco de salsa picante
    d.rectangle([8, 0, 11, 3], fill=P['grn'])
    d.rectangle([8, 4, 11, 6], fill=P['red'])
    d.rounded_rectangle([5, 6, 14, 19], 2, fill=P['red'])
    d.line([(6, 7), (6, 17)], fill=P['redL'])
    d.rectangle([6, 10, 13, 14], fill=P['wht'])
    d.line([(8, 12), (11, 12)], fill=P['redD'])
    d.line([(16, 8), (18, 6)], fill=P['ora']); d.line([(16, 12), (19, 12)], fill=P['ora'])
    return im

@icon('hinotori')
def _():
    im, d = new()
    # Hi no Tori Boshi: pájaro de fuego
    d.polygon([(0, 6), (8, 9), (12, 3), (19, 0), (15, 7), (19, 10), (12, 12), (8, 18), (6, 12)], fill=P['red'])
    d.polygon([(3, 7), (8, 10), (12, 5), (16, 3), (13, 8), (16, 10), (11, 11), (8, 15)], fill=P['ora'])
    d.polygon([(7, 10), (12, 8), (10, 12)], fill=P['yel'])
    px(d, [(14, 6)], P['wht'])
    return im

@icon('usoppform')
def _():
    im, d = new()
    # Sogeking: máscara con nariz larga y capa
    d.polygon([(0, 19), (4, 11), (16, 11), (19, 19)], fill=P['red'])
    d.ellipse([3, 1, 16, 14], fill=P['yel'])
    d.line([(5, 3), (10, 2)], fill=P['yelL'])
    d.ellipse([5, 5, 8, 8], fill=P['blk']); d.ellipse([11, 5, 14, 8], fill=P['blk'])
    px(d, [(6, 6), (12, 6)], P['wht'])
    d.polygon([(9, 7), (10, 7), (19, 11), (18, 12)], fill=P['yelD'])
    d.line([(6, 11), (12, 11)], fill=P['brnD'])
    return im

# ===== CHOPPER =====
@icon('heavygong')
def _():
    im, d = new()
    # Heavy Gong: pezuñazo de frente en Heavy Point con onda de choque
    star(d, 10, 10, 10, 6, 'yel', n=10, rot=0)
    d.ellipse([3, 3, 16, 16], fill=P['brn'])
    d.ellipse([5, 5, 14, 14], fill=C('3a2a20'))
    d.line([(9, 5), (9, 14)], fill=P['brn'], width=1)
    d.arc([3, 3, 16, 16], 200, 260, fill=P['brnL'])
    px(d, [(6, 7), (7, 6)], C('6a5040'))
    return im

@icon('kokuteicross')
def _():
    im, d = new()
    # Kokutei Cross: dos pezuñas en X con estallido
    star(d, 10, 10, 9, 4, 'yel', n=8, rot=0)
    d.line([(2, 2), (17, 17)], fill=P['brn'], width=4)
    d.line([(17, 2), (2, 17)], fill=P['brn'], width=4)
    d.line([(2, 2), (17, 17)], fill=P['brnL'], width=1)
    for (x, y) in ((1, 1), (16, 1), (1, 16), (16, 16)):
        d.rectangle([x, y, x + 2, y + 2], fill=C('3a2a20'))
    return im

@icon('guardpoint')
def _():
    im, d = new()
    # Guard Point: bola de pelo esponjoso con el sombrero rosa
    for (x, y) in ((3, 6), (14, 6), (2, 12), (15, 12), (8, 16), (5, 16), (12, 16)):
        d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=C('c8885a'))
    d.ellipse([2, 4, 17, 19], fill=C('c8885a'))
    d.arc([5, 9, 14, 17], 200, 340, fill=C('e8b88a'))
    d.rectangle([5, 1, 14, 5], fill=P['pnk']); d.rectangle([3, 5, 16, 6], fill=P['pnk'])
    d.line([(7, 2), (12, 4)], fill=P['wht']); d.line([(12, 2), (7, 4)], fill=P['wht'])
    return im

@icon('hornpoint')
def _():
    im, d = new()
    # Horn Point: astas enormes de reno
    for sx in (1, -1):
        cx = 10
        d.line([(cx + sx * 1, 19), (cx + sx * 3, 12), (cx + sx * 8, 3)], fill=P['brnL'], width=2)
        d.line([(cx + sx * 5, 9), (cx + sx * 9, 9)], fill=P['brnL'], width=2)
        d.line([(cx + sx * 4, 11), (cx + sx * 3, 5)], fill=P['brnL'], width=2)
        d.line([(cx + sx * 7, 5), (cx + sx * 6, 1)], fill=P['brnL'], width=1)
    d.rectangle([8, 15, 11, 19], fill=P['pnk'])
    return im

@icon('chopperform')
def _():
    im, d = new()
    # sombrero rosa de Chopper con la cruz blanca y astas (Monster Point de fondo)
    d.line([(4, 7), (1, 1)], fill=P['brnL'], width=2); d.line([(2, 4), (0, 4)], fill=P['brnL'])
    d.line([(15, 7), (18, 1)], fill=P['brnL'], width=2); d.line([(17, 4), (19, 4)], fill=P['brnL'])
    d.rounded_rectangle([4, 3, 15, 12], 3, fill=P['pnk'])
    d.line([(5, 4), (12, 4)], fill=P['pnkL'])
    d.rectangle([1, 11, 18, 14], fill=P['pnk'])
    d.rectangle([8, 5, 11, 10], fill=P['wht']); d.rectangle([6, 6, 13, 9], fill=P['wht'])
    d.line([(3, 12), (16, 12)], fill=P['pnkD'])
    d.ellipse([5, 14, 14, 19], fill=P['brn']); px(d, [(9, 16)], C('3060c0'))
    return im

# ===== ROBIN =====
@icon('delphinium')
def _():
    im, d = new()
    # Cien Fleur Delphinium: brazos gigantes brotando del suelo
    for x, y in ((1, 8), (8, 2), (15, 6)):
        arm_sprout(d, x, y, 18 - y)
        d.rectangle([x, y + 4, x + 3, y + 5], fill=P['skin'])
    d.line([(0, 19), (19, 19)], fill=P['brn'])
    petals(d, [(5, 4), (12, 9), (18, 2)])
    return im

@icon('calendula')
def _():
    im, d = new()
    # Veinte Fleur Calendula: escudo de brazos en flor
    for ang in range(0, 360, 45):
        a = math.radians(ang)
        cx, cy = 10 + 6 * math.cos(a), 10 + 6 * math.sin(a)
        d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=P['skin'])
        px(d, [(round(cx), round(cy))], P['skinD'])
    d.ellipse([6, 6, 14, 14], fill=P['pur'])
    d.ellipse([8, 8, 12, 12], fill=P['purL'])
    return im

@icon('slap')
def _():
    im, d = new()
    # Seis Fleur Slap: mano abierta abofeteando
    d.rounded_rectangle([3, 7, 12, 16], 2, fill=P['skin'])
    for k in range(4):
        d.rectangle([4 + k * 2 + (0), 1 + (k % 3 == 0) * 2, 4 + k * 2, 8], fill=P['skin'])
    d.polygon([(12, 10), (16, 7), (17, 9), (12, 13)], fill=P['skin'])
    d.rectangle([5, 16, 10, 19], fill=P['pur'])
    d.line([(6, 11), (10, 11)], fill=P['skinD'])
    d.line([(15, 13), (19, 15)], fill=P['wht']); d.line([(15, 16), (18, 19)], fill=P['wht']); d.line([(0, 6), (1, 3)], fill=P['wht'])
    return im

@icon('doble')
def _():
    im, d = new()
    # Cuerpo Fleur Doble: Robin y su doble hecha de pétalos
    def robin(x, alpha):
        col = lambda k: (P[k][0], P[k][1], P[k][2], alpha)
        d.rectangle([x + 1, 1, x + 6, 7], fill=col('blk'))       # pelo negro
        d.rectangle([x + 2, 3, x + 5, 7], fill=col('skin'))
        d.polygon([(x, 19), (x + 1, 9), (x + 6, 9), (x + 7, 19)], fill=col('pur'))
        d.rectangle([x + 2, 8, x + 5, 9], fill=col('skin'))
    robin(10, 255); robin(1, 130)
    petals(d, [(0, 10), (4, 16), (8, 3)])
    return im

@icon('robinform')
def _():
    im, d = new()
    # Demonio Fleur: alas negras hechas de brazos
    for sx in (1, -1):
        for k in range(4):
            y = 3 + k * 3
            x1 = 10 + sx * (9 - k)
            d.line([(10 + sx * 2, 9 + k), (x1, y)], fill=P['blk'], width=2)
            px(d, [(x1, y)], P['purL'])
    d.ellipse([7, 6, 12, 18], fill=P['pur'])
    d.rectangle([8, 2, 11, 6], fill=P['blk']); d.rectangle([9, 4, 10, 6], fill=P['skin'])
    return im

# ===== PASIVAS =====
@icon('power')
def _():
    im, d = new()
    # Poder: puño de Busoshoku (negro brillante) con impacto rojo
    star(d, 14, 10, 6, 3, 'red', n=7)
    d.rectangle([0, 8, 5, 12], fill=P['blk'])
    fist(d, 5, 6, 'blk', 'blkL', 'gryD')
    px(d, [(7, 7), (8, 7)], P['purL'])
    return im

@icon('haki_buso')
def _():
    im, d = new()
    # Busoshoku: antebrazo endurecido negro con brillo
    d.polygon([(2, 19), (5, 9), (12, 9), (13, 19)], fill=P['blk'])
    d.rounded_rectangle([3, 1, 15, 10], 3, fill=P['blk'])
    for k in (5, 8, 11):
        d.line([(k, 2), (k, 5)], fill=P['gryD'])
    d.line([(4, 2), (6, 2)], fill=P['purL']); d.line([(4, 12), (5, 16)], fill=P['purL'])
    px(d, [(14, 4), (16, 2), (17, 7)], P['wht'])
    return im

@icon('haki_ken')
def _():
    im, d = new()
    # Kenbunshoku: ojo que percibe las ondas
    d.arc([0, 2, 19, 17], 0, 360, fill=P['purL'])
    d.polygon([(2, 10), (6, 6), (14, 6), (18, 10), (14, 14), (6, 14)], fill=P['wht'])
    d.ellipse([7, 7, 12, 12], fill=P['pur']); d.ellipse([9, 9, 10, 10], fill=P['blk'])
    px(d, [(8, 8)], P['wht'])
    return im

@icon('haki_hao')
def _():
    im, d = new()
    # Haoshoku: corona negra con relámpagos rojos
    d.polygon([(2, 16), (2, 6), (6, 10), (10, 3), (14, 10), (18, 6), (18, 16)], fill=P['blk'])
    d.rectangle([2, 14, 18, 17], fill=P['yelD'])
    px(d, [(6, 15), (10, 15), (14, 15)], P['red'])
    d.line([(0, 2), (3, 5), (1, 7)], fill=P['red']); d.line([(19, 1), (16, 4), (19, 6)], fill=P['red'])
    d.line([(10, 6), (9, 9), (11, 11)], fill=P['red'])
    return im

@icon('crit')
def _():
    im, d = new()
    # Gafas de francotirador de Sogeking/Usopp
    d.line([(0, 9), (19, 9)], fill=P['brn'], width=2)
    for x in (2, 11):
        d.ellipse([x, 4, x + 7, 13], fill=P['yelD'])
        d.ellipse([x + 1, 5, x + 6, 12], fill=P['grnL'])
        px(d, [(x + 2, 6), (x + 3, 6)], P['wht'])
    d.ellipse([12, 13, 17, 18], fill=P['red']); px(d, [(14, 15)], P['wht'])
    return im

@icon('cd')
def _():
    im, d = new()
    # Sake de Bink: botella de sake
    d.rectangle([8, 0, 11, 2], fill=P['red'])
    d.rectangle([8, 3, 11, 6], fill=P['wht'])
    d.polygon([(8, 6), (11, 6), (16, 11), (16, 19), (3, 19), (3, 11)], fill=P['wht'])
    d.line([(4, 12), (4, 18)], fill=C('ffffff'))
    d.rectangle([5, 12, 14, 17], fill=P['bluD'])
    d.line([(9, 13), (9, 16)], fill=P['wht']); d.line([(8, 14), (10, 14)], fill=P['wht'])
    return im

@icon('armor')
def _():
    im, d = new()
    # escudo negro de Haki
    d.polygon([(10, 0), (18, 3), (17, 12), (10, 19), (3, 12), (2, 3)], fill=P['blk'])
    d.polygon([(10, 2), (16, 4), (15, 11), (10, 16)], fill=P['blkL'])
    d.line([(4, 4), (9, 2)], fill=P['purL'])
    d.line([(10, 4), (10, 15)], fill=P['gryD'])
    return im

@icon('area')
def _():
    im, d = new()
    # Área: brújula náutica con ondas
    d.ellipse([0, 0, 19, 19], outline=P['cya'], width=1)
    d.ellipse([3, 3, 16, 16], fill=P['wht'])
    d.polygon([(10, 4), (12, 10), (10, 15), (8, 10)], fill=P['red'])
    d.polygon([(10, 10), (12, 10), (10, 15), (8, 10)], fill=P['blu'])
    d.line([(4, 10), (15, 10)], fill=P['gry'])
    return im

@icon('speed')
def _():
    im, d = new()
    # Velocidad: sandalia con estelas (Soru)
    d.polygon([(6, 12), (18, 12), (19, 16), (6, 16)], fill=P['straw'])
    d.line([(6, 16), (19, 16)], fill=P['strawD'])
    d.polygon([(8, 6), (13, 6), (16, 12), (8, 12)], fill=P['skin'])
    d.line([(10, 12), (13, 9)], fill=P['brn'])
    for y, w in ((7, 5), (11, 6), (15, 4)):
        d.line([(0, y), (w, y)], fill=P['wht'])
    return im

@icon('pickup')
def _():
    im, d = new()
    # Recogida: Log Pose
    d.rectangle([3, 13, 16, 18], fill=P['brn']); d.line([(3, 13), (16, 13)], fill=P['brnL'])
    d.ellipse([3, 1, 16, 14], fill=C('cfeefc'))
    d.arc([3, 1, 16, 14], 0, 360, fill=P['stlD'])
    d.line([(9, 4), (10, 11)], fill=P['red'], width=2)
    px(d, [(6, 4), (5, 5)], P['wht'])
    return im

@icon('magnet')
def _():
    im, d = new()
    # Imán: herradura roja
    d.arc([2, 1, 17, 16], 180, 360, fill=P['red'], width=5)
    d.rectangle([2, 8, 6, 14], fill=P['red']); d.rectangle([13, 8, 17, 14], fill=P['red'])
    d.rectangle([2, 15, 6, 18], fill=P['stl']); d.rectangle([13, 15, 17, 18], fill=P['stl'])
    d.line([(4, 3), (7, 2)], fill=P['redL'])
    return im

@icon('growth')
def _():
    im, d = new()
    # Crecimiento: carta náutica (los mapas de Nami) con flecha
    d.rectangle([2, 3, 17, 17], fill=C('f0dcae'))
    d.rectangle([0, 2, 3, 18], fill=C('d8b878')); d.rectangle([16, 2, 19, 18], fill=C('d8b878'))
    d.line([(5, 14), (8, 10), (11, 12), (15, 5)], fill=P['red'], width=1)
    d.polygon([(15, 4), (12, 5), (15, 8)], fill=P['red'])
    px(d, [(6, 6), (7, 6), (6, 7)], P['grn'])
    return im

@icon('luck')
def _():
    im, d = new()
    # Suerte: trébol de cuatro hojas
    for (x, y) in ((6, 2), (11, 6), (6, 10), (1, 6)):
        d.ellipse([x, y, x + 7, y + 7], fill=P['grn'])
        px(d, [(x + 2, y + 2)], P['grnL'])
    d.line([(10, 13), (14, 19)], fill=P['grnD'], width=2)
    return im

@icon('maxhp')
def _():
    im, d = new()
    d.polygon([(10, 18), (1, 9), (1, 5), (4, 2), (7, 2), (10, 5), (13, 2), (16, 2), (19, 5), (19, 9)], fill=P['red'])
    d.line([(3, 4), (5, 3)], fill=P['wht']); px(d, [(3, 5)], P['redL'])
    return im

@icon('regen')
def _():
    im, d = new()
    # carne con hueso (la favorita de Luffy)
    d.line([(1, 18), (18, 1)], fill=P['wht'], width=3)
    for (x, y) in ((0, 16), (2, 18), (16, 0), (18, 2)):
        d.ellipse([x - 1, y - 1, x + 2, y + 2], fill=P['wht'])
    d.ellipse([4, 3, 16, 15], fill=C('b5502c'))
    d.ellipse([5, 4, 13, 11], fill=C('d77a45'))
    px(d, [(7, 5), (8, 5), (6, 6)], C('f0a978'))
    return im

@icon('evasion')
def _():
    im, d = new()
    # Esquiva: silueta con imágenes residuales (Soru)
    for x, a in ((1, 90), (6, 160), (11, 255)):
        col = (P['blk'][0], P['blk'][1], P['blk'][2], a)
        d.ellipse([x + 2, 1, x + 6, 5], fill=col)
        d.polygon([(x + 1, 7), (x + 7, 7), (x + 8, 13), (x + 5, 19), (x + 3, 19), (x, 13)], fill=col)
    d.ellipse([13, 1, 17, 5], fill=P['straw'])
    return im

@icon('greed')
def _():
    im, d = new()
    # Avaricia: monedas de Berry
    for (x, y) in ((1, 9), (8, 4), (10, 11)):
        d.ellipse([x, y, x + 8, y + 8], fill=P['yel'])
        d.ellipse([x + 1, y + 1, x + 7, y + 7], outline=P['yelD'])
        d.line([(x + 4, y + 2), (x + 4, y + 6)], fill=P['yelD']); px(d, [(x + 5, y + 3), (x + 5, y + 5)], P['yelD'])
        px(d, [(x + 2, y + 2)], P['yelL'])
    return im

@icon('vamp')
def _():
    im, d = new()
    # Vampirismo: gota de sangre
    d.polygon([(10, 0), (16, 9), (17, 13), (14, 18), (6, 18), (3, 13), (4, 9)], fill=P['red'])
    d.ellipse([3, 8, 17, 19], fill=P['red'])
    d.line([(6, 10), (5, 14)], fill=P['redL']); px(d, [(7, 9)], P['wht'])
    d.ellipse([9, 13, 15, 18], fill=P['redD'])
    return im

@icon('rumble')
def _():
    im, d = new()
    # Rumble Ball: píldora amarilla con la marca
    d.ellipse([2, 2, 17, 17], fill=P['yel'])
    d.ellipse([4, 4, 15, 15], outline=P['yelD'])
    d.line([(10, 4), (10, 15)], fill=P['yelD']); d.line([(4, 10), (15, 10)], fill=P['yelD'])
    px(d, [(5, 5), (6, 4), (4, 6)], P['yelL'])
    return im

@icon('jolly')
def _():
    im, d = new()
    # Jolly Roger de los Mugiwara: calavera con sombrero de paja
    d.rectangle([0, 0, 1, 19], fill=P['brn'])
    d.rectangle([2, 1, 19, 15], fill=P['blk'])
    d.ellipse([7, 4, 14, 11], fill=P['wht'])
    d.rectangle([6, 5, 15, 6], fill=P['straw']); d.rectangle([8, 3, 13, 5], fill=P['straw']); d.line([(8, 5), (13, 5)], fill=P['red'])
    px(d, [(9, 8), (12, 8)], P['blk'])
    d.line([(4, 13), (17, 9)], fill=P['wht']); d.line([(4, 9), (17, 13)], fill=P['wht'])
    d.ellipse([7, 4, 14, 11], outline=None)
    return im

# ===== FRANKY =====
@icon('weaponsleft')
def _():
    im, d = new()
    # Weapons Left: el antebrazo de cañón (piel cyborg) disparando una bala
    d.rectangle([0, 7, 4, 13], fill=P['cya']); d.line([(0, 7), (4, 7)], fill=P['cyaL'])
    d.rectangle([5, 6, 12, 14], fill=P['skin']); d.line([(5, 6), (12, 6)], fill=P['skinL']); d.line([(5, 14), (12, 14)], fill=P['skinD'])
    d.rectangle([12, 8, 14, 12], fill=P['stlD']); d.rectangle([13, 9, 14, 11], fill=P['blk'])
    d.ellipse([15, 8, 19, 12], fill=P['blk']); px(d, [(16, 9)], P['gry'])
    d.line([(6, 3), (11, 3)], fill=P['wht']); d.line([(6, 17), (11, 17)], fill=P['wht'])
    return im

@icon('strongright')
def _():
    im, d = new()
    # Strong Right: puño de hierro con cadena
    for x in range(0, 9, 3): d.ellipse([x, 9, x + 2, 11], outline=P['stlD'])
    d.rounded_rectangle([9, 4, 19, 16], 2, fill=P['bluL']); d.line([(10, 4), (17, 4)], fill=P['cyaL'])
    for k in (12, 15, 18): d.line([(k, 5), (k, 9)], fill=P['bluD'])
    d.line([(10, 12), (17, 12)], fill=P['bluD'])
    return im

@icon('freshfire')
def _():
    im, d = new()
    # Fresh Fire: botella de cola y llamarada
    d.rectangle([1, 8, 4, 17], fill=C('7a2e12')); d.rectangle([2, 5, 3, 8], fill=C('7a2e12')); d.rectangle([1, 11, 4, 13], fill=P['red'])
    flame(d, 13, 18, 16, 12)
    return im

@icon('coupdevent')
def _():
    im, d = new()
    # Coup de Vent: palmas juntas y aire comprimido
    d.rounded_rectangle([0, 5, 6, 15], 2, fill=P['skin']); d.line([(1, 5), (5, 5)], fill=P['skinL'])
    for r, col in ((4, 'wht'), (7, 'cyaL'), (10, 'cya')):
        arc_lines(d, [8 - r + 4, 10 - r, 8 + r + 4, 10 + r], -70, 70, col)
    return im

@icon('rocket')
def _():
    im, d = new()
    # Franky Rocket Launcher: cohete en diagonal con estela
    d.polygon([(6, 13), (15, 4), (18, 1), (17, 5), (8, 15)], fill=P['stl'])
    d.polygon([(15, 4), (18, 1), (17, 5)], fill=P['red'])
    d.line([(7, 13), (15, 5)], fill=P['wht'])
    flame(d, 4, 19, 6, 5)
    return im

@icon('frankyform')
def _():
    im, d = new()
    # Franky Shogun: cabeza de robot con visera y tupé azul
    d.rectangle([3, 6, 16, 18], fill=P['stl']); d.line([(3, 6), (16, 6)], fill=P['wht'])
    d.rectangle([5, 9, 14, 12], fill=P['blk']); d.line([(6, 10), (13, 10)], fill=P['cya'])
    d.rectangle([6, 14, 13, 16], fill=P['stlD'])
    d.polygon([(5, 6), (9, 0), (15, 1), (14, 6)], fill=P['cya']); d.line([(9, 1), (14, 2)], fill=P['cyaL'])
    d.rectangle([2, 10, 3, 14], fill=P['red']); d.rectangle([16, 10, 17, 14], fill=P['red'])
    return im

# ===== BROOK =====
@icon('yahazu')
def _():
    im, d = new()
    # Yahazu Giri: espada bastón y el tajo que llega después
    sword(d, (17, 3), (3, 17), 'brnD', guard='yelD')
    d.line([(2, 6), (8, 2)], fill=P['wht']); d.line([(12, 18), (18, 14)], fill=P['wht'])
    return im

@icon('gavotte')
def _():
    im, d = new()
    # Gavotte Bond en Avant: estocada recta
    d.line([(0, 10), (16, 10)], fill=P['stl']); d.line([(0, 9), (16, 9)], fill=P['wht'])
    d.polygon([(16, 8), (19, 10), (16, 11)], fill=P['wht'])
    d.rectangle([3, 7, 4, 12], fill=P['yel'])
    for y in (5, 15): d.line([(7, y), (13, y)], fill=P['cyaL'])
    return im

@icon('fubuki')
def _():
    im, d = new()
    # Kasuriuta: Fubuki Giri — copo de hielo
    for a in range(0, 180, 60):
        x = math.cos(math.radians(a)) * 9; y = math.sin(math.radians(a)) * 9
        d.line([(10 - x, 10 - y), (10 + x, 10 + y)], fill=P['cyaL'], width=2)
    d.ellipse([7, 7, 13, 13], fill=P['wht'])
    px(d, [(10, 1), (10, 19), (2, 5), (18, 15), (2, 15), (18, 5)], P['wht'])
    return im

@icon('nemuriuta')
def _():
    im, d = new()
    # Nemuri Uta: notas musicales
    d.ellipse([1, 13, 6, 18], fill=P['pur']); d.ellipse([11, 11, 16, 16], fill=P['pur'])
    d.line([(6, 15), (6, 3)], fill=P['purD'], width=2); d.line([(16, 13), (16, 1)], fill=P['purD'], width=2)
    d.line([(6, 3), (16, 1)], fill=P['purD'], width=2); d.line([(6, 6), (16, 4)], fill=P['purD'], width=1)
    px(d, [(2, 14), (12, 12)], P['purL'])
    return im

@icon('soul')
def _():
    im, d = new()
    # Yomi Yomi: el alma de Brook con sombrero de copa
    d.ellipse([4, 5, 16, 16], fill=P['wht']); d.rectangle([4, 11, 16, 17], fill=P['wht'])
    for x in (4, 8, 12): d.polygon([(x, 17), (x + 2, 19), (x + 4, 17)], fill=P['wht'])
    px(d, [(8, 10), (12, 10), (8, 11), (12, 11)], P['blk'])
    d.rectangle([6, 1, 14, 4], fill=P['blk']); d.line([(4, 5), (16, 5)], fill=P['blk'])
    return im

@icon('brookform')
def _():
    im, d = new()
    # Soul King: calavera con afro y sombrero de copa
    d.ellipse([1, 4, 19, 15], fill=P['blk'])
    d.ellipse([5, 7, 15, 18], fill=P['wht'])
    d.rectangle([6, 0, 14, 4], fill=P['blkL']); d.line([(4, 5), (16, 5)], fill=P['blkL'])
    d.ellipse([7, 10, 9, 12], fill=P['blk']); d.ellipse([11, 10, 13, 12], fill=P['blk'])
    for x in (8, 10, 12): d.line([(x, 15), (x, 17)], fill=P['gry'])
    return im

# ===== JINBE =====
@icon('samegawara')
def _():
    im, d = new()
    # Samegawara Seiken: puño azul de hombre-pez y ondas en el agua
    fist(d, 1, 6, base='blu', light='bluL', dark='bluD')
    for r, col in ((3, 'cyaL'), (6, 'cya'), (9, 'bluL')):
        arc_lines(d, [10 - r + 2, 10 - r, 10 + r + 2, 10 + r], -60, 60, col)
    return im

@icon('buraikan')
def _():
    im, d = new()
    # Buraikan: bola de agua
    d.ellipse([2, 2, 18, 18], fill=P['sea']); d.ellipse([3, 3, 17, 17], fill=P['blu'])
    d.ellipse([5, 5, 10, 9], fill=P['bluL']); px(d, [(6, 6)], P['wht'])
    arc_lines(d, [5, 6, 15, 16], 30, 150, 'cyaL')
    return im

@icon('yarinami')
def _():
    im, d = new()
    # Yarinami: lanza de agua
    d.polygon([(0, 9), (14, 7), (19, 10), (14, 13), (0, 11)], fill=P['blu'])
    d.line([(1, 10), (17, 10)], fill=P['cyaL'])
    for x in (2, 7): d.line([(x, 15), (x + 3, 16)], fill=P['cya']); d.line([(x + 1, 4), (x + 4, 3)], fill=P['cya'])
    return im

@icon('uchimizu')
def _():
    im, d = new()
    # Uchimizu: tres gotas como balas
    for (x, y) in ((1, 2), (11, 1), (6, 10)):
        d.polygon([(x + 3, y), (x + 6, y + 5), (x, y + 5)], fill=P['blu'])
        d.ellipse([x, y + 3, x + 6, y + 8], fill=P['blu']); px(d, [(x + 2, y + 4)], P['cyaL'])
    return im

@icon('mizugokoro')
def _():
    im, d = new()
    # Mizugokoro: remolino de agua
    d.ellipse([1, 4, 19, 16], outline=P['blu'], width=2)
    d.ellipse([5, 6, 15, 14], outline=P['cya'], width=2)
    d.ellipse([8, 8, 12, 12], fill=P['cyaL'])
    return im

@icon('jinbeform')
def _():
    im, d = new()
    # Jinbe: cara azul de tiburón ballena con colmillos y la coleta
    d.ellipse([2, 3, 18, 19], fill=P['blu']); d.ellipse([4, 4, 16, 10], fill=P['bluL'])
    d.rectangle([8, 0, 11, 3], fill=P['blk'])
    px(d, [(7, 9), (12, 9)], P['blk'])
    d.rectangle([5, 13, 14, 15], fill=P['wht']); px(d, [(5, 12), (14, 12)], P['wht'])
    d.line([(2, 16), (18, 16)], fill=P['red'])
    return im

# ---------- hoja + js ----------
def build():
    names = list(ICONS)
    cols = 10; rows = math.ceil(len(names) / cols)
    sheet = Image.new('RGBA', (cols * CELL, rows * CELL))
    index = {}
    for i, n in enumerate(names):
        ic = outline(ICONS[n]())
        x, y = (i % cols), (i // cols)
        sheet.paste(ic, (x * CELL, y * CELL), ic)
        index[n] = [x, y]
    sheet.save(os.path.join(ROOT, 'source-art', 'iconos_habilidades.png'))
    # vista previa x4 sobre fondo de carta (pergamino y tinta)
    prev = Image.new('RGBA', (cols * (CELL * 4 + 8), rows * (CELL * 4 + 8)), C('2b1d14'))
    for i, n in enumerate(names):
        x, y = (i % cols), (i // cols)
        cell = sheet.crop((x * CELL, y * CELL, (x + 1) * CELL, (y + 1) * CELL)).resize((CELL * 4, CELL * 4), Image.NEAREST)
        bg = Image.new('RGBA', cell.size, C('efe3c4') if (x + y) % 2 else C('e6d6b0'))
        bg.alpha_composite(cell)
        prev.paste(bg, (x * (CELL * 4 + 8) + 4, y * (CELL * 4 + 8) + 4))
    prev.save(os.path.join(ROOT, 'source-art', 'iconos_habilidades_x4.png'))
    buf = io.BytesIO(); sheet.save(buf, 'PNG', optimize=True)
    uri = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
    js = f"""// === Iconos pixel art de técnicas, armas y pasivas (generado por source-art/dibujar_iconos_habilidades.py) ===
// Hoja de {len(names)} iconos de {CELL}x{CELL} incrustada (no añade archivos ni pasa por la caché del SW).
// pxIcon(id) devuelve el HTML del icono o '' si no hay; los ids de armas y técnicas sustituyen a su SVG en ICONS.
// Se carga después de crew.js (las técnicas ya están registradas) y antes de main.js.
const PX_ICON_SHEET = '{uri}';
const PX_ICON_GRID = {{ cols: {cols}, rows: {rows} }};
const PX_ICON_INDEX = {json.dumps(index, separators=(',', ':'))};
// Mejoras que en el juego llevan otro id que su icono
const PX_ICON_ALIAS = {{ heart: 'maxhp', meat: 'regen', dodge: 'evasion', coin: 'greed', drop: 'vamp' }};
function pxIcon(id) {{
    const p = PX_ICON_INDEX[id] || PX_ICON_INDEX[PX_ICON_ALIAS[id]];
    if (!p) return '';
    const bx = PX_ICON_GRID.cols > 1 ? p[0] * 100 / (PX_ICON_GRID.cols - 1) : 0;
    const by = PX_ICON_GRID.rows > 1 ? p[1] * 100 / (PX_ICON_GRID.rows - 1) : 0;
    return `<i class="pxi" aria-hidden="true" style="background-position:${{bx}}% ${{by}}%"></i>`;
}}
document.documentElement.style.setProperty('--pxi-sheet', `url(${{PX_ICON_SHEET}})`);
document.documentElement.style.setProperty('--pxi-size', `${{PX_ICON_GRID.cols * 100}}% ${{PX_ICON_GRID.rows * 100}}%`);
// Armas y técnicas: sus ids no se usan para nada más, así que se sustituyen en ICONS (HUD, cofres, pausa, Gears...)
(function () {{
    const passive = new Set(['power','crit','cd','armor','haki_buso','haki_ken','haki_hao','area','speed','pickup','growth','luck','maxhp','regen','evasion','magnet','greed','vamp','rumble','jolly']);
    for (const id in PX_ICON_INDEX) if (!passive.has(id)) ICONS[id] = pxIcon(id);
    if (typeof CREW_UPGRADES !== 'undefined') for (const u of CREW_UPGRADES) u.icon = pxIcon(u.id) || u.icon;
    if (typeof CREW_HUD !== 'undefined') for (const h of CREW_HUD) h.icon = pxIcon(h.id) || h.icon;
}})();
"""
    open(os.path.join(ROOT, 'js', 'pixicons.js'), 'w', encoding='utf-8').write(js)
    print(len(names), 'iconos;', len(buf.getvalue()), 'bytes PNG')

# Iconos propios de las evoluciones (evo_<arma>)
exec(open(os.path.join(ROOT, 'source-art', 'dibujar_iconos_evoluciones.py'), encoding='utf-8').read())

if __name__ == '__main__':
    build()
