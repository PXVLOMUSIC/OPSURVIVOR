// === Spatial hash de enemigos (VS usa grids: evita el O(n^2) en hordas grandes) ===
const GRID_CELL = 70;
let enemyGrid = new Map();
function rebuildEnemyGrid() {
    enemyGrid.clear();
    for (const e of enemies) {
        const key = Math.floor(e.x / GRID_CELL) + ',' + Math.floor(e.y / GRID_CELL);
        let arr = enemyGrid.get(key);
        if (!arr) { arr = []; enemyGrid.set(key, arr); }
        arr.push(e);
    }
}
// itera SOLO enemigos dentro del radio r desde (x, y)
function forEnemiesNear(x, y, r, cb) {
    const c0 = Math.floor((x - r) / GRID_CELL), c1 = Math.floor((x + r) / GRID_CELL);
    const w0 = Math.floor((y - r) / GRID_CELL), w1 = Math.floor((y + r) / GRID_CELL);
    const rr = r * r;
    for (let cx = c0; cx <= c1; cx++) {
        for (let cy = w0; cy <= w1; cy++) {
            const arr = enemyGrid.get(cx + ',' + cy);
            if (!arr) continue;
            for (const e of arr) {
                const dx = e.x - x, dy = e.y - y;
                if (dx * dx + dy * dy <= rr) cb(e);
            }
        }
    }
}

const keys = {};
let joystick = { active: false, dx: 0, dy: 0, touchId: null };

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'PLAYING') togglePause();
        else if (gameState === 'PAUSED') resumeGame();
    }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
// al cambiar de ventana con una tecla pulsada no llega el keyup y el personaje seguía andando solo
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

const joystickZone = document.getElementById('joystick-zone');
const joystickKnob = document.getElementById('joystick-knob');
// Joystick flotante estilo VS mobile: aparece donde toques la pantalla (no en UI)
let JOY_HALF = 65; // mitad del tamaño de la zona (130px en PC, 100px en móvil)
function isUITouch(el) {
    return el.closest && el.closest('button, #upgrade-screen, #arcana-screen, #start-screen, #shop-screen, #pause-menu, #gameover-screen, #victory-screen, #hud, .hud');
}
function joystickDelta(clientX, clientY, centerX, centerY) {
    let dx = clientX - centerX, dy = clientY - centerY;
    const dist = Math.hypot(dx, dy), maxR = JOY_HALF;
    if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    joystick.dx = dx / maxR; joystick.dy = dy / maxR;
}

window.addEventListener('touchstart', e => {
    if (gameState !== 'PLAYING') return;
    if (joystick.active) return; // un solo stick: ignorar segundas manos
    if (isUITouch(e.target)) return;
    JOY_HALF = compactHUD() ? 50 : 65;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const cx = touch.clientX, cy = touch.clientY;
    // mover la base del stick al punto tactil
    joystickZone.style.bottom = 'auto';
    joystickZone.style.left = (cx - JOY_HALF) + 'px';
    joystickZone.style.top = (cy - JOY_HALF) + 'px';
    joystick.active = true; joystick.touchId = touch.identifier;
    joystickZone.style.display = 'block';
    joystickDelta(cx, cy, cx, cy);
}, { passive: false });

window.addEventListener('touchmove', e => {
    if (!joystick.active) return;
    for (let touch of e.changedTouches) {
        if (touch.identifier === joystick.touchId) {
            e.preventDefault();
            const rect = joystickZone.getBoundingClientRect();
            joystickDelta(touch.clientX, touch.clientY, rect.left + JOY_HALF, rect.top + JOY_HALF);
        }
    }
}, { passive: false });

function joystickRelease(e) {
    for (let touch of e.changedTouches) {
        if (touch.identifier === joystick.touchId) {
            joystick.active = false; joystick.dx = 0; joystick.dy = 0;
            joystickZone.style.display = 'none';
            joystickKnob.style.transform = `translate(0px, 0px)`;
        }
    }
}
window.addEventListener('touchend', joystickRelease);
// iOS/Android cancelan el toque con avisos, gestos del sistema o al rotar: sin esto el stick se quedaba pegado
window.addEventListener('touchcancel', joystickRelease);

// === Voluntades de D: modificadores de partida estilo Arcanas de VS ===
// 1 al empezar la run (arriba) + 1 al vencer cada miniboss (Moria / Kuma)
const ARCANA_POOL = [
    { id: 'd_ascendiente', name: 'D. Ascendiente', desc: 'La Voluntad del Dawn despierta: +25% Poder.', apply: () => { player.powerPct += 25; } },
    { id: 'chef_baratie', name: 'Chef del Baratie', desc: 'Un banquete del mar llenara el espirito: +40% XP.', apply: () => { player.growthBonus += 0.4; } },
    { id: 'log_pose', name: 'Log Pose', desc: 'Navegas la ruta mas corta: -25% Cooldown.', apply: () => { player.cdReduction = Math.min(80, player.cdReduction + 25); } },
    { id: 'mandoble_wano', name: 'Mandoble de Wano', desc: 'Te ganza un samurai: +20% Critico.', apply: () => { player.critChance = Math.min(1.0, player.critChance + 0.2); } },
    { id: 'campana_dorada', name: 'Campana Dorada', desc: 'Resuena sobre la selva: +100% rango de recogida.', apply: () => { player.pickupBonus += 1.0; } },
    { id: 'bolsa_avaro', name: 'Bolsa del Avaro', desc: 'El oro llama al oro: +30% Berries.', apply: () => { player.greedBonus += 0.3; } },
    { id: 'sangre_celestial', name: 'Sangre Celestial', desc: 'La sangre de Mariejois blindia: +15% Armadura.', apply: () => { player.armor = Math.min(70, player.armor + 15); } },
    { id: 'viento_alabasta', name: 'Viento de Alabasta', desc: 'El viento empuja las velas: +15% Velocidad.', apply: () => { player.speed *= 1.15; } },
    { id: 'haki_rey', name: 'Haki del Emperador', desc: 'Impones tu voluntad: +15% Poder y +10% Critico.', apply: () => { player.powerPct += 15; player.critChance = Math.min(1.0, player.critChance + 0.1); } },
    { id: 'flecha_yonta', name: 'Flecha Yonta', desc: 'El trueno castiga en area: +25% Area de efecto.', apply: () => { player.areaBonus *= 1.25; } }
];
function showArcanaScreen() {
    const pool = ARCANA_POOL.filter(a => !(player.arcana || []).includes(a.id));
    const options = pool.slice().sort(() => 0.5 - Math.random()).slice(0, 3);
    const container = document.getElementById('arcana-options');
    container.innerHTML = '';
    if (!options.length) { // todo usado: resume sin otorgar
        gameState = 'PLAYING'; lastTime = performance.now(); return;
    }
    options.forEach(a => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="upgrade-icon">${ICONS.up}</div>
            <div class="upgrade-info">
                <h4>${a.name}</h4>
                <p>${a.desc}</p>
            </div>
        `;
        card.onclick = () => chooseArcana(a.id);
        container.appendChild(card);
    });
    gameState = 'ARCANA';
    document.getElementById('arcana-screen').style.display = 'flex';
}
function chooseArcana(id) {
    const a = ARCANA_POOL.find(x => x.id === id);
    if (!a) return;
    (player.arcana = player.arcana || []).push(id);
    a.apply();
    playSound('levelup');
    updateUI();
    document.getElementById('arcana-screen').style.display = 'none';
    // VS: lo pendiente (niveles/cofres en cola) encadena tras la Voluntad de D
    resumeAfterUpgrade();
}

function startGame() {
    initAudio();
    playSound('select');
    document.getElementById('start-screen').style.display = 'none';
    // Reinicia la musica de batalla en cada entrada a un nivel
    try { battleMusic.pause(); battleMusic.currentTime = 0; } catch (e) {}
    prefetchRun(selectedMap, selectedCharacter);
    resetGame();
    updateHudPortrait();
    applyRunCurse();
    // VS: el jugador elige 1 Arcana al empezar la partida
    showArcanaScreen();
    startLoop();
}

function showShop() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'flex';
    renderShop();
}
function closeShop() {
    document.getElementById('shop-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    updateMetaUI();
}
function renderShop() {
    const container = document.getElementById('shop-options');
    container.innerHTML = '';
    document.getElementById('shop-beli').innerText = fmtBeli(meta.beli);
    const open = META_UPGRADES.filter(metaUpgradeUnlocked).length;
    const ul = document.getElementById('shop-unlocked');
    if (ul) ul.innerText = 'DESBLOQUEADAS ' + open + '/' + META_UPGRADES.length;
    // VS: primero lo disponible y después lo bloqueado, con el logro que lo desbloquea
    const list = META_UPGRADES.filter(metaUpgradeUnlocked).concat(META_UPGRADES.filter(u => !metaUpgradeUnlocked(u)));
    list.forEach(u => {
        const lvl = meta.upgrades[u.id] || 0;
        const locked = !metaUpgradeUnlocked(u);
        const maxed = lvl >= u.max;
        const cost = metaUpgradeCost(u, lvl);
        const card = document.createElement('div');
        card.className = 'upgrade-card' + (locked ? ' shop-locked' : '');
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.gap = '10px';
        const ach = locked ? ACHIEVEMENTS.find(a => a.unlock === u.lock) : null;
        const desc = locked ? '🔒 <b>' + (ach ? ach.name : 'Bloqueada') + ':</b> ' + (ach ? ach.desc.replace(/ Desbloquea .*$/, '') : '') : u.desc;
        card.innerHTML = `
            <div class="upgrade-icon">${locked ? ICONS.unlock : (u.icon || ICONS.up)}</div>
            <div class="upgrade-info" style="flex:1;">
                <h4>${u.name}${locked ? '' : ' (Nv ' + lvl + '/' + u.max + ')'}</h4>
                <p>${desc}</p>
            </div>
            <div class="upgrade-buy" style="display:flex; flex-direction:column; align-items:center; gap:4px; min-width:90px;">
                <div style="font-family:'Bangers',sans-serif; font-size:16px; color:#b45309; letter-spacing:1px;">${locked ? '???' : (maxed ? 'MÁX' : cost.toLocaleString('en-US') + ' ฿')}</div>
                <button class="btn-buy" style="padding:6px 14px; font-size:13px; font-weight:700; border-radius:8px; border:2px solid #b45309; background:linear-gradient(135deg,#facc15,#b45309); color:#1a0f06; cursor:pointer; font-family:'Bangers',sans-serif; letter-spacing:1px;">${locked ? 'BLOQUEADA' : 'COMPRAR'}</button>
            </div>
        `;
        const btn = card.querySelector('.btn-buy');
        if (!locked && !maxed && meta.beli >= cost) {
            btn.onclick = (e) => { e.stopPropagation(); buyUpgrade(u.id); };
        } else {
            if (!locked) card.style.opacity = '0.5';
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
            btn.style.opacity = '0.5';
        }
        container.appendChild(card);
    });
    if (typeof renderGearShop === 'function') renderGearShop(container);
}
function buyUpgrade(id) {
    const u = META_UPGRADES.find(x => x.id === id);
    const lvl = meta.upgrades[id] || 0;
    if (lvl >= u.max || !metaUpgradeUnlocked(u)) return;
    const cost = metaUpgradeCost(u, lvl);
    if (meta.beli < cost) return;
    meta.beli -= cost;
    meta.upgrades[id] = lvl + 1;
    playSound('buy');
    saveMeta();
    renderShop();
    updateMetaUI();
    flashShopWallet();
}
function flashShopWallet() {
    const w = document.querySelector('.shop-wallet');
    if (!w) return;
    w.classList.remove('flash'); void w.offsetWidth; w.classList.add('flash');
}
function resetMeta() {
    if (!confirm('¿Resetear todas las mejoras permanentes? (No devuelve Berries)')) return;
    META_UPGRADES.forEach(u => meta.upgrades[u.id] = 0);
    saveMeta();
    renderShop();
    updateMetaUI();
}
// === LOGROS DE SEÑALAMIENTO ===
// VS: los logros premian con Beli y desbloquean personajes sin pagar la tienda.
// Se comprueban en tiempo real (killEnemy / evolveWeapon) y al terminar la partida.
const ACHIEVEMENTS = [
    { id: 'first_blood',  name: 'Primera Sangre',      desc: 'Derrota a tu primer enemigo.',                  check: s => s.kills >= 1,    reward: 40 },
    { id: 'evolve_one',   name: 'Arma Legendaria',     desc: 'Evoluciona cualquier arma por primera vez.',    check: s => s.evolves >= 1,  reward: 200 },
    { id: 'hunt_500',     name: 'Cazamarinos',         desc: 'Derrota 500 enemigos en total.',                check: s => s.kills >= 500,  reward: 400 },
    { id: 'elites_25',    name: 'Cabezas de Cartel',   desc: 'Derrota 25 élites con nombre propio.',          check: s => s.elites >= 25,  reward: 400 },
    { id: 'survive_10',   name: 'Hasta el Fondo del Mar', desc: 'Sobrevive los 8 minutos completos.',        check: s => Math.max(...Object.values(s.maxTime)) >= 480, reward: 600 },
    { id: 'gold_20k',     name: 'Sueño del Gold Roger', desc: 'Acumula 20,000 Berries en total.',                check: s => s.beliTotal >= 20000, reward: 800 },
    { id: 'win_luffy',    name: 'Hay Que Ser Leyenda', desc: 'Conquista una isla con Luffy, el Hombre-Goma.', check: s => s.winsByChar.luffy >= 1, reward: 800 },
    { id: 'win_zoro',     name: 'El Mejor Espadachín del Mundo', desc: 'Conquista una isla con Zoro.',        check: s => s.winsByChar.zoro >= 1, reward: 800 },
    { id: 'endless_15',   name: 'Mareas Infinitas',    desc: 'Navega el Modo Infinito hasta el minuto 15.',   check: s => Math.max(...Object.values(s.maxTime)) >= 900, reward: 1200 },
    { id: 'win_curse4',   name: 'Rey del Mar Peligroso', desc: 'Conquista una isla con el Clima Peligroso 4.', check: s => (s.winsByCurse[4] || 0) >= 1, reward: 2000 },
    { id: 'endless_30',   name: 'Leyenda del Grand Line', desc: 'Navega el Modo Infinito hasta el minuto 30.', check: s => Math.max(...Object.values(s.maxTime)) >= 1800, reward: 2000 },
    // === DESBLOQUEO DE LA TRIPULACIÓN (orden de desbloqueo = orden de las islas; lockText = cartel de la carta bloqueada) ===
    { id: 'unlock_zoro',    name: 'El Cazador de Piratas', desc: 'Conquista Shell Town derrotando al Capitán Morgan. Desbloquea a Zoro.', check: s => (meta.wins.shelltown || 0) >= 1, reward: 300, unlock: 'zoro', unlockText: 'ZORO', lockText: 'CONQUISTA SHELL TOWN' },
    { id: 'unlock_usopp',   name: 'El Valiente Guerrero del Mar', desc: 'Conquista Syrup derrotando al Capitán Kuro. Desbloquea a Usopp.', check: s => (meta.wins.syrup || 0) >= 1, reward: 400, unlock: 'usopp', unlockText: 'USOPP', lockText: 'CONQUISTA SYRUP' },
    { id: 'unlock_sanji',   name: 'El Cocinero del Baratie', desc: 'Conquista el Baratie derrotando a Don Krieg. Desbloquea a Sanji.', check: s => (meta.wins.baratie || 0) >= 1, reward: 500, unlock: 'sanji', unlockText: 'SANJI', lockText: 'CONQUISTA EL BARATIE' },
    { id: 'unlock_nami',    name: 'La Gata Ladrona',      desc: 'Conquista Arlong Park derrotando a Arlong. Desbloquea a Nami.', check: s => (meta.wins.arlongpark || 0) >= 1, reward: 400, unlock: 'nami', unlockText: 'NAMI', lockText: 'CONQUISTA ARLONG PARK' },
    { id: 'unlock_chopper', name: 'Doctor del Reino de Drum', desc: 'Conquista Drum derrotando a Wapol. Desbloquea a Chopper.', check: s => (meta.wins.drum || 0) >= 1, reward: 500, unlock: 'chopper', unlockText: 'CHOPPER', lockText: 'CONQUISTA DRUM' },
    { id: 'unlock_robin',   name: 'Miss All Sunday',      desc: 'Conquista Alabasta derrotando a Crocodile. Desbloquea a Robin.', check: s => (meta.wins.alabasta || 0) >= 1, reward: 600, unlock: 'robin', unlockText: 'ROBIN', lockText: 'CONQUISTA ALABASTA' },
    // === DESBLOQUEO DE ISLAS (orden de la historia; cada una más peligrosa que la anterior) ===
    { id: 'map_syrup',        name: 'El Hijo del Capitán',   desc: 'Derrota a Helmeppo en Shell Town. Desbloquea Syrup.', check: s => (s.killsByType.helmeppo || 0) >= 1, reward: 200, unlock: 'map_syrup', unlockText: 'ISLA: SYRUP', lockText: 'DERROTA A HELMEPPO' },
    { id: 'map_baratie',      name: 'Uno, Dos... ¡Jango!',   desc: 'Derrota a Buchi y a Jango en Syrup. Desbloquea el Baratie.', check: s => (s.killsByType.buchi || 0) >= 1 && (s.killsByType.jango || 0) >= 1, reward: 250, unlock: 'map_baratie', unlockText: 'ISLA: BARATIE', lockText: 'DERROTA A BUCHI Y JANGO' },
    { id: 'map_arlongpark',   name: 'Rumbo a Cocoyasi',      desc: 'Derrota a Gin y a Pearl en el Baratie. Desbloquea Arlong Park.', check: s => (s.killsByType.gin || 0) >= 1 && (s.killsByType.pearl || 0) >= 1, reward: 300, unlock: 'map_arlongpark', unlockText: 'ISLA: ARLONG PARK', lockText: 'DERROTA A GIN Y PEARL' },
    { id: 'map_drum',         name: 'Rumbo a la Grand Line', desc: 'Derrota a Kuroobi, Chew y Hatchan en Arlong Park. Desbloquea Drum.', check: s => ['kuroobi', 'chew', 'hachi'].every(t => (s.killsByType[t] || 0) >= 1), reward: 300, unlock: 'map_drum', unlockText: 'ISLA: DRUM', lockText: 'DERROTA A KUROOBI, CHEW Y HACHI' },
    { id: 'map_alabasta',     name: 'Los Cerezos de Hiluluk', desc: 'Derrota a Chess y a Kuromarimo en Drum. Desbloquea Alabasta.', check: s => (s.killsByType.chess || 0) >= 1 && (s.killsByType.kuromarimo || 0) >= 1, reward: 300, unlock: 'map_alabasta', unlockText: 'ISLA: ALABASTA', lockText: 'DERROTA A CHESS Y KUROMARIMO' },
    { id: 'map_skypiea',      name: 'Knock Up Stream',      desc: 'Alcanza el nivel 25 en una singladura. Desbloquea Skypiea.', check: s => (s.maxLevel || 0) >= 25, reward: 400, unlock: 'map_skypiea', unlockText: 'ISLA: SKYPIEA', lockText: 'ALCANZA EL NIVEL 25' },
    { id: 'map_water7',       name: 'El Capitán Usopp',     desc: 'Conquista una isla con Usopp. Desbloquea Water 7.', check: s => (s.winsByChar.usopp || 0) >= 1, reward: 500, unlock: 'map_water7', unlockText: 'ISLA: WATER 7', lockText: 'GANA CON USOPP' },
    { id: 'map_enieslobby',   name: '¡Quiero Vivir!',       desc: 'Conquista una isla con Robin. Desbloquea Enies Lobby.', check: s => (s.winsByChar.robin || 0) >= 1, reward: 600, unlock: 'map_enieslobby', unlockText: 'ISLA: ENIES LOBBY', lockText: 'GANA CON ROBIN' },
    { id: 'map_thrillerbark', name: 'Ejército de Zombis',   desc: 'Derrota 5.000 enemigos en total. Desbloquea Thriller Bark.', check: s => s.kills >= 5000, reward: 700, unlock: 'map_thrillerbark', unlockText: 'ISLA: THRILLER BARK', lockText: 'DERROTA 5.000 ENEMIGOS' },
    { id: 'map_marineford',   name: 'La Guerra de la Cumbre', desc: 'Conquista una isla con el Clima Peligroso 1 o más. Desbloquea Marineford.', check: s => [1, 2, 3, 4].some(c => (s.winsByCurse[c] || 0) >= 1), reward: 800, unlock: 'map_marineford', unlockText: 'ISLA: MARINEFORD', lockText: 'GANA EN CLIMA 1+' },
    { id: 'map_wholecake',    name: 'La Boda del Té',       desc: 'Conquista una isla con Sanji. Desbloquea Whole Cake.', check: s => (s.winsByChar.sanji || 0) >= 1, reward: 900, unlock: 'map_wholecake', unlockText: 'ISLA: WHOLE CAKE', lockText: 'GANA CON SANJI' },
    { id: 'map_wano',         name: 'El País de Wa',        desc: 'Conquista 8 islas distintas. Desbloquea Wano.', check: s => Object.values(meta.wins).filter(v => v > 0).length >= 8, reward: 1200, unlock: 'map_wano', unlockText: 'ISLA: WANO', lockText: 'CONQUISTA 8 ISLAS' },
    { id: 'win_skypiea',    name: 'No Hay Dios en el Cielo', desc: 'Conquista Skypiea. Desbloquea el Dial de Impacto.',  check: s => (meta.wins.skypiea || 0) >= 1, reward: 800, unlock: 'item_dial', unlockText: 'DIAL DE IMPACTO' },
    { id: 'win_thriller',   name: 'Recupera tu Sombra',   desc: 'Conquista Thriller Bark. Desbloquea la Bandera Pirata.', check: s => (meta.wins.thrillerbark || 0) >= 1, reward: 800, unlock: 'item_jolly', unlockText: 'BANDERA PIRATA' },
    { id: 'mode_haki',      name: 'Haki del Rey',         desc: 'Conquista 2 islas distintas. Desbloquea el Modo Haki.', check: s => Object.values(meta.wins).filter(v => v > 0).length >= 2, reward: 1000, unlock: 'mode_haki', unlockText: 'MODO HAKI' },
    { id: 'mode_inverso',   name: 'El Mundo al Revés',    desc: 'Conquista una isla con el Clima Peligroso 2 o más. Desbloquea el Modo Inverso.', check: s => [2, 3, 4].some(c => (s.winsByCurse[c] || 0) >= 1), reward: 1200, unlock: 'mode_inverso', unlockText: 'MODO INVERSO' },
    // VS: las PowerUps de la tienda se desbloquean con logros (META_SHOP_LOCKS en state.js)
    { id: 'shop_armor',    name: 'Tekkai',             desc: 'Sobrevive 3 minutos en cualquier isla. Desbloquea Armadura en la tienda.', check: s => Math.max(...Object.values(s.maxTime)) >= 180, reward: 100, unlock: 'shop_armor', unlockText: 'TIENDA: ARMADURA' },
    { id: 'shop_area',     name: 'Gomu Gomu no Gatling', desc: 'Derrota 300 enemigos en total. Desbloquea Área en la tienda.', check: s => s.kills >= 300, reward: 100, unlock: 'shop_area', unlockText: 'TIENDA: ÁREA' },
    { id: 'shop_cooldown', name: 'Sake de Binks',      desc: 'Alcanza el nivel 20 en una singladura. Desbloquea Cooldown en la tienda.', check: s => (s.maxLevel || 0) >= 20, reward: 150, unlock: 'shop_cooldown', unlockText: 'TIENDA: COOLDOWN' },
    { id: 'shop_luck',     name: 'Rey de los Francotiradores', desc: 'Derrota 10 élites en total. Desbloquea Crítico en la tienda.', check: s => s.elites >= 10, reward: 150, unlock: 'shop_luck', unlockText: 'TIENDA: CRÍTICO' },
    { id: 'shop_skip',     name: 'Soru',               desc: 'Evoluciona un arma. Desbloquea Saltos en la tienda.', check: s => s.evolves >= 1, reward: 150, unlock: 'shop_skip', unlockText: 'TIENDA: SALTOS' },
    { id: 'shop_growth',   name: 'Comer para Crecer',  desc: 'Alcanza el nivel 30 en una singladura. Desbloquea Crecimiento en la tienda.', check: s => (s.maxLevel || 0) >= 30, reward: 200, unlock: 'shop_growth', unlockText: 'TIENDA: CRECIMIENTO' },
    { id: 'shop_reroll',   name: 'Log Pose',           desc: 'Conquista cualquier isla. Desbloquea Rerolls en la tienda.', check: s => Object.values(meta.wins).some(v => v > 0), reward: 200, unlock: 'shop_reroll', unlockText: 'TIENDA: REROLLS' },
    { id: 'shop_banish',   name: 'Buster Call',        desc: 'Derrota 3.000 enemigos en total. Desbloquea Destierros en la tienda.', check: s => s.kills >= 3000, reward: 300, unlock: 'shop_banish', unlockText: 'TIENDA: DESTIERROS' },
    { id: 'shop_curse',    name: 'Nuevo Mundo',        desc: 'Conquista 3 islas distintas. Desbloquea Maldición en la tienda.', check: s => Object.values(meta.wins).filter(v => v > 0).length >= 3, reward: 400, unlock: 'shop_curse', unlockText: 'TIENDA: MALDICIÓN' },
    { id: 'shop_revival',  name: 'Yomi Yomi no Mi',    desc: 'Conquista Thriller Bark. Desbloquea Revivir en la tienda.', check: s => (meta.wins.thrillerbark || 0) >= 1, reward: 400, unlock: 'shop_revival', unlockText: 'TIENDA: REVIVIR' },
    { id: 'dual_shichibukai', name: 'Doble Ejecución', desc: 'Derrota a los 2 Shichibukai en una misma singladura.', check: s => s.moriaThis && s.kumaThis, reward: 1000 }
];
function mergeRunStats() {
    // VS: acumula las estadisticas de la run al terminar (evita saveMeta por kill)
    if (!window.runStats) return;
    const st = meta.stats;
    // VS: snapshot de la Ficha de Singladura (resumen estilo WANTED) — ANTES del merge
    const pool = window.UPGRADE_POOL_MAP || {};
    // fallback si todavia paso por ninguna pantalla de mejoras (nivel bajo)
    const FALLBACK_NAMES = { pistol:'Gomu Gomu no Pistol', gatling:'Gomu Gomu no Gatling', bazooka:'Gomu Gomu no Bazooka', gear2:'Gears', zoroform:'Haki del Rey', sanjiform:'Raid Suit', santoryu:'Santoryu', onigiri:'Oni Giri', flyingslash:'Flying Slash', diablejambe:'Diable Jambe', collier:'Collier', joueshot:'Joue Shot', muchi:'Gomu Gomu no Muchi', ono:'Gomu Gomu no Ono', tatsumaki:'Santoryu Ogi: Tatsumaki', poundho:'108 Pound Ho', concasse:'Concassé', partycourse:'Party Table Kick Course', cuchillo:'Cuchillo de Marina', granada:'Granada de Mano', rifle:'Rifle de la Marina', ballesta:'Ballesta', lanza:'Lanza de Abordaje', hacha:'Hacha Pirata', shuriken:'Shuriken', hakiPulse:'Pulso de Haoshoku', kabuto:'Kabuto de Usopp', climatact:'Clima-Tact de Nami', dial:'Dial de Impacto', roseo:'Kokutei Roseo Mirror', clutch:'Seis Fleur: Clutch', rumble:'Rumble Ball', jolly:'Bandera Pirata', power:'Busoshoku Haki', crit:'Gafas de Francotirador', cd:'Sake de Bink', armor:'Armadura de Haki', haki_buso:'Busoshoku Haki', haki_ken:'Kenbunshoku Haki', haki_hao:'Haoshoku Haki', area:'Área de Efecto', speed:'Velocidad', pickup:'Recogida', growth:'Crecimiento', luck:'Suerte', maxhp:'Vitalidad', regen:'Regeneración', evasion:'Esquiva', magnet:'Imán', greed:'Avaricia', vamp:'Vampirismo', ...CREW_NAMES };
    const charNames = { luffy: 'Luffy', zoro: 'Zoro', sanji: 'Sanji', nami: 'Nami', usopp: 'Usopp', chopper: 'Chopper', robin: 'Robin' };
    const mapNames = { shelltown: 'Shell Town', syrup: 'Syrup', drum: 'Drum', arlongpark: 'Arlong Park', baratie: 'Baratie', alabasta: 'Alabasta', skypiea: 'Skypiea', thrillerbark: 'Thriller Bark', enieslobby: 'Enies Lobby', marineford: 'Marineford', water7: 'Water 7', wholecake: 'Whole Cake', wano: 'Wano' };
    window.lastRun = {
        time: gameTime,
        endless: !!window.endlessMode,
        curse: runCurseRank,
        char: charNames[selectedCharacter] || selectedCharacter,
        map: mapNames[selectedMap] || selectedMap,
        level: player.level,
        kills: window.runStats.kills,
        beli: scoreBeli,
        weapons: Object.keys(skills).filter(k => skills[k].level > 0).map(k => {
            const sk = skills[k], p = pool[k] || {};
            const ev = EVOLUTIONS[k];
            return { title: p.title || FALLBACK_NAMES[k] || k, icon: p.icon || '', level: sk.level,
                evolved: !!sk.evolved, evoName: ev ? ev.name : '' };
        }),
        passives: Object.keys(player.passives || {}).filter(id => player.passives[id] > 0)
            .map(id => ({ title: (pool[id] || {}).title || FALLBACK_NAMES[id] || id, icon: (pool[id] || {}).icon || '', n: player.passives[id] }))
    };
    const st2 = meta.stats;
    st2.kills += window.runStats.kills;
    st2.elites += window.runStats.elites;
    st2.evolves += window.runStats.evolves;
    // en Infinito solo cuenta lo ganado desde la victoria (lo anterior ya se sumó)
    st2.beliTotal += scoreBeli - (window._beliStatsBanked || 0);
    window._beliStatsBanked = scoreBeli;
    st2.maxLevel = Math.max(st2.maxLevel || 0, player.level);
    for (const k in window.runStats.killsByType) st2.killsByType[k] = (st2.killsByType[k] || 0) + window.runStats.killsByType[k];
    // tiempo maximo por mapa
    if (gameTime > (st2.maxTime[selectedMap] || 0)) st2.maxTime[selectedMap] = gameTime;
    delete window.runStats;
}
// VS: Ficha de Singladura — resumen estilo WANTED con build final de la run
function renderRunSummary(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const r = window.lastRun;
    if (!r || !r.weapons) { el.innerHTML = ''; return; }
    const curseLbl = r.curse === 0 ? 'MAR EN CALMA' : 'CLIMA PELIGROSO ' + r.curse;
    let html = '<div class="wanted-board" style="max-width:640px; padding:16px 20px; max-height:44vh; overflow-y:auto;">';
    html += '<div class="wanted-title" style="font-size:26px; letter-spacing:6px !important;">FICHA DE SINGLADURA</div>';
    html += '<div class="wanted-subtitle" style="margin:8px 0;">' + (r.endless ? 'MODO INFINITO · ' : '') + r.char + ' · RÉCORD DE ' + r.map.toUpperCase() + '</div>';
    // fila de cifras (Bangers, tinta marron)
    html += '<div style="display:flex; justify-content:center; gap:26px; flex-wrap:wrap; font-family:Bangers,sans-serif; letter-spacing:2px; color:#241508; font-size:18px; margin:10px 0;">';
    html += '<span>MINUTOS ' + formatTime(r.time) + '</span><span>NIVEL ' + r.level + '</span><span>' + r.kills + ' DERROTADOS</span><span style="color:#7a4a1e;">฿' + fmtBeli(r.beli) + '</span><span>' + curseLbl + '</span></div>';
    // armas
    html += '<h3 style="text-align:center; margin:6px 0 4px;">ARMAS DE LA SINGLADURA</h3>';
    html += '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:8px;">';
    for (const w of r.weapons) {
        html += '<div class="upgrade-card" style="display:flex; align-items:center; gap:8px; padding:6px 10px; text-align:left;">';
        html += '<div class="upgrade-icon" style="font-size:20px;">' + (w.icon || '') + '</div>';
        html += '<div style="font-size:14px; line-height:1.15; color:#241508;">' + w.title;
        if (w.evolved) html += '<br><span style="color:#b45309; font-size:12px;">◆ ' + (w.evoName || 'EVOLUCIONADA') + ' ✔</span>';
        else html += '<br><span style="font-size:12px; color:#5c3a21;">NV ' + w.level + '</span>';
        html += '</div></div>';
    }
    html += '</div>';
    // pasivas (chips compactos)
    if (r.passives.length) {
        html += '<h3 style="text-align:center; margin:10px 0 4px;">HAKIS Y PASIVAS</h3>';
        html += '<div style="display:flex; justify-content:center; gap:6px; flex-wrap:wrap;">';
        for (const p of r.passives) {
            html += '<div class="upgrade-card" style="display:inline-flex; align-items:center; gap:5px; padding:4px 9px; font-size:13px; color:#241508;">'
                + (p.icon || '') + ' ' + p.title + (p.n > 1 ? ' <b style="color:#7a4a1e;">×' + p.n + '</b>' : '') + '</div>';
        }
        html += '</div>';
    }
    html += '</div>';
    el.innerHTML = html;
}
function checkAchievements() {
    // permite que first_blood / evolve_one etc. se sellen EN la partida (como en VS)
    const st = meta.stats;
    const rs = window.runStats || null;
    const view = { ...st,
        kills: st.kills + (rs ? rs.kills : 0),
        elites: st.elites + (rs ? rs.elites : 0),
        evolves: st.evolves + (rs ? rs.evolves : 0),
        killsByType: rs ? Object.keys(rs.killsByType).reduce((o, k) => (o[k] = (o[k] || 0) + rs.killsByType[k], o), { ...st.killsByType }) : st.killsByType,
        // Doble Ejecucion: SOLO la singlatura actual (no sobrevive al merge)
        moriaThis: !!(rs && rs.moriaThis),
        kumaThis: !!(rs && rs.kumaThis),
        maxLevel: Math.max(st.maxLevel || 0, rs && typeof player !== 'undefined' ? player.level : 0) };
    for (const a of ACHIEVEMENTS) {
        if (meta.achievements[a.id]) continue;
        let ok = false;
        try { ok = a.check(view); } catch (e) {}
        if (ok) {
            meta.achievements[a.id] = true;
            meta.beli += a.reward;
            if (a.unlock) meta.unlocked[a.unlock] = true;
            if (a.gear) gearOnAchievement(a);
            saveMeta();
            showAchToast('◉ LOGRO: ' + a.name + '  —  +' + a.reward + ' Berries' + (a.unlock ? '  ◉ Desbloqueado: ' + (a.unlockText || a.unlock.toUpperCase()) : '') + (a.gear ? '  ◉ ' + (a.gearText || 'GEAR ' + a.gear) + ' DESBLOQUEADO' : ''));
        }
    }
}
function initRunStats() {
    window.runStats = { kills: 0, elites: 0, evolves: 0, killsByType: {} };
}
initRunStats();
function showAchToast(text) {
    const t = document.getElementById('ach-toast');
    if (!t) return;
    playSound('achievement');
    t.innerText = text;
    t.style.display = 'block';
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; setTimeout(() => { t.style.display = 'none'; }, 600); }, 3800);
}
function showAchievements() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('achievements-screen').style.display = 'flex';
    renderAchievements();
}
function closeAchievements() {
    document.getElementById('achievements-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    updateMetaUI();
}
function renderAchievements() {
    const list = document.getElementById('ach-list');
    if (!list) return;
    list.innerHTML = '';
    const done = ACHIEVEMENTS.filter(a => meta.achievements[a.id]).length;
    document.getElementById('ach-subtitle').innerText = 'SELLADOS POR LA ARMADA: ' + done + '/' + ACHIEVEMENTS.length;
    ACHIEVEMENTS.forEach(a => {
        const got = meta.achievements[a.id];
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.style.opacity = got ? '1' : '0.55';
        card.innerHTML = `
            <div class="upgrade-icon">${got ? '◉' : '○'}</div>
            <div class="upgrade-info">
                <h4>${a.name}${got ? ' — ¡SELLADO!' : ''}</h4>
                <p>${a.desc} · Recompensa: ${a.reward} Berries${a.unlock ? ' · Desbloquea: ' + (a.unlockText || a.unlock.toUpperCase()) : ''}</p>
            </div>
        `;
        list.appendChild(card);
    });
}
// === REGISTRO MARINO (bestiary) ===
const BESTIARY_INFO = {
    krieg_starved: 'Pirata Hambriento de Krieg — cien días a la deriva',
    krieg_knife: 'Malabarista de Krieg — cuchillos al vuelo',
    marine_sword: 'Cabo de la Marina — sable reglamentario',
    jango: 'Jango — Uno, dos... ¡Jango!',
    fullbody: 'Fullbody, Puño de Hierro — teniente de la Marina',
    tashigi: 'Tashigi — espadachina de la G-5',
    tama: 'Tama de Satori — bola de nube sorpresa',
    sky_shark: 'Tiburón del Cielo — Mar Blanco',
    negative_hollow: 'Negative Hollow — "Soy basura..."',
    grunt: 'Pirata Raso — hombre sin recompensa',
    shooter: 'Fusilero de la Armada',
    pacifista: 'Pacifista — arma secreta del Gobierno',
    morgan: 'Capitán Morgan, el Pez-Hacha',
    kuma: 'B. Kuma — bestia sierva',
    moria: 'Gekko Moria — Shichibukai',
    tararan: 'Tararan — la araña bestia',
    hogback: 'Dr. Hogback — el cirujano',
    cindry: 'Cindry — la sirvienta del plato',
    pellona: 'Perona — la fantasma negativa',
    ryuma: 'Ryuma — el samurái de Wano',
    inupen: 'Inuppen — el zombi perruno',
    kumashi: 'Kumashi — el guardián gritón',
    absalom: 'Absalom — el invisible',
    boss_krieg: 'Don Krieg — la flota pirata',
    boss_morgan: 'Capitán Morgan — el Pez-Hacha', helmeppo: 'Helmeppo — el hijo de Morgan', ripper: 'Teniente Ripper — base 153',
    boss_kuro: 'Capitán Kuro — las Cien Maniobras', buchi: 'Buchi — Hermanos Nyaban', sham: 'Sham — Hermanos Nyaban',
    boss_wapol: 'Wapol — el rey hojalata', chess: 'Chess — ministro de Wapol', kuromarimo: 'Kuromarimo — el del afro', lapahn: 'Lapahn — conejo de las nieves', lapahn_big: 'Lapahn adulto',
    boss_arlong: 'Arlong — el Pez-Sierra', kuroobi: 'Kuroobi — Gyojin Karate', chew: 'Chew — el pez arquero', hachi: 'Hatchan — Rokutoryu',
    merman: 'Hombre-pez de Arlong', merman_b: 'Hombre-pez de Arlong — embestida', fat_merman: 'Hombre-pez gigante de Arlong',
    boss_crocodile: 'Sir Crocodile — la arena del desierto',
    boss_enel: 'Enel — el dios del trueno',
    krieg_pirate: 'Pirata de Krieg — espada', krieg_gunner: 'Pirata de Krieg — pistola', krieg_bomber: 'Pirata de Krieg — bombas',
    pearl: 'Pearl — el muro de hierro', gin: 'Gin — el demonio de Krieg',
    dugong: 'Dugongo kung-fu del desierto', mr2: 'Mr. 2 Bon Clay — okama kenpo', mr1: 'Mr. 1 Daz Bones — cuerpo de acero',
    shandia: 'Guerrero shandia', shandia_gunner: 'Bazuquero shandia', wiper: 'Wiper — el guerrero de Shandora', ohm: 'Ohm — el sacerdote del infierno'
};
function bestiaryName(type) {
    if (BESTIARY_INFO[type]) return BESTIARY_INFO[type];
    if (ELITE_INFO[type] && ELITE_INFO[type].name) return eliteName(type);
    if (MINIBOSS_INFO[type]) return MINIBOSS_INFO[type];
    if (BOSS_INFO[type]) return BOSS_INFO[type];
    return type;
}
// miniaturas del bestiario a partir de los sprites idle ya cargados (cache dataURL)
const BESTIARY_THUMB = {};
function bestiaryThumb(type) {
    if (BESTIARY_THUMB[type]) return BESTIARY_THUMB[type];
    const cfg = ENEMY_IMG[type];
    const img = (cfg && cfg.idle && cfg.idle[0]) ? cfg.idle[0] : null;
    if (!img) return null;
    // sprites de archivo: se usa la ruta directamente (se carga al abrir el bestiario, sin esperar ni copiar a dataURL)
    if (img instanceof HTMLImageElement) return (BESTIARY_THUMB[type] = img.getAttribute('src'));
    if (!img.width) return null;
    try {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        return (BESTIARY_THUMB[type] = c.toDataURL());
    } catch (e) { return null; }
}
function showBestiary() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('bestiary-screen').style.display = 'flex';
    renderBestiary();
}
function closeBestiary() {
    document.getElementById('bestiary-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    updateMetaUI();
}
function renderBestiary() {
    const grid = document.getElementById('bestiary-list');
    if (!grid) return;
    grid.innerHTML = '';
    const types = Object.keys(ENEMY_ANIMS).filter(t => !PROP_TYPES.includes(t)); // sin barriles ni faroles
    let found = 0;
    const st = meta.stats.killsByType;
    types.forEach(type => {
        const seen = (st[type] || 0) > 0;
        if (seen) found++;
        const card = document.createElement('div');
        card.style.cssText = 'background:#faedcd;border:2px solid #8b5e3c;border-radius:8px;padding:8px;text-align:center;color:#3d2314;';
        const thumb = seen ? bestiaryThumb(type) : null;
        card.innerHTML = `
            <div style="height:48px; display:flex; align-items:center; justify-content:center;">
                ${thumb ? `<img src="${thumb}" style="image-rendering:pixelated; max-height:44px; max-width:56px; filter:none;">` : '<span style="font-size:26px; opacity:0.35;">?</span>'}
            </div>
            <div style="font-weight:800; font-size:11px; font-family:Bangers,Verdana,sans-serif; letter-spacing:0.5px; margin-top:4px; line-height:1.15; min-height:26px;">${seen ? bestiaryName(type) : '???'}</div>
            <div style="font-size:10px; font-family:Segoe UI,Verdana,sans-serif; opacity:0.8;">${seen ? '×' + st[type] + ' derrotados' : 'sin avistar'}</div>
        `;
        grid.appendChild(card);
    });
    document.getElementById('bestiary-subtitle').innerText = 'AVISTADOS: ' + found + '/' + types.length + ' — GRAND LINE';
}
