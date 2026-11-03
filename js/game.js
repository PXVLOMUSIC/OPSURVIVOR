let _renderedState = null;
// Un solo bucle: si se volvía al menú y se empezaba otra partida antes del siguiente frame, quedaban
// dos bucles vivos (doble render y doble coste por frame).
let _loopActive = false;
function startLoop() {
    lastTime = performance.now();
    if (_loopActive) return;
    _loopActive = true;
    requestAnimationFrame(gameLoop);
}
function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (gameState === 'PLAYING') update(dt * modeTimeScale()); // Modo Haki: todo va más rápido (js/modes.js)
    flushUI();
    // en pausa, mejoras, cofres o Voluntades la escena está quieta: se dibuja una vez y no se repinta cada frame
    if (gameState === 'PLAYING' || _renderedState !== gameState || _needsRedraw) {
        // un fallo de dibujo no debe congelar el bucle (antes, un radio negativo paraba el juego)
        try { render(); } catch (e) { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; console.error(e); }
        _renderedState = gameState; _needsRedraw = false;
    }
    perfTick(now);

    const _pbShow = gameState === 'PLAYING' ? 'block' : 'none';
    if (_pbShow !== _uiCache.pauseBtn) { _uiCache.pauseBtn = _pbShow; const _pb = uiEl('pause-btn'); if (_pb) _pb.style.display = _pbShow; }
    // música: solo al cambiar de estado (evita .play() cada frame)
    if (_lastMusicState !== gameState) { _lastMusicState = gameState; updateMusic(); gearUpdateButton(); }

    if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'UPGRADE' || gameState === 'ARCANA' || gameState === 'CHEST') {
        requestAnimationFrame(gameLoop);
    } else _loopActive = false;
}

function calculateDamage(baseAtk) {
    let dmg = baseAtk * (1 + player.powerPct / 100) * gearDamageMult();
    let isCrit = false, isOvercrit = false;
    let roll = Math.random();

    if (player.critChance <= 1.0) {
        if (roll < player.critChance) { dmg *= 2.0; isCrit = true; }
    } else {
        dmg *= 2.0; isCrit = true;
        let overRoll = player.critChance - 1.0;
        if (roll < overRoll) { dmg *= 1.75; isOvercrit = true; }
    }
    return { amount: Math.round(dmg), isCrit, isOvercrit };
}

function update(dt) {
    gameTime += dt;
    // Regeneración pasiva (Vitalidad/Regen)
    if (player.regenRate > 0 && player.hp > 0 && player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + player.regenRate * dt);
    }
    // Decaimiento de la sacudida de cámara (clamp para evitar valores negativos -> temblor eterno)
    if (cameraShake > 0) cameraShake = Math.max(0, cameraShake - dt * 15);
    gearUpdate(dt);
    if (player.attackTimer > 0) player.attackTimer -= dt;
    if (player.hitTimer > 0) player.hitTimer -= dt;
    if (player._dmgSoundCd > 0) player._dmgSoundCd -= dt;
    if (window.freezeTimer > 0) window.freezeTimer -= dt;
    // Haoshoku Haki: pulso periodico que aturde a los enemigos cercanos (VS: pasiva activa util)
    if (player.passives.haki_hao > 0) {
        window.haoTimer = (window.haoTimer || 0) - dt;
        if (window.haoTimer <= 0) {
            window.haoTimer = 6;
            const lvl = Math.min(4, player.passives.haki_hao);
            forEnemiesNear(player.x, player.y, 240 * (1 + 0.12 * lvl), en => {
                if (!en.isBoss && !en.isMiniboss) en._stun = 1.5;
            });
            playSound('haoshoku');
            fxRing(player.x, player.y, '#38bdf8', 16, 0.45);
        }
    }
    if (window.vacuumTimer > 0) window.vacuumTimer -= dt;
    if (window.spawnBanner && window.spawnBanner.life > 0) window.spawnBanner.life -= dt;
    // destello rojo de dano: se apaga al dejar de recibir golpes; cooldown de sacudida
    if (player._hurtFlash > 0) player._hurtFlash -= dt;
    if (player._hurtShakeCd > 0) player._hurtShakeCd -= dt;

    // VS: cutscene de evolución — mundo congelado mientras llueve el confetti
    if (window._evolveCut) {
        window._evolveCut.life -= dt;
        if (window._evolveCut.life > 0) {
            if (Math.random() < dt * 55) { // goteo continuo de confetti
                const confettiCols = ['#f43f5e', '#facc15', '#38bdf8', '#a78bfa', '#ffffff'];
                particles.push({ x: player.x + (Math.random() * 220 - 110), y: player.y - 210,
                    vx: (Math.random() - 0.5) * 60, vy: 90 + Math.random() * 90,
                    life: 1.0, maxLife: 1.0, color: confettiCols[Math.floor(Math.random() * 5)], shape: 'star', size: 2.5 + Math.random() * 3, grav: 150 });
            }
            updateParticles(dt);
            return;
        }
        // fin de la cutscene: las mejoras de un cofre abierto durante la evolucion quedaron pendientes
        window._evolveCut = null;
        if (player._pendingChest) {
            const c = player._pendingChest;
            player._pendingChest = null;
            openChestRoulette(c.count, c.tier, c.beli, c.evo);
            return;
        }
    }

    if (gameTime >= 480 && !bossSpawned) spawnBoss();
    // Modo Infinito: tras la victoria, un nuevo boss cada 5 minutos (mas fuerte)
    if (window.endlessMode && gameTime >= (window.nextBossAt || 0) && !enemies.some(e => e.isBoss)) {
        spawnBoss();
        window.nextBossAt = gameTime + 300;
    }
    // Victoria SOLO al matar al boss (estilo VS) — a los 8 min aparece el boss

    let moveX = 0, moveY = 0;
    if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;
    if (joystick.active) { moveX = joystick.dx; moveY = joystick.dy; }

    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
        const speedMult = gearSpeedMult() * (gameTime < (player._slowUntil || 0) ? player._slowMult : 1);
        const stepX = (moveX / (len > 1 ? len : 1)) * player.speed * speedMult * dt;
        const stepY = (moveY / (len > 1 ? len : 1)) * player.speed * speedMult * dt;
        const newX = player.x + stepX;
        const newY = player.y + stepY;
        const poly = walkPoly();
        const oldX = player.x, oldY = player.y;
        if (pointInPoly(newX, player.y, poly)) player.x = newX;
        if (pointInPoly(player.x, newY, poly)) player.y = newY;
        // Obstáculos del mapa: desliza alrededor; si el empuje saca del mapa, no se mueve
        const [ox, oy] = pushOutOfObstacles(player.x, player.y, 10);
        if (pointInPoly(ox, oy, poly)) { player.x = ox; player.y = oy; } else { player.x = oldX; player.y = oldY; }
        if (moveX !== 0) player.facing = moveX > 0 ? 1 : -1;
        player.isMoving = true;
    } else {
        player.isMoving = false;
    }
    // animation state machine
    if (player.hitTimer > 0) player.animState = 'hit';
    else if (player.attackTimer > 0) player.animState = 'attack';
    else if (player.isMoving) player.animState = 'walk';
    else player.animState = 'idle';

    player.animTimer += dt;
    const set = CHAR_IMG[selectedCharacter];
    const arr = (set && set[player.animState] && set[player.animState].length) ? set[player.animState] : (set && set.idle);
    const animLen = arr ? arr.length : 1;
    if (player.animTimer > 0.1) { player.animIndex = (player.animIndex + 1) % animLen; player.animTimer = 0; }
    if (player.animState === 'idle') player.animIndex = 0;

    const hasObstacles = mapObstacles().length > 0;
    rebuildEnemyGrid();
    handleAttacks(dt);
    handleSpawning(dt);
    updateEvents(dt);
    updateProps(dt);

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.isProp) continue; // barriles y faroles: no se mueven ni hacen daño
        const edx = player.x - e.x, edy = player.y - e.y, edist = Math.hypot(edx, edy);
        // Campana de Skypiea (VS Orologion): los enemigos quedan congelados 10s
        if (window.freezeTimer > 0) {
            e.animState = 'idle';
            continue;
        }
        // Haoshoku Haki: aturdido (los pulso no afectan a bosses/minibosses)
        if ((e._stun || 0) > 0) {
            e._stun -= dt;
            e.animState = 'idle';
            continue;
        }

        // Enjambre de VS (murciélagos): cruzan en línea recta sin perseguirte y se van
        if (e.fixedDir) {
            e.x += e.fixedDir[0] * e.speed * gearEnemySpeedMult() * dt; e.y += e.fixedDir[1] * e.speed * gearEnemySpeedMult() * dt;
            e.ttl -= dt;
            if (e.ttl <= 0) { enemies.splice(i, 1); continue; }
        }
        const beh = e.fixedDir ? null : ENEMY_BEHAVIOR[e.type];
        if (beh && enemyBehavior(e, beh, edx, edy, edist, dt)) { enemies.splice(i, 1); continue; }
        let mvx = e.fixedDir ? e.fixedDir[0] : 0, mvy = e.fixedDir ? e.fixedDir[1] : 0;
        if (edist > 0 && !e.fixedDir) {
            let vx = edx / edist, vy = edy / edist, sp = e.speed;
            if (beh === 'zigzag' || beh === 'hollow') {
                // ondulación perpendicular a la dirección (murciélagos de VS)
                e._zz = (e._zz || Math.random() * 6) + dt * 5;
                const w = Math.sin(e._zz) * 0.9;
                vx -= (edy / edist) * w; vy += (edx / edist) * w;
            }
            if (e._dashT > 0) { vx = e._dashVx; vy = e._dashVy; sp *= 3; }
            mvx = vx; mvy = vy;
            if (e._slowT > gameTime) sp *= e._slowM; // Rain Tempo / Tabasco Boshi (js/crew.js)
            e.x += vx * sp * gearEnemySpeedMult() * dt;
            e.y += vy * sp * gearEnemySpeedMult() * dt;
            // Los enemigos normales rodean rejas y barandillas; jefes y minijefes las atraviesan
            if (hasObstacles && !e.isBoss && !e.isMiniboss) [e.x, e.y] = pushOutOfObstacles(e.x, e.y, 10);
        }
        if (e.isBoss && edist < 40) e.attackTimer = 0.4;
        if (e.attackTimer > 0) { e.attackTimer -= dt; e.animState = 'attack'; }
        else e.animState = 'idle';
        enemyFacing(e, mvx, mvy, edx, edy);
        e.animTimer += dt;
        const eSet = (ENEMY_IMG[e.type] && ENEMY_IMG[e.type][e.animState] && ENEMY_IMG[e.type][e.animState].length) ? ENEMY_IMG[e.type][e.animState] : (ENEMY_IMG[e.type] ? ENEMY_IMG[e.type].idle : null);
        if (eSet && eSet.length && e.animTimer > 0.12) {
            e.animIndex = (e.animIndex + 1) % eSet.length;
            e.animTimer = 0;
        }

        if (edist < 22 && beh === 'hollow') {
            // Horo Horo no Mi: el fantasma atraviesa y te hunde ("Soy una babosa...") y desaparece
            player._slowUntil = gameTime + 1.5; player._slowMult = 0.75;
            player.hp -= e.damage * ((1 - (player.armor / 100)) * gearDamageTakenMult());
            fxRing(e.x, e.y, '#ec4899', 14, 0.3);
            if (!window._hollowTxt || gameTime > window._hollowTxt) { window._hollowTxt = gameTime + 4; spawnDamageText(player.x, player.y - 30, { amount: 'NEGATIVE...', isCrit: false, isOvercrit: false }); }
            enemies.splice(i, 1);
            if (player.hp <= 0) { triggerGameOver(); return; }
            updateUI();
            continue;
        }
        if (edist < 22) {
            const dmgMult = (1 - (player.armor / 100)) * (1 - player.evasion) * gearDamageTakenMult();
            player.hp -= e.damage * BALANCE.contactMult * dt * dmgMult;
            player.hitTimer = 0.12;
            // VS: destello rojo + sacudida MUY breve (pulso con cooldown, no constante)
            if (player._hurtFlash <= 0.05) player._hurtFlash = 0.35;
            if (!player._hurtShakeCd || player._hurtShakeCd <= 0) { cameraShake = Math.max(cameraShake, 1.8); player._hurtShakeCd = 0.35; }
            if (!player._dmgSoundCd || player._dmgSoundCd <= 0) { playSound('hurt'); player._dmgSoundCd = 0.25; }
            if (player.hp <= 0) { triggerGameOver(); return; }
            updateUI();
        }

        if (ENEMY_RANGED.has(e.type)) {
            e.shootTimer = (e.shootTimer || 0) + dt;
            if (e.shootTimer >= BALANCE.shooterCd && edist < 340) {
                e.shootTimer = 0;
                e.attackTimer = 0.3;
                const bAngle = Math.atan2(edy, edx);
                enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(bAngle) * 240, vy: Math.sin(bAngle) * 240, life: 2.2, damage: BALANCE.bulletDmg });
            }
        }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
        if (Math.hypot(player.x - b.x, player.y - b.y) < 16) {
            const dmgMult = (1 - (player.armor / 100)) * (1 - player.evasion) * gearDamageTakenMult();
            player.hp -= b.damage * dmgMult; player.hitTimer = 0.12; playSound('hurt'); updateUI();
            if (player._hurtFlash <= 0.05) player._hurtFlash = 0.35;
            if (!player._hurtShakeCd || player._hurtShakeCd <= 0) { cameraShake = Math.max(cameraShake, 1.8); player._hurtShakeCd = 0.35; }
            enemyBullets.splice(i, 1);
            if (player.hp <= 0) { triggerGameOver(); return; }
            continue;
        }
        if (b.life <= 0) enemyBullets.splice(i, 1);
    }

    vfxUpdate(dt);
    for (let i = activeAttacks.length - 1; i >= 0; i--) {
        const atk = activeAttacks[i];
        atk.life -= dt;
        if (ARSENAL_TYPES.has(atk.type)) { if (updateArsenalAttack(atk, dt)) activeAttacks.splice(i, 1); continue; }

        if (atk.type === 'pistol') {
            // El brazo de goma sale del hombro de Luffy: sigue al jugador y, al llegar al máximo, vuelve
            if (atk.attached) { atk.startX = player.x; atk.startY = player.y; }
            if (atk.retracting) {
                atk.currentRange -= atk.speed * 1.5 * dt;
                if (atk.currentRange <= 0) activeAttacks.splice(i, 1);
                continue;
            }
            atk.currentRange = Math.min(atk.maxRange, atk.currentRange + atk.speed * dt);
            const endX = atk.startX + Math.cos(atk.angle) * atk.currentRange;
            const endY = atk.startY + Math.sin(atk.angle) * atk.currentRange;

            for (let e of enemies) {
                if (!atk.hitEnemies.has(e) && Math.hypot(e.x - endX, e.y - endY) < 28) {
                    const dmgInfo = calculateDamage(atk.baseDamage);
                    e.hp -= dmgInfo.amount * e.damageTaken;
                    atk.hitEnemies.add(e);
                    spawnDamageText(endX, endY, dmgInfo);
                    playSound(dmgInfo.isCrit ? 'crit' : 'hit');
                    vfxOnHit(atk, e, endX, endY);
                    if (e.hp <= 0) killEnemy(e);
                }
            }
            if (atk.currentRange >= atk.maxRange) {
                if (atk.attached) atk.retracting = true;
                else activeAttacks.splice(i, 1);
            }
        } else if (atk.type === 'gatling') {
            atk.x = player.x; atk.y = player.y;
            forEnemiesNear(atk.x, atk.y, atk.radius, function (e) {
                const dmgInfo = calculateDamage(atk.baseDamage);
                e.hp -= dmgInfo.amount * dt * 3.0 * e.damageTaken;
                if (Math.random() < 0.12) spawnDamageText(e.x, e.y, dmgInfo);
                if (Math.random() < 0.06) vfxOnHit(atk, e);
                if (e.hp <= 0) killEnemy(e);
            });
            if (atk.life <= 0) activeAttacks.splice(i, 1);
        } else if (atk.type === 'bazooka') {
            if (atk.hitDelay && atk.maxLife - atk.life < atk.hitDelay) continue; // el golpe aún no ha llegado
            // VS: la explosion es un golpe UNICO por enemigo (bug de frames corregido)
            forEnemiesNear(atk.x, atk.y, atk.radius, function (e) {
                if (!atk.hitEnemies.has(e)) {
                    atk.hitEnemies.add(e);
                    const dmgInfo = calculateDamage(atk.baseDamage);
                    e.hp -= dmgInfo.amount * e.damageTaken;
                    spawnDamageText(e.x, e.y, dmgInfo);
                    playSound(dmgInfo.isCrit ? 'crit' : 'hit');
                    vfxOnHit(atk, e);
                    if (e.hp <= 0) killEnemy(e);
                }
            });
            if (atk.life <= 0) activeAttacks.splice(i, 1);
        } else if (atk.type === 'santoryu') {
            forEnemiesNear(atk.x, atk.y, atk.radius, function (e) {
                if (!atk.hitEnemies.has(e)) {
                    atk.hitEnemies.add(e);
                    const dmgInfo = calculateDamage(atk.baseDamage);
                    e.hp -= dmgInfo.amount * e.damageTaken;
                    spawnDamageText(e.x, e.y, dmgInfo);
                    playSound(dmgInfo.isCrit ? 'crit' : 'hit');
                    vfxOnHit(atk, e);
                    if (e.hp <= 0) killEnemy(e);
                }
            });
            if (atk.life <= 0) activeAttacks.splice(i, 1);
        } else if (atk.type === 'onigiri') {
            forEnemiesNear(atk.x, atk.y, atk.radius, function (e) {
                if (!atk.hitEnemies.has(e)) {
                    atk.hitEnemies.add(e);
                    const dmgInfo = calculateDamage(atk.baseDamage);
                    e.hp -= dmgInfo.amount * e.damageTaken;
                    spawnDamageText(e.x, e.y, dmgInfo);
                    playSound(dmgInfo.isCrit ? 'crit' : 'hit');
                    vfxOnHit(atk, e);
                    if (e.hp <= 0) killEnemy(e);
                }
            });
            if (atk.life <= 0) activeAttacks.splice(i, 1);
        } else if (atk.type === 'diablejambe') {
            forEnemiesNear(atk.x, atk.y, atk.radius, function (e) {
                const dmgInfo = calculateDamage(atk.baseDamage);
                e.hp -= dmgInfo.amount * dt * 4 * e.damageTaken;
                if (Math.random() < 0.1) spawnDamageText(e.x, e.y, dmgInfo);
                if (Math.random() < 0.06) vfxOnHit(atk, e);
                if (e.hp <= 0) killEnemy(e);
            });
            if (atk.life <= 0) activeAttacks.splice(i, 1);
        } else if (atk.type === 'muchi') {
            // Muchi: abanico frontal, un solo golpe por enemigo
            forEnemiesNear(player.x, player.y, atk.radius, function (e) {
                if (atk.hitEnemies.has(e)) return;
                const dAng = Math.atan2(e.y - player.y, e.x - player.x);
                let diff = Math.abs(dAng - atk.angle);
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                if (diff < 1.1) {
                    atk.hitEnemies.add(e);
                    const dmgInfo = calculateDamage(atk.baseDamage);
                    e.hp -= dmgInfo.amount * e.damageTaken;
                    spawnDamageText(e.x, e.y, dmgInfo);
                    playSound(dmgInfo.isCrit ? 'crit' : 'hit');
                    vfxOnHit(atk, e);
                    if (e.hp <= 0) killEnemy(e);
                }
            });
            if (atk.life <= 0) activeAttacks.splice(i, 1);
        } else if (atk.type === 'ono' || atk.type === 'concasse') {
            if (atk.hitDelay && atk.maxLife - atk.life < atk.hitDelay) continue; // la pierna aún no ha llegado al suelo
            forEnemiesNear(atk.x, atk.y, atk.radius, function (e) {
                if (!atk.hitEnemies.has(e)) {
                    atk.hitEnemies.add(e);
                    const dmgInfo = calculateDamage(atk.baseDamage);
                    e.hp -= dmgInfo.amount * e.damageTaken;
                    spawnDamageText(e.x, e.y, dmgInfo);
                    playSound(dmgInfo.isCrit ? 'crit' : 'hit');
                    vfxOnHit(atk, e);
                    if (e.hp <= 0) killEnemy(e);
                }
            });
            if (atk.life <= 0) activeAttacks.splice(i, 1);
        } else if (atk.type === 'tatsumaki') {
            atk.spin += dt * 9;
            atk.x = player.x; atk.y = player.y;
            forEnemiesNear(atk.x, atk.y, atk.radius, function (e) {
                const dmgInfo = calculateDamage(atk.baseDamage);
                e.hp -= dmgInfo.amount * dt * 4 * e.damageTaken;
                if (Math.random() < 0.08) spawnDamageText(e.x, e.y, dmgInfo);
                if (Math.random() < 0.06) vfxOnHit(atk, e);
                if (e.hp <= 0) killEnemy(e);
            });
            if (atk.life <= 0) activeAttacks.splice(i, 1);
        } else if (atk.type === 'partycourse') {
            atk.spin += dt * 11;
            atk.x = player.x; atk.y = player.y;
            forEnemiesNear(atk.x, atk.y, atk.radius, function (e) {
                const dmgInfo = calculateDamage(atk.baseDamage);
                e.hp -= dmgInfo.amount * dt * 3.5 * e.damageTaken;
                if (Math.random() < 0.1) spawnDamageText(e.x, e.y, dmgInfo);
                if (Math.random() < 0.06) vfxOnHit(atk, e);
                if (e.hp <= 0) killEnemy(e);
            });
            if (atk.life <= 0) activeAttacks.splice(i, 1);
        } else if (atk.type === 'flyingslash' || atk.type === 'collier' || atk.type === 'joueshot' || atk.type === 'poundho') {
            atk.currentRange += atk.speed * dt;
            const endX = atk.startX + Math.cos(atk.angle) * atk.currentRange;
            const endY = atk.startY + Math.sin(atk.angle) * atk.currentRange;
            const hitR = atk.type === 'poundho' ? 38 : 24;
            forEnemiesNear(endX, endY, hitR, function (e) {
                if (!atk.hitEnemies.has(e)) {
                    atk.hitEnemies.add(e);
                    const dmgInfo = calculateDamage(atk.baseDamage);
                    e.hp -= dmgInfo.amount * e.damageTaken;
                    spawnDamageText(endX, endY, dmgInfo);
                    playSound(dmgInfo.isCrit ? 'crit' : 'hit');
                    vfxOnHit(atk, e, e.x, e.y);
                    if (e.hp <= 0) killEnemy(e);
                }
            });
            if (atk.currentRange >= atk.maxRange) activeAttacks.splice(i, 1);
        }
    }

    enemies = enemies.filter(e => e.hp > 0);

    for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        // move inaccessible drops toward walkable area
        if (hasObstacles && d.type !== 'chest' && hitsObstacle(d.x, d.y, 6)) [d.x, d.y] = pushOutOfObstacles(d.x, d.y, 6);
        if (d.type === 'chest' && hasObstacles && hitsObstacle(d.x, d.y, 14)) [d.x, d.y] = pushOutOfObstacles(d.x, d.y, 14);
        if (!pointInPoly(d.x, d.y, walkPoly())) {
            const ang = Math.atan2(0 - d.y, 0 - d.x);
            d.x += Math.cos(ang) * 60 * dt;
            d.y += Math.sin(ang) * 60 * dt;
        }
        const dist = Math.hypot(player.x - d.x, player.y - d.y);
        if (d.type === 'chest') {
            // VS: el cofre queda en el suelo hasta pisarlo — no lo atrae el iman ni el vacuum
            if (d.opened) {
                d.openTimer -= dt;
                if (d.openTimer <= 0) {
                    // recompensa al terminar la animacion de apertura
                    // VS: la ruleta del cofre revela 1, 3 o 5 objetos (js/loot.js)
                    const count = chestItemCount();
                    const tierBase = ECONOMY.chestBase[d.tier] || ECONOMY.chestBase[0];
                    const beliVal = Math.round((tierBase + Math.random() * tierBase) * beliScale());
                    addBeli(beliVal, 'chest');
                    const evoBefore = Object.keys(skills).filter(k => skills[k].evolved);
                    if (d.canEvolve) checkEvolutions();
                    const evoNames = Object.keys(skills).filter(k => skills[k].evolved && !evoBefore.includes(k)).map(k => EVOLUTIONS[k].name);
                    const chest = { count, tier: d.tier, beli: beliVal, evo: evoNames };
                    // VS: si la cutscene de evolucion sigue viva, la ruleta espera
                    if (window._evolveCut && window._evolveCut.life > 0) player._pendingChest = chest;
                    else openChestRoulette(chest.count, chest.tier, chest.beli, chest.evo);
                    updateUI();
                    drops.splice(i, 1);
                }
            } else if (dist < 28) {
                // abierto al pisarlo: brillo, sonido y burst dorado — luego la recompensa
                d.opened = true; d.openTimer = 0.45;
                playSound('chest');
                cameraShake = 1.2;
                fxStars(d.x, d.y - 6, (windowOpts && windowOpts.fewerFlashes) ? 4 : 12);
                fxRing(d.x, d.y, '#ffd24a', 18, 0.4);
            }
            // chispea mientras espera en el suelo
            if (d.opened && Math.random() < dt * 30) fxStars(d.x, d.y - 10, 1);
            else if (!d.opened && Math.random() < dt * 3) particles.push({ x: d.x + (Math.random()*16-8), y: d.y - 6, vx: 0, vy: -14, life: 0.5, maxLife: 0.5, color: d.tier === 2 ? '#ffd700' : (d.tier === 1 ? '#dbe4f0' : '#fbbf24'), shape: 'star', size: 2, grav: 0 });
            continue;
        }
        if (window.vacuumTimer > 0 && d.type === 'xp' && dist > 0) {
            // Iman Magico (VS Vacuum): las gemas vuelan hacia el jugador
            d.x += ((player.x - d.x) / dist) * 420 * dt;
            d.y += ((player.y - d.y) / dist) * 420 * dt;
        }
        if (dist < 110 * player.pickupBonus && dist > 0) {
            d.x += ((player.x - d.x) / dist) * 260 * dt;
            d.y += ((player.y - d.y) / dist) * 260 * dt;
        }
        if (dist < 22) {
            if (d.type === 'xp') {
                player.xp += d.value * player.growthBonus; playSound('gem');
                while (player.xp >= player.nextXp) levelUp();
            } else if (d.type === 'beli') {
                addBeli(d.value, d.src || 'coin'); playSound('coin');
            } else if (d.type === 'meat') {
                player.hp = Math.min(player.maxHp, player.hp + BALANCE.meatHeal); playSound('meat');
            } else if (d.type === 'denden') {
                // Den Den Mushi dorado (VS Rosary): limpia la pantalla de enemigos — sin drops
                window.spawnBanner = { text: '¡DEN DEN MUSHI DORADO! Pantalla limpia', life: 2.0, color: '#ffd700' };
                const targets = enemies.slice();
                cameraShake = 2;
                playSound('boom');
                targets.forEach(en => {
                    if (en.isBoss || en.isMiniboss) return; // los minibosses/boss no caen aqui
                    en.hp = 0;
                    for (let k = 0; k < 4; k++) {
                        const ang = Math.random() * Math.PI * 2;
                        particles.push({ x: en.x, y: en.y, vx: Math.cos(ang) * 70, vy: Math.sin(ang) * 70, life: 0.4, color: '#ffd700' });
                    }
                });
            } else if (d.type === 'bell') {
                // Campana de Skypiea (VS Orologion): congela a todos los enemigos
                window.freezeTimer = 6;
                window.spawnBanner = { text: '¡CAMPANA DE SKYPIEA! Enemigos congelados 6s', life: 2.2, color: '#67e8f9' };
                cameraShake = 1;
                playSound('bell');
            } else if (d.type === 'vacuum') {
                // Iman Magico (VS Vacuum): atrae todas las gemas de XP hacia el jugador
                window.vacuumTimer = 2.0;
                playSound('magnet');
            }
            updateUI(); drops.splice(i, 1);
        }
    }

    for (let i = damageTexts.length - 1; i >= 0; i--) {
        const dtObj = damageTexts[i];
        dtObj.life -= dt; dtObj.y -= 28 * dt;
        if (dtObj.life <= 0) damageTexts.splice(i, 1);
    }
    updateParticles(dt);

    document.getElementById('time-txt').innerText = formatTime(gameTime);
}

function handleAttacks(dt) {
    const cdMult = (1 - (player.cdReduction / 100)) * gearCdMult();

    if (CHAR_SKILLS[selectedCharacter].includes('pistol')) skills.pistol.timer += dt;
    if (CHAR_SKILLS[selectedCharacter].includes('pistol') && skills.pistol.timer >= skills.pistol.cooldown * cdMult) {
        skills.pistol.timer = 0;
        player.attackTimer = 0.35;
        let target = getNearestEnemy();
        let angle = player.facing === 1 ? 0 : Math.PI;
        if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);

        playSound('stretch');
        activeAttacks.push({
            type: 'pistol', startX: player.x, startY: player.y, attached: true,
            angle: angle, speed: 780, currentRange: 0,
            maxRange: skills.pistol.range * player.areaBonus,
            baseDamage: skills.pistol.baseDamage,
            hitEnemies: new Set()
        });
    }

    // Arma compartida: Cuchillo (disparo rápido, disponible para todos)
    if (skills.cuchillo.level > 0) {
        skills.cuchillo.timer += dt;
        if (skills.cuchillo.timer >= skills.cuchillo.cooldown * cdMult) {
            skills.cuchillo.timer = 0;
            player.attackTimer = 0.25;
            let target = getNearestEnemy();
            let angle = player.facing === 1 ? 0 : Math.PI;
            if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);
            playSound('throw');
            // Evolución (Shakushi de Kuro): abanico de 5 hojas
            const fan = skills.cuchillo.evolved ? [-0.5, -0.25, 0, 0.25, 0.5] : [0];
            for (const off of fan) activeAttacks.push({ vis: 'knife',
                type: 'pistol', startX: player.x, startY: player.y,
                angle: angle + off, speed: 820, currentRange: 0,
                maxRange: skills.cuchillo.range * player.areaBonus,
                baseDamage: skills.cuchillo.baseDamage,
                hitEnemies: new Set()
            });
        }
    }

    if (skills.gatling.level > 0 && CHAR_SKILLS[selectedCharacter].includes('gatling')) {
        skills.gatling.timer += dt;
        if (skills.gatling.timer >= skills.gatling.cooldown * cdMult) {
            skills.gatling.timer = 0;
            playSound('gatling');
            activeAttacks.push({
                type: 'gatling', x: player.x, y: player.y,
                radius: skills.gatling.radius * player.areaBonus,
                life: skills.gatling.duration * (player.durationBonus || 1), maxLife: skills.gatling.duration * (player.durationBonus || 1),
                baseDamage: skills.gatling.baseDamage
            });
        }
    }

    if (skills.bazooka.level > 0 && CHAR_SKILLS[selectedCharacter].includes('bazooka')) {
        skills.bazooka.timer += dt;
        if (skills.bazooka.timer >= skills.bazooka.cooldown * cdMult) {
            skills.bazooka.timer = 0;
            let target = getNearestEnemy();
            let bx = target ? target.x : player.x;
            let by = target ? target.y : player.y;
            playSound('boom');
            activeAttacks.push({
                type: 'bazooka', x: bx, y: by,
                radius: skills.bazooka.radius * player.areaBonus,
                life: 0.5, maxLife: 0.5, hitDelay: 0.15,
                baseDamage: skills.bazooka.baseDamage,
                hitEnemies: new Set()
            });
            player.attackTimer = 0.2;
        }
    }

    // Arma compartida: Granada (explosión en área, disponible para todos)
    if (skills.granada.level > 0) {
        skills.granada.timer += dt;
        if (skills.granada.timer >= skills.granada.cooldown * cdMult) {
            skills.granada.timer = 0;
            let target = getNearestEnemy();
            let bx = target ? target.x : player.x;
            let by = target ? target.y : player.y;
            playSound('boom');
            // Evolución (Nose Fancy Cannon de Mr. 5): dos bombas más sobre otros enemigos
            const spots = [[bx, by]];
            if (skills.granada.evolved) for (let k = 0; k < 2 && enemies.length; k++) { const e2 = enemies[Math.floor(Math.random() * enemies.length)]; if (Math.hypot(e2.x - player.x, e2.y - player.y) < 520) spots.push([e2.x, e2.y]); }
            for (const [gx, gy] of spots) activeAttacks.push({ vis: 'grenade',
                type: 'bazooka', x: gx, y: gy,
                radius: skills.granada.radius * player.areaBonus,
                life: 0.55, maxLife: 0.55, hitDelay: 0.19,
                baseDamage: skills.granada.baseDamage,
                hitEnemies: new Set()
            });
            player.attackTimer = 0.2;
        }
    }

    // Arma compartida: Rifle (disparo preciso a largo alcance)
    if (skills.rifle.level > 0) {
        skills.rifle.timer += dt;
        if (skills.rifle.timer >= skills.rifle.cooldown * cdMult) {
            skills.rifle.timer = 0;
            player.attackTimer = 0.25;
            let target = getNearestEnemy();
            let angle = player.facing === 1 ? 0 : Math.PI;
            if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);
            playSound('pistol');
            // Evolución (Sogeking): la bala perfora en línea recta
            activeAttacks.push({ vis: 'rifle',
                type: skills.rifle.evolved ? 'poundho' : 'pistol', startX: player.x, startY: player.y,
                angle: angle, speed: 900, currentRange: 0,
                maxRange: skills.rifle.range * player.areaBonus,
                baseDamage: skills.rifle.baseDamage,
                hitEnemies: new Set()
            });
        }
    }

    // Arma compartida: Ballesta (virote perforante)
    if (skills.ballesta.level > 0) {
        skills.ballesta.timer += dt;
        if (skills.ballesta.timer >= skills.ballesta.cooldown * cdMult) {
            skills.ballesta.timer = 0;
            player.attackTimer = 0.25;
            let target = getNearestEnemy();
            let angle = player.facing === 1 ? 0 : Math.PI;
            if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);
            playSound('twang');
            activeAttacks.push({ vis: 'bolt',
                type: 'poundho', startX: player.x, startY: player.y,
                angle: angle, speed: skills.ballesta.speed, currentRange: 0,
                maxRange: skills.ballesta.range * player.areaBonus,
                baseDamage: skills.ballesta.baseDamage,
                hitEnemies: new Set()
            });
        }
    }

    // Arma compartida: Lanza de abordaje (estocada rápida)
    if (skills.lanza.level > 0) {
        skills.lanza.timer += dt;
        if (skills.lanza.timer >= skills.lanza.cooldown * cdMult) {
            skills.lanza.timer = 0;
            player.attackTimer = 0.2;
            let target = getNearestEnemy();
            let angle = player.facing === 1 ? 0 : Math.PI;
            if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);
            playSound('slash');
            // Evolución (Bisento de Barbablanca): barrido en tres direcciones
            for (const off of (skills.lanza.evolved ? [0, 2.094, -2.094] : [0])) activeAttacks.push({ vis: 'spear',
                type: 'collier', startX: player.x, startY: player.y,
                angle: angle + off, speed: 700, currentRange: 0,
                maxRange: skills.lanza.range * player.areaBonus,
                baseDamage: skills.lanza.baseDamage,
                hitEnemies: new Set()
            });
        }
    }

    // Arma compartida: Hacha pirata (tajo pesado en área)
    if (skills.hacha.level > 0) {
        skills.hacha.timer += dt;
        if (skills.hacha.timer >= skills.hacha.cooldown * cdMult) {
            skills.hacha.timer = 0;
            let target = getNearestEnemy();
            let bx = target ? target.x : player.x;
            let by = target ? target.y : player.y;
            playSound('boom');
            activeAttacks.push({ vis: 'axe',
                type: 'bazooka', x: bx, y: by,
                radius: skills.hacha.radius * player.areaBonus,
                life: 0.5, maxLife: 0.5, hitDelay: 0.22,
                baseDamage: skills.hacha.baseDamage,
                hitEnemies: new Set()
            });
            player.attackTimer = 0.2;
        }
    }

    // Arma compartida: Shuriken (proyectil arrojadizo)
    if (skills.shuriken.level > 0) {
        skills.shuriken.timer += dt;
        if (skills.shuriken.timer >= skills.shuriken.cooldown * cdMult) {
            skills.shuriken.timer = 0;
            player.attackTimer = 0.2;
            let target = getNearestEnemy();
            let angle = player.facing === 1 ? 0 : Math.PI;
            if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);
            playSound('throw');
            // Evolución (Ninpo de Raizo): cuatro shuriken en cruz además del dirigido
            for (const off of (skills.shuriken.evolved ? [0, Math.PI / 4, 3 * Math.PI / 4, -Math.PI / 4, -3 * Math.PI / 4] : [0])) activeAttacks.push({ vis: 'shuriken',
                type: 'flyingslash', startX: player.x, startY: player.y,
                angle: angle + off, speed: skills.shuriken.speed, currentRange: 0,
                maxRange: skills.shuriken.range * player.areaBonus,
                baseDamage: skills.shuriken.baseDamage,
                hitEnemies: new Set()
            });
        }
    }

    // Arma compartida: Pulso de Haoshoku (onda de Haki)
    if (skills.hakiPulse.level > 0) {
        skills.hakiPulse.timer += dt;
        if (skills.hakiPulse.timer >= skills.hakiPulse.cooldown * cdMult) {
            skills.hakiPulse.timer = 0;
            playSound('haoshoku');
            activeAttacks.push({ vis: 'haki',
                type: 'tatsumaki', x: player.x, y: player.y,
                radius: skills.hakiPulse.radius * player.areaBonus,
                duration: skills.hakiPulse.duration * (player.durationBonus || 1), life: skills.hakiPulse.duration * (player.durationBonus || 1),
                baseDamage: skills.hakiPulse.baseDamage,
                hitEnemies: new Set()
            });
            // Evolución (Rey de los Conquistadores): el pulso aturde 1 s a los enemigos normales
            if (skills.hakiPulse.evolved) forEnemiesNear(player.x, player.y, skills.hakiPulse.radius * player.areaBonus, e => { if (!e.isBoss && !e.isMiniboss) e._stun = Math.max(e._stun || 0, 1); });
            player.attackTimer = 0.2;
        }
    }

    // Armas de la tripulación (Kabuto, Clima-Tact, Roseo, Clutch) y Dial de Impacto compartido (js/arsenal.js)
    handleArsenal(dt, cdMult);

    // Gears: medidor + activacion manual (js/gears.js)

    if (skills.santoryu.level > 0 && CHAR_SKILLS[selectedCharacter].includes('santoryu')) {
        skills.santoryu.timer += dt;
        if (skills.santoryu.timer >= skills.santoryu.cooldown * cdMult) {
            skills.santoryu.timer = 0;
            playSound('slash');
            activeAttacks.push({
                type: 'santoryu', x: player.x, y: player.y,
                radius: skills.santoryu.radius * player.areaBonus,
                life: 0.4, maxLife: 0.4,
                baseDamage: skills.santoryu.baseDamage,
                hitEnemies: new Set()
            });
            player.attackTimer = 0.2;
        }
    }

    if (skills.onigiri.level > 0 && CHAR_SKILLS[selectedCharacter].includes('onigiri')) {
        skills.onigiri.timer += dt;
        if (skills.onigiri.timer >= skills.onigiri.cooldown * cdMult) {
            skills.onigiri.timer = 0;
            let target = getNearestEnemy();
            if (target) {
                const ang = Math.atan2(target.y - player.y, target.x - player.x);
                const px0 = player.x, py0 = player.y;
                // sweep por pasos: nos detenemos en el ULTIMO punto caminable
                // (el dash crudo podia teletransportar fuera de la cubierta/arena)
                const poly = walkPoly();
                const dashLen = skills.onigiri.dash;
                let fx = px0, fy = py0;
                const STEPS = 10;
                for (let s = STEPS; s >= 1; s--) {
                    const nx = px0 + Math.cos(ang) * dashLen * (s / STEPS);
                    const ny = py0 + Math.sin(ang) * dashLen * (s / STEPS);
                    if (pointInPoly(nx, ny, poly) && !hitsObstacle(nx, ny, 10)) { fx = nx; fy = ny; break; }
                }
                player.x = fx; player.y = fy;
                // VFX: estelas del sprite a lo largo del tajo (Oni Giri)
                for (let g = 1; g <= 3; g++) fxGhost(px0 + (player.x - px0) * (g / 4), py0 + (player.y - py0) * (g / 4), player.facing);
                playSound('slash');
                activeAttacks.push({
                    type: 'onigiri', x: player.x, y: player.y, sx: px0, sy: py0, angle: ang,
                    radius: 40 * player.areaBonus,
                    life: 0.2, maxLife: 0.2,
                    baseDamage: skills.onigiri.baseDamage,
                    hitEnemies: new Set()
                });
                player.attackTimer = 0.2;
            }
        }
    }

    if (skills.flyingslash.level > 0 && CHAR_SKILLS[selectedCharacter].includes('flyingslash')) {
        skills.flyingslash.timer += dt;
        if (skills.flyingslash.timer >= skills.flyingslash.cooldown * cdMult) {
            skills.flyingslash.timer = 0;
            let target = getNearestEnemy();
            let angle = player.facing === 1 ? 0 : Math.PI;
            if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);
            playSound('slash');
            activeAttacks.push({
                type: 'flyingslash', startX: player.x, startY: player.y,
                angle: angle, speed: skills.flyingslash.speed, currentRange: 0,
                maxRange: skills.flyingslash.range * player.areaBonus,
                baseDamage: skills.flyingslash.baseDamage,
                hitEnemies: new Set()
            });
            player.attackTimer = 0.2;
        }
    }

    if (skills.diablejambe.level > 0 && CHAR_SKILLS[selectedCharacter].includes('diablejambe')) {
        skills.diablejambe.timer += dt;
        if (skills.diablejambe.timer >= skills.diablejambe.cooldown * cdMult) {
            skills.diablejambe.timer = 0;
            playSound('kick');
            activeAttacks.push({
                type: 'diablejambe', x: player.x, y: player.y,
                radius: skills.diablejambe.radius * player.areaBonus,
                life: 0.3, maxLife: 0.3,
                baseDamage: skills.diablejambe.baseDamage
            });
            player.attackTimer = 0.2;
        }
    }

    if (skills.collier.level > 0 && CHAR_SKILLS[selectedCharacter].includes('collier')) {
        skills.collier.timer += dt;
        if (skills.collier.timer >= skills.collier.cooldown * cdMult) {
            skills.collier.timer = 0;
            let target = getNearestEnemy();
            let angle = player.facing === 1 ? 0 : Math.PI;
            if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);
            playSound('kick');
            activeAttacks.push({
                type: 'collier', startX: player.x, startY: player.y,
                angle: angle, speed: 900, currentRange: 0,
                maxRange: skills.collier.range * player.areaBonus,
                baseDamage: skills.collier.baseDamage,
                hitEnemies: new Set()
            });
            player.attackTimer = 0.2;
        }
    }

    if (skills.joueshot.level > 0 && CHAR_SKILLS[selectedCharacter].includes('joueshot')) {
        skills.joueshot.timer += dt;
        if (skills.joueshot.timer >= skills.joueshot.cooldown * cdMult) {
            skills.joueshot.timer = 0;
            let target = getNearestEnemy();
            let angle = player.facing === 1 ? 0 : Math.PI;
            if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);
            playSound('kick');
            activeAttacks.push({
                type: 'joueshot', startX: player.x, startY: player.y,
                angle: angle, speed: skills.joueshot.speed, currentRange: 0,
                maxRange: skills.joueshot.range * player.areaBonus,
                baseDamage: skills.joueshot.baseDamage,
                hitEnemies: new Set()
            });
            player.attackTimer = 0.2;
        }
    }

    // Gomu Gomu no Muchi: latigazo en abanico frontal (VS: arma whip)
    if (skills.muchi.level > 0 && CHAR_SKILLS[selectedCharacter].includes('muchi')) {
        skills.muchi.timer += dt;
        if (skills.muchi.timer >= skills.muchi.cooldown * cdMult) {
            skills.muchi.timer = 0;
            let target = getNearestEnemy();
            let angle = player.facing === 1 ? 0 : Math.PI;
            if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);
            playSound('whip');
            activeAttacks.push({
                type: 'muchi', x: player.x, y: player.y,
                angle: angle, radius: skills.muchi.radius * player.areaBonus,
                life: 0.32, maxLife: 0.32,
                baseDamage: skills.muchi.baseDamage,
                hitEnemies: new Set()
            });
            player.attackTimer = 0.25;
        }
    }

    // Gomu Gomu no Ono: patada hacha vertical sobre un enemigo cercano (burst)
    if (skills.ono.level > 0 && CHAR_SKILLS[selectedCharacter].includes('ono')) {
        skills.ono.timer += dt;
        if (skills.ono.timer >= skills.ono.cooldown * cdMult) {
            skills.ono.timer = 0;
            const inRange = enemies.filter(e => Math.hypot(e.x - player.x, e.y - player.y) < 340);
            const target = inRange.length ? inRange[Math.floor(Math.random() * inRange.length)] : null;
            const ox = target ? target.x : player.x, oy = target ? target.y : player.y;
            playSound('kick');
            activeAttacks.push({
                type: 'ono', x: ox, y: oy,
                radius: skills.ono.radius * player.areaBonus,
                life: 0.55, maxLife: 0.55, hitDelay: 0.22,
                baseDamage: skills.ono.baseDamage,
                hitEnemies: new Set()
            });
            player.attackTimer = 0.2;
        }
    }

    // Tatsumaki: tornado cortante orbitando al jugador (aura creciente)
    if (skills.tatsumaki.level > 0 && CHAR_SKILLS[selectedCharacter].includes('tatsumaki')) {
        skills.tatsumaki.timer += dt;
        if (skills.tatsumaki.timer >= skills.tatsumaki.cooldown * cdMult) {
            skills.tatsumaki.timer = 0;
            playSound('slash');
            activeAttacks.push({
                type: 'tatsumaki', x: player.x, y: player.y,
                radius: skills.tatsumaki.radius * player.areaBonus,
                life: skills.tatsumaki.duration * (player.durationBonus || 1), maxLife: skills.tatsumaki.duration * (player.durationBonus || 1),
                baseDamage: skills.tatsumaki.baseDamage,
                spin: 0
            });
            player.attackTimer = 0.2;
        }
    }

    // 108 Pound Ho: cañonazo de viento que perfora TODO en línea recta
    if (skills.poundho.level > 0 && CHAR_SKILLS[selectedCharacter].includes('poundho')) {
        skills.poundho.timer += dt;
        if (skills.poundho.timer >= skills.poundho.cooldown * cdMult) {
            skills.poundho.timer = 0;
            let target = getNearestEnemy();
            let angle = player.facing === 1 ? 0 : Math.PI;
            if (target) angle = Math.atan2(target.y - player.y, target.x - player.x);
            playSound('wind');
            activeAttacks.push({
                type: 'poundho', startX: player.x, startY: player.y,
                angle: angle, speed: skills.poundho.speed, currentRange: 0,
                maxRange: skills.poundho.range * player.areaBonus,
                baseDamage: skills.poundho.baseDamage,
                hitEnemies: new Set()
            });
            player.attackTimer = 0.2;
        }
    }

    // Concassé: patada aérea demoledora sobre un enemigo cercano (burst dirigido)
    if (skills.concasse.level > 0 && CHAR_SKILLS[selectedCharacter].includes('concasse')) {
        skills.concasse.timer += dt;
        if (skills.concasse.timer >= skills.concasse.cooldown * cdMult) {
            skills.concasse.timer = 0;
            const inRange = enemies.filter(e => Math.hypot(e.x - player.x, e.y - player.y) < 320);
            const target = inRange.length ? inRange[Math.floor(Math.random() * inRange.length)] : null;
            const cx = target ? target.x : player.x, cy = target ? target.y : player.y;
            playSound('kick');
            activeAttacks.push({
                type: 'concasse', x: cx, y: cy,
                radius: skills.concasse.radius * player.areaBonus,
                life: 0.55, maxLife: 0.55, hitDelay: 0.22,
                baseDamage: skills.concasse.baseDamage,
                hitEnemies: new Set()
            });
            player.attackTimer = 0.25;
        }
    }

    // Party Table Kick Course: tanda de patadas giratorias 360 (aura)
    if (skills.partycourse.level > 0 && CHAR_SKILLS[selectedCharacter].includes('partycourse')) {
        skills.partycourse.timer += dt;
        if (skills.partycourse.timer >= skills.partycourse.cooldown * cdMult) {
            skills.partycourse.timer = 0;
            playSound('kick');
            activeAttacks.push({
                type: 'partycourse', x: player.x, y: player.y,
                radius: skills.partycourse.radius * player.areaBonus,
                life: skills.partycourse.duration, maxLife: skills.partycourse.duration,
                baseDamage: skills.partycourse.baseDamage,
                spin: 0
            });
            player.attackTimer = 0.2;
        }
    }
}

function handleSpawning(dt) {
    const minutes = Math.floor(gameTime / 60);
    // VS: la Maldición divide el intervalo de spawn (intervalo / maldicción total)
    // Intervalo continuo: 1.0s -> 0.4s lineal hasta el min 4, despues curva geometrica
    // hasta el minimo BALANCE.minSpawnInterval (~0.07s) hacia el min 8.
    const tMin = gameTime / 60;
    const baseInterval = tMin < 4 ? 1.0 - tMin * 0.15 : 0.4 * Math.pow(0.65, tMin - 4);
    const spawnRate = Math.max(BALANCE.minSpawnInterval, baseInterval / player.curse);
    if (!window.spawnTimer) window.spawnTimer = 0;
    window.spawnTimer += dt;

    // Independiente de los FPS: se conserva el sobrante y se permiten varios spawns por frame (max 4)
    let spawnedThisFrame = 0;
    while (window.spawnTimer >= spawnRate && spawnedThisFrame < 4) {
        window.spawnTimer -= spawnRate;
        spawnedThisFrame++;
        // Tope de enemigos vivos (VS ~300): el spawn normal espera; minijefes y eventos no se bloquean
        if (enemies.length >= BALANCE.maxEnemies) continue;
        const spawnDist = Math.hypot(VIEW_W, VIEW_H) / 2 + 80;
        let ex = 0, ey = 0;
        // En arenas cerradas los enemigos nacen DENTRO del muro; se reintenta otro ángulo
        // si al recolocarlo quedaría pegado al jugador (antes podían aparecer encima)
        for (let tries = 0; tries < 8; tries++) {
            const angle = Math.random() * Math.PI * 2;
            ex = player.x + Math.cos(angle) * spawnDist;
            ey = player.y + Math.sin(angle) * spawnDist;
            if (selectedMap !== 'baratie') [ex, ey] = clampToArena(ex, ey);
            if (Math.hypot(ex - player.x, ey - player.y) >= BALANCE.minSpawnDist) break;
        }

        const hpScale = enemyHpScale();
        // ===== Pools por mapa (MAP_ENEMIES en core.js) =====
        const cfg = mapEnemies();
        const rand = Math.random();
        let type = cfg.base;
        for (const en of cfg.pool) { if (minutes >= en.min && rand < en.p) { type = en.type; break; } }
        const _st = ENEMY_STATS[type] || ENEMY_STATS.grunt;
        let hp = _st[0] * hpScale, speed = type === 'grunt' ? _st[1] + Math.random() * 22 : _st[1], damage = _st[2];

        // === Élites con lore: personajes ICÓNICOS =====
        // Fodder (marines/agentes/soldados): 2-3% de élite (x18 HP).
        // Iconicos (Morgan/Ryuma/Absalom/Perona/Hogback/Cindry...): chanzas altas
        // o siempre élite (x8 HP) porque son personajes con nombre propio.
        let isElite = false;
        // VS: los bruisers valen ~2-4x el enemigo base; los iconicos ya parten con base propia
        let eliteMult = 3, eliteDmgMult = 1.8, eliteSpdMult = 1.05;
        if (type === 'grunt' && Math.random() < 0.008) {
            type = 'elite_marine'; eliteMult = 9; eliteDmgMult = 2; eliteSpdMult = 0.8; isElite = true;
        } else if (type === 'shooter' && Math.random() < 0.008) {
            type = 'elite_shooter'; eliteMult = 9; eliteDmgMult = 2; eliteSpdMult = 1.2; isElite = true;
        } else if (type === 'pacifista' && Math.random() < 0.01) {
            type = 'elite_kuma'; eliteMult = 6; eliteDmgMult = 2; eliteSpdMult = 0.9; isElite = true;
        } else if (type === 'inupen' && Math.random() < 0.02) {
            type = 'elite_inupen'; isElite = true;
        } else if (type === 'kumashi' && Math.random() < 0.03) {
            type = 'elite_kumashi'; isElite = true;
        } else if (type === 'tararan' && Math.random() < 0.04) {
            type = 'elite_tararan'; isElite = true;
        } else if (type === 'hogback' && Math.random() < 0.08) {
            type = 'elite_hogback'; isElite = true;
        } else if (type === 'cindry' && Math.random() < 0.08) {
            type = 'elite_cindry'; isElite = true;
        } else if (type === 'pellona' && Math.random() < 0.08) {
            type = 'elite_pellona'; isElite = true;
        } else if (type === 'absalom' && Math.random() < 0.10) {
            type = 'elite_absalom'; isElite = true;
        } else if (type === 'ryuma' && Math.random() < 0.5) {
            // Ryuma: samurái legendario, élite la mitad de las veces
            type = 'elite_ryuma'; isElite = true;
        } else if (ELITE_INFO[type] && ELITE_INFO[type].always) {
            // oficiales con nombre (Baroque Works, sacerdotes de Enel): siempre élite
            isElite = true;
        } else if (FODDER_ELITE[type] && Math.random() < FODDER_ELITE[type][0]) {
            const fe = FODDER_ELITE[type];
            eliteMult = fe[1]; eliteDmgMult = fe[2]; eliteSpdMult = fe[3]; isElite = true;
        }
        if (isElite) { hp *= eliteMult; damage *= eliteDmgMult; speed *= eliteSpdMult; }
        // VS: eliminado el fallback 10% de élite genérico — demasiados cofres
        // VS: la Maldición también acelera a los enemigos
        speed *= 1 + (player.curse - 1) / 2;
        const eName = !isElite ? null : eliteName(type);
        enemies.push({ x: ex, y: ey, type, hp, maxHp: hp, speed, damage, animIndex: 0, animTimer: 0, animState: 'idle', attackTimer: 0, isElite, damageTaken: type === 'elite_marine' ? 0.5 : 1, name: eName });
        // Minijefes del mapa (una vez por partida)
        if (!window.minibossesSpawned) window.minibossesSpawned = {};
        for (const mb of cfg.minibosses) {
            if (minutes >= mb.min && !window.minibossesSpawned[mb.type]) {
                window.minibossesSpawned[mb.type] = true;
                const mhp = mb.hp * hpScale;
                enemies.push(makeEnemy(mb.type, ex, ey, 1, { hp: mhp, maxHp: mhp, speed: mb.speed, damage: mb.damage, isMiniboss: true, name: MINIBOSS_INFO[mb.type] }));
                window.spawnBanner = { text: MINIBOSS_INFO[mb.type], life: 2.0, color: '#ffa500' };
                playSound('boss');
            }
        }
        // Clima 3+: segundo ejemplar del primer minijefe (80% PV)
        const mb0 = cfg.minibosses[0];
        if (mb0 && runCurseRank >= 3 && minutes >= mb0.min + 1 && !window.mirrorMinibossSpawned) {
            window.mirrorMinibossSpawned = true;
            const mhp = Math.round(mb0.hp * hpScale * 0.8);
            enemies.push(makeEnemy(mb0.type, ex - 120, ey - 60, 1, { hp: mhp, maxHp: mhp, speed: mb0.speed, damage: mb0.damage, isMiniboss: true, name: MINIBOSS_INFO[mb0.type] }));
            window.spawnBanner = { text: '¡SEGUNDO ' + MINIBOSS_INFO[mb0.type].split(' —')[0].toUpperCase() + '!', life: 2.0, color: '#ffa500' };
            playSound('boss');
        }
    }
    // Evita acumular retraso tras un tirón de FPS
    if (window.spawnTimer > spawnRate) window.spawnTimer = spawnRate;
}

function spawnBoss() {
    bossSpawned = true;
    const bossType = mapEnemies().boss;
    let hpv = BOSS_HP[bossType];
    // Modo Infinito: cada boss nuevo es un 60% mas fuerte que el anterior
    if (window.endlessMode) hpv = Math.round(hpv * (1 + 0.6 * (window.endlessBossKills || 0)));
    enemies.push({ x: player.x + 250, y: player.y + 250, type: bossType, hp: hpv, maxHp: hpv, speed: 55, damage: 50, animIndex: 0, animTimer: 0, animState: 'idle', attackTimer: 0, isElite: false, isBoss: true, damageTaken: 1, name: BOSS_INFO[bossType] });
    // Clima 4: doble caza mayor (VS: etapas con dos bosses a la vez)
    if (runCurseRank >= 4) {
        const hp2 = Math.round(hpv * 0.6);
        enemies.push({ x: player.x - 250, y: player.y - 250, type: bossType, hp: hp2, maxHp: hp2, speed: 55, damage: 44, animIndex: 0, animTimer: 0, animState: 'idle', attackTimer: 0, isElite: false, isBoss: true, damageTaken: 1, name: BOSS_INFO[bossType] });
    }
    // VS: anuncio de boss con banner + shake + fanfarria
    window.spawnBanner = { text: (runCurseRank >= 4 ? 'DOBLES CAZAMAYORES: ' : '') + BOSS_INFO[bossType], life: 2.2, color: '#facc15' };
    cameraShake = 2.5;
    playSound('boss');
    updateUI();
}

// === VS: eventos periodicos de oleada (cada ~90s sorpresa) ===
function updateEvents(dt) {
    // Partida normal: oleadas con guion por minuto (js/waves.js). Modo Infinito: sorpresas al azar.
    if (gameTime < 480 && !window.endlessMode) return updateWaveScript();
    updateEventsRandom(dt);
}
function updateEventsRandom(dt) {
    if (!window.nextEventAt || window.nextEventAt < gameTime - 5) window.nextEventAt = gameTime + 20;
    if (gameTime < window.nextEventAt) return;
    window.nextEventAt = gameTime + (runCurseRank >= 2 ? 60 + Math.random() * 18 : 85 + Math.random() * 25);
    const minutes = Math.floor(gameTime / 60);
    const hpScale = enemyHpScale();
    const kind = Math.random() < 0.5 ? 'ring' : 'charge';
    if (kind === 'ring') {
        // Emboscada: anillo de piratas cierra TODO el contorno hacia el jugador
        const ev = mapEnemies().events;
        window.spawnBanner = { text: ev.ringText, life: 2.0, color: '#ef4444' };
        playSound('warn');
        const n = 24 + minutes * 2;
        // VS: el cerco deja un hueco (1/5 del anillo) para que se pueda escapar sin tanquear
        const gapAt = Math.random() * Math.PI * 2;
        for (let k = 0; k < n; k++) {
            const ang = (Math.PI * 2 * k) / n;
            const off = Math.abs(((ang - gapAt + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
            if (off < Math.PI / 5) continue;
            let ex = player.x + Math.cos(ang) * 560, ey = player.y + Math.sin(ang) * 560;
            if (selectedMap !== 'baratie') [ex, ey] = clampToArena(ex, ey);
            enemies.push(makeEnemy(ev.ring, ex, ey, hpScale, { speed: 110 + minutes * 10, isEvent: true }));
        }
    } else {
        // Carga de la Armada: filas cruzando el mapa desde un costado
        const ev = mapEnemies().events;
        window.spawnBanner = { text: ev.chargeText, life: 2.0, color: '#38bdf8' };
        playSound('warn');
        const side = Math.random() < 0.5 ? -1 : 1;
        const n = 20 + minutes * 2;
        for (let k = 0; k < n; k++) {
            let ex = player.x + side * 640, ey = player.y - 360 + k * 34;
            if (selectedMap !== 'baratie') [ex, ey] = clampToArena(ex, ey);
            enemies.push(makeEnemy(ev.charge, ex, ey, hpScale, { speed: 70, damage: 16, isEvent: true }));
        }
        for (let k = 0; k < 10; k++) {
            let ex = player.x + side * 640, ey = player.y - 200 + k * 40;
            if (selectedMap !== 'baratie') [ex, ey] = clampToArena(ex, ey);
            enemies.push(makeEnemy(ev.runners, ex, ey, hpScale, { speed: 130, isEvent: true }));
        }
    }
}

// Orientación del sprite: al atacar mira al objetivo (o hacia donde embiste); si no, hacia donde camina.
// e._face: 1 derecha / -1 izquierda (render.js lo cruza con ENEMY_ANIMS[tipo].faces).
// e._dir: fila de las hojas de 4 direcciones (rows4). Hay un margen para que no parpadee al moverse en vertical.
function enemyFacing(e, mvx, mvy, edx, edy) {
    let fx = mvx, fy = mvy;
    if (e.attackTimer > 0) {
        if (e._dashT > 0) { fx = e._dashVx; fy = e._dashVy; }
        else { const d = Math.hypot(edx, edy) || 1; fx = edx / d; fy = edy / d; }
    }
    if (fx > 0.2) e._face = 1; else if (fx < -0.2) e._face = -1;
    else if (e._face === undefined) e._face = edx >= 0 ? 1 : -1;
    if (fx === 0 && fy === 0) return;
    const ax = Math.abs(fx), ay = Math.abs(fy), side = e._dir === 'left' || e._dir === 'right';
    if (side ? ax > ay * 0.8 : ax > ay * 1.25) e._dir = fx > 0 ? 'right' : 'left';
    else e._dir = fy > 0 ? 'down' : 'up';
}

// Comportamientos especiales (ENEMY_BEHAVIOR en core.js). Devuelve true si el enemigo desaparece.
function enemyBehavior(e, beh, edx, edy, edist, dt) {
    if (beh === 'charge') {
        if (e._dashT > 0) { e._dashT -= dt; return false; }
        e._dashCd = (e._dashCd === undefined ? 1 + Math.random() * 2 : e._dashCd) - dt;
        if (e._dashCd <= 0 && edist < 280 && edist > 40) {
            e._dashCd = 3.2; e._dashT = 0.45; e._dashVx = edx / edist; e._dashVy = edy / edist; e.attackTimer = 0.45;
        }
    } else if (beh === 'explode') {
        if (edist < 26) {
            const dmgMult = (1 - (player.armor / 100)) * (1 - player.evasion) * gearDamageTakenMult();
            player.hp -= e.damage * dmgMult; player.hitTimer = 0.12; player._hurtFlash = 0.35;
            cameraShake = Math.max(cameraShake, 2.2); playSound('hurt');
            activeAttacks.push({ type: 'bazooka', x: e.x, y: e.y, radius: 50, life: 0.3, maxLife: 0.3, baseDamage: 0, hitEnemies: new Set() });
            if (player.hp <= 0) triggerGameOver();
            updateUI();
            return true;
        }
        if (edist < 70) e.attackTimer = 0.2; // a punto de estallar
    } else if (beh === 'hypno') {
        e._hyp = (e._hyp === undefined ? 3 : e._hyp) - dt;
        if (e._hyp <= 0 && edist < 300) {
            e._hyp = 7; e.attackTimer = 0.8;
            player._slowUntil = gameTime + 1.2; player._slowMult = 0.4;
            window.spawnBanner = { text: 'UNO, DOS... ¡JANGO!', life: 1.2, color: '#c084fc' };
        }
    }
    return false;
}

function killEnemy(e) {
    // guard: con mas de 1 golpe en el mismo frame dos armas pueden invocar killEnemy
    // sobre el mismo enemigo antes del filtro de muertos -> drops/beli/victoria duplicados
    if (e._dead) return;
    e._dead = true;
    if (e.isProp) { propBreak(e); return; }
    gearOnKill(e);
    // estadisticas de run para logros y bestiario
    if (window.runStats) {
        window.runStats.kills++;
        window.runStats.killsByType[e.type] = (window.runStats.killsByType[e.type] || 0) + 1;
        if (e.isElite) window.runStats.elites++;
    }
    if (e.isElite && (e.type === 'elite_shooter' || e.type === 'elite_tararan' || e.type === 'elite_kuma' || e.type === 'krieg_bomber') && !e._exploded) {
        e._exploded = true;
        // explosion
        forEnemiesNear(e.x, e.y, 80, function (en) {
            if (en === e) return;
            en.hp -= 40;
            spawnDamageText(en.x, en.y, { amount: 40, isCrit: false, isOvercrit: false });
            if (en.hp <= 0) killEnemy(en);
        });
        // explosion visual
        activeAttacks.push({ type: 'bazooka', x: e.x, y: e.y, radius: 80, life: 0.3, maxLife: 0.3, baseDamage: 0, hitEnemies: new Set() });
    }
    if (player.vampirism > 0 && Math.random() < player.vampirism) {
        player.hp = Math.min(player.maxHp, player.hp + 2);
    }
    const xpVal = e.isBoss ? 60 : (e.isMiniboss ? 20 : (e.isElite ? 8 : ((e.type === 'pacifista' || e.type === 'krieg_bomber') ? 6 : 2)));
    drops.push({ x: e.x, y: e.y, type: 'xp', value: xpVal });
    if (e.isElite || e.isMiniboss || e.isBoss) {
        // VS: bronce (élites, no evoluciona, NO siempre cae) / plata (minibosses) / oro (boss) — queda en el suelo hasta pisarlo
        const chestTier = e.isBoss ? 2 : (e.isMiniboss ? 1 : 0);
        const dropChest = e.isBoss || e.isMiniboss || (Math.random() < 0.12 * player.luckBonus);
        if (dropChest) drops.push({ x: e.x, y: e.y, type: 'chest', tier: chestTier,
            canEvolve: chestTier >= 1, ground: true, opened: false, openTimer: 0, value: 1 });
    }
    if (!e.isProp && Math.random() < ECONOMY.enemyChance) drops.push({ x: e.x + (Math.random()*12-6), y: e.y, type: 'beli', src: 'enemy', value: Math.round(ECONOMY.enemyCoin * beliScale()) });
    // VS: los enemigos normales solo sueltan gemas; curas y consumibles salen de barriles y faroles (js/loot.js).
    // BALANCE.enemyMeat: pequeña concesión (no está en VS) porque aquí la vista es más corta y hay menos barriles.
    if (BALANCE.enemyMeat && Math.random() < BALANCE.enemyMeat) drops.push({ x: e.x, y: e.y, type: 'meat' });
    // VS: cada miniboss derrotado otorga una Voluntad de D a mitad de partida
    if (e.isMiniboss) player._arcanaPending = (player._arcanaPending || 0) + 1;
    // VS: nube de muerte — destello + chispas del color del enemigo
    playSound(e.isBoss ? 'boss_die' : 'enemydie');
    fxOrb(e.x, e.y - 6, '#ffffff', 10, 0.22);
    fxRing(e.x, e.y, e.isBoss ? '#facc15' : (e.isElite ? '#ffd700' : '#ffffff'), 12, 0.28);
    for (let k = 0; k < 7; k++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 60 + Math.random() * 90;
        particles.push({ x: e.x, y: e.y, vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp, life: 0.45, maxLife: 0.45, color: e.isBoss ? '#facc15' : (e.isElite ? '#ffd700' : '#f8fafc'), shape: 'spark', size: 2.5, grav: 140 });
    }
    // VS: Mini flag de Doble Ejecucion (2 Shichibukai en la misma singladura)
    if (e.isMiniboss) {
        if ((e.type === 'moria' || e.type === 'boss_moria') && window.runStats) window.runStats.moriaThis = true;
        if (e.type === 'kuma' && window.runStats) window.runStats.kumaThis = true;
    }
    // VS: AVALANCHA DE BELI al caer un Shichibukai/boss — monedas doradas en arco
    if (e.isMiniboss || e.isBoss) {
        const qty = e.isBoss ? 22 : 14;
        for (let k = 0; k < qty; k++) {
            const ang = Math.random() * Math.PI * 2;
            const sp = 40 + Math.random() * 130;
            drops.push({ x: e.x + Math.cos(ang) * sp, y: e.y + Math.sin(ang) * sp, type: 'beli', src: 'avalanche',
                value: Math.round((ECONOMY.avalanche[0] + Math.random() * ECONOMY.avalanche[1]) * beliScale()) });
        }
        if (!e.isBoss) window.spawnBanner = { text: '¡AVALANCHA DE BELI!', life: 1.2, color: '#ffd700' };
        playSound('beli_rush');
        fxStars(e.x, e.y, (windowOpts && windowOpts.fewerFlashes) ? 6 : 18);
    }
    // Boss derrotado = victoria (estilo Vampire Survivors) — salvo Modo Infinito
    if (e.isBoss) {
        if (window.endlessMode) {
            window.endlessBossKills++;
            window.nextBossAt = gameTime + 300;
            addBeli(ECONOMY.endlessBoss * beliScale(), 'endless');
            window.spawnBanner = { text: '¡BRIGADA CAÍDA — EL MAR ENVÍA OTRA MÁS FUERTE!', life: 2.0, color: '#f87171' };
            playSound('boss');
        } else {
            // Clima 4 puede traer 2 bosses: solo hay victoria cuando cae el ULTIMO vivo
            if (enemies.some(en => en !== e && en.isBoss && !en._dead)) {
                window.spawnBanner = { text: '¡AÚN QUEDA OTRO CAZAMAYOR!', life: 2.0, color: '#fbbf24' };
            } else triggerVictory();
        }
    }
    checkAchievements();
}

function spawnDamageText(x, y, dmgInfo) {
    // OPCIONES: se pueden silenciar los numeros de dano (reduccion de ruido visual)
    if (windowOpts && windowOpts.showDamageNumbers === false) return;
    damageTexts.push({
        x: x + (Math.random()*16 - 8), y: y - 10,
        text: dmgInfo.amount,
        isCrit: dmgInfo.isCrit,
        isOvercrit: dmgInfo.isOvercrit,
        life: 0.6
    });
}

// update de partículas compartido (update() principal + cutscene de evolución)
function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.shape === 'ring') {
            p.size += 150 * dt;
        } else {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.92;
            p.vy *= 0.92;
            if (p.grav) p.vy += p.grav * dt;
            if (p.grow) p.size += p.grow * dt;
            if (p.vr) p.rot += p.vr * dt;
        }
        if (p.life <= 0) particles.splice(i, 1);
    }
    // cap de partículas (VS usa pooling: evita acumulación en partidas largas)
    const cap = (windowOpts && windowOpts.fewerParticles) ? 300 : 600;
    if (particles.length > cap) particles.splice(0, particles.length - cap);
}

// === Sistema de particulas pulido (estilo VS: formas con proposito) ===
// shape: 'spark' (chispa con gravedad) | 'orb' (destello que se encoge)
// | 'ring' (onda expansiva que crece) | 'star' (destello dorado con parpadeo)
// | 'ghost' (estela de sprite del jugador, para dashes)
function fxSpark(x, y, color, n, speed, life = 0.45, size = 2.5, grav = 120) {
    const q = (windowOpts && windowOpts.fewerParticles) ? 0.5 : 1;
    if (Math.random() < q || q >= 1) for (let k = 0; k < n * q; k++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = speed * (0.5 + Math.random() * 0.7);
        particles.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: life * (0.7 + Math.random() * 0.5), maxLife: life, color: color, shape: 'spark', size: size, grav: grav });
    }
}
function fxRing(x, y, color, size = 20, life = 0.35) {
    particles.push({ x: x, y: y, vx: 0, vy: 0, life: life, maxLife: life, color: color, shape: 'ring', size: size });
}
function fxOrb(x, y, color, size = 8, life = 0.25) {
    particles.push({ x: x, y: y, vx: 0, vy: 0, life: life, maxLife: life, color: color, shape: 'orb', size: size });
}
function fxStars(x, y, n = 8) {
    const q = (windowOpts && windowOpts.fewerParticles) ? 0.5 : 1;
    const count = Math.max(0, Math.round(n * q));
    for (let k = 0; k < count; k++) {
        const ang = (Math.PI * 2 * k) / n + Math.random() * 0.4;
        const sp = 55 + Math.random() * 70;
        particles.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 30, life: 0.6, maxLife: 0.6, color: Math.random() < 0.5 ? '#ffd700' : '#fff2c0', shape: 'star', size: 3 + Math.random() * 3, grav: 90 });
    }
}
function fxGhost(x, y, facing) {
    // estela del sprite del jugador actual (para Oni Giri / evoluciones con dash)
    const set = CHAR_IMG[selectedCharacter];
    let img = null;
    if (set) {
        const arr = set[player.animState] && set[player.animState].length ? set[player.animState] : set.idle;
        if (arr && arr.length) img = arr[player.animIndex % arr.length];
    }
    if (!img) return;
    particles.push({ x: x, y: y, img: img, facing: facing, life: 0.32, maxLife: 0.32, shape: 'ghost', color: '#fff', size: 48 });
}

function getNearestEnemy() {
    let nearest = null, minD = Infinity;
    for (let e of enemies) {
        if (e.isProp) continue;
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < minD) { minD = d; nearest = e; }
    }
    return nearest;
}

// === Curva de XP exacta de Vampire Survivors ===
// 5 XP para el nivel 2, +10 por nivel hasta el 20, +13 del 21-40, +16 desde el 41.
// Saltos extra de +600 XP al llegar al nivel 20 y de +2400 al llegar al 40.
function xpToNext(level) {
    let need;
    if (level < 2) need = 6;
    else if (level < 20) need = 6 + 7 * (level - 1);
    else if (level < 40) need = 133 + 10 * (level - 19);
    else need = 343 + 12 * (level - 39);
    if (level === 20) need += 300;
    if (level === 40) need += 1200;
    return need;
}
function levelUp() {
    // VS: subir 2+ niveles de un solo pickup encadena pantallas en cola
    if (gameState === 'UPGRADE') { window._pendingLevelUps = (window._pendingLevelUps || 0) + 1; }
    else { gameState = 'UPGRADE'; }
    player.level++;
    player.xp -= player.nextXp;
    player.nextXp = xpToNext(player.level);
    playSound('levelup');
    showUpgradeScreen();
}

// === Evoluciones estilo Vampire Survivors: arma nivel 5 + pasiva requerida ===
// VS: la evolución NO se dispara al coger la pasiva, sino al abrir un cofre de plata
// (elites sueltan cofres de bronce; minibosses y bosses sueltan cofres capaces de evolucionar)
const EVOLUTIONS = {
    pistol:      { passive: 'power',  name: 'Red Hawk (Gomu Gomu no Pistol)' },
    gatling:     { passive: 'cd',     name: 'Jet Gatling' },
    bazooka:     { passive: 'area',   name: 'Jet Bazooka' },
    gear2:       { passive: 'speed',  name: 'Gear 4: Boundman' },
    zoroform:    { passive: 'power',  name: 'Rey del Infierno (Enma)' },
    sanjiform:   { passive: 'armor',  name: 'Ifrit Jambe' },
    muchi:       { passive: 'speed',  name: 'Jet Whip' },
    ono:         { passive: 'power',  name: 'Gomu Gomu no Gigant Ono' },
    santoryu:    { passive: 'crit',   name: 'Santoryu Ogi: Rokudo no Tsuji' },
    onigiri:     { passive: 'power',  name: 'Rengoku Oni Giri' },
    flyingslash: { passive: 'cd',     name: 'Shishi Sonson' },
    tatsumaki:   { passive: 'cd',     name: 'Kokujo: O Tatsumaki' },
    poundho:     { passive: 'crit',   name: 'Sanzen Daisen Sekai' },
    diablejambe: { passive: 'speed',  name: 'Hell Memories' },
    collier:     { passive: 'area',   name: 'Collier Shoot: Grilled' },
    joueshot:    { passive: 'crit',   name: 'Mouton Shot' },
    concasse:    { passive: 'speed',  name: 'Bien Cuit: Grill Shot' },
    partycourse: { passive: 'crit',   name: 'Anti-Manner Kick Course' }
};
// Icono propio de la técnica evolucionada (source-art/dibujar_iconos_evoluciones.py); si no hay, el del arma
function evoIcon(id, fallback) { return (typeof pxIcon === 'function' && pxIcon('evo_' + id)) || fallback || ''; }
function evolveWeapon(id) {
    const sk = skills[id];
    if (!sk || sk.evolved) return;
    sk.evolved = true;
    sk.evolvedName = EVOLUTIONS[id].name;
    // VS: la evolucion multiplica el producto del arma (x1.7-x2.0), no suma flat
    if (id === 'pistol') { sk.baseDamage *= 1.8; sk.range += 80; sk.cooldown = Math.max(0.6, sk.cooldown - 0.3); }
    else if (id === 'gatling') { sk.baseDamage *= 1.7; sk.radius += 40; sk.duration += 1.0; }
    else if (id === 'bazooka') { sk.baseDamage *= 1.8; sk.radius += 30; }
    else if (id === 'gear2') { sk.speedBonus += 0.2; sk.duration += 2; }
    else if (id === 'zoroform' || id === 'sanjiform') { /* desbloquea el tercer nivel de la transformacion */ }
    else if (id === 'santoryu') { sk.baseDamage *= 2.0; sk.radius += 20; }
    else if (id === 'onigiri') { sk.baseDamage *= 1.8; sk.dash += 50; }
    else if (id === 'flyingslash') { sk.baseDamage *= 1.7; sk.range += 100; }
    else if (id === 'diablejambe') { sk.baseDamage *= 1.7; sk.radius += 20; }
    else if (id === 'collier') { sk.baseDamage *= 1.8; sk.range += 20; }
    else if (id === 'joueshot') { sk.baseDamage *= 1.7; sk.range += 50; }
    else if (id === 'muchi') { sk.baseDamage *= 1.8; sk.radius += 40; sk.cooldown = Math.max(0.8, sk.cooldown - 0.3); }
    else if (id === 'ono') { sk.baseDamage *= 1.8; sk.radius += 25; }
    else if (id === 'tatsumaki') { sk.baseDamage *= 2.0; sk.radius += 30; sk.duration += 0.5; }
    else if (id === 'poundho') { sk.baseDamage *= 2.0; sk.range += 120; }
    else if (id === 'concasse') { sk.baseDamage *= 1.8; sk.radius += 25; }
    else if (id === 'partycourse') { sk.baseDamage *= 1.9; sk.radius += 35; sk.duration += 0.4; }
    else if (SHARED_EVO_FX[id]) SHARED_EVO_FX[id](sk);
    // VS: cutscene de evolución — el mundo se congela, lluvia de confetti y cartel
    window._evolveCut = { life: 1.3 };
    window.spawnBanner = { text: '◆ ¡' + EVOLUTIONS[id].name.toUpperCase() + ' ◆', life: 1.3, color: '#c084fc' };
    playSound('evolve');
    cameraShake = 2;
    if (window.runStats) window.runStats.evolves++;
    // burst inicial: anillo + confetti de 5 colores
    fxRing(player.x, player.y, '#c084fc', 24, 0.9);
    fxOrb(player.x, player.y, '#ffffff', 26, 0.6);
    const confettiCols = ['#f43f5e', '#facc15', '#38bdf8', '#a78bfa', '#ffffff'];
    for (let k = 0; k < 30; k++) {
        particles.push({ x: player.x + (Math.random() * 160 - 80), y: player.y - 30 - Math.random() * 50,
            vx: (Math.random() - 0.5) * 160, vy: -60 + Math.random() * 120,
            life: 1.1, maxLife: 1.1, color: confettiCols[k % 5], shape: 'star', size: 2.5 + Math.random() * 3.5, grav: 170 });
    }
}
function checkEvolutions() {
    // Se llama SOLO al abrir cofres capaces de evolucionar (VS: cofres de plata).
    // VS: como máximo UNA evolución por cofre; las demás esperan al siguiente.
    for (const id in EVOLUTIONS) {
        const sk = skills[id];
        if (sk && sk.level >= 5 && !sk.evolved && (player.passives[EVOLUTIONS[id].passive] || 0) >= 1) {
            evolveWeapon(id);
            cameraShake = 2;
            return;
        }
    }
}

// Catálogo completo de cartas (armas y pasivas). Lo usan las subidas de nivel y la Colección (js/collection.js).
// El orden importa: el sorteo de cartas favorece a los primeros (ver showUpgradeScreen).
function upgradeCatalog() {
    const possibleUpgrades = [
        { id: 'pistol', type: 'weapon', chars: ['luffy'], title: 'Gomu Gomu no Pistol', icon: ICONS.pistol, desc: 'Sube el daño base de puñetazo (+22) y su alcance.' },
        { id: 'gatling', type: 'weapon', chars: ['luffy'], title: 'Gomu Gomu no Gatling', icon: ICONS.gatling, desc: 'Desbloquea o mejora la ráfaga continua en área.' },
        { id: 'power', type: 'passive', chars: 'all', title: 'Busoshoku Haki (Poder %)', icon: ICONS.power, desc: 'Incrementa TODO el daño infligido un +20%.' },
        { id: 'crit', type: 'passive', chars: 'all', title: 'Gafas de Francotirador (Crit)', icon: ICONS.crit, desc: 'Aumenta un +15% la Probabilidad Crítica (Permite Overcrits).' },
        { id: 'cd', type: 'passive', chars: 'all', title: 'Sake de Bink (Cooldown)', icon: ICONS.cd, desc: 'Reduce el tiempo de recarga de todas las habilidades un -12%.' },
        { id: 'armor', type: 'passive', chars: 'all', title: 'Armadura de Haki', icon: ICONS.armor, desc: 'Reduce el daño recibido un +8% (max 60%).' },
        { id: 'bazooka', type: 'weapon', chars: ['luffy'], title: 'Gomu Gomu no Bazooka', icon: ICONS.bazooka, desc: 'Desbloquea un ataque de área explosivo.' },
        { id: 'gear2', type: 'weapon', chars: ['luffy'], title: 'Gears (Luffy)', icon: ICONS.gear2, desc: 'Llena el medidor y pulsa ESPACIO o el botón G. Nv1: Gear 2 · Nv3: Gear 3 · Evolución: Gear 4 · Min 6: Gear 5 (si están desbloqueados).' },
        { id: 'zoroform', type: 'weapon', chars: ['zoro'], title: 'Haki del Rey (Zoro)', icon: ICONS.zoroform, desc: 'Llena el medidor y pulsa ESPACIO o el botón. Nv1: Ryuo · Nv3: Kyutoryu Asura · Evolución: Rey del Infierno con Enma (si están desbloqueados).' },
        { id: 'sanjiform', type: 'weapon', chars: ['sanji'], title: 'Raid Suit (Sanji)', icon: ICONS.sanjiform, desc: 'Llena el medidor y pulsa ESPACIO o el botón. Nv1: Sky Walk · Nv3: Raid Suit Stealth Black · Evolución: Ifrit Jambe (si están desbloqueados).' },
        { id: 'santoryu', type: 'weapon', chars: ['zoro'], title: 'Santoryu', icon: ICONS.santoryu, desc: 'Desbloquea corte triple (Zoro).' },
        { id: 'onigiri', type: 'weapon', chars: ['zoro'], title: 'Oni Giri', icon: ICONS.onigiri, desc: 'Desbloquea dash con daño (Zoro).' },
        { id: 'flyingslash', type: 'weapon', chars: ['zoro'], title: 'Flying Slash', icon: ICONS.flyingslash, desc: 'Desbloquea corte a distancia (Zoro).' },
        { id: 'diablejambe', type: 'weapon', chars: ['sanji'], title: 'Diable Jambe', icon: ICONS.diablejambe, desc: 'Desbloquea patadas de fuego (Sanji).' },
        { id: 'collier', type: 'weapon', chars: ['sanji'], title: 'Collier', icon: ICONS.collier, desc: 'Desbloquea golpe rápido (Sanji).' },
        { id: 'joueshot', type: 'weapon', chars: ['sanji'], title: 'Joue Shot', icon: ICONS.joueshot, desc: 'Disparo a distancia con la pierna flotante (rango amplio).' },
        { id: 'muchi', type: 'weapon', chars: ['luffy'], title: 'Gomu Gomu no Muchi', icon: ICONS.muchi, desc: 'Latigazo de goma que golpea TODOS los enemigos en abanico frente a ti.' },
        { id: 'ono', type: 'weapon', chars: ['luffy'], title: 'Gomu Gomu no Ono', icon: ICONS.ono, desc: 'Patada hacha vertical demoledora sobre un enemigo cercano.' },
        { id: 'tatsumaki', type: 'weapon', chars: ['zoro'], title: 'Santoryu Ogi: Tatsumaki', icon: ICONS.tatsumaki, desc: 'Tornado cortante que gira alrededor de ti dañando sin parar.' },
        { id: 'poundho', type: 'weapon', chars: ['zoro'], title: '108 Pound Ho', icon: ICONS.poundho, desc: 'Cañonazo de viento que PERFORA a todos en linea recta.' },
        { id: 'concasse', type: 'weapon', chars: ['sanji'], title: 'Concassé', icon: ICONS.concasse, desc: 'Patada aérea demoledora que aplasta a un enemigo y a sus vecinos.' },
        { id: 'partycourse', type: 'weapon', chars: ['sanji'], title: 'Party Table Kick Course', icon: ICONS.partycourse, desc: 'Tanda de patadas giratorias en 360 grados: limpieza masiva.' },
        { id: 'cuchillo', type: 'weapon', chars: 'all', title: 'Cuchillo de Marina', icon: ICONS.cuchillo, desc: 'Arma compartida: disparo rápido a un enemigo.' },
        { id: 'granada', type: 'weapon', chars: 'all', title: 'Granada de Mano', icon: ICONS.granada, desc: 'Arma compartida: explosión en área.' },
        { id: 'rifle', type: 'weapon', chars: 'all', title: 'Rifle de la Marina', icon: ICONS.rifle, desc: 'Arma compartida: disparo preciso a largo alcance.' },
        { id: 'ballesta', type: 'weapon', chars: 'all', title: 'Ballesta', icon: ICONS.ballesta, desc: 'Arma compartida: virote que perfora en línea recta.' },
        { id: 'lanza', type: 'weapon', chars: 'all', title: 'Lanza de Abordaje', icon: ICONS.lanza, desc: 'Arma compartida: estocada rápida a corta distancia.' },
        { id: 'hacha', type: 'weapon', chars: 'all', title: 'Hacha Pirata', icon: ICONS.hacha, desc: 'Arma compartida: tajo pesado en área cercana.' },
        { id: 'shuriken', type: 'weapon', chars: 'all', title: 'Shuriken', icon: ICONS.shuriken, desc: 'Arma compartida: proyectil arrojadizo veloz.' },
        { id: 'hakiPulse', type: 'weapon', chars: ['luffy', 'zoro'], title: 'Pulso de Haoshoku', icon: ICONS.hakiPulse, desc: 'Luffy y Zoro: onda de Haki del Rey que daña a los cercanos.' },
        { id: 'haki_buso', type: 'passive', chars: ['luffy', 'zoro', 'sanji'], title: 'Busoshoku Haki', icon: ICONS.haki_buso, desc: 'Aumenta daño y armadura.' },
        { id: 'haki_ken', type: 'passive', chars: ['luffy', 'zoro', 'sanji', 'usopp'], title: 'Kenbunshoku Haki', icon: ICONS.haki_ken, desc: 'Aumenta crit y evasión.' },
        { id: 'haki_hao', type: 'passive', chars: ['luffy', 'zoro'], title: 'Haoshoku Haki', icon: ICONS.haki_hao, desc: 'Pulso cada 6s que aturde 1.5s a los enemigos cercanos (no bosses).' },
        { id: 'area', type: 'passive', chars: 'all', title: 'Área de Efecto', icon: ICONS.area, desc: 'Aumenta el área de los ataques +10%.' },
        { id: 'speed', type: 'passive', chars: 'all', title: 'Velocidad', icon: ICONS.speed, desc: 'Aumenta la velocidad de movimiento +8%.' },
        { id: 'pickup', type: 'passive', chars: 'all', title: 'Recogida', icon: ICONS.pickup, desc: 'Aumenta el rango de recogida de drops.' },
        { id: 'growth', type: 'passive', chars: 'all', title: 'Crecimiento', icon: ICONS.growth, desc: 'Aumenta la XP ganada +8%.' },
        { id: 'luck', type: 'passive', chars: 'all', title: 'Suerte', icon: ICONS.luck, desc: 'Mejora la calidad de los cofres y los Berries; +5% crítico.' },
        { id: 'maxhp', type: 'passive', chars: 'all', title: 'Vitalidad', icon: ICONS.heart, desc: 'Aumenta la vida máxima +20 y la regeneración.' },
        { id: 'regen', type: 'passive', chars: 'all', title: 'Regeneración', icon: ICONS.meat, desc: 'Recupera +2 HP por segundo.' },
        { id: 'evasion', type: 'passive', chars: 'all', title: 'Esquiva', icon: ICONS.dodge, desc: 'Reduce el daño recibido un +6% (acumulable).' },
        { id: 'magnet', type: 'passive', chars: 'all', title: 'Imán', icon: ICONS.pickup, desc: 'Aumenta el rango de recogida +20%.' },
        { id: 'greed', type: 'passive', chars: 'all', title: 'Avaricia', icon: ICONS.coin, desc: 'Aumenta los Berries ganados +12%.' },
        { id: 'vamp', type: 'passive', chars: 'all', title: 'Vampirismo', icon: ICONS.drop, desc: 'Sana 2 HP al derrotar a un enemigo (probabilidad).' },
        { id: 'kabuto', type: 'weapon', chars: ['usopp'], title: 'Kabuto de Usopp', icon: ICONS.kabuto, desc: 'Usopp: tirachinas cuya bola rebota por la arena.' },
        { id: 'climatact', type: 'weapon', chars: ['nami'], title: 'Clima-Tact de Nami', icon: ICONS.climatact, desc: 'Nami: Thunderbolt Tempo, rayos sobre enemigos al azar.' },
        { id: 'dial', type: 'weapon', chars: 'all', title: 'Dial de Impacto', icon: ICONS.dial, desc: 'Arma compartida: concha de Skypiea que suelta una onda y empuja a los cercanos.' },
        { id: 'rumble', type: 'passive', chars: ['chopper'], title: 'Rumble Ball', icon: ICONS.rumble, desc: 'Chopper: +15% duración de sus habilidades.' },
        { id: 'roseo', type: 'weapon', chars: ['chopper'], title: 'Kokutei Roseo Mirror', icon: ICONS.roseo, desc: 'Chopper (Heavy Point): pezuñazo que estalla en flor de cerezo sobre el enemigo más cercano.' },
        { id: 'clutch', type: 'weapon', chars: ['robin'], title: 'Seis Fleur: Clutch', icon: ICONS.clutch, desc: 'Robin: brotan brazos en los enemigos cercanos, los dañan y los inmovilizan.' },
        { id: 'jolly', type: 'passive', chars: 'all', title: 'Bandera Pirata', icon: ICONS.jolly, desc: 'Izas tu Jolly Roger: +10% enemigos y peligro, +10% XP y Berries.' },
    ];
    possibleUpgrades.push(...CREW_UPGRADES); // kits de Nami, Usopp, Chopper y Robin (js/crew.js), al final por el sesgo del sorteo
    if (typeof pxIcon === 'function') for (const u of possibleUpgrades) u.icon = pxIcon(u.id) || u.icon; // iconos pixel art (js/pixicons.js)
    return possibleUpgrades;
}

let currentUpgradeCount = 3, upgradeIsChest = false, _banishing = false;

function showUpgradeScreen(count, isChest) {
    upgradeIsChest = !!isChest;
    if (isChest) playSound('chest'); // la subida de nivel ya suena en levelUp()
    // VS: en subidas de nivel hay una 4ta opción con probabilidad (1 - 1/SuerteTotal)
    if (count === undefined || count === null) count = 3 + (Math.random() < (1 - 1 / player.luckBonus) ? 1 : 0);
    currentUpgradeCount = count;
    _banishing = false;
    const container = document.getElementById('upgrade-options');
    container.innerHTML = '';

    const weaponIds = CREW_WEAPON_IDS.concat(['pistol','gatling','bazooka','gear2','santoryu','onigiri','flyingslash','diablejambe','collier','joueshot','muchi','ono','tatsumaki','poundho','concasse','partycourse','cuchillo','granada','rifle','ballesta','lanza','hacha','shuriken','hakiPulse','kabuto','climatact','dial','roseo','clutch','zoroform','sanjiform']);
    const passiveIds = ['power','crit','cd','armor','haki_buso','haki_ken','haki_hao','area','speed','pickup','growth','luck','maxhp','regen','evasion','magnet','greed','vamp','rumble','jolly'];
    const possibleUpgrades = upgradeCatalog();
    // Quien no usa Haki en el canon (Nami, Chopper, Robin) ve Poder y Armadura sin el nombre de Haki
    if (!itemAllowed('haki_buso', selectedCharacter)) for (const u of possibleUpgrades) {
        if (u.id === 'power') u.title = 'Entrenamiento (Poder %)';
        if (u.id === 'armor') u.title = 'Armadura';
    }
    // snapshot del pool completo (titulo + icono) — la Ficha de Singladura lo usa
    window.UPGRADE_POOL_MAP = window.UPGRADE_POOL_MAP || {};
    for (let _u of possibleUpgrades) window.UPGRADE_POOL_MAP[_u.id] = { title: _u.title, icon: _u.icon };
    const possible = possibleUpgrades.filter(u => {
        if (!itemAllowed(u.id, selectedCharacter)) return false; // técnicas exclusivas y Haki solo para quien lo tiene en el canon
        if (player.banished && player.banished[u.id]) return false; // VS: Banish retira el ítem de la partida
        if (itemLocked(u.id)) return false; // se desbloquea con un logro (js/loot.js)
        const sk = skills[u.id];
        const isNew = !sk || sk.level <= 0;
        if (u.type === 'weapon' && sk && sk.level >= 5) {
            // VS: un arma al maximo (evolucionada o a la espera de cofre) deja de ofrecerse; si no queda nada, el botin se vuelve Beli
            return false;
        }
        if (isNew && u.type === 'weapon') {
            const equippedWeapons = Object.keys(skills).filter(k => weaponIds.includes(k) && skills[k].level > 0).length;
            if (equippedWeapons >= 6) return false;
        }
        if (isNew && u.type === 'passive') {
            // VS: máximo 6 pasivas por partida
            const ownedPassives = passiveIds.filter(pid => (player.passives[pid] || 0) > 0).length;
            if (ownedPassives >= 6) return false;
        }
        return true;
    });

    // Nota: este sort con comparador aleatorio NO baraja de forma uniforme: favorece a los primeros de la lista
    // (técnicas de Luffy y Poder/Crítico/Cooldown/Armadura). El balance está medido con este sesgo,
    // por eso los objetos nuevos van al final de possibleUpgrades.
    possible.sort(() => 0.5 - Math.random()).slice(0, count).forEach(up => {
        let desc = up.desc;
        // Destello de color por personaje para armas especiales (rojo Luffy, verde Zoro, amarillo Sanji);
        // las armas/pasivas compartidas (chars === 'all') no llevan destello.
        // Las armas EVOLUCIONADAS llevan un destello multicolor "legendario".
        // Color de personaje (rojo Luffy, verde Zoro, amarillo Sanji) y carta dorada si está evolucionada:
        // se aplica por CSS con data-char / .evo
        const sk = skills[up.id];
        const cardChar = (up.type === 'weapon' && Array.isArray(up.chars) && up.chars.length === 1) ? up.chars[0] : 'all';
        const cardEvo = up.type === 'weapon' && sk && sk.evolved;
        if (up.type === 'weapon' && EVOLUTIONS[up.id]) {
            const ev = EVOLUTIONS[up.id];
            const pname = (possible.find(x => x.id === ev.passive) || {}).title || ev.passive;
            desc += skills[up.id].evolved ? `<span style="color:#b45309">◆ EVOLUCIONADA — ${ev.name} ✔</span>` : `<span style="color:#1d4ed8">◆ Evolución: ${ev.name}</span> <span style="color:#7a4a28">(requiere: ${pname})</span>`;
        }
        const card = document.createElement('div');
        card.className = 'upgrade-card' + (cardEvo ? ' evo' : '');
        card.dataset.char = cardChar;
        card.dataset.kind = up.type;
        card.dataset.id = up.id;
        // Nivel actual → siguiente (armas hasta Nv 5; las pasivas cuentan sus mejoras)
        const curLv = up.type === 'weapon' ? ((sk && sk.level) || 0) : ((player.passives && player.passives[up.id]) || 0);
        const lvTag = curLv <= 0 ? `<span class="lvl-tag new">NUEVO</span>`
            : `<span class="lvl-tag">Nv ${curLv} → ${curLv + 1}${up.type === 'weapon' ? '<small>/5</small>' : ''}</span>`;
        card.innerHTML = `
            <div class="upgrade-icon">${cardEvo ? evoIcon(up.id, up.icon) : up.icon}</div>
            <div class="upgrade-info">
                <h4>${up.title} ${lvTag}</h4>
                <p>${desc}</p>
            </div>
        `;
        card.onclick = () => {
            if (_banishing) {
                // VS: Destierro retira la opción de la partida y repone opciones nuevas
                if (player.banishUses > 0) {
                    player.banished[up.id] = true;
                    player.banishUses--;
                    _banishing = false;
                    playSound('coin');
                    showUpgradeScreen(currentUpgradeCount, upgradeIsChest);
                }
                return;
            }
            selectUpgrade(up.id);
        };
        container.appendChild(card);
    });

    // VS: sin opciones (todo maxeado/banished) el botín se convierte en Beli — nunca se queda pillado
    let upgradeShowingFallback = false;
    if (!container.children.length) {
        upgradeShowingFallback = true;
        const goldVal = Math.round(ECONOMY.bag * (upgradeIsChest ? 2 : 1) * beliScale());
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="upgrade-icon">${ICONS.cart}</div>
            <div class="upgrade-info">
                <h4>Bolsa de Berries</h4>
                <p>No queda nada que mejorar en este cofre. El botín se convierte en <b style="color:#b45309">+${goldVal.toLocaleString('en-US')} Berries</b>.</p>
            </div>
        `;
        card.onclick = () => {
            addBeli(goldVal, 'bag');
            playSound('coin');
            document.getElementById('upgrade-screen').style.display = 'none';
            resumeAfterUpgrade();
        };
        container.appendChild(card);
        document.getElementById('upgrade-subtitle').innerText = upgradeIsChest
            ? '¡COFRE VACÍO! EL BOTÍN SE CONVIERTE EN BELI — TOMA EL ORO'
            : '¡TRIPULACIÓN COMPLETA! EL BOTÍN SE CONVIERTE EN BELI';
    }

    renderUpgradeToolbar();
    if (!upgradeShowingFallback) document.getElementById('upgrade-subtitle').innerText = upgradeIsChest
        ? '¡COFRE DEL TESORO! ELIGE TU BOTÍN — DEAD OR ALIVE'
        : '¡SUBIDA DE NIVEL! ELIGE TU MEJORA — DEAD OR ALIVE';
    document.getElementById('upgrade-screen').style.display = 'flex';
}

// VS: Reroll / Skip / Banish — cargas compradas en la meta-tienda
function renderUpgradeToolbar() {
    const bar = document.getElementById('upgrade-toolbar');
    if (!bar) return;
    bar.innerHTML =
        `<button class="ut-btn" data-ut="reroll" ${player.rerollUses <= 0 ? 'disabled' : ''}>Reroll (x${player.rerollUses})</button>` +
        (upgradeIsChest ? '' : `<button class="ut-btn" data-ut="skip" ${player.skipUses <= 0 ? 'disabled' : ''}>Saltar (x${player.skipUses})</button>`) +
        `<button class="ut-btn" data-ut="banish" ${player.banishUses <= 0 ? 'disabled' : ''}>Desterrar (x${player.banishUses})</button>`;
    bar.querySelectorAll('[data-ut]').forEach(b => {
        b.onclick = () => {
            const k = b.dataset.ut;
            if (k === 'reroll' && player.rerollUses > 0) {
                player.rerollUses--;
                playSound('coin');
                showUpgradeScreen(currentUpgradeCount, upgradeIsChest);
            } else if (k === 'skip' && player.skipUses > 0 && !upgradeIsChest) {
                player.skipUses--;
                skipUpgrade();
            } else if (k === 'banish' && player.banishUses > 0) {
                _banishing = !_banishing;
                b.classList.toggle('active', _banishing);
                document.getElementById('upgrade-subtitle').innerText = _banishing
                    ? 'ELIGE UNA CARTA PARA DESTERRAR — DEAD OR ALIVE'
                    : (upgradeIsChest ? '¡COFRE DEL TESORO! ELIGE TU BOTÍN — DEAD OR ALIVE' : '¡SUBIDA DE NIVEL! ELIGE TU MEJORA — DEAD OR ALIVE');
            }
        };
    });
}

// VS: al cerrar una pantalla (mejora/cofre/aracana) encadena lo pendiente:
// Voluntades D > niveles en cola > reanudar juego
function resumeAfterUpgrade() {
    if ((player._arcanaPending || 0) > 0) { player._arcanaPending--; showArcanaScreen(); return; }
    if ((window._pendingLevelUps || 0) > 0) {
        window._pendingLevelUps--;
        updateUI();
        gameState = 'UPGRADE';
        playSound('levelup');
        showUpgradeScreen();
        return;
    }
    updateUI();
    gameState = 'PLAYING';
    lastTime = performance.now();
}

function skipUpgrade() {
    // VS: Skip salta la subida de nivel sin elegir nada
    document.getElementById('upgrade-screen').style.display = 'none';
    resumeAfterUpgrade();
}

function selectUpgrade(id) {
    if (id === 'pistol') {
        skills.pistol.level = Math.min(5, skills.pistol.level + 1);
        skills.pistol.baseDamage += 22; skills.pistol.range += 35;
    }
    else if (id === 'gatling') {
        skills.gatling.level = Math.min(5, skills.gatling.level + 1);
        skills.gatling.baseDamage += 9;
    }
    else if (id === 'power') { player.powerPct += 20; player.passives.power = (player.passives.power || 0) + 1; }
    else if (id === 'crit') { player.critChance += 0.15; player.passives.crit = (player.passives.crit || 0) + 1; }
    else if (id === 'cd') { player.cdReduction = Math.min(60, player.cdReduction + 12); player.passives.cd = (player.passives.cd || 0) + 1; }
    else if (id === 'armor') { player.armor = Math.min(70, player.armor + 8); player.passives.armor = (player.passives.armor || 0) + 1; }
    else if (id === 'bazooka') {
        skills.bazooka.level = Math.min(5, skills.bazooka.level + 1);
        skills.bazooka.baseDamage += 20;
    }
    else if (id === 'gear2') {
        skills.gear2.level = Math.min(5, skills.gear2.level + 1);
        skills.gear2.speedBonus += 0.1; skills.gear2.duration += 1;
    }
    else if (id === 'zoroform' || id === 'sanjiform') {
        skills[id].level = Math.min(5, skills[id].level + 1);
    }
    else if (id === 'santoryu') {
        skills.santoryu.level = Math.min(5, skills.santoryu.level + 1);
        skills.santoryu.baseDamage += 12; skills.santoryu.radius += 5;
    }
    else if (id === 'onigiri') {
        skills.onigiri.level = Math.min(5, skills.onigiri.level + 1);
        skills.onigiri.baseDamage += 16; skills.onigiri.dash += 30;
    }
    else if (id === 'flyingslash') {
        skills.flyingslash.level = Math.min(5, skills.flyingslash.level + 1);
        skills.flyingslash.baseDamage += 9;
    }
    else if (id === 'diablejambe') {
        skills.diablejambe.level = Math.min(5, skills.diablejambe.level + 1);
        skills.diablejambe.baseDamage += 9; skills.diablejambe.radius += 5;
    }
    else if (id === 'collier') {
        skills.collier.level = Math.min(5, skills.collier.level + 1);
        skills.collier.baseDamage += 7;
    }
    else if (id === 'joueshot') {
        skills.joueshot.level = Math.min(5, skills.joueshot.level + 1);
        skills.joueshot.baseDamage += 11;
    }
    else if (id === 'muchi') {
        skills.muchi.level = Math.min(5, skills.muchi.level + 1);
        skills.muchi.baseDamage += 14; skills.muchi.radius += 15;
    }
    else if (id === 'ono') {
        skills.ono.level = Math.min(5, skills.ono.level + 1);
        skills.ono.baseDamage += 18; skills.ono.radius += 8;
    }
    else if (id === 'tatsumaki') {
        skills.tatsumaki.level = Math.min(5, skills.tatsumaki.level + 1);
        skills.tatsumaki.baseDamage += 4; skills.tatsumaki.radius += 8;
    }
    else if (id === 'poundho') {
        skills.poundho.level = Math.min(5, skills.poundho.level + 1);
        skills.poundho.baseDamage += 10; skills.poundho.range += 25;
    }
    else if (id === 'concasse') {
        skills.concasse.level = Math.min(5, skills.concasse.level + 1);
        skills.concasse.baseDamage += 24; skills.concasse.radius += 10;
    }
    else if (id === 'partycourse') {
        skills.partycourse.level = Math.min(5, skills.partycourse.level + 1);
        skills.partycourse.baseDamage += 3; skills.partycourse.radius += 8;
    }
    else if (id === 'cuchillo') {
        skills.cuchillo.level = Math.min(5, skills.cuchillo.level + 1);
        skills.cuchillo.baseDamage += 8; skills.cuchillo.range += 15;
    }
    else if (id === 'granada') {
        skills.granada.level = Math.min(5, skills.granada.level + 1);
        skills.granada.baseDamage += 12; skills.granada.radius += 6;
    }
    else if (id === 'rifle') {
        skills.rifle.level = Math.min(5, skills.rifle.level + 1);
        skills.rifle.baseDamage += 10; skills.rifle.range += 20;
    }
    else if (id === 'ballesta') {
        skills.ballesta.level = Math.min(5, skills.ballesta.level + 1);
        skills.ballesta.baseDamage += 12; skills.ballesta.range += 30;
    }
    else if (id === 'lanza') {
        skills.lanza.level = Math.min(5, skills.lanza.level + 1);
        skills.lanza.baseDamage += 9; skills.lanza.range += 8;
    }
    else if (id === 'hacha') {
        skills.hacha.level = Math.min(5, skills.hacha.level + 1);
        skills.hacha.baseDamage += 20; skills.hacha.radius += 6;
    }
    else if (id === 'shuriken') {
        skills.shuriken.level = Math.min(5, skills.shuriken.level + 1);
        skills.shuriken.baseDamage += 7; skills.shuriken.range += 20;
    }
    else if (id === 'hakiPulse') {
        skills.hakiPulse.level = Math.min(5, skills.hakiPulse.level + 1);
        skills.hakiPulse.baseDamage += 6; skills.hakiPulse.radius += 8;
    }
    else if (ARSENAL_UPGRADE[id]) { ARSENAL_UPGRADE[id](); }
    else if (id === 'haki_buso') { player.powerPct += 10; player.armor = Math.min(70, player.armor + 5); player.passives.haki_buso = (player.passives.haki_buso || 0) + 1; }
    else if (id === 'haki_ken') { player.critChance += 0.1; player.passives.haki_ken = (player.passives.haki_ken || 0) + 1; }
    else if (id === 'haki_hao') { /* stun area: handled in render/update */ player.passives.haki_hao = (player.passives.haki_hao || 0) + 1; }
    else if (id === 'area') { player.areaBonus *= 1.1; player.passives.area = (player.passives.area || 0) + 1; }
    else if (id === 'speed') { player.speed *= 1.08; player.passives.speed = (player.passives.speed || 0) + 1; }
    else if (id === 'pickup') { player.pickupBonus += 0.1; player.passives.pickup = (player.passives.pickup || 0) + 1; }
    else if (id === 'growth') { player.growthBonus += 0.08; player.passives.growth = (player.passives.growth || 0) + 1; }
    else if (id === 'luck') { player.critChance += 0.05; player.luckBonus += 0.10; player.passives.luck = (player.passives.luck || 0) + 1; }
    else if (id === 'maxhp') { player.maxHp += 20; player.hp = Math.min(player.maxHp, player.hp + 20); player.passives.maxhp = (player.passives.maxhp || 0) + 1; }
    else if (id === 'regen') { player.regenRate += 2; player.passives.regen = (player.passives.regen || 0) + 1; }
    else if (id === 'evasion') { player.evasion = Math.min(0.6, player.evasion + 0.06); player.passives.evasion = (player.passives.evasion || 0) + 1; }
    else if (id === 'magnet') { player.pickupBonus += 0.2; player.passives.magnet = (player.passives.magnet || 0) + 1; }
    else if (id === 'greed') { player.greedBonus += 0.12; player.passives.greed = (player.passives.greed || 0) + 1; }
    else if (id === 'vamp') { player.vampirism += 0.15; player.passives.vamp = (player.passives.vamp || 0) + 1; }

    if (window._applyOnly) return; // la ruleta del cofre aplica varios objetos seguidos
    playSound('select');
    document.getElementById('upgrade-screen').style.display = 'none';
    // VS: las Arcanas otorgadas a mitad de partida encadenan tras cerrar la subida
    resumeAfterUpgrade();
    // no re-armamos rAF: el bucle sigue activo (evita doble gameLoop)
}

// Berries de la partida que aún no han entrado en la bolsa. Al seguir en Modo Infinito tras la
// victoria, lo ya cobrado no se vuelve a sumar al morir (antes se cobraba dos veces).
function bankRunBeli() {
    const owed = scoreBeli - (window._beliBanked || 0);
    window._beliBanked = scoreBeli;
    return owed;
}
function triggerGameOver() {
    // varios golpes mortales en el mismo frame (explosiones, balas) llamaban aquí dos veces y cobraban doble
    if (gameState === 'GAMEOVER' || gameState === 'VICTORY') return;
    if (player.revives > 0) {
        player.revives--;
        player.hp = player.maxHp * 0.3; // Revivir: 30% (antes 50%)
        cameraShake = 2;
        playSound('revive');
        updateUI();
        return;
    }
    gameState = 'GAMEOVER';
    const endKills = window.runStats ? window.runStats.kills : 0;
    mergeRunStats();
    const newRecord = recordRun(!!window.endlessMode); // en Infinito la isla ya está conquistada
    playSound('death');
    playSound('gameover');
    checkAchievements();
    meta.beli += bankRunBeli();
    saveMeta();
    updateMetaUI();
    const st = meta.stats;
    document.getElementById('gameover-stats').innerText =
        'Tiempo: ' + formatTime(gameTime) + ' · Enemigos derrotados esta singladura: ' + endKills +
        ' · Berries conseguido: ' + fmtBeli(scoreBeli) + ' · Récord ' + selectedMap.toUpperCase() + ': ' + formatTime(st.maxTime[selectedMap] || 0) + (newRecord ? ' · ¡NUEVO RÉCORD!' : '');
    renderRunSummary('gameover-summary');
    document.getElementById('gameover-screen').style.display = 'flex';
}

function triggerVictory() {
    if (gameState === 'GAMEOVER' || gameState === 'VICTORY') return;
    gameState = 'VICTORY';
    meta.beli += bankRunBeli(); // VS: la botin de la singladura entra en la bolsa al terminar
    playSound('victory');
    const prevBest = meta.stats.maxTime[selectedMap] || 0;
    mergeRunStats();
    recordRun(true);
    meta.wins[selectedMap] = (meta.wins[selectedMap] || 0) + 1;
    meta.stats.winsByChar[selectedCharacter] = (meta.stats.winsByChar[selectedCharacter] || 0) + 1;
    meta.stats.winsByCurse[runCurseRank] = (meta.stats.winsByCurse[runCurseRank] || 0) + 1;
    gearOnVictory();
    // VS: vencer con el clima N desbloquea el N+1 (una vez)
    if (runCurseRank === meta.curseUnlocked && meta.curseUnlocked < 4) {
        meta.curseUnlocked++;
        showAchToast('CLIMA PELIGROSO ' + meta.curseUnlocked + ' DESBLOQUEADO — más Berries, más peligro');
        updateMetaUI();
    }
    checkAchievements();
    saveMeta();
    updateMetaUI();
    const st = meta.stats;
    const record = gameTime > prevBest ? ' · ¡NUEVO RÉCORD!' : '';
    document.getElementById('victory-stats').innerText =
        'Tiempo: ' + formatTime(gameTime) + ' · Berries conseguido: ' + fmtBeli(scoreBeli) +
        ' · Récord ' + selectedMap.toUpperCase() + ': ' + formatTime(st.maxTime[selectedMap] || 0) + record;
    renderRunSummary('victory-summary');
    document.getElementById('victory-screen').style.display = 'flex';
}

// VS: tras vencer al boss puedes seguir navegando — Modo Infinito con bosses cada 5 min
function startEndless() {
    window.endlessMode = true;
    window.nextBossAt = gameTime + 300;
    initRunStats(); // nueva singlatura estadistica para la fase infinita (ya se mergeo la anterior)
    document.getElementById('victory-screen').style.display = 'none';
    gameState = 'PLAYING';
    showAchToast('MODO INFINITO — bosses cada 5 minutos, cada uno un 60% más fuerte');
    startLoop(); // el bucle se detuvo al pasar a VICTORY
}

// formato con separador de miles (el simbolo ฿ va en el markup)
function fmtBeli(n) { return Math.floor(n).toLocaleString('en-US'); }

// Rendimiento: updateUI() se llama desde muchos sitios (a veces varias veces por frame, una por enemigo
// que toca al jugador). Durante la partida solo marca la interfaz como pendiente y gameLoop la vuelca una vez.
let _uiDirty = false;
function updateUI() {
    if (gameState === 'PLAYING') { _uiDirty = true; return; }
    updateUINow();
}
function flushUI() { if (_uiDirty) { _uiDirty = false; updateUINow(); } }
// Escribe en el DOM solo si el valor cambió (cada escritura invalida el estilo de la página)
const _uiCache = {};
const _uiEl = {};
function uiEl(id) { return _uiEl[id] || (_uiEl[id] = document.getElementById(id)); }
function setText(id, v) { if (_uiCache[id] !== v) { _uiCache[id] = v; const el = uiEl(id); if (el) el.innerText = v; } }
function setWidth(id, v) { const k = id + ':w'; if (_uiCache[k] !== v) { _uiCache[k] = v; const el = uiEl(id); if (el) el.style.width = v; } }
function updateUINow() {
    setText('hp-text', `${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}`);
    setWidth('hp-bar', `${Math.max(0, (player.hp / player.maxHp) * 100).toFixed(1)}%`);
    // VS: estados de vida por porcentaje — verde sano, ambar media, roja al limite
    const hpPct = Math.max(0, player.hp / player.maxHp);
    const hpState = hpPct <= 0.3 ? 2 : (hpPct <= 0.6 ? 1 : 0);
    if (_uiCache.hpState !== hpState) {
        _uiCache.hpState = hpState;
        const hpBar = uiEl('hp-bar');
        hpBar.classList.toggle('hp-mid', hpState === 1);
        hpBar.classList.toggle('hp-low', hpState === 2);
        const hpText = uiEl('hp-text');
        hpText.classList.toggle('warn', hpState === 1);
        hpText.classList.toggle('danger', hpState === 2);
    }
    setWidth('xp-bar', `${Math.min(100, (player.xp / player.nextXp) * 100).toFixed(1)}%`);
    setText('level-txt', String(player.level));
    setText('score-txt', fmtBeli(scoreBeli));

    setText('stat-power', `+${player.powerPct}%`);
    setText('stat-crit', `${Math.round(player.critChance * 100)}%`);
    setText('stat-cd', `-${player.cdReduction}%`);
    // armor display if element exists
    setText('stat-armor', `${player.armor}%`);
    updateWeaponsHUD();
}

function updateWeaponsHUD() {
    const el = document.getElementById('weapons-hud');
    if (!el) return;
    const weapons = [
        { id: 'pistol', icon: ICONS.pistol, name: 'Pistol' },
        { id: 'gatling', icon: ICONS.gatling, name: 'Gatling' },
        { id: 'bazooka', icon: ICONS.bazooka, name: 'Bazooka' },
        { id: 'gear2', icon: ICONS.gear2, name: 'Gears' },
        { id: 'zoroform', icon: ICONS.zoroform, name: 'Haki del Rey' },
        { id: 'sanjiform', icon: ICONS.sanjiform, name: 'Raid Suit' },
        { id: 'santoryu', icon: ICONS.santoryu, name: 'Santoryu' },
        { id: 'onigiri', icon: ICONS.onigiri, name: 'Oni Giri' },
        { id: 'flyingslash', icon: ICONS.flyingslash, name: 'Flying Slash' },
        { id: 'diablejambe', icon: ICONS.diablejambe, name: 'Diable Jambe' },
        { id: 'collier', icon: ICONS.collier, name: 'Collier' },
        { id: 'joueshot', icon: ICONS.joueshot, name: 'Joue Shot' },
        { id: 'muchi', icon: ICONS.muchi, name: 'Muchi' },
        { id: 'ono', icon: ICONS.ono, name: 'Ono' },
        { id: 'tatsumaki', icon: ICONS.tatsumaki, name: 'Tatsumaki' },
        { id: 'poundho', icon: ICONS.poundho, name: '108 Pound Ho' },
        { id: 'concasse', icon: ICONS.concasse, name: 'Concassé' },
        { id: 'partycourse', icon: ICONS.partycourse, name: 'Party Table' }
    ];
    // armas compartidas (disponibles para todos)
    weapons.push(
        { id: 'cuchillo', icon: ICONS.cuchillo, name: 'Cuchillo' }, { id: 'granada', icon: ICONS.granada, name: 'Granada' },
        { id: 'rifle', icon: ICONS.rifle, name: 'Rifle' }, { id: 'ballesta', icon: ICONS.ballesta, name: 'Ballesta' },
        { id: 'lanza', icon: ICONS.lanza, name: 'Lanza' }, { id: 'hacha', icon: ICONS.hacha, name: 'Hacha' },
        { id: 'shuriken', icon: ICONS.shuriken, name: 'Shuriken' }, { id: 'hakiPulse', icon: ICONS.hakiPulse, name: 'Haoshoku' },
        { id: 'kabuto', icon: ICONS.kabuto, name: 'Kabuto' }, { id: 'roseo', icon: ICONS.roseo, name: 'Roseo Mirror' }, { id: 'clutch', icon: ICONS.clutch, name: 'Clutch' }, { id: 'climatact', icon: ICONS.climatact, name: 'Clima-Tact' }, { id: 'dial', icon: ICONS.dial, name: 'Dial de Impacto' },
        ...CREW_HUD
    );
    // solo se reconstruye si cambian las armas, sus niveles o evoluciones
    let sig = '';
    for (const w of weapons) { const sk = skills[w.id]; if (sk && sk.level > 0) sig += w.id + sk.level + (sk.evolved ? '*' : '') + ','; }
    if (el._sig === sig && el.childElementCount) return;
    el._sig = sig;
    el.innerHTML = '';
    weapons.forEach(w => {
        const sk = skills[w.id];
        if (!sk || sk.level <= 0) return;
        // ranura con el color del personaje dueño de la técnica (gris = compartida)
        const owner = Object.keys(CHAR_SKILLS).find(c => CHAR_SKILLS[c].includes(w.id)) || 'all';
        const div = document.createElement('div');
        div.className = 'wslot' + (sk.evolved ? ' evo' : '');
        div.dataset.char = owner;
        div.title = sk.evolved ? (sk.evolvedName || w.name) : w.name;
        div.innerHTML = `<div class="hud-ico">${sk.evolved ? evoIcon(w.id, w.icon) : w.icon}</div><div class="wslot-lv">${sk.evolved ? '◆' : 'Nv ' + sk.level}</div>`;
        el.appendChild(div);
    });
}
function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}
