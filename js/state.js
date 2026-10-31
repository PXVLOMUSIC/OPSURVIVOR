// --- HIGH-POLISH PROCEDURAL PIXEL SPRITES ---
const Sprites = {};

function createPixelSprite(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    drawFn(cx);
    return c;
}

function generateSprites() {
    // Luffy HD Sprite (3 frames animation)
    Sprites.luffy = createPixelSprite(96, 32, (cx) => {
        for(let i=0; i<3; i++) {
            const ox = i * 32;
            // Sombrero de Paja detallado
            cx.fillStyle = '#b45309'; cx.fillRect(ox + 4, 8, 24, 3);
            cx.fillStyle = '#f59e0b'; cx.fillRect(ox + 6, 3, 20, 6);
            cx.fillStyle = '#ef4444'; cx.fillRect(ox + 6, 7, 20, 2);
            // Rostro
            cx.fillStyle = '#ffdbac'; cx.fillRect(ox + 9, 9, 14, 7);
            cx.fillStyle = '#0f172a'; cx.fillRect(ox + 16, 11, 2, 2); // Ojo
            // Chaleco Rojo y Pantalón
            cx.fillStyle = '#ef4444'; cx.fillRect(ox + 8, 16, 16, 8);
            cx.fillStyle = '#ffdbac'; cx.fillRect(ox + 13, 16, 6, 5); // Pecho
            cx.fillStyle = '#3b82f6'; cx.fillRect(ox + 9, 24, 14, 2); // Faja
            const legShift = i === 1 ? -2 : (i === 2 ? 2 : 0);
            cx.fillStyle = '#1e3a8a'; cx.fillRect(ox + 10 + legShift, 26, 5, 4);
            cx.fillRect(ox + 17 - legShift, 26, 5, 4);
        }
    });

    // Marine Grunt
    Sprites.marine = createPixelSprite(32, 32, (cx) => {
        cx.fillStyle = '#f8fafc'; cx.fillRect(9, 4, 14, 5);
        cx.fillStyle = '#1e3a8a'; cx.fillRect(9, 9, 14, 2);
        cx.fillStyle = '#ffdbac'; cx.fillRect(10, 11, 12, 5);
        cx.fillStyle = '#ffffff'; cx.fillRect(8, 16, 16, 9);
        cx.fillStyle = '#1e3a8a'; cx.fillRect(13, 16, 6, 4);
        cx.fillStyle = '#0f172a'; cx.fillRect(9, 25, 6, 7); cx.fillRect(17, 25, 6, 7);
    });

    // Marine Shooter
    Sprites.shooter = createPixelSprite(32, 32, (cx) => {
        cx.fillStyle = '#2563eb'; cx.fillRect(9, 4, 14, 5);
        cx.fillStyle = '#ffdbac'; cx.fillRect(10, 11, 12, 5);
        cx.fillStyle = '#ffffff'; cx.fillRect(8, 16, 16, 9);
        cx.fillStyle = '#334155'; cx.fillRect(18, 16, 11, 4); // Rifle
    });

    // Pacifista
    Sprites.pacifista = createPixelSprite(48, 48, (cx) => {
        cx.fillStyle = '#334155'; cx.fillRect(10, 6, 28, 38);
        cx.fillStyle = '#1e293b'; cx.fillRect(12, 8, 24, 34);
        cx.fillStyle = '#ef4444'; cx.fillRect(28, 12, 6, 6);
        cx.fillStyle = '#fef08a'; cx.fillRect(30, 14, 2, 2);
        cx.fillStyle = '#ffffff'; cx.fillRect(21, 20, 6, 14);
        cx.fillRect(16, 25, 16, 4);
    });

    // Don Krieg
    Sprites.krieg = createPixelSprite(64, 64, (cx) => {
        cx.fillStyle = '#b45309'; cx.fillRect(14, 8, 36, 48);
        cx.fillStyle = '#f59e0b'; cx.fillRect(18, 12, 28, 40);
        cx.fillStyle = '#78350f'; cx.fillRect(10, 16, 8, 14); cx.fillRect(46, 16, 8, 14);
        cx.fillStyle = '#0f172a'; cx.fillRect(22, 18, 20, 8);
        cx.fillStyle = '#ef4444'; cx.fillRect(26, 20, 4, 4); cx.fillRect(34, 20, 4, 4);
    });

    // Baratie Wooden Deck Tile (Con texturas finas de madera)
    Sprites.deckTile = createPixelSprite(64, 64, (cx) => {
        cx.fillStyle = '#78350f'; cx.fillRect(0, 0, 64, 64);
        cx.fillStyle = '#451a03';
        for(let i=0; i<64; i+=16) cx.fillRect(0, i, 64, 2);
        cx.fillStyle = '#92400e';
        cx.fillRect(8, 4, 28, 1); cx.fillRect(36, 36, 20, 1);
        cx.fillStyle = '#291102';
        cx.fillRect(2, 20, 16, 1); cx.fillRect(20, 52, 32, 1);
    });
}
generateSprites();

// --- GAME STATE & STATS ---
let gameState = 'START';

// --- META PROGRESSION (Vampire Survivors style) ---
const META_UPGRADES = [
    { id: 'damage', name: 'Poder', desc: '+5% daño por nivel', cost: 2000, max: 10, icon: ICONS.power, apply: (p, lvl) => { p.powerPct += lvl * 5; } },
    { id: 'hp', name: 'Salud', desc: '+10 HP max por nivel', cost: 1500, max: 10, icon: ICONS.heart, apply: (p, lvl) => { p.maxHp += lvl * 10; p.hp = p.maxHp; } },
    { id: 'speed', name: 'Velocidad', desc: '+5% velocidad por nivel', cost: 1800, max: 10, icon: ICONS.speed, apply: (p, lvl) => { p.speed *= (1 + lvl * 0.05); } },
    { id: 'area', name: 'Área', desc: '+5% área por nivel', cost: 1800, max: 10, icon: ICONS.area, apply: (p, lvl) => { p.areaBonus *= (1 + lvl * 0.05); } },
    { id: 'cooldown', name: 'Cooldown', desc: '-3% cooldown por nivel', cost: 2000, max: 10, icon: ICONS.cd, apply: (p, lvl) => { p.cdReduction = Math.min(60, p.cdReduction + lvl * 3); } },
    { id: 'armor', name: 'Armadura', desc: '+5% armadura por nivel', cost: 2500, max: 10, icon: ICONS.armor, apply: (p, lvl) => { p.armor = Math.min(70, p.armor + lvl * 5); } },
    { id: 'luck', name: 'Crítico', desc: '+5% prob. crítica por nivel', cost: 3000, max: 10, icon: ICONS.crit, apply: (p, lvl) => { p.critChance += lvl * 0.05; } },
    { id: 'pickup', name: 'Recogida', desc: '+10% rango de recogida por nivel', cost: 1500, max: 10, icon: ICONS.pickup, apply: (p, lvl) => { p.pickupBonus += lvl * 0.10; } },
    { id: 'growth', name: 'Crecimiento', desc: '+5% XP por nivel', cost: 2000, max: 10, icon: ICONS.growth, apply: (p, lvl) => { p.growthBonus += lvl * 0.05; } },
    { id: 'revival', name: 'Revivir', desc: 'Revive una vez con 50% HP', cost: 15000, max: 1, icon: ICONS.revive, apply: (p, lvl) => { player.revives = (player.revives || 0) + 1; } },
    { id: 'greed', name: 'Avaricia', desc: '+20% Berries por nivel', cost: 1200, max: 10, icon: ICONS.coin, apply: (p, lvl) => { p.greedBonus += lvl * 0.20; } },
    { id: 'curse', name: 'Maldición', desc: '+10% enemigos/HP/vel (riesgo/recompensa)', cost: 4000, max: 5, icon: ICONS.skull, apply: (p, lvl) => { p.curse += lvl * 0.10; } },
    { id: 'reroll', name: 'Rerolls', desc: '+3 rerolls de opciones por partida', cost: 2000, max: 10, icon: ICONS.dice, apply: (p, lvl) => { p.rerollUses += lvl * 3; } },
    { id: 'skip', name: 'Saltos', desc: '+3 saltos de subida de nivel por partida', cost: 500, max: 10, icon: ICONS.fastforward, apply: (p, lvl) => { p.skipUses += lvl * 3; } },
    { id: 'banish', name: 'Destierros', desc: '+3 destierros de opción por partida', cost: 500, max: 10, icon: ICONS.trash, apply: (p, lvl) => { p.banishUses += lvl * 3; } }
];
let meta = { beli: 0, upgrades: {}, unlocked: { luffy: true, zoro: false, sanji: false }, wins: { baratie: 0, alabasta: 0, skypiea: 0 }, curseUnlocked: 0,
    achievements: {},
    stats: { kills: 0, elites: 0, evolves: 0, beliTotal: 0, maxTime: { baratie: 0, alabasta: 0, skypiea: 0 }, winsByChar: { luffy: 0, zoro: 0, sanji: 0 }, winsByCurse: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }, killsByType: {} } };
META_UPGRADES.forEach(u => meta.upgrades[u.id] = 0);
function loadMeta() {
    try {
        const saved = localStorage.getItem('op_survivor_meta');
        if (saved) {
            const parsed = JSON.parse(saved);
            meta.beli = parsed.beli || 0;
            META_UPGRADES.forEach(u => { meta.upgrades[u.id] = (parsed.upgrades && parsed.upgrades[u.id]) || 0; });
            if (parsed.unlocked) meta.unlocked = { ...meta.unlocked, ...parsed.unlocked };
            if (parsed.wins) meta.wins = { ...meta.wins, ...parsed.wins };
            else meta.wins.baratie = 1; // guardado antiguo: Baratie ya conquistado
            if (parsed.achievements) meta.achievements = parsed.achievements;
            meta.curseUnlocked = parsed.curseUnlocked || 0;
            if (parsed.stats) meta.stats = { ...meta.stats, ...parsed.stats,
                maxTime: { ...meta.stats.maxTime, ...(parsed.stats.maxTime || {}) },
                winsByChar: { ...meta.stats.winsByChar, ...(parsed.stats.winsByChar || {}) },
                winsByCurse: { 0:0,1:0,2:0,3:0,4:0, ...(parsed.stats.winsByCurse || {}) },
                killsByType: { ...(parsed.stats.killsByType || {}) } };
        }
    } catch (e) {}
}
function saveMeta() {
    try { localStorage.setItem('op_survivor_meta', JSON.stringify({ beli: meta.beli, upgrades: meta.upgrades, unlocked: meta.unlocked, wins: meta.wins, achievements: meta.achievements, stats: meta.stats, curseUnlocked: meta.curseUnlocked })); } catch (e) {}
}
loadMeta();
let gameTime = 0, lastTime = performance.now();
let scoreBeli = 0, cameraShake = 0, bossSpawned = false;
let _lastMusicState = '';

const MAP_SCALE = 2;
// Walkable deck area (based on red-marked limits in reference image)
const MAP_BOUNDS = { minX: -580 * MAP_SCALE, maxX: 580 * MAP_SCALE, minY: -236 * MAP_SCALE, maxY: 236 * MAP_SCALE };
const WALK_POLY = [
  [-1157.8,2.8],
  [-1122.0,-118.1],
  [-957.0,-313.2],
  [-830.5,-401.1],
  [-673.8,-439.6],
  [-621.5,-450.6],
  [-473.0,-469.8],
  [-396.0,-472.6],
  [-365.8,-472.6],
  [445.5,-461.6],
  [665.5,-442.3],
  [805.8,-401.1],
  [954.2,-302.2],
  [1113.8,-129.1],
  [1130.2,-101.6],
  [1133.0,-96.1],
  [1155.0,-30.2],
  [1163.2,-2.7],
  [1160.5,38.5],
  [1086.2,175.9],
  [1012.0,274.8],
  [882.8,351.8],
  [706.8,445.2],
  [629.8,456.2],
  [8.2,472.7],
  [-445.5,472.7],
  [-541.8,467.2],
  [-662.8,456.2],
  [-701.2,447.9],
  [-880.0,351.8],
  [-1003.8,269.3],
  [-1075.2,153.9],
  [-1155.0,13.8],
];
