// === Efectos de la tripulación (Nami, Usopp, Chopper y Robin) ===
// Dibujo de sus técnicas (atk.type === 'crew', atk.look) y de sus armas iniciales (kabuto, thunder, clutch, impacto Roseo).
// Se carga después de crew.js: sustituye drawCrewFX y engancha drawArsenalFX / updateArsenalAttack para las partículas.
// Rendimiento: sin capas offscreen ni ctx.filter; degradados solo en explosiones (pocas a la vez);
// las partículas salen en la actualización, escaladas por cfxQ() (menos partículas / calidad baja).

const CFX_TAU = Math.PI * 2;
const CFX_SKIN = '#f2c39a', CFX_SKIN_D = '#7c2d12', CFX_SKIN_L = '#fde3c8';
const CFX_PETAL = ['#f9a8d4', '#fbcfe8', '#f472b6', '#fdf2f8'];
function cfxQ() { return vfxQ() * (lowFx() ? 0.5 : 1); }
function cfxRate(perSec, dt) { return Math.random() < perSec * dt * cfxQ(); }
// Las partículas usan su propio generador: así no gastan números del Math.random de la partida
// (el benchmark y el bot de balance siguen siendo deterministas y comparables con versiones anteriores).
let _cfxSeed = 0x9e3779b9;
function cfxRand() { _cfxSeed = (_cfxSeed * 1664525 + 1013904223) >>> 0; return _cfxSeed / 4294967296; }
function cfxIsolated(fn, a, b) { const r = Math.random; Math.random = cfxRand; try { fn(a, b); } finally { Math.random = r; } }
function cfxN(n) { return Math.max(1, Math.round(n * cfxQ())); }

// ---------- Partículas propias ----------
function cfxPetals(x, y, n, speed = 70, cols = CFX_PETAL) {
    for (let k = 0, c = cfxN(n); k < c; k++) {
        const ang = Math.random() * CFX_TAU, sp = speed * (0.4 + Math.random() * 0.8), life = 0.6 + Math.random() * 0.5;
        particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * 0.7 - 30, life, maxLife: life, color: vfxPick(cols),
            shape: 'petal', size: 2.6 + Math.random() * 1.8, grav: 40, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14 });
    }
}
function cfxPuff(x, y, color, size, vx = 0, vy = -20, life = 0.7, alpha = 0.45, grow = 14) {
    particles.push({ x, y, vx, vy, life, maxLife: life, color, shape: 'smoke', size, grow, alpha });
}
// Trazo de velocidad que se queda atrás del proyectil
function cfxTrail(x, y, ang, len, color) {
    const life = 0.16 + Math.random() * 0.08, s = 40 + Math.random() * 40;
    particles.push({ x, y, vx: Math.cos(ang) * s, vy: Math.sin(ang) * s, life, maxLife: life, color, shape: 'streak', size: len });
}

// ---------- Piezas de dibujo ----------
// Brazo Hana Hana: brazo con contorno, brillo y mano abierta al final
function cfxHand(x, y, ang, s, open) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
        ctx.strokeStyle = pass ? CFX_SKIN : CFX_SKIN_D;
        const w = s * 0.55 + (pass ? 0 : 1.6);
        ctx.lineWidth = w;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
            const fy = (k - 1.5) * s * 0.36, fa = (k - 1.5) * 0.28 * open;
            ctx.moveTo(s * 0.4, fy); ctx.lineTo(s * 0.4 + Math.cos(fa) * s * 1.05, fy + Math.sin(fa) * s * 1.05);
        }
        ctx.moveTo(0, -s * 0.5); ctx.lineTo(s * 0.35, -s * (0.9 + 0.3 * open)); // pulgar
        ctx.stroke();
        ctx.fillStyle = pass ? CFX_SKIN : CFX_SKIN_D;
        ctx.beginPath(); ctx.ellipse(s * 0.25, 0, s * 0.62 + (pass ? 0 : 0.8), s * 0.7 + (pass ? 0 : 0.8), 0, 0, CFX_TAU); ctx.fill();
    }
    ctx.restore();
}
function cfxArm(x0, y0, x1, y1, w, open = 1) {
    const ang = Math.atan2(y1 - y0, x1 - x0), len = Math.hypot(x1 - x0, y1 - y0);
    ctx.lineCap = 'round';
    ctx.strokeStyle = CFX_SKIN_D; ctx.lineWidth = w + 2; vfxLine(x0, y0, x1, y1);
    ctx.strokeStyle = CFX_SKIN; ctx.lineWidth = w; vfxLine(x0, y0, x1, y1);
    if (len > 10 && w >= 3) {
        const nx = -Math.sin(ang) * w * 0.22, ny = Math.cos(ang) * w * 0.22;
        ctx.strokeStyle = CFX_SKIN_L; ctx.lineWidth = Math.max(1, w * 0.3);
        vfxLine(x0 + (x1 - x0) * 0.2 - nx, y0 + (y1 - y0) * 0.2 - ny, x0 + (x1 - x0) * 0.75 - nx, y0 + (y1 - y0) * 0.75 - ny);
    }
    cfxHand(x1, y1, ang, w * 1.05, open);
}
// Flor que se abre donde brota un brazo (pétalos en anillo)
function cfxBloom(x, y, r, alpha) {
    if (alpha <= 0.02 || r < 1) return;
    ctx.globalAlpha = alpha; ctx.fillStyle = '#f9a8d4';
    ctx.beginPath();
    for (let k = 0; k < 5; k++) { const a = k / 5 * CFX_TAU; ctx.moveTo(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 0.8); ctx.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.5, r * 0.7, r * 0.4, a, 0, CFX_TAU); }
    ctx.fill();
    ctx.fillStyle = '#fdf2f8'; ctx.beginPath(); ctx.ellipse(x, y, r * 0.45, r * 0.25, 0, 0, CFX_TAU); ctx.fill();
}
// Flor de cerezo de cinco pétalos con muesca (la huella Kokutei de Chopper)
function cfxSakura(x, y, R, rot, fill, line) {
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
        const a = rot + k / 5 * CFX_TAU, c = Math.cos, s = Math.sin;
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + c(a - 0.55) * R * 1.05, y + s(a - 0.55) * R * 1.05, x + c(a - 0.14) * R, y + s(a - 0.14) * R);
        ctx.lineTo(x + c(a) * R * 0.8, y + s(a) * R * 0.8);
        ctx.lineTo(x + c(a + 0.14) * R, y + s(a + 0.14) * R);
        ctx.quadraticCurveTo(x + c(a + 0.55) * R * 1.05, y + s(a + 0.55) * R * 1.05, x, y);
    }
    if (line) { ctx.strokeStyle = line; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.fillStyle = fill; ctx.fill();
}
// Nube de varias bolas en un solo trazado (sin zonas más oscuras donde se solapan)
const CFX_CLOUD = [[-0.62, 0.12, 0.3], [-0.32, -0.1, 0.4], [0.05, -0.2, 0.44], [0.4, -0.06, 0.36], [0.66, 0.14, 0.26], [-0.12, 0.14, 0.36], [0.28, 0.16, 0.32]];
function cfxCloudPath(cx, cy, R, wob, t, k = 1, dy = 0) {
    ctx.beginPath();
    for (let i = 0; i < CFX_CLOUD.length; i++) {
        const [px, py, pr] = CFX_CLOUD[i], x = cx + px * R, y = cy + py * R * 0.75 + dy + Math.sin(t * 2.2 + i * 1.7) * wob, r = pr * R * k;
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, CFX_TAU);
    }
}
function cfxCloud(cx, cy, R, body, light, dark, t, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#0b1120'; cfxCloudPath(cx, cy + 1.5, R * 1.04, 1.5, t); ctx.fill();   // contorno
    ctx.fillStyle = body; cfxCloudPath(cx, cy, R, 1.5, t); ctx.fill();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.2, R * 0.72, R * 0.16, 0, 0, CFX_TAU); ctx.fill(); // panza
    ctx.globalAlpha = alpha * 0.8; ctx.fillStyle = light; cfxCloudPath(cx - R * 0.06, cy, R * 0.9, 1.5, t, 0.62, -R * 0.12); ctx.fill(); // brillo de arriba
}
// Rayo determinista (semilla) con halo y núcleo blanco
function cfxBolt(x0, y0, x1, y1, seed, glow, alpha, w = 1) {
    const n = 6, pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (let k = 1; k < n; k++) { const j = (vfxHash(seed + k * 3.1) - 0.5) * L * 0.22; pts.push([x0 + dx * k / n + nx * j, y0 + dy * k / n + ny * j]); }
    pts.push([x1, y1]);
    const path = () => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.45; ctx.strokeStyle = glow; ctx.lineWidth = 7 * w; path(); ctx.stroke();
    ctx.globalAlpha = alpha; ctx.lineWidth = 3 * w; path(); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3 * w; path(); ctx.stroke();
    // rama corta
    const b = pts[3], ba = Math.atan2(dy, dx) + (vfxHash(seed + 9) < 0.5 ? 0.7 : -0.7);
    ctx.strokeStyle = glow; ctx.lineWidth = 1.6 * w; ctx.globalAlpha = alpha * 0.8;
    ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] + Math.cos(ba) * L * 0.18, b[1] + Math.sin(ba) * L * 0.18); ctx.lineTo(b[0] + Math.cos(ba + 0.4) * L * 0.3, b[1] + Math.sin(ba + 0.4) * L * 0.3); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
}
function cfxFade(atk, inK = 6, outK = 3) { return Math.max(0, Math.min(1, atk.life * outK, (atk.maxLife - atk.life) * inK)); }

// ---------- Técnicas de la tripulación ----------
drawCrewFX = function (atk) {
    const p = atk.maxLife ? Math.min(1, Math.max(0, 1 - atk.life / atk.maxLife)) : 0, a = 1 - p, t = gameTime;
    ctx.save();
    switch (atk.look) {
        case 'gust': {
            // Gust Sword: chorro de aire comprimido · Milky Arrow: flecha de nube Milky Road
            ctx.translate(atk.x, atk.y); ctx.rotate(atk.ang);
            const W = atk.w, L = W * 2.4;
            if (atk.evo) {
                ctx.strokeStyle = '#9d174d'; ctx.lineWidth = 3; ctx.fillStyle = '#fdf2f8';
                ctx.beginPath();
                for (let k = 0; k < 6; k++) { const x = -L + k * L / 5.5, r = W * (0.16 + 0.04 * Math.sin(k * 2 + t * 9)); ctx.moveTo(x + r, Math.sin(k * 1.7) * 2); ctx.arc(x, Math.sin(k * 1.7) * 2, r, 0, CFX_TAU); }
                ctx.moveTo(W * 0.95, 0); ctx.lineTo(W * 0.05, -W * 0.5); ctx.lineTo(W * 0.25, 0); ctx.lineTo(W * 0.05, W * 0.5); ctx.closePath();
                ctx.stroke(); ctx.fill();
                ctx.fillStyle = '#fbcfe8'; ctx.beginPath(); ctx.moveTo(W * 0.8, 0); ctx.lineTo(W * 0.15, -W * 0.3); ctx.lineTo(W * 0.3, 0); ctx.closePath(); ctx.fill();
            } else {
                const shape = (k) => { ctx.beginPath(); ctx.moveTo(W * 0.9, 0); ctx.quadraticCurveTo(0, -W * 0.42 * k, -L, -W * 0.1 * k); ctx.lineTo(-L, W * 0.1 * k); ctx.quadraticCurveTo(0, W * 0.42 * k, W * 0.9, 0); };
                ctx.globalAlpha = 0.4; ctx.fillStyle = '#7dd3fc'; shape(1); ctx.fill();
                ctx.globalAlpha = 0.95; ctx.fillStyle = '#f0f9ff'; shape(0.45); ctx.fill();
                ctx.globalAlpha = 0.9; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 1.5;
                for (const s of [-1, 1]) {
                    ctx.beginPath();
                    for (let x = -L * 0.85; x <= W * 0.6; x += 5) { const tap = (x + L) / (L + W); ctx.lineTo(x, s * W * 0.32 * (1 - tap * 0.7) * Math.sin(x * 0.22 - t * 32)); }
                    ctx.stroke();
                }
            }
            break;
        }
        case 'tornado': {
            // Tornado Tempo: las dos piezas del Clima-Tact giran unidas por la cuerda dentro de un remolino
            ctx.translate(atk.x, atk.y);
            const W = atk.w, s = atk.spin;
            ctx.globalAlpha = 0.16; ctx.fillStyle = atk.evo ? '#a5f3fc' : '#e0f2fe';
            ctx.beginPath(); ctx.arc(0, 0, W, 0, CFX_TAU); ctx.fill();
            ctx.lineCap = 'round';
            const rings = atk.evo ? 5 : 3;
            for (let k = 0; k < rings; k++) {
                const st = -s * 1.2 + k * 2.1, rr = W * (0.5 + k * (0.55 / rings));
                ctx.globalAlpha = 0.85 - k * 0.12; ctx.strokeStyle = k % 2 ? (atk.evo ? '#67e8f9' : '#bae6fd') : '#f8fafc'; ctx.lineWidth = 3 - k * 0.35;
                ctx.beginPath(); ctx.arc(0, 0, rr, st, st + 2.3); ctx.stroke();
                ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, rr, st + 2.6, st + 3.3); ctx.stroke();
            }
            const d = W * 0.4, ends = [];
            for (let i = 0; i < 2; i++) { const an = s * 1.6 + i * Math.PI; ends.push([Math.cos(an) * d, Math.sin(an) * d * 0.8, an]); }
            ctx.globalAlpha = 0.9; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; vfxLine(ends[0][0], ends[0][1], ends[1][0], ends[1][1]);
            for (const [x, y, an] of ends) {
                const ux = Math.cos(an + Math.PI / 2) * 8, uy = Math.sin(an + Math.PI / 2) * 8;
                ctx.globalAlpha = 1;
                ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 6.5; vfxLine(x - ux, y - uy, x + ux, y + uy);
                ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 4; vfxLine(x - ux, y - uy, x + ux, y + uy);
                ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 1.5; vfxLine(x - ux * 0.6, y - uy * 0.6 - 1, x + ux * 0.2, y + uy * 0.2 - 1);
                ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(x + ux, y + uy, 2.2, 0, CFX_TAU); ctx.fill();
            }
            break;
        }
        case 'cloud': {
            // Thunder Breed Tempo: nube de tormenta con panza oscura y rayos al suelo
            const fade = cfxFade(atk), cy = atk.y - 72, R = atk.r * 0.85;
            ctx.globalAlpha = 0.25 * fade; ctx.fillStyle = '#0f172a';
            ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 6, atk.r * 0.9, atk.r * 0.4, 0, 0, CFX_TAU); ctx.fill();
            const fl = atk.flash ? atk.flash / 0.15 : 0, glow = atk.evo ? '#facc15' : '#7dd3fc';
            if (fl > 0) {
                ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * fl * fade; ctx.fillStyle = glow;
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 4, atk.r * 0.8, atk.r * 0.34, 0, 0, CFX_TAU); ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
            }
            cfxCloud(atk.x, cy, R, atk.evo ? '#475569' : '#334155', atk.evo ? '#94a3b8' : '#64748b', '#1e293b', t, 0.95 * fade);
            if (fl > 0) {
                ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.4 * fl * fade; ctx.fillStyle = glow;
                ctx.beginPath(); ctx.ellipse(atk.x, cy, R * 0.5, R * 0.25, 0, 0, CFX_TAU); ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
                for (const b of (atk._strikes || [])) cfxBolt(atk.x + b[0] * 0.3, cy + R * 0.15, b[0] + atk.x, b[1] + atk.y, b[2], glow, fl * fade, atk.evo ? 1.3 : 1);
            }
            break;
        }
        case 'rain': {
            // Rain Tempo: nube pequeña, lluvia inclinada, salpicaduras y charco · Fog Tempo: niebla
            const fade = cfxFade(atk), R = atk.r, cy = atk.y - 80;
            ctx.globalAlpha = 0.14 * fade; ctx.fillStyle = '#38bdf8';
            ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 6, R, R * 0.6, 0, 0, CFX_TAU); ctx.fill();
            ctx.globalAlpha = 0.35 * fade; ctx.strokeStyle = '#bae6fd'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.strokeStyle = atk.evo ? '#f1f5f9' : '#bfdbfe'; ctx.lineWidth = 1.3;
            const n = Math.round(26 * (lowFx() ? 0.6 : 1)), H = 70;
            ctx.beginPath();
            const splash = [];
            for (let k = 0; k < n; k++) {
                const ang = k * 2.39996, rr = R * Math.sqrt(((k * 37) % n + 0.5) / n);
                const gx = atk.x + Math.cos(ang) * rr, gy = atk.y + 6 + Math.sin(ang) * rr * 0.6, ph = (t * 2.4 + k * 0.37) % 1;
                const y = gy - (1 - ph) * H, x = gx + (1 - ph) * H * 0.25;
                ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 11);
                if (ph > 0.82) splash.push(gx, gy, (ph - 0.82) / 0.18);
            }
            ctx.globalAlpha = 0.75 * fade; ctx.stroke();
            ctx.lineWidth = 1;
            for (let i = 0; i < splash.length; i += 3) { ctx.globalAlpha = (1 - splash[i + 2]) * 0.8 * fade; ctx.beginPath(); ctx.ellipse(splash[i], splash[i + 1], 1 + splash[i + 2] * 5, 0.6 + splash[i + 2] * 2, 0, 0, CFX_TAU); ctx.stroke(); }
            if (atk.evo) {
                ctx.fillStyle = '#f8fafc';
                for (let k = 0; k < 6; k++) { const an = k * 1.05 + t * 0.4; ctx.globalAlpha = 0.16 * fade; ctx.beginPath(); ctx.arc(atk.x + Math.cos(an) * R * 0.6, atk.y + Math.sin(an) * R * 0.35, R * 0.4, 0, CFX_TAU); ctx.fill(); }
            }
            cfxCloud(atk.x, cy, Math.min(60, R * 0.5), atk.evo ? '#e2e8f0' : '#94a3b8', '#f1f5f9', '#64748b', t, 0.85 * fade);
            break;
        }
        case 'fire': {
            // suelo en llamas que deja Kaen Boshi (verde con la Skull Bomb Grass)
            const fade = cfxFade(atk, 6, 2);
            ctx.globalAlpha = 0.35 * fade; ctx.fillStyle = atk.evo ? '#052e16' : '#431407';
            ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 4, atk.r, atk.r * 0.5, 0, 0, CFX_TAU); ctx.fill();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = (0.22 + 0.06 * Math.sin(t * 13)) * fade; ctx.fillStyle = atk.evo ? '#22c55e' : '#f97316';
            ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 4, atk.r * 0.75, atk.r * 0.36, 0, 0, CFX_TAU); ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            break;
        }
        case 'tabasco': {
            const fade = cfxFade(atk), R = atk.r;
            if (atk.evo) {
                // Midori Boshi: Rafflesia — flor gigante que suelta un hedor insoportable
                ctx.globalAlpha = 0.3 * fade; ctx.fillStyle = '#a3e635';
                ctx.beginPath(); for (let k = 0; k < 7; k++) { const an = k / 7 * CFX_TAU + t * 0.5, x = atk.x + Math.cos(an) * R * 0.55, y = atk.y + Math.sin(an) * R * 0.35, r = R * 0.38; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, CFX_TAU); } ctx.fill();
                const fr = Math.min(R * 0.4, 26) * Math.min(1, (atk.maxLife - atk.life) * 5);
                ctx.globalAlpha = 0.85 * fade;
                ctx.fillStyle = '#3f0d0d'; ctx.beginPath(); for (let k = 0; k < 5; k++) { const an = k / 5 * CFX_TAU - Math.PI / 2, x = atk.x + Math.cos(an) * fr * 0.62, y = atk.y + Math.sin(an) * fr * 0.45; ctx.moveTo(x + fr * 0.5, y); ctx.ellipse(x, y, fr * 0.5, fr * 0.38, an, 0, CFX_TAU); } ctx.fill();
                ctx.fillStyle = '#b91c1c'; ctx.beginPath(); for (let k = 0; k < 5; k++) { const an = k / 5 * CFX_TAU - Math.PI / 2, x = atk.x + Math.cos(an) * fr * 0.62, y = atk.y + Math.sin(an) * fr * 0.45; ctx.moveTo(x + fr * 0.44, y); ctx.ellipse(x, y, fr * 0.44, fr * 0.32, an, 0, CFX_TAU); } ctx.fill();
                ctx.fillStyle = '#fef3c7';
                for (let k = 0; k < 10; k++) { const an = k * 2.2, d = fr * (0.45 + (k % 3) * 0.17); ctx.beginPath(); ctx.arc(atk.x + Math.cos(an) * d, atk.y + Math.sin(an) * d * 0.72, 1.3 + (k % 2), 0, CFX_TAU); ctx.fill(); }
                ctx.fillStyle = '#450a0a'; ctx.beginPath(); ctx.ellipse(atk.x, atk.y, fr * 0.36, fr * 0.24, 0, 0, CFX_TAU); ctx.fill();
                ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 1.5; ctx.stroke();
                ctx.strokeStyle = '#65a30d'; ctx.lineWidth = 2; ctx.globalAlpha = 0.7 * fade;
                for (let k = 0; k < 3; k++) { const x0 = atk.x - 14 + k * 14, ph = (t * 0.9 + k * 0.33) % 1; ctx.globalAlpha = 0.7 * fade * (1 - ph); ctx.beginPath(); for (let j = 0; j <= 6; j++) ctx.lineTo(x0 + Math.sin(j * 1.3 + t * 5 + k) * 4, atk.y - 10 - ph * 30 - j * 5); ctx.stroke(); }
            } else {
                // Tabasco Boshi: nube picante roja
                ctx.globalAlpha = 0.5 * fade; ctx.fillStyle = '#dc2626';
                ctx.beginPath(); for (let k = 0; k < 7; k++) { const an = k / 7 * CFX_TAU + t * 0.6, x = atk.x + Math.cos(an) * R * 0.48, y = atk.y + Math.sin(an) * R * 0.3, r = R * (0.4 + 0.05 * Math.sin(t * 3 + k)); ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, CFX_TAU); } ctx.fill();
                ctx.globalAlpha = 0.4 * fade; ctx.fillStyle = '#fb923c';
                ctx.beginPath(); for (let k = 0; k < 4; k++) { const an = k / 4 * CFX_TAU - t * 0.9, x = atk.x + Math.cos(an) * R * 0.28, y = atk.y - R * 0.1 + Math.sin(an) * R * 0.18, r = R * 0.26; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, CFX_TAU); } ctx.fill();
                ctx.globalAlpha = 0.5 * fade; ctx.fillStyle = '#fecaca';
                ctx.beginPath(); for (let k = 0; k < 3; k++) { const x = atk.x - R * 0.3 + k * R * 0.28, y = atk.y - R * 0.3 + Math.sin(t * 4 + k) * 2, r = R * 0.12; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, CFX_TAU); } ctx.fill();
            }
            break;
        }
        case 'kaen': {
            const el = atk.maxLife - atk.life;
            if (el < atk.delay) {
                // la estrella de fuego cae sobre el objetivo
                const q = el / atk.delay, bx = atk.x - 34 * (1 - q), by = atk.y - 56 * (1 - q * q);
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.5; ctx.strokeStyle = atk.evo ? '#4ade80' : '#fb923c'; ctx.lineWidth = 5; ctx.lineCap = 'round';
                vfxLine(bx, by, bx - 12, by - 14);
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1; ctx.fillStyle = atk.evo ? '#166534' : '#c2410c'; ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(bx, by, 5, 0, CFX_TAU); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(bx - 1.5, by - 1.5, 1.6, 0, CFX_TAU); ctx.fill();
            } else {
                const q = Math.min(1, (el - atk.delay) / Math.max(0.05, atk.maxLife - atk.delay)), e = 1 - (1 - q) * (1 - q), R = atk.r;
                const c1 = atk.evo ? 'rgba(220,252,231,1)' : 'rgba(255,247,173,1)', c2 = atk.evo ? 'rgba(34,197,94,0.85)' : 'rgba(249,115,22,0.85)', c3 = atk.evo ? 'rgba(20,83,45,0)' : 'rgba(185,28,28,0)';
                const g = ctx.createRadialGradient(atk.x, atk.y, 1, atk.x, atk.y, R * (0.45 + 0.55 * e));
                g.addColorStop(0, c1); g.addColorStop(0.45, c2); g.addColorStop(1, c3);
                ctx.globalAlpha = 1 - q * 0.9; ctx.fillStyle = g;
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y, R * (0.45 + 0.55 * e), R * (0.45 + 0.55 * e) * 0.8, 0, 0, CFX_TAU); ctx.fill();
                ctx.globalAlpha = (1 - q) * 0.9; ctx.strokeStyle = atk.evo ? '#bbf7d0' : '#fed7aa'; ctx.lineWidth = 3.5 * (1 - q) + 0.5;
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 4, R * (0.4 + 0.8 * e), R * (0.4 + 0.8 * e) * 0.55, 0, 0, CFX_TAU); ctx.stroke();
                if (q < 0.22) { ctx.globalAlpha = 1 - q / 0.22; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(atk.x, atk.y, R * 0.3 * (1 - q * 2), 0, CFX_TAU); ctx.fill(); }
                if (atk.evo && q < 0.75) {
                    // Skull Bomb Grass: la explosión toma forma de calavera
                    const s = R * 0.42 * (0.7 + 0.3 * e), sy = atk.y - R * 0.25 - q * 14;
                    ctx.globalAlpha = (1 - q / 0.75) * 0.9; ctx.fillStyle = '#dcfce7';
                    ctx.beginPath(); ctx.arc(atk.x, sy, s, 0, CFX_TAU); ctx.fill(); ctx.fillRect(atk.x - s * 0.55, sy + s * 0.6, s * 1.1, s * 0.5);
                    ctx.fillStyle = '#052e16';
                    ctx.beginPath(); ctx.ellipse(atk.x - s * 0.38, sy, s * 0.24, s * 0.3, 0, 0, CFX_TAU); ctx.ellipse(atk.x + s * 0.38, sy, s * 0.24, s * 0.3, 0, 0, CFX_TAU); ctx.fill();
                    ctx.beginPath(); ctx.moveTo(atk.x, sy + s * 0.3); ctx.lineTo(atk.x - s * 0.12, sy + s * 0.5); ctx.lineTo(atk.x + s * 0.12, sy + s * 0.5); ctx.fill();
                }
            }
            break;
        }
        case 'cross': {
            // Kokutei Cross: tajo en cruz de las pezuñas y huella de cerezo · Brain Point: Scope apunta antes
            const el = atk.maxLife - atk.life, R = atk.r;
            if (el < atk.delay) {
                const q = el / atk.delay;
                if (atk.evo) {
                    const rr = R * (1.3 - 0.6 * q);
                    ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(atk.x, atk.y, rr, 0, CFX_TAU); ctx.stroke();
                    ctx.beginPath(); ctx.arc(atk.x, atk.y, rr * 0.45, 0, CFX_TAU); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(atk.x - rr * 1.2, atk.y); ctx.lineTo(atk.x - rr * 0.3, atk.y); ctx.moveTo(atk.x + rr * 0.3, atk.y); ctx.lineTo(atk.x + rr * 1.2, atk.y);
                    ctx.moveTo(atk.x, atk.y - rr * 1.2); ctx.lineTo(atk.x, atk.y - rr * 0.3); ctx.moveTo(atk.x, atk.y + rr * 0.3); ctx.lineTo(atk.x, atk.y + rr * 1.2); ctx.stroke();
                } else {
                    ctx.globalAlpha = q; ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2;
                    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(atk.x + s * R * 0.6, atk.y - R * 0.5, R * 0.4, s > 0 ? 2.2 : 0.2, s > 0 ? 3.2 : 1.0); ctx.stroke(); }
                }
                break;
            }
            const q = Math.min(1, (el - atk.delay) / (atk.maxLife - atk.delay)), L = R * 0.72 * Math.min(1, q * 5 + 0.2);
            ctx.globalAlpha = Math.min(1, (1 - q) * 2);
            for (const s of [-1, 1]) {
                ctx.save(); ctx.translate(atk.x, atk.y); ctx.rotate(s * 0.62);
                const w = R * 0.24 * (1 - q * 0.5);
                ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(0, -w, L, 0); ctx.quadraticCurveTo(0, w, -L, 0);
                ctx.strokeStyle = '#451a03'; ctx.lineWidth = 3; ctx.stroke();
                ctx.fillStyle = atk.evo ? '#fecdd3' : '#fef9c3'; ctx.fill();
                ctx.restore();
            }
            ctx.globalAlpha = Math.min(1, (1 - q) * 1.6);
            cfxSakura(atk.x, atk.y, R * 0.3 * Math.min(1, q * 4), q * 0.6, atk.evo ? '#f43f5e' : '#f9a8d4', '#831843');
            break;
        }
        case 'slap': {
            // Seis Fleur: Slap — brazos que brotan junto al enemigo entre pétalos y le dan un bofetón
            const s = atk.flip ? 1 : -1, sw = Math.sin(Math.min(1, p * 2.5) * Math.PI), grow = Math.min(1, p * 5);
            const bx = atk.x + s * 20, by = atk.y + 12;
            cfxBloom(bx, by, 5 * grow, Math.min(1, a * 2));
            ctx.globalAlpha = Math.min(1, a * 2);
            cfxArm(bx, by, bx + (atk.x + s * (14 - 16 * sw) - bx) * grow, by + (atk.y - 10 - by) * grow, 4.5, 0.6 + sw * 0.6);
            if (atk.done && p < 0.75) { ctx.globalAlpha = 1 - p / 0.75; ctx.strokeStyle = '#fdf2f8'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { const an = -s * 0.4 + (k - 1.5) * 0.45 + (s < 0 ? Math.PI : 0); vfxLine(atk.x + Math.cos(an) * 10, atk.y - 8 + Math.sin(an) * 10, atk.x + Math.cos(an) * 18, atk.y - 8 + Math.sin(an) * 18); } }
            if (atk.r) { ctx.globalAlpha = a * 0.5; ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 6, atk.r, atk.r * 0.55, 0, 0, CFX_TAU); ctx.stroke(); }
            break;
        }
        case 'namari': {
            if (atk.evo) {
                // Midori Boshi: Platanus Shuriken — semilla de plátano de sombra que gira como un shuriken
                ctx.translate(atk.x, atk.y); ctx.rotate(atk.spin * 1.4);
                for (let pass = 0; pass < 2; pass++) {
                    ctx.fillStyle = pass ? '#4ade80' : '#14532d';
                    ctx.beginPath();
                    for (let k = 0; k < 4; k++) { const an = k * Math.PI / 2, d = pass ? 0 : 1.2; ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(an - 0.5) * (7 + d), Math.sin(an - 0.5) * (7 + d), Math.cos(an) * (11 + d), Math.sin(an) * (11 + d)); ctx.quadraticCurveTo(Math.cos(an + 0.3) * 5, Math.sin(an + 0.3) * 5, 0, 0); }
                    ctx.fill();
                }
                ctx.fillStyle = '#854d0e'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, CFX_TAU); ctx.fill();
            } else {
                // Namari Boshi: perdigón de plomo con estela
                const d = Math.hypot(atk.vx, atk.vy) || 1, ux = atk.vx / d, uy = atk.vy / d;
                ctx.globalAlpha = 0.45; ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 4; ctx.lineCap = 'round';
                vfxLine(atk.x - ux * 16, atk.y - uy * 16, atk.x, atk.y);
                ctx.globalAlpha = 1; ctx.fillStyle = '#3f3f46'; ctx.strokeStyle = '#09090b'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(atk.x, atk.y, 4.5, 0, CFX_TAU); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#d4d4d8'; ctx.beginPath(); ctx.arc(atk.x - 1.4, atk.y - 1.6, 1.4, 0, CFX_TAU); ctx.fill();
            }
            break;
        }
        case 'firebird': {
            ctx.translate(atk.x, atk.y); ctx.rotate(atk.ang);
            const W = atk.w;
            if (atk.evo) {
                // Midori Boshi: Take Jabbu — caña de bambú que crece de golpe y ensarta
                const L = W * 1.6;
                ctx.globalAlpha = 0.35; ctx.strokeStyle = '#bbf7d0'; ctx.lineWidth = 2;
                for (const s of [-1, 1]) vfxLine(-L * 1.4, s * W * 0.2, -L * 0.8, s * W * 0.16);
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#14532d'; ctx.beginPath(); ctx.moveTo(L + 4, 0); ctx.lineTo(L * 0.55, -W * 0.22); ctx.lineTo(-L, -W * 0.22); ctx.lineTo(-L, W * 0.22); ctx.lineTo(L * 0.55, W * 0.22); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#65a30d'; ctx.beginPath(); ctx.moveTo(L, 0); ctx.lineTo(L * 0.55, -W * 0.16); ctx.lineTo(-L + 1.5, -W * 0.16); ctx.lineTo(-L + 1.5, W * 0.16); ctx.lineTo(L * 0.55, W * 0.16); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#bef264'; ctx.fillRect(-L + 2, -W * 0.12, L * 1.5, W * 0.07);
                ctx.fillStyle = '#14532d'; for (let k = 1; k < 4; k++) ctx.fillRect(-L + k * L * 0.5, -W * 0.2, 2, W * 0.4);
                ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.ellipse(-L * 0.2, -W * 0.38, W * 0.32, W * 0.1, -0.5, 0, CFX_TAU); ctx.ellipse(-L * 0.65, W * 0.36, W * 0.28, W * 0.09, 0.5, 0, CFX_TAU); ctx.fill();
            } else {
                // Hi no Tori Boshi: el ave fénix de fuego de Sogeking
                const fl = Math.sin(atk.spin * 0.9);
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.3; ctx.fillStyle = '#f97316';
                ctx.beginPath(); ctx.ellipse(-W * 0.4, 0, W * 1.3, W * 0.7, 0, 0, CFX_TAU); ctx.fill();
                ctx.globalAlpha = 0.8; ctx.lineCap = 'round';
                for (let k = -1; k <= 1; k++) {
                    ctx.strokeStyle = k ? '#f97316' : '#facc15'; ctx.lineWidth = k ? 3 : 4;
                    ctx.beginPath(); ctx.moveTo(-W * 0.3, k * 2);
                    ctx.quadraticCurveTo(-W * 1.1, k * W * 0.3 + Math.sin(atk.spin * 0.7 + k) * 5, -W * (1.8 - Math.abs(k) * 0.3), k * W * 0.45 + Math.sin(atk.spin * 0.7 + k + 1) * 7);
                    ctx.stroke();
                }
                ctx.globalCompositeOperation = 'source-over';
                for (const s of [-1, 1]) {
                    const span = W * (0.7 + 0.18 * fl);
                    ctx.globalAlpha = 1; ctx.fillStyle = '#dc2626'; ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(W * 0.15, s * 3);
                    ctx.quadraticCurveTo(W * 0.05, s * span * 0.8, -W * 0.45, s * span);
                    ctx.lineTo(-W * 0.5, s * span * 0.72); ctx.lineTo(-W * 0.7, s * span * 0.8); ctx.lineTo(-W * 0.68, s * span * 0.5); ctx.lineTo(-W * 0.9, s * span * 0.5); ctx.lineTo(-W * 0.5, s * 3);
                    ctx.closePath(); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.moveTo(W * 0.1, s * 3); ctx.quadraticCurveTo(W * 0.02, s * span * 0.6, -W * 0.4, s * span * 0.75); ctx.lineTo(-W * 0.35, s * 3); ctx.closePath(); ctx.fill();
                }
                ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.ellipse(-W * 0.1, 0, W * 0.5, W * 0.17, 0, 0, CFX_TAU); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(W * 0.42, 0, W * 0.15, 0, CFX_TAU); ctx.fill();
                ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.moveTo(W * 0.72, 0); ctx.lineTo(W * 0.52, -W * 0.06); ctx.lineTo(W * 0.52, W * 0.06); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#1c1917'; ctx.fillRect(W * 0.44, -W * 0.08, 2, 2);
            }
            break;
        }
        case 'horn': {
            // Horn Point: embestida con las astas
            ctx.translate(atk.x, atk.y); ctx.rotate(atk.ang);
            const W = atk.w / 32 * 1.3;
            ctx.globalAlpha = 0.3; ctx.fillStyle = atk.evo ? '#f9a8d4' : '#d6b48a';
            ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-46 * W, -16 * W); ctx.lineTo(-46 * W, 16 * W); ctx.closePath(); ctx.fill();
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            for (let pass = 0; pass < 2; pass++) {
                ctx.globalAlpha = 1; ctx.strokeStyle = pass ? (atk.evo ? '#e8b4a0' : '#c08a4e') : '#3b1d0a'; ctx.lineWidth = (pass ? 4 : 6.5) * Math.max(1, W * 0.9);
                ctx.beginPath();
                for (const s of [-1, 1]) {
                    ctx.moveTo(-6 * W, s * 5 * W); ctx.quadraticCurveTo(6 * W, s * 16 * W, 20 * W, s * 9 * W);
                    ctx.moveTo(6 * W, s * 12 * W); ctx.lineTo(12 * W, s * 22 * W);
                    ctx.moveTo(13 * W, s * 12 * W); ctx.lineTo(22 * W, s * 17 * W);
                }
                ctx.stroke();
            }
            ctx.fillStyle = '#7c4a24'; ctx.beginPath(); ctx.ellipse(-8 * W, 0, 9 * W, 7 * W, 0, 0, CFX_TAU); ctx.fill();
            break;
        }
        case 'delph': {
            // Cien Fleur: Delphinium — hilera de brazos que brotan del suelo
            const step = 22, n = Math.floor(atk.dist / step);
            for (let k = Math.max(0, n - 10); k <= n; k++) {
                const d = k * step, age = (atk.dist - d) / 240;
                if (age > 0.6) continue;
                const off = k % 2 ? 7 : -7;
                const x = atk.sx + Math.cos(atk.ang) * d + off * Math.sin(atk.ang), y = atk.sy + Math.sin(atk.ang) * d - off * Math.cos(atk.ang);
                const q = age / 0.6, h = 20 * Math.sin(Math.min(1, q * 1.3) * Math.PI);
                cfxBloom(x, y + 6, 5 * (1 - q), (1 - q) * 0.9);
                ctx.globalAlpha = 1 - q * q;
                cfxArm(x, y + 6, x + (k % 2 ? 3 : -3), y + 6 - h, 4, 0.8);
            }
            if (atk.evo) { ctx.globalAlpha = 0.7; ctx.fillStyle = '#f9a8d4'; ctx.beginPath(); ctx.arc(atk.x, atk.y, 4, 0, CFX_TAU); ctx.fill(); }
            break;
        }
        case 'gong': {
            // Heavy Gong: puñetazo de Heavy Point con onda de choque · Kokutei Palm: palma con la huella de cerezo
            const R = atk.r, ext = Math.sin(Math.min(1, p * 1.6) * Math.PI / 2) * (1 - Math.max(0, p - 0.65) / 0.35 * 0.6), reach = R * 0.5 * ext;
            const fx = atk.x + Math.cos(atk.ang) * (14 + reach), fy = atk.y - 4 + Math.sin(atk.ang) * (14 + reach);
            if (p > 0.12) {
                const q = (p - 0.12) / 0.88;
                ctx.lineCap = 'round';
                for (let k = 0; k < 3; k++) {
                    const rr = R * (0.45 + q * 0.55) - k * 12;
                    if (rr <= 4) continue;
                    ctx.globalAlpha = (1 - q) * (0.9 - k * 0.25); ctx.strokeStyle = atk.evo ? '#f9a8d4' : (k ? '#fde68a' : '#ffffff'); ctx.lineWidth = (6 - k * 2) * (1 - q * 0.5);
                    ctx.beginPath(); ctx.arc(atk.x, atk.y, rr, atk.ang - atk.arc * 0.85, atk.ang + atk.arc * 0.85); ctx.stroke();
                }
                ctx.globalAlpha = (1 - q) * 0.7; ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 1.5;
                for (let k = 0; k < 6; k++) { const an = atk.ang + (vfxHash(k + atk.ang) - 0.5) * atk.arc * 1.6, r0 = R * (0.35 + q * 0.4); vfxLine(atk.x + Math.cos(an) * r0, atk.y + Math.sin(an) * r0, atk.x + Math.cos(an) * (r0 + 20), atk.y + Math.sin(an) * (r0 + 20)); }
                if (atk.evo) { ctx.globalAlpha = (1 - q); cfxSakura(fx + Math.cos(atk.ang) * 14, fy + Math.sin(atk.ang) * 14, 10 + q * 14, q, '#f472b6', '#831843'); }
            }
            ctx.globalAlpha = Math.min(1, a * 3);
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#3b1d0a'; ctx.lineWidth = 12; vfxLine(atk.x, atk.y - 4, fx, fy);
            ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 9; vfxLine(atk.x, atk.y - 4, fx, fy);
            ctx.save(); ctx.translate(fx, fy); ctx.rotate(atk.ang);
            ctx.fillStyle = '#3b1d0a'; ctx.beginPath();
            for (let k = 0; k <= 14; k++) { const an = k / 14 * CFX_TAU, rr = (k % 2 ? 9 : 11.5); ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr * 0.9); }
            ctx.fill();
            ctx.fillStyle = atk.evo ? '#5b3415' : '#a0693a'; ctx.beginPath(); ctx.arc(0, 0, 8.5, 0, CFX_TAU); ctx.fill();
            ctx.fillStyle = '#c99a63'; ctx.beginPath(); ctx.arc(-2, -3, 3.5, 0, CFX_TAU); ctx.fill();
            ctx.strokeStyle = '#3b1d0a'; ctx.lineWidth = 1.3; for (let k = -1; k <= 1; k++) vfxLine(4, k * 3.6, 8, k * 3.6);
            ctx.restore();
            break;
        }
        case 'guard': {
            // Guard Point: Chopper se hincha como una bola de pelo
            const pop = Math.min(1, p * atk.maxLife * 8), fade = Math.min(1, atk.life * 3), R = (atk.evo ? 36 : 30) * (0.6 + 0.4 * Math.min(1, pop * 1.5));
            const fur = (rr, j) => { ctx.beginPath(); for (let k = 0; k <= 28; k++) { const an = k / 28 * CFX_TAU, w = k % 2 ? 1 : 1.16 + 0.04 * Math.sin(k * 3 + t * 7); ctx.lineTo(atk.x + Math.cos(an) * rr * w, atk.y - 4 + Math.sin(an) * rr * w * 0.95 + j); } ctx.closePath(); };
            ctx.globalAlpha = 0.8 * fade; ctx.fillStyle = '#3b1d0a'; fur(R + 2, 1); ctx.fill();
            ctx.fillStyle = atk.evo ? '#d9a06b' : '#b07445'; fur(R, 0); ctx.fill();
            ctx.globalAlpha = 0.6 * fade; ctx.fillStyle = '#e8c49a'; ctx.beginPath(); ctx.ellipse(atk.x - R * 0.3, atk.y - 4 - R * 0.35, R * 0.4, R * 0.25, -0.5, 0, CFX_TAU); ctx.fill();
            ctx.strokeStyle = '#5c3317'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7 * fade;
            ctx.beginPath(); for (let k = 0; k < 9; k++) { const an = k * 0.7 + 0.3, r0 = R * 0.55; ctx.moveTo(atk.x + Math.cos(an) * r0, atk.y - 4 + Math.sin(an) * r0); ctx.quadraticCurveTo(atk.x + Math.cos(an + 0.2) * R * 0.8, atk.y - 4 + Math.sin(an + 0.2) * R * 0.8, atk.x + Math.cos(an + 0.1) * R * 0.95, atk.y - 4 + Math.sin(an + 0.1) * R * 0.95); } ctx.stroke();
            if (pop < 1) {
                ctx.globalAlpha = 1 - pop; ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 4 * (1 - pop) + 1;
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y, atk.r * pop, atk.r * pop * 0.75, 0, 0, CFX_TAU); ctx.stroke();
            }
            break;
        }
        case 'calendula': {
            // Veinte/Cien Fleur: Calendula — muro de brazos que gira alrededor de Robin
            const fade = cfxFade(atk), n = atk.evo ? 14 : 10, R = atk.r;
            ctx.globalAlpha = 0.18 * fade; ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 6, R, R * 0.75, 0, 0, CFX_TAU); ctx.stroke();
            for (let k = 0; k < n; k++) {
                const an = atk.spin + k / n * CFX_TAU, bx = atk.x + Math.cos(an) * R * 0.92, by = atk.y + 6 + Math.sin(an) * R * 0.72;
                const sway = Math.sin(t * 6 + k) * 3;
                cfxBloom(bx, by, 3.5, 0.8 * fade);
                ctx.globalAlpha = 0.95 * fade;
                cfxArm(bx, by, bx + Math.cos(an + 1.4) * 6 + sway, by - 18, 4, 1);
            }
            break;
        }
        case 'doble': {
            // Cuerpo Fleur: Doble — clon de pétalos · Demonio: forma oscura
            const fade = cfxFade(atk, 5, 2);
            const set = CHAR_IMG.robin, img = set && set.idle && set.idle[Math.floor(t * 6) % set.idle.length];
            if (img && img.complete && img.width) {
                const ph = 48 * SPRITE_ZOOM * (atk.evo ? 1.15 : 1), pw = ph * img.width / img.height;
                const im = filteredSprite(img, atk.evo ? 'brightness(0.35) saturate(1.6) hue-rotate(250deg)' : 'saturate(0.5) brightness(1.25)');
                ctx.save(); ctx.translate(atk.x, atk.y); if (player.facing === 1) ctx.scale(-1, 1);
                ctx.globalAlpha = 0.7 * fade; ctx.drawImage(im, -pw / 2, -ph / 2, pw, ph);
                ctx.restore();
                if (atk.evo) {
                    ctx.globalAlpha = 0.7 * fade; ctx.fillStyle = '#1e1b4b';
                    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(atk.x + s * 6, atk.y - 14); ctx.quadraticCurveTo(atk.x + s * 30, atk.y - 40, atk.x + s * 40, atk.y - 22); ctx.lineTo(atk.x + s * 30, atk.y - 18); ctx.lineTo(atk.x + s * 34, atk.y - 8); ctx.lineTo(atk.x + s * 22, atk.y - 8); ctx.closePath(); ctx.fill(); }
                }
            }
            ctx.globalAlpha = fade;
            for (const arm of atk.arms) { const g = Math.min(1, (0.25 - arm.life) * 12 + 0.3); cfxArm(atk.x, atk.y - 4, atk.x + (arm.x - atk.x) * g, atk.y - 4 + (arm.y - atk.y) * g, 4, 0.5); }
            break;
        }
    }
    ctx.restore();
};

// ---------- Armas iniciales (js/arsenal.js) ----------
function drawCrewWeaponFX(atk) {
    const p = atk.maxLife ? Math.min(1, Math.max(0, 1 - atk.life / atk.maxLife)) : 0, a = 1 - p;
    if (atk.type === 'kabuto') {
        // Kayaku Boshi: bola de pólvora con mecha · Midori Boshi: semilla Pop Green
        const x = atk.x, y = atk.y;
        if (atk.evo) {
            ctx.fillStyle = '#14532d'; ctx.beginPath(); ctx.ellipse(x, y, 7.5, 8.5, 0, 0, CFX_TAU); ctx.fill();
            ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.ellipse(x, y, 6, 7, 0, 0, CFX_TAU); ctx.fill();
            ctx.fillStyle = '#86efac'; ctx.beginPath(); ctx.ellipse(x - 2, y - 2.5, 2, 2.8, -0.4, 0, CFX_TAU); ctx.fill();
            ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.ellipse(x + 4, y - 9, 4, 1.8, -0.7, 0, CFX_TAU); ctx.fill();
            ctx.strokeStyle = '#14532d'; ctx.lineWidth = 1.5; vfxLine(x, y - 7, x + 2, y - 10);
        } else {
            ctx.fillStyle = '#09090b'; ctx.beginPath(); ctx.arc(x, y, 7.5, 0, CFX_TAU); ctx.fill();
            ctx.fillStyle = '#3f3f46'; ctx.beginPath(); ctx.arc(x, y, 6, 0, CFX_TAU); ctx.fill();
            ctx.fillStyle = '#a1a1aa'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 1.8, 0, CFX_TAU); ctx.fill();
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1.5; vfxLine(x + 3, y - 5, x + 5, y - 9);
            const fl = 2 + Math.sin(gameTime * 40) * 1.2;
            ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fde047';
            ctx.beginPath(); ctx.arc(x + 5, y - 9.5, fl, 0, CFX_TAU); ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }
        return;
    }
    if (atk.type === 'thunder') {
        // Clima-Tact: rayo desde una nubecilla (también Mirage y Zeus)
        const cy = atk.y - 140, glow = atk.evo ? '#facc15' : '#7dd3fc';
        cfxCloud(atk.x, cy, 30 + (atk.evo ? 16 : 0), '#334155', '#64748b', '#1e293b', gameTime, 0.9 * Math.min(1, a * 2.5));
        cfxBolt(atk.x, cy + 6, atk.x, atk.y, atk.x * 0.37 + atk.y, glow, Math.min(1, a * 1.8), atk.evo ? 1.5 : 1.1);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a * 0.6; ctx.fillStyle = glow;
        ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 2, atk.radius * (0.5 + p * 0.6), atk.radius * (0.5 + p * 0.6) * 0.45, 0, 0, CFX_TAU); ctx.fill();
        ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 2, 10 * a + 2, 5 * a + 1, 0, 0, CFX_TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = a * 0.9; ctx.strokeStyle = glow; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 2, atk.radius * (0.3 + p), atk.radius * (0.3 + p) * 0.45, 0, 0, CFX_TAU); ctx.stroke();
        return;
    }
    if (atk.type === 'clutch') {
        // Seis Fleur: Clutch — brazos que brotan alrededor y se cierran sobre el enemigo
        const fade = 1 - Math.max(0, p - 0.6) / 0.4, grow = Math.min(1, p / 0.45);
        const n = atk.evo ? 8 : 6, R = atk.evo ? Math.max(18, atk.radius * 0.6) : 16;
        for (let k = 0; k < n; k++) {
            const ang = k / n * CFX_TAU;
            const bx = atk.x + Math.cos(ang) * R, by = atk.y + Math.sin(ang) * R * 0.6 + 8;
            cfxBloom(bx, by, 4 * Math.min(1, grow * 3), fade * 0.9);
            ctx.globalAlpha = fade;
            cfxArm(bx, by, atk.x + Math.cos(ang) * R * (1 - 0.72 * grow), by - 22 * grow, 4, 1 - grow * 0.8);
        }
        if (atk.done && p < 0.8) {
            const q = (p - 0.44) / 0.36;
            if (q > 0) { ctx.globalAlpha = 1 - q; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.lineCap = 'round'; for (let k = 0; k < 6; k++) { const an = k / 6 * CFX_TAU + 0.3; vfxLine(atk.x + Math.cos(an) * (8 + q * 6), atk.y - 12 + Math.sin(an) * (8 + q * 6), atk.x + Math.cos(an) * (16 + q * 10), atk.y - 12 + Math.sin(an) * (16 + q * 10)); } }
        }
        return;
    }
    // Roseo: la huella de cerezo de la pezuña de Chopper
    const r = atk.radius * (0.35 + 0.65 * Math.min(1, p * 2.5));
    ctx.globalAlpha = 0.3 * a; ctx.fillStyle = atk.evo ? '#f43f5e' : '#f9a8d4';
    ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 6, r, r * 0.55, 0, 0, CFX_TAU); ctx.fill();
    ctx.globalAlpha = Math.min(1, a * 1.8);
    cfxSakura(atk.x, atk.y, r * 0.55, p * 0.8, atk.evo ? '#ec4899' : '#f9a8d4', '#831843');
    ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(atk.x, atk.y, 3.5, 0, CFX_TAU); ctx.fill();
}
const _cfxDrawArsenal = drawArsenalFX;
drawArsenalFX = function (atk) {
    if (atk.type === 'kabuto' || atk.type === 'thunder' || atk.type === 'clutch' || (atk.type === 'impact' && atk.petal)) {
        ctx.save(); drawCrewWeaponFX(atk); ctx.restore(); return true;
    }
    return _cfxDrawArsenal(atk);
};

// ---------- Partículas (en la actualización, no en el dibujo) ----------
function crewFxBefore(atk, dt) {
    switch (atk.look) {
        case 'gust':
            if (cfxRate(40, dt)) cfxTrail(atk.x - Math.cos(atk.ang) * atk.w * (1 + Math.random()), atk.y - Math.sin(atk.ang) * atk.w * (1 + Math.random()) + (Math.random() - 0.5) * atk.w * 0.6, atk.ang, 14, atk.evo ? '#fbcfe8' : '#e0f2fe');
            if (atk.evo && cfxRate(20, dt)) cfxPuff(atk.x - Math.cos(atk.ang) * atk.w * 2, atk.y - Math.sin(atk.ang) * atk.w * 2, '#fdf2f8', 3, 0, -6, 0.5, 0.6, 8);
            break;
        case 'tornado':
            if (cfxRate(atk.evo ? 18 : 10, dt)) cfxPuff(atk.x + (Math.random() - 0.5) * atk.w, atk.y + atk.w * 0.4, vfxPick(vfxMap().dust), 3, (Math.random() - 0.5) * 40, -25, 0.5, 0.4, 12);
            break;
        case 'cloud':
            if (cfxRate(3, dt)) cfxPuff(atk.x + (Math.random() - 0.5) * atk.r, atk.y - 60, '#475569', 4, 0, -4, 0.8, 0.35, 6);
            break;
        case 'fire':
            if (cfxRate(24, dt)) {
                const x = atk.x + (Math.random() - 0.5) * atk.r * 1.4, y = atk.y + (Math.random() - 0.5) * atk.r * 0.6;
                if (atk.evo) cfxPuff(x, y, '#4ade80', 3, 0, -40, 0.5, 0.5, 6); else fxFlames(x, y, 1, 2, 40, 4);
            }
            break;
        case 'tabasco':
            if (cfxRate(atk.evo ? 6 : 10, dt)) {
                const life = 0.5;
                particles.push({ x: atk.x + (Math.random() - 0.5) * atk.r, y: atk.y + (Math.random() - 0.5) * atk.r * 0.5, vx: (Math.random() - 0.5) * 20, vy: -35, life, maxLife: life, color: atk.evo ? '#bef264' : '#fca5a5', shape: 'spark', size: 1.8, grav: 0 });
            }
            break;
        case 'firebird':
            if (!atk.evo && cfxRate(35, dt)) fxFlames(atk.x - Math.cos(atk.ang) * atk.w, atk.y - Math.sin(atk.ang) * atk.w, 1, 6, 30, 5);
            if (atk.evo && cfxRate(12, dt)) cfxPetals(atk.x - Math.cos(atk.ang) * atk.w, atk.y - Math.sin(atk.ang) * atk.w, 1, 30, ['#4ade80', '#86efac', '#16a34a']);
            break;
        case 'horn':
            if (cfxRate(30, dt)) fxDust(atk.x - Math.cos(atk.ang) * 30, atk.y - Math.sin(atk.ang) * 30 + 10, 1, 6, 6);
            if (cfxRate(30, dt)) cfxTrail(atk.x - Math.cos(atk.ang) * 20, atk.y - Math.sin(atk.ang) * 20 + (Math.random() - 0.5) * 24, atk.ang, 16, atk.evo ? '#fbcfe8' : '#fef3c7');
            if (atk.evo && cfxRate(14, dt)) cfxPetals(atk.x, atk.y, 1, 40);
            break;
        case 'namari':
            if (atk.evo && cfxRate(10, dt)) cfxPetals(atk.x, atk.y, 1, 20, ['#4ade80', '#86efac']);
            break;
        case 'delph':
            if (cfxRate(18, dt)) cfxPetals(atk.x, atk.y + 6, 1, 40);
            break;
        case 'calendula':
            if (cfxRate(6, dt)) { const an = Math.random() * CFX_TAU; cfxPetals(atk.x + Math.cos(an) * atk.r, atk.y + Math.sin(an) * atk.r * 0.7, 1, 30); }
            break;
        case 'doble':
            if (cfxRate(atk.evo ? 4 : 8, dt)) cfxPetals(atk.x + (Math.random() - 0.5) * 24, atk.y + (Math.random() - 0.5) * 40, 1, 30, atk.evo ? ['#4c1d95', '#1e1b4b', '#7c3aed'] : CFX_PETAL);
            break;
    }
}
function crewFxAfter(atk) {
    // momentos de impacto: se detectan por el cambio de estado que hace updateCrewAttack
    if (atk.look === 'cloud') {
        const f = atk.flash || 0;
        if (f > (atk._pf || 0)) {
            atk._strikes = [];
            const seed = Math.random() * 1000;
            for (let k = 0; k < 2; k++) {
                const bx = (vfxHash(seed + k * 5.3) - 0.5) * atk.r * 1.1, by = (vfxHash(seed + k * 7.9) - 0.5) * atk.r * 0.55;
                atk._strikes.push([bx, by, seed + k * 13]);
                fxSpark(atk.x + bx, atk.y + by, atk.evo ? '#fde047' : '#e0f2fe', 4, 110, 0.3, 2, 60);
                fxImpact(atk.x + bx, atk.y + by, 9, atk.evo ? '#fef08a' : '#e0f2fe', 0.12);
            }
        }
        atk._pf = f;
        return;
    }
    if (!atk.done || atk._fx) return;
    atk._fx = true;
    switch (atk.look) {
        case 'kaen':
            fxFlames(atk.x, atk.y, 6, atk.r * 0.4, 70, 6);
            fxDust(atk.x, atk.y + 6, 5, atk.r * 0.5, 20);
            for (let k = 0, c = cfxN(5); k < c; k++) { const an = Math.random() * CFX_TAU; cfxPuff(atk.x + Math.cos(an) * atk.r * 0.4, atk.y + Math.sin(an) * atk.r * 0.25, atk.evo ? '#14532d' : '#44403c', 5, Math.cos(an) * 25, -20, 0.9, 0.5, 14); }
            fxDecal(atk.x, atk.y + 4, 'scorch', atk.r * 0.8, 1.6);
            break;
        case 'cross':
            fxImpact(atk.x, atk.y, 16, '#ffffff', 0.18);
            cfxPetals(atk.x, atk.y, 6, 90, atk.evo ? ['#f43f5e', '#fda4af', '#ffffff'] : CFX_PETAL);
            break;
        case 'slap':
            fxImpact(atk.x + (atk.flip ? 8 : -8), atk.y - 8, 10, '#fdf2f8', 0.14);
            cfxPetals(atk.x + (atk.flip ? 20 : -20), atk.y + 10, 3, 50);
            break;
        case 'gong':
            fxDust(atk.x + Math.cos(atk.ang) * atk.r * 0.5, atk.y + Math.sin(atk.ang) * atk.r * 0.5 + 8, 5, 18, 14);
            fxStreaks(atk.x + Math.cos(atk.ang) * 30, atk.y + Math.sin(atk.ang) * 30, atk.ang, 5, 18, 260, '#fef3c7');
            if (atk.evo) cfxPetals(atk.x + Math.cos(atk.ang) * 40, atk.y + Math.sin(atk.ang) * 40, 6, 110);
            break;
        case 'guard':
            fxDust(atk.x, atk.y + 10, 8, 26, 10);
            break;
    }
}
function crewWeaponFxAfter(atk, dt) {
    if (atk.type === 'kabuto') {
        if (cfxRate(atk.evo ? 10 : 22, dt)) {
            if (atk.evo) cfxPetals(atk.x, atk.y, 1, 20, ['#4ade80', '#86efac']);
            else cfxPuff(atk.x - atk.vx * 0.02, atk.y - atk.vy * 0.02, '#a8a29e', 2.5, 0, -10, 0.45, 0.4, 8);
        }
        return;
    }
    if (atk._fx) return;
    if (atk.type === 'thunder') {
        atk._fx = true;
        const col = atk.evo ? '#fde047' : '#e0f2fe';
        fxSpark(atk.x, atk.y, col, 8, 150, 0.35, 2, 80);
        fxDust(atk.x, atk.y + 6, 3, 10, 12);
    } else if (atk.type === 'clutch' && atk.done) {
        atk._fx = true;
        fxImpact(atk.x, atk.y - 12, 13, '#ffffff', 0.16);
        cfxPetals(atk.x, atk.y, 5, 70);
    } else if (atk.type === 'impact' && atk.petal && atk.done) {
        atk._fx = true;
        fxImpact(atk.x, atk.y, 14, '#ffffff', 0.16);
        cfxPetals(atk.x, atk.y, 8, 110, atk.evo ? ['#ec4899', '#f472b6', '#fdf2f8'] : CFX_PETAL);
    }
}
const _cfxUpdateArsenal = updateArsenalAttack;
updateArsenalAttack = function (atk, dt) {
    if (atk.type === 'crew') cfxIsolated(crewFxBefore, atk, dt);
    const end = _cfxUpdateArsenal(atk, dt);
    if (atk.type === 'crew') cfxIsolated(crewFxAfter, atk); else cfxIsolated(crewWeaponFxAfter, atk, dt);
    return end;
};
