// === Efectos de Franky, Brook y Jinbe (técnicas de js/crew.js con atk.look propio) ===
// Se carga después de crewfx.js: envuelve drawCrewFX y la actualización de partículas.
// Mismas reglas de rendimiento que crewfx.js: sin capas offscreen ni ctx.filter, partículas escaladas por cfxQ().

const CFX2_LOOKS = new Set(['cannon', 'fist', 'freshfire', 'coup', 'rocket', 'yahazu', 'gavotte', 'frost', 'lullaby', 'soul',
    'seiken', 'buraikan', 'yarinami', 'uchimizu', 'mizu']);
const CFX2_WATER = ['#38bdf8', '#7dd3fc', '#e0f2fe', '#0ea5e9'];
const CFX2_ICE = ['#e0f2fe', '#bae6fd', '#ffffff', '#7dd3fc'];

// Nota musical (Brook)
function cfx2Note(x, y, s, col) {
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, s * 0.18);
    ctx.beginPath(); ctx.ellipse(x, y, s * 0.42, s * 0.3, -0.4, 0, CFX_TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + s * 0.38, y); ctx.lineTo(x + s * 0.38, y - s * 1.3); ctx.lineTo(x + s * 0.85, y - s * 0.95); ctx.stroke();
}
// Gota / bola de agua con brillo
function cfx2Water(x, y, r, alpha) {
    ctx.globalAlpha = alpha * 0.9; ctx.fillStyle = '#0369a1'; ctx.beginPath(); ctx.arc(x, y + 1, r + 1.5, 0, CFX_TAU); ctx.fill();
    ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(x, y, r, 0, CFX_TAU); ctx.fill();
    ctx.globalAlpha = alpha * 0.8; ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.35, r * 0.35, r * 0.22, -0.6, 0, CFX_TAU); ctx.fill();
}

function drawCrewFX2(atk) {
    const p = atk.maxLife ? Math.min(1, Math.max(0, 1 - atk.life / atk.maxLife)) : 0, a = 1 - p, t = gameTime;
    switch (atk.look) {
        // ---------- FRANKY ----------
        case 'cannon': {
            // Weapons Left: bala de cañón · Franky Radical Beam: rayo azul
            ctx.translate(atk.x, atk.y); ctx.rotate(atk.ang);
            if (atk.evo) {
                const W = atk.w;
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.45; ctx.fillStyle = '#38bdf8'; ctx.fillRect(-W * 3, -W * 0.45, W * 3.6, W * 0.9);
                ctx.globalAlpha = 1; ctx.fillStyle = '#e0f2fe'; ctx.fillRect(-W * 2.6, -W * 0.18, W * 3.1, W * 0.36);
                ctx.globalCompositeOperation = 'source-over';
            } else {
                ctx.globalAlpha = 0.35; ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-26, -5); ctx.lineTo(-26, 5); ctx.closePath(); ctx.fill();
                ctx.globalAlpha = 1; ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, CFX_TAU); ctx.fill();
                ctx.fillStyle = '#6b7280'; ctx.beginPath(); ctx.arc(-1.8, -1.8, 2.2, 0, CFX_TAU); ctx.fill();
            }
            break;
        }
        case 'fist': {
            // Strong Right: puño de hierro unido por una cadena · Strong Hammer: puño gigante
            const W = atk.w * (atk.evo ? 0.75 : 0.6);
            ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.5; ctx.setLineDash([4, 3]);
            vfxLine(player.x, player.y - 6, atk.x, atk.y); ctx.setLineDash([]);
            ctx.translate(atk.x, atk.y); ctx.rotate(Math.atan2(atk.vy, atk.vx) + (atk.back ? Math.PI : 0));
            ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.roundRect(-W * 0.6 - 1.5, -W * 0.55 - 1.5, W * 1.2 + 3, W * 1.1 + 3, 4); ctx.fill();
            ctx.fillStyle = '#93c5fd'; ctx.beginPath(); ctx.roundRect(-W * 0.6, -W * 0.55, W * 1.2, W * 1.1, 3); ctx.fill();
            ctx.fillStyle = '#e0f2fe'; ctx.fillRect(-W * 0.4, -W * 0.45, W * 0.35, W * 0.25);
            ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 1.3; for (let k = -1; k <= 1; k++) vfxLine(W * 0.25, k * W * 0.3, W * 0.55, k * W * 0.3);
            break;
        }
        case 'freshfire': {
            // Fresh Fire: llamarada de cola en abanico · Franky Fireball: más grande y anaranjada
            const R = atk.r * Math.min(1, p * 2.5);
            for (let k = 0; k < 3; k++) {
                const rr = R * (1 - k * 0.28);
                ctx.globalAlpha = a * (0.55 + k * 0.15);
                ctx.fillStyle = k === 0 ? '#ea580c' : (k === 1 ? '#f97316' : '#fde68a');
                ctx.beginPath(); ctx.moveTo(atk.x, atk.y - 6); ctx.arc(atk.x, atk.y - 6, rr, atk.ang - atk.arc * (1 - k * 0.2), atk.ang + atk.arc * (1 - k * 0.2)); ctx.closePath(); ctx.fill();
            }
            break;
        }
        case 'coup': {
            // Coup de Vent: cañón de aire comprimido · Gaon Cannon: chorro blanco gigante
            ctx.translate(atk.x, atk.y); ctx.rotate(atk.ang);
            const W = atk.w;
            ctx.globalAlpha = 0.25; ctx.fillStyle = atk.evo ? '#ffffff' : '#bae6fd';
            ctx.beginPath(); ctx.ellipse(-W * 0.8, 0, W * 1.4, W * 0.55, 0, 0, CFX_TAU); ctx.fill();
            ctx.globalAlpha = 0.9; ctx.strokeStyle = atk.evo ? '#ffffff' : '#e0f2fe'; ctx.lineWidth = 3;
            for (let k = 0; k < 3; k++) { const rr = W * (0.35 + k * 0.18) + Math.sin(t * 20 + k) * 2; ctx.beginPath(); ctx.ellipse(-k * W * 0.35, 0, rr * 0.35, rr, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke(); }
            break;
        }
        case 'rocket': {
            // Franky Rocket Launcher: el cohete cae y estalla
            if (!atk.done) {
                const q = Math.min(1, (atk.maxLife - atk.life) / atk.delay), y = atk.y - (1 - q) * 140;
                ctx.save(); ctx.translate(atk.x - (1 - q) * 30, y); ctx.rotate(Math.PI / 2 - 0.2);
                ctx.fillStyle = '#e5e7eb'; ctx.fillRect(-10, -3.5, 16, 7);
                ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.moveTo(6, -3.5); ctx.lineTo(12, 0); ctx.lineTo(6, 3.5); ctx.fill();
                ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(-10, -2.5); ctx.lineTo(-20 + Math.sin(t * 40) * 2, 0); ctx.lineTo(-10, 2.5); ctx.fill();
                ctx.restore();
                ctx.globalAlpha = 0.3; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y, atk.r, atk.r * 0.5, 0, 0, CFX_TAU); ctx.stroke();
            } else {
                const q = Math.min(1, (atk.maxLife - atk.life - atk.delay) / 0.3);
                ctx.globalAlpha = (1 - q) * 0.9; ctx.fillStyle = atk.evo ? '#fb923c' : '#fdba74';
                ctx.beginPath(); ctx.arc(atk.x, atk.y, atk.r * (0.4 + q * 0.6), 0, CFX_TAU); ctx.fill();
                ctx.globalAlpha = (1 - q); ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.arc(atk.x, atk.y, atk.r * 0.3 * (1 - q), 0, CFX_TAU); ctx.fill();
            }
            break;
        }
        // ---------- BROOK ----------
        case 'yahazu': {
            // Yahazu Giri: el corte aparece cuando Brook ya ha pasado
            const g = atk.done ? Math.min(1, (atk.maxLife - atk.life - atk.delay) / 0.2) : 0;
            const rr = (atk.single ? 22 : atk.r + 12);
            ctx.globalAlpha = atk.done ? 1 - g : 0.4; ctx.strokeStyle = atk.evo ? '#c4b5fd' : '#e5e7eb'; ctx.lineCap = 'round';
            ctx.lineWidth = atk.done ? 6 * (1 - g) + 1.5 : 1;
            const s = atk.flip ? 1 : -1;
            vfxLine(atk.x - rr * s, atk.y - rr * 0.8, atk.x + rr * s, atk.y + rr * 0.5);
            if (atk.done) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; vfxLine(atk.x - rr * s * 0.8, atk.y - rr * 0.6, atk.x + rr * s * 0.8, atk.y + rr * 0.35); }
            break;
        }
        case 'gavotte': {
            // Gavotte Bond en Avant: estocada (destello largo y fino)
            ctx.translate(atk.x, atk.y); ctx.rotate(atk.ang);
            const L = Math.min(atk.dist, 90);
            ctx.globalAlpha = 0.35; ctx.fillStyle = atk.evo ? '#c4b5fd' : '#e5e7eb'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-L, -atk.w * 0.35); ctx.lineTo(-L, atk.w * 0.35); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 1; ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2.2; vfxLine(-L * 0.5, 0, 6, 0);
            ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(-L * 0.5, 0, 2.5, 0, CFX_TAU); ctx.fill();
            break;
        }
        case 'frost': {
            // Kasuriuta: Fubuki Giri — tajo en arco que deja escarcha
            const R = atk.r * (0.6 + 0.4 * Math.min(1, p * 3));
            ctx.globalAlpha = a; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 6 * a + 1; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(atk.x, atk.y, R, atk.ang - atk.arc, atk.ang + atk.arc); ctx.stroke();
            ctx.globalAlpha = a * 0.25; ctx.fillStyle = atk.evo ? '#7dd3fc' : '#bae6fd';
            ctx.beginPath(); ctx.moveTo(atk.x, atk.y); ctx.arc(atk.x, atk.y, R, atk.ang - atk.arc, atk.ang + atk.arc); ctx.closePath(); ctx.fill();
            break;
        }
        case 'lullaby': {
            // Nemuri Uta: Flanchet — notas que giran alrededor de Brook
            const fade = cfxFade(atk), n = atk.evo ? 8 : 6;
            ctx.globalAlpha = 0.12 * fade; ctx.fillStyle = '#a78bfa';
            ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 6, atk.r, atk.r * 0.7, 0, 0, CFX_TAU); ctx.fill();
            for (let k = 0; k < n; k++) {
                const an = t * 1.5 + k / n * CFX_TAU, R = atk.r * (0.55 + 0.35 * Math.sin(t * 2 + k));
                ctx.globalAlpha = 0.85 * fade;
                cfx2Note(atk.x + Math.cos(an) * R, atk.y + Math.sin(an) * R * 0.7 - 6, 6, ['#f472b6', '#a78bfa', '#60a5fa', '#facc15'][k % 4]);
            }
            break;
        }
        case 'soul': {
            // Yomi Yomi: el alma de Brook flota y hiela a quien toca · Soul Parade: varias a la vez
            const fade = cfxFade(atk, 5, 2), bob = Math.sin(t * 4) * 4;
            ctx.globalAlpha = 0.7 * fade; ctx.fillStyle = '#e0f2fe'; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(atk.x, atk.y - 18 + bob, 11, Math.PI, 0);
            for (let k = 0; k <= 4; k++) ctx.lineTo(atk.x + 11 - k * 5.5, atk.y - 2 + bob + (k % 2 ? -4 : 2));
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(atk.x - 4, atk.y - 19 + bob, 2.2, 0, CFX_TAU); ctx.arc(atk.x + 4, atk.y - 19 + bob, 2.2, 0, CFX_TAU); ctx.fill();
            ctx.fillStyle = '#111827'; ctx.fillRect(atk.x - 7, atk.y - 33 + bob, 14, 3); ctx.fillRect(atk.x - 4.5, atk.y - 40 + bob, 9, 7); // sombrero de copa
            ctx.globalAlpha = fade; ctx.strokeStyle = '#bae6fd'; ctx.lineWidth = 2;
            for (const arm of atk.arms) { vfxLine(atk.x, atk.y - 14 + bob, arm.x, arm.y); }
            break;
        }
        // ---------- JINBE ----------
        case 'seiken': {
            // Samegawara Seiken: onda de agua que vibra · Gosenmaigawara: más ancha
            ctx.translate(atk.x, atk.y); ctx.rotate(atk.ang);
            const W = atk.w;
            ctx.lineCap = 'round';
            for (let k = 0; k < 3; k++) {
                ctx.globalAlpha = 1 - k * 0.25; ctx.strokeStyle = k ? '#38bdf8' : '#e0f2fe'; ctx.lineWidth = 5 - k;
                ctx.beginPath(); ctx.ellipse(-k * 9, 0, W * 0.25, W * (0.6 + k * 0.12), 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
            }
            break;
        }
        case 'buraikan': {
            // Buraikan: bola de agua que cae y revienta
            if (!atk.done) {
                const q = Math.min(1, (atk.maxLife - atk.life) / atk.delay);
                const x = player.x + (atk.x - player.x) * q, y = player.y + (atk.y - player.y) * q - Math.sin(q * Math.PI) * 60;
                cfx2Water(x, y, atk.r * 0.28 * (atk.evo ? 1.3 : 1), 1);
            } else {
                const q = Math.min(1, (atk.maxLife - atk.life - atk.delay) / 0.3);
                ctx.globalAlpha = (1 - q) * 0.8; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 6 * (1 - q) + 1;
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y, atk.r * (0.4 + q * 0.7), atk.r * (0.25 + q * 0.4), 0, 0, CFX_TAU); ctx.stroke();
                ctx.globalAlpha = (1 - q) * 0.3; ctx.fillStyle = '#7dd3fc'; ctx.fill();
            }
            break;
        }
        case 'yarinami': {
            // Yarinami: lanza de agua
            ctx.translate(atk.x, atk.y); ctx.rotate(atk.ang);
            const W = atk.w;
            ctx.globalAlpha = 0.35; ctx.fillStyle = '#7dd3fc'; ctx.fillRect(-W * 3.2, -W * 0.25, W * 3.2, W * 0.5);
            ctx.globalAlpha = 1; ctx.fillStyle = '#0ea5e9'; ctx.beginPath(); ctx.moveTo(W * 0.9, 0); ctx.lineTo(-W * 1.6, -W * 0.3); ctx.lineTo(-W * 1.6, W * 0.3); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.moveTo(W * 0.6, 0); ctx.lineTo(-W * 1.2, -W * 0.1); ctx.lineTo(-W * 1.2, W * 0.1); ctx.closePath(); ctx.fill();
            break;
        }
        case 'uchimizu': {
            // Uchimizu: gotas lanzadas como balas hacia cada objetivo
            if (!atk.done) {
                const q = Math.min(1, (atk.maxLife - atk.life) / atk.delay);
                cfx2Water(player.x + (atk.x - player.x) * q, player.y - 6 + (atk.y - player.y + 6) * q, atk.evo ? 4.5 : 3.5, 1);
            } else {
                const q = Math.min(1, (atk.maxLife - atk.life - atk.delay) / 0.25);
                ctx.globalAlpha = 1 - q; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(atk.x, atk.y, 6 + q * (atk.r || 14), 0, CFX_TAU); ctx.stroke();
            }
            break;
        }
        case 'mizu': {
            // Mizugokoro: remolino de agua alrededor de Jinbe · Kairyu Ippon Zeoi: más grande
            const fade = Math.min(1, atk.life * 3), pop = Math.min(1, p * atk.maxLife * 6), R = atk.r * (0.5 + 0.5 * pop);
            ctx.globalAlpha = 0.2 * fade; ctx.fillStyle = '#38bdf8';
            ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 4, R, R * 0.7, 0, 0, CFX_TAU); ctx.fill();
            ctx.lineCap = 'round';
            for (let k = 0; k < 3; k++) {
                const an = t * 5 + k * 2.1;
                ctx.globalAlpha = 0.8 * fade; ctx.strokeStyle = k ? '#7dd3fc' : '#e0f2fe'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 4, R * (0.65 + k * 0.15), R * (0.45 + k * 0.1), 0, an, an + 2); ctx.stroke();
            }
            break;
        }
    }
}

const _cfx2Draw = drawCrewFX;
drawCrewFX = function (atk) {
    if (!CFX2_LOOKS.has(atk.look)) return _cfx2Draw(atk);
    ctx.save(); drawCrewFX2(atk); ctx.restore();
};

// ---------- Partículas ----------
function crewFx2Update(atk, dt) {
    switch (atk.look) {
        case 'cannon': if (cfxRate(atk.evo ? 30 : 14, dt)) cfxTrail(atk.x, atk.y, atk.ang + Math.PI, 10, atk.evo ? '#bae6fd' : '#d6d3d1'); break;
        case 'coup': if (cfxRate(30, dt)) cfxTrail(atk.x - Math.cos(atk.ang) * atk.w, atk.y - Math.sin(atk.ang) * atk.w + (Math.random() - 0.5) * atk.w, atk.ang, 18, '#e0f2fe'); break;
        case 'freshfire': if (!atk._fx2) { atk._fx2 = true; for (let k = 0; k < 4; k++) fxFlames(atk.x + Math.cos(atk.ang) * atk.r * (0.3 + k * 0.18), atk.y + Math.sin(atk.ang) * atk.r * (0.3 + k * 0.18), 1, 6, 50, 4); } break;
        case 'rocket': if (atk.done && !atk._fx2) { atk._fx2 = true; fxFlames(atk.x, atk.y, 6, atk.r * 0.4, 70, 6); fxDust(atk.x, atk.y + 6, 5, atk.r * 0.5, 20); fxDecal(atk.x, atk.y + 4, 'scorch', atk.r * 0.8, 1.6); cameraShake = Math.max(cameraShake, 0.8); } break;
        case 'frost': if (!atk._fx2) { atk._fx2 = true; cfxPetals(atk.x + Math.cos(atk.ang) * atk.r * 0.6, atk.y + Math.sin(atk.ang) * atk.r * 0.6, 8, 90, CFX2_ICE); } break;
        case 'gavotte': if (cfxRate(18, dt)) cfxTrail(atk.x, atk.y, atk.ang + Math.PI, 12, '#f8fafc'); break;
        case 'soul': if (cfxRate(6, dt)) cfxPuff(atk.x + (Math.random() - 0.5) * 16, atk.y - 10, '#e0f2fe', 3, 0, -14, 0.6, 0.4, 6); break;
        case 'yahazu': if (atk.done && !atk._fx2) { atk._fx2 = true; fxImpact(atk.x, atk.y - 8, 10, '#f8fafc', 0.14); } break;
        case 'seiken': case 'yarinami': if (cfxRate(20, dt)) cfxPetals(atk.x, atk.y, 1, 30, CFX2_WATER); break;
        case 'buraikan': if (atk.done && !atk._fx2) { atk._fx2 = true; cfxPetals(atk.x, atk.y, 14, 160, CFX2_WATER); fxDust(atk.x, atk.y + 6, 3, atk.r * 0.4, 14); cameraShake = Math.max(cameraShake, 0.8); } break;
        case 'uchimizu': if (atk.done && !atk._fx2) { atk._fx2 = true; cfxPetals(atk.x, atk.y, 4, 70, CFX2_WATER); } break;
        case 'mizu': if (cfxRate(14, dt)) { const an = Math.random() * CFX_TAU; cfxPetals(player.x + Math.cos(an) * atk.r * 0.7, player.y + Math.sin(an) * atk.r * 0.5, 1, 30, CFX2_WATER); } break;
    }
}
const _cfx2Update = updateArsenalAttack;
updateArsenalAttack = function (atk, dt) {
    const end = _cfx2Update(atk, dt);
    if (atk.type === 'crew' && CFX2_LOOKS.has(atk.look)) cfxIsolated(crewFx2Update, atk, dt);
    return end;
};
