// === Modos extra (como Hyper e Inverse de Vampire Survivors) y tabla de récords ===
//   Haki:    el Haki del Rey acelera el combate. Todo va un 30% más rápido y se gana más Beli.
//   Inverso: el mundo al revés. +60% de peligro a cambio de mucho más Beli y Suerte.
// Se desbloquean con logros (js/systems.js) y se pueden combinar con el Clima Peligroso.
const RUN_MODES = {
    normal:  { name: 'Normal',  desc: 'La travesía de siempre.' },
    haki:    { name: 'Haki',    desc: 'Todo va un 30% más rápido · +50% Berries', unlock: 'mode_haki',
               speed: 1.3, beli: 1.5 },
    inverso: { name: 'Inverso', desc: '+60% peligro: enemigos más duros, rápidos y numerosos · +100% Berries · +20% Suerte', unlock: 'mode_inverso',
               curse: 0.6, beli: 2.0, luck: 0.2 }
};
let runMode = 'normal';

function modeLocked(id) {
    const m = RUN_MODES[id];
    return !!(m && m.unlock && !meta.unlocked[m.unlock]);
}
function selectMode(id) {
    if (modeLocked(id)) {
        playSound('muted');
        const a = ACHIEVEMENTS.find(x => x.unlock === RUN_MODES[id].unlock);
        showAchToast('MODO ' + RUN_MODES[id].name.toUpperCase() + ' BLOQUEADO — ' + (a ? a.desc.split('.')[0] : 'consigue su logro'));
        return;
    }
    playSound('ui');
    runMode = id;
    refreshModeButtons();
}
function refreshModeButtons() {
    document.querySelectorAll('#mode-select .mode-btn').forEach(b => {
        b.classList.toggle('selected', b.dataset.mode === runMode);
        b.classList.toggle('locked', modeLocked(b.dataset.mode));
    });
    const d = document.getElementById('mode-desc');
    if (d) d.innerText = RUN_MODES[runMode].desc;
}
// se llama al empezar la partida, después del Clima
function applyRunMode() {
    if (modeLocked(runMode)) runMode = 'normal';
    const m = RUN_MODES[runMode];
    if (m.curse) player.curse += m.curse;
    if (m.beli) player.runBeliMult = (player.runBeliMult || 1) * m.beli;
    if (m.luck) player.luckBonus += m.luck;
    const cv = document.getElementById('gameCanvas');
    if (cv) cv.classList.toggle('inverse-world', runMode === 'inverso');
}
function modeTimeScale() { return (gameState === 'PLAYING' && RUN_MODES[runMode].speed) || 1; }

// --- Tabla de récords: la mejor singladura de cada personaje en cada isla ---
const RECORD_MAPS = ['shelltown', 'syrup', 'baratie', 'arlongpark', 'drum', 'alabasta', 'skypiea', 'water7', 'enieslobby', 'thrillerbark', 'marineford', 'wholecake', 'wano'];
const RECORD_MAP_NAMES = { shelltown: 'Shell Town', syrup: 'Syrup', drum: 'Drum', arlongpark: 'Arlong Park', baratie: 'Baratie', alabasta: 'Alabasta', skypiea: 'Skypiea', thrillerbark: 'Thriller Bark', enieslobby: 'Enies Lobby', marineford: 'Marineford', water7: 'Water 7', wholecake: 'Whole Cake', wano: 'Wano' };
const RECORD_CHARS = ['luffy', 'zoro', 'sanji', 'usopp', 'nami', 'chopper', 'robin'];

function recordScore(r) { return (r.won ? 1e9 : 0) + (r.curse || 0) * 1e8 + Math.round(r.time) * 1e4 + Math.min(9999, r.kills); }
function recordRun(won) {
    if (!meta.records) meta.records = {};
    const key = selectedMap + '|' + selectedCharacter;
    const r = { won: !!won, time: gameTime, kills: window.lastRun ? window.lastRun.kills : 0, level: player.level,
                beli: scoreBeli, curse: runCurseRank, mode: runMode, date: new Date().toISOString().slice(0, 10) };
    const prev = meta.records[key];
    const isNew = !prev || recordScore(r) > recordScore(prev);
    if (isNew) meta.records[key] = r;
    // récords generales de una sola partida
    const top = meta.records._top || (meta.records._top = {});
    const best = (k, v) => { if (!top[k] || v > top[k].v) top[k] = { v, char: selectedCharacter, map: selectedMap }; };
    best('kills', r.kills); best('level', r.level); best('beli', r.beli);
    return isNew;
}

function showRecords() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('records-screen').style.display = 'flex';
    renderRecords();
}
function closeRecords() {
    document.getElementById('records-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
}
function renderRecords() {
    const box = document.getElementById('records-table');
    if (!box) return;
    const rec = meta.records || {};
    const names = { luffy: 'Luffy', zoro: 'Zoro', sanji: 'Sanji', usopp: 'Usopp', nami: 'Nami', chopper: 'Chopper', robin: 'Robin' };
    const cell = r => {
        if (!r) return '<td class="rec-empty">—</td>';
        const badge = (r.won ? '<span class="rec-win">★</span> ' : '') + formatTime(r.time);
        const extra = (r.curse ? ' · C' + r.curse : '') + (r.mode && r.mode !== 'normal' ? ' · ' + RUN_MODES[r.mode].name : '');
        return `<td><b>${badge}</b><small>${r.kills} K · Nv ${r.level}${extra}</small></td>`;
    };
    let html = '<table class="rec-table"><thead><tr><th></th>' + RECORD_MAPS.map(m => `<th>${RECORD_MAP_NAMES[m]}</th>`).join('') + '</tr></thead><tbody>';
    RECORD_CHARS.forEach(c => {
        html += `<tr><th>${names[c]}</th>` + RECORD_MAPS.map(m => cell(rec[m + '|' + c])).join('') + '</tr>';
    });
    html += '</tbody></table>';
    const top = rec._top || {};
    const tl = (k, label, fmt) => top[k] ? `<div><span>${label}</span><b>${fmt(top[k].v)}</b><small>${names[top[k].char] || top[k].char} · ${RECORD_MAP_NAMES[top[k].map] || top[k].map}</small></div>` : '';
    html += '<div class="rec-top">' + tl('kills', 'Más enemigos', v => v.toLocaleString('es-ES')) + tl('level', 'Nivel más alto', v => v) + tl('beli', 'Más Berries', v => '฿' + v.toLocaleString('es-ES')) + '</div>';
    box.innerHTML = html;
}
