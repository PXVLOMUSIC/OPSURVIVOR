// --- RENDER ENGINE (Sea of Stars Aesthetic Pipeline) ---
// Píxel vertical de la imagen de cada mapa que cae en y=0 del mundo (x=0 es el centro de la imagen)
const MAP_ORIGIN_Y = { baratie: 430, alabasta: 446, skypiea: 446, thrillerbark: 446 };
function cameraCenter() {
    const img = IMG[selectedMap + 'Map'];
    if (!assetsLoaded || !img || !img.complete || !img.width) return [player.x, player.y];
    const halfW = img.width * MAP_SCALE / 2;
    const top = -MAP_ORIGIN_Y[selectedMap] * MAP_SCALE, bottom = top + img.height * MAP_SCALE;
    const clampAxis = (v, lo, hi, view) => (hi - lo <= view) ? (lo + hi) / 2 : Math.min(Math.max(v, lo + view / 2), hi - view / 2);
    return [clampAxis(player.x, -halfW, halfW, VIEW_W), clampAxis(player.y, top, bottom, VIEW_H)];
}

function render() {
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.save();
    const shakeMult = (windowOpts && windowOpts.shake === false) ? 0 : 1;
    let shakeX = (Math.random() - 0.5) * cameraShake * 4 * shakeMult;
    let shakeY = (Math.random() - 0.5) * cameraShake * 4 * shakeMult;
    
    // Cámara: sigue al jugador pero no enseña el vacío fuera de la imagen del mapa
    const [camCX, camCY] = cameraCenter();
    const camX = VIEW_W / 2 - camCX + shakeX;
    const camY = VIEW_H / 2 - camCY + shakeY;
    ctx.translate(camX, camY);

    // Map Background: imagen del mapa centrada en x, con su origen vertical en MAP_ORIGIN_Y
    const mapImg = IMG[selectedMap + 'Map'];
    if (assetsLoaded && mapImg && mapImg.complete && mapImg.width) {
        // Mapas pixelados (estilo GBA): se escalan sin suavizado para que el pixel se vea nítido como en los sprites
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(mapImg, -mapImg.width * MAP_SCALE / 2, -MAP_ORIGIN_Y[selectedMap] * MAP_SCALE, mapImg.width * MAP_SCALE, mapImg.height * MAP_SCALE);
    } else {
        const fallback = { baratie: '#0284c7', alabasta: '#d4a373', skypiea: '#bfe3f5', thrillerbark: '#2e1f47' };
        ctx.fillStyle = fallback[selectedMap] || '#0284c7';
        ctx.fillRect(MAP_BOUNDS.minX - 1200, MAP_BOUNDS.minY - 1200, (MAP_BOUNDS.maxX - MAP_BOUNDS.minX) + 2400, (MAP_BOUNDS.maxY - MAP_BOUNDS.minY) + 2400);
    }

    // Drops (VS: los cofres son modelos en el suelo; el resto con glow)
    for (let d of drops) {
        ctx.save();
        if (d.type === 'chest') {
            const img = IMG['chest_t' + d.tier];
            if (img && img.complete) {
                const bob = d.opened ? 0 : Math.sin(gameTime * 3 + d.x) * 1.5;
                ctx.translate(d.x, d.y + bob);
                // sombra en el suelo
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.beginPath(); ctx.ellipse(0, 8, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
                // glow pulsante del tier mientras espera
                if (!d.opened) {
                    const pulse = 0.4 + Math.sin(gameTime * 5 + d.x) * 0.2;
                    const g = getGlow(d.tier === 2 ? '#ffd700' : (d.tier === 1 ? '#dbe4f0' : '#b45309'), 30);
                    ctx.globalAlpha = pulse * 0.7;
                    ctx.drawImage(g, -22, -24);
                    ctx.globalAlpha = 1;
                }
                // frames: 0 cerrado, 1 abriendo, 2 abierto
                let frame = 0;
                if (d.opened) {
                    const progress = 1 - d.openTimer / 0.45;
                    frame = progress < 0.5 ? 1 : 2;
                    // destello blanco al abrirse
                    if (progress < 0.55) {
                        ctx.globalAlpha = 0.8 * (1 - progress / 0.55);
                        ctx.fillStyle = '#fff';
                        ctx.beginPath(); ctx.arc(0, -2, 14, 0, Math.PI * 2); ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                }
                const iw = img.width / 3, ih = img.height;
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, frame * iw, 0, iw, ih, -18, -22, 36, 36);
                ctx.imageSmoothingEnabled = true;
            } else {
                // fallback mientras carga
                ctx.translate(d.x, d.y);
                ctx.fillStyle = '#8b5e3c';
                ctx.fillRect(-9, -8, 18, 13);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-9, -8, 18, 4);
            }
        } else {
            ctx.translate(d.x, d.y + Math.sin(gameTime * 6 + d.x) * 3);
            // Pickups con sprite del propio lore (GBA): monedas, comida, Den Den, tornado
            const spriteMap = { beli: 'money', meat: 'food', denden: 'conch', vacuum: 'tornado' };
            const spriteKey = spriteMap[d.type];
            if (spriteKey && IMG[spriteKey] && IMG[spriteKey].complete) {
                const glowCol = d.type === 'beli' ? '#facc15' : (d.type === 'meat' ? '#f87171' : (d.type === 'denden' ? '#fde047' : '#a78bfa'));
                ctx.globalAlpha = 0.5 + Math.sin(gameTime * 6 + d.x) * 0.15;
                ctx.drawImage(getGlow(glowCol, 20), -20, -20);
                ctx.globalAlpha = 1;
                const img = IMG[spriteKey];
                const s = d.type === 'meat' ? 16 : 14;
                const iw = s * (img.width / img.height);
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, -iw / 2, -s / 2, iw, s);
                ctx.imageSmoothingEnabled = true;
            } else {
                const dCol = d.type === 'xp' ? '#38bdf8' : (d.type === 'beli' ? '#facc15' : (d.type === 'denden' ? '#fde047' : (d.type === 'bell' ? '#67e8f9' : (d.type === 'vacuum' ? '#a78bfa' : '#ef4444'))));
                const glowImg = getGlow(dCol, 20);
                ctx.drawImage(glowImg, -20, -20);
                ctx.fillStyle = dCol;
                ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.restore();
    }

    // Enemy Bullets
    for (let b of enemyBullets) {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
    }

    // Marcas en el suelo (js/vfx.js)
    drawGroundDecals();

    // Enemies with Soft Floor Shadows
    for (let e of enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath(); ctx.ellipse(0, 14, (e.isBoss || e.isMiniboss) ? 24 : 14, 6, 0, 0, Math.PI * 2); ctx.fill();

        const eState = (e.attackTimer > 0) ? 'attack' : 'idle';
        const eSet = (assetsLoaded && ENEMY_IMG[e.type] && ENEMY_IMG[e.type][eState] && ENEMY_IMG[e.type][eState].length) ? ENEMY_IMG[e.type][eState] : (assetsLoaded && ENEMY_IMG[e.type] ? ENEMY_IMG[e.type].idle : null);
        let eImg = null;
        if (eSet && eSet.length) eImg = eSet[e.animIndex % eSet.length];
        if (e.isElite) {
            let col = 'rgba(255, 0, 255, 0.8)';
            let glow = '#ff00ff';
            if (e.type === 'elite_marine') { col = 'rgba(255, 215, 0, 0.8)'; glow = '#ffd700'; }
            else if (e.type === 'elite_kuma') { col = 'rgba(0, 255, 255, 0.8)'; glow = '#00ffff'; }
            else if (e.type === 'elite_moria') { col = 'rgba(128, 0, 128, 0.8)'; glow = '#800080'; }
            else if (e.type === 'elite_tararan') { col = 'rgba(255, 165, 0, 0.8)'; glow = '#ffa500'; }
            else if (e.type === 'elite_hogback') { col = 'rgba(139, 69, 19, 0.8)'; glow = '#8b4513'; }
            else if (e.type === 'elite_cindry') { col = 'rgba(255, 105, 180, 0.8)'; glow = '#ff69b4'; }
            else if (e.type === 'elite_pellona') { col = 'rgba(148, 0, 211, 0.8)'; glow = '#9400d3'; }
            else if (e.type === 'elite_ryuma') { col = 'rgba(255, 255, 255, 0.8)'; glow = '#ffffff'; }
            else if (e.type === 'elite_inupen') { col = 'rgba(0, 191, 255, 0.8)'; glow = '#00bfff'; }
            else if (e.type === 'elite_kumashi') { col = 'rgba(169, 169, 169, 0.8)'; glow = '#a9a9a9'; }
            else if (e.type === 'elite_absalom') { col = 'rgba(75, 0, 130, 0.8)'; glow = '#4b0082'; }
            ctx.strokeStyle = col;
            ctx.lineWidth = 3;
            const glowImg = getGlow(glow, 24);
            ctx.drawImage(glowImg, -24, -24);
            const r = eImg ? Math.max(eImg.width, eImg.height) * (ENEMY_DRAW_SCALE[e.type] || 1) * 0.65 + 4 : 20;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
        }
        if (e._flashUntil && gameTime < e._flashUntil) ctx.filter = 'brightness(2.4) saturate(0.4)';
        if (eImg && eImg.complete) {
            const s = (ENEMY_DRAW_SCALE[e.type] || 1) * (e.isElite ? 1.3 : 1);
            // sprites con orientación conocida: miran hacia el jugador
            const fc = ENEMY_ANIMS[e.type] && ENEMY_ANIMS[e.type].faces;
            if (fc && ((fc > 0) !== (player.x >= e.x))) ctx.scale(-1, 1);
            ctx.drawImage(eImg, -eImg.width*s/2, -eImg.height*s/2, eImg.width*s, eImg.height*s);
        } else if (e.type === 'grunt') ctx.drawImage(Sprites.marine, -16, -16);
        else if (e.type === 'shooter') ctx.drawImage(Sprites.shooter, -16, -16);
        else if (e.type === 'pacifista') ctx.drawImage(Sprites.pacifista, -24, -24);
        else if (e.type === 'boss_krieg') ctx.drawImage(Sprites.krieg, -32, -32);
        else { ctx.fillStyle = '#999'; ctx.fillRect(-16, -16, 32, 32); }
        ctx.filter = 'none';

        if (e.hp < e.maxHp) {
            const barW = (e.isBoss || e.isMiniboss) ? 56 : 26;
            ctx.fillStyle = '#020617'; ctx.fillRect(-barW/2, -28, barW, 5);
            ctx.fillStyle = e.isBoss ? '#facc15' : (e.isElite ? '#fbbf24' : '#f43f5e');
            ctx.fillRect(-barW/2, -28, (e.hp / e.maxHp) * barW, 5);
        }
        // Indicador visual de congelado (Campana de Skypiea)
        if (window.freezeTimer > 0) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'rgba(103, 232, 249, 0.5)';
            ctx.beginPath(); ctx.arc(0, 0, (e.isBoss || e.isMiniboss) ? 26 : 18, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
        // Etiqueta de lore (élites con nombre, Shichibukai y bosses)
        if (e.name || e.isBoss || e.isMiniboss) {
            const loreName = e.isBoss ? BOSS_INFO[e.type] : (e.isMiniboss ? MINIBOSS_INFO[e.type] : e.name);
            if (loreName) {
                // VS: texto grande legible con outline, sin caja negra
                ctx.font = 'bold 14px Bangers, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.lineWidth = 4;
                ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                ctx.strokeText(loreName, 0, -44);
                ctx.fillStyle = e.isBoss ? '#facc15' : (e.isMiniboss ? '#ffa500' : '#fbbf24');
                ctx.fillText(loreName, 0, -44);
                ctx.textAlign = 'left';
            }
        }
        ctx.restore();
    }

    // Ataques del jugador por encima de los enemigos (js/vfx.js)
    for (let atk of activeAttacks) drawAttackFX(atk);

    // Boss Bar Header if Active (VS: barra superior con nombre del boss real, para todos los mapas)
    const boss = enemies.find(e => e.isBoss && e.hp > 0);
    if (boss) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const bw = 420, bh = 14;
        const bx = VIEW_W / 2 - bw / 2, by = 100;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(bx - 6, by - 6, bw + 12, bh + 16);
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
        ctx.strokeRect(bx - 6, by - 6, bw + 12, bh + 16);
        ctx.fillStyle = '#1e1b4b'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#f43f5e'; ctx.fillRect(bx, by, (boss.hp / boss.maxHp) * bw, bh);
        ctx.font = 'bold 15px Bangers, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        const bossLabel = BOSS_INFO[boss.type] || 'BOSS';
        ctx.strokeText(bossLabel, VIEW_W / 2, by - 10);
        ctx.fillStyle = '#facc15';
        ctx.fillText(bossLabel, VIEW_W / 2, by - 10);
        ctx.restore();
    }

    // VS: banner de aparicion de boss/miniboss (grande, centro pantalla, 2s)
    if (window.spawnBanner && window.spawnBanner.life > 0) {
        const b = window.spawnBanner;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = Math.max(0, Math.min(1, b.life / 0.4));
        ctx.font = 'bold 36px Bangers, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 7;
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.strokeText(b.text, VIEW_W / 2, VIEW_H / 2 - 130);
        ctx.fillStyle = b.color;
        ctx.fillText(b.text, VIEW_W / 2, VIEW_H / 2 - 130);
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    // Player with Dynamic Shadow
    drawPlayerAuraBack();
    ctx.save();
    ctx.translate(player.x, player.y);
    gearDrawAura(ctx);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath(); ctx.ellipse(0, 14, 16, 7, 0, 0, Math.PI * 2); ctx.fill();

    gearSpriteTransform(ctx);
    if (player.facing === 1) ctx.scale(-1, 1);
    const set = (assetsLoaded && CHAR_IMG[selectedCharacter]) ? CHAR_IMG[selectedCharacter] : null;
    let img = null;
    if (set) {
        const arr = set[player.animState] && set[player.animState].length ? set[player.animState] : set.idle;
        if (arr && arr.length) img = arr[player.animIndex % arr.length];
    }
    if (img && img.complete) {
        const ph = 48;
        const pw = ph * (img.width / img.height);
        ctx.filter = playerSpriteFilter();
        ctx.drawImage(img, -pw/2, -ph/2, pw, ph);
        ctx.filter = 'none';
    } else if (assetsLoaded && IMG.player && IMG.player.complete) {
        const ph = 48;
        const pw = ph * (IMG.player.width / IMG.player.height);
        ctx.drawImage(IMG.player, -pw/2, -ph/2, pw, ph);
    } else {
        ctx.drawImage(Sprites.luffy, player.animFrame * 32, 0, 32, 32, -16, -16, 32, 32);
    }
    ctx.restore();
    gearDrawWorld(ctx);

    // Partículas (js/vfx.js)
    drawParticles();

    // Damage Numbers (Overcrit / Crit formatting)
    for (let dtObj of damageTexts) {
        ctx.font = dtObj.isOvercrit ? '900 17px Bangers, Arial, sans-serif' : (dtObj.isCrit ? 'bold 15px Bangers, Arial, sans-serif' : '12px sans-serif');
        ctx.fillStyle = dtObj.isOvercrit ? '#c084fc' : (dtObj.isCrit ? '#facc15' : '#ffffff');
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.lineWidth = dtObj.isOvercrit ? 4 : (dtObj.isCrit ? 3.5 : 3);
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.strokeText(dtObj.text, dtObj.x, dtObj.y);
        ctx.fillText(dtObj.text, dtObj.x, dtObj.y);
    }

    // VS: vignette rojo de dano — "estas herido" (pulso breve 0.3s por golpe)
    // Y a partir de 30% de vida: latido suave permanente para ver el limite
    // OPCIONES "menos destellos": alphas reducidos al 35%
    const flashMult = (windowOpts && windowOpts.fewerFlashes) ? 0.35 : 1;
    const hpPctNow = Math.max(0, player.hp / player.maxHp);
    let vignetteAlpha = 0;
    if (player._hurtFlash > 0) {
        const fa = Math.max(0, Math.min(1, player._hurtFlash / 0.35));
        vignetteAlpha += 0.6 * fa * flashMult;
    }
    if (hpPctNow > 0 && hpPctNow <= 0.3) {
        // latido suave ~1Hz entre alpha 0.09 y 0.15
        const beat = (0.09 + 0.06 * (0.5 + 0.5 * Math.sin(gameTime * 6.3))) * flashMult;
        vignetteAlpha = Math.max(vignetteAlpha, beat);
    }
    gearDrawHUD(ctx);
    if (vignetteAlpha > 0.001) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const grad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, Math.min(VIEW_W, VIEW_H) * 0.22, VIEW_W / 2, VIEW_H / 2, Math.max(VIEW_W, VIEW_H) * 0.72);
        grad.addColorStop(0, 'rgba(244, 63, 94, 0)');
        grad.addColorStop(1, 'rgba(200, 20, 40, ' + Math.min(0.4, vignetteAlpha).toFixed(3) + ')');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.restore();
    }

    ctx.restore();
}
