// --- VFX DE HABILIDADES ---
// Dibujo de cada ataque, impactos y partículas temáticas.
// Cada habilidad tiene una forma que coincide con su hitbox (proyectil, cono, área o aura)
// y un aspecto fiel al manga/anime: brazos y piernas de goma de Luffy, tajos de Zoro,
// piernas negras y fuego de Sanji. El polvo y los restos dependen del mapa.
// Se carga después de game.js y antes de render.js.

// Paleta del entorno: polvo y restos que levanta cada impacto según el mapa
const VFX_MAP = {
    baratie:  { dust: ['#9a6b40', '#b98a5a', '#d6b58e'], debris: ['#6b4423', '#8b5a2b', '#a0703f'], debrisShape: 'chip' },
    alabasta: { dust: ['#e6c487', '#d8ad68', '#f2dcaa'], debris: ['#c99a55', '#e0b874', '#b8863e'], debrisShape: 'grain' },
    skypiea:  { dust: ['#ffffff', '#eef6ff', '#dbeafe'], debris: ['#ffffff', '#e0f2fe', '#f8fafc'], debrisShape: 'puff' },
    enieslobby: { dust: ['#d9c48f', '#c8b27a', '#ece0b8'], debris: ['#b89f68', '#d9c48f', '#9c8456'], debrisShape: 'chip' },
    marineford: { dust: ['#9aa79d', '#7a8a80', '#c5cec7'], debris: ['#6b7a70', '#8d9b91', '#56645b'], debrisShape: 'chip' },
    water7: { dust: ['#a3a8ad', '#8a9098', '#c9cdd1'], debris: ['#70767c', '#8a9098', '#5c6166'], debrisShape: 'chip' }
};
// Colores de personaje (anime): piel de Luffy, haki, pantalón negro de Sanji
const SKIN = '#f3c196', SKIN_DARK = '#a8693f', SKIN_G2 = '#f6a5a0';
const HAKI = '#1a1625', HAKI_SHEEN = '#6d4c9f';
const SUIT = '#1c1f26', SUIT_SHEEN = '#4b5563';

// Tipo de impacto de cada ataque (vis = arma compartida con dibujo propio)
const HIT_KIND = {
    pistol: 'rubber', gatling: 'rubber', bazooka: 'rubber', muchi: 'rubber', ono: 'rubber',
    santoryu: 'slash', onigiri: 'slash', flyingslash: 'slash', tatsumaki: 'slash', poundho: 'slash',
    diablejambe: 'fire', collier: 'kick', joueshot: 'kick', concasse: 'kick', partycourse: 'kick',
    knife: 'blade', rifle: 'bullet', bolt: 'blade', spear: 'blade', axe: 'blade',
    grenade: 'blast', shuriken: 'blade', haki: 'haki'
};

let groundDecals = [];
let _hitFxBudget = 0;

function vfxMap() { return VFX_MAP[selectedMap] || VFX_MAP.baratie; }
function vfxQ() { return (windowOpts && windowOpts.fewerParticles) ? 0.5 : 1; }
function vfxPick(arr) { return arr[(Math.random() * arr.length) | 0]; }
function vfxHash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function vfxEvolved(atk) { return !atk.vis && skills[atk.type] && skills[atk.type].evolved; }
function vfxProgress(atk) { return atk.maxLife ? Math.min(1, Math.max(0, 1 - atk.life / atk.maxLife)) : 0; }
function vfxTip(atk) {
    return [atk.startX + Math.cos(atk.angle) * atk.currentRange, atk.startY + Math.sin(atk.angle) * atk.currentRange];
}

// ---------- Partículas temáticas ----------
function fxDust(x, y, n, spread = 14, rise = 18) {
    const m = vfxMap(), c = Math.round(n * vfxQ());
    for (let k = 0; k < c; k++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 20 + Math.random() * 45;
        const life = 0.55 + Math.random() * 0.4;
        particles.push({ x: x + Math.cos(ang) * spread * Math.random(), y: y + Math.sin(ang) * spread * 0.45 * Math.random(),
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * 0.45 - rise, life: life, maxLife: life,
            color: vfxPick(m.dust), shape: 'smoke', size: 4 + Math.random() * 4, grow: 16 });
    }
}
function fxDebris(x, y, n, force = 120) {
    const m = vfxMap(), c = Math.round(n * vfxQ());
    for (let k = 0; k < c; k++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
        const sp = force * (0.5 + Math.random() * 0.7);
        const life = 0.45 + Math.random() * 0.35;
        if (m.debrisShape === 'puff') {
            particles.push({ x: x, y: y, vx: Math.cos(ang) * sp * 0.6, vy: Math.sin(ang) * sp * 0.4, life: life, maxLife: life, color: vfxPick(m.debris), shape: 'smoke', size: 3 + Math.random() * 3, grow: 10 });
        } else {
            particles.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: life, maxLife: life,
                color: vfxPick(m.debris), shape: m.debrisShape === 'chip' ? 'debris' : 'spark',
                size: m.debrisShape === 'chip' ? 2 + Math.random() * 2.5 : 1.6, grav: 420, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 18 });
        }
    }
}
function fxFlames(x, y, n, spread = 8, rise = 70, size = 6) {
    const c = Math.round(n * vfxQ());
    for (let k = 0; k < c; k++) {
        const life = 0.3 + Math.random() * 0.3;
        particles.push({ x: x + (Math.random() - 0.5) * spread * 2, y: y + (Math.random() - 0.5) * spread,
            vx: (Math.random() - 0.5) * 30, vy: -rise * (0.6 + Math.random() * 0.6), life: life, maxLife: life,
            color: '#f97316', shape: 'flame', size: size * (0.7 + Math.random() * 0.6) });
    }
}
function fxBlueFlames(x, y, n, spread = 8) {
    const c = Math.round(n * vfxQ());
    for (let k = 0; k < c; k++) {
        const life = 0.3 + Math.random() * 0.3;
        particles.push({ x: x + (Math.random() - 0.5) * spread * 2, y: y, vx: (Math.random() - 0.5) * 30, vy: -60 - Math.random() * 40, life: life, maxLife: life, color: '#38bdf8', shape: 'flame', blue: true, size: 6 });
    }
}
function fxSteam(x, y, n) {
    const c = Math.round(n * vfxQ());
    for (let k = 0; k < c; k++) {
        const life = 0.6 + Math.random() * 0.5;
        const side = Math.random() < 0.5 ? -1 : 1;
        particles.push({ x: x + side * (8 + Math.random() * 8), y: y + (Math.random() - 0.5) * 16, vx: side * (8 + Math.random() * 14), vy: -30 - Math.random() * 20,
            life: life, maxLife: life, color: '#f8fafc', shape: 'smoke', size: 2 + Math.random() * 2, grow: 9, alpha: 0.35 });
    }
}
function fxImpact(x, y, size = 12, color = '#ffffff', life = 0.16) {
    particles.push({ x: x, y: y, vx: 0, vy: 0, life: life, maxLife: life, color: color, shape: 'impact', size: size, rot: Math.random() * Math.PI });
}
function fxCut(x, y, ang, len = 26, color = '#ffffff', life = 0.22) {
    particles.push({ x: x, y: y, vx: 0, vy: 0, life: life, maxLife: life, color: color, shape: 'cut', size: len, rot: ang });
}
function fxStreaks(x, y, ang, n, len = 18, speed = 160, color = '#ffffff') {
    const c = Math.round(n * vfxQ());
    for (let k = 0; k < c; k++) {
        const a = ang + (Math.random() - 0.5) * 0.5;
        const life = 0.18 + Math.random() * 0.12;
        particles.push({ x: x + (Math.random() - 0.5) * 16, y: y + (Math.random() - 0.5) * 16, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
            life: life, maxLife: life, color: color, shape: 'streak', size: len });
    }
}
function fxBolt(x, y, ang, len, life = 0.22) {
    // rayo del Haoshoku: polilínea quebrada, negro con borde rojo
    const pts = [[0, 0]];
    const segs = 5 + ((Math.random() * 3) | 0);
    for (let s = 1; s <= segs; s++) {
        const d = len * s / segs, j = (s === segs ? 0 : (Math.random() - 0.5) * len * 0.28);
        pts.push([Math.cos(ang) * d - Math.sin(ang) * j, Math.sin(ang) * d + Math.cos(ang) * j]);
    }
    particles.push({ x: x, y: y, vx: 0, vy: 0, life: life, maxLife: life, color: '#ef4444', shape: 'bolt', pts: pts, size: 3 });
}
function fxDecal(x, y, kind, r, life = 1.4) {
    const rays = [];
    const n = kind === 'crack' ? 6 + ((Math.random() * 3) | 0) : 0;
    for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + Math.random() * 0.5;
        const pts = [[0, 0]];
        let px = 0, py = 0;
        const steps = 3;
        for (let s = 1; s <= steps; s++) {
            const aa = a + (Math.random() - 0.5) * 0.7, d = r * (0.35 + Math.random() * 0.25);
            px += Math.cos(aa) * d; py += Math.sin(aa) * d * 0.55;
            pts.push([px, py]);
        }
        rays.push(pts);
    }
    groundDecals.push({ x: x, y: y, kind: kind, r: r, life: life, maxLife: life, rays: rays });
    if (groundDecals.length > 30) groundDecals.shift();
}

// Impacto contra un enemigo: chispazo según el tipo de golpe + destello blanco del sprite
function vfxOnHit(atk, e, x, y) {
    if (e) e._flashUntil = gameTime + 0.08;
    if (_hitFxBudget <= 0) return;
    _hitFxBudget--;
    x = x === undefined ? e.x : x; y = y === undefined ? e.y : y;
    let kind = HIT_KIND[atk.vis || atk.type] || 'rubber';
    const evo = vfxEvolved(atk);
    if (evo && (atk.type === 'pistol' || atk.type === 'collier' || atk.type === 'concasse')) kind = 'fire';
    const ang = atk.angle !== undefined ? atk.angle : Math.atan2(y - player.y, x - player.x);
    if (kind === 'rubber') {
        fxImpact(x, y, 11, '#fffbe6');
        fxStreaks(x, y, ang, 2, 10, 120, '#fff7d6');
    } else if (kind === 'slash') {
        const zcol = '#eafff4';
        fxCut(x, y, ang + Math.PI / 2 + (Math.random() - 0.5) * 0.8, 30, zcol, 0.2);
        fxSpark(x, y, '#ffffff', 2, 110, 0.2, 1.6, 0);
    } else if (kind === 'kick') {
        fxImpact(x, y, 12, '#fff1d6');
        fxDust(x, y + 10, 1, 6, 10);
    } else if (kind === 'fire') {
        fxImpact(x, y, 12, '#ffd28a');
        fxFlames(x, y, 2, 6, 60, 5);
    } else if (kind === 'blade') {
        fxCut(x, y, ang + Math.PI / 2, 16, '#e5e7eb', 0.15);
        fxSpark(x, y, '#e5e7eb', 2, 120, 0.2, 1.4, 60);
    } else if (kind === 'bullet') {
        fxSpark(x, y, '#fde68a', 3, 140, 0.18, 1.5, 60);
    } else if (kind === 'blast') {
        fxSpark(x, y, '#fb923c', 2, 100, 0.25, 1.8, 80);
    } else if (kind === 'haki') {
        fxBolt(x, y - 4, Math.random() * Math.PI * 2, 18, 0.15);
    }
}

// Efectos al lanzar el ataque (se ejecuta una vez por ataque nuevo)
function vfxOnCast(atk) {
    if (!atk.maxLife && atk.life) atk.maxLife = atk.life;
    const evo = vfxEvolved(atk);
    const k = atk.vis || atk.type;
    if (k === 'santoryu' && atk.angle === undefined) {
        const t = getNearestEnemy();
        atk.angle = t ? Math.atan2(t.y - player.y, t.x - player.x) : (player.facing === 1 ? 0 : Math.PI);
    }
    switch (k) {
        case 'pistol':
            fxStreaks(player.x, player.y, atk.angle + Math.PI, 2, 12, 90, '#ffffff');
            break;
        case 'rifle':
            fxOrb(atk.startX + Math.cos(atk.angle) * 16, atk.startY + Math.sin(atk.angle) * 16, '#fde68a', 7, 0.08);
            fxDust(atk.startX + Math.cos(atk.angle) * 18, atk.startY + Math.sin(atk.angle) * 18, 2, 4, 4);
            break;
        case 'gatling':
            fxStreaks(player.x, player.y, player.facing === 1 ? 0 : Math.PI, 3, 14, 120, '#ffffff');
            break;
        case 'bazooka':
            atk.ox = player.x; atk.oy = player.y;
            atk.angle = Math.atan2(atk.y - player.y, atk.x - player.x);
            break;
        case 'grenade':
            atk.ox = player.x; atk.oy = player.y;
            break;
        case 'axe':
            atk.ox = player.x; atk.oy = player.y;
            break;
        case 'santoryu':
            fxSpark(player.x, player.y, '#ffffff', 4, 120, 0.25, 1.6, 0);
            break;
        case 'onigiri':
            break;
        case 'flyingslash':
            fxStreaks(player.x, player.y, atk.angle, 3, 14, 220, '#e0f2fe');
            break;
        case 'poundho':
            fxRing(player.x, player.y, '#dbeafe', 14, 0.25);
            fxStreaks(player.x, player.y, atk.angle, 5, 22, 260, '#dbeafe');
            fxDust(player.x, player.y + 14, 3, 10, 8);
            break;
        case 'tatsumaki':
            fxDust(player.x, player.y + 14, 5, 30, 20);
            break;
        case 'haki':
            for (let b = 0; b < 7; b++) fxBolt(player.x, player.y, (b / 7) * Math.PI * 2 + Math.random() * 0.4, atk.radius * (0.6 + Math.random() * 0.5), 0.3);
            cameraShake = Math.max(cameraShake, 1.2);
            break;
        case 'diablejambe':
            fxFlames(player.x, player.y + 12, evo ? 10 : 6, 8, 80, evo ? 8 : 6);
            break;
        case 'collier':
            fxStreaks(player.x, player.y, atk.angle, 3, 16, 200, '#ffffff');
            break;
        case 'joueshot':
            fxStreaks(player.x, player.y, atk.angle, 3, 16, 200, '#fed7aa');
            break;
        case 'partycourse':
            fxDust(player.x, player.y + 14, 4, 22, 12);
            break;
        case 'muchi':
            break;
    }
}

// Se llama una vez por frame desde update()
function vfxUpdate(dt) {
    _hitFxBudget = (windowOpts && windowOpts.fewerParticles) ? 6 : 14;
    for (let i = groundDecals.length - 1; i >= 0; i--) {
        groundDecals[i].life -= dt;
        if (groundDecals[i].life <= 0) groundDecals.splice(i, 1);
    }
    for (const atk of activeAttacks) {
        if (!atk._vfxInit) { atk._vfxInit = true; vfxOnCast(atk); }
        vfxTickAttack(atk, dt);
    }
    // Gear 2: vapor saliendo del cuerpo y piel rosada
    if (skills.gear2 && skills.gear2.active && Math.random() < dt * 14) fxSteam(player.x, player.y + 2, 1);
}

// Efectos continuos mientras el ataque está vivo (estelas, aterrizajes, fuego)
function vfxTickAttack(atk, dt) {
    const k = atk.vis || atk.type;
    const evo = vfxEvolved(atk);
    const p = vfxProgress(atk);
    if ((k === 'ono' || k === 'concasse') && !atk._landed && p >= 0.4) {
        // la pierna toca el suelo: cráter, grietas, polvo y restos del mapa
        atk._landed = true;
        const big = evo ? 1.4 : 1;
        fxRing(atk.x, atk.y, k === 'ono' ? '#fff3dc' : '#ffd8a8', 16 * big, 0.35);
        fxImpact(atk.x, atk.y, 22 * big, '#ffffff', 0.18);
        fxDecal(atk.x, atk.y, 'crack', atk.radius * 0.9, 1.6);
        fxDust(atk.x, atk.y, 8, atk.radius * 0.6, 22);
        fxDebris(atk.x, atk.y, 8, 160);
        if (k === 'concasse') { if (evo) fxBlueFlames(atk.x, atk.y, 6, 14); else fxFlames(atk.x, atk.y, 3, 10, 60, 5); }
        cameraShake = Math.max(cameraShake, 1.4 * big);
    } else if (k === 'bazooka' && !atk._landed && p >= 0.3) {
        atk._landed = true;
        fxImpact(atk.x, atk.y, evo ? 30 : 22, '#ffffff', 0.2);
        fxRing(atk.x, atk.y, '#ffffff', 14, 0.3);
        fxStreaks(atk.x, atk.y, atk.angle, 6, 24, 260, '#fff7d6');
        fxDust(atk.x, atk.y + 6, 6, atk.radius * 0.5, 16);
        fxDebris(atk.x, atk.y, 5, 140);
        cameraShake = Math.max(cameraShake, 1.2);
    } else if (k === 'grenade' && !atk._landed && p >= 0.35) {
        atk._landed = true;
        fxOrb(atk.x, atk.y, '#fff7c2', atk.radius * 0.5, 0.18);
        fxFlames(atk.x, atk.y, 6, atk.radius * 0.3, 90, 8);
        fxDust(atk.x, atk.y, 6, atk.radius * 0.5, 30);
        fxDebris(atk.x, atk.y, 6, 170);
        fxDecal(atk.x, atk.y, 'scorch', atk.radius * 0.7, 1.4);
        cameraShake = Math.max(cameraShake, 1.3);
    } else if (k === 'axe' && !atk._landed && p >= 0.45) {
        atk._landed = true;
        fxImpact(atk.x, atk.y, 18, '#ffffff', 0.16);
        fxDecal(atk.x, atk.y, 'crack', atk.radius * 0.7, 1.2);
        fxDust(atk.x, atk.y, 5, atk.radius * 0.4, 16);
        fxDebris(atk.x, atk.y, 5, 140);
        cameraShake = Math.max(cameraShake, 1.0);
    } else if (k === 'onigiri' && !atk._cutDone) {
        // Oni Giri: el corte aparece cuando Zoro ya ha pasado (dos tajos cruzados + uno horizontal)
        atk._cutDone = true;
        const a = atk.angle || 0, cx = atk.x, cy = atk.y, L = atk.radius * 2.2;
        const col = evo ? '#fecaca' : '#f0fff6';
        fxCut(cx, cy, a + 0.55, L, col, 0.4);
        fxCut(cx, cy, a - 0.55, L, col, 0.4);
        fxCut(cx, cy, a, L * 1.1, '#ffffff', 0.45);
        fxSpark(cx, cy, '#ffffff', 6, 160, 0.3, 1.6, 0);
    }
    if (k === 'diablejambe' && Math.random() < dt * 40) {
        const a = Math.random() * Math.PI * 2, r = atk.radius * (0.55 + Math.random() * 0.45);
        fxFlames(player.x + Math.cos(a) * r, player.y + 8 + Math.sin(a) * r * 0.55, 1, 3, 70, evo ? 8 : 6);
    } else if (k === 'tatsumaki' && Math.random() < dt * 25) {
        const a = Math.random() * Math.PI * 2;
        fxDebris(player.x + Math.cos(a) * atk.radius * 0.8, player.y + 12 + Math.sin(a) * atk.radius * 0.35, 1, 90);
    } else if (k === 'partycourse' && Math.random() < dt * 14) {
        fxDust(player.x, player.y + 14, 1, atk.radius * 0.5, 10);
    } else if (k === 'gatling' && evo && Math.random() < dt * 18) {
        fxSteam(player.x, player.y, 1);
    } else if (k === 'pistol' && evo && Math.random() < dt * 40) {
        const [tx, ty] = vfxTip(atk);
        fxFlames(tx, ty, 1, 4, 50, 6);
    } else if (k === 'collier' && evo && Math.random() < dt * 30) {
        const [tx, ty] = vfxTip(atk);
        fxFlames(tx, ty, 1, 4, 50, 5);
    } else if (k === 'joueshot' && Math.random() < dt * 30) {
        const [tx, ty] = vfxTip(atk);
        fxFlames(tx, ty, 1, 6, 40, 4);
    }
}

// ---------- Primitivas de dibujo ----------
function vfxLine(x0, y0, x1, y1) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }

// Extremidad de goma: contorno oscuro, relleno y brillo, con un leve vaivén elástico
function drawLimb(x0, y0, x1, y1, w, fill, outline, wobble = 0) {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
    drawLimbCurve(x0, y0, mx + nx * wobble, my + ny * wobble, x1, y1, w, fill, outline);
}
function drawLimbCurve(x0, y0, cx, cy, x1, y1, w, fill, outline) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = outline; ctx.lineWidth = w + 3;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
    ctx.strokeStyle = fill; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, w * 0.28);
    const o = -w * 0.22;
    ctx.beginPath(); ctx.moveTo(x0 + o, y0 + o); ctx.quadraticCurveTo(cx + o, cy + o, x1 + o, y1 + o); ctx.stroke();
    ctx.lineCap = 'butt';
}
function drawFist(x, y, ang, r, fill, outline) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = fill; ctx.strokeStyle = outline; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.92, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // nudillos y pulgar
    ctx.lineWidth = 1.2;
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(r * 0.35, k * r * 0.42 - r * 0.18); ctx.lineTo(r * 0.85, k * r * 0.42 - r * 0.1); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(-r * 0.05, r * 0.62, r * 0.45, r * 0.25, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
}
function drawPalm(x, y, ang, r, fill, outline) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = fill; ctx.strokeStyle = outline; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.7, r, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.lineCap = 'round'; ctx.lineWidth = r * 0.42;
    for (let k = 0; k < 4; k++) {
        const fy = -r * 0.75 + k * r * 0.5;
        ctx.strokeStyle = outline; ctx.lineWidth = r * 0.42 + 2; vfxLine(r * 0.3, fy, r * 1.1, fy);
        ctx.strokeStyle = fill; ctx.lineWidth = r * 0.42; vfxLine(r * 0.3, fy, r * 1.1, fy);
    }
    ctx.lineCap = 'butt';
    ctx.restore();
}
function drawSandal(x, y, ang, r) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = SKIN; ctx.strokeStyle = SKIN_DARK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.2, r * 0.75, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7c4a24';
    ctx.beginPath(); ctx.ellipse(-r * 0.1, r * 0.55, r * 1.25, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}
function drawShoe(x, y, ang, r, fire) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = fire ? '#7f1d1d' : '#0b0d12'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(r * 0.2, 0, r * 1.3, r * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(r * 0.55, -r * 0.25, r * 0.45, r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}
// Media luna de corte (convexa hacia +x tras rotar a "ang")
function drawCrescent(x, y, ang, r, thick, outer, inner, alpha = 1, arc = 1.15) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha *= alpha;
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(-r, 0, r * 1.6, -arc * 0.62, arc * 0.62);
    ctx.arc(-r - thick, 0, r * 1.6, arc * 0.6, -arc * 0.6, true);
    ctx.closePath(); ctx.fill();
    if (inner) {
        ctx.fillStyle = inner;
        ctx.beginPath();
        ctx.arc(-r, 0, r * 1.6, -arc * 0.5, arc * 0.5);
        ctx.arc(-r - thick * 0.4, 0, r * 1.6, arc * 0.48, -arc * 0.48, true);
        ctx.closePath(); ctx.fill();
    }
    ctx.restore();
}
function drawFlameShape(x, y, h, w, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.quadraticCurveTo(x + w, y - h * 0.35, x, y);
    ctx.quadraticCurveTo(x - w, y - h * 0.35, x, y - h);
    ctx.fill();
}
function drawFlameTongue(x, y, h, w, blue) {
    drawFlameShape(x, y, h, w, blue ? 'rgba(37,99,235,0.75)' : 'rgba(220,38,38,0.8)');
    drawFlameShape(x, y - h * 0.05, h * 0.75, w * 0.68, blue ? 'rgba(56,189,248,0.9)' : 'rgba(249,115,22,0.9)');
    drawFlameShape(x, y - h * 0.08, h * 0.45, w * 0.38, blue ? 'rgba(224,242,254,0.95)' : 'rgba(253,224,71,0.95)');
}
// Llama orientada: la punta apunta hacia "dir" (estelas de fuego detrás de un puño o pie)
function drawFlameDir(x, y, dir, h, w, blue) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(dir + Math.PI / 2);
    drawFlameTongue(0, 0, h, w, blue);
    ctx.restore();
}
function vfxShoulder(ang) { return [player.x + Math.cos(ang) * 6, player.y - 2 + Math.sin(ang) * 4]; }

// ---------- Dibujo de cada ataque ----------
function drawAttackFX(atk) {
    if (drawArsenalFX(atk)) return; // armas de js/arsenal.js
    const k = atk.vis || atk.type;
    const evo = vfxEvolved(atk);
    const p = vfxProgress(atk);
    ctx.save();
    switch (k) {
        case 'pistol': {
            // Gomu Gomu no Pistol: el brazo se estira hasta el objetivo y vuelve a su sitio
            const [sx, sy] = vfxShoulder(atk.angle);
            const ex = player.x + Math.cos(atk.angle) * atk.currentRange, ey = player.y + Math.sin(atk.angle) * atk.currentRange;
            const skin = evo ? HAKI : (skills.gear2.active ? SKIN_G2 : SKIN), out = evo ? '#000' : SKIN_DARK;
            const wob = atk.retracting ? Math.sin(gameTime * 60) * 4 : 0;
            if (!atk.retracting) {
                ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
                for (let s = -1; s <= 1; s += 2) {
                    const ox = -Math.sin(atk.angle) * 9 * s, oy = Math.cos(atk.angle) * 9 * s;
                    vfxLine(ex + ox - Math.cos(atk.angle) * 28, ey + oy - Math.sin(atk.angle) * 28, ex + ox - Math.cos(atk.angle) * 10, ey + oy - Math.sin(atk.angle) * 10);
                }
            }
            if (evo) {
                // Red Hawk: brazo de goma con el antebrazo cubierto de Haki y el puño en llamas
                const len = atk.currentRange, hk = Math.max(0, len - 34);
                const hx = player.x + Math.cos(atk.angle) * hk, hy = player.y + Math.sin(atk.angle) * hk;
                drawLimb(sx, sy, hx, hy, 6, SKIN, SKIN_DARK, wob);
                drawLimb(hx, hy, ex, ey, 7, HAKI, '#000');
                ctx.globalCompositeOperation = 'lighter';
                const g = ctx.createRadialGradient(ex, ey, 2, ex, ey, 22);
                g.addColorStop(0, 'rgba(255,200,80,0.9)'); g.addColorStop(0.5, 'rgba(239,68,68,0.5)'); g.addColorStop(1, 'rgba(127,29,29,0)');
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex, ey, 22, 0, Math.PI * 2); ctx.fill();
                const back = atk.retracting ? atk.angle : atk.angle + Math.PI;
                for (let f = -2; f <= 2; f++) {
                    const flick = 0.8 + 0.2 * Math.sin(gameTime * 30 + f * 2);
                    drawFlameDir(ex, ey, back + f * 0.35, (f === 0 ? 30 : 20) * flick, 7);
                }
                ctx.globalCompositeOperation = 'source-over';
                drawFist(ex, ey, atk.angle, 9, HAKI, '#000');
                ctx.strokeStyle = 'rgba(167,139,250,0.8)'; ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.arc(ex, ey, 6, -2.4, -1.2); ctx.stroke();
            } else {
                drawLimb(sx, sy, ex, ey, 6, skin, out, wob);
                drawFist(ex, ey, atk.angle, 8, skin, out);
            }
            break;
        }
        case 'knife': {
            // Cuchillo arrojadizo girando
            const [tx, ty] = vfxTip(atk);
            ctx.strokeStyle = 'rgba(226,232,240,0.35)'; ctx.lineWidth = 2;
            vfxLine(tx - Math.cos(atk.angle) * 26, ty - Math.sin(atk.angle) * 26, tx, ty);
            ctx.translate(tx, ty); ctx.rotate(gameTime * 22);
            ctx.fillStyle = '#e5e7eb'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, -2.5); ctx.lineTo(13, 0); ctx.lineTo(0, 2.5); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#6b3f1f'; ctx.fillRect(-8, -2, 8, 4);
            break;
        }
        case 'rifle': {
            // Bala con trazadora
            const [tx, ty] = vfxTip(atk);
            const g = ctx.createLinearGradient(tx - Math.cos(atk.angle) * 40, ty - Math.sin(atk.angle) * 40, tx, ty);
            g.addColorStop(0, 'rgba(253,230,138,0)'); g.addColorStop(1, 'rgba(255,251,235,1)');
            ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.lineCap = 'round';
            vfxLine(tx - Math.cos(atk.angle) * 40, ty - Math.sin(atk.angle) * 40, tx, ty);
            break;
        }
        case 'gatling': {
            // Gomu Gomu no Gatling: decenas de puñetazos a la vez (imágenes residuales a 30 fps)
            const n = Math.round((evo ? 16 : 11) * (atk.radius / 85));
            const frame = Math.floor(gameTime * (evo ? 40 : 28));
            const face = player.facing === 1 ? 0 : Math.PI;
            const fade = Math.min(1, atk.life / 0.2);
            const skin = (evo || skills.gear2.active) ? SKIN_G2 : SKIN;
            ctx.globalAlpha = 0.18 * fade;
            ctx.fillStyle = '#fff7e6';
            ctx.beginPath(); ctx.ellipse(player.x, player.y, atk.radius, atk.radius * 0.8, 0, 0, Math.PI * 2); ctx.fill();
            for (let i = 0; i < n; i++) {
                const h1 = vfxHash(frame * 31 + i), h2 = vfxHash(frame * 17 + i * 7);
                const a = h1 < 0.7 ? face + (h2 - 0.5) * 2.6 : h2 * Math.PI * 2;
                const r = atk.radius * (0.45 + vfxHash(frame + i * 13) * 0.55);
                const [sx, sy] = vfxShoulder(a);
                const ex = player.x + Math.cos(a) * r, ey = player.y + Math.sin(a) * r * 0.8;
                ctx.globalAlpha = (0.45 + 0.55 * vfxHash(i + frame * 3)) * fade;
                drawLimb(sx, sy, ex, ey, 4, skin, SKIN_DARK);
                drawFist(ex, ey, a, 6, skin, SKIN_DARK);
            }
            break;
        }
        case 'bazooka': {
            // Gomu Gomu no Bazooka: dos palmas a la vez contra el objetivo y onda de aire
            const ang = atk.angle;
            const ext = Math.min(1, p / 0.3);
            const back = p > 0.55 ? 1 - (p - 0.55) / 0.45 : 1;
            const reach = ext * back;
            const skin = skills.gear2.active ? SKIN_G2 : SKIN;
            if (reach > 0.05) {
                for (let s = -1; s <= 1; s += 2) {
                    const ox = -Math.sin(ang) * 7 * s, oy = Math.cos(ang) * 7 * s;
                    const [sx, sy] = vfxShoulder(ang);
                    const ex = sx + (atk.x - sx) * reach + ox, ey = sy + (atk.y - sy) * reach + oy;
                    drawLimb(sx + ox, sy + oy, ex, ey, 5, skin, SKIN_DARK);
                    drawPalm(ex, ey, ang, 7, skin, SKIN_DARK);
                }
            }
            if (p >= 0.3) {
                const q = (p - 0.3) / 0.7;
                ctx.globalAlpha = (1 - q) * 0.9;
                ctx.strokeStyle = evo ? '#fecaca' : '#ffffff'; ctx.lineWidth = 4 * (1 - q) + 1;
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y, atk.radius * (0.35 + 0.65 * q), atk.radius * (0.35 + 0.65 * q) * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = (1 - q) * 0.25;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y, atk.radius * (0.3 + 0.6 * q), atk.radius * (0.3 + 0.6 * q) * 0.7, 0, 0, Math.PI * 2); ctx.fill();
            } else {
                // telegrafía el punto de impacto
                ctx.globalAlpha = 0.35; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y, atk.radius, atk.radius * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
            }
            break;
        }
        case 'grenade': {
            // Granada: vuela en parábola y estalla en bola de fuego
            if (p < 0.35) {
                const q = p / 0.35;
                const gx = atk.ox + (atk.x - atk.ox) * q, gy = atk.oy + (atk.y - atk.oy) * q - Math.sin(q * Math.PI) * 50;
                ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.arc(gx, gy, 4.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fde68a'; ctx.fillRect(gx - 1, gy - 7, 2, 3);
            } else {
                const q = (p - 0.35) / 0.65;
                ctx.globalCompositeOperation = 'lighter';
                const r = atk.radius * (0.5 + 0.5 * q);
                const g = ctx.createRadialGradient(atk.x, atk.y, 0, atk.x, atk.y, r);
                g.addColorStop(0, `rgba(255,247,194,${0.9 * (1 - q)})`);
                g.addColorStop(0.4, `rgba(251,146,60,${0.75 * (1 - q)})`);
                g.addColorStop(1, 'rgba(220,38,38,0)');
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(atk.x, atk.y, r, 0, Math.PI * 2); ctx.fill();
            }
            break;
        }
        case 'axe': {
            // Hacha pirata: cae desde arriba y parte el suelo
            const q = Math.min(1, p / 0.45);
            const rot = -1.9 + q * 2.1;
            ctx.globalAlpha = p > 0.75 ? (1 - p) / 0.25 : 1;
            ctx.translate(atk.x - 6, atk.y + 6); ctx.rotate(rot);
            ctx.fillStyle = '#7c4a24'; ctx.fillRect(-2, -40, 4, 40);
            ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(2, -40); ctx.quadraticCurveTo(18, -34, 16, -20); ctx.lineTo(2, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
            if (q < 1) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 36, -Math.PI / 2 - 0.9, -Math.PI / 2 + 0.1); ctx.stroke(); }
            break;
        }
        case 'muchi': {
            // Gomu Gomu no Muchi: la pierna barre el abanico de lado a lado
            const span = 1.1;
            const q = Math.min(1, p / 0.75);
            const cur = atk.angle - span + q * span * 2;
            const R = atk.radius * 0.95;
            const fade = p > 0.75 ? 1 - (p - 0.75) / 0.25 : 1;
            const skin = (evo || skills.gear2.active) ? SKIN_G2 : SKIN;
            // estela del barrido
            ctx.globalAlpha = 0.55 * fade;
            const g = ctx.createRadialGradient(player.x, player.y, R * 0.3, player.x, player.y, R);
            g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, evo ? 'rgba(254,202,202,0.9)' : 'rgba(255,247,230,0.9)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(player.x, player.y);
            ctx.arc(player.x, player.y, R, atk.angle - span, cur); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 0.8 * fade;
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(player.x, player.y, R, Math.max(atk.angle - span, cur - 0.9), cur); ctx.stroke();
            if (q < 1) {
                const ex = player.x + Math.cos(cur) * R, ey = player.y + Math.sin(cur) * R;
                const hx = player.x, hy = player.y + 10;
                ctx.globalAlpha = fade;
                drawLimb(hx, hy, ex, ey, 6, skin, SKIN_DARK, 14);
                drawSandal(ex, ey, cur, 6);
            }
            break;
        }
        case 'ono': case 'concasse': {
            // Ono (Luffy, pierna de goma) / Concassé (Sanji, talón negro): cae a plomo desde arriba
            const isOno = k === 'ono';
            const fall = Math.min(1, p / 0.4);
            const H = 180;
            if (p < 0.4) {
                // sombra que crece en el suelo = aviso del impacto
                ctx.globalAlpha = 0.25 + 0.35 * fall;
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 6, atk.radius * (0.3 + 0.6 * fall), atk.radius * (0.3 + 0.6 * fall) * 0.45, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            }
            const footY = atk.y - H * (1 - fall * fall);
            const legAlpha = p < 0.55 ? 1 : Math.max(0, 1 - (p - 0.55) / 0.3);
            if (legAlpha > 0) {
                ctx.globalAlpha = legAlpha;
                ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
                for (let s = -1; s <= 1; s += 2) vfxLine(atk.x + s * 16, footY - 60, atk.x + s * 16, footY - 14);
                if (isOno) {
                    // la pierna de goma sube desde la cadera de Luffy, se arquea y cae como un hacha
                    const w = evo ? 20 : 8;
                    const skin = skills.gear2.active ? SKIN_G2 : SKIN;
                    const hx = player.x, hy = player.y + 8;
                    const cx = (hx + atk.x) / 2, cy = Math.min(hy, atk.y) - H - 60;
                    drawLimbCurve(hx, hy, cx, cy, atk.x, footY, w, skin, SKIN_DARK);
                    drawSandal(atk.x, footY, Math.PI / 2, w * 0.75);
                } else {
                    // Sanji salta y cae con el talón: imagen residual descendiendo sobre el objetivo
                    const set = CHAR_IMG[selectedCharacter];
                    const arr = set && (set.attack && set.attack.length ? set.attack : set.idle);
                    const img = arr && arr.length ? arr[0] : null;
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
                    vfxLine(atk.x, footY - 90, atk.x, footY - 30);
                    if (img && img.complete) {
                        ctx.save(); ctx.globalAlpha = legAlpha * 0.9;
                        const ph = 44 * SPRITE_ZOOM, pw = ph * (img.width / img.height);
                        ctx.drawImage(img, atk.x - pw / 2, footY - 30 - ph / 2, pw, ph);
                        ctx.restore();
                    }
                    drawLimb(atk.x, footY - 22, atk.x, footY, 7, SUIT, '#000');
                    ctx.globalCompositeOperation = 'lighter';
                    drawFlameDir(atk.x, footY, -Math.PI / 2, evo ? 26 : 16, evo ? 8 : 6, evo);
                    ctx.globalCompositeOperation = 'source-over';
                    drawShoe(atk.x, footY, Math.PI / 2, 6, false);
                }
            }
            if (p >= 0.4) {
                const q = (p - 0.4) / 0.6;
                ctx.globalAlpha = (1 - q) * 0.85;
                ctx.strokeStyle = isOno ? '#fff3dc' : '#fdba74'; ctx.lineWidth = 5 * (1 - q) + 1;
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y, atk.radius * (0.4 + 0.6 * q), atk.radius * (0.4 + 0.6 * q) * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
            }
            break;
        }
        case 'santoryu': {
            // Santoryu: tres tajos (dos manos + la boca) que barren hacia el objetivo
            const n = evo ? 9 : 3;
            const ang = atk.angle || 0;
            const q = Math.min(1, p / 0.55);
            const fade = p > 0.55 ? 1 - (p - 0.55) / 0.45 : 1;
            if (evo) {
                // Asura: aura oscura de nueve espadas
                ctx.globalAlpha = 0.3 * fade; ctx.fillStyle = '#3b0d2e';
                ctx.beginPath(); ctx.ellipse(player.x, player.y, atk.radius * 1.05, atk.radius * 0.8, 0, 0, Math.PI * 2); ctx.fill();
            }
            for (let i = 0; i < n; i++) {
                const off = (i - (n - 1) / 2) * (evo ? 0.32 : 0.42);
                const a = ang + off;
                const delay = (i % 3) * 0.12;
                const qq = Math.max(0, Math.min(1, (q - delay) / (1 - delay)));
                if (qq <= 0) continue;
                const R = atk.radius * (0.75 + (i % 3) * 0.12);
                const sweep = 1.3;
                const a0 = a - sweep / 2, a1 = a0 + sweep * qq;
                ctx.globalAlpha = fade;
                ctx.lineCap = 'round';
                ctx.strokeStyle = evo ? 'rgba(244,63,94,0.55)' : 'rgba(134,239,172,0.45)'; ctx.lineWidth = 7;
                ctx.beginPath(); ctx.arc(player.x, player.y, R, a0, a1); ctx.stroke();
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.arc(player.x, player.y, R, a0 + sweep * qq * 0.25, a1); ctx.stroke();
            }
            ctx.lineCap = 'butt';
            break;
        }
        case 'onigiri': {
            // Oni Giri: estela del dash (el corte en sí lo dibujan las partículas "cut")
            if (atk.sx !== undefined) {
                ctx.globalAlpha = Math.max(0, atk.life / atk.maxLife) * 0.8;
                const g = ctx.createLinearGradient(atk.sx, atk.sy, atk.x, atk.y);
                g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, evo ? 'rgba(254,202,202,0.95)' : 'rgba(240,255,246,0.95)');
                ctx.strokeStyle = g; ctx.lineWidth = 10; ctx.lineCap = 'round';
                vfxLine(atk.sx, atk.sy, atk.x, atk.y);
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
                vfxLine(atk.sx, atk.sy, atk.x, atk.y);
            }
            break;
        }
        case 'flyingslash': {
            // 36 Pound Ho: media luna de aire cortante que vuela
            const [tx, ty] = vfxTip(atk);
            ctx.globalAlpha = 0.5; ctx.strokeStyle = 'rgba(186,230,253,0.6)'; ctx.lineWidth = 1.5;
            for (let s = -1; s <= 1; s++) {
                const ox = -Math.sin(atk.angle) * 10 * s, oy = Math.cos(atk.angle) * 10 * s;
                vfxLine(tx + ox - Math.cos(atk.angle) * 50, ty + oy - Math.sin(atk.angle) * 50, tx + ox - Math.cos(atk.angle) * 14, ty + oy - Math.sin(atk.angle) * 14);
            }
            ctx.globalAlpha = 1;
            drawCrescent(tx, ty, atk.angle, evo ? 28 : 23, evo ? 10 : 8, evo ? 'rgba(125,211,252,0.85)' : 'rgba(186,230,253,0.8)', '#ffffff');
            break;
        }
        case 'shuriken': {
            const [tx, ty] = vfxTip(atk);
            ctx.translate(tx, ty); ctx.rotate(gameTime * 18);
            ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
            ctx.beginPath();
            for (let s = 0; s < 8; s++) { const r = s % 2 ? 3 : 10; const a = s * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill();
            break;
        }
        case 'poundho': {
            // 108 Pound Ho: tres medias lunas superpuestas (una por espada), enorme y perforante
            const [tx, ty] = vfxTip(atk);
            const big = evo ? 1.35 : 1;
            ctx.globalAlpha = 0.35;
            const g = ctx.createLinearGradient(atk.startX, atk.startY, tx, ty);
            g.addColorStop(0, 'rgba(186,230,253,0)'); g.addColorStop(1, 'rgba(186,230,253,0.8)');
            ctx.strokeStyle = g; ctx.lineWidth = 34 * big;
            vfxLine(atk.startX, atk.startY, tx, ty);
            ctx.globalAlpha = 1;
            for (let s = 2; s >= 0; s--) {
                const back = s * 9;
                drawCrescent(tx - Math.cos(atk.angle) * back, ty - Math.sin(atk.angle) * back, atk.angle,
                    (26 - s * 3) * big, 9 * big, s === 0 ? 'rgba(186,230,253,0.95)' : 'rgba(147,197,253,0.55)', s === 0 ? '#ffffff' : null);
            }
            break;
        }
        case 'bolt': {
            // Virote de ballesta
            const [tx, ty] = vfxTip(atk);
            ctx.translate(tx, ty); ctx.rotate(atk.angle);
            ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2.5; vfxLine(-22, 0, 0, 0);
            ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-1, -3.5); ctx.lineTo(-1, 3.5); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-17, -4); ctx.lineTo(-15, 0); ctx.lineTo(-17, 4); ctx.closePath(); ctx.fill();
            break;
        }
        case 'tatsumaki': {
            // Tatsumaki: tornado cortante alrededor de Zoro (tinte del polvo del mapa)
            const fade = Math.min(1, atk.life / 0.25) * Math.min(1, p / 0.1 + 0.2);
            const dust = vfxMap().dust[2];
            const layers = 7;
            ctx.lineCap = 'round';
            for (let l = 0; l < layers; l++) {
                const t = l / (layers - 1);
                const rx = atk.radius * (0.45 + 0.6 * t);
                const cy = player.y + 16 - t * 70;
                const ry = rx * 0.28;
                const spin = atk.spin * (1.2 - t * 0.3) + l;
                ctx.globalAlpha = fade * (0.55 - t * 0.25);
                ctx.strokeStyle = evo ? '#111827' : dust; ctx.lineWidth = 5 - t * 2;
                ctx.beginPath(); ctx.ellipse(player.x, cy, rx, ry, 0, spin, spin + 2.4); ctx.stroke();
                ctx.globalAlpha = fade * 0.9;
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.ellipse(player.x, cy, rx, ry, 0, spin + 3.1, spin + 4.1); ctx.stroke();
            }
            ctx.lineCap = 'butt';
            break;
        }
        case 'haki': {
            // Haoshoku Haki: onda de voluntad que se expande, oscura con borde rojo
            const fade = 1 - p;
            const r = atk.radius * (0.25 + 0.75 * Math.min(1, p * 1.6));
            ctx.globalAlpha = 0.22 * fade; ctx.fillStyle = '#0b0710';
            ctx.beginPath(); ctx.ellipse(player.x, player.y + 6, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.9 * fade; ctx.strokeStyle = '#0b0710'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.ellipse(player.x, player.y + 6, r, r * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(player.x, player.y + 6, r, r * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
            break;
        }
        case 'diablejambe': {
            // Diable Jambe: Sanji gira sobre una pierna hasta ponerla al rojo; anillo de fuego
            const fade = Math.max(0, atk.life / atk.maxLife);
            const n = Math.round((evo ? 16 : 11) * (atk.radius / 50));
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(player.x, player.y + 8, 0, player.x, player.y + 8, atk.radius);
            g.addColorStop(0, `rgba(253,186,116,${0.35 * fade})`); g.addColorStop(0.7, `rgba(234,88,12,${0.25 * fade})`); g.addColorStop(1, 'rgba(127,29,29,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(player.x, player.y + 8, atk.radius, atk.radius * 0.6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = fade;
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2 + gameTime * 3;
                const fx = player.x + Math.cos(a) * atk.radius * 0.8, fy = player.y + 8 + Math.sin(a) * atk.radius * 0.48;
                const flick = 0.75 + 0.25 * Math.sin(gameTime * 25 + i * 1.7);
                drawFlameTongue(fx, fy, (evo ? 26 : 18) * flick, evo ? 8 : 6, false);
            }
            ctx.globalCompositeOperation = 'source-over';
            break;
        }
        case 'collier': {
            // Collier Shoot: patada al cuello. La pierna de Sanji no se estira (no es de goma):
            // patada corta y la onda de aire de la patada llega hasta el objetivo
            const [tx, ty] = vfxTip(atk);
            const hx = player.x, hy = player.y + 6;
            const legLen = Math.min(atk.currentRange, 24);
            const fx = hx + Math.cos(atk.angle) * legLen, fy = hy + Math.sin(atk.angle) * legLen;
            ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(hx, hy, 22, atk.angle - 1.4, atk.angle - 0.15); ctx.stroke();
            drawLimb(hx, hy, fx, fy, 7, evo ? '#3f0d0d' : SUIT, '#000');
            if (evo) { ctx.globalCompositeOperation = 'lighter'; drawFlameDir(fx, fy, atk.angle + Math.PI, 16, 6); ctx.globalCompositeOperation = 'source-over'; }
            drawShoe(fx, fy, atk.angle, 5.5, evo);
            if (atk.currentRange > legLen + 4) drawCrescent(tx, ty, atk.angle, 12, 5, evo ? 'rgba(234,88,12,0.75)' : 'rgba(226,232,240,0.7)', '#ffffff');
            break;
        }
        case 'spear': {
            // Lanza de abordaje: estocada
            const [tx, ty] = vfxTip(atk);
            ctx.strokeStyle = '#7c4a24'; ctx.lineWidth = 3; ctx.lineCap = 'round';
            vfxLine(tx - Math.cos(atk.angle) * 60, ty - Math.sin(atk.angle) * 60, tx, ty);
            ctx.translate(tx, ty); ctx.rotate(atk.angle);
            ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(0, -4); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
            break;
        }
        case 'joueshot': {
            // Joue Shot: onda de la patada (media luna anaranjada con borde de fuego)
            const [tx, ty] = vfxTip(atk);
            ctx.globalAlpha = 0.5; ctx.strokeStyle = 'rgba(253,186,116,0.7)'; ctx.lineWidth = 1.5;
            for (let s = -1; s <= 1; s += 2) {
                const ox = -Math.sin(atk.angle) * 8 * s, oy = Math.cos(atk.angle) * 8 * s;
                vfxLine(tx + ox - Math.cos(atk.angle) * 40, ty + oy - Math.sin(atk.angle) * 40, tx + ox - Math.cos(atk.angle) * 10, ty + oy - Math.sin(atk.angle) * 10);
            }
            ctx.globalAlpha = 1;
            drawCrescent(tx, ty, atk.angle, evo ? 20 : 16, 7, 'rgba(234,88,12,0.85)', '#fff1d6');
            break;
        }
        case 'partycourse': {
            // Party Table Kick Course: Sanji sobre las manos, piernas girando como una hélice;
            // las patadas levantan un remolino de aire que llega hasta el borde del área
            const fade = Math.min(1, atk.life / 0.25);
            const R = 26, cy = player.y + 4;
            ctx.lineCap = 'round';
            for (let w = 0; w < 3; w++) {
                const a0 = atk.spin * 1.1 + w * Math.PI * 2 / 3;
                const rr = atk.radius * (0.55 + 0.15 * w);
                ctx.globalAlpha = fade * (0.55 - w * 0.12);
                ctx.strokeStyle = evo ? '#fdba74' : '#f1f5f9'; ctx.lineWidth = 3 - w * 0.6;
                ctx.beginPath(); ctx.ellipse(player.x, cy, rr, rr * 0.55, 0, a0, a0 + 1.6); ctx.stroke();
                ctx.globalAlpha = fade * 0.25;
                ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 6;
                ctx.beginPath(); ctx.ellipse(player.x, cy, rr * 0.92, rr * 0.92 * 0.55, 0, a0 - 0.2, a0 + 0.8); ctx.stroke();
            }
            ctx.lineCap = 'butt';
            for (let ghost = 3; ghost >= 0; ghost--) {
                const sp = atk.spin - ghost * 0.3;
                ctx.globalAlpha = fade * (ghost === 0 ? 1 : 0.2);
                for (let leg = 0; leg < 2; leg++) {
                    const a = sp + leg * Math.PI;
                    const ex = player.x + Math.cos(a) * R, ey = cy + Math.sin(a) * R * 0.55;
                    drawLimb(player.x, cy, ex, ey, 6, SUIT, '#000');
                    if (ghost === 0) drawShoe(ex, ey, a, 5, false);
                }
            }
            break;
        }
    }
    ctx.restore();
}

// Marcas en el suelo (grietas de Ono/Concassé, quemaduras de granada)
function drawGroundDecals() {
    for (const d of groundDecals) {
        const a = Math.min(1, d.life / (d.maxLife * 0.5));
        ctx.save(); ctx.translate(d.x, d.y);
        if (d.kind === 'crack') {
            ctx.globalAlpha = 0.25 * a; ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.ellipse(0, 0, d.r * 0.45, d.r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.65 * a; ctx.strokeStyle = 'rgba(20,12,6,0.9)'; ctx.lineWidth = 2;
            for (const ray of d.rays) { ctx.beginPath(); ray.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke(); }
            ctx.globalAlpha = 0.25 * a; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1;
            for (const ray of d.rays) { ctx.beginPath(); ray.forEach((pt, i) => i ? ctx.lineTo(pt[0] + 1, pt[1] + 1) : ctx.moveTo(pt[0] + 1, pt[1] + 1)); ctx.stroke(); }
        } else {
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, d.r);
            g.addColorStop(0, `rgba(15,10,8,${0.5 * a})`); g.addColorStop(1, 'rgba(15,10,8,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, d.r, d.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

// Aura del jugador por debajo del sprite (Gear 2, pie de Sanji encendido)
function drawPlayerAuraBack() {
    if (skills.gear2 && skills.gear2.active) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const pulse = 0.5 + 0.5 * Math.sin(gameTime * 10);
        const g = ctx.createRadialGradient(player.x, player.y, 4, player.x, player.y, 34);
        g.addColorStop(0, `rgba(251,113,133,${0.25 + 0.1 * pulse})`); g.addColorStop(1, 'rgba(251,113,133,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(player.x, player.y, 34, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    if (selectedCharacter === 'sanji' && skills.diablejambe && skills.diablejambe.level > 0 && Math.random() < 0.08) {
        fxFlames(player.x + (player.facing === 1 ? 4 : -4), player.y + 18, 1, 2, 40, 3);
    }
}
// Tinte rosado de Gear 2 sobre el sprite (se aplica con ctx.filter al dibujar al jugador)
function playerSpriteFilter() {
    if (skills.gear2 && skills.gear2.active) return 'saturate(1.3) sepia(0.25) hue-rotate(-20deg) brightness(1.08)';
    return 'none';
}

// Dibujo de todas las partículas
function drawParticles() {
    for (let p of particles) {
        // culling: fuera de pantalla no se dibuja (los rayos con puntos propios se dibujan siempre)
        if (!p.pts && !onScreen(p.x, p.y, 60 + (p.size || 0) * 2)) continue;
        const a = Math.max(0, p.life / (p.maxLife || 0.4));
        switch (p.shape) {
            case 'ring':
                ctx.globalAlpha = a * 0.85;
                ctx.strokeStyle = p.color; ctx.lineWidth = 3.5;
                ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2); ctx.stroke();
                break;
            case 'orb':
                ctx.globalAlpha = a * 0.9;
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.8, p.size * a), 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = a * 0.35;
                ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.8, p.size * a * 1.8), 0, Math.PI * 2); ctx.fill();
                break;
            case 'star': {
                ctx.globalAlpha = a; ctx.fillStyle = p.color;
                const s = Math.max(0.6, p.size * a);
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * 6);
                ctx.fillRect(-s, -s * 0.22, s * 2, s * 0.44);
                ctx.fillRect(-s * 0.22, -s, s * 0.44, s * 2);
                ctx.restore();
                break;
            }
            case 'ghost':
                if (p.img && p.img.complete) {
                    ctx.globalAlpha = a * 0.45;
                    ctx.save(); ctx.translate(p.x, p.y);
                    if (p.facing === 1) ctx.scale(-1, 1);
                    const ph = (p.size || 48) * SPRITE_ZOOM, pw = ph * (p.img.width / p.img.height);
                    ctx.drawImage(p.img, -pw / 2, -ph / 2, pw, ph);
                    ctx.restore();
                }
                break;
            case 'smoke':
                ctx.globalAlpha = a * (p.alpha || 0.55); ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2); ctx.fill();
                break;
            case 'debris':
                ctx.globalAlpha = Math.min(1, a * 1.5); ctx.fillStyle = p.color;
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot || 0);
                ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
                ctx.restore();
                break;
            case 'flame': {
                const t = 1 - a;
                ctx.globalAlpha = a;
                ctx.globalCompositeOperation = 'lighter';
                const h = p.size * (1.6 - t * 0.6), w = p.size * 0.55 * (1 - t * 0.4);
                drawFlameTongue(p.x, p.y, h, w, p.blue);
                ctx.globalCompositeOperation = 'source-over';
                break;
            }
            case 'streak': {
                ctx.globalAlpha = a; ctx.strokeStyle = p.color; ctx.lineWidth = 1.6;
                const sp = Math.hypot(p.vx, p.vy) || 1;
                vfxLine(p.x, p.y, p.x - p.vx / sp * p.size, p.y - p.vy / sp * p.size);
                break;
            }
            case 'impact': {
                // destello de golpe estilo manga: estrella dentada que se abre
                const t = 1 - a, r = p.size * (0.6 + t * 0.7);
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot || 0);
                ctx.globalAlpha = a;
                ctx.beginPath();
                for (let s = 0; s < 16; s++) { const rr = s % 2 ? r * 0.42 : r * (s % 4 ? 0.8 : 1.15); const an = s * Math.PI / 8; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
                ctx.closePath();
                ctx.fillStyle = p.color; ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
                ctx.restore();
                break;
            }
            case 'cut': {
                // línea de corte que se abre y se afina
                const t = 1 - a, L = p.size * Math.min(1, t * 4 + 0.3);
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot || 0);
                ctx.globalAlpha = a;
                ctx.fillStyle = 'rgba(134,239,172,0.35)';
                ctx.beginPath(); ctx.ellipse(0, 0, L / 2, 3.5 * a + 1, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.ellipse(0, 0, L / 2, 1.6 * a + 0.5, 0, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
                break;
            }
            case 'bolt': {
                ctx.save(); ctx.translate(p.x, p.y);
                ctx.globalAlpha = a; ctx.lineJoin = 'round';
                ctx.strokeStyle = p.color; ctx.lineWidth = 4;
                ctx.beginPath(); p.pts.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke();
                ctx.strokeStyle = '#0b0710'; ctx.lineWidth = 2;
                ctx.beginPath(); p.pts.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke();
                ctx.restore();
                break;
            }
            default:
                ctx.globalAlpha = a; ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.7, (p.size || 2) * a), 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}
