// === Polygons per island ===
// Plaza del palacio (Alabasta, Skypiea y Thriller Bark comparten el mismo trazado):
// contorno extraido de la linea verde de referencia de Alabasta.
// Coordenadas de mundo = (px_imagen - 704, px_imagen - 446) * MAP_SCALE (imagen 1408x768).
const PALACE_ARENA_POLY = [
  [-1162.3,20.8],
  [-1158.7,35.5],
  [-1133.0,35.5],
  [-1125.7,2.5],
  [-1114.7,-8.5],
  [-1001.0,-1.2],
  [-993.7,6.1],
  [-1008.3,90.5],
  [-1001.0,171.1],
  [-913.0,182.1],
  [-898.3,229.8],
  [-649.0,240.8],
  [-638.0,251.8],
  [-627.0,314.1],
  [-612.3,343.4],
  [-410.7,339.7],
  [-377.7,347.1],
  [-370.3,354.4],
  [-366.7,409.4],
  [-198.0,413.1],
  [-18.3,435.0],
  [106.3,435.0],
  [238.3,416.7],
  [348.3,424.0],
  [352.0,372.7],
  [359.3,365.4],
  [579.3,369.1],
  [612.3,361.7],
  [627.0,350.7],
  [627.0,266.4],
  [649.0,248.1],
  [682.0,240.8],
  [806.7,244.4],
  [891.0,237.1],
  [891.0,182.1],
  [957.0,182.1],
  [1001.0,171.1],
  [1001.0,130.8],
  [971.7,31.8],
  [1052.3,-1.2],
  [1096.3,-4.9],
  [1100.0,-41.5],
  [1092.7,-100.2],
  [1067.0,-166.2],
  [1004.7,-184.5],
  [986.3,-217.5],
  [946.0,-224.8],
  [902.0,-250.5],
  [883.7,-301.8],
  [832.3,-327.5],
  [817.7,-345.8],
  [817.7,-389.8],
  [795.7,-411.8],
  [696.7,-411.8],
  [667.3,-433.8],
  [385.0,-430.1],
  [341.0,-419.1],
  [337.3,-334.8],
  [322.7,-320.1],
  [293.3,-312.8],
  [198.0,-312.8],
  [91.7,-353.1],
  [-14.7,-353.1],
  [-25.7,-345.8],
  [-95.3,-342.1],
  [-128.3,-323.8],
  [-242.0,-301.8],
  [-278.7,-309.1],
  [-315.3,-334.8],
  [-337.3,-364.1],
  [-344.7,-433.8],
  [-616.0,-430.1],
  [-737.0,-408.1],
  [-821.3,-408.1],
  [-839.7,-331.1],
  [-916.7,-331.1],
  [-920.3,-224.8],
  [-971.7,-221.1],
  [-975.3,-232.1],
  [-997.3,-232.1],
  [-1008.3,-199.2],
  [-1125.7,-195.5],
  [-1155.0,-78.2],
];
const WALK_POLYS = {
  baratie: WALK_POLY,
  alabasta: PALACE_ARENA_POLY,
  skypiea: PALACE_ARENA_POLY,
  thrillerbark: PALACE_ARENA_POLY
};
function walkPoly() {
  return WALK_POLYS[selectedMap] || WALK_POLY;
}
// Pushes a point inward until it lands inside the arena (enemy/boss spawns)
function clampToArena(x, y) {
  const poly = walkPoly();
  if (pointInPoly(x, y, poly)) return pushOutOfObstacles(x, y, 12);
  let px = x, py = y;
  for (let i = 0; i < 24 && !pointInPoly(px, py, poly); i++) { px *= 0.9; py *= 0.9; }
  return pushOutOfObstacles(px, py, 12);
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

// === Obstáculos dentro de la zona caminable (rejas, barandillas, farolas, macetas...) ===
// Cápsulas { ax, ay, bx, by, r } en coordenadas de mundo. Bloquean al jugador y a los enemigos normales.
const MAP_OBSTACLES = {
  // Vacío a petición: solo cuenta el borde de la arena. Las cápsulas detectadas (rejas, farolas,
  // palmeras...) están en el commit a863eaa por si se quieren recuperar.
  baratie: [],
  alabasta: [],
  skypiea: [],
  thrillerbark: []
};
function mapObstacles() { return MAP_OBSTACLES[selectedMap] || []; }
// Distancia al cuadrado de (x,y) al segmento del obstáculo, y punto más cercano
function _obsClosest(o, x, y) {
  const dx = o.bx - o.ax, dy = o.by - o.ay, l2 = dx * dx + dy * dy;
  let t = l2 ? ((x - o.ax) * dx + (y - o.ay) * dy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return [o.ax + dx * t, o.ay + dy * t];
}
function hitsObstacle(x, y, rad = 0) {
  const obs = mapObstacles();
  for (let i = 0; i < obs.length; i++) {
    const o = obs[i], [cx, cy] = _obsClosest(o, x, y), rr = o.r + rad;
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < rr * rr) return true;
  }
  return false;
}
// Empuja un círculo fuera de los obstáculos (desliza a lo largo de ellos). Devuelve [x, y].
function pushOutOfObstacles(x, y, rad = 0) {
  const obs = mapObstacles();
  for (let i = 0; i < obs.length; i++) {
    const o = obs[i], [cx, cy] = _obsClosest(o, x, y), rr = o.r + rad;
    const ex = x - cx, ey = y - cy, d2 = ex * ex + ey * ey;
    if (d2 < rr * rr) {
      const d = Math.sqrt(d2) || 0.0001;
      x = cx + (ex / d) * rr; y = cy + (ey / d) * rr;
    }
  }
  return [x, y];
}
function isWalkable(x, y, rad = 0) {
  return pointInPoly(x, y, walkPoly()) && !hitsObstacle(x, y, rad);
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
    pistol: { level: 1, baseDamage: 25, cooldown: 1.1, timer: 0, range: 250, evolved: false, evolvedName: 'Red Hawk' },
    gatling: { level: 0, baseDamage: 10, cooldown: 3.8, timer: 0, radius: 85, duration: 1.5, evolved: false, evolvedName: 'Jet Gatling' },
    bazooka: { level: 0, baseDamage: 45, cooldown: 5.5, timer: 0, radius: 65, evolved: false },
    gear2: { level: 0, cooldown: 12.0, timer: 0, duration: 6.0, speedBonus: 0.3, active: false, remain: 0, evolved: false },
    // transformaciones de Zoro y Sanji (js/gears.js): la carta marca el techo, como los Gears
    zoroform: { level: 0, evolved: false },
    sanjiform: { level: 0, evolved: false },
    // Luffy: latigazo frontal (abanico) y patada hacha alla gear 3
    muchi: { level: 0, baseDamage: 35, cooldown: 2.0, timer: 0, radius: 150, evolved: false, evolvedName: 'Jet Whip' },
    ono: { level: 0, baseDamage: 70, cooldown: 5.0, timer: 0, radius: 65, evolved: false },
    santoryu: { level: 1, baseDamage: 34, cooldown: 1.5, timer: 0, radius: 60, evolved: false },
    onigiri: { level: 0, baseDamage: 60, cooldown: 4.5, timer: 0, dash: 160, evolved: false },
    flyingslash: { level: 0, baseDamage: 20, cooldown: 2.2, timer: 0, range: 300, speed: 600, evolved: false },
    // Zoro: tornado orbitante y cañón de viento perforante
    tatsumaki: { level: 0, baseDamage: 10, cooldown: 3.6, timer: 0, radius: 95, duration: 1.0, evolved: false },
    poundho: { level: 0, baseDamage: 30, cooldown: 3.2, timer: 0, range: 420, speed: 700, evolved: false },
    diablejambe: { level: 1, baseDamage: 18, cooldown: 1.0, timer: 0, radius: 50, fire: true, evolved: false },
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
