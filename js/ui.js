// === OPCIONES (persistente, VS-style sliders) ===
let windowOpts = { music: 0.8, sfx: 0.8, shake: true, fewerParticles: false, fewerFlashes: false, showDamageNumbers: true, autoPause: true, menuMusicMuted: false, master: 0.8 };
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
    if (checkF) checkF.checked = windowOpts.fewerFlashes;
    if (checkD) checkD.checked = windowOpts.showDamageNumbers;
    if (checkA) checkA.checked = windowOpts.autoPause;
    masterVolume = (typeof windowOpts.master === 'number') ? windowOpts.master : 0.8;
    if (typeof windowOpts.master !== 'number') windowOpts.master = masterVolume;
}
function showOptions() { document.getElementById('start-screen').style.display = 'none'; document.getElementById('options-screen').style.display = 'flex'; }
function closeOptions() {
    const sliderMa = document.getElementById('opt-master'), sliderM = document.getElementById('opt-music'), sliderS = document.getElementById('opt-sfx');
    const checkSh = document.getElementById('opt-shake'), checkP = document.getElementById('opt-particles');
    if (sliderMa) windowOpts.master = sliderMa.value / 100;
    if (sliderM) windowOpts.music = sliderM.value / 100;
    if (sliderS) windowOpts.sfx = sliderS.value / 100;
    if (checkSh) windowOpts.shake = checkSh.checked;
    if (checkP) windowOpts.fewerParticles = checkP.checked;
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
    // marca los mapas bloqueados
    document.querySelectorAll('#map-select .map-btn').forEach(b => b.classList.toggle('locked', mapLocked(b.dataset.map)));
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
    document.getElementById('gameover-screen').style.display = 'none';
    document.getElementById('victory-screen').style.display = 'none';
    resetGame();
    applyRunCurse();
    showArcanaScreen(); // VS: 1 Voluntad de D al empezar cada partida
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

var soundEnabled = true;
// sliders de opciones independiente: masterVolume es el volumen global heredado
var masterVolume = 0.8;
function setVolume(v) { masterVolume = Math.max(0, Math.min(1, v / 100)); updateMusic(); }
function setVolMaster(v) { windowOpts.master = Math.max(0, Math.min(1, v / 100)); masterVolume = windowOpts.master; saveOpts(); updateMusic(); const a=document.getElementById('opt-master'), b=document.getElementById('vol-master'); if(a) a.value=v; if(b) b.value=v; const va=document.getElementById('opt-master-val'); if(va) va.innerText=Math.round(windowOpts.master*100); }
function setVolMusic(v) { windowOpts.music = Math.max(0, Math.min(1, v / 100)); saveOpts(); updateMusic(); const a=document.getElementById('opt-music'), b=document.getElementById('vol-music'); if(a) a.value=v; if(b) b.value=v; const va=document.getElementById('opt-music-val'); if(va) va.innerText=Math.round(windowOpts.music*100); }
function setVolSfx(v) { windowOpts.sfx = Math.max(0, Math.min(1, v / 100)); saveOpts(); const a=document.getElementById('opt-sfx'), b=document.getElementById('vol-sfx'); if(a) a.value=v; if(b) b.value=v; const va=document.getElementById('opt-sfx-val'); if(va) va.innerText=Math.round(windowOpts.sfx*100); }
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
}
// VS: auto-pausa al cambiar de pestaña/minimizar — nadie muere por cambiar de ventana
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState === 'PLAYING' && windowOpts && windowOpts.autoPause !== false) togglePause();
});
function renderPauseWeapons() {
    const wEl = document.getElementById('pause-weapons');
    const pEl = document.getElementById('pause-passives');
    if (!wEl || !pEl) return;
    const weaponIds = ['pistol','gatling','bazooka','gear2','santoryu','onigiri','flyingslash','diablejambe','collier','joueshot','muchi','ono','tatsumaki','poundho','concasse','partycourse','cuchillo','granada','rifle','ballesta','lanza','hacha','shuriken','hakiPulse'];
    const passiveIds = ['power','crit','cd','armor','haki_buso','haki_ken','haki_hao','area','speed','pickup','growth','luck','maxhp','regen','evasion','magnet','greed','vamp'];
    const icons = ICONS;
    wEl.innerHTML = '';
    passiveIds.forEach(id => {
        const sk = skills[id];
        if (!sk || (sk.level !== undefined && sk.level <= 0) && id !== 'power' && id !== 'crit' && id !== 'cd' && id !== 'armor') {
            // passives from upgrades don't have level in skills; skip
        }
    });
    // weapons
    weaponIds.forEach(id => {
        const sk = skills[id];
        if (!sk || sk.level <= 0) return;
        const ev = sk.evolved ? ' (EVO)' : (sk.level >= 5 ? ' (EVO posible)' : '');
        const div = document.createElement('div');
        div.style.cssText = 'background:#faedcd;border:2px solid #8b5e3c;border-radius:8px;padding:4px 6px;font-size:11px;font-family:Segoe UI,Verdana,sans-serif;font-weight:700;color:#3d2314;min-width:56px;text-align:center;';
        div.innerHTML = `<div style="font-size:16px;">${icons[id]||'?'}</div><div>${id} Lv${sk.level}${ev}</div>`;
        wEl.appendChild(div);
    });
    // passives from player stats (show counts)
    const passives = [];
    if (player.powerPct > 0) passives.push({ name: 'Poder', val: player.powerPct + '%' });
    if (player.critChance > 0.05) passives.push({ name: 'Crit', val: Math.round(player.critChance*100) + '%' });
    if (player.cdReduction > 0) passives.push({ name: 'CD', val: '-' + player.cdReduction + '%' });
    if (player.armor > 0) passives.push({ name: 'Armadura', val: player.armor + '%' });
    if (player.areaBonus > 1) passives.push({ name: 'Área', val: '+' + Math.round((player.areaBonus-1)*100) + '%' });
    if (player.speed > 185) passives.push({ name: 'Velocidad', val: '+' + Math.round((player.speed/185-1)*100) + '%' });
    pEl.innerHTML = '';
    passives.forEach(p => {
        const div = document.createElement('div');
        div.style.cssText = 'background:#faedcd;border:2px solid #8b5e3c;border-radius:8px;padding:4px 6px;font-size:11px;font-family:Segoe UI,Verdana,sans-serif;font-weight:700;color:#3d2314;min-width:56px;text-align:center;';
        div.innerHTML = `<div style="font-size:14px;">${ICONS.up}</div><div>${p.name}</div><div>${p.val}</div>`;
        pEl.appendChild(div);
    });
    if (wEl.children.length === 0) wEl.innerHTML = '<p style="color:#6c584c;font-size:12px;">Sin armas</p>';
    if (pEl.children.length === 0) pEl.innerHTML = '<p style="color:#6c584c;font-size:12px;">Sin pasivas</p>';
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
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}
function showControls() {
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('controls-screen').style.display = 'flex';
}
function backToMenu() {
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('controls-screen').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'none';
    document.getElementById('victory-screen').style.display = 'none';
    gameState = 'START';
    document.getElementById('start-screen').style.display = 'flex';
    updateMusic();
}

function resetGame() {
    player.x = 0; player.y = 0;
    player.hp = 100; player.maxHp = 100;
    player.walkFrame = 0; player.isMoving = false;
    player.animState = 'idle'; player.animIndex = 0; player.attackTimer = 0; player.hitTimer = 0; player._hurtFlash = 0; player._hurtShakeCd = 0;
    player.level = 1; player.xp = 0; player.nextXp = 6;
    player.powerPct = 0; player.critChance = 0.05; player.cdReduction = 0; player.areaBonus = 1.0; player.armor = 0; player.speed = 185; player.pickupBonus = 1; player.growthBonus = 1; player.greedBonus = 1; player.luckBonus = 1; player.curse = 1; player.regenRate = 0; player.evasion = 0; player.vampirism = 0;
    player.passives = {};
    player.rerollUses = 0; player.skipUses = 0; player.banishUses = 0; player.banished = {};
    player.arcana = []; player._arcanaPending = 0;
    window.freezeTimer = 0; window.vacuumTimer = 0; window.haoTimer = 0;
    // VS: estado window que nunca debia sobrevivir a una partida
    window._evolveCut = null;
    window._pendingLevelUps = 0;
    window.nextEventAt = 70;
    window.spawnTimer = 0;
    player._arcanaPending = 0;
    player._pendingUpgrade = 0;
    player.runBeliMult = 1;
    window.endlessMode = false; window.endlessBossKills = 0; window.nextBossAt = 0;
    initRunStats();
    // apply meta upgrades
    META_UPGRADES.forEach(u => {
        const lvl = meta.upgrades[u.id] || 0;
        if (lvl > 0) u.apply(player, lvl);
    });

    skills.pistol.level = (selectedCharacter === 'luffy') ? 1 : 0; skills.pistol.baseDamage = 20; skills.pistol.evolved = false;
    skills.gatling.level = 0; skills.gatling.baseDamage = 10; skills.gatling.evolved = false;
    skills.bazooka.level = 0; skills.bazooka.baseDamage = 45; skills.bazooka.evolved = false;
    skills.gear2.level = 0; skills.gear2.active = false; skills.gear2.remain = 0; skills.gear2.evolved = false;
    skills.muchi.level = 0; skills.muchi.baseDamage = 35; skills.muchi.evolved = false;
    skills.ono.level = 0; skills.ono.baseDamage = 70; skills.ono.evolved = false;
    skills.santoryu.level = (selectedCharacter === 'zoro') ? 1 : 0; skills.santoryu.baseDamage = 34; skills.santoryu.evolved = false;
    skills.onigiri.level = 0; skills.onigiri.baseDamage = 60; skills.onigiri.evolved = false;
    skills.flyingslash.level = 0; skills.flyingslash.baseDamage = 20; skills.flyingslash.evolved = false;
    skills.tatsumaki.level = 0; skills.tatsumaki.baseDamage = 10; skills.tatsumaki.evolved = false;
    skills.poundho.level = 0; skills.poundho.baseDamage = 30; skills.poundho.evolved = false;
    skills.diablejambe.level = (selectedCharacter === 'sanji') ? 1 : 0; skills.diablejambe.baseDamage = 16; skills.diablejambe.evolved = false;
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
    gameTime = 0; scoreBeli = 0; bossSpawned = false;
    window.moriaSpawned = false; window.kumaSpawned = false; window.morganSpawned = false; window.mirrorMinibossSpawned = false;
    window.spawnBanner = null;
    updateUI();
}
