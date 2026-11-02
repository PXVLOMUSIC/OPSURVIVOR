# Ajuste de tono por mapa para que efectos y sprites se distingan sobre fondos muy claros.
# Curva: salida = tope * entrada^gamma * tinte, y luego saturación. Los blancos bajan a ~80 % y los medios
# se oscurecen más, con un tinte azul cielo, así que Skypiea sigue siendo de nubes pero deja de deslumbrar.
# escalar_mapas.py lo aplica solo. Para un .jpg ya reescalado:
#   python3 source-art/ajustar_tono.py assets/maps/skypiea.jpg   (aplicarlo UNA vez: se acumula)
import io, os, sys, numpy as np
from PIL import Image, ImageEnhance

TONE = {
    'skypiea': dict(gamma=1.5, top=0.80, tint=(0.87, 0.92, 1.0), sat=1.2),  # brillo medio 193 -> 128
    'drum': dict(gamma=1.3, top=0.85, tint=(0.90, 0.94, 1.0), sat=1.15),  # nieve de Drum (brillo medio 162 -> ~120), mismo trato que Skypiea
}

def tone(im, mapa):
    t = TONE.get(mapa)
    if not t: return im
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255
    a = t['top'] * np.power(a, t['gamma']) * np.array(t['tint'], np.float32)
    out = Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))
    return ImageEnhance.Color(out).enhance(t['sat'])

def save_jpeg(r, out, max_bytes=1_500_000, q0=90):
    for q in range(q0, 59, -2):
        b = io.BytesIO(); r.save(b, 'JPEG', quality=q, optimize=True, progressive=True, subsampling=0)
        if b.tell() <= max_bytes: break
    open(out, 'wb').write(b.getvalue()); print(out, r.size, f'q{q}', b.tell())

if __name__ == '__main__':
    p = sys.argv[1]
    save_jpeg(tone(Image.open(p), os.path.splitext(os.path.basename(p))[0]), p, q0=94)
