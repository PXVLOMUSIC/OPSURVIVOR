// === OPCIONES (persistente, VS-style sliders) ===
let windowOpts = { music: 0.8, sfx: 0.8, shake: true, fewerParticles: false, fewerFlashes: false, showDamageNumbers: true, autoPause: true, menuMusicMuted: false, master: 0.8, quality: 'auto' };
function loadOpts() {
    try {
        const raw = JSON.parse(localStorage.getItem('op_survivor_opts'));
        if (raw) windowOpts = { ...windowOpts, ...raw };
    } catch (e) {}
}
function saveOpts() {
    try { localStorage.setItem('op_survivor_opts', JSON.stringify(windowOpts)); } catch (e) {}
    applyOpts();
}
function applyOpts() {
    const sliderMa = document.getElementById('opt-master'), sliderM = document.getElementById('opt-music'), sliderS = document.getElementById('opt-sfx');
    const checkSh = document.getElementById('opt-shake'), checkP = document.getElementById('opt-particles');
    const checkF = document.getElementById('opt-flashes'), checkD = document.getElementById('opt-dmgnums'), checkA = document.getElementById('opt-autopause');
    if (sliderMa) { sliderMa.value = Math.round((windowOpts.master || 0.8) * 100); const v = document.getElementById('opt-master-val'); if (v) v.innerText = Math.round((windowOpts.master || 0.8) * 100); }
    if (sliderM) { sliderM.value = Math.round(windowOpts.music * 100); document.getElementById('opt-music-val').innerText = Math.round(windowOpts.music * 100); }
    if (sliderS) { sliderS.value = Math.round(windowOpts.sfx * 100); document.getElementById('opt-sfx-val').innerText = Math.round(windowOpts.sfx * 100); }
    if (checkSh) checkSh.checked = windowOpts.shake;
    if (checkP) checkP.checked = windowOpts.fewerParticles;
    const selQ = document.getElementById('opt-quality');
    if (selQ) selQ.value = windowOpts.quality || 'auto';
    if (typeof applyQuality === 'function') applyQuality();
    if (checkF) checkF.checked = windowOpts.fewerFlashes;
    if (checkD) checkD.checked = windowOpts.showDamageNumbers;
    if (checkA) checkA.checked = windowOpts.autoPause;
    if (typeof syncVolLabels === 'function') syncVolLabels();
    masterVolume = (typeof windowOpts.master === 'number') ? windowOpts.master : 0.8;
    if (typeof windowOpts.master !== 'number') windowOpts.master = masterVolume;
}
function showOptions() { applyOpts(); document.getElementById('options-screen').style.display = 'flex'; }
function closeOptions() {
    const sliderMa = document.getElementById('opt-master'), sliderM = document.getElementById('opt-music'), sliderS = document.getElementById('opt-sfx');
    const checkSh = document.getElementById('opt-shake'), checkP = document.getElementById('opt-particles');
    if (sliderMa) windowOpts.master = sliderMa.value / 100;
    if (sliderM) windowOpts.music = sliderM.value / 100;
    if (sliderS) windowOpts.sfx = sliderS.value / 100;
    if (checkSh) windowOpts.shake = checkSh.checked;
    if (checkP) windowOpts.fewerParticles = checkP.checked;
    const selQ = document.getElementById('opt-quality');
    if (selQ) windowOpts.quality = selQ.value;
    const checkF = document.getElementById('opt-flashes'), checkD = document.getElementById('opt-dmgnums'), checkA = document.getElementById('opt-autopause');
    if (checkF) windowOpts.fewerFlashes = checkF.checked;
    if (checkD) windowOpts.showDamageNumbers = checkD.checked;
    if (checkA) windowOpts.autoPause = checkA.checked;
    document.body.classList.toggle('opt-calm', !!windowOpts.fewerFlashes);
    saveOpts();
    updateMusic();
    document.getElementById('options-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    updateMetaUI();
}
function updateMetaUI() {
    const el = document.getElementById('meta-beli');
    if (el) el.innerText = fmtBeli(meta.beli);
    if (typeof refreshCharCards === 'function') refreshCharCards();
    if (typeof refreshModeButtons === 'function') refreshModeButtons();
    // marca los mapas bloqueados
    // y su peligro: una calavera más por isla, de verde (Baratie) a rojo (Wano), con la vida enemiga en el título
    document.querySelectorAll('#map-select .map-btn').forEach(b => {
        const id = b.dataset.map, locked = mapLocked(id), d = mapDanger(id);
        b.classList.toggle('locked', locked);
        let tier = b.querySelector('.map-tier');
        if (!tier) {
            tier = document.createElement('span');
            tier.className = 'map-tier';
            tier.innerHTML = (ICONS.skull || '☠') + '<b></b>';
            b.appendChild(tier);
        }
        tier.querySelector('b').textContent = d.tier;
        tier.style.setProperty('--hue', Math.round(120 - 120 * (d.tier - 1) / Math.max(1, d.total - 1)));
        let lock = b.querySelector('.map-lock');
        if (locked && !lock) { lock = document.createElement('small'); lock.className = 'map-lock'; b.appendChild(lock); }
        if (lock) { if (locked) lock.textContent = lockText('map_' + id); else lock.remove(); }
        const a = unlockAchievement('map_' + id);
        b.title = 'Peligro ' + d.tier + '/' + d.total + ' · vida enemiga x' + d.hp.toFixed(2) + (locked && a ? ' · BLOQUEADA: ' + a.desc : '');
    });
    // marcas de Clima Peligroso bloqueado (se desbloquea venciendo el rango anterior)
    document.querySelectorAll('#curse-select .curse-btn').forEach(b => {
        const n = parseInt(b.dataset.curse, 10);
        const locked = n > meta.curseUnlocked;
        b.classList.toggle('locked', locked);
        b.title = locked ? 'Vence el Clima ' + (n - 1) + ' para desbloquear' : 'Clima ' + n + ': +' + (n * 25) + '% Berries y peligro';
        if (locked && runCurseRank === n) { runCurseRank = 0; document.querySelectorAll('#curse-select .curse-btn').forEach(bb => bb.classList.toggle('selected', bb.dataset.curse === '0')); }
    });
}
function restartGame() {
    try { battleMusic.pause(); battleMusic.currentTime = 0; } catch (e) {}
    resetGame();
    applyRunCurse();
    showArcanaScreen(); // VS: 1 Voluntad de D al empezar cada partida
    startLoop();
}

var soundEnabled = true;
// sliders de opciones independiente: masterVolume es el volumen global heredado
var masterVolume = 0.8;
function setVolume(v) { masterVolume = Math.max(0, Math.min(1, v / 100)); updateMusic(); }
function setVolMaster(v) { windowOpts.master = Math.max(0, Math.min(1, v / 100)); masterVolume = windowOpts.master; saveOpts(); updateMusic(); const a=document.getElementById('opt-master'), b=document.getElementById('vol-master'); if(a) a.value=v; if(b) b.value=v; syncVolLabels(); }
function setVolMusic(v) { windowOpts.music = Math.max(0, Math.min(1, v / 100)); saveOpts(); updateMusic(); const a=document.getElementById('opt-music'), b=document.getElementById('vol-music'); if(a) a.value=v; if(b) b.value=v; syncVolLabels(); }
function setVolSfx(v) { windowOpts.sfx = Math.max(0, Math.min(1, v / 100)); saveOpts(); const a=document.getElementById('opt-sfx'), b=document.getElementById('vol-sfx'); if(a) a.value=v; if(b) b.value=v; syncVolLabels(); }
// Números junto a los deslizadores (Opciones y Pausa) y relleno dorado de la pista hasta el valor
function syncVolLabels() {
    const vals = { master: windowOpts.master, music: windowOpts.music, sfx: windowOpts.sfx };
    for (const k in vals) {
        const n = Math.round((typeof vals[k] === 'number' ? vals[k] : 0.8) * 100);
        ['opt-' + k, 'vol-' + k].forEach(id => {
            const r = document.getElementById(id); if (r) { r.value = n; r.style.setProperty('--fill', n + '%'); }
            const l = document.getElementById(id + '-val'); if (l) l.textContent = n;
        });
    }
}
function togglePause() {
    if (gameState !== 'PLAYING') return;
    gameState = 'PAUSED';
    document.getElementById('pause-screen').style.display = 'flex';
    renderPauseWeapons();
    // sync volume sliders
    const vm = document.getElementById('vol-master'), vmu = document.getElementById('vol-music'), vs = document.getElementById('vol-sfx');
    if (vm) vm.value = Math.round((windowOpts.master || 0.8) * 100);
    if (vmu) vmu.value = Math.round((windowOpts.music || 0.8) * 100);
    if (vs) vs.value = Math.round((windowOpts.sfx || 0.8) * 100);
    syncVolLabels();
}
// VS: auto-pausa al cambiar de pestaña/minimizar — nadie muere por cambiar de ventana
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState === 'PLAYING' && windowOpts && windowOpts.autoPause !== false) togglePause();
});
// Pausa: bitácora de la partida. Armas y objetos como fichas (mismo estilo que el HUD) y todas las
// estadísticas del jugador con su icono, como en VS.
const PAUSE_WEAPONS = ['pistol','gatling','bazooka','gear2','muchi','ono','santoryu','onigiri','flyingslash','tatsumaki','poundho','diablejambe','collier','joueshot','concasse','partycourse','kabuto','climatact','roseo','clutch','zoroform','sanjiform','cuchillo','granada','rifle','ballesta','lanza','hacha','shuriken','hakiPulse','dial'];
const PAUSE_NAMES = {
    pistol: 'Pistol', gatling: 'Gatling', bazooka: 'Bazooka', gear2: 'Gears', muchi: 'Muchi', ono: 'Ono',
    santoryu: 'Santoryu', onigiri: 'Oni Giri', flyingslash: 'Flying Slash', tatsumaki: 'Tatsumaki', poundho: '108 Pound Ho',
    diablejambe: 'Diable Jambe', collier: 'Collier', joueshot: 'Joue Shot', concasse: 'Concassé', partycourse: 'Party Table',
    kabuto: 'Kabuto', climatact: 'Clima-Tact', roseo: 'Roseo Mirror', clutch: 'Clutch', zoroform: 'Haki del Rey', sanjiform: 'Raid Suit',
    cuchillo: 'Cuchillo', granada: 'Granada', rifle: 'Rifle', ballesta: 'Ballesta', lanza: 'Lanza', hacha: 'Hacha', shuriken: 'Shuriken',
    hakiPulse: 'Haoshoku', dial: 'Dial',
    power: 'Poder', crit: 'Crítico', cd: 'Recarga', armor: 'Armadura', haki_buso: 'Busoshoku', haki_ken: 'Kenbunshoku', haki_hao: 'Haoshoku',
    area: 'Área', speed: 'Velocidad', pickup: 'Recogida', growth: 'Crecimiento', luck: 'Suerte', maxhp: 'Vitalidad', regen: 'Regeneración',
    evasion: 'Esquiva', magnet: 'Imán', greed: 'Avaricia', vamp: 'Vampirismo', rumble: 'Rumble Ball', jolly: 'Bandera Pirata'
};
const PAUSE_PASSIVE_ICO = { maxhp: 'heart', regen: 'meat', evasion: 'dodge', magnet: 'pickup', greed: 'coin', vamp: 'drop' };
function pauseSlot(id, lvl, evo, owner, kind) {
    const div = document.createElement('div');
    div.className = 'pz-slot' + (evo ? ' evo' : '');
    div.dataset.char = owner;
    div.dataset.kind = kind;
    const sk = skills[id];
    const name = evo && sk && sk.evolvedName ? sk.evolvedName : (PAUSE_NAMES[id] || (typeof CREW_SHORT !== 'undefined' && CREW_SHORT[id]) || id);
    div.title = name;
    div.innerHTML = `<div class="pz-ico">${ICONS[PAUSE_PASSIVE_ICO[id] || id] || ICONS.up}</div><div class="pz-name"></div><div class="pz-lv">${evo ? 'EVO' : 'Nv ' + lvl}</div>`;
    div.querySelector('.pz-name').textContent = name;
    return div;
}
function renderPauseWeapons() {
    const wEl = document.getElementById('pause-weapons');
    const pEl = document.getElementById('pause-passives');
    const sEl = document.getElementById('pause-stats');
    if (!wEl || !pEl) return;
    wEl.innerHTML = ''; pEl.innerHTML = '';
    let nw = 0, np = 0;
    PAUSE_WEAPONS.concat(CREW_WEAPON_IDS).forEach(id => { // + kits de la tripulación (js/crew.js)
        const sk = skills[id];
        if (!sk || sk.level <= 0) return;
        const owner = Object.keys(CHAR_SKILLS).find(c => CHAR_SKILLS[c].includes(id)) || 'all';
        wEl.appendChild(pauseSlot(id, sk.level, sk.evolved, owner, 'weapon')); nw++;
    });
    Object.keys(player.passives || {}).forEach(id => {
        const lv = player.passives[id];
        if (!lv) return;
        pEl.appendChild(pauseSlot(id, lv, false, 'all', 'passive')); np++;
    });
    if (!nw) wEl.innerHTML = '<p class="pz-empty">Sin armas</p>';
    if (!np) pEl.innerHTML = '<p class="pz-empty">Aún no has recogido objetos</p>';
    const setT = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setT('pz-wcount', nw); setT('pz-pcount', np);
    // cabecera: personaje, isla, tiempo, nivel y botín
    const ch = (typeof CHAR_ANIMS !== 'undefined' && CHAR_ANIMS[selectedCharacter]) ? CHAR_ANIMS[selectedCharacter].name : selectedCharacter;
    setT('pz-char', ch);
    const mb = document.querySelector(`#map-select .map-btn[data-map="${selectedMap}"]`);
    setT('pz-map', mb ? mb.textContent.trim() : selectedMap);
    setT('pz-time', formatTime(gameTime));
    setT('pz-level', player.level);
    setT('pz-beli', fmtBeli(scoreBeli));
    const ico = document.querySelector('#pause-screen .pz-chip [data-ico="ship"]');
    if (ico && mb) { const m = mb.querySelector('[data-ico]'); if (m) ico.innerHTML = ICONS[m.getAttribute('data-ico')] || ''; }
    if (!sEl) return;
    // estadísticas al estilo VS: icono, nombre y valor (en dorado lo que sube respecto a la base)
    const pct = v => Math.round(v * 100);
    const sign = v => (v > 0 ? '+' : '') + v + '%';
    const base = BALANCE.playerSpeed;
    const rows = [
        ['heart', 'Vida máx.', Math.round(player.maxHp), player.maxHp > 100],
        ['meat', 'Regeneración', (player.regenRate || 0).toFixed(1).replace('.', ',') + '/s', (player.regenRate || 0) > 0],
        ['armor', 'Armadura', (player.armor || 0) + '%', player.armor > 0],
        ['dodge', 'Esquiva', pct(player.evasion || 0) + '%', (player.evasion || 0) > 0],
        ['speed', 'Velocidad', sign(Math.round((player.speed / base - 1) * 100)), player.speed > base],
        ['power', 'Poder', sign(player.powerPct || 0), player.powerPct > 0],
        ['area', 'Área', sign(Math.round((player.areaBonus - 1) * 100)), player.areaBonus > 1],
        ['cd', 'Recarga', '-' + (player.cdReduction || 0) + '%', player.cdReduction > 0],
        ['crit', 'Crítico', pct(player.critChance) + '%', player.critChance > 0.05],
        ['pickup', 'Recogida', sign(Math.round((player.pickupBonus - 1) * 100)), player.pickupBonus > 1],
        ['luck', 'Suerte', sign(Math.round((player.luckBonus - 1) * 100)), player.luckBonus > 1],
        ['growth', 'Crecimiento', sign(Math.round((player.growthBonus - 1) * 100)), player.growthBonus > 1],
        ['coin', 'Avaricia', sign(Math.round((player.greedBonus - 1) * 100)), player.greedBonus > 1],
        ['drop', 'Vampirismo', pct(player.vampirism || 0) + '%', (player.vampirism || 0) > 0],
        ['skull', 'Maldición', sign(Math.round((player.curse - 1) * 100)), player.curse > 1]
    ];
    sEl.innerHTML = rows.map(([ic, n, v, up]) => `<div class="pz-stat${up ? ' up' : ''}"><span class="op-ic">${ICONS[ic] || ''}</span><span class="pz-sn">${n}</span><b>${v}</b></div>`).join('');
}
function resumeGame() {
    if (gameState !== 'PAUSED') return;
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('controls-screen').style.display = 'none';
    gameState = 'PLAYING';
    saveOpts();
    lastTime = performance.now();
}
function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('sound-icon').innerHTML = soundEnabled ? ICONS.sound : ICONS.muted;
    document.getElementById('sound-label').innerText = soundEnabled ? 'Activado' : 'Desactivado';
    // mute by overriding playSound
    window.soundMuted = !soundEnabled;
}
// wrap playSound to respect mute
const _origPlaySound = playSound;
playSound = function(type) {
    if (window.soundMuted) return;
    _origPlaySound(type);
};
// Pantalla completa con prefijo de Safari. En iPhone no existe para páginas: allí se juega instalada
// en la pantalla de inicio (Compartir > Añadir a pantalla de inicio) y la opción se oculta.
function fullscreenSupported() {
    const d = document.documentElement;
    return !!(d.requestFullscreen || d.webkitRequestFullscreen);
}
function toggleFullscreen() {
    const d = document.documentElement;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    try {
        if (!fsEl) {
            const r = d.requestFullscreen ? d.requestFullscreen() : (d.webkitRequestFullscreen && d.webkitRequestFullscreen());
            if (r && r.catch) r.catch(() => {});
        } else {
            const r = document.exitFullscreen ? document.exitFullscreen() : (document.webkitExitFullscreen && document.webkitExitFullscreen());
            if (r && r.catch) r.catch(() => {});
        }
    } catch (e) {}
}
(function () { const c = document.getElementById('fs-card'); if (c && !fullscreenSupported()) c.style.display = 'none'; })();
function showControls() {
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('controls-screen').style.display = 'flex';
}
function backToMenu() {
    hideRunScreens();
    clearInput();
    const cv = document.getElementById('gameCanvas'); if (cv) cv.classList.remove('inverse-world'); // el Modo Inverso no se queda en el menú
    gameState = 'START';
    document.getElementById('start-screen').style.display = 'flex';
    updateMusic();
}

// Copia de los valores iniciales de cada habilidad: las mejoras y evoluciones cambian
// rango, radio y cooldown, y antes esos cambios se arrastraban a la siguiente partida.
const SKILL_DEFAULTS = JSON.parse(JSON.stringify(skills));
// Lo mismo con el jugador: los efectos se guardan como campos sueltos (p. ej. _slowUntil de la
// ralentización de Jango o Perona, medido con el reloj de la partida). Al volver gameTime a 0, un
// efecto de la partida anterior seguía activo hasta alcanzar ese minuto. Se borra todo lo añadido.
const PLAYER_DEFAULTS = JSON.parse(JSON.stringify(player));
function resetObject(obj, defaults) {
    for (const k of Object.keys(obj)) if (!(k in defaults)) delete obj[k];
    Object.assign(obj, JSON.parse(JSON.stringify(defaults)));
}
// Pantallas de partida que no deben seguir abiertas al empezar otra o al volver al menú
function hideRunScreens() {
    ['pause-screen', 'controls-screen', 'gameover-screen', 'victory-screen', 'upgrade-screen', 'arcana-screen', 'chest-screen'].forEach(id => {
        const el = document.getElementById(id); if (el) el.style.display = 'none';
    });
    if (window._chestAnim) { clearInterval(window._chestAnim); window._chestAnim = null; }
}
// Entradas: una tecla o un dedo que seguían pulsados al morir no deben mover al siguiente personaje
function clearInput() {
    for (const k in keys) keys[k] = false;
    joystick.active = false; joystick.dx = 0; joystick.dy = 0; joystick.touchId = null;
    if (joystickZone) joystickZone.style.display = 'none';
    if (joystickKnob) joystickKnob.style.transform = 'translate(0px, 0px)';
}
function resetGame() {
    resetObject(player, PLAYER_DEFAULTS);
    for (const k in SKILL_DEFAULTS) resetObject(skills[k], SKILL_DEFAULTS[k]);
    hideRunScreens();
    clearInput();
    cameraShake = 0;
    groundDecals = [];
    if (typeof enemyGrid !== 'undefined' && enemyGrid.clear) enemyGrid.clear();
    upgradeIsChest = false; _banishing = false;
    window._hollowTxt = 0; window._gearFlash = 0; window._propTimer = 0; window._applyOnly = false;
    window._beliBanked = 0; window._beliStatsBanked = 0;
    player.x = 0; player.y = 0;
    player.hp = 100; player.maxHp = 100;
    player.walkFrame = 0; player.isMoving = false;
    player.animState = 'idle'; player.animIndex = 0; player.attackTimer = 0; player.hitTimer = 0; player._hurtFlash = 0; player._hurtShakeCd = 0;
    player.level = 1; player.xp = 0; player.nextXp = 6;
    player.powerPct = 0; player.critChance = 0.05; player.cdReduction = 0; player.areaBonus = 1.0; player.armor = 0; player.speed = BALANCE.playerSpeed; player.pickupBonus = 1; player.growthBonus = 1; player.greedBonus = 1; player.luckBonus = 1; player.curse = 1; player.regenRate = 0; player.evasion = 0; player.vampirism = 0; player.durationBonus = 1;
    player.passives = {};
    player.revives = 0; // antes no se reiniciaba y los "Revivir" sin usar se acumulaban entre partidas
    player.rerollUses = 0; player.skipUses = 0; player.banishUses = 0; player.banished = {};
    player.arcana = []; player._arcanaPending = 0;
    window.freezeTimer = 0; window.vacuumTimer = 0; window.haoTimer = 0;
    // VS: estado window que nunca debia sobrevivir a una partida
    window._evolveCut = null;
    window._pendingLevelUps = 0;
    window.nextEventAt = BALANCE.firstEventAt;
    window.spawnTimer = 0;
    player._arcanaPending = 0;
    player._pendingUpgrade = 0;
    player.runBeliMult = 1;
    window.endlessMode = false; window.endlessBossKills = 0; window.nextBossAt = 0;
    initRunStats();
    gearReset();
    applyCharStats(player, selectedCharacter); // atributos propios del personaje (core.js)
    // apply meta upgrades
    META_UPGRADES.forEach(u => {
        const lvl = meta.upgrades[u.id] || 0;
        if (lvl > 0) u.apply(player, lvl);
    });

    skills.pistol.level = (selectedCharacter === 'luffy') ? 1 : 0; skills.pistol.baseDamage = 25; skills.pistol.evolved = false;
    skills.gatling.level = 0; skills.gatling.baseDamage = 10; skills.gatling.evolved = false;
    skills.bazooka.level = 0; skills.bazooka.baseDamage = 45; skills.bazooka.evolved = false;
    skills.gear2.level = 0; skills.gear2.active = false; skills.gear2.remain = 0; skills.gear2.evolved = false;
    skills.muchi.level = 0; skills.muchi.baseDamage = 35; skills.muchi.evolved = false;
    skills.ono.level = 0; skills.ono.baseDamage = 70; skills.ono.evolved = false;
    skills.santoryu.level = (selectedCharacter === 'zoro') ? 1 : 0; skills.santoryu.baseDamage = 38; skills.santoryu.evolved = false;
    skills.onigiri.level = 0; skills.onigiri.baseDamage = 60; skills.onigiri.evolved = false;
    skills.flyingslash.level = 0; skills.flyingslash.baseDamage = 20; skills.flyingslash.evolved = false;
    skills.tatsumaki.level = 0; skills.tatsumaki.baseDamage = 10; skills.tatsumaki.evolved = false;
    skills.poundho.level = 0; skills.poundho.baseDamage = 30; skills.poundho.evolved = false;
    skills.diablejambe.level = (selectedCharacter === 'sanji') ? 1 : 0; skills.diablejambe.baseDamage = 20; skills.diablejambe.evolved = false;
    skills.collier.level = 0; skills.collier.baseDamage = 10; skills.collier.evolved = false;
    skills.joueshot.level = 0; skills.joueshot.baseDamage = 26; skills.joueshot.evolved = false;
    skills.concasse.level = 0; skills.concasse.baseDamage = 75; skills.concasse.evolved = false;
    skills.partycourse.level = 0; skills.partycourse.baseDamage = 9; skills.partycourse.evolved = false;
    // Armas compartidas (disponibles para todos los personajes)
    skills.cuchillo.level = 0; skills.cuchillo.baseDamage = 14; skills.cuchillo.evolved = false;
    skills.granada.level = 0; skills.granada.baseDamage = 38; skills.granada.evolved = false;
    skills.rifle.level = 0; skills.rifle.baseDamage = 22; skills.rifle.evolved = false;
    skills.ballesta.level = 0; skills.ballesta.baseDamage = 28; skills.ballesta.evolved = false;
    skills.lanza.level = 0; skills.lanza.baseDamage = 14; skills.lanza.evolved = false;
    skills.hacha.level = 0; skills.hacha.baseDamage = 60; skills.hacha.evolved = false;
    skills.shuriken.level = 0; skills.shuriken.baseDamage = 16; skills.shuriken.evolved = false;
    skills.hakiPulse.level = 0; skills.hakiPulse.baseDamage = 12; skills.hakiPulse.evolved = false;

    enemies = []; enemyBullets = []; drops = []; particles = []; damageTexts = []; activeAttacks = [];
    gameTime = 0; scoreBeli = 0; window.beliSrc = {}; bossSpawned = false;
    window.minibossesSpawned = {}; window.mirrorMinibossSpawned = false; window.waveIdx = 0;
    window.spawnBanner = null;
    applyCrewStart(); // arma inicial y bonus de Nami, Usopp, Chopper y Robin (js/arsenal.js)
    updateUI();
}
// Las casillas y la calidad se guardan al cambiarlas. Antes solo se leían al pulsar VOLVER, y mover
// un volumen (que guarda y repinta las opciones) devolvía las casillas a su valor anterior.
(function () {
    const map = { 'opt-shake': 'shake', 'opt-particles': 'fewerParticles', 'opt-flashes': 'fewerFlashes', 'opt-dmgnums': 'showDamageNumbers', 'opt-autopause': 'autoPause' };
    Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => {
            windowOpts[map[id]] = el.checked;
            if (id === 'opt-flashes') document.body.classList.toggle('opt-calm', !!windowOpts.fewerFlashes);
            saveOpts();
        });
    });
    const q = document.getElementById('opt-quality');
    if (q) q.addEventListener('change', () => { windowOpts.quality = q.value; saveOpts(); });
})();
