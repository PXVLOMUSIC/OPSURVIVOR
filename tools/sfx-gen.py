"""Genera los efectos de sonido sintetizados de OPSURVIVOR (estilo 8/16 bits, a juego con el pack CC0 de Juhani Junkala).
Uso: python3 tools/sfx-gen.py  ->  escribe assets/sfx/<nombre>.wav (22.05 kHz, 16 bits, mono).
Cada sonido se describe al lado de su función: qué acción lo usa y por qué suena así."""
import numpy as np, wave, os

SR = 22050
rng = np.random.default_rng(7)
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sfx')

def t_(d): return np.arange(int(SR * d)) / SR
def phase(freq):  # freq puede ser array (barrido)
    return np.cumsum(np.broadcast_to(freq, freq.shape if hasattr(freq, 'shape') else (1,)) / SR) * 2 * np.pi
def square(freq, duty=0.5):
    ph = (phase(freq) / (2 * np.pi)) % 1.0
    return np.where(ph < duty, 1.0, -1.0)
def tri(freq):
    ph = (phase(freq) / (2 * np.pi)) % 1.0
    return 4 * np.abs(ph - 0.5) - 1
def sine(freq): return np.sin(phase(freq))
def noise(d): return rng.uniform(-1, 1, int(SR * d))
def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * np.broadcast_to(cutoff, x.shape) / SR); y = np.zeros_like(x); p = 0.0
    for i in range(len(x)): p = (1 - a[i]) * x[i] + a[i] * p; y[i] = p
    return y
def bandpass(x, f, q=4.0):
    f = np.broadcast_to(f, x.shape); y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for i in range(len(x)):
        w = 2 * np.pi * f[i] / SR; al = np.sin(w) / (2 * q); c = np.cos(w); a0 = 1 + al
        b0, b2, a1, a2 = al / a0, -al / a0, -2 * c / a0, (1 - al) / a0
        yi = b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, x[i], y1, yi; y[i] = yi
    return y
def env(n, a=0.005, d=None, curve=4.0):
    t = np.arange(n) / SR; tot = n / SR; d = tot if d is None else d
    e = np.minimum(1, t / max(a, 1e-4)); return e * np.exp(-curve * np.maximum(0, t - a) / max(d, 1e-4))
def adsr(n, a, r):
    t = np.arange(n) / SR; tot = n / SR
    return np.minimum(1, t / a) * np.clip((tot - t) / r, 0, 1)
def mix(total, *parts):
    out = np.zeros(int(SR * total))
    for start, sig in parts:
        s = int(SR * start); e = min(len(out), s + len(sig)); out[s:e] += sig[:e - s]
    return out
def save(name, x, peak=0.5):
    x = x / (np.abs(x).max() + 1e-9) * peak
    fade = min(len(x), int(SR * 0.004)); x[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())
def note(f, d, kind=square, duty=0.5, a=0.004, r=0.03):
    n = int(SR * d); fr = np.full(n, float(f))
    s = kind(fr, duty) if kind is square else kind(fr)
    return s * adsr(n, a, r)

# Subir de nivel (antes: carne del suelo; Pablo los intercambió): mordisco + arpegio ascendente
def heal():
    bite = lowpass(noise(0.035), 1800) * env(int(SR * 0.035), 0.002, 0.012)
    arp = [note(f, 0.055, tri, r=0.02) * 0.9 + note(f * 2, 0.055, square, 0.25, r=0.02) * 0.12 for f in (523, 659, 784, 1047)]
    tail = note(1047, 0.16, tri) * env(int(SR * 0.16), 0.002, 0.06) * 0.8
    return mix(0.46, (0, bite), (0.055, bite * 0.8), (0.12, arp[0]), (0.17, arp[1]), (0.22, arp[2]), (0.27, arp[3]), (0.30, tail))

# Golpe recibido por el jugador: grave y descendente, distinto del impacto sobre enemigos
def hurt():
    n = int(SR * 0.17); f = 300 * np.exp(-np.arange(n) / SR * 9) + 70
    tone = square(f, 0.25) * env(n, 0.002, 0.07)
    crunch = lowpass(noise(0.05), 2500) * env(int(SR * 0.05), 0.001, 0.015)
    return mix(0.17, (0, tone * 0.8), (0, crunch * 0.7))

# Fin de partida: "wah-wah" descendente (entra tras el sonido de muerte)
def sad():
    seq = [(392, 0.17), (370, 0.17), (349, 0.17)]
    parts = []; t = 1.0  # entra cuando acaba el KO (ko.wav)
    for f, d in seq: parts.append((t, note(f, d, square, 0.5, r=0.04) * 0.6 + note(f / 2, d, tri, r=0.04) * 0.5)); t += d + 0.02
    n = int(SR * 0.75); fr = 330 + 7 * np.sin(2 * np.pi * 6 * np.arange(n) / SR)
    parts.append((t, (square(fr, 0.5) * 0.6 + tri(fr / 2) * 0.5) * adsr(n, 0.01, 0.4)))
    return mix(t + 0.76, *parts)

# Muerte del jugador (KO): golpe seco, eco grave y caída descendente "fiuuu" hasta el suelo
def ko():
    n = int(SR * 0.12); thump = sine(150 * np.exp(-np.arange(n) / SR * 18) + 40) * env(n, 0.001, 0.05)
    hitn = lowpass(noise(0.06), 3000) * env(int(SR * 0.06), 0.0005, 0.015)
    n2 = int(SR * 0.75); tt = np.arange(n2) / SR
    f = (700 * np.exp(-tt * 3.2) + 60) * (1 + 0.04 * np.sin(2 * np.pi * 9 * tt))
    fall = (square(f, 0.25) * 0.5 + tri(f) * 0.5) * adsr(n2, 0.01, 0.25)
    n3 = int(SR * 0.2); land = lowpass(noise(0.2), 500) * env(n3, 0.002, 0.07) * 2.5
    return mix(1.0, (0, thump * 1.2), (0, hitn), (0.08, fall * 0.7), (0.8, land))

# Revivir (Voluntad de D): barrido ascendente + destello
def revive():
    n = int(SR * 0.32); f = 180 * np.exp(np.arange(n) / SR * 6)
    sweep = square(f, 0.25) * adsr(n, 0.01, 0.08) * 0.6
    arp = [note(f, 0.07, tri, r=0.04) for f in (784, 988, 1175, 1568)]
    return mix(0.62, (0, sweep), (0.30, arp[0]), (0.36, arp[1]), (0.42, arp[2]), (0.48, arp[3] * 1.1))

# Oleada / emboscada: cuerno de caracola (aviso de la Marina / piratas al abordaje)
def warn():
    n = int(SR * 0.6); tt = np.arange(n) / SR
    f = 147 * (1 + 0.04 * np.minimum(1, tt / 0.08)) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * tt))
    body = (square(f, 0.3) * 0.6 + square(f * 1.5, 0.5) * 0.25 + tri(f * 2) * 0.3)
    body = lowpass(body, 1400) * adsr(n, 0.05, 0.25)
    return body

# Imán: zumbido ascendente con trémolo (todas las gemas vuelan hacia ti)
def magnet():
    n = int(SR * 0.5); tt = np.arange(n) / SR; f = 260 * np.exp(tt * 4.2)
    return (tri(f) * 0.8 + square(f, 0.125) * 0.2) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * tt)) * adsr(n, 0.02, 0.12)

# Campana de oro de Shandora (Skypiea): congela a los enemigos
def bell():
    n = int(SR * 1.3); tt = np.arange(n) / SR; f0 = 523
    s = sum(a * np.sin(2 * np.pi * f0 * k * tt) * np.exp(-tt * dk) for k, a, dk in ((1, 1, 2.2), (2.0, 0.5, 3.5), (2.76, 0.4, 4.5), (5.4, 0.25, 7), (0.5, 0.35, 1.8)))
    strike = lowpass(noise(0.02), 4000) * env(int(SR * 0.02), 0.001, 0.006) * 0.6
    return mix(1.3, (0, s * np.minimum(1, tt / 0.003)), (0, strike))

# Gomu Gomu no Pistol: estirón de goma ("boing") + latigazo de aire
def stretch():
    n1 = int(SR * 0.07); f1 = np.linspace(140, 520, n1)
    n2 = int(SR * 0.17); tt = np.arange(n2) / SR; f2 = 300 + 140 * np.sin(2 * np.pi * 22 * tt) * np.exp(-tt * 14)
    s1 = tri(f1) * 0.9 + square(f1, 0.25) * 0.15
    s2 = (tri(f2) * 0.9 + square(f2, 0.25) * 0.12) * env(n2, 0.002, 0.07)
    air = bandpass(noise(0.08), np.linspace(900, 3500, int(SR * 0.08)), 1.5) * env(int(SR * 0.08), 0.01, 0.04)
    return mix(0.24, (0, s1 * adsr(n1, 0.003, 0.01)), (0.07, s2), (0, air * 0.8))

# Gomu Gomu no Muchi: barrido de aire y chasquido final
def whip():
    n = int(SR * 0.11); swish = bandpass(noise(0.11), np.linspace(700, 4000, n), 2.0) * np.linspace(0.2, 1, n)
    crack = noise(0.018) * env(int(SR * 0.018), 0.0005, 0.005)
    return mix(0.16, (0, swish * 0.7), (0.105, crack))

# 108 Pound Ho / Gust Sword: ráfaga de viento cortante
def wind():
    n = int(SR * 0.38); f = 2600 * np.exp(-np.arange(n) / SR * 3.5) + 350
    return bandpass(noise(0.38), f, 2.2) * adsr(n, 0.02, 0.2)

# Rayos de Nami (Clima-Tact, Thunder Breed, Zeus): chasquido eléctrico + retumbo
def thunder():
    crack = noise(0.05) * env(int(SR * 0.05), 0.0005, 0.012)
    zap = square(np.full(int(SR * 0.06), 1.0) * 0 + 90 * (1 + rng.uniform(-0.3, 0.3, int(SR * 0.06))), 0.5) * env(int(SR * 0.06), 0.001, 0.03) * 0.4
    n = int(SR * 0.55); rumble = lowpass(noise(0.55), np.linspace(700, 180, n)) * env(n, 0.01, 0.2) * 3.2
    return mix(0.6, (0, crack), (0.03, zap), (0.045, crack * 0.6), (0.02, rumble))

# Rain Tempo: gotas sobre un siseo suave
def rain():
    parts = [(0, lowpass(noise(0.42), 3000) * adsr(int(SR * 0.42), 0.05, 0.15) * 0.25)]
    for k in range(9):
        n = int(SR * 0.025); f = rng.uniform(1300, 2600) * np.exp(-np.arange(n) / SR * 40)
        parts.append((rng.uniform(0, 0.36), sine(f) * env(n, 0.001, 0.008) * rng.uniform(0.5, 1)))
    return mix(0.42, *parts)

# Honda de Usopp (Kabuto, Namari/Tabasco Boshi) y ballesta: cuerda elástica que suelta
def twang():
    snap = noise(0.012) * env(int(SR * 0.012), 0.0005, 0.004)
    n = int(SR * 0.16); f = 230 * np.exp(-np.arange(n) / SR * 3) * (1 + 0.03 * np.sin(2 * np.pi * 30 * np.arange(n) / SR))
    pluck = (square(f, 0.2) * 0.5 + tri(f) * 0.6) * env(n, 0.001, 0.05)
    return mix(0.17, (0, snap), (0.004, pluck))

# Cuchillo y shuriken arrojados: silbido corto con brillo metálico
def throw():
    n = int(SR * 0.09); sw = bandpass(noise(0.09), np.linspace(1500, 5000, n), 2.5) * adsr(n, 0.02, 0.04)
    shing = sine(np.full(int(SR * 0.07), 3300.0)) * env(int(SR * 0.07), 0.001, 0.02) * 0.25
    return mix(0.1, (0, sw), (0.02, shing))

# Seis Fleur: Clutch — chasquido de espalda (crujido seco + golpe sordo)
def crack():
    click = lambda: lowpass(noise(0.012), 3500) * env(int(SR * 0.012), 0.0005, 0.003)
    n = int(SR * 0.09); thump = sine(110 * np.exp(-np.arange(n) / SR * 12) + 45) * env(n, 0.001, 0.03)
    return mix(0.13, (0, click()), (0.025, click() * 0.8), (0.05, click() * 1.1), (0.04, thump * 0.9))

# Gear Fifth: Tambores de la Liberación ("don-don... don-don")
def drums():
    def kick(g=1.0):
        n = int(SR * 0.22); f = 55 + 110 * np.exp(-np.arange(n) / SR * 22)
        return (sine(f) + 0.25 * tri(f * 2)) * env(n, 0.001, 0.09) * g + lowpass(noise(0.22), 900) * env(n, 0.001, 0.02) * 0.4 * g
    return mix(1.05, (0, kick()), (0.17, kick(0.85)), (0.52, kick()), (0.69, kick(0.85)))

for fn in (heal, hurt, sad, revive, warn, magnet, bell, stretch, whip, wind, thunder, rain, twang, throw, crack, drums, ko):
    name = {'hurt': 'ouch'}.get(fn.__name__, fn.__name__)
    save(name, fn())
    print('ok', name)
