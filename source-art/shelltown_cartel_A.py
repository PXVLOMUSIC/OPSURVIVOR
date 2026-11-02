# Cambia la primera R de «MRRINES» por una A (el cartel debe decir MARINES)
import sys, numpy as np
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); a = np.array(im).astype(float)
x0, y0, x1, y1 = 680, 192, 691, 207
box = a[y0:y1, x0 - 14:x1 + 14]; lum = box.mean(axis=2)
light = box[lum > 170].mean(axis=0); ink = box[lum < 90].mean(axis=0)
S = 8
W, H = (x1 - x0) * S, (y1 - y0) * S
layer = Image.new('L', (W, H), 0); d = ImageDraw.Draw(layer)
# A: dos trazos inclinados y travesaño, mismo grosor que las letras vecinas (~2.6 px)
lw = int(2.6 * S); top = (5.5 * S, 1 * S); bl = (1.2 * S, 14 * S); br = (9.8 * S, 14 * S)
d.line([bl, top], fill=255, width=lw); d.line([top, br], fill=255, width=lw)
d.polygon([(top[0] - 1.6 * S, top[1]), (top[0] + 1.6 * S, top[1]), (top[0] + 1.6 * S, top[1] + 2.2 * S), (top[0] - 1.6 * S, top[1] + 2.2 * S)], fill=255)
d.line([(3.0 * S, 9.6 * S), (8.0 * S, 9.6 * S)], fill=255, width=int(2.2 * S))
cov = np.array(layer.resize((x1 - x0, y1 - y0), Image.LANCZOS)).astype(float)[..., None] / 255
patch = light * (1 - cov) + ink * cov
a[y0:y1, x0:x1] = patch
Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(out)
