// === GEARS DE LUFFY (2 → 5) ===
// Transformaciones temporales con medidor y activacion manual (Espacio o boton GEAR).
// - En partida: la carta "Gears" (id interno 'gear2') marca el techo:
//     nv1 → Gear 2 · nv3 → Gear 3 · evolucion → Gear 4 · Gear 4 + minuto 6 → Gear 5
// - Persistente: cada Gear se desbloquea con un hito (logro). El Beli solo compra
//   mejoras menores (medidor inicial, carga y recuperacion), nunca daño.
// - Cada Gear tiene su coste canon al terminar (agotamiento, Luffy encogido...).
// Se carga despues del script principal: usa sus globales (player, skills, meta...).

const GEAR_INFO = {
    2: { name: 'GEAR SECOND', color: '#f472b6', dur: 8,  sound: 'gear2' },
    3: { name: 'GEAR THIRD',  color: '#fb923c', dur: 9,  sound: 'boom' },
    4: { name: 'GEAR FOURTH: BOUNDMAN', color: '#dc2626', dur: 12, sound: 'haoshoku' },
    5: { name: 'GEAR FIFTH: NIKA', color: '#f8fafc', dur: 15, sound: 'haoshoku' }
};
const GEAR5_COOLDOWN = 180;   // segundos entre usos de Gear 5
const GEAR5_MIN_TIME = 360;   // minuto 6 de partida (el boss llega en el 8)

// Mejoras de tienda (persistentes, menores, sin daño). Requieren Gear 3 desbloqueado.
const GEAR_SHOP = [
    { id: 'meter',   name: 'Respiración de Goma', desc: 'El medidor de Gear empieza un +15% más lleno por nivel.', cost: 3000, max: 3 },
    { id: 'charge',  name: 'Hambre de Luffy',     desc: '+10% de carga del medidor por nivel.',                   cost: 2500, max: 3 },
    { id: 'recover', name: 'Banquete de Carne',   desc: '-15% de duración del coste tras un Gear por nivel.',      cost: 4000, max: 3 }
];

// ---- estado persistente (vive dentro de meta, se guarda con saveMeta) ----
function gearMetaInit() {
    if (!meta.gear) meta.gear = { unlocked: 2, up: { meter: 0, charge: 0, recover: 0 } };
    meta.gear.up = Object.assign({ meter: 0, charge: 0, recover: 0 }, meta.gear.up || {});
    if (!meta.gear.unlocked || meta.gear.unlocked < 2) meta.gear.unlocked = 2;
    if (meta.stats && meta.stats.luffyBestCurse === undefined) meta.stats.luffyBestCurse = -1;
}

// ---- sprites reales (assets/sprites/gears) ----
// G4 Boundman: Great Pirate Colosseum (3DS). G5: hoja de TheCube513 (fan sprite).
// G3: puño gigante y Luffy encogido de Gigant Battle (DS). G2 usa el sprite base con piel rosada y vapor, como en el anime.
const GEAR_SPR = (function () {
    const L = (n, c) => Array.from({ length: c }, (_, i) => { const im = new Image(); im.src = 'assets/sprites/gears/' + n + '_' + i + '.png'; return im; });
    const fist = new Image(); fist.src = 'assets/sprites/gears/g3_fist.png';
    return {
        4: { idle: L('g4_idle', 6), walk: L('g4_idle', 6), attack: L('g4_attack', 3), h: 78, fps: 9 },
        5: { idle: L('g5_idle', 3), walk: L('g5_walk', 8), attack: L('g5_attack', 3), h: 76, fps: 8 },
        chibi: { idle: L('g3_chibi', 3), walk: L('g3_chibi', 3), attack: L('g3_chibi', 3), h: 24, fps: 6 },
        fist
    };
})();
// Frame del Gear actual, o null si se dibuja el sprite normal de Luffy
function gearSpriteFrame() {
    if (!gearIsLuffy()) return null;
    const set = gearState.active >= 4 ? GEAR_SPR[gearState.active] : (gearState.penalty === 'chibi' ? GEAR_SPR.chibi : null);
    if (!set) return null;
    const st = player.animState === 'attack' ? 'attack' : (player.animState === 'walk' ? 'walk' : 'idle');
    const arr = set[st];
    const img = arr[Math.floor(performance.now() / 1000 * set.fps) % arr.length];
    return (img && img.complete && img.naturalWidth) ? { img, h: set.h } : null;
}

// ---- estado de la partida ----
const gearState = { meter: 0, active: 0, remain: 0, penalty: null, penaltyRemain: 0, g5cd: 0, atkTimer: 0, fx: [], areaMul: 1, steam: 0 };

function gearIsLuffy() { return typeof selectedCharacter !== 'undefined' && selectedCharacter === 'luffy'; }
function gearCardLevel() { return (skills.gear2 && CHAR_SKILLS[selectedCharacter].includes('gear2')) ? skills.gear2.level : 0; }
function gearUp(id) { return (meta.gear && meta.gear.up[id]) || 0; }

function gearReset() {
    gearMetaInit();
    // resetGame ya repuso areaBonus a 1.0: no deshacer el x1.6 de Gear 3 aqui
    gearState.meter = gearIsLuffy() ? 15 * gearUp('meter') : 0;
    gearState.active = 0; gearState.remain = 0;
    gearState.penalty = null; gearState.penaltyRemain = 0;
    gearState.g5cd = 0; gearState.atkTimer = 0; gearState.fx = []; gearState.areaMul = 1; gearState.steam = 0;
    gearUpdateButton();
}

// Gear mas alto disponible ahora mismo en esta partida
function gearAvailable() {
    const lvl = gearCardLevel();
    if (!gearIsLuffy() || lvl <= 0) return 0;
    const unl = meta.gear ? meta.gear.unlocked : 2;
    let g = 2;
    if (lvl >= 3 && unl >= 3) g = 3;
    if (skills.gear2.evolved && unl >= 4) g = 4;
    if (g === 4 && unl >= 5 && gameTime >= GEAR5_MIN_TIME && gearState.g5cd <= 0) g = 5;
    return g;
}
function gearReady() {
    return gearState.meter >= 100 && !gearState.active && !gearState.penalty && gearAvailable() > 0;
}

function gearActivate() {
    if (typeof gameState === 'undefined' || gameState !== 'PLAYING' || !gearReady()) return;
    const g = gearAvailable();
    const info = GEAR_INFO[g];
    gearState.active = g;
    gearState.meter = 0;
    gearState.atkTimer = 0.4;
    // la carta sube la duracion de Gear 2 (+1s por nivel extra)
    gearState.remain = info.dur + (g === 2 ? Math.max(0, gearCardLevel() - 1) : 0);
    // Gear 3: huesos gigantes → area de todas las armas x1.6 mientras dure
    gearState.areaMul = g === 3 ? 1.6 : 1;
    player.areaBonus *= gearState.areaMul;
    if (g === 5) gearState.g5cd = GEAR5_COOLDOWN;
    window.spawnBanner = { text: info.name + '!', life: 1.6, color: info.color };
    playSound(info.sound);
    cameraShake = Math.max(cameraShake, g >= 4 ? 3 : 1.6);
    fxRing(player.x, player.y, info.color, 26, 0.6);
    fxRing(player.x, player.y, '#ffffff', 14, 0.45);
    fxSpark(player.x, player.y, info.color, g >= 4 ? 30 : 16, 220, 0.55, 3, 0);
    if (g === 5) gearBajrangGun();
    gearUpdateButton();
}

function gearEnd() {
    const g = gearState.active;
    if (!g) return;
    player.areaBonus /= gearState.areaMul;
    gearState.areaMul = 1;
    gearState.active = 0;
    const rec = 1 - 0.15 * gearUp('recover');
    // coste canon de cada Gear
    if (g === 3) { gearState.penalty = 'chibi'; gearState.penaltyRemain = 4 * rec; window.spawnBanner = { text: '¡LUFFY ENCOGIDO!', life: 1.2, color: '#fb923c' }; }
    else if (g === 4) { gearState.penalty = 'exhausted'; gearState.penaltyRemain = 8 * rec; window.spawnBanner = { text: '¡SIN HAKI! AGOTADO', life: 1.4, color: '#94a3b8' }; }
    else if (g === 5) {
        gearState.penalty = 'exhausted'; gearState.penaltyRemain = 12 * rec;
        // canon: el coste es el agotamiento (Luffy arrugado y sin fuerzas), no perder vida
        window.spawnBanner = { text: 'NIKA SE APAGA... AGOTADO', life: 1.6, color: '#94a3b8' };
    }
    fxRing(player.x, player.y, '#94a3b8', 18, 0.5);
    if (typeof updateUI === 'function') updateUI();
    gearUpdateButton();
}

// ---- carga del medidor ----
function gearOnKill(e) {
    if (!gearIsLuffy() || gearCardLevel() <= 0 || gearState.active || gearState.penalty === 'exhausted') return;
    const base = e.isBoss ? 30 : (e.isMiniboss ? 20 : (e.isElite ? 8 : 1));
    gearState.meter = Math.min(100, gearState.meter + base * (1 + 0.1 * gearUp('charge')));
}

function gearUpdate(dt) {
    if (!gearIsLuffy()) return;
    if (gearState.g5cd > 0) gearState.g5cd -= dt;
    const lvl = gearCardLevel();
    if (lvl > 0 && !gearState.active && gearState.penalty !== 'exhausted' && gearState.meter < 100) {
        gearState.meter = Math.min(100, gearState.meter + 0.6 * dt * (1 + 0.1 * gearUp('charge')));
    }
    if (gearState.penalty) {
        gearState.penaltyRemain -= dt;
        if (gearState.penaltyRemain <= 0) { gearState.penalty = null; gearUpdateButton(); }
    }
    // fx propios (puños gigantes, ondas)
    for (let i = gearState.fx.length - 1; i >= 0; i--) {
        gearState.fx[i].life -= dt;
        if (gearState.fx[i].life <= 0) gearState.fx.splice(i, 1);
    }
    const g = gearState.active;
    skills.gear2.active = (g === 2); // vfx.js: piel rosa y vapor del Gear 2
    if (!g) { gearUpdateButtonThrottled(dt); return; }
    gearState.remain -= dt;
    // Gear 2: la sangre bombea a toda velocidad → drena vida (no mata)
    if (g === 2) player.hp = Math.max(1, player.hp - player.maxHp * 0.012 * dt);
    // vapor / nubes
    gearState.steam -= dt;
    if (gearState.steam <= 0) {
        gearState.steam = g === 5 ? 0.05 : 0.08;
        const col = g === 5 ? '#ffffff' : (g === 4 ? '#fca5a5' : '#fbcfe8');
        if (g !== 3) particles.push({ x: player.x + (Math.random() * 26 - 13), y: player.y - 8 + Math.random() * 16, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 30, life: 0.7, maxLife: 0.7, color: col, shape: 'orb', size: g === 5 ? 6 : 4 });
    }
    // ataques especiales periodicos
    gearState.atkTimer -= dt;
    if (gearState.atkTimer <= 0) {
        if (g === 3) { gearState.atkTimer = 1.6; gearElephantGun(); }
        else if (g === 4) { gearState.atkTimer = 1.3; gearKongGun(); }
        else if (g === 5) { gearState.atkTimer = 1.2; gearDawnWhip(); }
        else gearState.atkTimer = 99;
    }
    if (gearState.remain <= 0) gearEnd();
    gearUpdateButtonThrottled(dt);
}

// ---- ataques ----
function gearHitArea(x, y, r, base, knock) {
    forEnemiesNear(x, y, r, function (e) {
        const dmgInfo = calculateDamage(base);
        e.hp -= dmgInfo.amount * e.damageTaken;
        spawnDamageText(e.x, e.y, dmgInfo);
        if (knock && !e.isBoss && !e.isMiniboss) {
            const d = Math.hypot(e.x - player.x, e.y - player.y) || 1;
            e.x += (e.x - player.x) / d * knock; e.y += (e.y - player.y) / d * knock;
        }
        if (e.hp <= 0) killEnemy(e);
    });
}
function gearTarget() {
    const t = getNearestEnemy();
    if (t && Math.hypot(t.x - player.x, t.y - player.y) < 420) return t;
    return null;
}
function gearElephantGun() {
    const t = gearTarget(); if (!t) { gearState.atkTimer = 0.3; return; }
    const r = 95 * player.areaBonus;
    gearState.fx.push({ kind: 'fist', spr: true, x0: player.x, y0: player.y, x: t.x, y: t.y, r: r * 0.55, color: '#fb923c', life: 0.35, max: 0.35 });
    gearHitArea(t.x, t.y, r, 80 + 20 * gearCardLevel(), 60);
    fxRing(t.x, t.y, '#fb923c', r * 0.4, 0.45);
    fxSpark(t.x, t.y, '#fdba74', 14, 200, 0.4, 3, 60);
    playSound('boom'); cameraShake = Math.max(cameraShake, 1.6);
}
function gearKongGun() {
    const t = gearTarget(); if (!t) { gearState.atkTimer = 0.3; return; }
    const r = 135 * player.areaBonus;
    gearState.fx.push({ kind: 'fist', x0: player.x, y0: player.y, x: t.x, y: t.y, r: r * 0.5, color: '#7f1d1d', life: 0.4, max: 0.4 });
    gearState.fx.push({ kind: 'wave', x: t.x, y: t.y, r: r, color: '#dc2626', life: 0.5, max: 0.5 });
    gearHitArea(t.x, t.y, r, 170, 90);
    fxSpark(t.x, t.y, '#fca5a5', 22, 260, 0.5, 3, 40);
    playSound('boom'); cameraShake = Math.max(cameraShake, 2.4);
}
function gearDawnWhip() {
    const r = 190 * player.areaBonus;
    gearState.fx.push({ kind: 'wave', x: player.x, y: player.y, r: r, color: '#ffffff', life: 0.45, max: 0.45 });
    gearHitArea(player.x, player.y, r, 120, 70);
    fxStars(player.x, player.y - 10, 8);
}
function gearBajrangGun() {
    // golpe de entrada: un puño colosal que barre la pantalla
    const r = 460;
    gearState.fx.push({ kind: 'wave', x: player.x, y: player.y, r: r, color: '#fde68a', life: 0.8, max: 0.8 });
    gearHitArea(player.x, player.y, r, 400, 140);
    playSound('boom'); cameraShake = 4;
    window._gearFlash = 0.35;
}

// ---- modificadores que lee el bucle principal ----
function gearDamageMult() {
    const g = gearState.active;
    let m = g === 2 ? 1.15 : g === 3 ? 1.6 : g === 4 ? 2.2 : g === 5 ? 2.6 : 1;
    if (gearState.penalty === 'chibi') m *= 0.7;
    return m;
}
function gearSpeedMult() {
    const g = gearState.active;
    let m = 1;
    if (g === 2) m = 1 + (skills.gear2.speedBonus || 0.3);
    else if (g === 4) m = 1.2;
    else if (g === 5) m = 1.3;
    if (gearState.penalty === 'chibi') m *= 0.8;
    else if (gearState.penalty === 'exhausted') m *= 0.8; // sin Haki y sin aire (medido con bot: x0.5 lo hacía perder)
    return m;
}
function gearCdMult() {
    const g = gearState.active;
    // cada Gear supera al anterior (medido con bot): con 1.15/1.0 el G3 y el G4 rendían menos que el G2
    let m = g === 2 ? 0.6 : g === 3 ? 1.0 : g === 4 ? 0.7 : g === 5 ? 0.6 : 1;
    if (gearState.penalty === 'exhausted') m *= 1.3;
    return m;
}
function gearDamageTakenMult() {
    const g = gearState.active;
    return g === 5 ? 0 : (g === 4 ? 0.5 : 1);
}
function gearEnemySpeedMult() { return gearState.active === 5 ? 0.5 : 1; }

// ---- dibujo ----
// Aura detras del sprite (contexto ya trasladado al jugador)
function gearDrawAura(ctx) {
    const g = gearState.active;
    if (!g) return;
    const t = performance.now() / 1000;
    const col = GEAR_INFO[g].color;
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 10);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(0, 0, g === 5 ? 44 : (g === 4 ? 38 : 30), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    if (g === 5) {
        // sol de Nika: rayos girando
        for (let k = 0; k < 12; k++) {
            const a = t * 1.5 + k * Math.PI / 6;
            ctx.beginPath(); ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); ctx.lineTo(Math.cos(a) * 52, Math.sin(a) * 52); ctx.stroke();
        }
    } else {
        ctx.beginPath(); ctx.arc(0, 0, g === 4 ? 38 : 30, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
}
// Transformacion del sprite: escala, rebote y filtro de color
function gearSpriteTransform(ctx) {
    const g = gearState.active;
    const t = performance.now() / 1000;
    // con sprite propio (G4, G5, encogido) no se reescala ni se tiñe: solo el rebote
    const spr = !!gearSpriteFrame();
    if (g === 3) ctx.scale(1.15, 1.15);
    else if (g === 4) { ctx.translate(0, -Math.abs(Math.sin(t * 7)) * 12); if (!spr) ctx.scale(1.35, 1.35); }
    else if (g === 5) { ctx.translate(0, Math.sin(t * 4) * 4); if (!spr) ctx.scale(1.3, 1.3); }
    else if (gearState.penalty === 'chibi' && !spr) ctx.scale(0.62, 0.62);
    if (g === 2) ctx.filter = 'saturate(1.6) hue-rotate(-15deg) brightness(1.1)';
    else if (g === 4 && !spr) ctx.filter = 'brightness(0.55) sepia(0.6) saturate(3) hue-rotate(-35deg)';
    else if (g === 5 && !spr) ctx.filter = 'grayscale(1) brightness(1.9) contrast(1.1)';
    else if (gearState.penalty === 'exhausted') ctx.filter = 'grayscale(0.6) brightness(0.85)';
}
// Puños gigantes y ondas (espacio de mundo)
function gearDrawWorld(ctx) {
    for (const f of gearState.fx) {
        const a = Math.max(0, f.life / f.max);
        ctx.save();
        if (f.kind === 'fist' && f.spr && GEAR_SPR.fist.complete && GEAR_SPR.fist.naturalWidth) {
            // Gear 3: brazo de hueso inflado (sprite de Gigant Battle) que se estira hasta el objetivo
            const p = Math.min(1, (1 - a) * 2.2);
            const len = Math.max(20, Math.hypot(f.x - f.x0, f.y - f.y0) * p + f.r);
            const im = GEAR_SPR.fist, hh = f.r * 2;
            ctx.globalAlpha = Math.min(1, a * 1.6);
            ctx.translate(f.x0, f.y0); ctx.rotate(Math.atan2(f.y - f.y0, f.x - f.x0));
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(im, 0, -hh / 2, len, hh);
        } else if (f.kind === 'fist') {
            const p = Math.min(1, (1 - a) * 2.2);
            const x = f.x0 + (f.x - f.x0) * p, y = f.y0 + (f.y - f.y0) * p;
            ctx.globalAlpha = Math.min(1, a * 1.6);
            ctx.strokeStyle = f.color; ctx.lineWidth = f.r * 0.35; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(f.x0, f.y0); ctx.lineTo(x, y); ctx.stroke();
            ctx.fillStyle = f.color;
            ctx.beginPath(); ctx.arc(x, y, f.r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#1a0f06'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(x, y, f.r, 0, Math.PI * 2); ctx.stroke();
        } else if (f.kind === 'wave') {
            ctx.globalAlpha = a * 0.8;
            ctx.strokeStyle = f.color; ctx.lineWidth = 6 * a + 2;
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.1 - a * 0.6), 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = a * 0.15;
            ctx.fillStyle = f.color;
            ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.1 - a * 0.6), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}
// Medidor y estado (espacio de pantalla)
function gearDrawHUD(ctx) {
    if (!gearIsLuffy() || gearCardLevel() <= 0) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (window._gearFlash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.6, window._gearFlash * 2).toFixed(3) + ')';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        window._gearFlash -= 1 / 60;
    }
    const w = Math.min(240, VIEW_W - 40), h = 12;
    const x = (VIEW_W - w) / 2, y = VIEW_H - 96;
    const g = gearState.active;
    let frac, col, label;
    if (g) { frac = gearState.remain / GEAR_INFO[g].dur; col = GEAR_INFO[g].color; label = GEAR_INFO[g].name; }
    else if (gearState.penalty) { frac = 0; col = '#94a3b8'; label = (gearState.penalty === 'chibi' ? 'ENCOGIDO ' : 'AGOTADO ') + Math.ceil(gearState.penaltyRemain) + 's'; }
    else {
        frac = gearState.meter / 100; const av = gearAvailable();
        col = gearState.meter >= 100 ? GEAR_INFO[av].color : '#facc15';
        label = gearState.meter >= 100 ? GEAR_INFO[av].name + ' LISTO · ESPACIO' : 'GEAR ' + Math.floor(gearState.meter) + '%';
    }
    ctx.fillStyle = 'rgba(20,12,4,0.85)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
    ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2;
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    ctx.font = '13px Bangers, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.strokeText(label, VIEW_W / 2, y - 6);
    ctx.fillStyle = '#fff7e0';
    ctx.fillText(label, VIEW_W / 2, y - 6);
    ctx.restore();
}

// ---- boton tactil ----
let _gearBtnT = 0;
function gearUpdateButtonThrottled(dt) { _gearBtnT -= dt; if (_gearBtnT <= 0) { _gearBtnT = 0.2; gearUpdateButton(); } }
function gearUpdateButton() {
    const b = document.getElementById('gear-btn');
    if (!b) return;
    const show = gearIsLuffy() && gearCardLevel() > 0 && typeof gameState !== 'undefined' && gameState === 'PLAYING';
    b.style.display = show ? 'flex' : 'none';
    if (!show) return;
    const ready = gearReady();
    b.classList.toggle('ready', ready);
    const av = gearAvailable();
    b.textContent = gearState.active ? 'G' + gearState.active : ('G' + av);
}

// ---- hitos persistentes ----
// Se añaden a ACHIEVEMENTS: el campo gear desbloquea ese Gear para siempre.
const GEAR_ACHIEVEMENTS = [
    { id: 'gear_3', name: 'Gear Third', desc: 'Conquista una isla con Luffy. Desbloquea el Gear 3.', check: s => (s.winsByChar.luffy || 0) >= 1, reward: 500, gear: 3 },
    { id: 'gear_4', name: 'Gear Fourth', desc: 'Conquista una isla con Luffy en Clima Peligroso 2 o más. Desbloquea el Gear 4.', check: s => (s.luffyBestCurse || -1) >= 2, reward: 1500, gear: 4 },
    { id: 'gear_5', name: 'Despertar de Nika', desc: 'Conquista una isla con Luffy en Clima Peligroso 4. Desbloquea el Gear 5.', check: s => (s.luffyBestCurse || -1) >= 4, reward: 3000, gear: 5 }
];
function gearOnAchievement(a) {
    if (!a.gear) return;
    gearMetaInit();
    meta.gear.unlocked = Math.max(meta.gear.unlocked, a.gear);
}
function gearOnVictory() {
    gearMetaInit();
    if (gearIsLuffy()) meta.stats.luffyBestCurse = Math.max(meta.stats.luffyBestCurse, runCurseRank);
}

// ---- tienda ----
function gearShopCost(u, lvl) { return u.cost * Math.pow(2, lvl); }
function renderGearShop(container) {
    gearMetaInit();
    const head = document.createElement('div');
    head.className = 'gear-shop-head';
    head.innerHTML = 'GEARS DE LUFFY · Desbloqueados: ' + [2,3,4,5].map(n => n <= meta.gear.unlocked ? 'G' + n + ' ✔' : 'G' + n + ' 🔒').join(' · ');
    container.appendChild(head);
    const locked = meta.gear.unlocked < 3;
    GEAR_SHOP.forEach(u => {
        const lvl = gearUp(u.id);
        const cost = gearShopCost(u, lvl);
        const maxed = lvl >= u.max;
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.style.display = 'flex'; card.style.alignItems = 'center'; card.style.gap = '10px';
        card.innerHTML = `
            <div class="upgrade-icon">${ICONS.gear2}</div>
            <div class="upgrade-info" style="flex:1;">
                <h4>${u.name} (Nv ${lvl}/${u.max})</h4>
                <p>${locked ? 'Requiere desbloquear el Gear 3 (conquista una isla con Luffy).' : u.desc}</p>
            </div>
            <div class="upgrade-buy" style="display:flex; flex-direction:column; align-items:center; gap:4px; min-width:90px;">
                <div style="font-family:'Bangers',sans-serif; font-size:16px; color:#b45309; letter-spacing:1px;">${maxed ? 'MÁX' : cost.toLocaleString('en-US') + ' ฿'}</div>
                <button class="btn-buy" style="padding:6px 14px; font-size:13px; font-weight:700; border-radius:8px; border:2px solid #b45309; background:linear-gradient(135deg,#facc15,#b45309); color:#1a0f06; cursor:pointer; font-family:'Bangers',sans-serif; letter-spacing:1px;">COMPRAR</button>
            </div>`;
        const btn = card.querySelector('.btn-buy');
        if (!locked && !maxed && meta.beli >= cost) {
            btn.onclick = (e) => {
                e.stopPropagation();
                meta.beli -= cost; meta.gear.up[u.id] = lvl + 1;
                playSound('buy'); saveMeta(); renderShop(); updateMetaUI();
            };
        } else {
            card.style.opacity = '0.5'; btn.disabled = true; btn.style.cursor = 'not-allowed'; btn.style.opacity = '0.5';
        }
        container.appendChild(card);
    });
}

window.addEventListener('keydown', e => {
    if (e.code === 'Space') { if (typeof gameState !== 'undefined' && gameState === 'PLAYING') { e.preventDefault(); gearActivate(); } }
});
gearMetaInit();
ACHIEVEMENTS.push(...GEAR_ACHIEVEMENTS);
