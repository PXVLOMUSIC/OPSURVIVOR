// === Botín: cofres con ruleta, objetos del suelo y contenido que se desbloquea con logros ===

// --- Objetos que se desbloquean con logros (como las armas de VS que aparecen tras un logro) ---
// Las armas de la tripulación entran en el arsenal compartido al desbloquear al personaje.
const ITEM_LOCK = {
    kabuto: 'usopp', climatact: 'nami', rumble: 'chopper',
    dial: 'item_dial', jolly: 'item_jolly'
};
function itemLocked(id) {
    const key = ITEM_LOCK[id];
    if (!key || meta.unlocked[key]) return false;
    // el arma inicial del personaje elegido siempre está disponible
    return !(CREW_START[selectedCharacter] && CREW_START[selectedCharacter].weapon === id);
}

// --- Objetos del suelo (los braseros de VS): barriles y faroles que se rompen a golpes ---
const PROP_TYPES = ['barrel', 'jar', 'lantern'];
const PROP_BY_MAP = { baratie: 'barrel', alabasta: 'jar', skypiea: 'barrel', thrillerbark: 'lantern', enieslobby: 'barrel', marineford: 'barrel' };
const PROP_MAX = 4, PROP_EVERY = 6;
(function buildProps() {
    const barrel = (g) => {
        px(g, '#5b3410', 3, 3, 18, 22); px(g, '#8b5a2b', 5, 3, 14, 22); px(g, '#a16d38', 8, 3, 5, 22);
        px(g, '#374151', 3, 7, 18, 2); px(g, '#374151', 3, 19, 18, 2); px(g, '#3f2a14', 5, 1, 14, 3);
    };
    const jar = (g) => {
        px(g, '#9a5b2e', 8, 1, 8, 3); px(g, '#b8743f', 6, 4, 12, 3); px(g, '#c98a4e', 3, 7, 18, 15);
        px(g, '#b8743f', 5, 22, 14, 3); px(g, '#e2b07a', 6, 9, 3, 9); px(g, '#7c3f1d', 3, 13, 18, 2);
    };
    const lantern = (g, i) => {
        px(g, '#1f2937', 10, 0, 4, 3); px(g, '#111827', 5, 3, 14, 3); px(g, '#111827', 5, 22, 14, 3);
        px(g, i % 2 ? '#a3e635' : '#bef264', 7, 6, 10, 16); px(g, '#111827', 11, 6, 2, 16); px(g, '#ecfccb', 9, 10, 2, 6);
    };
    ENEMY_IMG.barrel = { idle: procEnemyFrames(24, 26, 1, barrel), attack: [] };
    ENEMY_IMG.jar = { idle: procEnemyFrames(24, 26, 1, jar), attack: [] };
    ENEMY_IMG.lantern = { idle: procEnemyFrames(24, 26, 2, lantern), attack: [] };
    ENEMY_ANIMS.barrel = {}; ENEMY_ANIMS.jar = {}; ENEMY_ANIMS.lantern = {};
    ENEMY_STATS.barrel = [1, 0, 0]; ENEMY_STATS.jar = [1, 0, 0]; ENEMY_STATS.lantern = [1, 0, 0];
})();

function updateProps(dt) {
    window._propTimer = (window._propTimer || 0) + dt;
    if (window._propTimer < PROP_EVERY) return;
    window._propTimer = 0;
    // los que se quedan muy lejos desaparecen, como en VS
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.isProp && Math.hypot(e.x - player.x, e.y - player.y) > 1100) enemies.splice(i, 1);
    }
    if (enemies.filter(e => e.isProp).length >= PROP_MAX) return;
    const poly = walkPoly();
    for (let k = 0; k < 8; k++) {
        const ang = Math.random() * Math.PI * 2, r = 280 + Math.random() * 320;
        const x = player.x + Math.cos(ang) * r, y = player.y + Math.sin(ang) * r;
        if (poly && !pointInPoly(x, y, poly)) continue;
        if (typeof hasObstacles !== 'undefined' && hasObstacles && hitsObstacle(x, y, 14)) continue;
        const type = PROP_BY_MAP[selectedMap] || 'barrel';
        enemies.push(makeEnemy(type, x, y, 1, { hp: 1, maxHp: 1, speed: 0, damage: 0, isProp: true }));
        return;
    }
}

function propBreak(e) {
    playSound('hit');
    fxRing(e.x, e.y, '#fbbf24', 12, 0.3);
    for (let k = 0; k < 8; k++) {
        const ang = Math.random() * Math.PI * 2, sp = 50 + Math.random() * 80;
        particles.push({ x: e.x, y: e.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.5, maxLife: 0.5, color: e.type === 'lantern' ? '#a3e635' : '#a16d38', shape: 'spark', size: 2.5, grav: 160 });
    }
    // VS: el brasero suelta pollo, monedas o una reliquia rara (escala con Suerte)
    const r = Math.random(), luck = player.luckBonus;
    if (r < 0.02 * luck) e._drop = 'denden';
    else if (r < 0.07 * luck) e._drop = 'bell';
    else if (r < 0.22 * luck) e._drop = 'vacuum';
    else if (r < 0.62) e._drop = 'meat';
    else e._drop = 'beli';
    if (e._drop === 'beli') {
        for (let k = 0; k < 3; k++) drops.push({ x: e.x + (k - 1) * 10, y: e.y, type: 'beli', value: Math.round(25 * player.greedBonus * (player.runBeliMult || 1)) });
    } else drops.push({ x: e.x, y: e.y, type: e._drop });
}

// --- Cofre con ruleta (VS): el cofre se abre solo y la ruleta revela 1, 3 o 5 objetos ---
function chestItemCount() {
    const roll = Math.random(), luck = player.luckBonus;
    return roll < 0.03 * luck ? 5 : (roll < 0.15 * luck ? 3 : 1);
}

function openChestRoulette(count, tier, beliVal, evolvedNames) {
    const items = [];
    const realSound = playSound;
    window._applyOnly = true;
    playSound = function () {};
    try {
        for (let k = 0; k < count; k++) {
            showUpgradeScreen(1, true);
            const card = document.querySelector('#upgrade-options .upgrade-card');
            const id = card && card.dataset.id;
            if (id) {
                items.push({ id, title: card.querySelector('h4').innerText, icon: card.querySelector('.upgrade-icon').innerHTML });
                selectUpgrade(id);
            } else {
                const extra = Math.round((75 + player.level * 25) * 2 * player.greedBonus * (player.runBeliMult || 1));
                scoreBeli += extra;
                items.push({ id: null, title: '+' + extra.toLocaleString('en-US') + ' Berries', icon: ICONS.cart });
            }
        }
    } finally {
        window._applyOnly = false;
        playSound = realSound;
    }
    document.getElementById('upgrade-screen').style.display = 'none';
    gameState = 'CHEST';
    playSound('chest');
    showChestScreen(items, tier, beliVal, evolvedNames || []);
}

function showChestScreen(items, tier, beliVal, evolvedNames) {
    let scr = document.getElementById('chest-screen');
    if (!scr) {
        scr = document.createElement('div');
        scr.id = 'chest-screen';
        scr.className = 'overlay-screen';
        document.body.appendChild(scr);
    }
    const tierName = tier === 2 ? 'COFRE DE ORO' : (tier === 1 ? 'COFRE DE PLATA' : 'COFRE DE BRONCE');
    scr.innerHTML = `<div class="wanted-board chest-board tier${tier}">
        <div class="wanted-title">¡${tierName}!</div>
        <div class="wanted-subtitle">${items.length > 1 ? items.length + ' TESOROS' : 'LA RULETA GIRA...'} · +${beliVal.toLocaleString('en-US')} BERRIES</div>
        ${evolvedNames.map(n => `<div class="chest-evo">◆ ${n}</div>`).join('')}
        <div class="chest-reels">${items.map((_, k) => `<div class="chest-reel" data-k="${k}"><div class="chest-icon"></div><div class="chest-name"></div></div>`).join('')}</div>
        <button class="btn-start chest-take" disabled>¡RECOGER!</button>
    </div>`;
    scr.style.display = 'flex';
    const pool = Object.values(window.UPGRADE_POOL_MAP || {});
    const reels = [...scr.querySelectorAll('.chest-reel')];
    const btn = scr.querySelector('.chest-take');
    const t0 = performance.now();
    let lastTick = 0;
    window._chestAnim && clearInterval(window._chestAnim);
    window._chestAnim = setInterval(() => {
        const t = performance.now() - t0;
        let spinning = 0;
        reels.forEach((r, k) => {
            const stopAt = 900 + k * 350;
            if (t < stopAt) {
                spinning++;
                const p = pool[Math.floor(Math.random() * pool.length)] || items[k];
                r.querySelector('.chest-icon').innerHTML = p.icon;
                r.querySelector('.chest-name').innerText = '';
            } else if (!r.classList.contains('done')) {
                r.classList.add('done');
                r.querySelector('.chest-icon').innerHTML = items[k].icon;
                r.querySelector('.chest-name').innerText = items[k].title;
                playSound('reward');
            }
        });
        if (spinning && t - lastTick > 90) { lastTick = t; playSound('coin'); }
        if (!spinning) { clearInterval(window._chestAnim); window._chestAnim = null; btn.disabled = false; }
    }, 60);
    btn.onclick = closeChestRoulette;
}

function closeChestRoulette() {
    if (window._chestAnim) { clearInterval(window._chestAnim); window._chestAnim = null; }
    const scr = document.getElementById('chest-screen');
    if (scr) scr.style.display = 'none';
    playSound('select');
    resumeAfterUpgrade();
}
