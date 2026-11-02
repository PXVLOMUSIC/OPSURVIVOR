// === Efectos de las armas compartidas (atk.vis) y del Dial de Impacto ===
// Cuchillo, Granada, Rifle, Ballesta, Lanza, Hacha, Shuriken, Pulso de Haoshoku y Dial, cada uno con su evolución del canon.
// Se carga después de crewfx.js: envuelve drawAttackFX, drawArsenalFX y vfxTickAttack.
// Sin capas offscreen ni ctx.filter; degradados solo en explosiones. Las partículas, con vfxIsolated.

const AFX_TAU = Math.PI * 2;
const afxEvo = vfxEvolved;
function afxRate(perSec, dt) { return Math.random() < perSec * dt * vfxQ() * (lowFx() ? 0.5 : 1); }

// Grietas en el aire de la Gura Gura no Mi (cristal roto), deterministas por semilla
function afxQuakeCracks(x, y, r, seed, alpha) {
    ctx.globalAlpha = alpha; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
        let a = k / 6 * AFX_TAU + vfxHash(seed + k) * 0.6, px = x, py = y;
        ctx.moveTo(px, py);
        for (let s = 1; s <= 3; s++) { a += (vfxHash(seed + k * 7 + s) - 0.5) * 0.9; px += Math.cos(a) * r * 0.36; py += Math.sin(a) * r * 0.36; ctx.lineTo(px, py); }
    }
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.globalAlpha = alpha * 0.8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, AFX_TAU); ctx.stroke();
}
// Rayo negro con borde rojo del Haoshoku, de a hacia b
function afxHakiBolt(x0, y0, x1, y1, seed, alpha, w = 1) {
    const n = 5, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    ctx.beginPath(); ctx.moveTo(x0, y0);
    for (let k = 1; k < n; k++) { const j = (vfxHash(seed + k * 2.3) - 0.5) * L * 0.5; ctx.lineTo(x0 + dx * k / n + nx * j, y0 + dy * k / n + ny * j); }
    ctx.lineTo(x1, y1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.globalAlpha = alpha; ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 4 * w; ctx.stroke();
    ctx.strokeStyle = '#0b0710'; ctx.lineWidth = 2 * w; ctx.stroke();
}

const SHARED_FX = {
    knife(atk, evo) {
        const [tx, ty] = vfxTip(atk), a = atk.angle;
        if (evo) {
            // Shakushi: Neko no Te — las cuchillas-garra de Kuro, tres tajos curvos en paralelo
            ctx.globalAlpha = 0.35; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 1.5;
            for (let s = -1; s <= 1; s++) { const ox = -Math.sin(a) * s * 6, oy = Math.cos(a) * s * 6; vfxLine(tx + ox - Math.cos(a) * 34, ty + oy - Math.sin(a) * 34, tx + ox - Math.cos(a) * 8, ty + oy - Math.sin(a) * 8); }
            ctx.globalAlpha = 1;
            for (let s = -1; s <= 1; s++) drawCrescent(tx - Math.sin(a) * s * 6 - Math.cos(a) * Math.abs(s) * 3, ty + Math.cos(a) * s * 6 - Math.sin(a) * Math.abs(s) * 3, a, 7, 2.6, '#cbd5e1', '#ffffff', 1, 0.9);
            return;
        }
        // cuchillo arrojadizo girando, con estela del giro
        ctx.globalAlpha = 0.3; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
        vfxLine(tx - Math.cos(a) * 24, ty - Math.sin(a) * 24, tx, ty);
        const r = gameTime * 22;
        ctx.globalAlpha = 0.22; ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(tx, ty, 11, r - 1.6, r - 0.2); ctx.stroke();
        ctx.globalAlpha = 1; ctx.translate(tx, ty); ctx.rotate(r);
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.moveTo(-1, -3.6); ctx.lineTo(14.5, 0); ctx.lineTo(-1, 3.6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(13, 0); ctx.lineTo(0, 2.6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.moveTo(0, -2.6); ctx.lineTo(13, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1c1917'; ctx.fillRect(-9, -2.6, 9, 5.2);
        ctx.fillStyle = '#7c4a24'; ctx.fillRect(-8.2, -1.8, 7.6, 3.6);
        ctx.fillStyle = '#e5e7eb'; ctx.fillRect(-6, -0.6, 1.2, 1.2); ctx.fillRect(-3, -0.6, 1.2, 1.2);
    },
    rifle(atk, evo) {
        const [tx, ty] = vfxTip(atk), a = atk.angle, L = evo ? 70 : 46;
        const bx = tx - Math.cos(a) * L, by = ty - Math.sin(a) * L;
        ctx.lineCap = 'round';
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(bx, by, tx, ty);
        g.addColorStop(0, evo ? 'rgba(167,139,250,0)' : 'rgba(253,186,116,0)'); g.addColorStop(1, evo ? 'rgba(196,181,253,0.8)' : 'rgba(253,224,71,0.75)');
        ctx.strokeStyle = g; ctx.lineWidth = evo ? 6 : 5; vfxLine(bx, by, tx, ty);
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#fffbeb'; ctx.lineWidth = 1.6; vfxLine(tx - Math.cos(a) * L * 0.6, ty - Math.sin(a) * L * 0.6, tx, ty);
        if (evo) {
            // Senriku: la bala de francotirador de Van Augur deja anillos de estría
            ctx.strokeStyle = '#c4b5fd'; ctx.lineWidth = 1.2;
            for (let k = 1; k <= 2; k++) { const d = (k * 22 + (gameTime * 300) % 22); ctx.globalAlpha = 1 - d / L; ctx.beginPath(); ctx.ellipse(tx - Math.cos(a) * d, ty - Math.sin(a) * d, 2, 5, a, 0, AFX_TAU); ctx.stroke(); }
            ctx.globalAlpha = 1;
        }
        ctx.translate(tx, ty); ctx.rotate(a);
        ctx.fillStyle = '#1c1917'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.6, 0, 0, AFX_TAU); ctx.fill();
        ctx.fillStyle = evo ? '#a78bfa' : '#d97706'; ctx.beginPath(); ctx.ellipse(0.5, 0, 4, 1.7, 0, 0, AFX_TAU); ctx.fill();
        ctx.fillStyle = '#fef3c7'; ctx.fillRect(1, -1, 2.5, 0.9);
    },
    bolt(atk, evo) {
        // virote de ballesta · Kairoseki: punta de piedra marina con brillo azul
        const [tx, ty] = vfxTip(atk);
        ctx.globalAlpha = 0.35; ctx.strokeStyle = evo ? '#67e8f9' : '#e2e8f0'; ctx.lineWidth = 2;
        vfxLine(tx - Math.cos(atk.angle) * 46, ty - Math.sin(atk.angle) * 46, tx - Math.cos(atk.angle) * 24, ty - Math.sin(atk.angle) * 24);
        ctx.globalAlpha = 1; ctx.translate(tx, ty); ctx.rotate(atk.angle);
        ctx.strokeStyle = '#3b2412'; ctx.lineWidth = 4; vfxLine(-24, 0, 1, 0);
        ctx.strokeStyle = '#a0693a'; ctx.lineWidth = 2.4; vfxLine(-24, 0, 1, 0);
        ctx.strokeStyle = '#d6a36a'; ctx.lineWidth = 0.9; vfxLine(-20, -0.6, -2, -0.6);
        if (evo) {
            ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.fillStyle = '#22d3ee';
            ctx.beginPath(); ctx.arc(4, 0, 7, 0, AFX_TAU); ctx.fill();
            ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        }
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-1, -4.5); ctx.lineTo(1, 0); ctx.lineTo(-1, 4.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = evo ? '#475569' : '#e2e8f0'; ctx.beginPath(); ctx.moveTo(7.5, 0); ctx.lineTo(0, -3.2); ctx.lineTo(1.4, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = evo ? '#64748b' : '#94a3b8'; ctx.beginPath(); ctx.moveTo(7.5, 0); ctx.lineTo(1.4, 0); ctx.lineTo(0, 3.2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#be123c';
        ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-23, -5); ctx.lineTo(-25, -4.5); ctx.lineTo(-22, 0); ctx.lineTo(-25, 4.5); ctx.lineTo(-23, 5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-23, -5); ctx.lineTo(-22, 0); ctx.closePath(); ctx.fill();
    },
    spear(atk, evo) {
        const [tx, ty] = vfxTip(atk), a = atk.angle, ext = atk.maxRange ? Math.min(1, atk.currentRange / atk.maxRange) : 1;
        const L = evo ? 78 : 62;
        ctx.lineCap = 'round';
        // líneas de la estocada
        ctx.globalAlpha = 0.5 * ext; ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.4;
        for (let s = -1; s <= 1; s += 2) { const ox = -Math.sin(a) * s * 8, oy = Math.cos(a) * s * 8; vfxLine(tx + ox - Math.cos(a) * 34, ty + oy - Math.sin(a) * 34, tx + ox - Math.cos(a) * 12, ty + oy - Math.sin(a) * 12); }
        ctx.globalAlpha = 1;
        const sx = tx - Math.cos(a) * L, sy = ty - Math.sin(a) * L;
        ctx.strokeStyle = '#1c1917'; ctx.lineWidth = evo ? 5.5 : 4.5; vfxLine(sx, sy, tx, ty);
        ctx.strokeStyle = evo ? '#3f2a1d' : '#8b5a2b'; ctx.lineWidth = evo ? 3.6 : 2.8; vfxLine(sx, sy, tx, ty);
        if (evo) {
            // Bisento de Barbablanca: hoja curva enorme con guarda dorada y el aire agrietado de la Gura Gura
            ctx.save(); ctx.translate(tx, ty); ctx.rotate(a);
            ctx.fillStyle = '#ca8a04'; ctx.fillRect(-4, -4, 5, 8);
            ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(14, 6, 28, -7); ctx.quadraticCurveTo(16, -4, 0, -5); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.moveTo(1, 3); ctx.quadraticCurveTo(14, 4.5, 26, -6.5); ctx.quadraticCurveTo(15, -3.5, 1, -4); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(2, -3.6); ctx.quadraticCurveTo(15, -3, 26, -6.5); ctx.quadraticCurveTo(14, -1.5, 2, -1.5); ctx.closePath(); ctx.fill();
            ctx.restore();
            if (ext > 0.85) afxQuakeCracks(tx + Math.cos(a) * 18, ty + Math.sin(a) * 18, 26, (atk.startX * 3 + atk.angle * 17) | 0, Math.min(1, (ext - 0.85) * 8));
            return;
        }
        ctx.translate(tx, ty); ctx.rotate(a);
        ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-9, -4); ctx.lineTo(-8, 0); ctx.lineTo(-9, 4); ctx.closePath(); ctx.fill(); // borla
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.moveTo(15, 0); ctx.quadraticCurveTo(6, -6, 0, -3.5); ctx.lineTo(0, 3.5); ctx.quadraticCurveTo(6, 6, 15, 0); ctx.fill();
        ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(13.5, 0); ctx.quadraticCurveTo(6, -4.6, 1, -2.6); ctx.lineTo(1, 2.6); ctx.quadraticCurveTo(6, 4.6, 13.5, 0); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(13.5, 0); ctx.quadraticCurveTo(6, -4.6, 1, -2.6); ctx.lineTo(1, 0); ctx.closePath(); ctx.fill();
    },
    axe(atk, evo, p) {
        // Hacha: cae desde arriba y parte el suelo · Mano-Hacha de Morgan
        const q = Math.min(1, p / 0.45), rot = -1.9 + q * 2.1, big = evo ? 1.35 : 1;
        ctx.globalAlpha = p > 0.75 ? (1 - p) / 0.25 : 1;
        ctx.translate(atk.x - 6, atk.y + 6);
        if (q < 1) {
            ctx.globalAlpha *= 0.35; ctx.fillStyle = '#f8fafc';
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 40 * big, rot - Math.PI / 2 - 0.7, rot - Math.PI / 2 + 0.05); ctx.closePath(); ctx.fill();
            ctx.globalAlpha /= 0.35;
        }
        ctx.rotate(rot); ctx.scale(big, big);
        if (evo) {
            ctx.fillStyle = '#1f2937'; ctx.fillRect(-5, -16, 10, 16);
            ctx.fillStyle = '#6b7280'; ctx.fillRect(-4, -15, 8, 14);
            ctx.fillStyle = '#9ca3af'; ctx.fillRect(-4, -15, 2.5, 14);
            ctx.fillStyle = '#374151'; ctx.fillRect(-2, -40, 4, 26);
        } else {
            ctx.fillStyle = '#3b2412'; ctx.fillRect(-2.6, -41, 5.2, 42);
            ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-1.6, -40, 3.2, 40);
            ctx.fillStyle = '#c08a4e'; ctx.fillRect(-1.6, -40, 1, 40);
        }
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.moveTo(1, -43); ctx.quadraticCurveTo(21, -37, 18, -18); ctx.lineTo(1, -25); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath(); ctx.moveTo(2.5, -41); ctx.quadraticCurveTo(19, -36, 16.5, -20); ctx.lineTo(2.5, -26.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath(); ctx.moveTo(12, -39); ctx.quadraticCurveTo(19.5, -33, 16.5, -20); ctx.lineTo(13.5, -21.5); ctx.quadraticCurveTo(16, -31, 10, -38); ctx.closePath(); ctx.fill();
    },
    shuriken(atk, evo) {
        const [tx, ty] = vfxTip(atk), r = gameTime * 20;
        ctx.globalAlpha = 0.2; ctx.fillStyle = evo ? '#6d28d9' : '#e2e8f0';
        ctx.beginPath(); ctx.arc(tx, ty, 11, 0, AFX_TAU); ctx.fill();
        ctx.globalAlpha = 1; ctx.translate(tx, ty); ctx.rotate(r);
        if (evo) {
            // Makibishi de Raizo: abrojo de hierro negro con púas
            ctx.fillStyle = '#0b0710';
            ctx.beginPath(); for (let s = 0; s < 12; s++) { const rr = s % 2 ? 3.5 : 11; const an = s * Math.PI / 6; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#4c1d95';
            ctx.beginPath(); for (let s = 0; s < 12; s++) { const rr = s % 2 ? 2.5 : 8.5; const an = s * Math.PI / 6; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#a78bfa'; ctx.fillRect(-1, -1, 2, 2);
            return;
        }
        // shuriken de cuatro puntas con filo brillante
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); for (let s = 0; s < 8; s++) { const rr = s % 2 ? 3.6 : 11.5; const an = s * Math.PI / 4; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); for (let s = 0; s < 8; s++) { const rr = s % 2 ? 2.6 : 9.8; const an = s * Math.PI / 4; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); for (let s = 0; s < 4; s++) { const an = s * Math.PI / 2; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * 9.8, Math.sin(an) * 9.8); ctx.lineTo(Math.cos(an + 0.4) * 2.6, Math.sin(an + 0.4) * 2.6); } ctx.fill();
        ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, AFX_TAU); ctx.fill();
    },
    haki(atk, evo, p) {
        // Haoshoku Haki: cúpula de voluntad oscura que se expande, con rayos negros de borde rojo
        const fade = 1 - p, e = Math.min(1, p * 1.6), r = atk.radius * (0.25 + 0.75 * e), cx = player.x, cy = player.y + 6;
        ctx.globalAlpha = (evo ? 0.32 : 0.24) * fade; ctx.fillStyle = '#0b0710';
        ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.7, 0, 0, AFX_TAU); ctx.fill();
        if (evo) { ctx.globalAlpha = 0.18 * fade; ctx.fillStyle = '#7f1d1d'; ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.75, r * 0.52, 0, 0, AFX_TAU); ctx.fill(); }
        ctx.globalAlpha = 0.95 * fade; ctx.strokeStyle = '#0b0710'; ctx.lineWidth = 6 * (1 - e * 0.5);
        ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.7, 0, 0, AFX_TAU); ctx.stroke();
        ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx, cy, r + 1, r * 0.7 + 1, 0, 0, AFX_TAU); ctx.stroke();
        // ondas de presión hacia fuera
        ctx.globalAlpha = 0.5 * fade; ctx.strokeStyle = '#450a0a'; ctx.lineWidth = 1.5;
        for (let k = 0; k < 10; k++) { const an = k / 10 * AFX_TAU + 0.3; vfxLine(cx + Math.cos(an) * r * 0.82, cy + Math.sin(an) * r * 0.57, cx + Math.cos(an) * (r + 10), cy + Math.sin(an) * (r * 0.7 + 7)); }
        // rayos que recorren el borde (cambian 16 veces por segundo)
        const seed = Math.floor(gameTime * 16) * 13.7 + atk.radius, nb = evo ? 6 : 4;
        for (let k = 0; k < nb; k++) {
            const a0 = vfxHash(seed + k) * AFX_TAU, a1 = a0 + 0.5 + vfxHash(seed + k + 50) * 0.5;
            afxHakiBolt(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r * 0.7, cx + Math.cos(a1) * r * 0.9, cy + Math.sin(a1) * r * 0.63, seed + k * 9, fade, evo ? 1.2 : 0.9);
        }
    },
    grenade(atk, evo, p) {
        if (p < 0.35) {
            // bomba en parábola con sombra y mecha · Nose Fancy Cannon: el proyectil de Mr. 5
            const q = p / 0.35, gx = atk.ox + (atk.x - atk.ox) * q, gy0 = atk.oy + (atk.y - atk.oy) * q, gy = gy0 - Math.sin(q * Math.PI) * 50;
            ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(gx, gy0 + 6, 5 - Math.sin(q * Math.PI) * 2, 2, 0, 0, AFX_TAU); ctx.fill();
            ctx.globalAlpha = 1;
            if (evo) {
                ctx.fillStyle = '#365314'; ctx.beginPath(); ctx.arc(gx, gy, 5.5, 0, AFX_TAU); ctx.fill();
                ctx.fillStyle = '#a3e635'; ctx.beginPath(); ctx.arc(gx, gy, 4.3, 0, AFX_TAU); ctx.fill();
                ctx.fillStyle = '#ecfccb'; ctx.beginPath(); ctx.arc(gx - 1.5, gy - 1.5, 1.4, 0, AFX_TAU); ctx.fill();
            } else {
                ctx.fillStyle = '#09090b'; ctx.beginPath(); ctx.arc(gx, gy, 5.5, 0, AFX_TAU); ctx.fill();
                ctx.fillStyle = '#3f3f46'; ctx.beginPath(); ctx.arc(gx, gy, 4.3, 0, AFX_TAU); ctx.fill();
                ctx.fillStyle = '#a1a1aa'; ctx.beginPath(); ctx.arc(gx - 1.5, gy - 1.5, 1.3, 0, AFX_TAU); ctx.fill();
                ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1.4; vfxLine(gx + 2, gy - 4, gx + 4, gy - 7);
                ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fde047';
                ctx.beginPath(); ctx.arc(gx + 4, gy - 7.5, 1.6 + Math.sin(gameTime * 45) * 0.8, 0, AFX_TAU); ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
            }
            return;
        }
        const q = (p - 0.35) / 0.65, R = atk.radius * (evo ? 1.1 : 1), e = 1 - (1 - q) * (1 - q);
        ctx.globalCompositeOperation = 'lighter';
        const r = R * (0.45 + 0.55 * e);
        const g = ctx.createRadialGradient(atk.x, atk.y, 0, atk.x, atk.y, r);
        g.addColorStop(0, `rgba(255,251,220,${0.95 * (1 - q)})`);
        g.addColorStop(0.35, `rgba(253,186,116,${0.85 * (1 - q)})`);
        g.addColorStop(0.7, `rgba(234,88,12,${0.5 * (1 - q)})`);
        g.addColorStop(1, 'rgba(185,28,28,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(atk.x, atk.y, r, r * 0.85, 0, 0, AFX_TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        if (q < 0.18) { ctx.globalAlpha = 1 - q / 0.18; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(atk.x, atk.y, R * 0.35, 0, AFX_TAU); ctx.fill(); }
        ctx.globalAlpha = (1 - q) * 0.9; ctx.strokeStyle = '#fff7ed'; ctx.lineWidth = 3 * (1 - q) + 0.5;
        ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 4, R * (0.5 + 0.7 * e), R * (0.5 + 0.7 * e) * 0.55, 0, 0, AFX_TAU); ctx.stroke();
        if (q > 0.25) {
            // humo que queda tras la explosión
            ctx.globalAlpha = 0.45 * (1 - q); ctx.fillStyle = '#3f3f46';
            ctx.beginPath();
            for (let k = 0; k < 6; k++) { const an = k / 6 * AFX_TAU + 0.4, d = R * (0.35 + 0.3 * e), x = atk.x + Math.cos(an) * d, y = atk.y + Math.sin(an) * d * 0.6 - q * 14, rr = R * 0.22 * (0.7 + q); ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, AFX_TAU); }
            ctx.fill();
        }
    }
};

// Dial de Impacto (atk.type 'impact' sin petal) · Reject Dial al evolucionar
function drawDialFX(atk) {
    const p = atk.maxLife ? Math.min(1, Math.max(0, 1 - atk.life / atk.maxLife)) : 0, a = 1 - p, e = 1 - (1 - p) * (1 - p);
    const R = atk.radius, x = atk.x, y = atk.y + 6;
    ctx.globalAlpha = (atk.evo ? 0.3 : 0.2) * a; ctx.fillStyle = atk.evo ? '#450a0a' : '#e2e8f0';
    ctx.beginPath(); ctx.ellipse(x, y, R * (0.3 + 0.7 * e), R * (0.3 + 0.7 * e) * 0.7, 0, 0, AFX_TAU); ctx.fill();
    for (let k = 0; k < 2; k++) {
        const rr = R * (0.3 + 0.7 * e) * (1 - k * 0.25);
        ctx.globalAlpha = (0.95 - k * 0.35) * a;
        ctx.strokeStyle = atk.evo ? (k ? '#7f1d1d' : '#ef4444') : (k ? '#cbd5e1' : '#ffffff'); ctx.lineWidth = (k ? 2 : 5) * (1 - e * 0.6) + 0.5;
        ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.7, 0, 0, AFX_TAU); ctx.stroke();
    }
    ctx.globalAlpha = 0.7 * a; ctx.strokeStyle = atk.evo ? '#fecaca' : '#f8fafc'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 12; k++) { const an = k / 12 * AFX_TAU, r0 = R * (0.15 + 0.6 * e), r1 = r0 + 14; vfxLine(x + Math.cos(an) * r0, y + Math.sin(an) * r0 * 0.7, x + Math.cos(an) * r1, y + Math.sin(an) * r1 * 0.7); }
    if (p < 0.45) {
        // la concha del dial en la mano, con su espiral
        const s = 9 * (1 - p), dx = player.x + player.facing * 10, dy = player.y - 4;
        ctx.globalAlpha = Math.min(1, (0.45 - p) * 6);
        ctx.fillStyle = '#3b2412'; ctx.beginPath(); ctx.ellipse(dx, dy, s + 1.2, s * 0.8 + 1.2, 0, 0, AFX_TAU); ctx.fill();
        ctx.fillStyle = atk.evo ? '#7f1d1d' : '#e7d3b0'; ctx.beginPath(); ctx.ellipse(dx, dy, s, s * 0.8, 0, 0, AFX_TAU); ctx.fill();
        ctx.strokeStyle = atk.evo ? '#fca5a5' : '#8b5a2b'; ctx.lineWidth = 1.2;
        ctx.beginPath(); for (let t = 0; t < 10; t++) { const an = t * 0.9, rr = s * (0.85 - t * 0.075); ctx.lineTo(dx + Math.cos(an) * rr, dy + Math.sin(an) * rr * 0.8); } ctx.stroke();
    }
}

// ---------- Ganchos ----------
const _afxDrawAttack = drawAttackFX;
drawAttackFX = function (atk) {
    const f = atk.vis && SHARED_FX[atk.vis];
    if (!f) return _afxDrawAttack(atk);
    ctx.save(); f(atk, afxEvo(atk), vfxProgress(atk)); ctx.restore();
};
const _afxDrawArsenal = drawArsenalFX;
drawArsenalFX = function (atk) {
    if (atk.type === 'impact' && !atk.petal) { ctx.save(); drawDialFX(atk); ctx.restore(); return true; }
    return _afxDrawArsenal(atk);
};
// Estelas y aterrizajes (vfxTickAttack ya va aislado con vfxIsolated)
const _afxTick = vfxTickAttack;
vfxTickAttack = function (atk, dt) {
    _afxTick(atk, dt);
    const k = atk.vis;
    if (!k) return;
    const evo = afxEvo(atk);
    if (k === 'bolt' && evo && afxRate(30, dt)) { const [tx, ty] = vfxTip(atk); particles.push({ x: tx, y: ty, vx: 0, vy: -10, life: 0.3, maxLife: 0.3, color: '#67e8f9', shape: 'orb', size: 2.5 }); }
    else if (k === 'shuriken' && evo && afxRate(30, dt)) { const [tx, ty] = vfxTip(atk); particles.push({ x: tx, y: ty, vx: 0, vy: -12, life: 0.45, maxLife: 0.45, color: '#4c1d95', shape: 'smoke', size: 3, grow: 10, alpha: 0.4 }); }
    else if (k === 'grenade' && !evo && vfxProgress(atk) < 0.35 && afxRate(30, dt)) {
        const q = vfxProgress(atk) / 0.35, gx = atk.ox + (atk.x - atk.ox) * q, gy = atk.oy + (atk.y - atk.oy) * q - Math.sin(q * Math.PI) * 50;
        particles.push({ x: gx, y: gy, vx: 0, vy: -10, life: 0.4, maxLife: 0.4, color: '#a8a29e', shape: 'smoke', size: 2, grow: 8, alpha: 0.4 });
    }
    else if (k === 'haki' && afxRate(evo ? 26 : 16, dt)) {
        const a = Math.random() * AFX_TAU, r = atk.radius * Math.min(1, vfxProgress(atk) * 1.6);
        particles.push({ x: player.x + Math.cos(a) * r, y: player.y + 6 + Math.sin(a) * r * 0.7, vx: Math.cos(a) * 40, vy: Math.sin(a) * 28, life: 0.3, maxLife: 0.3, color: Math.random() < 0.5 ? '#dc2626' : '#0b0710', shape: 'spark', size: 2, grav: 0 });
    }
    if (k === 'axe' && evo && atk._landed && !atk._afxLanded) { atk._afxLanded = true; fxRing(atk.x, atk.y, '#e2e8f0', 18, 0.3); fxDebris(atk.x, atk.y, 4, 160); }
    if (k === 'grenade' && evo && atk._landed && !atk._afxLanded) { atk._afxLanded = true; fxRing(atk.x, atk.y, '#d9f99d', 20, 0.35); }
};
// el Dial suelta su onda: polvo y, con el Reject Dial, grietas en el suelo
const _afxUpdateArsenal = updateArsenalAttack;
updateArsenalAttack = function (atk, dt) {
    const first = atk.type === 'impact' && !atk.petal && !atk.done;
    const end = _afxUpdateArsenal(atk, dt);
    if (first) vfxIsolated(() => {
        fxDust(atk.x, atk.y + 8, 6, atk.radius * 0.4, 14);
        if (atk.evo) { fxDecal(atk.x, atk.y + 6, 'crack', atk.radius * 0.5, 1.4); fxDebris(atk.x, atk.y, 6, 170); }
    });
    return end;
};
