// === Colección y Logros (estilo Vampire Survivors) ===
// - Colección: enemigos avistados en cada isla, arsenal descubierto (armas y objetos) y la receta de cada evolución.
// - Logros: agrupados por lo que desbloquean (tripulación, islas, transformaciones, tienda, objetos y modos),
//   con su condición, el progreso y la recompensa.
// Lo descubierto se guarda en meta.collection { items, evos } y meta.stats.killsByMap[isla][tipo].
// Se carga después de pixicons.js (iconos ya sustituidos) y antes de main.js.

const COLL_CHARS = ['luffy', 'zoro', 'usopp', 'sanji', 'nami', 'chopper', 'robin', 'franky', 'brook', 'jinbe']; // orden de llegada al barco
const COLL_COLOR = { luffy: 'var(--luffy)', zoro: 'var(--zoro)', sanji: 'var(--sanji)', nami: '#f97316', usopp: '#a16207', chopper: '#ec4899', robin: '#7c3aed', franky: '#0ea5e9', brook: '#6b21a8', jinbe: '#1d4ed8' };
const COLL_START = { luffy: 'pistol', zoro: 'santoryu', sanji: 'diablejambe', nami: 'climatact', usopp: 'kabuto', chopper: 'roseo', robin: 'clutch', franky: 'weaponsleft', brook: 'yahazu', jinbe: 'samegawara' };
const COLL_MAP_NAMES = { shelltown: 'Shell Town', syrup: 'Syrup', baratie: 'Baratie', arlongpark: 'Arlong Park', drum: 'Drum', alabasta: 'Alabasta', skypiea: 'Skypiea', water7: 'Water 7', enieslobby: 'Enies Lobby', thrillerbark: 'Thriller Bark', marineford: 'Marineford', wholecake: 'Whole Cake', wano: 'Wano' };
// Variante élite que sustituye a un enemigo raso al aparecer (handleSpawning en game.js)
const COLL_ELITE_OF = { grunt: 'elite_marine', shooter: 'elite_shooter', inupen: 'elite_inupen', kumashi: 'elite_kumashi', tararan: 'elite_tararan',
    hogback: 'elite_hogback', cindry: 'elite_cindry', pellona: 'elite_pellona', absalom: 'elite_absalom', ryuma: 'elite_ryuma' };
// Los mismos sprites de relleno visten a bandas distintas según la isla
const COLL_NAMES = {
    all: { grunt: 'Marine raso — soldado de la Marina', shooter: 'Fusilero de la Marina', chess_soldier: 'Soldado de Ajedrez — Mil Soldados de Big Mom', chess_soldier_b: 'Soldado de Ajedrez — lancero', ink_bird: 'Pájaro de tinta — dibujo de Kanjuro' },
    syrup: { krieg_pirate: 'Pirata del Gato Negro — espada', krieg_knife: 'Pirata del Gato Negro — cuchillos', krieg_gunner: 'Pirata del Gato Negro — pistola' },
    water7: { krieg_pirate: 'Familia Franky — matón', krieg_knife: 'Familia Franky — cuchillos', krieg_gunner: 'Familia Franky — pistola', krieg_bomber: 'Familia Franky — bombas', krieg_starved: 'Familia Franky — recluta' },
    enieslobby: { grunt: 'Marine de Enies Lobby — guardia de la isla judicial' },
    marineford: { grunt: 'Marine del Cuartel General — la Guerra en la Cumbre' },
    wano: { krieg_pirate: 'Pirata de las Bestias — Waiter', krieg_knife: 'Gifter de las Bestias', krieg_gunner: 'Pirata de las Bestias — tirador' }
};
const collEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const collSplit = s => { const i = s.indexOf(' — '); return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 3)]; };

// ---------- Registro de lo descubierto ----------
function collInit() {
    const c = meta.collection || (meta.collection = {});
    c.items = c.items || {}; c.evos = c.evos || {};
    if (!meta.stats.killsByMap) meta.stats.killsByMap = {};
    // Guardados anteriores a la Colección: el arma inicial de cada personaje que ya zarpó
    if (!c._seeded) {
        for (const k in (meta.records || {})) { const ch = k.split('|')[1]; if (COLL_START[ch]) c.items[COLL_START[ch]] = 1; }
        c._seeded = 1;
    }
    return c;
}
function collectRun() {
    const c = collInit();
    for (const k in skills) {
        if (skills[k] && skills[k].level > 0) c.items[k] = 1;
        if (skills[k] && skills[k].evolved) c.evos[k] = 1;
    }
    for (const id in (player.passives || {})) if (player.passives[id] > 0) c.items[id] = 1;
}
// Enemigos derrotados por isla (antes de que mergeRunStats borre runStats)
function collectKillsByMap() {
    if (!window.runStats) return;
    collInit();
    const m = meta.stats.killsByMap[selectedMap] || (meta.stats.killsByMap[selectedMap] = {});
    for (const t in window.runStats.killsByType) m[t] = (m[t] || 0) + window.runStats.killsByType[t];
}
const _collMerge = mergeRunStats;
mergeRunStats = function () { try { collectRun(); collectKillsByMap(); } catch (e) {} return _collMerge.apply(this, arguments); };
const _collEvolve = evolveWeapon;
evolveWeapon = function (id) { const r = _collEvolve.apply(this, arguments); try { if (skills[id] && skills[id].evolved) collInit().evos[id] = 1; } catch (e) {} return r; };
const _collBack = backToMenu;
backToMenu = function () {
    // abandonar la partida desde la pausa: lo que se llegó a coger también cuenta
    try { if (window.runStats && gameState !== 'START') { collectRun(); saveMeta(); } } catch (e) {}
    return _collBack.apply(this, arguments);
};

// ---------- Datos ----------
function collCatalog() {
    if (collCatalog._c) return collCatalog._c;
    const list = upgradeCatalog();
    const byId = {};
    for (const u of list) if (!byId[u.id]) byId[u.id] = u;
    return (collCatalog._c = { list: Object.values(byId), byId });
}
function collOwner(u) {
    if (Array.isArray(u.chars) && u.chars.length === 1) return u.chars[0];
    for (const c in CHAR_SKILLS) if (CHAR_SKILLS[c].includes(u.id)) return c;
    return 'all';
}
function collCharName(c) { return (CHAR_ANIMS[c] && CHAR_ANIMS[c].name) || c; }
function collCharLocked(c) { return c !== 'luffy' && !meta.unlocked[c]; }
function collMapOrder() {
    const btns = Array.from(document.querySelectorAll('#map-select .map-btn')).map(b => b.dataset.map);
    return btns.length ? btns : Object.keys(COLL_MAP_NAMES);
}
function collEnemyName(type, map) {
    const o = (COLL_NAMES[map] || {})[type] || COLL_NAMES.all[type];
    if (o) return o;
    const ei = ELITE_INFO[type];
    if (ei && (ei.always || /^elite_/.test(type))) return ei.name[map] || ei.name.all || ei.name.baratie;
    if (BOSS_INFO[type]) return BOSS_INFO[type];
    if (MINIBOSS_INFO[type]) return MINIBOSS_INFO[type];
    return BESTIARY_INFO[type] || type;
}
// Lista de enemigos de una isla, de jefe a raso
function collMapRoster(map) {
    const d = MAP_ENEMIES[map];
    if (!d) return [];
    const seen = new Set(), out = [];
    const add = (type, kind) => { if (!type || seen.has(type) || !ENEMY_ANIMS[type] || PROP_TYPES.includes(type)) return; seen.add(type); out.push({ type, kind }); };
    add(d.boss, 'boss');
    (d.minibosses || []).forEach(m => add(m.type, 'mini'));
    const rank = t => (ELITE_INFO[t] && ELITE_INFO[t].always) ? 'elite' : 'fodder';
    const fodder = [d.base, ...(d.pool || []).map(p => p.type), ...Object.values(d.events || {}).filter(v => typeof v === 'string' && ENEMY_ANIMS[v])];
    fodder.filter(t => rank(t) === 'elite').forEach(t => add(t, 'elite'));
    fodder.forEach(t => { if (COLL_ELITE_OF[t]) add(COLL_ELITE_OF[t], 'elite'); });
    fodder.forEach(t => add(t, 'fodder'));
    return out;
}
// Derrotados en esa isla. Partidas de antes de la Colección (sin registro por isla): se usa el total si se jugó la isla.
function collKills(type, map) {
    const km = meta.stats.killsByMap || {};
    if (km[map]) return km[map][type] || 0;
    return (meta.stats.maxTime[map] || 0) > 0 ? (meta.stats.killsByType[type] || 0) : 0;
}
function collThumb(type) {
    const cfg = ENEMY_ANIMS[type];
    try {
        if (cfg && cfg.folder) return loadImg(enemyPath(cfg.folder, (cfg.idle && cfg.idle.length) ? cfg.idle[0] : 0)).src;
        const img = ENEMY_IMG[type] && ENEMY_IMG[type].idle && ENEMY_IMG[type].idle[0];
        if (img && img.toDataURL) return img.toDataURL();
    } catch (e) {}
    return '';
}
function collFlip(type) { const cfg = ENEMY_ANIMS[type]; return cfg && cfg.faces === -1; }

// ---------- Pantalla de Colección ----------
let collTab = 'enemies';
function showCollection(tab) {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('collection-screen').style.display = 'flex';
    if (tab) collTab = tab;
    renderCollection();
}
function closeCollection() {
    document.getElementById('collection-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    updateMetaUI();
}
function collSetTab(t) { playSound('ui'); collTab = t; renderCollection(); }
function collCounts() {
    const c = collInit(), cat = collCatalog();
    let eTot = 0, eSeen = 0;
    for (const m of collMapOrder()) for (const r of collMapRoster(m)) { eTot++; if (collKills(r.type, m) > 0) eSeen++; }
    const items = cat.list, iSeen = items.filter(u => c.items[u.id]).length;
    const evoIds = Object.keys(EVOLUTIONS).filter(id => cat.byId[id]);
    return { eTot, eSeen, iTot: items.length, iSeen, vTot: evoIds.length, vSeen: evoIds.filter(id => c.evos[id]).length };
}
function renderCollection() {
    const n = collCounts();
    const tabs = [['enemies', 'ENEMIGOS', n.eSeen, n.eTot], ['arsenal', 'ARSENAL', n.iSeen, n.iTot], ['evos', 'EVOLUCIONES', n.vSeen, n.vTot]];
    document.getElementById('coll-tabs').innerHTML = tabs.map(([id, lbl, a, b]) =>
        `<button class="cl-tab${collTab === id ? ' on' : ''}" role="tab" aria-selected="${collTab === id}" onclick="collSetTab('${id}')">${lbl} <small>${a}/${b}</small></button>`).join('');
    const body = document.getElementById('coll-body');
    body.innerHTML = collTab === 'enemies' ? collEnemiesHTML() : collTab === 'arsenal' ? collArsenalHTML() : collEvosHTML();
    body.scrollTop = 0;
    collDetail(null);
}
const COLL_KIND = { boss: 'JEFE', mini: 'MINIJEFE', elite: 'ÉLITE', fodder: '' };
function collEnemiesHTML() {
    let html = '';
    for (const m of collMapOrder()) {
        const roster = collMapRoster(m);
        if (!roster.length) continue;
        const locked = typeof mapLocked === 'function' && mapLocked(m);
        const seenN = roster.filter(r => collKills(r.type, m) > 0).length;
        html += `<div class="op-section${locked ? ' cl-locked' : ''}"><span>${locked ? '<span class="op-slot">' + ICONS.lock + '</span> ' : ''}${COLL_MAP_NAMES[m] || m}</span><small>${seenN}/${roster.length}</small></div><div class="cl-grid">`;
        for (const r of roster) {
            const k = collKills(r.type, m), seen = k > 0;
            const [nm] = collSplit(collEnemyName(r.type, m));
            const src = collThumb(r.type);
            html += `<button class="cl-card cl-enemy ${seen ? '' : 'unseen'}" data-kind="${r.kind}" onclick="collDetail('e:${m}:${r.type}')">`
                + (COLL_KIND[r.kind] ? `<span class="cl-badge">${COLL_KIND[r.kind]}</span>` : '')
                + `<span class="cl-thumb">${src ? `<img src="${src}" alt="" loading="lazy" class="${collFlip(r.type) ? 'flip' : ''}">` : '?'}</span>`
                + `<span class="cl-name">${seen ? collEsc(nm) : '???'}</span>`
                + `<span class="cl-sub">${seen ? '×' + k.toLocaleString('es-ES') : 'sin avistar'}</span></button>`;
        }
        html += '</div>';
    }
    return html;
}
function collItemCard(u, c) {
    const got = !!c.items[u.id], owner = collOwner(u), evo = got && c.evos[u.id];
    return `<button class="cl-card cl-item ${got ? '' : 'unseen'}${evo ? ' evo' : ''}" data-kind="${u.type}" style="--c:${COLL_COLOR[owner] || (u.type === 'passive' ? '#2563eb' : 'var(--shared)')}" onclick="collDetail('i:${u.id}')">`
        + `<span class="cl-ico">${u.icon || ''}</span>`
        + `<span class="cl-name">${got ? collEsc(u.title.replace(/ \(.*\)$/, '')) : '???'}</span></button>`;
}
function collArsenalHTML() {
    const c = collInit(), cat = collCatalog();
    const groups = {};
    for (const u of cat.list) {
        const key = u.type === 'passive' ? 'passive' : collOwner(u);
        (groups[key] = groups[key] || []).push(u);
    }
    let html = `<p class="cl-note">Cada técnica es exclusiva de su pirata. Las armas compartidas y los objetos los puede coger cualquiera (el Haki, solo quien lo usa en el canon).</p>`;
    const sec = (key, title) => {
        const g = groups[key]; if (!g) return;
        const locked = COLL_CHARS.includes(key) && collCharLocked(key);
        html += `<div class="op-section${locked ? ' cl-locked' : ''}" style="--c:${COLL_COLOR[key] || 'transparent'}"><span>${locked ? '<span class="op-slot">' + ICONS.lock + '</span> ' : ''}${title}</span><small>${g.filter(u => c.items[u.id]).length}/${g.length}</small></div>`;
        html += '<div class="cl-grid cl-grid-items">' + g.map(u => collItemCard(u, c)).join('') + '</div>';
    };
    COLL_CHARS.forEach(ch => sec(ch, collCharName(ch).toUpperCase()));
    sec('all', 'ARMAS COMPARTIDAS');
    sec('passive', 'OBJETOS Y HAKI');
    return html;
}
function collEvosHTML() {
    const c = collInit(), cat = collCatalog();
    let html = `<p class="cl-note">Sube el arma al <b>Nv 5</b>, consigue su <b>objeto</b> y abre el cofre de un minijefe o un jefe.</p>`;
    const byOwner = {};
    for (const id in EVOLUTIONS) {
        const u = cat.byId[id]; if (!u) continue;
        const o = collOwner(u);
        (byOwner[o] = byOwner[o] || []).push(id);
    }
    const sec = (key, title) => {
        const ids = byOwner[key]; if (!ids) return;
        html += `<div class="op-section" style="--c:${COLL_COLOR[key] || 'transparent'}"><span>${title}</span><small>${ids.filter(id => c.evos[id]).length}/${ids.length}</small></div><div class="cl-evos">`;
        for (const id of ids) {
            const u = cat.byId[id], ev = EVOLUTIONS[id], p = cat.byId[ev.passive] || { title: ev.passive, icon: '' };
            const done = !!c.evos[id], hasW = !!c.items[id], hasP = !!c.items[ev.passive];
            html += `<button class="cl-evo${done ? ' done' : ''}" onclick="collDetail('v:${id}')">`
                + `<span class="cl-ing${hasW ? '' : ' unseen'}" title="${collEsc(u.title)}">${u.icon || ''}<small>Nv 5</small></span><b class="cl-op">+</b>`
                + `<span class="cl-ing${hasP ? '' : ' unseen'}" title="${collEsc(p.title)}">${p.icon || ''}</span><b class="cl-op">➜</b>`
                + `<span class="cl-ing cl-res${done ? '' : ' unseen'}">${u.icon || ''}</span>`
                + `<span class="cl-evo-txt"><span class="cl-name">${done ? collEsc(ev.name) : '???'}</span><span class="cl-sub">${collEsc(u.title.replace(/ \(.*\)$/, ''))} + ${collEsc(p.title.replace(/ \(.*\)$/, ''))}</span></span></button>`;
        }
        html += '</div>';
    };
    COLL_CHARS.forEach(ch => sec(ch, collCharName(ch).toUpperCase()));
    sec('all', 'ARMAS COMPARTIDAS');
    return html;
}
// Ficha inferior con el detalle de lo pulsado
function collDetail(key) {
    const el = document.getElementById('coll-detail');
    if (!el) return;
    if (!key) { el.innerHTML = '<span class="cl-hint">Toca una carta para ver su ficha.</span>'; return; }
    playSound('ui');
    const c = collInit(), cat = collCatalog();
    const [kind, a, b] = key.split(':');
    let ico = '', title = '', text = '';
    if (kind === 'e') {
        const map = a, type = b, k = collKills(type, map);
        const src = collThumb(type);
        ico = src && k > 0 ? `<img src="${src}" alt="" class="${collFlip(type) ? 'flip' : ''}">` : '<span class="cl-q">?</span>';
        const [nm, sub] = collSplit(collEnemyName(type, map));
        title = k > 0 ? nm : '???';
        text = k > 0 ? (sub ? sub + ' · ' : '') + 'Derrotados en ' + COLL_MAP_NAMES[map] + ': ' + k.toLocaleString('es-ES')
            : 'Aún no lo has derrotado en ' + (COLL_MAP_NAMES[map] || map) + '.';
    } else if (kind === 'i') {
        const u = cat.byId[a], got = !!c.items[a], owner = collOwner(u);
        ico = u.icon || '';
        title = got ? u.title : '???';
        const who = owner === 'all' ? (ITEM_CHARS[a] ? 'Solo ' + ITEM_CHARS[a].map(collCharName).join(', ') : 'Cualquier pirata') : 'Exclusiva de ' + collCharName(owner);
        if (got) {
            text = u.desc.replace(/<[^>]+>/g, '') + ' · ' + who;
            const ev = EVOLUTIONS[a];
            if (ev) text += ' · Evolución: ' + (c.evos[a] ? ev.name : '???') + ' (con ' + ((cat.byId[ev.passive] || {}).title || ev.passive) + ')';
        } else if (owner !== 'all' && collCharLocked(owner)) text = 'Desbloquea a ' + collCharName(owner) + ': ' + lockText(owner).toLowerCase() + '.';
        else if (typeof ITEM_LOCK !== 'undefined' && ITEM_LOCK[a] && !meta.unlocked[ITEM_LOCK[a]]) text = 'Bloqueado: ' + ((unlockAchievement(ITEM_LOCK[a]) || {}).desc || '') ;
        else text = 'Aún no la has cogido. ' + who + '.';
    } else if (kind === 'v') {
        const u = cat.byId[a], ev = EVOLUTIONS[a], p = cat.byId[ev.passive] || { title: ev.passive };
        ico = `<span class="cl-evo-ico${c.evos[a] ? '' : ' unseen'}">${u.icon || ''}</span>`;
        title = c.evos[a] ? ev.name : '???';
        text = u.title + ' (Nv 5) + ' + p.title + ' + cofre de minijefe o jefe.' + (c.evos[a] ? ' ¡Conseguida!' : '');
    }
    el.innerHTML = `<span class="cl-d-ico">${ico}</span><span class="cl-d-txt"><b>${collEsc(title)}</b><span>${collEsc(text)}</span></span>`;
}

// ---------- Pantalla de Logros ----------
// Progreso numérico de los logros que lo tienen: [actual, objetivo, formato]
function achProgress(a, s) {
    const islands = Object.values(meta.wins).filter(v => v > 0).length;
    const maxT = Math.max(0, ...Object.values(s.maxTime || {}));
    const killsOf = list => list.filter(t => (s.killsByType[t] || 0) > 0).length;
    const T = { first_blood: [s.kills, 1], hunt_500: [s.kills, 500], map_thrillerbark: [s.kills, 5000], shop_area: [s.kills, 300], shop_banish: [s.kills, 3000],
        elites_25: [s.elites, 25], shop_luck: [s.elites, 10], gold_20k: [s.beliTotal, 20000, 'beli'],
        survive_10: [maxT, 480, 'time'], endless_15: [maxT, 900, 'time'], endless_30: [maxT, 1800, 'time'], shop_armor: [maxT, 180, 'time'],
        map_skypiea: [s.maxLevel || 0, 25], shop_cooldown: [s.maxLevel || 0, 20], shop_growth: [s.maxLevel || 0, 30],
        map_wano: [islands, 8], mode_haki: [islands, 2], shop_curse: [islands, 3],
        map_baratie: [killsOf(['buchi', 'jango']), 2], map_arlongpark: [killsOf(['gin', 'pearl']), 2], map_drum: [killsOf(['kuroobi', 'chew', 'hachi']), 3], map_alabasta: [killsOf(['chess', 'kuromarimo']), 2],
        evolve_one: [s.evolves, 1], shop_skip: [s.evolves, 1] };
    return T[a.id] || null;
}
function achGroup(a) {
    if (a.gear) return 'forms';
    const u = a.unlock || '';
    if (COLL_CHARS.includes(u)) return 'crew';
    if (/^map_/.test(u)) return 'maps';
    if (/^shop_/.test(u)) return 'shop';
    if (/^(item_|mode_)/.test(u)) return 'items';
    return 'feats';
}
const ACH_GROUPS = [['crew', 'TRIPULACIÓN'], ['maps', 'ISLAS'], ['forms', 'TRANSFORMACIONES'], ['items', 'OBJETOS Y MODOS'], ['shop', 'TIENDA DEL MUNDO'], ['feats', 'HAZAÑAS']];
function achPrize(a) {
    const u = a.unlock;
    let ico = '', txt = '';
    if (a.gear) {
        const ch = a.formChar || 'luffy';
        ico = pxIcon((typeof FORM_CARD !== 'undefined' && FORM_CARD[ch]) || (ch === 'luffy' ? 'gear2' : ch === 'zoro' ? 'zoroform' : 'sanjiform')) || ICONS.gear2;
        txt = a.gearText || 'GEAR ' + a.gear;
    } else if (u && COLL_CHARS.includes(u)) {
        ico = `<img src="assets/wanted/${u}.jpg" alt="">`; txt = a.unlockText || u.toUpperCase();
    } else if (u && /^map_/.test(u)) {
        const b = document.querySelector(`#map-select .map-btn[data-map="${u.slice(4)}"] [data-ico]`);
        ico = (b && ICONS[b.getAttribute('data-ico')]) || ICONS.ship; txt = (a.unlockText || '').replace(/^ISLA: /, '');
    } else if (u && /^shop_/.test(u)) {
        const m = META_UPGRADES.find(x => x.lock === u);
        ico = (m && m.icon) || ICONS.cart; txt = (a.unlockText || '').replace(/^TIENDA: /, '');
    } else if (u && /^item_/.test(u)) {
        const id = u === 'item_dial' ? 'dial' : 'jolly';
        ico = pxIcon(id) || ICONS[id] || ''; txt = a.unlockText || '';
    } else if (u && /^mode_/.test(u)) {
        ico = u === 'mode_haki' ? ICONS.haki_hao : ICONS.revive; txt = a.unlockText || '';
    }
    return { ico, txt };
}
let achFilter = 'all';
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
function achSetFilter(f) { playSound('ui'); achFilter = f; renderAchievements(); }
function renderAchievements() {
    const list = document.getElementById('ach-list');
    if (!list) return;
    const s = meta.stats;
    const done = ACHIEVEMENTS.filter(a => meta.achievements[a.id]).length;
    const unl = ACHIEVEMENTS.filter(a => a.unlock || a.gear), unlDone = unl.filter(a => meta.achievements[a.id]).length;
    const earned = ACHIEVEMENTS.filter(a => meta.achievements[a.id]).reduce((t, a) => t + a.reward, 0);
    document.getElementById('ach-chips').innerHTML =
        `<span class="pz-chip">SELLADOS ${done}/${ACHIEVEMENTS.length}</span><span class="pz-chip">DESBLOQUEOS ${unlDone}/${unl.length}</span><span class="pz-chip pz-gold">฿ ${earned.toLocaleString('es-ES')}</span>`;
    document.getElementById('ach-tabs').innerHTML = [['all', 'TODOS'], ['todo', 'PENDIENTES'], ['done', 'SELLADOS']].map(([id, l]) =>
        `<button class="cl-tab${achFilter === id ? ' on' : ''}" role="tab" aria-selected="${achFilter === id}" onclick="achSetFilter('${id}')">${l}</button>`).join('');
    let html = '';
    for (const [g, title] of ACH_GROUPS) {
        const all = ACHIEVEMENTS.filter(a => achGroup(a) === g);
        const shown = all.filter(a => achFilter === 'all' || (achFilter === 'done') === !!meta.achievements[a.id]);
        if (!shown.length) continue;
        html += `<div class="op-section"><span>${title}</span><small>${all.filter(a => meta.achievements[a.id]).length}/${all.length}</small></div><div class="ach-grid">`;
        for (const a of shown) {
            const got = !!meta.achievements[a.id];
            const pr = got ? null : achProgress(a, s);
            const prize = achPrize(a);
            let bar = '';
            if (pr) {
                const [cur, max, fmt] = pr, v = Math.min(cur || 0, max);
                const f = x => fmt === 'time' ? formatTime(x) : fmt === 'beli' ? fmtBeli(x) : Math.floor(x).toLocaleString('es-ES');
                bar = `<span class="ach-bar"><i style="width:${(v / max * 100).toFixed(1)}%"></i></span><span class="ach-num">${f(v)} / ${f(max)}</span>`;
            }
            html += `<div class="ach-row${got ? ' got' : ''}">`
                + `<span class="ach-seal" aria-label="${got ? 'Sellado' : 'Pendiente'}">${got ? '✔' : ''}</span>`
                + `<span class="ach-main"><b class="ach-name">${collEsc(a.name)}</b><span class="ach-desc">${collEsc(a.desc)}</span>${bar}</span>`
                + `<span class="ach-prize">${prize.txt ? `<span class="ach-unl"><span class="ach-unl-ico">${prize.ico}</span><span>${collEsc(prize.txt)}</span></span>` : ''}<span class="ach-beli">+${a.reward.toLocaleString('es-ES')} ฿</span></span>`
                + `</div>`;
        }
        html += '</div>';
    }
    list.innerHTML = html || '<p class="cl-note">No hay logros en esta lista.</p>';
}
// Escape cierra las pantallas del menú
window.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const cs = document.getElementById('collection-screen'), as = document.getElementById('achievements-screen');
    if (cs && cs.style.display === 'flex') closeCollection();
    else if (as && as.style.display === 'flex') closeAchievements();
});
