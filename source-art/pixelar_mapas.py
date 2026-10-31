# Pixela un mapa HD al estilo GBA: reduce a la mitad (BOX), enfoca un poco, satura +12%,
# pasa a color de 15 bits y vuelve a 1408x768 por vecino mas cercano.
# Uso: python3 source-art/pixelar_mapas.py source-art/maps/hd/<mapa>.png assets/maps/<mapa>.png 2 0
import sys
from PIL import Image, ImageEnhance, ImageFilter
src,out,k,colors=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])
im=Image.open(src).convert('RGB'); W,H=im.size
s=im.resize((W//k,H//k),Image.BOX)
s=s.filter(ImageFilter.UnsharpMask(radius=1,percent=60,threshold=2))
s=ImageEnhance.Color(s).enhance(1.12)
q=s if colors==0 else s.quantize(colors=colors,method=Image.Quantize.MAXCOVERAGE,dither=Image.Dither.NONE).convert("RGB")
q=q.point(lambda v:(v>>3)<<3|(v>>5))  # color de 15 bits como la GBA
q.resize((W,H),Image.NEAREST).save(out,optimize=True)
