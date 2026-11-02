# Iconos pixel art propios de las evoluciones (id 'evo_<arma>'), uno por técnica evolucionada.
# Lo ejecuta dibujar_iconos_habilidades.py antes de montar la hoja (usa sus piezas: new, px, fist, sword, flame...).
# Cada uno muestra la técnica final tal como sale en el manga/anime, no el arma base con brillo.

PINK = C('f5a3a3'); PINKL = C('ffd1cc'); PINKD = C('c0606a')
HAKI = C('1c1724'); HAKIL = C('4b3f63')
GOLD = C('ffd23f'); GOLDD = C('b8860b')
BFIRE = C('3d8bff'); BFIREL = C('9fd0ff'); BFIRED = C('1f3fa8')
ENMA = C('7b2fbf'); ENMAL = C('c38bff')
WATER = C('2f8fe0'); WATERL = C('a8dcff'); WATERD = C('1b4f9c')
LEAF = C('3fa34d'); LEAFL = C('8fe08a'); LEAFD = C('1f6b33')
KAIRO = C('3fbf9f'); KAIROL = C('a8f0dc')

def steam(d, pts):
    for (x, y, r) in pts:
        d.ellipse([x - r, y - r, x + r, y + r], fill=P['wht'])

def bfire(d, cx, by, h, w):
    d.polygon([(cx, by - h), (cx + w, by - h // 3), (cx + w - 1, by), (cx - w + 1, by), (cx - w, by - h // 3)], fill=BFIRED)
    d.polygon([(cx, by - h + 3), (cx + w - 2, by - h // 3), (cx + w - 3, by - 1), (cx - w + 3, by - 1), (cx - w + 2, by - h // 3)], fill=BFIRE)
    d.ellipse([cx - 2, by - 5, cx + 2, by - 1], fill=BFIREL)

def tiles(d, x, y, n, col='brn', light='brnL'):
    for k in range(n):
        d.rectangle([x, y + k * 3, x + 8, y + k * 3 + 1], fill=P[col]); d.line([(x, y + k * 3), (x + 8, y + k * 3)], fill=P[light])

# ===== LUFFY =====
@icon('evo_pistol')
def _():
    im, d = new()
    # Red Hawk: puño con Haki envuelto en fuego y estela roja
    flame(d, 6, 18, 12, 6)
    d.rectangle([0, 9, 7, 12], fill=PINK)
    d.rounded_rectangle([8, 6, 17, 14], 2, fill=HAKI); d.line([(9, 6), (15, 6)], fill=HAKIL)
    for k in (11, 13, 15): d.line([(k, 7), (k, 10)], fill=HAKIL)
    d.polygon([(17, 4), (19, 8), (19, 12), (17, 16)], fill=P['redL'])
    px(d, [(18, 2), (19, 1), (18, 17)], P['yel'])
    return im

@icon('evo_gatling')
def _():
    im, d = new()
    # Jet Gatling: puños rosados del Gear 2 que humean
    for (x, y) in ((1, 1), (11, 3), (4, 8), (12, 11), (2, 14)):
        d.line([(max(0, x - 5), y + 3), (x, y + 3)], fill=PINKL)
        d.rounded_rectangle([x, y, x + 7, y + 5], 2, fill=PINK); d.line([(x + 1, y), (x + 5, y)], fill=PINKL)
        for k in (2, 4): d.line([(x + k, y + 1), (x + k, y + 3)], fill=PINKD)
    steam(d, [(18, 1, 1), (9, 7, 1), (19, 9, 1)])
    return im

@icon('evo_bazooka')
def _():
    im, d = new()
    # Jet Bazooka: palmas rosadas del Gear 2 y vapor
    for y0 in (2, 11):
        d.rectangle([0, y0 + 2, 6, y0 + 5], fill=PINK)
        d.rounded_rectangle([7, y0, 13, y0 + 7], 1, fill=PINK)
        for k in range(4): d.rectangle([14, y0 + k * 2, 16, y0 + k * 2], fill=PINK)
        d.line([(9, y0 + 1), (9, y0 + 6)], fill=PINKD)
    steam(d, [(2, 1, 1), (4, 10, 1), (18, 9, 1)])
    d.line([(18, 2), (19, 0)], fill=P['yel']); d.line([(18, 17), (19, 19)], fill=P['yel'])
    return im

@icon('evo_gear2')
def _():
    im, d = new()
    # Gear 4 Boundman: brazo inflado negro de Haki con las llamas rojas del dibujo
    d.ellipse([3, 3, 19, 18], fill=HAKI)
    d.ellipse([5, 4, 13, 9], fill=HAKIL)
    d.polygon([(6, 12), (10, 9), (9, 12), (14, 10), (12, 14), (17, 13), (13, 17), (6, 16)], fill=P['red'])
    d.line([(7, 14), (12, 13)], fill=P['redL'])
    steam(d, [(2, 2, 2), (1, 9, 1), (4, 19, 1)])
    return im

@icon('evo_muchi')
def _():
    im, d = new()
    # Jet Whip: pierna rosada que barre con vapor
    for k, col in enumerate((PINKL, P['wht'])):
        d.arc([2 + k * 2, 1 + k * 2, 19 - k * 2, 18 - k * 2], 190, 350, fill=col, width=1)
    d.rectangle([0, 13, 5, 18], fill=C('3b5ba8'))
    d.line([(5, 15), (15, 15)], fill=PINK, width=3); d.line([(5, 14), (15, 14)], fill=PINKL)
    d.polygon([(15, 12), (19, 13), (19, 17), (15, 17)], fill=PINK)
    steam(d, [(3, 4, 1), (10, 1, 1)])
    return im

@icon('evo_ono')
def _():
    im, d = new()
    # Gigant Ono: pierna gigante (Gear 3) que cae y raja el suelo
    d.rectangle([4, 0, 15, 4], fill=C('3b5ba8'))
    d.rectangle([4, 4, 15, 12], fill=P['skin']); d.line([(4, 4), (4, 12)], fill=P['skinL'])
    d.rounded_rectangle([1, 11, 18, 16], 2, fill=P['skin']); d.line([(1, 16), (18, 16)], fill=P['strawD'])
    d.line([(0, 18), (19, 18)], fill=P['brn'], width=2)
    for (a, b) in (((0, 14), (0, 17)), ((19, 13), (19, 17)), ((9, 17), (7, 19)), ((13, 17), (15, 19))):
        d.line([a, b], fill=P['yel'])
    return im

@icon('evo_hakiPulse')
def _():
    im, d = new()
    # Haoshoku: corona dorada con rayos negros y rojos
    d.polygon([(2, 15), (2, 7), (6, 11), (10, 4), (14, 11), (18, 7), (18, 15)], fill=GOLD)
    d.rectangle([2, 15, 18, 18], fill=GOLDD)
    px(d, [(10, 9), (6, 14), (14, 14)], P['red'])
    for pts in (((0, 0), (3, 3), (1, 5)), ((19, 0), (16, 3), (18, 5)), ((9, 0), (11, 2))):
        d.line(pts, fill=HAKI, width=1)
    px(d, [(4, 1), (15, 1)], P['red'])
    return im

# ===== ZORO =====
@icon('evo_zoroform')
def _():
    im, d = new()
    # Enma: katana negra con aura morada (Rey del Infierno)
    for (x, y) in ((3, 2), (14, 4), (2, 12), (16, 14)):
        d.polygon([(x, y), (x + 2, y + 3), (x - 2, y + 3)], fill=ENMA)
    d.line([(17, 1), (6, 12)], fill=HAKI, width=3); d.line([(17, 1), (7, 11)], fill=ENMAL)
    d.line([(5, 11), (9, 15)], fill=GOLD, width=2)
    d.line([(6, 14), (2, 18)], fill=P['pur'], width=2)
    return im

@icon('evo_santoryu')
def _():
    im, d = new()
    # Rokudo no Tsuji: seis cortes que se cruzan en un punto
    for a in range(6):
        ang = math.radians(a * 30 + 15)
        dx, dy = math.cos(ang) * 9, math.sin(ang) * 9
        d.line([(10 - dx, 10 - dy), (10 + dx, 10 + dy)], fill=P['wht'] if a % 2 else P['grnL'], width=1)
    d.ellipse([7, 7, 13, 13], fill=P['grn']); d.ellipse([9, 9, 11, 11], fill=P['wht'])
    return im

@icon('evo_onigiri')
def _():
    im, d = new()
    # Rengoku Onigiri: tres espadas cruzadas en llamas del purgatorio
    flame(d, 10, 19, 16, 9)
    sword(d, (2, 2), (16, 16), 'grnD'); sword(d, (18, 2), (4, 16), 'blk')
    d.line([(10, 0), (10, 15)], fill=P['stl'], width=2); d.line([(8, 15), (12, 15)], fill=P['yel'])
    return im

@icon('evo_flyingslash')
def _():
    im, d = new()
    # Shishi Sonson: corte en arco con la cabeza de león dorada
    d.arc([0, 0, 19, 19], 200, 340, fill=P['wht'], width=2)
    d.ellipse([6, 7, 15, 16], fill=P['ora']); d.ellipse([8, 9, 13, 14], fill=GOLD)
    px(d, [(9, 11), (12, 11)], P['blk']); d.line([(10, 13), (11, 13)], fill=P['redD'])
    for (x, y) in ((5, 9), (15, 9), (6, 15), (14, 15), (10, 6)): px(d, [(x, y)], P['oraL'])
    d.line([(1, 19), (8, 15)], fill=P['stl'], width=1)
    return im

@icon('evo_tatsumaki')
def _():
    im, d = new()
    # Kokujo O Tatsumaki: tornado negro con filo rojo
    for k, (w, y) in enumerate(((9, 2), (7, 6), (6, 10), (4, 14), (2, 17))):
        d.rounded_rectangle([10 - w, y, 10 + w, y + 2], 1, fill=HAKI if k % 2 == 0 else HAKIL)
        d.line([(10 - w, y), (10 + w - 3, y)], fill=P['red'])
    d.line([(16, 0), (19, 3)], fill=P['stl']); d.line([(3, 0), (0, 3)], fill=P['stl'])
    return im

@icon('evo_poundho')
def _():
    im, d = new()
    # Sanzen Daisen Sekai: tres espadas girando como un molino
    d.ellipse([1, 1, 18, 18], outline=P['grnL'], width=1)
    for a in (0, 120, 240):
        ang = math.radians(a - 90)
        d.line([(10, 10), (10 + math.cos(ang) * 9, 10 + math.sin(ang) * 9)], fill=P['stl'], width=2)
    d.ellipse([7, 7, 13, 13], fill=P['grn']); d.ellipse([9, 9, 11, 11], fill=P['grnL'])
    return im

# ===== SANJI =====
@icon('evo_sanjiform')
def _():
    im, d = new()
    # Ifrit Jambe: pierna con fuego azul
    bfire(d, 9, 18, 18, 8)
    d.line([(4, 18), (12, 6)], fill=P['blk'], width=3)
    shoe(d, 10, 2)
    px(d, [(1, 3), (18, 10)], BFIREL)
    return im

@icon('evo_diablejambe')
def _():
    im, d = new()
    # Hell Memories: gran bola de fuego desde el zapato
    d.ellipse([3, 1, 19, 17], fill=P['red']); d.ellipse([6, 4, 17, 14], fill=P['ora']); d.ellipse([9, 7, 15, 12], fill=P['yel'])
    shoe(d, 0, 14)
    px(d, [(1, 4), (2, 9), (17, 18)], P['ora'])
    return im

@icon('evo_collier')
def _():
    im, d = new()
    # Collier Shoot Grilled: patada ascendente en llamas
    flame(d, 10, 19, 15, 6)
    d.line([(9, 19), (12, 6)], fill=P['blk'], width=3)
    shoe(d, 10, 2)
    d.line([(4, 1), (7, 4)], fill=P['wht']); d.line([(17, 9), (19, 7)], fill=P['wht'])
    return im

@icon('evo_joueshot')
def _():
    im, d = new()
    # Mouton Shot: suela en llamas contra el estallido rojo
    star(d, 13, 10, 7, 3, 'red', n=8)
    star(d, 13, 10, 4, 2, 'yel', n=8)
    d.line([(0, 12), (7, 10)], fill=P['blk'], width=3)
    shoe(d, 4, 7)
    flame(d, 3, 18, 7, 3)
    return im

@icon('evo_concasse')
def _():
    im, d = new()
    # Bien Cuit Grill Shot: marcas de parrilla en llamas bajo el talón
    for x in (3, 8, 13):
        d.line([(x, 9), (x + 3, 19)], fill=P['red'], width=2)
    flame(d, 10, 19, 8, 9)
    d.line([(10, 0), (10, 5)], fill=P['blk'], width=3)
    shoe(d, 6, 5)
    return im

@icon('evo_partycourse')
def _():
    im, d = new()
    # Anti-Manner Kick Course: lluvia de zapatos en llamas
    for (x, y) in ((1, 1), (10, 3), (3, 9), (11, 11), (2, 16)):
        d.line([(max(0, x - 3), y + 2), (x, y + 2)], fill=P['ora'])
        shoe(d, x, y)
        px(d, [(x + 8, y + 1)], P['red'])
    return im

# ===== ARMAS COMPARTIDAS =====
@icon('evo_cuchillo')
def _():
    im, d = new()
    # Neko no Te: guante con cinco cuchillas de Kuro
    d.rounded_rectangle([1, 11, 9, 18], 2, fill=P['blk']); d.line([(2, 11), (8, 11)], fill=P['blkL'])
    for k in range(5):
        d.line([(3 + k * 2, 11), (10 + k * 2, 1 + k)], fill=P['stl'], width=1)
        px(d, [(10 + k * 2, 1 + k)], P['wht'])
    return im

@icon('evo_granada')
def _():
    im, d = new()
    # Nose Fancy Cannon: mocos explosivos de Mr. 5 saliendo de la nariz
    d.polygon([(1, 4), (7, 2), (8, 12), (1, 12)], fill=P['skin']); d.line([(7, 3), (8, 11)], fill=P['skinD'])
    px(d, [(6, 10)], P['blk'])
    d.ellipse([10, 8, 15, 13], fill=C('b8d86b')); d.ellipse([14, 4, 19, 9], fill=C('b8d86b'))
    star(d, 14, 15, 5, 2, 'ora', n=7); star(d, 14, 15, 2, 1, 'yel', n=7)
    d.rectangle([1, 12, 5, 19], fill=P['blk'])
    return im

@icon('evo_rifle')
def _():
    im, d = new()
    # Senriku: el rifle largo de Van Augur con mira
    d.line([(1, 15), (19, 5)], fill=P['blk'], width=2)
    d.polygon([(1, 13), (6, 11), (7, 15), (2, 18)], fill=P['brn'])
    d.rectangle([8, 7, 13, 9], fill=P['gryD']); px(d, [(13, 8)], P['red'])
    d.ellipse([12, 13, 18, 19], outline=P['red'], width=1); px(d, [(15, 16)], P['red'])
    return im

@icon('evo_ballesta')
def _():
    im, d = new()
    # Virote de Kairoseki: ballesta con la punta de piedra marina
    d.line([(10, 19), (10, 7)], fill=P['brn'], width=3)
    d.arc([2, 5, 18, 17], 180, 360, fill=P['brnD'], width=2)
    d.line([(2, 11), (10, 15), (18, 11)], fill=P['gry'])
    d.line([(10, 15), (10, 3)], fill=P['stl'])
    d.polygon([(10, 0), (13, 4), (10, 5), (7, 4)], fill=KAIRO); px(d, [(10, 1)], KAIROL)
    return im

@icon('evo_lanza')
def _():
    im, d = new()
    # Bisento de Barbablanca: hoja curva en asta larga
    d.line([(2, 19), (13, 6)], fill=P['blk'], width=2)
    d.polygon([(12, 7), (13, 1), (17, 0), (19, 3), (16, 8)], fill=P['stl'])
    d.line([(13, 2), (17, 1)], fill=P['wht'])
    d.line([(11, 8), (14, 10)], fill=GOLD, width=2)
    return im

@icon('evo_hacha')
def _():
    im, d = new()
    # Mano-hacha de Morgan: el hacha forma parte del brazo
    d.rectangle([0, 12, 7, 17], fill=P['wht']); d.line([(0, 12), (7, 12)], fill=P['gry'])
    d.rectangle([7, 11, 11, 18], fill=P['stlD'])
    d.polygon([(11, 4), (19, 1), (19, 19), (11, 18)], fill=P['stl'])
    d.line([(18, 2), (18, 18)], fill=P['wht'])
    px(d, [(13, 8), (13, 13)], P['gryD'])
    return im

@icon('evo_shuriken')
def _():
    im, d = new()
    # Makibishi de Raizo: pergamino ninja y abrojos
    d.rectangle([2, 2, 12, 10], fill=P['wht']); d.line([(2, 2), (2, 10)], fill=P['brn'], width=2); d.line([(12, 2), (12, 10)], fill=P['brn'], width=2)
    d.line([(5, 5), (9, 5)], fill=P['red']); d.line([(5, 7), (8, 7)], fill=P['red'])
    for (x, y) in ((5, 15), (12, 14), (16, 7), (16, 17)):
        star(d, x, y, 3, 1, 'stlD', n=4); px(d, [(x, y)], P['wht'])
    return im

@icon('evo_kabuto')
def _():
    im, d = new()
    # Kuro Kabuto: tirachinas negro con semilla Pop Green
    d.line([(8, 19), (8, 10)], fill=HAKI, width=3)
    d.line([(8, 11), (2, 2)], fill=HAKI, width=3); d.line([(8, 11), (14, 2)], fill=HAKI, width=3)
    d.line([(7, 11), (2, 3)], fill=HAKIL)
    d.line([(2, 2), (8, 7), (14, 2)], fill=P['red'])
    d.ellipse([13, 9, 19, 15], fill=LEAF); px(d, [(15, 10)], LEAFL); d.line([(16, 9), (17, 7)], fill=LEAFD)
    return im

@icon('evo_climatact')
def _():
    im, d = new()
    # Thunder Lance Tempo: lanza de rayo desde el Clima-Tact
    d.line([(1, 18), (8, 11)], fill=P['blu'], width=3); d.line([(1, 17), (7, 11)], fill=P['bluL'])
    d.polygon([(8, 11), (19, 0), (13, 9), (17, 8), (9, 13)], fill=P['yel'])
    d.line([(10, 10), (17, 2)], fill=P['yelL'])
    cloud(d, 0, 0, w=9)
    return im

@icon('evo_dial')
def _():
    im, d = new()
    # Reject Dial: concha con la onda de choque que rebota
    for r, col in ((9, 'pur'), (7, 'purL')):
        d.arc([10 - r, 10 - r, 10 + r, 10 + r], 0, 360, fill=P[col], width=1)
    d.pieslice([4, 5, 16, 17], 180, 360, fill=P['wht'])
    d.rectangle([4, 11, 16, 15], fill=P['gry'])
    for x in (7, 10, 13): d.line([(x, 6), (x, 11)], fill=P['gry'])
    px(d, [(10, 13)], P['red'])
    return im

@icon('evo_roseo')
def _():
    im, d = new()
    # Cerezos de Drum: árbol de cerezo rosa sobre la nieve
    d.rectangle([9, 11, 11, 18], fill=P['brn'])
    for (x, y, r) in ((6, 7, 5), (14, 7, 5), (10, 4, 5), (10, 10, 4)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=P['pnk'])
    petals(d, [(5, 4), (13, 3), (16, 9), (2, 14), (16, 16)], col='pnkL', light='wht')
    d.line([(0, 19), (19, 19)], fill=P['wht'])
    return im

@icon('evo_clutch')
def _():
    im, d = new()
    # Gigantesco Mano: mano gigante (hecha de brazos) que brota del suelo entre pétalos
    d.rectangle([7, 14, 12, 19], fill=P['skin']); d.line([(7, 14), (7, 19)], fill=P['skinD'])
    d.rounded_rectangle([4, 8, 15, 15], 2, fill=P['skin'])
    for k in range(4):
        d.rounded_rectangle([4 + k * 3, 1 + (1 if k in (0, 3) else 0), 6 + k * 3, 9], 1, fill=P['skin'])
        d.line([(4 + k * 3, 3), (4 + k * 3, 9)], fill=P['skinD'])
    d.polygon([(15, 13), (19, 8), (19, 10), (16, 15)], fill=P['skin'])
    d.line([(5, 12), (13, 12)], fill=P['skinD'])
    petals(d, [(1, 3), (0, 14), (17, 1), (16, 17)])
    return im

# ===== TRANSFORMACIONES DE LA TRIPULACIÓN =====
@icon('evo_namiform')
def _():
    im, d = new()
    # Zeus: nube de tormenta con cara y rayos
    cloud(d, 1, 2, col='gryD', light='gry', w=17)
    d.rounded_rectangle([2, 4, 17, 11], 3, fill=P['gryD'])
    px(d, [(7, 7), (12, 7)], P['wht']); d.line([(8, 9), (11, 9)], fill=P['wht'])
    bolt(d, 2, 9); bolt(d, 11, 9)
    return im

@icon('evo_usoppform')
def _():
    im, d = new()
    # God Usopp: cara con la nariz larga, el pelo rizado y aureola
    d.ellipse([3, 0, 16, 3], outline=GOLD, width=1)
    d.ellipse([3, 4, 15, 18], fill=C('a9744f'))
    d.ellipse([2, 3, 16, 9], fill=P['blk'])
    px(d, [(6, 11), (11, 11)], P['blk'])
    d.rectangle([9, 12, 19, 13], fill=C('a9744f')); px(d, [(19, 12)], C('7a4f30'))
    d.line([(6, 16), (11, 16)], fill=P['redD'])
    return im

@icon('evo_chopperform')
def _():
    im, d = new()
    # Monster Point dominado: Chopper gigante con su sombrero rosa
    d.ellipse([2, 6, 18, 19], fill=P['brn']); d.ellipse([5, 8, 15, 14], fill=P['brnL'])
    d.rounded_rectangle([4, 1, 15, 6], 2, fill=P['pnk']); d.line([(4, 5), (15, 5)], fill=P['pnkD'])
    d.line([(6, 3), (13, 3)], fill=P['wht'])
    d.line([(1, 1), (4, 4)], fill=P['brnD'], width=2); d.line([(18, 1), (15, 4)], fill=P['brnD'], width=2)
    px(d, [(7, 10), (12, 10)], P['blk']); px(d, [(9, 12), (10, 12)], C('3b5ba8'))
    return im

@icon('evo_robinform')
def _():
    im, d = new()
    # Demonio Fleur: alas negras de manos y silueta morada
    d.polygon([(0, 3), (8, 8), (9, 14), (2, 12)], fill=HAKI)
    d.polygon([(19, 3), (11, 8), (10, 14), (17, 12)], fill=HAKI)
    for x in (1, 3, 5, 14, 16, 18): px(d, [(x, 4 + abs(x - 9) // 3)], HAKIL)
    d.ellipse([7, 2, 12, 7], fill=P['blk'])
    d.polygon([(7, 8), (12, 8), (13, 19), (6, 19)], fill=P['pur'])
    petals(d, [(2, 16), (16, 16)])
    return im

@icon('evo_frankyform')
def _():
    im, d = new()
    # Franky Shogun: robot con cuernos de samurái
    d.polygon([(2, 0), (6, 5), (4, 6)], fill=GOLD); d.polygon([(18, 0), (14, 5), (16, 6)], fill=GOLD)
    d.rectangle([3, 6, 16, 18], fill=P['red']); d.line([(3, 6), (16, 6)], fill=P['redL'])
    d.rectangle([5, 9, 14, 12], fill=P['blk']); d.line([(6, 10), (13, 10)], fill=P['cya'])
    d.rectangle([6, 14, 13, 16], fill=P['stl'])
    d.polygon([(6, 6), (9, 2), (13, 2), (14, 6)], fill=P['cya'])
    return im

@icon('evo_brookform')
def _():
    im, d = new()
    # Soul Solid: espada bastón envuelta en el frío azul del inframundo
    bfire(d, 10, 19, 17, 7)
    d.line([(10, 1), (10, 17)], fill=P['stl'], width=2); d.line([(10, 1), (10, 16)], fill=P['wht'])
    d.rectangle([9, 14, 11, 19], fill=P['blk'])
    for (x, y) in ((3, 3), (16, 5), (2, 12), (17, 14)): px(d, [(x, y), (x + 1, y + 1)], BFIREL)
    return im

@icon('evo_jinbeform')
def _():
    im, d = new()
    # Caballero del Mar: escudo con la ola y la marca del Sol
    d.polygon([(2, 1), (17, 1), (17, 10), (10, 19), (2, 10)], fill=WATERD)
    d.polygon([(4, 3), (15, 3), (15, 9), (10, 16), (4, 9)], fill=WATER)
    d.arc([3, 6, 11, 14], 180, 360, fill=WATERL, width=2); d.arc([9, 6, 17, 14], 180, 360, fill=WATERL, width=2)
    star(d, 10, 6, 3, 1, 'red', n=8)
    return im

# ===== NAMI =====
@icon('evo_gustsword')
def _():
    im, d = new()
    # Milky Arrow: flecha de nube que cruza con un corazón
    d.line([(0, 15), (14, 5)], fill=P['wht'], width=3)
    d.polygon([(19, 1), (12, 3), (17, 8)], fill=P['wht'])
    for (x, y) in ((2, 12), (6, 9), (10, 7)): px(d, [(x, y)], P['gry'])
    d.polygon([(3, 2), (5, 0), (7, 2), (5, 5)], fill=P['pnk']); d.polygon([(5, 2), (7, 0), (9, 2), (7, 5)], fill=P['pnk'])
    d.line([(4, 18), (18, 18)], fill=P['bluL'])
    return im

@icon('evo_tornado')
def _():
    im, d = new()
    # Cyclone Tempo: ciclón gigante azul y blanco
    for k, (w, y) in enumerate(((9, 1), (8, 4), (7, 7), (5, 10), (4, 13), (2, 16))):
        d.rounded_rectangle([10 - w, y, 10 + w, y + 2], 1, fill=P['blu'] if k % 2 else P['bluL'])
        d.line([(10 - w + 2, y + 1), (10 + w - 4, y + 1)], fill=P['wht'])
    px(d, [(1, 18), (18, 17), (17, 12)], P['gry'])
    return im

@icon('evo_thunderbreed')
def _():
    im, d = new()
    # Weather Egg: el huevo que esconde el tiempo
    d.ellipse([4, 3, 16, 19], fill=P['wht']); d.ellipse([6, 5, 11, 10], fill=C('ffffff'))
    d.polygon([(4, 11), (7, 9), (9, 12), (12, 9), (14, 12), (16, 10), (16, 13), (4, 13)], fill=P['bluL'])
    cloud(d, 0, 0, w=8); px(d, [(17, 2), (18, 4)], P['yel'])
    bolt(d, 12, 13, col='yel')
    return im

@icon('evo_raintempo')
def _():
    im, d = new()
    # Mirage Tempo: varias Nami de espejismo en la niebla
    for k, (x, a) in enumerate(((1, 110), (7, 180), (13, 255))):
        col = (240, 140, 40, a)
        d.ellipse([x, 2, x + 5, 7], fill=col)
        d.rectangle([x + 1, 7, x + 4, 15], fill=(240, 196, 154, a))
        d.rectangle([x, 10, x + 5, 12], fill=(59, 125, 216, a))
    for y in (16, 18): d.line([(0, y), (19, y)], fill=P['purL'])
    return im

# ===== USOPP =====
@icon('evo_namari')
def _():
    im, d = new()
    # Platanus Shuriken: hojas gigantes girando
    for a in range(4):
        ang = math.radians(a * 90 + 20)
        cx, cy = 10 + math.cos(ang) * 5, 10 + math.sin(ang) * 5
        d.ellipse([cx - 4, cy - 2.5, cx + 4, cy + 2.5], fill=LEAF)
        px(d, [(int(cx), int(cy))], LEAFL)
    d.ellipse([8, 8, 12, 12], fill=LEAFD)
    return im

@icon('evo_kaen')
def _():
    im, d = new()
    # Skull Bomb Grass: planta con calaveras explosivas
    d.line([(10, 19), (10, 8)], fill=LEAFD, width=2)
    d.ellipse([3, 12, 9, 16], fill=LEAF); d.ellipse([11, 10, 17, 14], fill=LEAF)
    for (x, y) in ((3, 2), (11, 1)):
        d.ellipse([x, y, x + 6, y + 6], fill=P['wht'])
        px(d, [(x + 2, y + 3), (x + 4, y + 3)], P['blk']); px(d, [(x + 3, y + 5)], P['blk'])
    px(d, [(10, 7)], P['ora'])
    return im

@icon('evo_tabasco')
def _():
    im, d = new()
    # Rafflesia: la flor gigante roja con motas
    for a in range(5):
        ang = math.radians(a * 72 - 90)
        cx, cy = 10 + math.cos(ang) * 5.5, 10 + math.sin(ang) * 5.5
        d.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=P['red'])
        px(d, [(int(cx), int(cy)), (int(cx) + 1, int(cy) + 1)], P['wht'])
    d.ellipse([6, 6, 14, 14], fill=P['redD']); d.ellipse([8, 8, 12, 12], fill=P['yelD'])
    return im

@icon('evo_hinotori')
def _():
    im, d = new()
    # Take Jabbu: cañas de bambú que brotan
    for (x, h) in ((2, 15), (8, 19), (14, 13)):
        d.rectangle([x, 19 - h, x + 3, 19], fill=LEAF); d.line([(x, 19 - h), (x, 19)], fill=LEAFL)
        for y in range(19 - h + 3, 19, 4): d.line([(x, y), (x + 3, y)], fill=LEAFD)
    d.polygon([(11, 3), (16, 0), (14, 4)], fill=LEAFL)
    return im

# ===== CHOPPER =====
@icon('evo_heavygong')
def _():
    im, d = new()
    # Kokutei Palm: pezuña enorme con la marca del cerezo
    d.rounded_rectangle([2, 2, 17, 17], 5, fill=P['brn'])
    d.ellipse([5, 5, 14, 14], fill=P['pnkL'])
    for a in range(5):
        ang = math.radians(a * 72 - 90)
        x, y = 9.5 + math.cos(ang) * 2.5, 9.5 + math.sin(ang) * 2.5
        d.ellipse([x - 1.5, y - 1.5, x + 1.5, y + 1.5], fill=P['pnk'])
    d.line([(0, 19), (5, 15)], fill=P['wht'])
    return im

@icon('evo_kokuteicross')
def _():
    im, d = new()
    # Brain Point Scope: la lente de Chopper apuntando al punto débil
    d.ellipse([1, 1, 18, 18], fill=C('e8f6ff'), outline=P['bluD'], width=2)
    d.line([(10, 3), (10, 16)], fill=P['red']); d.line([(3, 10), (16, 10)], fill=P['red'])
    d.ellipse([7, 7, 12, 12], outline=P['red'])
    px(d, [(5, 5), (6, 4)], P['wht'])
    return im

@icon('evo_guardpoint')
def _():
    im, d = new()
    # Fluffy Fortress: bola de pelo gigante
    for (x, y, r) in ((10, 11, 8), (4, 8, 4), (16, 8, 4), (6, 16, 4), (14, 16, 4), (10, 4, 4)):
        d.ellipse([x - r, y - r, x + r, y + r], fill=P['brnL'])
    d.ellipse([5, 7, 15, 15], fill=P['brn'])
    d.rounded_rectangle([7, 0, 13, 3], 1, fill=P['pnk'])
    px(d, [(8, 10), (12, 10)], P['blk'])
    return im

@icon('evo_hornpoint')
def _():
    im, d = new()
    # Kokutei Rosa: cornamenta con flores de cerezo
    for s in (1, -1):
        x0 = 10 - s * 2
        d.line([(x0, 19), (x0 - s * 6, 4)], fill=P['brn'], width=2)
        d.line([(x0 - s * 3, 11), (x0 - s * 8, 9)], fill=P['brn'], width=2)
        d.line([(x0 - s * 5, 6), (x0 - s * 3, 1)], fill=P['brn'], width=2)
    for (x, y) in ((3, 2), (15, 2), (1, 8), (17, 8), (10, 6)):
        d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=P['pnk']); px(d, [(x, y)], P['yel'])
    return im

# ===== ROBIN =====
@icon('evo_delphinium')
def _():
    im, d = new()
    # Mil Fleur Campanula: campo de brazos en forma de campanilla
    for k in range(6):
        arm_sprout(d, k * 3 + 1, 4 + (k % 2) * 3, 15 - (k % 2) * 3)
    d.polygon([(0, 19), (19, 19), (15, 15), (4, 15)], fill=P['pur'])
    petals(d, [(2, 1), (16, 0), (9, 1)])
    return im

@icon('evo_calendula')
def _():
    im, d = new()
    # Cien Fleur Calendula: escudo de brazos en forma de flor naranja
    for a in range(8):
        ang = math.radians(a * 45)
        x, y = 10 + math.cos(ang) * 6, 10 + math.sin(ang) * 6
        d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=P['skin'])
        px(d, [(int(x), int(y))], P['skinD'])
    d.ellipse([5, 5, 15, 15], fill=P['ora']); d.ellipse([8, 8, 12, 12], fill=P['oraL'])
    return im

@icon('evo_slap')
def _():
    im, d = new()
    # Treinta Fleur Slap: lluvia de bofetadas con onda de impacto
    for (x, y) in ((1, 1), (7, 5), (1, 11)):
        d.rounded_rectangle([x, y, x + 6, y + 6], 1, fill=P['skin'])
        for k in range(3): d.line([(x + 6, y + 1 + k * 2), (x + 8, y + 1 + k * 2)], fill=P['skin'])
    for r in (3, 5): d.arc([16 - r, 12 - r, 16 + r, 12 + r], 300, 60, fill=P['yel'])
    petals(d, [(15, 2), (11, 17)])
    return im

@icon('evo_doble')
def _():
    im, d = new()
    # Cuerpo Fleur Demonio: la doble gigante y sombría de Robin
    d.ellipse([5, 0, 14, 8], fill=HAKI)
    d.polygon([(4, 8), (15, 8), (18, 19), (1, 19)], fill=ENMA)
    px(d, [(8, 4), (11, 4)], P['pnk'])
    d.polygon([(0, 6), (5, 10), (1, 12)], fill=HAKIL); d.polygon([(19, 6), (14, 10), (18, 12)], fill=HAKIL)
    petals(d, [(9, 12), (13, 15)])
    return im

# ===== FRANKY =====
@icon('evo_weaponsleft')
def _():
    im, d = new()
    # Franky Radical Beam: rayo azul desde las dos palmas
    d.rectangle([0, 3, 6, 16], fill=P['stl']); d.line([(0, 3), (6, 3)], fill=P['wht'])
    d.rectangle([6, 5, 8, 14], fill=P['stlD'])
    d.polygon([(8, 7), (19, 3), (19, 16), (8, 12)], fill=P['cya'])
    d.polygon([(8, 9), (19, 7), (19, 12), (8, 11)], fill=P['wht'])
    return im

@icon('evo_strongright')
def _():
    im, d = new()
    # Strong Hammer: puño de metal gigante con la estrella del tatuaje
    d.rounded_rectangle([3, 3, 17, 15], 3, fill=P['stl']); d.line([(4, 3), (15, 3)], fill=P['wht'])
    for k in (7, 10, 13): d.line([(k, 4), (k, 8)], fill=P['stlD'])
    star(d, 10, 12, 3, 1, 'cya', n=5)
    d.rectangle([5, 15, 15, 19], fill=P['blu'])
    for (a, b) in (((0, 0), (2, 2)), ((19, 0), (17, 2)), ((0, 10), (2, 10))): d.line([a, b], fill=P['yel'])
    return im

@icon('evo_freshfire')
def _():
    im, d = new()
    # Franky Fireball: bola de fuego que escupe por la boca
    d.ellipse([5, 3, 19, 17], fill=P['red']); d.ellipse([8, 5, 17, 14], fill=P['ora']); d.ellipse([11, 7, 16, 12], fill=P['yel'])
    d.polygon([(0, 7), (6, 6), (6, 13), (0, 12)], fill=P['stl']); d.line([(0, 7), (6, 6)], fill=P['wht'])
    return im

@icon('evo_coupdevent')
def _():
    im, d = new()
    # Gaon Cannon: cañón de la cabeza de león del Sunny
    d.ellipse([0, 3, 12, 15], fill=P['yel']); d.ellipse([2, 5, 10, 13], fill=P['yelL'])
    for (x, y) in ((1, 3), (0, 9), (2, 14), (9, 2), (11, 13)): px(d, [(x, y), (x + 1, y)], P['oraL'])
    d.ellipse([7, 7, 11, 11], fill=P['blk'])
    d.polygon([(10, 6), (19, 2), (19, 16), (10, 12)], fill=P['cyaL'])
    d.line([(10, 9), (19, 9)], fill=P['wht'], width=2)
    return im

@icon('evo_rocket')
def _():
    im, d = new()
    # General Cannon: cañón al hombro del General Franky
    d.rectangle([1, 9, 9, 18], fill=P['red']); d.rectangle([3, 11, 7, 14], fill=P['blk'])
    d.line([(4, 9), (17, 2)], fill=P['stlD'], width=4); d.line([(4, 8), (16, 2)], fill=P['stl'])
    star(d, 18, 2, 3, 1, 'yel', n=6)
    d.rectangle([2, 15, 8, 16], fill=P['cya'])
    return im

# ===== BROOK =====
@icon('evo_yahazu')
def _():
    im, d = new()
    # Arabesque Brick Fist: puñetazo de aire helado con forma de ladrillo
    for (x, y) in ((6, 2), (12, 2), (3, 7), (9, 7), (15, 7), (6, 12), (12, 12)):
        d.rectangle([x, y, x + 4, y + 3], fill=BFIREL); d.line([(x, y), (x + 4, y)], fill=P['wht'])
    d.rectangle([0, 15, 4, 19], fill=P['wht'])
    d.line([(4, 17), (8, 15)], fill=BFIRE)
    return im

@icon('evo_gavotte')
def _():
    im, d = new()
    # Aubade Coup Droit: estocada que dispara un anillo de aire
    d.line([(1, 18), (12, 7)], fill=P['stl'], width=2); d.line([(1, 18), (4, 15)], fill=P['blk'], width=3)
    for r, col in ((6, P['wht']), (4, BFIREL)):
        d.ellipse([15 - r, 4 - r + 2, 15 + r, 4 + r + 2], outline=col)
    return im

@icon('evo_fubuki')
def _():
    im, d = new()
    # Fubuki Giri: copo de nieve partido por el corte
    for a in range(0, 180, 60):
        ang = math.radians(a)
        d.line([(10 - math.cos(ang) * 8, 10 - math.sin(ang) * 8), (10 + math.cos(ang) * 8, 10 + math.sin(ang) * 8)], fill=BFIREL, width=2)
    d.ellipse([8, 8, 12, 12], fill=P['wht'])
    d.line([(0, 19), (19, 0)], fill=P['wht'])
    return im

@icon('evo_nemuriuta')
def _():
    im, d = new()
    # Nemuri Uta: nota musical con la luna y los Zzz
    d.ellipse([10, 0, 19, 9], fill=P['yel']); d.ellipse([13, -1, 21, 7], fill=(0, 0, 0, 0))
    d.line([(7, 4), (7, 15)], fill=P['pur'], width=2); d.line([(7, 4), (11, 6)], fill=P['pur'], width=2)
    d.ellipse([2, 13, 8, 18], fill=P['pur'])
    for (x, y) in ((13, 11), (16, 15)):
        d.line([(x, y), (x + 3, y)], fill=P['wht']); d.line([(x + 3, y), (x, y + 3)], fill=P['wht']); d.line([(x, y + 3), (x + 3, y + 3)], fill=P['wht'])
    return im

@icon('evo_soul')
def _():
    im, d = new()
    # Soul Parade: desfile de almas azules
    for (x, y) in ((1, 9), (7, 3), (13, 8)):
        bfire(d, x + 3, y + 10, 10, 3)
        px(d, [(x + 2, y + 5), (x + 4, y + 5)], P['blk'])
    return im

# ===== JINBE =====
@icon('evo_samegawara')
def _():
    im, d = new()
    # Gosenmaigawara Seiken: puño que atraviesa una pila de tejas
    tiles(d, 10, 5, 5)
    d.rounded_rectangle([1, 6, 10, 13], 2, fill=WATER); d.line([(2, 6), (8, 6)], fill=WATERL)
    for k in (4, 6, 8): d.line([(k, 7), (k, 10)], fill=WATERD)
    for (a, b) in (((12, 2), (14, 0)), ((17, 2), (19, 0)), ((12, 19), (14, 17))): d.line([a, b], fill=P['yel'])
    return im

@icon('evo_buraikan')
def _():
    im, d = new()
    # Buraikan: estallido de agua en anillo
    d.ellipse([1, 1, 18, 18], outline=WATERD, width=2)
    d.ellipse([4, 4, 15, 15], outline=WATER, width=2)
    for a in range(8):
        ang = math.radians(a * 45)
        px(d, [(round(10 + math.cos(ang) * 9.5), round(10 + math.sin(ang) * 9.5))], WATERL)
    d.ellipse([8, 8, 12, 12], fill=WATERL)
    return im

@icon('evo_yarinami')
def _():
    im, d = new()
    # Senmaigawara Seiken: puño azul contra mil tejas
    tiles(d, 10, 8, 3)
    d.rounded_rectangle([1, 8, 10, 15], 2, fill=WATER)
    for k in (4, 6, 8): d.line([(k, 9), (k, 12)], fill=WATERD)
    d.polygon([(0, 2), (10, 0), (19, 2), (10, 5)], fill=WATERL)
    return im

@icon('evo_uchimizu')
def _():
    im, d = new()
    # Uchimizu: lluvia de balas de agua
    for (x, y) in ((2, 1), (9, 3), (15, 0), (4, 10), (12, 11), (17, 8), (8, 16)):
        d.line([(x - 2, y - 2), (x, y)], fill=WATERL)
        d.ellipse([x, y, x + 3, y + 3], fill=WATER); px(d, [(x + 1, y + 1)], P['wht'])
    return im

@icon('evo_mizugokoro')
def _():
    im, d = new()
    # Kairyu Ippon Zeoi: dragón de agua en espiral
    d.arc([1, 3, 17, 19], 90, 400, fill=WATERD, width=3)
    d.arc([4, 6, 14, 16], 90, 380, fill=WATER, width=2)
    d.ellipse([12, 0, 19, 6], fill=WATER); px(d, [(15, 2)], P['wht']); d.line([(18, 4), (19, 6)], fill=WATERL)
    return im
