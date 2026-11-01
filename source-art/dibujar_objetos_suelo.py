# Genera los sprites de los objetos del suelo (assets/sprites/pickups/*.png).
# Pixel art a 24 px con contorno oscuro y halo claro para leerse sobre los mapas HD.
# Uso: python3 source-art/dibujar_objetos_suelo.py
from PIL import Image, ImageDraw
import os, math
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'sprites', 'pickups')
SRC_DENDEN = os.path.join(ROOT, 'assets', 'extracted', 'objetos_gba', 'sprite_022.png')
OUTLINE = (28, 14, 6, 255)
HALO = (255, 250, 235, 200)

def outline(im, col, alpha_thr=1):
    w, h = im.size
    src = im.load()
    out = Image.new('RGBA', (w + 2, h + 2))
    out.paste(im, (1, 1))
    p = out.load()
    for y in range(h + 2):
        for x in range(w + 2):
            if p[x, y][3] >= alpha_thr: continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                sx, sy = x + dx - 1, y + dy - 1
                if 0 <= sx < w and 0 <= sy < h and src[sx, sy][3] >= 128:
                    p[x, y] = col; break
    return out

def finish(im, name):
    im = outline(im, OUTLINE)
    im = outline(im, HALO)
    im.save(os.path.join(OUT, name + '.png'))
    return im

def meat():
    # «Manga niku»: el muslo con hueso de Luffy, en diagonal
    im = Image.new('RGBA', (26, 22)); d = ImageDraw.Draw(im)
    BONE, BONE_S = (255, 248, 230, 255), (214, 200, 172, 255)
    # hueso que atraviesa la carne
    d.line([(3, 18), (22, 4)], fill=BONE_S, width=4)
    d.line([(3, 17), (22, 3)], fill=BONE, width=2)
    for cx, cy in ((2, 17), (4, 20), (21, 2), (23, 5)):
        d.ellipse([cx - 2, cy - 2, cx + 2, cy + 2], fill=BONE)
    d.point([(1, 18), (3, 21), (22, 6)], fill=BONE_S)
    # la carne: óvalo alargado a lo largo del hueso, dorado por fuera
    def oval(cx, cy, a, b, col):
        ang = math.atan2(-14, 19)
        pts = [(cx + a * math.cos(t) * math.cos(ang) - b * math.sin(t) * math.sin(ang),
                cy + a * math.cos(t) * math.sin(ang) + b * math.sin(t) * math.cos(ang))
               for t in [k * math.pi / 24 for k in range(48)]]
        d.polygon(pts, fill=col)
    oval(12.5, 10.5, 9, 6.5, (120, 45, 18, 255))
    oval(12, 10, 8.5, 6, (176, 74, 28, 255))
    oval(11.5, 9, 6.5, 4, (214, 112, 46, 255))
    oval(10, 7.5, 3, 1.5, (246, 170, 92, 255))
    d.point([(9, 7), (10, 7)], fill=(255, 226, 170, 255))
    # vetas de asado
    d.line([(13, 13), (17, 10)], fill=(120, 45, 18, 255))
    d.line([(9, 14), (12, 12)], fill=(140, 55, 22, 255))
    return finish(im, 'meat')

def magnet():
    # Imán de herradura rojo con puntas plateadas
    im = Image.new('RGBA', (20, 20)); d = ImageDraw.Draw(im)
    RED, RED_D, RED_H = (220, 38, 38, 255), (150, 20, 20, 255), (252, 120, 120, 255)
    d.ellipse([1, 1, 18, 18], fill=RED_D)
    d.ellipse([1, 1, 18, 17], fill=RED)
    d.ellipse([6, 6, 13, 13], fill=(0, 0, 0, 0))
    d.rectangle([1, 9, 18, 19], fill=(0, 0, 0, 0))
    d.rectangle([1, 9, 5, 14], fill=RED); d.rectangle([14, 9, 18, 14], fill=RED)
    d.rectangle([6, 9, 13, 19], fill=(0, 0, 0, 0))
    d.line([(3, 4), (6, 2)], fill=RED_H); d.line([(2, 6), (2, 10)], fill=RED_H)
    d.rectangle([1, 15, 5, 18], fill=(226, 232, 240, 255)); d.rectangle([14, 15, 18, 18], fill=(226, 232, 240, 255))
    d.line([(1, 18), (5, 18)], fill=(148, 163, 184, 255)); d.line([(14, 18), (18, 18)], fill=(148, 163, 184, 255))
    d.point([(2, 16), (15, 16)], fill=(255, 255, 255, 255))
    return finish(im, 'magnet')

def bell():
    # Campana dorada de Shandora (Skypiea)
    im = Image.new('RGBA', (20, 22)); d = ImageDraw.Draw(im)
    G, GD, GH = (234, 179, 8, 255), (161, 98, 7, 255), (254, 240, 138, 255)
    d.rectangle([8, 0, 11, 2], fill=GD)                       # asa
    d.pieslice([3, 2, 16, 16], 180, 360, fill=G)               # cúpula
    d.polygon([(3, 9), (16, 9), (18, 17), (1, 17)], fill=G)    # falda
    d.rectangle([0, 16, 19, 18], fill=GD)                      # borde
    d.line([(1, 16), (18, 16)], fill=G)
    d.line([(6, 5), (5, 13)], fill=GH); d.line([(7, 4), (8, 4)], fill=GH)
    d.line([(4, 11), (15, 11)], fill=GD)                       # aro grabado
    d.ellipse([8, 18, 11, 21], fill=GD)                        # badajo
    return finish(im, 'bell')

def denden():
    # Den Den Mushi dorado: el sprite GBA original con la concha en oro
    src = Image.open(SRC_DENDEN).convert('RGBA')
    bb = src.getbbox(); src = src.crop(bb)
    px = src.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = px[x, y]
            if a < 128: px[x, y] = (0, 0, 0, 0); continue
            # solo la concha (morada) pasa a oro; el caracol y el auricular quedan como en el GBA
            if b > g + 20 and r > g:
                t = (r * 299 + g * 587 + b * 114) / 1000 / 255
                px[x, y] = (int(170 + 85 * t), int(110 + 130 * t), int(10 + 80 * t), 255)
    return finish(src, 'denden')

def coin():
    # Moneda de oro con el símbolo del Berry (฿)
    im = Image.new('RGBA', (12, 12)); d = ImageDraw.Draw(im)
    d.ellipse([0, 0, 11, 11], fill=(180, 120, 10, 255))
    d.ellipse([0, 0, 10, 10], fill=(250, 204, 21, 255))
    d.ellipse([2, 2, 8, 8], fill=(234, 179, 8, 255))
    d.line([(4, 3), (4, 7)], fill=(146, 92, 6, 255))
    d.line([(4, 3), (6, 3)], fill=(146, 92, 6, 255)); d.line([(4, 5), (6, 5)], fill=(146, 92, 6, 255)); d.line([(4, 7), (6, 7)], fill=(146, 92, 6, 255))
    d.point([(7, 4), (7, 6)], fill=(146, 92, 6, 255))
    d.point([(5, 2), (5, 8)], fill=(146, 92, 6, 255))
    d.point([(2, 3), (3, 2)], fill=(255, 250, 200, 255))
    return finish(im, 'beli')

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for f in (meat, magnet, bell, denden, coin): print(f.__name__, f().size)
