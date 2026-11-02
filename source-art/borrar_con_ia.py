# Borra elementos del arte de un mapa con IA (LaMa, inpainting): rellena las cajas indicadas con el fondo que las rodea.
# Modelo: https://github.com/Sanster/models/releases/download/add_big_lama/big-lama.pt  (pip install torch pillow numpy)
# Uso: python3 source-art/borrar_con_ia.py big-lama.pt <entrada.png> <salida.png> x0,y0,x1,y1 [x0,y0,x1,y1 ...]
# Shell Town (arte original de Pablo): Zoro atado al poste 1200,206,1282,362 y el cartel «CAPTRN MORGHN'S BHSE» 653,98,757,134;
# después una segunda pasada en los restos 1252,226,1290,266 1246,336,1292,366 y shelltown_cartel_A.py (MRRINES -> MARINES).
import sys, torch, numpy as np
from PIL import Image
m = torch.jit.load(sys.argv[1], map_location='cpu').eval()
def inpaint(im, box, ctx=96):
    x0,y0,x1,y1 = box
    cx0,cy0 = max(0,x0-ctx), max(0,y0-ctx)
    cx1,cy1 = min(im.width,x1+ctx), min(im.height,y1+ctx)
    w = (cx1-cx0)//8*8; h=(cy1-cy0)//8*8; cx1=cx0+w; cy1=cy0+h
    crop = np.array(im.crop((cx0,cy0,cx1,cy1))).astype(np.float32)/255
    mask = np.zeros((h,w),np.float32); mask[y0-cy0:y1-cy0, x0-cx0:x1-cx0]=1
    with torch.inference_mode():
        out = m(torch.from_numpy(crop).permute(2,0,1)[None], torch.from_numpy(mask)[None,None])
    o = out[0].permute(1,2,0).numpy()
    if o.max()>2: o=o/255
    res = crop*(1-mask[...,None]) + o*mask[...,None]
    im.paste(Image.fromarray((res*255+0.5).clip(0,255).astype(np.uint8)), (cx0,cy0))
im = Image.open(sys.argv[2]).convert('RGB')
for b in sys.argv[4:]:
    inpaint(im, tuple(int(v) for v in b.split(',')))
im.save(sys.argv[3])
