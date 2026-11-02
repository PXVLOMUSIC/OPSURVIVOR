# Empaqueta los frames sueltos en atlas (una hoja por carpeta) para servir muchos menos archivos.
# - Entrada: assets/extracted/<carpeta>/*.png y assets/sprites/gears/*.png (siguen siendo la fuente; se editan ahí).
# - Salida: assets/atlas/<carpeta>[-N].png y js/atlas-index.js (ruta original -> [hoja, x, y, w, h]).
# El juego pide la ruta original con loadImg() y core.js la recorta del atlas (ver atlasFrame).
# Volver a ejecutarlo tras añadir o cambiar sprites: python3 tools/build-atlas.py
import os, glob, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = 'assets/atlas'
MAX = 2048  # lado máximo de una hoja (seguro en móviles)
PAD = 1

def groups():
    for d in sorted(glob.glob(os.path.join(ROOT, 'assets/extracted/*/'))):
        yield os.path.basename(d.rstrip('/')), sorted(glob.glob(d + '*.png'))
    yield 'gears', sorted(glob.glob(os.path.join(ROOT, 'assets/sprites/gears/*.png')))

def pack(items):
    """Estantes: más altos primero. Devuelve [(ancho, alto, [(item, x, y)])] por hoja."""
    area = sum((im.width + PAD) * (im.height + PAD) for _, im in items)
    width = min(MAX, max(max(im.width for _, im in items) + PAD, int((area ** 0.5) * 1.15)))
    items = sorted(items, key=lambda t: (-t[1].height, t[0]))
    pages, cur, x, y, shelf = [], [], 0, 0, 0
    for it in items:
        w, h = it[1].width + PAD, it[1].height + PAD
        if x + w > width: x, y, shelf = 0, y + shelf, 0
        if y + h > MAX:
            pages.append(cur); cur, x, y, shelf = [], 0, 0, 0
        cur.append((it, x, y)); x += w; shelf = max(shelf, h)
    pages.append(cur)
    out = []
    for p in pages:
        out.append((max(x + it[1].width for it, x, _ in p), max(y + it[1].height for it, _, y in p), p))
    return out

def main():
    os.makedirs(os.path.join(ROOT, OUT_DIR), exist_ok=True)
    for f in glob.glob(os.path.join(ROOT, OUT_DIR, '*.png')): os.remove(f)
    pages, frames = [], {}
    for name, files in groups():
        if not files: continue
        items = [(os.path.relpath(f, ROOT).replace(os.sep, '/'), Image.open(f).convert('RGBA')) for f in files]
        sheets = pack(items)
        for n, (w, h, placed) in enumerate(sheets):
            sheet = Image.new('RGBA', (w, h), (0, 0, 0, 0))
            for (path, im), x, y in placed:
                sheet.paste(im, (x, y))
                frames[path] = [len(pages), x, y, im.width, im.height]
            rel = f"{OUT_DIR}/{name}{'' if len(sheets) == 1 else '-' + str(n)}.png"
            sheet.save(os.path.join(ROOT, rel), optimize=True)
            pages.append(rel)
    with open(os.path.join(ROOT, 'js/atlas-index.js'), 'w') as fh:
        fh.write('// Generado por tools/build-atlas.py: no editar a mano.\n')
        fh.write('// Ruta del frame original -> [hoja, x, y, ancho, alto]\n')
        fh.write('const ATLAS_PAGES = ' + json.dumps(pages) + ';\n')
        fh.write('const ATLAS_FRAMES = {\n' + ',\n'.join(f'"{k}":{json.dumps(v, separators=(",", ":"))}' for k, v in sorted(frames.items())) + '\n};\n')
    print(len(frames), 'frames en', len(pages), 'hojas')

if __name__ == '__main__':
    main()
