# Soldado de ajedrez (Chess Peacekeeper de Big Mom) en pixel art, dibujado por código (no hay sprites 2D de ellos).
# Uso: python3 source-art/dibujar_soldado_ajedrez.py assets/extracted  (crea chess_soldier, blancas, y chess_soldier_b, negras)
from PIL import Image, ImageDraw
O=(24,20,28,255); W=(242,238,226,255); WS=(196,188,170,255); WD=(150,140,124,255)
G=(222,170,40,255); GD=(160,110,20,255); SH=(120,74,34,255); ST=(208,214,222,255); STD=(140,148,160,255)
EY=(30,24,30,255); MO=(170,40,50,255); RED=(200,40,60,255)
def ell(d,b,fill): d.ellipse(b,fill=fill,outline=O)
def frame(bob=0, step=0, thrust=0, dark=False):
    w,h=40,50; im=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(im)
    body,shade,deep=(W,WS,WD) if not dark else ((70,62,78,255),(48,42,56,255),(34,30,40,255))
    y=bob
    EYc=EY if not dark else (236,226,196,255)
    # base (peana)
    d.rectangle([9+step,44,25+step,47],fill=deep,outline=O); d.rectangle([10,41+y//2,24,44],fill=shade,outline=O)
    # cuerpo acampanado
    d.polygon([(12,26+y),(22,26+y),(25,41+y//2),(9,41+y//2)],fill=body,outline=O)
    d.polygon([(19,27+y),(22,27+y),(24,40+y//2),(20,40+y//2)],fill=shade)
    d.polygon([(21,27+y),(22,27+y),(24,40+y//2),(22,40+y//2)],fill=deep)
    d.line([(13,28+y),(11,39+y//2)],fill=(255,255,255,255))
    d.polygon([(12,26+y),(22,26+y),(25,41+y//2),(9,41+y//2)],outline=O)
    # cinturón dorado
    d.rectangle([11,33+y,23,35+y],fill=G,outline=O); d.point((17,34+y),fill=RED)
    # gorguera / collar
    ell(d,[8,22+y,26,28+y],shade); d.line([(10,24+y),(18,24+y)],fill=body); d.line([(10,26+y),(24,26+y)],fill=GD)
    # cabeza (peón)
    ell(d,[10,8+y,24,23+y],body)
    d.chord([11,9+y,23,22+y],300,80,fill=shade); d.chord([12,10+y,22,21+y],320,60,fill=deep)
    d.line([(12,13+y),(12,17+y)],fill=(255,255,255,255))
    d.ellipse([10,8+y,24,23+y],outline=O)
    # casco con cresta
    d.chord([9,6+y,25,17+y],180,360,fill=G,outline=O); d.line([(11,10+y),(16,7+y)],fill=(255,226,120,255))
    d.line([(19,8+y),(23,11+y)],fill=GD); d.rectangle([16,2+y,18,7+y],fill=RED,outline=O)
    # cara seria
    d.line([(13,15+y),(15,16+y)],fill=EYc); d.line([(21,15+y),(19,16+y)],fill=EYc)
    d.point((14,17+y),fill=EYc); d.point((20,17+y),fill=EYc); d.line([(15,20+y),(19,20+y)],fill=MO)
    # lanza
    if thrust==0:
        d.rectangle([28,4+y,29,44],fill=SH); d.polygon([(26,5+y),(28.5,-1+y),(31,5+y)],fill=ST,outline=O); d.line([(29,1+y),(30,4+y)],fill=STD)
        ell(d,[24,28+y,29,32+y],body)  # mano
    else:
        x0=20+thrust; d.rectangle([4,30+y,x0+12,31+y],fill=SH)
        d.polygon([(x0+12,27+y),(x0+19,30.5+y),(x0+12,34+y)],fill=ST,outline=O); ell(d,[20,28+y,25,33+y],body)
    return im
def frames(dark=False):
    return [frame(0,0,dark=dark),frame(1,1,dark=dark),frame(0,0,dark=dark),frame(1,-1,dark=dark),frame(0,0,thrust=-4,dark=dark),frame(0,0,thrust=2,dark=dark)]
if __name__=='__main__':
    import sys, os
    for folder, dark in (('chess_soldier', False), ('chess_soldier_b', True)):
        d=os.path.join(sys.argv[1], folder); os.makedirs(d, exist_ok=True)
        for i,f in enumerate(frames(dark)): f.save(os.path.join(d,'sprite_%03d.png'%i), optimize=True)
