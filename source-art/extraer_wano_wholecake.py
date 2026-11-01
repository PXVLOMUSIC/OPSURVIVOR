# Recorta y anima los sprites de Wano y Whole Cake desde las hojas originales (source-art/sprites_originales, solo local).
# Son hojas de fans en estilo One Piece Gigant Battle (DS) y una de Great Pirate Colosseum (3DS); créditos en SPRITES_SOURCES.md.
# A los personajes que solo tienen 1 frame se les sintetiza la animación: respiración (reposo) y aplastar/estirar (ataque).
# Requisitos: pip install pillow numpy scipy
# Uso: python3 source-art/extraer_wano_wholecake.py <ruta a sprites_originales> assets/extracted
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

SRC, DST = sys.argv[1], sys.argv[2]
ST3 = np.ones((3, 3))


def load(rel):
    return Image.open(os.path.join(SRC, rel)).convert('RGBA')


def key_bg(im, tol=40):
    """Hojas con fondo de color: el color de la esquina pasa a transparente."""
    a = np.array(im); bg = a[0, 0, :3].astype(int)
    a[np.abs(a[..., :3].astype(int) - bg).sum(-1) <= tol, 3] = 0
    return Image.fromarray(a)


def binarize(a):
    a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    return a


def crop_bbox(im):
    bb = im.getbbox()
    return im.crop(bb) if bb else im


def hard(im, x0, y0, x1, y1, minpx=25):
    """Recorte rectangular quitando motas sueltas de los vecinos."""
    a = np.array(im)[y0:y1, x0:x1].copy()
    m = a[..., 3] >= 128
    lab, n = ndimage.label(m, structure=ST3)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    for i, s in enumerate(sizes):
        if s < minpx: a[lab == i + 1] = 0
    return crop_bbox(Image.fromarray(binarize(a)))


def pick(im, x0, y0, x1, y1, keep):
    """Recorte que conserva solo las piezas cuyo centro cae en keep=(xa, xb)."""
    a = np.array(im)[y0:y1, x0:x1].copy()
    m = a[..., 3] >= 128
    lab, n = ndimage.label(m, structure=ST3)
    out = np.zeros_like(a)
    for i, sl in enumerate(ndimage.find_objects(lab)):
        comp = lab[sl] == i + 1
        if comp.sum() >= 4 and keep[0] <= x0 + (sl[1].start + sl[1].stop) / 2 <= keep[1]:
            out[sl][comp] = a[sl][comp]
    return crop_bbox(Image.fromarray(binarize(out)))


def clean(im, margin=6, frac=0.02):
    """Deja la figura principal y lo que está dentro de su ancho (quita trozos de los personajes de al lado)."""
    a = np.array(im); m = a[..., 3] >= 128
    lab, n = ndimage.label(m, structure=ST3)
    if n == 0: return im
    sizes = ndimage.sum(m, lab, range(1, n + 1)); big = int(np.argmax(sizes))
    objs = ndimage.find_objects(lab); bs = objs[big]
    for i, sl in enumerate(objs):
        if i == big: continue
        cx = (sl[1].start + sl[1].stop) / 2
        if sizes[i] < frac * sizes[big] or not (bs[1].start + margin <= cx <= bs[1].stop - margin):
            a[lab == i + 1] = 0
    return crop_bbox(Image.fromarray(a))


def shrink(im, h):
    """Baja un sprite grande (3DS) a la altura h con promedio de caja y alfa binario."""
    w = round(im.width * h / im.height)
    return Image.fromarray(binarize(np.array(im.resize((w, h), Image.BOX))))


def breath(im, px=1, part=0.6):
    """Reposo: cabeza y torso bajan px (los pies quedan quietos)."""
    a = np.array(im); h = a.shape[0]; k = int(h * part)
    out = a.copy(); out[px:k + px] = a[:k]; out[:px] = 0
    return Image.fromarray(out)


def squash(im, sx=1.06, sy=0.95):
    """Ataque: aplastar y estirar sobre los pies, mismo lienzo ampliado."""
    w, h = im.size; nw, nh = round(w * sx), round(h * sy)
    r = im.resize((nw, nh), Image.NEAREST)
    W, H = max(w, nw), max(h, round(h * 1.05))
    c = Image.new('RGBA', (W, H)); c.alpha_composite(r, ((W - nw) // 2, H - nh))
    return c


def single(im):
    """Un solo frame: reposo [original, respiración], ataque [aplastado, estirado]."""
    return [im, breath(im)], [squash(im, 1.07, 0.94), squash(im, 0.95, 1.05)]


def pad_same(frames):
    """Mismo lienzo para todos los frames, alineados por los pies y el centro."""
    W = max(f.width for f in frames); H = max(f.height for f in frames)
    out = []
    for f in frames:
        c = Image.new('RGBA', (W, H)); c.alpha_composite(f, ((W - f.width) // 2, H - f.height)); out.append(c)
    return out


def save(folder, idle, attack):
    d = os.path.join(DST, folder); os.makedirs(d, exist_ok=True)
    frames = pad_same(idle + attack)
    for i, f in enumerate(frames):
        f.save(os.path.join(d, 'sprite_%03d.png' % i), optimize=True)
    print(folder, len(idle), 'reposo +', len(attack), 'ataque', frames[0].size)


def cells(im, n, cw, y0=0, y1=None):
    return [crop_bbox(im.crop((i * cw, y0, (i + 1) * cw, y1 or im.height))) for i in range(n)]


# ---------------- Wano: las Tres Calamidades y los Tobiroppo ----------------
comp = load('Wano/Compendio_1319624632_custom-OPGB-Hecbator.png')  # Hecbator, "All My One Piece Gigant Battle Chars"
Y0, Y1 = 2150, 2268  # fila de los Piratas de las Bestias

# King: forma de pteranodonte (drawkars 935467598): 4 de vuelo + 2 de ataque (llamarada)
king = key_bg(load('Wano/King_935467598_custom-OPGB-drawkars_tira.png'))
kf = [clean(f) for f in cells(king, 6, 250, 0, 165)]
kf[4] = clean(crop_bbox(king.crop((1000, 0, 1250, 160))))  # el rayo de fuego se recorta a la altura del cuerpo
save('king', kf[:4], kf[4:6])

# Queen (Hecbator 854884641): reposo y brazo cíborg levantado
qs = load('Wano/Queen_854884641_custom-OPGB-Hecbator.png')
q0, q1 = crop_bbox(qs.crop((0, 0, 81, qs.height))), crop_bbox(qs.crop((81, 0, qs.width, qs.height)))
save('queen', [q0, breath(q0)], [q1, squash(q1, 1.05, 0.96)])

jack = clean(hard(comp, 249, Y0, 340, Y1))
ja = np.array(jack); ja[60:, 78:] = 0; jack = clean(crop_bbox(Image.fromarray(ja)))  # quita la maza de Ulti
save('jack', *single(jack))
save('ulti', *single(clean(pick(comp, 300, Y0, 400, Y1, (320, 388)))))
save('black_maria', *single(clean(hard(comp, 380, Y0, 430, Y1))))
save('sasaki', *single(load('Wano/Sasaki_943936217_custom-OPGB-Hecbator.png')))
save('page_one', *single(clean(pick(comp, 500, Y0, 575, Y1, (515, 560)))))

# ---------------- Whole Cake: Big Mom y la familia Charlotte ----------------
# Big Mom con Prometheus y Zeus (drawkars 934598510): 4 frames de reposo
bm = key_bg(load('WholeCake/BigMom_ZeusPrometheus_934598510_custom-OPGB-drawkars_tira.png'))
bmf = [clean(f, margin=0, frac=0.002) for f in cells(bm, 4, 200)]
save('bigmom', bmf, [squash(bmf[0], 1.06, 0.95), squash(bmf[2], 0.96, 1.05)])

# Katakuri (VolknerThanh 731173210): de pie y puñetazo, con su bufanda
kt = load('WholeCake/Katakuri_731173210_custom-OPGB-VolknerThanh.png')
kst, kpu = [clean(crop_bbox(kt.crop(b))) for b in [(249, 0, 300, 100), (102, 0, 203, 100)]]
save('katakuri', [kst, breath(kst)], [kpu, squash(kpu, 1.04, 0.97)])

# Smoothie (drawkars 718010975, junto a Katakuri)
sm = key_bg(load('WholeCake/Smoothie_Katakuri_718010975_custom-OPGB-drawkars.png'))
save('smoothie', *single(clean(crop_bbox(sm.crop((0, 0, 66, sm.height))))))

save('tamago', *single(load('WholeCake/BaronTamago_336082452_custom-OPGB-Hecbator.png')))

# Pekoms: rip oficial de Great Pirate Colosseum (3DS, Megadoomer 21189), bajado a ~84 px como los demás
pk = key_bg(load('3DS_GreatPirateColosseum/21189_Pekoms.png'))
pkf = {i: clean(crop_bbox(pk.crop(b))) for i, b in {5: (590, 30, 770, 180), 6: (800, 0, 960, 180), 7: (960, 0, 1166, 180)}.items()}
s = 84 / pkf[6].height
pkf = {i: shrink(f, max(1, round(f.height * s))) for i, f in pkf.items()}
save('pekoms', [pkf[6], breath(pkf[6])], [pkf[5], pkf[7]])
