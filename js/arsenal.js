// === Arsenal ampliado (estilo Vampire Survivors: cada arma tiene su evolución con una pasiva) ===
// - Evoluciones de las 8 armas compartidas, con técnicas del canon.
// - 3 armas nuevas que son objetos del mundo de One Piece: Kabuto de Usopp, Clima-Tact de Nami y Dial de Impacto.
// - 2 pasivas nuevas: Rumble Ball (duración) y Bandera Pirata (riesgo/recompensa, como el Skull O'Maniac de VS).
// Se carga después de game.js: amplía EVOLUTIONS, ICONS y engancha handleArsenal / updateArsenalAttack.

// ---------- Iconos ----------
Object.assign(ICONS, {
    kabuto:    SVG(`<g ${S}><path d="M7 21V12M7 12 3.5 4.5M7 12l3.5-7.5"/><path d="M3.5 4.5c2.2 3 4.8 3 7 0" opacity=".6"/></g><g ${F}><circle cx="17" cy="8" r="3.4"/></g><g ${S}><path d="M12.6 10.6 9 13M20.5 12.5l1.6 1.6M18.8 14.6l.8 2" opacity=".55"/></g>`),
    climatact: SVG(`<g ${S}><path d="M4 20 15.5 8.5" stroke-width="2.4"/><circle cx="17.2" cy="6.8" r="2.4"/></g><g ${F}><path d="M14.8 1.6 11.6 7h3l-2.2 5 5.4-6.6h-3.1l2.1-3.8z"/></g>`),
    dial:      SVG(`<g ${F}><path d="M12 3.2c4.8 0 8.6 3.6 8.6 8.2 0 3.1-1.9 5.2-4.4 5.2H7.8c-2.5 0-4.4-2.1-4.4-5.2C3.4 6.8 7.2 3.2 12 3.2z"/></g><g stroke="#000" stroke-opacity=".35" stroke-width="1.3" fill="none" stroke-linecap="round"><path d="M8.2 6.2c1 2.4 1.2 6 .8 10.2M12 4.4v12M15.8 6.2c-1 2.4-1.2 6-.8 10.2"/></g><g ${S}><path d="M5 20.6h14" opacity=".55"/></g>`),
    rumble:    SVG(`<g ${F}><circle cx="12" cy="12" r="7.5"/></g><path d="M12 4.5v15M4.5 12h15" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" fill="none"/><g ${S}><path d="M2.5 6.5 4.6 7.6M21.5 6.5l-2.1 1.1M12 1.6v1.6" opacity=".6"/></g>`),
    roseo:     SVG(`<g ${F}><path d="M7 3.5c2.6-.6 5 1 5.4 3.6l1 6.4c.3 2-1 3.8-3 4.1l-1.8.3c-2 .3-3.8-1-4.1-3L3.6 8.5C3.2 6 4.6 4 7 3.5z"/></g><g ${S}><circle cx="17.5" cy="15.5" r="3"/><path d="M17.5 9.8v2.4M17.5 18.8v2.4M11.8 15.5h2.4M20.8 15.5h2" opacity=".7"/></g>`),
    clutch:    SVG(`<g ${F}><path d="M5 21c.6-4 1.4-7 1.4-10.4 0-1 1.6-1 1.7 0l.4 4.6V5.2c0-1.2 1.8-1.2 1.8 0v8.4V3.6c0-1.2 1.8-1.2 1.8 0v10V5c0-1.2 1.8-1.2 1.8 0v9.6l1.6-3c.6-1 2.2-.4 1.8.7L15.4 21z"/></g>`),
    jolly:     SVG(`<g ${S}><path d="M5 22V3"/></g><g ${F}><path d="M6 3.5h14l-2.4 5 2.4 5H6z"/></g><g fill="#000" fill-opacity=".4"><circle cx="12.6" cy="7.6" r="2.3"/><path d="M10 11.6l5.2-1.6.4 1.2-5.2 1.6z"/></g>`)
});

// ---------- Evoluciones (arma + pasiva, se activan al abrir un cofre de plata u oro) ----------
Object.assign(EVOLUTIONS, {
    cuchillo:  { passive: 'speed',     name: 'Shakushi: Neko no Te' },
    granada:   { passive: 'area',      name: 'Bomu Bomu: Nose Fancy Cannon' },
    rifle:     { passive: 'crit',      name: 'Sogeking: Hissatsu Kaen Boshi' },
    ballesta:  { passive: 'magnet',    name: 'Virote de Kairoseki' },
    lanza:     { passive: 'haki_buso', name: 'Bisento de Barbablanca' },
    hacha:     { passive: 'maxhp',     name: 'Mano-Hacha de Morgan' },
    shuriken:  { passive: 'cd',        name: 'Ninpo de Raizo: Makibishi' },
    hakiPulse: { passive: 'haki_hao',  name: 'Haoshoku: Rey de los Conquistadores' },
    kabuto:    { passive: 'luck',      name: 'Kuro Kabuto: Midori Boshi' },
    climatact: { passive: 'growth',    name: 'Sorcery Clima-Tact: Thunder Lance Tempo' },
    dial:      { passive: 'armor',     name: 'Reject Dial' },
    roseo:     { passive: 'maxhp',     name: 'Monster Point' },
    clutch:    { passive: 'area',      name: 'Mil Fleur: Gigantesco Mano' }
});
// Mejora de estadísticas al evolucionar (los disparos extra van en handleAttacks)
const SHARED_EVO_FX = {
    cuchillo:  sk => { sk.baseDamage *= 1.5; },
    granada:   sk => { sk.baseDamage *= 1.6; sk.radius += 20; },
    rifle:     sk => { sk.baseDamage *= 1.8; sk.range += 120; },
    ballesta:  sk => { sk.baseDamage *= 1.8; sk.range += 150; sk.cooldown *= 0.7; },
    lanza:     sk => { sk.baseDamage *= 1.6; sk.range += 40; },
    hacha:     sk => { sk.baseDamage *= 1.8; sk.radius += 30; sk.cooldown *= 0.8; },
    shuriken:  sk => { sk.baseDamage *= 1.4; },
    hakiPulse: sk => { sk.baseDamage *= 2.0; sk.radius += 40; },
    kabuto:    sk => { sk.baseDamage *= 1.7; },
    climatact: sk => { sk.baseDamage *= 1.7; sk.strikes += 3; },
    dial:      sk => { sk.baseDamage *= 2.2; sk.radius += 40; sk.push += 40; },
    roseo:     sk => { sk.baseDamage *= 1.9; sk.radius += 35; },
    clutch:    sk => { sk.baseDamage *= 1.8; sk.targets += 3; }
};

// ---------- Subidas de nivel de las armas y pasivas nuevas ----------
const ARSENAL_UPGRADE = {
    kabuto:    () => { const s = skills.kabuto; s.level = Math.min(5, s.level + 1); if (s.level > 1) { s.baseDamage += 8; s.life += 0.3; } },
    climatact: () => { const s = skills.climatact; s.level = Math.min(5, s.level + 1); if (s.level > 1) { s.baseDamage += 10; if (s.level % 2) s.strikes++; } },
    dial:      () => { const s = skills.dial; s.level = Math.min(5, s.level + 1); if (s.level > 1) { s.baseDamage += 9; s.radius += 10; } },
    roseo:     () => { const s = skills.roseo; s.level = Math.min(5, s.level + 1); if (s.level > 1) { s.baseDamage += 16; s.radius += 6; } },
    clutch:    () => { const s = skills.clutch; s.level = Math.min(5, s.level + 1); if (s.level > 1) { s.baseDamage += 12; if (s.level % 2) s.targets++; } },
    rumble:    () => { player.durationBonus = (player.durationBonus || 1) + 0.15; player.passives.rumble = (player.passives.rumble || 0) + 1; },
    jolly:     () => { player.curse += 0.10; player.growthBonus += 0.10; player.greedBonus += 0.10; player.passives.jolly = (player.passives.jolly || 0) + 1; }
};

const ARSENAL_TYPES = new Set(['kabuto', 'thunder', 'impact', 'clutch']);

// ---------- Tripulación desbloqueable: arma inicial y bonificación (como los personajes de VS) ----------
const CREW_START = {
    nami:    { weapon: 'climatact', text: '+20% Berries y +10% velocidad', apply: p => { p.greedBonus += 0.2; p.speed *= 1.1; } },
    usopp:   { weapon: 'kabuto',    text: '+10% crítico y +20% suerte', apply: p => { p.critChance += 0.10; p.luckBonus += 0.2; } },
    chopper: { weapon: 'roseo',     text: '+20 vida máxima y +1 PV/s (médico)', apply: p => { p.maxHp += 20; p.hp = p.maxHp; p.regenRate += 1; } },
    robin:   { weapon: 'clutch',    text: '+10% área', apply: p => { p.areaBonus *= 1.1; } }
};
function applyCrewStart() {
    const c = CREW_START[selectedCharacter];
    if (!c) return;
    skills[c.weapon].level = 1;
    c.apply(player);
}

function arsenalHit(atk, e, dmgMult) {
    const dmgInfo = calculateDamage(atk.baseDamage * (dmgMult || 1));
    e.hp -= dmgInfo.amount * e.damageTaken;
    spawnDamageText(e.x, e.y, dmgInfo);
    playSound(dmgInfo.isCrit ? 'crit' : 'hit');
    if (e.hp <= 0) killEnemy(e);
}

function handleArsenal(dt, cdMult) {
    // Kabuto: Hissatsu Kayaku Boshi, la bola rebota en los bordes de la pantalla (como el Runetracer de VS)
    const kb = skills.kabuto;
    if (kb.level > 0) {
        kb.timer += dt;
        if (kb.timer >= kb.cooldown * cdMult) {
            kb.timer = 0;
            const t = getNearestEnemy();
            const base = t ? Math.atan2(t.y - player.y, t.x - player.x) : Math.random() * Math.PI * 2;
            const n = kb.evolved ? 2 : 1;
            for (let k = 0; k < n; k++) {
                const a = base + (k ? Math.PI * 0.6 : 0);
                activeAttacks.push({ type: 'kabuto', x: player.x, y: player.y, vx: Math.cos(a) * kb.speed, vy: Math.sin(a) * kb.speed,
                    radius: 14 * player.areaBonus, life: kb.life * (player.durationBonus || 1), maxLife: kb.life, baseDamage: kb.baseDamage, hitCd: new Map(), evo: kb.evolved });
            }
            playSound('pistol');
        }
    }
    // Clima-Tact: Thunderbolt Tempo, rayos sobre enemigos al azar en pantalla (como el Lightning Ring de VS)
    const ct = skills.climatact;
    if (ct.level > 0) {
        ct.timer += dt;
        if (ct.timer >= ct.cooldown * cdMult) {
            ct.timer = 0;
            const near = enemies.filter(e => Math.abs(e.x - player.x) < VIEW_W / 2 && Math.abs(e.y - player.y) < VIEW_H / 2);
            for (let k = 0; k < ct.strikes && near.length; k++) {
                const e = near.splice(Math.floor(Math.random() * near.length), 1)[0];
                activeAttacks.push({ type: 'thunder', x: e.x, y: e.y, radius: (ct.evolved ? 46 : 30) * player.areaBonus,
                    life: 0.35 * (player.durationBonus || 1), maxLife: 0.35, baseDamage: ct.baseDamage, done: false, evo: ct.evolved });
            }
            playSound('laser');
        }
    }
    // Chopper — Kokutei Roseo Mirror: pezuñazo en Heavy Point sobre el más cercano (flor de cerezo, Drum)
    const rs = skills.roseo;
    if (rs.level > 0) {
        rs.timer += dt;
        if (rs.timer >= rs.cooldown * cdMult) {
            const t = getNearestEnemy();
            if (t && Math.hypot(t.x - player.x, t.y - player.y) < 200) {
                rs.timer = 0; player.attackTimer = 0.3;
                activeAttacks.push({ type: 'impact', x: t.x, y: t.y, radius: rs.radius * player.areaBonus, push: 30,
                    life: 0.4, maxLife: 0.4, baseDamage: rs.baseDamage, done: false, evo: rs.evolved, petal: true });
                playSound('kick');
            }
        }
    }
    // Robin — Seis Fleur: Clutch, brazos que brotan en los enemigos y les parten la espalda
    const cl = skills.clutch;
    if (cl.level > 0) {
        cl.timer += dt;
        if (cl.timer >= cl.cooldown * cdMult) {
            const near = enemies.filter(e => Math.hypot(e.x - player.x, e.y - player.y) < 330 * player.areaBonus)
                .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y)).slice(0, cl.targets);
            if (near.length) {
                cl.timer = 0; player.attackTimer = 0.3;
                for (const e of near) activeAttacks.push({ type: 'clutch', target: e, x: e.x, y: e.y, life: 0.5, maxLife: 0.5, hitDelay: 0.22,
                    baseDamage: cl.baseDamage, done: false, evo: cl.evolved, radius: (cl.evolved ? 60 : 0) * player.areaBonus });
                playSound('slash');
            }
        }
    }
    // Dial de Impacto: almacena el golpe y lo suelta en onda alrededor, empujando a los enemigos
    const dl = skills.dial;
    if (dl.level > 0) {
        dl.timer += dt;
        if (dl.timer >= dl.cooldown * cdMult) {
            dl.timer = 0;
            activeAttacks.push({ type: 'impact', x: player.x, y: player.y, radius: dl.radius * player.areaBonus, push: dl.push,
                life: 0.4, maxLife: 0.4, baseDamage: dl.baseDamage, done: false, evo: dl.evolved });
            playSound('boom');
            cameraShake = Math.max(cameraShake, dl.evolved ? 2 : 1);
        }
    }
}

// Devuelve true cuando el ataque termina
function updateArsenalAttack(atk, dt) {
    if (atk.type === 'kabuto') {
        atk.x += atk.vx * dt; atk.y += atk.vy * dt;
        // rebote en los bordes de la vista
        const hw = VIEW_W / 2 - 10, hh = VIEW_H / 2 - 10;
        if (atk.x < player.x - hw && atk.vx < 0 || atk.x > player.x + hw && atk.vx > 0) atk.vx *= -1;
        if (atk.y < player.y - hh && atk.vy < 0 || atk.y > player.y + hh && atk.vy > 0) atk.vy *= -1;
        forEnemiesNear(atk.x, atk.y, atk.radius + 10, e => {
            const last = atk.hitCd.get(e) || -9;
            if (gameTime - last < 0.5) return;
            atk.hitCd.set(e, gameTime);
            arsenalHit(atk, e);
        });
        return atk.life <= 0;
    }
    if (atk.type === 'thunder') {
        if (!atk.done) { atk.done = true; forEnemiesNear(atk.x, atk.y, atk.radius, e => arsenalHit(atk, e)); }
        return atk.life <= 0;
    }
    if (atk.type === 'clutch') {
        if (atk.target && !atk.target._dead) { atk.x = atk.target.x; atk.y = atk.target.y; }
        if (!atk.done && atk.maxLife - atk.life >= atk.hitDelay) {
            atk.done = true;
            const hit = e => { arsenalHit(atk, e); if (!e.isBoss && !e.isMiniboss) e._stun = Math.max(e._stun || 0, 0.8); };
            if (atk.radius > 0) forEnemiesNear(atk.x, atk.y, atk.radius, hit); // Gigantesco Mano: aplasta la zona
            else if (atk.target && !atk.target._dead) hit(atk.target);
        }
        return atk.life <= 0;
    }
    if (atk.type === 'impact') {
        if (!atk.done) {
            atk.done = true;
            forEnemiesNear(atk.x, atk.y, atk.radius, e => {
                if (!e.isBoss) {
                    const d = Math.hypot(e.x - atk.x, e.y - atk.y) || 1;
                    e.x += (e.x - atk.x) / d * atk.push; e.y += (e.y - atk.y) / d * atk.push;
                }
                arsenalHit(atk, e);
            });
        }
        return atk.life <= 0;
    }
    return true;
}

// Dibujo (se llama desde drawAttackFX en js/vfx.js). Devuelve true si lo ha dibujado.
function drawArsenalFX(atk) {
    if (!ARSENAL_TYPES.has(atk.type)) return false;
    const p = atk.maxLife ? Math.min(1, Math.max(0, 1 - atk.life / atk.maxLife)) : 0;
    ctx.save();
    if (atk.type === 'kabuto') {
        // Kayaku Boshi (bola de pólvora) o Midori Boshi (semilla Pop Green) al evolucionar
        ctx.globalAlpha = 0.35; ctx.fillStyle = atk.evo ? '#22c55e' : '#f97316';
        ctx.beginPath(); ctx.arc(atk.x - atk.vx * 0.03, atk.y - atk.vy * 0.03, 6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = atk.evo ? '#16a34a' : '#3f3f46'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(atk.x, atk.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = atk.evo ? '#bbf7d0' : '#fdba74';
        ctx.fillRect(atk.x - 3, atk.y - 4, 2, 2);
    } else if (atk.type === 'thunder') {
        // rayo desde la nube de tormenta hasta el enemigo
        const a = 1 - p;
        ctx.globalAlpha = 0.85 * a; ctx.fillStyle = '#334155';
        ctx.beginPath(); ctx.ellipse(atk.x, atk.y - 150, 34, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = atk.evo ? '#fde047' : '#e0f2fe'; ctx.lineWidth = atk.evo ? 5 : 3; ctx.globalAlpha = a;
        ctx.beginPath(); ctx.moveTo(atk.x, atk.y - 145);
        for (let k = 1; k <= 6; k++) ctx.lineTo(atk.x + (k < 6 ? (Math.sin(k * 7.3 + atk.x) * 14) : 0), atk.y - 145 + k * 24);
        ctx.stroke();
        const g = ctx.createRadialGradient(atk.x, atk.y, 2, atk.x, atk.y, atk.radius);
        g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, atk.evo ? 'rgba(250,204,21,0.5)' : 'rgba(56,189,248,0.5)'); g.addColorStop(1, 'rgba(56,189,248,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(atk.x, atk.y, atk.radius, 0, Math.PI * 2); ctx.fill();
    } else if (atk.type === 'clutch') {
        // brazos de Robin que brotan alrededor del enemigo y se cierran sobre él
        const a = 1 - Math.max(0, p - 0.6) / 0.4, grow = Math.min(1, p / 0.45);
        const n = atk.evo ? 8 : 6, R = (atk.evo ? Math.max(18, atk.radius * 0.6) : 16);
        ctx.globalAlpha = a;
        for (let k = 0; k < n; k++) {
            const ang = k / n * Math.PI * 2;
            const bx = atk.x + Math.cos(ang) * R, by = atk.y + Math.sin(ang) * R * 0.6 + 8;
            const tx = atk.x + Math.cos(ang) * R * (1 - 0.7 * grow), ty = by - 22 * grow;
            ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 6; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
            ctx.strokeStyle = '#f2c39a'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
            ctx.fillStyle = '#f2c39a'; ctx.beginPath(); ctx.arc(tx, ty, 3.2, 0, Math.PI * 2); ctx.fill();
        }
        // pétalos (Hana Hana)
        ctx.fillStyle = '#f9a8d4';
        for (let k = 0; k < 4; k++) { const ang = gameTime * 3 + k * 1.6; ctx.fillRect(atk.x + Math.cos(ang) * 20, atk.y - 10 + Math.sin(ang) * 12, 3, 3); }
    } else if (atk.type === 'impact') {
        const r = atk.radius * (0.3 + 0.7 * p), a = 1 - p;
        if (atk.petal) {
            // Roseo Mirror: flor de cerezo de Drum que se abre en el impacto
            ctx.globalAlpha = 0.9 * a; ctx.fillStyle = atk.evo ? '#ec4899' : '#f9a8d4';
            for (let k = 0; k < 5; k++) { const ang = k / 5 * Math.PI * 2 + p; ctx.beginPath(); ctx.ellipse(atk.x + Math.cos(ang) * r * 0.55, atk.y + Math.sin(ang) * r * 0.4, r * 0.32, r * 0.2, ang, 0, Math.PI * 2); ctx.fill(); }
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(atk.x, atk.y, 5, 0, Math.PI * 2); ctx.fill();
            ctx.restore(); return true;
        }
        ctx.globalAlpha = 0.25 * a; ctx.fillStyle = atk.evo ? '#fca5a5' : '#e2e8f0';
        ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 6, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.9 * a; ctx.strokeStyle = atk.evo ? '#ef4444' : '#f8fafc'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 6, r, r * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2; ctx.globalAlpha = 0.6 * a;
        ctx.beginPath(); ctx.ellipse(atk.x, atk.y + 6, r * 0.7, r * 0.49, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    return true;
}
