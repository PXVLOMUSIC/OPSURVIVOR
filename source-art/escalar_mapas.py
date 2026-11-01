# Mapas en alta definición: escala el HD x2 (Lanczos) con un enfoque suave y lo guarda en JPEG.
# Así 1 píxel de la imagen = 1 píxel de pantalla con MAP_SCALE 2 (antes 1 píxel = 4 tras el pixelado GBA).
# Uso: python3 source-art/escalar_mapas.py source-art/maps/hd/<mapa>.png assets/maps/<mapa>.jpg
import sys
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); W, H = im.size
up = im.resize((W * 2, H * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
up.save(out, quality=85, optimize=True, progressive=True, subsampling=0)
