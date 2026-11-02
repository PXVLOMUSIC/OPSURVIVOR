# Mapas en alta definición: reescala el HD x2 con IA (Real-ESRGAN, modelo anime_6B, para ilustración)
# y lo guarda en JPEG de como mucho 1,5 MB. Mismas proporciones (2W x 2H), así que las colisiones no cambian.
# Requisitos: pip install torch spandrel pillow numpy  (CPU basta: ~1,5 min por mapa con 4 núcleos)
# Modelo: https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth
# Uso: python3 source-art/escalar_mapas.py RealESRGAN_x4plus_anime_6B.pth source-art/maps/hd/<mapa>.png assets/maps/<mapa>.jpg
import io, os, sys, torch, numpy as np
from PIL import Image
from spandrel import ModelLoader
sys.path.insert(0, os.path.dirname(__file__))
from ajustar_tono import tone, save_jpeg  # ajuste de tono por mapa (Skypiea)

MAX_BYTES = 1_500_000
mp, src, out = sys.argv[1:4]
m = ModelLoader().load_from_file(mp).eval()
im = Image.open(src).convert('RGB'); W, H = im.size
x = torch.from_numpy(np.array(im)).permute(2, 0, 1).float().div(255).unsqueeze(0)
s, T, P = m.scale, 256, 16  # teselas de 256 px con 16 px de margen para que no se noten las uniones
y = torch.zeros(1, 3, H * s, W * s)
with torch.inference_mode():
    for ty in range(0, H, T):
        for tx in range(0, W, T):
            y0, x0, y1, x1 = max(ty - P, 0), max(tx - P, 0), min(ty + T + P, H), min(tx + T + P, W)
            o = m(x[:, :, y0:y1, x0:x1]).clamp(0, 1)
            ey, ex = min(ty + T, H), min(tx + T, W)
            y[:, :, ty*s:ey*s, tx*s:ex*s] = o[:, :, (ty-y0)*s:(ey-y0)*s, (tx-x0)*s:(ex-x0)*s]
r = Image.fromarray((y[0].permute(1, 2, 0).numpy() * 255 + 0.5).astype(np.uint8))
if r.size != (W * 2, H * 2):
    r = r.resize((W * 2, H * 2), Image.LANCZOS)  # el modelo es x4: se baja a x2 exacto
r = tone(r, os.path.splitext(os.path.basename(out))[0])
save_jpeg(r, out, MAX_BYTES)
