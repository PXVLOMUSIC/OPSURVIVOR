// === Polygons per island ===
// Alabasta / Skypiea: closed battle arena (only inside the wall, following the reference image)
const ARENA_POLY = [
  [960, 0],
  [679, -283],
  [0, -400],
  [-679, -283],
  [-960, 0],
  [-679, 283],
  [0, 400],
  [679, 283],
];
const WALK_POLYS = {
  baratie: WALK_POLY,
  alabasta: ARENA_POLY,
  skypiea: ARENA_POLY
};
function walkPoly() {
  return WALK_POLYS[selectedMap] || WALK_POLY;
}
// Pushes a point inward until it lands inside the arena (enemy/boss spawns)
function clampToArena(x, y) {
  const poly = walkPoly();
  if (pointInPoly(x, y, poly)) return [x, y];
  let px = x, py = y;
  for (let i = 0; i < 24 && !pointInPoly(px, py, poly); i++) { px *= 0.9; py *= 0.9; }
  return [px, py];
}
function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1];
        const xj = poly[j][0], yj = poly[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Glows pre-renderizados (rendimiento: shadowBlur por objeto es costoso)
const GLOW_CACHE = {};
function hexToRgba(hex, a) {
    const n = parseInt(hex.replace('#', ''), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function getGlow(color, size = 28) {
    const key = color + '_' + size;
    if (!GLOW_CACHE[key]) {
        const c = document.createElement('canvas');
        c.width = c.height = size * 2;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(size, size, 1, size, size, size);
        grad.addColorStop(0, hexToRgba(color, 0.9));
        grad.addColorStop(0.5, hexToRgba(color, 0.35));
        grad.addColorStop(1, hexToRgba(color, 0));
        g.fillStyle = grad;
        g.beginPath(); g.arc(size, size, size, 0, Math.PI * 2); g.fill();
        GLOW_CACHE[key] = c;
    }
    return GLOW_CACHE[key];
}

// Fondos temáticos pre-renderizados (se generan una vez al cargar)
function buildThemedBg(drawFn) {
    const w = (MAP_BOUNDS.maxX - MAP_BOUNDS.minX) + 800;
    const h = (MAP_BOUNDS.maxY - MAP_BOUNDS.minY) + 800;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    drawFn(c.getContext('2d'), w, h);
    return c;
}
// === Fondos pre-renderizados: arenas de batalla cerradas ===
// Desfase mundo→canvas (el canvas empieza en MAP_BOUNDS.min-400)
function bgOffset() { return [-(MAP_BOUNDS.minX - 400), -(MAP_BOUNDS.minY - 400)]; }
function octPts(ax, ay) {
    const k = Math.SQRT1_2;
    return [[ax, 0], [ax * k, -ay * k], [0, -ay], [-ax * k, -ay * k], [-ax, 0], [-ax * k, ay * k], [0, ay], [ax * k, ay * k]];
}
function traceOct(g, ax, ay, OX, OY) {
    g.beginPath();
    octPts(ax, ay).forEach((p, i) => (i ? g.lineTo : g.moveTo).call(g, p[0] + OX, p[1] + OY));
    g.closePath();
}
function arenaRing(g, ax1, ay1, ax2, ay2, OX, OY) {
    g.beginPath();
    octPts(ax1, ay1).forEach((p, i) => (i ? g.lineTo : g.moveTo).call(g, p[0] + OX, p[1] + OY));
    octPts(ax2, ay2).forEach((p, i) => (i ? g.lineTo : g.moveTo).call(g, p[0] + OX, p[1] + OY));
    g.closePath();
}
// Arena compartida: suelo interior + anillos de la explanada + muro con almenas y torres
function drawArenaBase(g, OX, OY, c) {
    traceOct(g, 960, 400, OX, OY);
    g.fillStyle = c.floor; g.fill();
    g.save(); g.clip();
    g.strokeStyle = c.tile; g.lineWidth = 3;
    for (let wy = -400; wy <= 400; wy += 60) { g.beginPath(); g.moveTo(-1000 + OX, wy + OY); g.lineTo(1000 + OX, wy + OY); g.stroke(); }
    for (let wx = -960; wx <= 960; wx += 60) { g.beginPath(); g.moveTo(wx + OX, -420 + OY); g.lineTo(wx + OX, 420 + OY); g.stroke(); }
    [[560, 232, 40], [292, 121, 30]].forEach(([ax, ay, lw]) => { // octágono central de losas (pistaCircular)
        traceOct(g, ax, ay, OX, OY);
        g.lineWidth = lw; g.strokeStyle = c.ring; g.stroke();
    });
    g.restore();
    // anillo del muro exterior (1100 → 960)
    arenaRing(g, 1100, 470, 960, 400, OX, OY);
    g.fillStyle = c.wall; g.fill('evenodd');
    g.strokeStyle = c.wallEdge; g.lineWidth = 8;
    traceOct(g, 1100, 470, OX, OY); g.stroke();
    traceOct(g, 960, 400, OX, OY); g.stroke();
    // almenas
    traceOct(g, 1100, 470, OX, OY);
    g.setLineDash([54, 34]); g.lineWidth = 40; g.strokeStyle = c.crenel; g.stroke();
    g.setLineDash([]);
    // torres en las esquinas (sin N/S: palacio y entrada)
    octPts(1100, 470).forEach(p => {
        if (Math.abs(p[0]) < 50) return;
        const tx = p[0] + OX, ty = p[1] + OY;
        g.fillStyle = c.wall; g.beginPath(); g.arc(tx, ty, 46, 0, Math.PI * 2); g.fill();
        g.strokeStyle = c.wallEdge; g.lineWidth = 5; g.stroke();
        g.fillStyle = c.dome; g.beginPath(); g.arc(tx, ty - 32, 25, Math.PI, 0); g.closePath(); g.fill();
    });
    // gran escalinata de entrada (sur)
    for (let s = 0; s < 3; s++) {
        const ww = 430 - s * 60;
        g.fillStyle = s % 2 ? c.steps : c.wall;
        g.fillRect(OX - ww / 2, OY + 402 + s * 24, ww, 24);
    }
}
function drawSkullFlag(g, x, y) {
    g.strokeStyle = '#3c2a12'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 72); g.stroke();
    g.fillStyle = '#181818'; g.fillRect(x, y - 72, 58, 38);
    g.fillStyle = '#f5f0e6';
    g.beginPath(); g.arc(x + 21, y - 54, 5.5, 0, Math.PI * 2); g.arc(x + 36, y - 54, 5.5, 0, Math.PI * 2); g.fill();
}
function drawAlabastaBg(g, w, h) {
    const [OX, OY] = bgOffset();
    const horizon = OY - 470;
    // cielo del desierto
    const sky = g.createLinearGradient(0, 0, 0, horizon + 30);
    sky.addColorStop(0, '#4fb2ee'); sky.addColorStop(1, '#bfe8fb');
    g.fillStyle = sky; g.fillRect(0, 0, w, horizon + 30);
    // sol
    const sun = g.createRadialGradient(w * 0.14, 60, 12, w * 0.14, 60, 210);
    sun.addColorStop(0, '#fffbe0'); sun.addColorStop(0.3, 'rgba(255,240,170,0.55)'); sun.addColorStop(1, 'rgba(255,240,170,0)');
    g.fillStyle = sun; g.beginPath(); g.arc(w * 0.14, 60, 210, 0, Math.PI * 2); g.fill();
    // nubes
    for (let i = 0; i < 6; i++) {
        const cx = Math.random() * w, cy = 40 + Math.random() * (horizon - 120), s = 0.7 + Math.random() * 0.9;
        g.fillStyle = 'rgba(255,255,255,0.85)';
        for (let b = 0; b < 4; b++) { g.beginPath(); g.arc(cx + (b - 1.5) * 44 * s, cy + (b % 2) * 10, 30 * s, 0, Math.PI * 2); g.fill(); }
    }
    // desierto
    const sand = g.createLinearGradient(0, horizon, 0, h);
    sand.addColorStop(0, '#eccb8e'); sand.addColorStop(0.5, '#dfb478'); sand.addColorStop(1, '#c99050');
    g.fillStyle = sand; g.fillRect(0, horizon, w, h - horizon);
    // dunas
    for (let i = 0; i < 22; i++) {
        const dx = Math.random() * w, dy = horizon + Math.random() * (h - horizon), rw = 180 + Math.random() * 340, rh = 22 + Math.random() * 40;
        g.fillStyle = i % 2 ? 'rgba(196,140,74,0.4)' : 'rgba(240,205,150,0.5)';
        g.beginPath(); g.ellipse(dx, dy, rw, rh, Math.random() * 0.3 - 0.15, 0, Math.PI * 2); g.fill();
    }
    // oasis a izquierda y derecha
    [[OX - 1280, OY + 220], [OX + 1280, OY + 190]].forEach(([lx, ly]) => {
        g.fillStyle = '#79cfe8';
        g.beginPath(); g.ellipse(lx, ly, 120, 34, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#e6d3a0'; g.lineWidth = 5; g.stroke();
        for (let p = 0; p < 4; p++) {
            const px = lx - 90 + p * 62, py = ly - 40;
            g.fillStyle = '#7a5535'; g.fillRect(px - 4, py, 8, 44);
            g.fillStyle = 'rgba(88,116,58,0.9)';
            for (let a = 0; a < 5; a++) {
                const ang = (a / 5) * Math.PI * 2;
                g.beginPath(); g.ellipse(px + Math.cos(ang) * 22, py - 6 + Math.sin(ang) * 9, 20, 6, ang, 0, Math.PI * 2); g.fill();
            }
        }
    });
    // partidas de roca
    for (let i = 0; i < 8; i++) {
        const rx = Math.random() * w, ry = horizon + 40 + Math.random() * (h - horizon - 80), r = 22 + Math.random() * 34;
        g.fillStyle = '#8d6e4a';
        g.beginPath(); g.ellipse(rx, ry, r, r * 0.6, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#7a5a38';
        g.beginPath(); g.ellipse(rx - r * 0.2, ry - r * 0.25, r * 0.4, r * 0.25, 0, 0, Math.PI * 2); g.fill();
    }
    // puestos de mercado (esquinas inferiores)
    [[OX + 1340, OY + 640, '#d9534f'], [OX - 1350, OY + 700, '#5cb85c']].forEach(([sx, sy, col]) => {
        g.fillStyle = '#a37c50'; g.fillRect(sx - 46, sy, 92, 58);
        g.fillStyle = col;
        g.beginPath(); g.moveTo(sx - 58, sy); g.quadraticCurveTo(sx, sy - 44, sx + 58, sy); g.closePath(); g.fill();
    });
    // arena amurallada + palacio
    drawArenaBase(g, OX, OY, { floor: '#e8d3a4', tile: 'rgba(164,124,70,0.45)', ring: '#cbaf7e', wall: '#dcb277', wallEdge: '#a4753d', crenel: '#cf9d5c', dome: '#b07f43', steps: '#d3b080' });
    drawAlabastaPalace(g, OX, OY);
}
function drawAlabastaPalace(g, OX, OY) {
    const X = OX, top = OY - 660, bot = OY - 455;
    // prismas laterales
    [-258, 258].forEach(off => {
        g.fillStyle = '#e6c795'; g.fillRect(X + off - 30, top + 40, 60, bot - top - 40);
        g.strokeStyle = '#a97c4b'; g.lineWidth = 4; g.strokeRect(X + off - 30, top + 40, 60, bot - top - 40);
        g.fillStyle = '#d9a24a';
        g.beginPath(); g.arc(X + off, top + 40, 30, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    });
    // prisma central
    g.fillStyle = '#e9cda0'; g.fillRect(X - 200, top, 400, bot - top);
    g.strokeStyle = '#a97c4b'; g.lineWidth = 5; g.strokeRect(X - 200, top, 400, bot - top);
    // puerta con arco
    g.fillStyle = '#8a5f33';
    g.beginPath(); g.moveTo(X - 44, bot); g.lineTo(X - 44, bot - 110);
    g.arc(X, bot - 110, 44, Math.PI, 0); g.lineTo(X + 44, bot); g.closePath(); g.fill();
    // ventanas
    g.fillStyle = '#8a5f33';
    for (let i = -2; i <= 2; i++) { if (!i) continue; g.fillRect(X + i * 78 - 9, top + 80, 18, 36); }
    // gran cúpula
    g.fillStyle = '#d9a24a';
    g.beginPath(); g.arc(X, top, 150, Math.PI, 0); g.closePath(); g.fill();
    g.strokeStyle = '#a97c4b'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#c98f38';
    g.beginPath(); g.moveTo(X - 14, top - 150); g.lineTo(X, top - 196); g.lineTo(X + 14, top - 150); g.closePath(); g.fill();
    drawSkullFlag(g, X, top - 196);
}
function drawSkypieaBg(g, w, h) {
    const [OX, OY] = bgOffset();
    // cielo celeste
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#79c4f4'); sky.addColorStop(0.55, '#a8dbf4'); sky.addColorStop(1, '#d6f0f6');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    // sol
    const sun = g.createRadialGradient(w * 0.5, 70, 14, w * 0.5, 70, 200);
    sun.addColorStop(0, '#fffbe0'); sun.addColorStop(0.3, 'rgba(255,240,170,0.5)'); sun.addColorStop(1, 'rgba(255,240,170,0)');
    g.fillStyle = sun; g.beginPath(); g.arc(w * 0.5, 70, 200, 0, Math.PI * 2); g.fill();
    // arcoíris dobles junto al palacio
    const rb = ['rgba(255,130,130,0.20)', 'rgba(255,200,120,0.20)', 'rgba(250,240,140,0.20)', 'rgba(150,225,150,0.20)', 'rgba(150,185,250,0.20)'];
    rb.forEach((col, i) => {
        g.strokeStyle = col; g.lineWidth = 16;
        g.beginPath(); g.arc(OX - 1050, OY - 330, 480 - i * 16, -Math.PI * 0.62, -Math.PI * 0.06); g.stroke();
        g.beginPath(); g.arc(OX + 1050, OY - 330, 480 - i * 16, -Math.PI * 0.94, -Math.PI * 0.38); g.stroke();
    });
    // mar de nubes (fondo)
    for (let i = 0; i < 26; i++) {
        const x = Math.random() * w, y = OY + 200 + Math.random() * (h - OY - 200), s = 1.4 + Math.random() * 2.2;
        g.fillStyle = `rgba(255,255,255,${0.5 + Math.random() * 0.35})`;
        for (let b = 0; b < 5; b++) {
            g.beginPath(); g.arc(x + (b - 2) * 60 * s, y + Math.abs(2 - b) * -20 * s, 50 * s, 0, Math.PI * 2); g.fill();
        }
    }
    // nubes flotantes medias
    for (let i = 0; i < 12; i++) {
        const x = Math.random() * w, y = 80 + Math.random() * (h - 200), s = 0.8 + Math.random() * 1.4;
        g.fillStyle = `rgba(255,255,255,${0.5 + Math.random() * 0.3})`;
        for (let b = 0; b < 4; b++) {
            g.beginPath(); g.arc(x + (b - 1.5) * 48 * s, y + (b % 2) * 14, 34 * s, 0, Math.PI * 2); g.fill();
        }
    }
    // ruinas flotantes con columnas (izquierda y derecha)
    [[340, 420], [OX * 2 - 340, 330], [OX * 2 - 210, OY + 480]].forEach(([rx, ry], idx) => {
        const flip = idx === 0 ? -1 : 1;
        g.fillStyle = '#f2f8f6';
        g.strokeStyle = '#b7cfcd'; g.lineWidth = 6;
        g.beginPath(); g.roundRect(rx - 95, ry, 190, 26, 8); g.fill(); g.stroke();
        for (let c = 0; c < 3; c++) {
            const px = rx - 55 + c * 55;
            g.beginPath(); g.roundRect(px - 9, ry - 62, 18, 62, 4); g.fill(); g.stroke();
        }
        g.fillStyle = 'rgba(127,174,106,0.75)';
        g.beginPath(); g.ellipse(rx, ry + 20, 66, 12, 0, 0, Math.PI * 2); g.fill();
        void flip;
    });
    // cascada inferior izquierda
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.beginPath(); g.moveTo(60, h - 40); g.lineTo(240, h - 40); g.quadraticCurveTo(215, h - 260, 170, h - 300);
    g.quadraticCurveTo(95, h - 270, 60, h - 40); g.closePath(); g.fill();
    g.fillStyle = 'rgba(120,190,225,0.7)';
    for (let i = 0; i < 5; i++) {
        g.fillRect(95 + i * 28, h - 250 + (i % 2) * 30, 8, 210);
    }
    // arena amurallada + palacio alado
    drawArenaBase(g, OX, OY, { floor: '#eef5f3', tile: 'rgba(185,212,214,0.55)', ring: '#d8e8e6', wall: '#e6f1ef', wallEdge: '#a3c2c1', crenel: '#d6e4e2', dome: '#c4dadb', steps: '#e6efee' });
    drawSkypieaPalace(g, OX, OY);
    // niebla de nubes delante del muro inferior
    for (let i = 0; i < 4; i++) {
        const x = OX - 900 + i * 640;
        g.fillStyle = 'rgba(255,255,255,0.55)';
        g.beginPath(); g.ellipse(x, OY + 510, 260, 60, 0, 0, Math.PI * 2); g.fill();
    }
}
function drawSkypieaPalace(g, OX, OY) {
    const X = OX, top = OY - 640, bot = OY - 455;
    // alas angélicas a los lados
    [-320, 320].forEach(side => {
        const sx = X + side;
        g.fillStyle = 'rgba(235,245,243,0.96)';
        g.strokeStyle = '#9db8b4'; g.lineWidth = 4;
        g.beginPath();
        g.moveTo(sx - side / 4, OY - 520);
        g.quadraticCurveTo(sx - side / 3, OY - 690, sx - side, OY - 730);
        g.quadraticCurveTo(sx - side / 2.6, OY - 640, sx - side / 4, OY - 520);
        g.closePath(); g.fill(); g.stroke();
        // plumas
        g.strokeStyle = '#aeccc7'; g.lineWidth = 3;
        for (let f = 1; f <= 3; f++) {
            g.beginPath();
            g.moveTo(sx - side * (f / 6), OY - 555);
            g.quadraticCurveTo(sx - side * (f / 4), OY - 660 - f * 14, sx - side * (f / 2.4), OY - 700 - f * 8);
            g.stroke();
        }
    });
    // prisma central
    g.fillStyle = '#f2f8f6'; g.fillRect(X - 210, top, 420, bot - top);
    g.strokeStyle = '#a9c6c2'; g.lineWidth = 5; g.strokeRect(X - 210, top, 420, bot - top);
    // puerta con arco
    g.fillStyle = '#597d8e';
    g.beginPath(); g.moveTo(X - 46, bot); g.lineTo(X - 46, bot - 112);
    g.arc(X, bot - 112, 46, Math.PI, 0); g.lineTo(X + 46, bot); g.closePath(); g.fill();
    g.fillStyle = '#dcecf5';
    g.fillRect(X - 8, bot - 230, 16, 60);
    // ventanas
    g.fillStyle = '#7d9aa8';
    for (let i = -2; i <= 2; i++) { if (!i) continue; g.fillRect(X + i * 82 - 9, top + 78, 18, 36); }
    // cúpula con espiral
    g.fillStyle = '#dfeeee';
    g.beginPath(); g.arc(X, top, 140, Math.PI, 0); g.closePath(); g.fill();
    g.strokeStyle = '#a9c6c2'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#c6dcda';
    g.beginPath(); g.moveTo(X - 13, top - 140); g.lineTo(X, top - 208); g.lineTo(X + 13, top - 140); g.closePath(); g.fill();
    drawSkullFlag(g, X, top - 208);
    // enredaderas
    g.fillStyle = 'rgba(127,174,106,0.85)';
    for (let i = 0; i < 9; i++) {
        const vx = X - 210 + (i * 470) / 8 + Math.random() * 18;
        g.beginPath(); g.ellipse(vx, top + 150 + Math.random() * 60, 20, 12 + Math.random() * 10, Math.random(), 0, Math.PI * 2); g.fill();
    }
}
let bgAlabasta = null, bgSkypiea = null;
function initThemedMaps() {
    bgAlabasta = buildThemedBg(drawAlabastaBg);
    bgSkypiea = buildThemedBg(drawSkypieaBg);
}
initThemedMaps();

const player = {
    x: 0, y: 0,
    speed: 185,
    hp: 100, maxHp: 100,
    level: 1, xp: 0, nextXp: 5,
    facing: 1, animFrame: 0, animTimer: 0, walkFrame: 0, isMoving: false,
    animState: 'idle', attackTimer: 0, hitTimer: 0, animIndex: 0,
    powerPct: 0, critChance: 0.05, cdReduction: 0, areaBonus: 1.0, armor: 0, pickupBonus: 1, growthBonus: 1, greedBonus: 1, luckBonus: 1, curse: 1,
    passives: {}
};

const skills = {
    pistol: { level: 1, baseDamage: 20, cooldown: 1.2, timer: 0, range: 250, evolved: false, evolvedName: 'Red Hawk' },
    gatling: { level: 0, baseDamage: 10, cooldown: 3.8, timer: 0, radius: 85, duration: 1.5, evolved: false, evolvedName: 'Jet Gatling' },
    bazooka: { level: 0, baseDamage: 45, cooldown: 5.5, timer: 0, radius: 65, evolved: false },
    gear2: { level: 0, cooldown: 12.0, timer: 0, duration: 6.0, speedBonus: 0.3, active: false, remain: 0, evolved: false },
    // Luffy: latigazo frontal (abanico) y patada hacha alla gear 3
    muchi: { level: 0, baseDamage: 35, cooldown: 2.0, timer: 0, radius: 150, evolved: false, evolvedName: 'Black Whip' },
    ono: { level: 0, baseDamage: 70, cooldown: 5.0, timer: 0, radius: 65, evolved: false },
    santoryu: { level: 1, baseDamage: 34, cooldown: 1.5, timer: 0, radius: 60, evolved: false },
    onigiri: { level: 0, baseDamage: 60, cooldown: 4.5, timer: 0, dash: 160, evolved: false },
    flyingslash: { level: 0, baseDamage: 20, cooldown: 2.2, timer: 0, range: 300, speed: 600, evolved: false },
    // Zoro: tornado orbitante y cañón de viento perforante
    tatsumaki: { level: 0, baseDamage: 10, cooldown: 3.6, timer: 0, radius: 95, duration: 1.0, evolved: false },
    poundho: { level: 0, baseDamage: 30, cooldown: 3.2, timer: 0, range: 420, speed: 700, evolved: false },
    diablejambe: { level: 1, baseDamage: 16, cooldown: 1.0, timer: 0, radius: 50, fire: true, evolved: false },
    collier: { level: 0, baseDamage: 10, cooldown: 0.6, timer: 0, range: 70, evolved: false },
    joueshot: { level: 0, baseDamage: 26, cooldown: 2.8, timer: 0, range: 240, speed: 560, evolved: false },
    // Sanji: patada aérea demoledora y tanda giratoria 360
    concasse: { level: 0, baseDamage: 75, cooldown: 4.2, timer: 0, radius: 72, evolved: false },
    partycourse: { level: 0, baseDamage: 9, cooldown: 4.2, timer: 0, radius: 90, duration: 1.6, evolved: false },
    // Armas compartidas (disponibles para todos los personajes)
    cuchillo: { level: 0, baseDamage: 14, cooldown: 1.0, timer: 0, range: 220, evolved: false },
    granada: { level: 0, baseDamage: 38, cooldown: 5.0, timer: 0, radius: 60, evolved: false },
    rifle: { level: 0, baseDamage: 22, cooldown: 1.4, timer: 0, range: 320, evolved: false },
    ballesta: { level: 0, baseDamage: 28, cooldown: 2.8, timer: 0, range: 400, speed: 620, evolved: false },
    lanza: { level: 0, baseDamage: 14, cooldown: 0.7, timer: 0, range: 90, evolved: false },
    hacha: { level: 0, baseDamage: 60, cooldown: 4.5, timer: 0, radius: 70, evolved: false },
    shuriken: { level: 0, baseDamage: 16, cooldown: 1.8, timer: 0, range: 280, speed: 560, evolved: false },
    hakiPulse: { level: 0, baseDamage: 12, cooldown: 4.0, timer: 0, radius: 80, duration: 1.0, evolved: false }
};

let enemies = [];
let enemyBullets = [];
let drops = [];
let particles = [];
let damageTexts = [];
let activeAttacks = [];
