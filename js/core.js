const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

let VIEW_W = 800, VIEW_H = 600;
// Móvil (pantalla estrecha o tumbada): HUD compacto estilo VS, igual que en css/style.css
const COMPACT_MQ = window.matchMedia('(max-width: 900px), (max-height: 500px)');
function compactHUD() { return COMPACT_MQ.matches; }
// === Rendimiento: escala de render (resolución interna del canvas) ===
// El mundo se dibuja en píxeles CSS (VIEW_W x VIEW_H) y el canvas interno mide VIEW * RS.
// RS < 1 dibuja menos píxeles y el navegador lo amplía sin suavizado (el arte es pixel art).
// Calidad: 'auto' (baja sola si caen los FPS), 'high' (1), 'medium' (0.75), 'low' (0.5).
const RS_LEVELS = [1, 0.75, 0.5];
let RS = 1;
let _rsAuto = 0; // nivel elegido por la calidad automática
function qualityMode() { return (typeof windowOpts !== 'undefined' && windowOpts && windowOpts.quality) || 'auto'; }
function targetRS() {
    const q = qualityMode();
    if (q === 'high') return 1;
    if (q === 'medium') return 0.75;
    if (q === 'low') return 0.5;
    return RS_LEVELS[_rsAuto];
}
// Efectos baratos (sin sombras ni brillos de suelo) en calidad baja
function lowFx() { return RS <= 0.5; }
function resizeCanvas() {
    VIEW_W = window.innerWidth;
    VIEW_H = window.innerHeight;
    RS = targetRS();
    canvas.width = Math.max(1, Math.round(VIEW_W * RS));
    canvas.height = Math.max(1, Math.round(VIEW_H * RS));
    canvas.style.width = VIEW_W + 'px';
    canvas.style.height = VIEW_H + 'px';
    ctx.setTransform(RS, 0, 0, RS, 0, 0);
    ctx.imageSmoothingEnabled = false;
    _needsRedraw = true; // cambiar el tamaño borra el canvas
    document.body && document.body.classList.toggle('q-low', RS <= 0.5);
}
let _needsRedraw = true;
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));
resizeCanvas();
function applyQuality() { if (targetRS() !== RS) resizeCanvas(); }

// Calidad automática: mide el intervalo real entre frames durante la partida.
// Si va por debajo de ~45 FPS durante 2 s baja un nivel; si va sobrado 8 s sube uno.
const _perf = { last: 0, acc: 0, n: 0, slow: 0, fast: 0 };
function perfTick(now) {
    if (gameState !== 'PLAYING' || document.hidden) { _perf.last = 0; return; }
    if (_perf.last) {
        const d = now - _perf.last;
        if (d < 250) { _perf.acc += d; _perf.n++; }
    }
    _perf.last = now;
    if (_perf.acc < 2000) return;
    const avg = _perf.acc / _perf.n;
    _perf.acc = 0; _perf.n = 0;
    if (qualityMode() !== 'auto') return;
    if (avg > 22) { _perf.fast = 0; if (++_perf.slow >= 1 && _rsAuto < RS_LEVELS.length - 1) { _rsAuto++; _perf.slow = 0; resizeCanvas(); } }
    else if (avg < 17.5) { _perf.slow = 0; if (++_perf.fast >= 4 && _rsAuto > 0) { _rsAuto--; _perf.fast = 0; resizeCanvas(); } }
    else { _perf.slow = 0; _perf.fast = 0; }
}

// === Compatibilidad: filtros de color sin ctx.filter ===
// ctx.filter es lento por frame y Safari < 18 no lo soporta. Cada sprite filtrado se pinta una vez
// en un canvas aparte (con ctx.filter si existe, o con una matriz de color equivalente) y se reutiliza.
const CANVAS_FILTER_OK = (() => { try { const t = document.createElement('canvas').getContext('2d'); t.filter = 'blur(1px)'; return t.filter === 'blur(1px)'; } catch (e) { return false; } })();
const _filterCache = new WeakMap();
function _filterMatrix(fn, v) {
    const c = Math.cos(v), sn = Math.sin(v), k = 1 - v;
    switch (fn) {
        case 'brightness': return [v, 0, 0, 0, v, 0, 0, 0, v, 0];
        case 'contrast': return [v, 0, 0, 0, v, 0, 0, 0, v, (0.5 - 0.5 * v) * 255];
        case 'saturate': return [0.213 + 0.787 * v, 0.715 - 0.715 * v, 0.072 - 0.072 * v, 0.213 - 0.213 * v, 0.715 + 0.285 * v, 0.072 - 0.072 * v, 0.213 - 0.213 * v, 0.715 - 0.715 * v, 0.072 + 0.928 * v, 0];
        case 'grayscale': return [0.2126 + 0.7874 * k, 0.7152 - 0.7152 * k, 0.0722 - 0.0722 * k, 0.2126 - 0.2126 * k, 0.7152 + 0.2848 * k, 0.0722 - 0.0722 * k, 0.2126 - 0.2126 * k, 0.7152 - 0.7152 * k, 0.0722 + 0.9278 * k, 0];
        case 'sepia': return [0.393 + 0.607 * k, 0.769 - 0.769 * k, 0.189 - 0.189 * k, 0.349 - 0.349 * k, 0.686 + 0.314 * k, 0.168 - 0.168 * k, 0.272 - 0.272 * k, 0.534 - 0.534 * k, 0.131 + 0.869 * k, 0];
        case 'hue-rotate': return [0.213 + c * 0.787 - sn * 0.213, 0.715 - c * 0.715 - sn * 0.715, 0.072 - c * 0.072 + sn * 0.928,
            0.213 - c * 0.213 + sn * 0.143, 0.715 + c * 0.285 + sn * 0.140, 0.072 - c * 0.072 - sn * 0.283,
            0.213 - c * 0.213 - sn * 0.787, 0.715 - c * 0.715 + sn * 0.715, 0.072 + c * 0.928 + sn * 0.072, 0];
    }
    return null;
}
function _applyFilterManually(g, w, h, filter) {
    const ops = [];
    filter.replace(/([a-z-]+)\(([-\d.]+)(deg|%)?\)/g, (_, fn, num, unit) => {
        let v = parseFloat(num);
        if (unit === '%') v /= 100;
        if (fn === 'hue-rotate') v = v * Math.PI / 180;
        if (fn === 'grayscale' || fn === 'sepia') v = Math.min(1, v);
        const m = _filterMatrix(fn, v);
        if (m) ops.push(m);
    });
    const d = g.getImageData(0, 0, w, h), px = d.data;
    for (let i = 0; i < px.length; i += 4) {
        if (!px[i + 3]) continue;
        let r = px[i], gg = px[i + 1], b = px[i + 2];
        for (const m of ops) {
            const nr = m[0] * r + m[1] * gg + m[2] * b + m[9], ng = m[3] * r + m[4] * gg + m[5] * b + m[9], nb = m[6] * r + m[7] * gg + m[8] * b + m[9];
            r = nr < 0 ? 0 : (nr > 255 ? 255 : nr); gg = ng < 0 ? 0 : (ng > 255 ? 255 : ng); b = nb < 0 ? 0 : (nb > 255 ? 255 : nb);
        }
        px[i] = r; px[i + 1] = gg; px[i + 2] = b;
    }
    g.putImageData(d, 0, 0);
}
// Devuelve el sprite con el filtro CSS aplicado (cacheado). Si aún no ha cargado devuelve el original.
function filteredSprite(img, filter) {
    if (!filter || filter === 'none' || !img || !img.width) return img;
    let m = _filterCache.get(img);
    if (!m) { m = {}; _filterCache.set(img, m); }
    if (m[filter]) return m[filter];
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    try {
        if (CANVAS_FILTER_OK) { g.filter = filter; g.drawImage(img, 0, 0); }
        else { g.drawImage(img, 0, 0); _applyFilterManually(g, c.width, c.height, filter); }
    } catch (e) { g.filter = 'none'; g.drawImage(img, 0, 0); }
    return (m[filter] = c);
}
// Dibuja con el filtro que haya en ctx.filter (puesto por los Gears) usando la caché
function takeCtxFilter(c) {
    const f = c.filter;
    if (f && f !== 'none') c.filter = 'none';
    return (f && f !== 'none') ? f : null;
}

// === Carga de imágenes bajo demanda ===
// Cada ruta se descarga y decodifica una sola vez (varios frames y enemigos comparten archivos).
const IMG_CACHE = {};
function loadImg(path) {
    let img = IMG_CACHE[path];
    if (img) return img;
    img = IMG_CACHE[path] = new Image();
    img.decoding = 'async';
    img.src = path;
    return img;
}

// --- SPRITE IMAGE LOADING ---
const IMG = {};
const SPRITE_PATHS = {
    player: 'assets/sprites/player.png',
    marine: 'assets/sprites/marine.png',
    shooter: 'assets/sprites/shooter.png',
    pacifista: 'assets/sprites/pacifista.png',
    krieg: 'assets/sprites/krieg.png',
    zoro: 'assets/sprites/zoro.png',
    sanji: 'assets/sprites/sanji.png',
    objetos: 'assets/sprites/objetos.png',
    baratieMap: 'assets/maps/baratie.jpg',
    alabastaMap: 'assets/maps/alabasta.jpg',
    skypieaMap: 'assets/maps/skypiea.jpg',
    thrillerbarkMap: 'assets/maps/thrillerbark.jpg',
    enieslobbyMap: 'assets/maps/enieslobby.jpg',
    marinefordMap: 'assets/maps/marineford.jpg',
    wholecakeMap: 'assets/maps/wholecake.jpg',
    wanoMap: 'assets/maps/wano.jpg',
    water7Map: 'assets/maps/water7.jpg',
    saber_flyingslash: 'assets/extracted/objetos_gba/sprite_030.png',
    saber_poundho: 'assets/extracted/objetos_gba/sprite_025.png',
    bomb: 'assets/extracted/objetos_gba/sprite_034.png',
    strawhat: 'assets/extracted/objetos_gba/sprite_035.png',
    // objetos del suelo (source-art/dibujar_objetos_suelo.py)
    pk_meat: 'assets/sprites/pickups/meat.png',
    pk_magnet: 'assets/sprites/pickups/magnet.png',
    pk_bell: 'assets/sprites/pickups/bell.png',
    pk_denden: 'assets/sprites/pickups/denden.png',
    pk_beli: 'assets/sprites/pickups/beli.png',
    chest_t0: 'assets/sprites/chests/chest_t0.png',
    chest_t1: 'assets/sprites/chests/chest_t1.png',
    chest_t2: 'assets/sprites/chests/chest_gold_t2.png'
};
let assetsLoaded = false;
let assetsToLoad = Object.keys(SPRITE_PATHS).length;

// --- ENEMY ANIMATIONS ---
const ENEMY_ANIMS = {
    grunt: { folder: 'marine_gba', idle: [2,3,4], attack: [19] },
    elite_marine: { folder: 'marine_gba', idle: [2,3,4], attack: [19] },
    shooter: { folder: 'marine2_gba', idle: [2,3,4,5,6,7], attack: [9,10] },
    elite_shooter: { folder: 'marine2_gba', idle: [2,3,4,5,6,7], attack: [9,10] },
    pacifista: { folder: 'morgan_gba', idle: [0,1,2,3], attack: [29] },
    morgan: { folder: 'morgan_gba', idle: [0,1,2,3], attack: [29] },
    elite_kuma: { folder: 'morgan_gba', idle: [0,1,2,3], attack: [29] },
    boss_krieg: { folder: 'krieg_gba', idle: [0,1,2,3,4], attack: [17,19] },
    boss_crocodile: { folder: 'crocodile', idle: [0, 1, 2, 3, 4, 5, 6, 7], attack: [8, 9, 10, 11], faces: 1 },
    boss_enel: { folder: 'enel', idle: [0, 1, 2, 1], attack: [4, 5, 6, 7], faces: 1 },
    // Enies Lobby: CP9 (DS Gigant Battle)
    boss_lucci: { folder: 'lucci', idle: [0, 1], attack: [2, 3, 4, 5], faces: 1 },
    kaku: { folder: 'kaku', idle: [0, 1, 2, 3], attack: [4, 5, 6, 7], faces: 1 },
    spandam: { folder: 'spandam', idle: [0, 1, 2], attack: [3, 4, 5], faces: 1 },
    // Water 7: Franky y el CP9 infiltrado en Galley-La (DS Gigant Battle)
    boss_franky: { folder: 'franky', idle: [0, 1], attack: [2, 3, 4, 5], faces: 1 },
    lucci_human: { folder: 'lucci_human', idle: [0, 1, 2, 3], attack: [4], faces: 1 },
    // Marineford: los tres Almirantes (DS Gigant Battle)
    boss_akainu: { folder: 'akainu', idle: [0, 1, 2, 3, 4, 5], attack: [6, 7, 8, 9], faces: 1 },
    aokiji: { folder: 'aokiji', idle: [0, 1, 2, 3, 4, 5, 6], attack: [7, 8, 9, 10], faces: 1 },
    kizaru: { folder: 'kizaru', idle: [0, 1], attack: [2, 3, 4], faces: 1 },
    // Wano (3DS Great Pirate Colosseum): asalto a Onigashima
    boss_kaido: { folder: 'kaido', idle: [0, 1], attack: [2] },
    drake: { folder: 'drake', idle: [0, 1], attack: [2], faces: -1 },
    hawkins: { folder: 'hawkins', idle: [0, 1], attack: [2], faces: 1 },
    kanjuro: { folder: 'kanjuro', idle: [0, 1], attack: [2, 3], faces: -1 },
    ink_bird: { folder: 'ink_bird', idle: [0, 1, 2], attack: [3], faces: 1 },
    // Wano: las Tres Calamidades y los Tobiroppo (sprites de fans en estilo Gigant Battle; ver SPRITES_SOURCES.md)
    king: { folder: 'king', idle: [0, 1, 2, 3], attack: [4, 5], faces: 1 },
    queen: { folder: 'queen', idle: [0, 1], attack: [2, 3] },
    jack: { folder: 'jack', idle: [0, 1], attack: [2, 3] },
    ulti: { folder: 'ulti', idle: [0, 1], attack: [2, 3], faces: -1 },
    page_one: { folder: 'page_one', idle: [0, 1], attack: [2, 3] },
    sasaki: { folder: 'sasaki', idle: [0, 1], attack: [2, 3] },
    black_maria: { folder: 'black_maria', idle: [0, 1], attack: [2, 3] },
    // Whole Cake: soldados de ajedrez (dibujados por código), la familia Charlotte y Big Mom
    chess_soldier: { folder: 'chess_soldier', idle: [0, 1, 2, 3], attack: [4, 5], faces: 1 },
    chess_soldier_b: { folder: 'chess_soldier_b', idle: [0, 1, 2, 3], attack: [4, 5], faces: 1 },
    tamago: { folder: 'tamago', idle: [0, 1], attack: [2, 3] },
    pekoms: { folder: 'pekoms', idle: [0, 1], attack: [2, 3], faces: 1 },
    smoothie: { folder: 'smoothie', idle: [0, 1], attack: [2, 3] },
    katakuri: { folder: 'katakuri', idle: [0, 1], attack: [2, 3], faces: 1 },
    boss_bigmom: { folder: 'bigmom', idle: [0, 1, 2, 3], attack: [4, 5] },
    // Baratie (GBA One Piece), Alabasta (WonderSwan Color / DS) y Skypiea (DS / 3DS reescalados)
    krieg_pirate: { folder: 'krieg_pirate', idle: [0, 1, 2, 3, 4, 5], attack: [6, 7, 8], faces: 1 },
    krieg_gunner: { folder: 'krieg_gunner', idle: [0, 1, 2, 3, 4, 5], attack: [6, 7], faces: -1 },
    krieg_bomber: { folder: 'krieg_bomber', idle: [0, 0, 2, 3, 4], attack: [5, 6], faces: -1 },
    pearl: { folder: 'pearl', idle: [0, 1], attack: [2, 3] },
    gin: { folder: 'gin', idle: [0, 1, 2, 3], attack: [4, 5, 6, 7] },
    dugong: { folder: 'dugong', idle: [0, 1, 2], attack: [3] },
    mr5: { folder: 'mr5', idle: [0, 1, 2, 3], attack: [4, 5] },
    miss_valentine: { folder: 'miss_valentine', idle: [0, 1, 2, 3], attack: [4, 5, 6] },
    mr4: { folder: 'mr4', idle: [0, 1, 2, 2, 4, 5], attack: [6, 7, 8, 9] },
    miss_merry: { folder: 'miss_merry', idle: [0, 1, 2, 3], attack: [4, 5, 6] },
    miss_doublefinger: { folder: 'miss_doublefinger', idle: [0, 1, 2, 3, 4, 5], attack: [6, 7] },
    mr1: { folder: 'mr1', idle: [0, 1, 2, 3, 4, 5], attack: [6, 7, 8, 9], faces: 1 },
    mr2: { folder: 'mr2', idle: [0, 1, 2, 3, 4, 5], attack: [6, 7, 8, 9], faces: 1 },
    shandia: { folder: 'shandia', idle: [0, 1, 2], attack: [3, 4], faces: -1 },
    shandia_gunner: { folder: 'shandia_gunner', idle: [0, 1, 2], attack: [3] },
    satori: { folder: 'satori', idle: [0, 1], attack: [2] },
    shura: { folder: 'shura', idle: [0, 1, 2, 3], attack: [4] },
    gedatsu: { folder: 'gedatsu', idle: [0, 1], attack: [2, 3], faces: 1 },
    ohm: { folder: 'ohm', idle: [0, 1], attack: [2, 3] },
    wiper: { folder: 'wiper', idle: [0, 1, 2, 3], attack: [4] },
    boss_moria: { folder: 'moria', idle: [0, 1, 0, 3], attack: [4, 5, 4, 7] },
    kuma: { folder: 'kuma', idle: [0,1,2,3], attack: [4,5,6,7] },
    moria: { folder: 'moria', idle: [0, 1, 0, 3], attack: [4, 5, 4, 7] },
    tararan: { folder: 'tararan', idle: [0, 1, 2, 3], attack: [4, 1, 2, 3] },
    elite_tararan: { folder: 'tararan', idle: [0, 1, 2, 3], attack: [4, 1, 2, 3] },
    hogback: { folder: 'hogback', idle: [0, 1, 2, 1], attack: [4, 5, 6, 5] },
    elite_hogback: { folder: 'hogback', idle: [0, 1, 2, 1], attack: [4, 5, 6, 5] },
    cindry: { folder: 'cindry', idle: [0, 1, 0, 3], attack: [4, 5, 4, 7] },
    elite_cindry: { folder: 'cindry', idle: [0, 1, 0, 3], attack: [4, 5, 4, 7] },
    pellona: { folder: 'pellona', idle: [0, 1, 2, 1], attack: [4, 5, 6, 5] },
    elite_pellona: { folder: 'pellona', idle: [0, 1, 2, 1], attack: [4, 5, 6, 5] },
    ryuma: { folder: 'ryuma', idle: [0, 1, 2, 1], attack: [4, 5, 6, 5] },
    elite_ryuma: { folder: 'ryuma', idle: [0, 1, 2, 1], attack: [4, 5, 6, 5] },
    inupen: { folder: 'inupen', idle: [0, 1, 0, 3], attack: [4, 5, 4, 5] },
    elite_inupen: { folder: 'inupen', idle: [0, 1, 0, 3], attack: [4, 5, 4, 5] },
    kumashi: { folder: 'kumashi', idle: [0, 1, 0, 3], attack: [4, 5, 4, 7] },
    elite_kumashi: { folder: 'kumashi', idle: [0, 1, 0, 3], attack: [4, 5, 4, 7] },
    absalom: { folder: 'absalom', idle: [0, 1, 2, 3], attack: [4, 5, 6, 5] },
    elite_absalom: { folder: 'absalom', idle: [0, 1, 2, 3], attack: [4, 5, 6, 5] },
    // Ampliación de bestiario (GBA One Piece / WSC Treasure Wars 2)
    krieg_starved: { folder: 'krieg_starved', idle: [0, 1, 2, 3, 4, 5], attack: [6, 7, 8], faces: 1 },
    krieg_knife: { folder: 'krieg_knife', idle: [0, 1, 2, 3], attack: [4, 5, 6], faces: 1 },
    marine_sword: { folder: 'marine_sword', idle: [0, 1, 2, 3], attack: [4, 5, 6, 7], faces: 1 },
    jango: { folder: 'jango', idle: [0, 1, 2, 3, 4, 5, 6, 7], attack: [8, 9, 10], faces: 1 },
    fullbody: { folder: 'fullbody', idle: [0, 1, 2, 3], attack: [4, 5, 6], faces: -1 },
    tashigi: { folder: 'tashigi', idle: [0, 1, 2, 3, 4], attack: [5, 6, 7, 8], faces: 1 }
};
const ENEMY_IMG = new Proxy({}, {
    get(t, type) {
        if (typeof type !== 'string') return t[type];
        if (!(type in t)) { const set = (typeof ENEMY_ANIMS !== 'undefined') && buildEnemyImages(type); if (set) t[type] = set; }
        return t[type];
    }
});
// === Iconos SVG (sin emojis, estilo línea profesional) ===
const SVG = (inner) => `<svg viewBox="0 0 24 24" class="op-ico" aria-hidden="true">${inner}</svg>`;
const S = 'stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const F = 'fill="currentColor" stroke="none"';
const ICONS = {
    // armas
    pistol:      SVG(`<g ${S}><path d="M2 14.5c1.6-2.2 2.6 2.2 4.2 0s2.6 2.2 4.2 0"/></g><g ${F}><rect x="10.8" y="8.2" width="10.4" height="9.6" rx="2.6"/></g><path d="M14.2 8.6v4.2M17.6 8.6v4.2M11.4 13.4h4.4" stroke="#000" stroke-opacity=".35" stroke-width="1.3" fill="none" stroke-linecap="round"/>`),
    gatling:     SVG(`<g ${F}><rect x="13" y="2.6" width="7.4" height="6" rx="2"/><rect x="15" y="9.2" width="7.4" height="6" rx="2"/><rect x="12" y="15.6" width="7.4" height="6" rx="2"/></g><g ${S}><path d="M2.5 5.6h8M4.5 12.2h8.5M2 18.6h8" opacity=".6"/></g>`),
    bazooka:     SVG(`<g ${F}><path d="M13.4 3.2h4.4a2 2 0 0 1 2 2v4.4h-6.4zM13.4 14.4h6.4v4.4a2 2 0 0 1-2 2h-4.4z"/><rect x="20.4" y="3.6" width="2" height="5.4" rx="1"/><rect x="20.4" y="15" width="2" height="5.4" rx="1"/></g><g ${S}><path d="M2.5 6.4c3 0 5 1 10.9 0M2.5 17.6c3 0 5-1 10.9 0"/><path d="M5 12h6" opacity=".55"/></g>`),
    gear2:       SVG(`<g ${S}><path d="M7 20.5c-2-2.2 1.6-3.6-.4-6.2s1.4-4-.2-6.6M12 21c-2-2.6 1.8-4.2-.2-7s1.6-4.6-.2-7.6M17 20.5c-2-2.2 1.6-3.6-.4-6.2s1.4-4-.2-6.6"/></g><g ${F}><circle cx="6.6" cy="4.6" r="1.7" opacity=".7"/><circle cx="11.8" cy="3.2" r="2" opacity=".85"/><circle cx="16.6" cy="4.6" r="1.7" opacity=".7"/></g>`),
    zoroform:    SVG(`<g ${S}><path d="M5 21 17.5 8.5M3.5 17.5 14 7M9 22l11-11" opacity=".55"/></g><g ${F}><path d="M12 1.8c1.2 2.4 3.6 3.4 3.6 6.2a3.6 3.6 0 0 1-7.2 0c0-1.4.8-2.4 1.6-3.2.2 1.2.8 1.8 1.6 2 .2-1.8-.2-3.4.4-5z"/><rect x="9.6" y="12.4" width="4.8" height="2.4" rx=".6"/><path d="M11 14.8h2v7.4h-2z"/></g>`),
    sanjiform:   SVG(`<g ${F}><path d="M6.5 2.5h4.2l1.4 9.6 6.8 5.2c.8.6 1.1 1.4 1.1 2.4V21H9.6c-2.3 0-4.1-1.8-4.1-4.1z"/></g><g ${S}><path d="M17 3.5c1.6 1.4 2.6 3 1.4 5.4M20.6 6.6c.6 1.4.2 2.8-.8 3.8M14.2 6c.8.8 1 1.8.4 2.8"/></g>`),
    santoryu:    SVG(`<g ${S}><path d="M4 20 20 4M8.5 20 20 8.5M4 15.5 15.5 4"/><path d="M2.6 19.4h3.2M20.9 3.1 18 4.8M3.2 14.3l1.4-1.4"/></g>`),
    onigiri:     SVG(`<g ${S}><path d="M8.5 21.5 19 3M13 21.5 21.5 6"/><path d="M3 18.5h6M2.2 13.6H7" opacity=".55"/></g>`),
    flyingslash: SVG(`<g ${F}><path d="M20.5 3.5C13 4.8 5.2 11.8 3.2 19.6l3.2 1C8.4 14.4 14.4 8.6 20.8 7l-.3-3.5z"/></g>`),
    diablejambe: SVG(`<g ${F}><path d="M12 2C9.4 7 5 9.2 5 13.8A6.99 6.99 0 0 0 19 13.8C19 9.2 14.6 7 12 2z" fill-rule="evenodd"/><path d="M12 20.5a3.3 3.3 0 0 1-3.3-3.3c0-2 2-3.2 3.3-4.7 1.3 1.5 3.3 2.7 3.3 4.7A3.3 3.3 0 0 1 12 20.5z" fill="#000" opacity=".25"/></g>`),
    collier:     SVG(`<g ${F}><path d="M7.5 3h4.4v8.2l6.3 4.6c.9.7 1.3 1.5 1.3 2.6V21H9.3C6.6 21 4.5 18.9 4.5 16.3V3z"/></g>`),
    joueshot:    SVG(`<g ${F}><path d="M8.6 12.4 15 4.5l2.3 1.8-5.6 7.5 4.6 2.7-1.4 4.2L4.6 14.6z"/></g><g ${S}><path d="M3 8h4.5M2 12h3" opacity=".6"/></g>`),
    muchi:       SVG(`<g ${S}><path d="M4 6c6 0 10 2 12 6 1.4 2.8-1 5-3.2 3.6-4-2.6-6.4-2-9.4 1.4"/><circle cx="4.4" cy="5.6" r="2" fill="currentColor" stroke="none"/><circle cx="4" cy="17.6" r="1.6" fill="currentColor" stroke="none"/></g>`),
    ono:         SVG(`<g ${F}><path d="M5 2.5 9 2l3.6 9.2 2.6 6.4c.5 1.2 1.8 1.6 3 1.6h1.6v2.6h-6.2c-1.4 0-2.4-.6-2.9-1.9L7.4 12z"/></g><g ${S}><path d="M2.5 21.5h7M20.5 15l1.6-1.8M17.5 13.5l.4-2.4" opacity=".6"/></g>`),
    tatsumaki:   SVG(`<g ${S}><path d="M12 3.5c4.5 0 7 2.2 7 4.6 0 2.6-2.8 3.6-5.5 3-2.2-.5-3.8.4-3.4 2 .3 1.2 2 1.6 3.4 1"/><path d="M18.5 12.5c1.5 1.5 1.2 3.8-1 4.4"/><path d="M5 20.5h9"/><path d="M7.5 18.5c-1.4.8-2.3 1.2-3 2" opacity=".6"/></g>`),
    poundho:     SVG(`<g ${S}><path d="M3 7h9M2 12h11M3 17h9"/><path d="M12 4c6.5 0 9 4 9 8s-2.5 8-9 8M12 8c4.2 0 6 1.8 6 4s-1.8 4-6 4" opacity=".75"/><circle cx="3.4" cy="12" r="1.6" fill="currentColor" stroke="none"/></g>`),
    concasse:    SVG(`<g ${S}><path d="M12 2.5 15 8l-3 2-3-2zM5.5 12.5 12 10l6.5 2.5M3.5 20h17"/><path d="M12 20.5v-3" opacity=".6"/><path d="M9 15.5h6" opacity=".8"/></g>`),
    partycourse: SVG(`<g ${S}><circle cx="12" cy="12" r="7"/><path d="M12 5a7 7 0 0 1 5 11.7" stroke-width="2.4"/><circle cx="12" cy="5.2" r="1.8" fill="currentColor" stroke="none"/><circle cx="17" cy="16.5" r="1.8" fill="currentColor" stroke="none"/><circle cx="7" cy="16.5" r="1.8" fill="currentColor" stroke="none"/></g>`),
    cuchillo:    SVG(`<g ${F}><path d="M21 3c-2.4.4-8.2 4.6-11.6 8.6l3 3C16.4 11.2 20.6 5.4 21 3z"/><path d="M8.2 12.8 11.2 15.8 9.8 17.2 6.8 14.2z"/><path d="M7.4 16.6 3.2 20.8l1.4 1.4 4.2-4.2z"/></g>`),
    granada:     SVG(`<g ${F}><circle cx="11" cy="14.5" r="6.5"/><rect x="9" y="5.6" width="4" height="3" rx=".8"/></g><g ${S}><path d="M13 6.4c1.6-2.4 3.4-2.8 5-1.8"/><path d="M19.6 2.4v1.6M21.6 4.6H20M20.8 3.2l1-1" stroke-width="1.6"/></g><path d="M8 12.6a3.4 3.4 0 0 1 3-2.4" stroke="#fff" stroke-opacity=".45" stroke-width="1.5" fill="none" stroke-linecap="round"/>`),
    rifle:       SVG(`<g ${F}><path d="M2 14.6 5.2 12H10l1.2-1.2h10.6v1.8H13l-1.4 2.2H8.6L6 17.4H2.6z"/><rect x="11.8" y="8.6" width="3.6" height="1.6" rx=".6"/><path d="M9.4 15h1.6l-.4 2.2H9z"/></g>`),
    ballesta:    SVG(`<g ${S}><path d="M4.5 8.5c4-4 11-4 15 0M4.5 8.5 12 12.5l7.5-4"/><path d="M12 4v17" stroke-width="2.4"/><path d="M9.5 6.2 12 2.5l2.5 3.7" /></g><g ${F}><rect x="10.6" y="15" width="2.8" height="6.5" rx="1"/></g>`),
    lanza:       SVG(`<g ${S}><path d="M3 21 15.4 8.6" stroke-width="2.2"/><path d="M6.4 16.2 7.8 17.6" /></g><g ${F}><path d="M14 7.2C16 4.6 19 3 21.4 2.6c-.4 2.4-2 5.4-4.6 7.4z"/><path d="M13.2 9.2 12 7.4l1.4-1 1.4 1.4zM14.8 10.8l1.8 1.2 1-1.4-1.4-1.4z" opacity=".8"/></g>`),
    hacha:       SVG(`<g ${S}><path d="M7 21.5 14.6 5.4" stroke-width="2.3"/></g><g ${F}><path d="M12.8 3.4c2.6-1.4 6.6-.6 8.4 2-1 .8-1.4 2.6-.8 4.4-2.6.8-5.8-.4-7.8-2.6l-.8-.4z"/></g>`),
    shuriken:    SVG(`<g ${F}><path fill-rule="evenodd" d="M12 1.5 14 10l8.5 2-8.5 2-2 8.5-2-8.5-8.5-2L10 10zM12 10.4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"/></g>`),
    hakiPulse:   SVG(`<g ${F}><path d="M7.6 14.4h8.8l-.8-4.4-2.2 1.8L12 8l-1.4 3.8L8.4 10z"/></g><g ${S}><path d="M4.4 17.6a9 9 0 0 1 0-11.2M19.6 6.4a9 9 0 0 1 0 11.2" /><path d="M1.8 20.2a12.6 12.6 0 0 1 0-16.4M22.2 3.8a12.6 12.6 0 0 1 0 16.4" opacity=".5"/></g>`),
    meat:        SVG(`<g ${F}><path d="M13.6 3.4c3.6-.6 7 2.4 6.6 6.4-.4 3.4-3.6 5.4-6.6 5.2l-3.4 3.4.2.2a2 2 0 1 1-2.8 2.8 2 2 0 1 1-2.8-2.8 2 2 0 1 1 2.8-2.8l.2.2 3.4-3.4c-.6-3.6 0-8.6 2.4-9.2z"/></g><path d="M14.4 6.6c1.6-.2 3 .6 3.4 2" stroke="#fff" stroke-opacity=".45" stroke-width="1.4" fill="none" stroke-linecap="round"/>`),
    drop:        SVG(`<g ${F}><path d="M12 2.5c3 4.4 6.5 8 6.5 12a6.5 6.5 0 0 1-13 0c0-4 3.5-7.6 6.5-12z"/></g><path d="M9 15a3 3 0 0 0 2.6 3" stroke="#fff" stroke-opacity=".45" stroke-width="1.5" fill="none" stroke-linecap="round"/>`),
    dodge:       SVG(`<g ${F}><circle cx="15" cy="4.6" r="2.2"/><path d="M13.6 8 10 11.6l2.6 2.4-1.8 6.4h2.4l2.4-7.4-1.8-2 2.2-2 2.4 1.6 1.2-1.6-3.6-2.6z"/></g><g ${S}><path d="M2.5 9h5M2 13.5h5.5M3 18h4.5" opacity=".55"/></g>`),
    // pasivas
    power:       SVG(`<g ${S}><path d="M12 3l8 3v6c0 5-3.4 7.4-8 9-4.6-1.6-8-4-8-9V6z"/><path d="M12 7.5 13.4 11 17 11.2 14.2 13.6 15.2 17.1 12 15 8.8 17.1 9.8 13.6 7 11.2 10.6 11z" fill="currentColor" stroke="none"/></g>`),
    crit:        SVG(`<g ${S}><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3"/><path d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3"/></g>`),
    cd:          SVG(`<g ${S}><path d="M6.5 3h11v4l-4 5 4 5v4h-11v-4l4-5-4-5z"/><path d="M9 20.5h6" opacity=".5"/></g>`),
    armor:       SVG(`<g ${S}><path d="M12 3l7 2.8v5.6C19 17 15.6 19.6 12 21 8.4 19.6 5 17 5 11.4V5.8z"/><path d="M9 11.5h6M9 8.5h6" opacity=".55"/></g>`),
    haki_buso:   SVG(`<g ${S}><path d="M12 3l7 2.8v5.6C19 17 15.6 19.6 12 21 8.4 19.6 5 17 5 11.4V5.8z"/><path d="M12 7v9" opacity=".6"/><path d="M8.6 10.4 15.4 10.4" opacity=".6"/></g>`),
    haki_ken:    SVG(`<g ${S}><path d="M2.2 12S5.8 5.6 12 5.6 21.8 12 21.8 12 18.2 18.4 12 18.4 2.2 12 2.2 12z"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/></g>`),
    haki_hao:    SVG(`<g ${F}><path d="M2.8 19h18.4l-1.6-9.4-4.9 3.9L12 5.2 9.3 13.5 4.4 9.6z"/></g><g ${S}><path d="M4 21.5h16" opacity=".5"/></g>`),
    area:        SVG(`<g ${S}><circle cx="12" cy="12" r="8" stroke-dasharray="3.2 2.6"/><circle cx="12" cy="12" r="3.4"/><circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none"/></g>`),
    speed:       SVG(`<g ${S}><path d="M3 8h9.5M3 12.5h13M3 17h8"/><path d="M14 5.5a4 4 0 0 1 6.5 3.2c0 2.5-2.2 3.8-4.2 3.8H13l3.5 2.7" /></g>`),
    pickup:      SVG(`<g ${S}><path d="M6.5 4v6a5.5 5.5 0 0 0 11 0V4"/><path d="M6.5 4v3M4 4h5M13 4h5M17.5 4v3"/></g>`),
    growth:      SVG(`<g ${S}><path d="M4 21V14M9.5 21V10M15 21V7M20.5 21V4"/></g><path ${F} d="M13 2.5h7v7l-2.5-2.6-2 2-2-2z"/>`),
    luck:        SVG(`<g ${F}><circle cx="7" cy="8.5" r="3"/><circle cx="13.5" cy="7.5" r="3"/><circle cx="10" cy="13" r="3"/><path d="M11 16c-1 2.5-1 4 .5 6l2-1.2c-1.2-1.5-1.2-2.7-.6-4.4z"/></g><g ${S}><path d="M9.5 13.6C12 11 15 9.5 19 9" opacity=".0"/></g>`),
    // meta-tienda
    heart:       SVG(`<g ${F}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></g>`),
    coin:        SVG(`<g ${S}><circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M9.5 9.5h5M9.5 14.5h5" stroke-width="1.6"/></g>`),
    skull:       SVG(`<g ${S}><path d="M12 3a7 7 0 0 0-7 7c0 2.6 1.4 4.4 3.2 5.4V18h7.6v-2.6C17.6 14.4 19 12.6 19 10a7 7 0 0 0-7-7z"/><circle cx="9.5" cy="9.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="14.5" cy="9.5" r="1.3" fill="currentColor" stroke="none"/><path d="M10 13.5h4" opacity=".6"/></g>`),
    dice:        SVG(`<g ${S}><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.6" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.6" fill="currentColor" stroke="none"/></g>`),
    fastforward: SVG(`<g ${F}><path d="M5 5v14l7-7zM12 5v14l7-7z"/></g>`),
    trash:       SVG(`<g ${S}><path d="M5 7h14M9 7V4.5h6V7M7 7l1 12h8l1-12"/><path d="M10 10.5v6M14 10.5v6" opacity=".6"/></g>`),
    revive:      SVG(`<g ${S}><path d="M12 3 14.4 8 20 8.8 15.8 13 17 19 12 16 7 19 8.2 13 4 8.8 9.6 8z"/></g>`),
    // interfaz
    play:    SVG(`<path ${F} d="M8 5.2v13.6L19 12z"/>`),
    sound:   SVG(`<g ${F}><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z"/><path d="M15 8.6a4.6 4.6 0 0 1 0 6.8M17.6 6.2a8 8 0 0 1 0 11.6" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/></g>`),
    muted:   SVG(`<g ${F}><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z"/><path d="m15.5 9.5 5 5m0-5-5 5" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/></g>`),
    gauge:   SVG(`<g ${S}><path d="M5 19a8 8 0 1 1 14 0"/><path d="M12 19 16 12" stroke-width="2.6"/></g><circle ${F} cx="12" cy="19" r="1.6"/>`),
    full:    SVG(`<g ${S}><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></g>`),
    pad:     SVG(`<g ${S}><path d="M6.5 9h11a4.5 4.5 0 0 1 4.4 5.4l-.6 3.1a2.3 2.3 0 0 1-4 .95L15.6 16h-7.2l-1.7 2.4a2.3 2.3 0 0 1-4-1l-.6-3A4.5 4.5 0 0 1 6.5 9z"/><path d="M8 12v2M7 13h2M15.5 12.2h.01M17.5 13.8h.01" stroke-width="2"/></g>`),
    home:    SVG(`<g ${F}><path d="M12 3 3 10.5 4.6 12l.4-.4V20h5v-5h4v5h5v-8.4l.4.4L21 10.5z"/></g>`),
    cart:    SVG(`<g ${S}><path d="M3 4h2.4l2.5 11.2A2.8 2.8 0 0 0 10.6 17h7.9a2.8 2.8 0 0 0 2.7-2.2L22.3 8H6"/><circle cx="10.5" cy="20" r="1.4" fill="currentColor" stroke="none"/><circle cx="18.5" cy="20" r="1.4" fill="currentColor" stroke="none"/></g>`),
    ship:    SVG(`<g ${F}><path d="M3 14h18l-2.6 4.8A3 3 0 0 1 15.8 20H8.2a3 3 0 0 1-2.6-1.5z"/><path d="M11 12V3l6.5 9z"/><path d="M11 4 6 12h5z" opacity=".7"/></g>`),
    dune:    SVG(`<g ${S}><path d="M2 18c2.5-5 5-6 7.5-1.5M9.5 18C12 11 16.5 10 22 18"/><path d="M2 18h20" stroke-width="2.4"/><circle cx="17" cy="5.5" r="2.6"/><path d="M5.5 6.5 6.6 3.8 7.7 6.5 4.6 4.7 8 4.7 4.6 6.5 8 8.3 4.6 8.3 7.7 6.5" opacity=".0" fill="currentColor"/></g>`),
    cloud:   SVG(`<g ${F}><path d="M7.5 18.5a4.4 4.4 0 0 1-.3-8.8 5.4 5.4 0 0 1 10.2-1.4A4.1 4.1 0 0 1 17 18.5z"/><path d="M12 13.2l-2.4 3.9h1.8l-1.1 3 4.3-4.8h-2l1.5-2.1z" fill="#fff" opacity=".55"/></g>`),
    hat:     SVG(`<g ${S}><circle cx="12" cy="9" r="5"/><path d="M8.5 9.5h7" stroke-width="2.2"/><path d="M2 16.5c2.2-2.6 5.8-4.3 10-4.3s7.8 1.7 10 4.3c-2 3-6.2 4.5-10 4.5s-8-1.5-10-4.5z" fill="currentColor" stroke="none"/></g>`),
    lock:    SVG(`<g ${S}><rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/><circle cx="12" cy="15.2" r="1.4" fill="currentColor" stroke="none"/></g>`),
    unlock:  SVG(`<g ${S}><rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 6.8-1.2"/><circle cx="12" cy="15.2" r="1.4" fill="currentColor" stroke="none"/></g>`),
    up:      SVG(`<g ${S}><path d="M12 20V5"/><path d="m6 10.5 6-6 6 6"/></g>`),
    clock:   SVG(`<g ${S}><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></g>`),
    gear:    SVG(`<g ${S}><circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2.1 2.1M15.9 15.9L18 18M18 6l-2.1 2.1M8.1 15.9L6 18"/></g>`),
    pauseIco: SVG(`<g ${F}><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></g>`)
};
// Inyecta iconos SVG en los placeholders estáticos del DOM
document.querySelectorAll('[data-ico]').forEach(el => { el.innerHTML = ICONS[el.getAttribute('data-ico')] || ''; });
const ELITE_INFO = {
    elite_marine:  { name: { baratie: 'Sargento de la Marina', alabasta: 'Agente Millions (Baroque Works)', skypiea: 'Guardia Divina', thrillerbark: 'Marine Zombi' } },
    elite_shooter: { name: { baratie: 'Fusilero de Élite', alabasta: 'Billions Armado', skypiea: 'Guardia Divina de Élite', thrillerbark: 'Fusilero Zombi' } },
    elite_kuma:    { name: { baratie: 'PX-0 Bartholomew Kuma', alabasta: 'Mr. 4 y Lassoo', skypiea: 'Coloso de Nube', thrillerbark: 'Pacifista' } },
    morgan:        { name: { baratie: 'Capitán Morgan, el Pez-Hacha', alabasta: 'Capitana Tashigi (G-5)', skypiea: 'Comandante Celestial', thrillerbark: 'Capitán Morgan' } },
    elite_tararan: { name: { baratie: 'Tararan, la Araña Bestia', alabasta: 'Bananawani', skypiea: 'Bestia de la Montaña del Trueno', thrillerbark: 'Tararan, la Araña Bestia' } },
    elite_inupen:  { name: { baratie: 'Inuppen, Sargento Zombi', alabasta: 'Inuppen Zombie', skypiea: 'Inuppen Zombie', thrillerbark: 'Inuppen, Sargento Zombi' } },
    elite_kumashi: { name: { baratie: 'Kumashi, Guardián Zombi', alabasta: 'Guardián de Alabasta', skypiea: 'Sacerdote Gedatsu', thrillerbark: 'Kumashi, Guardián Zombi' } },
    elite_hogback: { name: { baratie: 'Dr. Hogback', alabasta: 'Mr. 3 Galdino', skypiea: 'Sacerdote Satori', thrillerbark: 'Dr. Hogback' } },
    elite_cindry:  { name: { baratie: 'Cindry, la Sirvienta Zombi', alabasta: 'Miss Wednesday (Vivi)', skypiea: 'Dama de la Nube', thrillerbark: 'Cindry, la Sirvienta Zombi' } },
    elite_pellona: { name: { baratie: 'Perona la Fantasma', alabasta: 'Miss Doublefinger (Zala)', skypiea: 'Sacerdotisa Aisa', thrillerbark: 'Perona la Fantasma' } },
    elite_ryuma:   { name: { baratie: 'Ryuma del Norte', alabasta: 'Mr. 1 — Daz Bones', skypiea: 'Wyper, Guerrero Shandia', thrillerbark: 'Ryuma del Norte' } },
    elite_absalom: { name: { baratie: 'Absalom, el Hombre-Mutante', alabasta: 'Capitán Billions', skypiea: 'Sacerdote Shura', thrillerbark: 'Absalom, el Hombre-Mutante' } },
    // élites de relleno (raras) y oficiales con nombre (always: siempre salen como élite)
    krieg_pirate:   { name: { all: 'Pirata Veterano de Krieg' } },
    krieg_gunner:   { name: { all: 'Tirador Veterano de Krieg' } },
    krieg_bomber:   { name: { all: 'Bombardero de Krieg' } },
    dugong:         { name: { all: 'Maestro Dugongo Kung-fu' } },
    shandia:        { name: { all: 'Guerrero Shandia Veterano' } },
    shandia_gunner: { name: { all: 'Bazuquero Shandia' } },
    mr5:            { always: true, name: { all: 'Mr. 5 — Bomu Bomu' } },
    miss_valentine: { always: true, name: { all: 'Miss Valentine — Kilo Kilo' } },
    mr4:            { always: true, name: { all: 'Mr. 4 y Lassoo' } },
    miss_merry:     { always: true, name: { all: 'Miss Merry Christmas — Mogu Mogu' } },
    miss_doublefinger: { always: true, name: { all: 'Miss Doublefinger — Toge Toge' } },
    satori:         { always: true, name: { all: 'Satori, Sacerdote del Bosque' } },
    shura:          { always: true, name: { all: 'Shura, Sacerdote del Cielo' } },
    gedatsu:        { always: true, name: { all: 'Gedatsu, Sacerdote del Pantano' } },
    jango:          { always: true, name: { all: 'Jango el Hipnotizador' } },
    fullbody:       { always: true, name: { all: 'Teniente Fullbody, Puño de Hierro' } },
    tashigi:        { always: true, name: { all: 'Sargento Mayor Tashigi' } },
    krieg_knife:    { name: { water7: 'Matón de la Familia Franky', wano: 'Gifter de las Bestias', all: 'Malabarista Veterano de Krieg' } },
    marine_sword:   { name: { baratie: 'Cabo de Fullbody', alabasta: 'Cabo de Smoker', all: 'Cabo de la Marina' } },
    sky_shark:      { name: { all: 'Tiburón del Cielo Gigante' } },
    spandam:        { always: true, name: { all: 'Spandam y Funkfreed' } },
    kanjuro:        { always: true, name: { all: 'Kurozumi Kanjuro — Fude Fude no Mi' } },
    ulti:           { always: true, name: { all: 'Ulti — Tobiroppo, Ryu Ryu no Mi: Paquicefalosaurio' } },
    page_one:       { always: true, name: { all: 'Page One — Tobiroppo, Ryu Ryu no Mi: Espinosaurio' } },
    sasaki:         { always: true, name: { all: 'Sasaki — Tobiroppo, Ryu Ryu no Mi: Triceratops' } },
    black_maria:    { always: true, name: { all: 'Black Maria — Tobiroppo, Kumo Kumo no Mi' } },
    tamago:         { always: true, name: { all: 'Barón Tamago — Tama Tama no Mi' } },
    pekoms:         { always: true, name: { all: 'Pekoms — Mink de los Piratas de Big Mom' } },
    chess_soldier:  { name: { all: 'Caballero de Ajedrez' } }
};
function eliteName(type) { const i = ELITE_INFO[type]; return i ? (i.name[selectedMap] || i.name.all || i.name.baratie) : null; }
const MINIBOSS_INFO = { moria: 'Gekko Moria — Shichibukai', kuma: 'Bartholomew Kuma — Shichibukai', morgan: 'Capitán Morgan, el Pez-Hacha', absalom: 'Absalom — Los Cuatro Misteriosos', pacifista: 'Capitán de la Marina',
    pearl: 'Pearl, el Muro de Hierro — Flota de Krieg', gin: 'Gin, el Demonio — Flota de Krieg', mr2: 'Mr. 2 Bon Clay — Mane Mane', mr1: 'Mr. 1 Daz Bones — Supa Supa', wiper: 'Wiper, el Guerrero Shandia', ohm: 'Ohm, Sacerdote del Infierno',
    kaku: 'Kaku — CP9, Ushi Ushi no Mi: Jirafa', spandam: 'Spandam — Jefe del CP9',
    lucci_human: 'Rob Lucci — CP9 infiltrado en Galley-La',
    aokiji: 'Almirante Aokiji — Hie Hie no Mi', kizaru: 'Almirante Kizaru — Pika Pika no Mi',
    drake: 'X Drake — Tobiroppo, Ryu Ryu no Mi: Alosaurio', hawkins: 'Basil Hawkins — Headliner, Wara Wara no Mi',
    jack: 'Jack la Sequía — Calamidad, Zou Zou no Mi: Mamut', queen: 'Queen la Plaga — Calamidad, Ryu Ryu no Mi: Braquiosaurio',
    king: 'King el Incendio — Calamidad, Ryu Ryu no Mi: Pteranodon',
    smoothie: 'Charlotte Smoothie — Comandante Dulce, Shibo Shibo no Mi', katakuri: 'Charlotte Katakuri — Comandante Dulce, Mochi Mochi no Mi' };
const BOSS_INFO = { boss_krieg: 'Don Krieg — Flota Pirata de Krieg', boss_crocodile: 'Sir Crocodile — Baroque Works', boss_enel: 'Enel, el Dios del Trueno', boss_moria: 'Gekko Moria — Shichibukai', boss_lucci: 'Rob Lucci — CP9, Neko Neko no Mi: Leopardo', boss_akainu: 'Almirante Akainu — Magu Magu no Mi', boss_franky: 'Cutty Flam, Franky — Familia Franky', boss_kaido: 'Kaido de las Bestias — Yonko', boss_bigmom: 'Charlotte Linlin, Big Mom — Yonko, Soru Soru no Mi' };
// VS: la vida del boss escala por etapa/mapa
const BOSS_HP = { boss_krieg: 6500, boss_crocodile: 9500, boss_enel: 10500, boss_moria: 11000, boss_lucci: 12000, boss_akainu: 14000, boss_franky: 8000, boss_bigmom: 17000, boss_kaido: 20000 };

// === Balance global (referencia: Vampire Survivors, ajustado con simulaciones de bot) ===
// Cambia aquí la dificultad sin tocar la lógica.
const BALANCE = {
    contactMult: 1.0,     // daño por contacto = daño del enemigo x esto (por segundo); antes 0.8
    hpGrowth: 1.27,        // multiplicador de vida enemiga por minuto (continuo); 1.32 antes de las tasas de botín de VS
    minSpawnInterval: 0.07, // intervalo mínimo entre spawns (s); antes 0.04
    firstEventAt: 120,    // primer evento de oleada (s); antes 70
    maxEnemies: 300,      // tope de enemigos vivos (VS usa ~300): el spawn normal espera si se llega
    shooterCd: 3.0,       // segundos entre disparos de cada fusilero (antes 2.3)
    bulletDmg: 9,         // daño por bala (antes 14)
    meatHeal: 30,         // muslo de carne = Floor Chicken de VS (+30 HP)
    enemyMeat: 0.03,      // probabilidad de muslo al morir un enemigo normal (VS: 0; con 0 el bot cae a 4/9/28)
    minSpawnDist: 300     // los spawns recolocados dentro de arenas cerradas nunca caen encima del jugador
};
// === Economía (Berries) — referencia Vampire Survivors ===
// En VS el oro sale sobre todo de braseros, cofres y la Moneda de oro al tenerlo todo (25);
// los enemigos normales casi nunca sueltan monedas. Antes una partida de 13 min daba más de 100k,
// el 70% de la «Bolsa de Berries» (75 + 25 x nivel por subida con todo al máximo).
const ECONOMY = {
    enemyChance: 0.04, enemyCoin: 5,    // moneda suelta de un enemigo normal
    propCoin: 10,                        // 3 monedas por brasero/barril
    avalanche: [15, 20],                 // monedas de jefe/Shichibukai: 15 + rand x 20 cada una
    chestBase: [20, 50, 100],            // cofre bronce / plata / oro: base + rand x base
    bag: 25,                             // subida de nivel sin nada que mejorar (VS Gold Coin); x2 en cofre
    endlessBoss: 300                     // cada jefe del Modo Infinito
};
// Multiplicador de Berries: Avaricia x Clima Peligroso x dificultad del mapa (raíz de hpMult relativo: Wano x1.5;
// las islas difíciles ya pagan más porque traen más élites y Shichibukai)
function beliScale() { return player.greedBonus * (player.runBeliMult || 1) * Math.sqrt(Math.max(1, (mapEnemies().hpMult || 0.72) / 0.72)); }
function enemyHpScale() { return Math.pow(BALANCE.hpGrowth, gameTime / 60) * player.curse * (mapEnemies().hpMult || 1); }
// === Enemigos por mapa (contexto de cada arco) ===
// Estadísticas base de cada tipo: [vida, velocidad, daño]. La vida se multiplica por hpScale.
const ENEMY_STATS = {
    grunt: [32, 78, 16], shooter: [48, 62, 22], pacifista: [300, 46, 40], kuma: [150, 50, 28], moria: [200, 40, 30],
    tararan: [80, 66, 20], hogback: [90, 50, 24], cindry: [120, 48, 22], pellona: [110, 54, 24], ryuma: [130, 48, 26],
    inupen: [40, 74, 14], kumashi: [100, 60, 20], absalom: [120, 45, 24],
    // Mismos papeles que los marines de relleno para no mover el balance medido:
    // raso = grunt, tirador = shooter, bruto = pacifista. Los oficiales con nombre van siempre como élite.
    krieg_pirate: [32, 78, 16], krieg_gunner: [48, 62, 22], krieg_bomber: [300, 46, 40],
    dugong: [32, 82, 16], mr5: [110, 52, 24], miss_valentine: [90, 60, 20], mr4: [160, 42, 28], miss_merry: [100, 66, 20], miss_doublefinger: [120, 54, 26],
    shandia: [32, 78, 16], shandia_gunner: [48, 62, 22], satori: [130, 48, 24], shura: [120, 58, 26], gedatsu: [140, 46, 28],
    // Bestiario ampliado: cada tipo tiene un papel (enjambre, embestida, bruto, kamikaze, fantasma)
    krieg_starved: [16, 96, 10], krieg_knife: [40, 70, 18], marine_sword: [44, 70, 18], jango: [140, 56, 22], fullbody: [170, 50, 30],
    tashigi: [150, 64, 26], tama: [20, 80, 22], sky_shark: [46, 66, 20], negative_hollow: [14, 96, 3],
    kaku: [150, 60, 28], spandam: [110, 54, 22], aokiji: [200, 50, 32], kizaru: [180, 70, 30], lucci_human: [190, 62, 32],
    kanjuro: [120, 58, 24], ink_bird: [26, 100, 14], drake: [210, 56, 34], hawkins: [190, 52, 32],
    ulti: [180, 64, 30], page_one: [170, 60, 30], sasaki: [190, 54, 32], black_maria: [200, 48, 30],
    jack: [260, 46, 36], queen: [260, 42, 36], king: [240, 60, 36],
    // Whole Cake: piezas blancas = raso, piezas negras = embestida (como el pirata del cuchillo)
    chess_soldier: [32, 78, 16], chess_soldier_b: [40, 70, 18], tamago: [150, 52, 26], pekoms: [170, 56, 28],
    smoothie: [210, 52, 32], katakuri: [230, 62, 36]
};
// Comportamientos (estilo VS: murciélagos en zigzag, cargas, bombas que estallan):
//  zigzag   avanza ondulando; ghost además atraviesa los muros de la arena
//  charge   cada pocos segundos embiste en línea recta a x3 de velocidad
//  explode  al tocarte estalla (daño de golpe) y desaparece sin dar experiencia
//  hollow   Horo Horo: te deprime (lentitud 40% 2 s) en vez de hacer mucho daño
//  hypno    Jango: "Uno, dos... ¡Jango!" te duerme a medias (lentitud 60% 1,2 s) cada 7 s
const ENEMY_BEHAVIOR = {
    krieg_starved: 'zigzag', negative_hollow: 'hollow', krieg_knife: 'charge', sky_shark: 'charge',
    tama: 'explode', jango: 'hypno', ink_bird: 'zigzag', chess_soldier_b: 'charge'
};
// Tiradores: disparan balas (ver BALANCE.shooterCd / bulletDmg)
const ENEMY_RANGED = new Set(['shooter', 'krieg_gunner', 'shandia_gunner']);
// Élite ocasional de los tipos de relleno: [probabilidad, x vida, x daño, x velocidad]
const FODDER_ELITE = {
    krieg_pirate: [0.008, 9, 2, 0.8], krieg_gunner: [0.008, 9, 2, 1.2], krieg_bomber: [0.01, 6, 2, 0.9],
    dugong: [0.008, 9, 2, 0.8], shandia: [0.008, 9, 2, 0.8], shandia_gunner: [0.008, 9, 2, 1.2],
    chess_soldier: [0.008, 9, 2, 0.8]
};
// pool: se recorre en orden; el primero con min <= minuto y azar < p gana. Si ninguno, sale 'base'.
// minibosses: aparecen una vez por partida en su minuto. boss: jefe final del minuto 8.
// events: tipos de las oleadas sorpresa (anillo, carga y corredores) y sus carteles.
const MAP_ENEMIES = {
    baratie: {
        hpMult: 0.72, // dificultad del mapa (vida enemiga)
        // Flota de Don Krieg: piratas de espada, de pistola y de bomba; Pearl y Gin como minijefes
        base: 'krieg_pirate',
        pool: [
            { type: 'fullbody', min: 5, p: 0.012 }, { type: 'jango', min: 4, p: 0.024 }, { type: 'krieg_bomber', min: 3, p: 0.12 },
            { type: 'krieg_knife', min: 2, p: 0.20 }, { type: 'marine_sword', min: 4, p: 0.27 }, { type: 'krieg_gunner', min: 1, p: 0.40 },
            { type: 'krieg_starved', min: 0, p: 0.55 }
        ],
        minibosses: [ { type: 'pearl', min: 3, hp: 600, speed: 40, damage: 28 }, { type: 'gin', min: 6, hp: 800, speed: 52, damage: 32 } ],
        boss: 'boss_krieg',
        events: { ring: 'krieg_pirate', charge: 'krieg_gunner', runners: 'krieg_starved', swarm: 'krieg_starved', ringText: '¡EMBOSCADA DE LA FLOTA DE KRIEG!', chargeText: '¡CARGAN LOS TIRADORES DE KRIEG!' }
    },
    alabasta: {
        hpMult: 0.74, // dificultad del mapa (vida enemiga)
        // Dugongos kung-fu del desierto, fusileros de la Marina de Smoker y los agentes de Baroque Works
        base: 'dugong',
        pool: [
            { type: 'miss_doublefinger', min: 5, p: 0.03 }, { type: 'mr4', min: 4, p: 0.06 }, { type: 'miss_merry', min: 4, p: 0.09 },
            { type: 'miss_valentine', min: 2, p: 0.12 }, { type: 'mr5', min: 2, p: 0.15 }, { type: 'tashigi', min: 3, p: 0.165 },
            { type: 'shooter', min: 1, p: 0.38 }, { type: 'marine_sword', min: 2, p: 0.52 }
        ],
        minibosses: [ { type: 'mr2', min: 3, hp: 700, speed: 50, damage: 30 }, { type: 'mr1', min: 5, hp: 850, speed: 46, damage: 34 } ],
        boss: 'boss_crocodile',
        events: { ring: 'dugong', charge: 'marine_sword', runners: 'dugong', swarm: 'dugong', ringText: '¡EMBOSCADA DE BAROQUE WORKS!', chargeText: '¡CARGA DE LA MARINA DE SMOKER!' }
    },
    skypiea: {
        hpMult: 0.73, // dificultad del mapa (vida enemiga)
        // Guerreros shandia y los sacerdotes de Enel; Wiper y Ohm como minijefes
        base: 'shandia',
        pool: [
            { type: 'gedatsu', min: 4, p: 0.04 }, { type: 'shura', min: 3, p: 0.08 }, { type: 'satori', min: 2, p: 0.12 },
            { type: 'sky_shark', min: 3, p: 0.17 }, { type: 'shandia_gunner', min: 1, p: 0.38 }, { type: 'tama', min: 2, p: 0.46 }
        ],
        minibosses: [ { type: 'wiper', min: 3, hp: 750, speed: 50, damage: 30 }, { type: 'ohm', min: 5, hp: 900, speed: 44, damage: 34 } ],
        boss: 'boss_enel',
        events: { ring: 'shandia', charge: 'shandia_gunner', runners: 'sky_shark', swarm: 'tama', ringText: '¡EMBOSCADA SHANDIA!', chargeText: '¡CARGAN LOS GUERREROS DE LAS NUBES!' }
    },
    thrillerbark: {
        hpMult: 0.90, // dificultad del mapa (vida enemiga)
        base: 'inupen',
        pool: [
            { type: 'ryuma', min: 6, p: 0.07 }, { type: 'absalom', min: 5, p: 0.14 }, { type: 'pellona', min: 5, p: 0.21 },
            { type: 'cindry', min: 4, p: 0.30 }, { type: 'hogback', min: 3, p: 0.40 }, { type: 'kumashi', min: 3, p: 0.50 },
            { type: 'tararan', min: 2, p: 0.65 }, { type: 'negative_hollow', min: 1, p: 0.71 }
        ],
        minibosses: [ { type: 'absalom', min: 4, hp: 650, speed: 45, damage: 30 }, { type: 'kuma', min: 6, hp: 800, speed: 45, damage: 35 } ],
        boss: 'boss_moria',
        events: { ring: 'kumashi', charge: 'tararan', runners: 'inupen', swarm: 'negative_hollow', ringText: '¡HORDA DE ZOMBIS!', chargeText: '¡CARGAN LOS ZOMBIS DE MORIA!' }
    },
    enieslobby: {
        hpMult: 1.00, // dificultad del mapa (vida enemiga)
        // Los marines y la guardia de Enies Lobby; Spandam con Funkfreed y Kaku del CP9; Rob Lucci de jefe
        base: 'grunt',
        pool: [
            { type: 'spandam', min: 3, p: 0.02 }, { type: 'tashigi', min: 4, p: 0.04 }, { type: 'fullbody', min: 2, p: 0.06 },
            { type: 'shooter', min: 1, p: 0.30 }, { type: 'marine_sword', min: 0, p: 0.52 }
        ],
        minibosses: [ { type: 'kaku', min: 3, hp: 750, speed: 52, damage: 32 }, { type: 'spandam', min: 6, hp: 650, speed: 50, damage: 26 } ],
        boss: 'boss_lucci',
        events: { ring: 'grunt', charge: 'marine_sword', runners: 'grunt', swarm: 'marine_sword', ringText: '¡LA GUARDIA DE ENIES LOBBY TE RODEA!', chargeText: '¡CARGAN LOS 10.000 MARINES!' }
    },
    water7: {
        hpMult: 0.94, // dificultad del mapa (vida enemiga)
        // Familia Franky (piratas de relleno) en el muelle; Kaku y Lucci se quitan la máscara de Galley-La; Franky de jefe
        base: 'krieg_pirate',
        pool: [
            { type: 'krieg_bomber', min: 3, p: 0.10 }, { type: 'krieg_knife', min: 1, p: 0.20 },
            { type: 'krieg_gunner', min: 1, p: 0.36 }, { type: 'krieg_starved', min: 0, p: 0.52 }
        ],
        minibosses: [ { type: 'kaku', min: 3, hp: 650, speed: 52, damage: 30 }, { type: 'lucci_human', min: 6, hp: 800, speed: 58, damage: 34 } ],
        boss: 'boss_franky',
        events: { ring: 'krieg_pirate', charge: 'krieg_gunner', runners: 'krieg_starved', swarm: 'krieg_starved', ringText: '¡LA FAMILIA FRANKY TE RODEA!', chargeText: '¡CARGAN LOS MATONES DE FRANKY!' }
    },
    marineford: {
        hpMult: 1.00, // dificultad del mapa (vida enemiga)
        // La Guerra en la Cumbre: marines, oficiales de la Marina; Aokiji y Kizaru de minijefes, Akainu de jefe
        base: 'grunt',
        pool: [
            { type: 'tashigi', min: 3, p: 0.04 }, { type: 'fullbody', min: 2, p: 0.08 },
            { type: 'shooter', min: 1, p: 0.32 }, { type: 'marine_sword', min: 0, p: 0.55 }
        ],
        minibosses: [ { type: 'aokiji', min: 3, hp: 800, speed: 46, damage: 32 }, { type: 'kizaru', min: 6, hp: 850, speed: 62, damage: 34 } ],
        boss: 'boss_akainu',
        events: { ring: 'grunt', charge: 'marine_sword', runners: 'grunt', swarm: 'marine_sword', ringText: '¡EL CERCO DE LA MARINA SE CIERRA!', chargeText: '¡CARGAN LOS VICEALMIRANTES!' }
    },
    wholecake: {
        hpMult: 1.30, // dificultad del mapa (vida enemiga): entre Marineford y Wano
        // Tottoland: los soldados de ajedrez de Big Mom, Pekoms y el Barón Tamago; Smoothie y Katakuri de minijefes
        base: 'chess_soldier',
        pool: [
            { type: 'tamago', min: 3, p: 0.03 }, { type: 'pekoms', min: 2, p: 0.06 },
            { type: 'chess_soldier_b', min: 1, p: 0.36 }
        ],
        minibosses: [ { type: 'smoothie', min: 3, hp: 850, speed: 50, damage: 34 }, { type: 'katakuri', min: 6, hp: 1000, speed: 62, damage: 36 } ],
        boss: 'boss_bigmom',
        events: { ring: 'chess_soldier', charge: 'chess_soldier_b', runners: 'chess_soldier_b', swarm: 'chess_soldier', ringText: '¡LOS SOLDADOS DE AJEDREZ TE RODEAN!', chargeText: '¡CARGAN LAS PIEZAS NEGRAS!' }
    },
    wano: {
        hpMult: 1.60, // dificultad del mapa (vida enemiga): el más difícil
        // Asalto a Onigashima: piratas de las Bestias y los dibujos de tinta del traidor Kanjuro;
        // los Tobiroppo como élites; X Drake, Hawkins y las Tres Calamidades (Jack, Queen y King) de minijefes, Kaido de jefe
        base: 'krieg_pirate',
        pool: [
            { type: 'ulti', min: 2, p: 0.012 }, { type: 'page_one', min: 2, p: 0.024 },
            { type: 'sasaki', min: 3, p: 0.036 }, { type: 'black_maria', min: 4, p: 0.048 },
            { type: 'kanjuro', min: 3, p: 0.07 }, { type: 'krieg_knife', min: 1, p: 0.22 },
            { type: 'krieg_gunner', min: 1, p: 0.36 }, { type: 'ink_bird', min: 0, p: 0.54 }
        ],
        minibosses: [ { type: 'jack', min: 2, hp: 850, speed: 46, damage: 34 }, { type: 'drake', min: 3, hp: 850, speed: 50, damage: 34 },
            { type: 'queen', min: 4, hp: 950, speed: 42, damage: 36 }, { type: 'hawkins', min: 5, hp: 900, speed: 48, damage: 34 },
            { type: 'king', min: 6, hp: 1050, speed: 60, damage: 38 } ],
        boss: 'boss_kaido',
        events: { ring: 'krieg_pirate', charge: 'krieg_knife', runners: 'ink_bird', swarm: 'ink_bird', ringText: '¡LOS PIRATAS DE LAS BESTIAS TE RODEAN!', chargeText: '¡CARGAN LOS GIFTERS!' }
    }
};
// Escala de dibujo por tipo: los sprites extraídos vienen a tamaños muy distintos.
// Tararan (207x158 px) se reduce a ~75x57 para quedar a la altura de Hogback/Kumashi (~55-80 px).
const ENEMY_DRAW_SCALE = { tararan: 0.36, elite_tararan: 0.36, tama: 1.25, sky_shark: 1.5, negative_hollow: 1.3, king: 0.62 };
function mapEnemies() { return MAP_ENEMIES[selectedMap] || MAP_ENEMIES.baratie; }
function makeEnemy(type, x, y, hpScale, extra) {
    const st = ENEMY_STATS[type] || ENEMY_STATS.grunt;
    const speed = type === 'grunt' ? st[1] + Math.random() * 22 : st[1];
    return Object.assign({ x, y, type, hp: st[0] * hpScale, maxHp: st[0] * hpScale, speed, damage: st[2], animIndex: 0, animTimer: 0, animState: 'idle', attackTimer: 0, isElite: false, damageTaken: 1 }, extra || {});
}
function enemyPath(folder, idx) {
    return 'assets/extracted/' + folder + '/sprite_' + String(idx).padStart(3,'0') + '.png';
}
// Los sprites de cada enemigo se cargan la primera vez que se piden (ENEMY_IMG[tipo]).
// Así solo se descargan los del mapa que se juega (prefetchRun) y no los ~60 tipos al abrir el juego.
function buildEnemyImages(type) {
    const cfg = ENEMY_ANIMS[type];
    if (!cfg || !cfg.folder) return null;
    return {
        idle: (cfg.idle || []).map(idx => loadImg(enemyPath(cfg.folder, idx))),
        attack: (cfg.attack || []).map(idx => loadImg(enemyPath(cfg.folder, idx)))
    };
}

// === Enemigos dibujados por código (no hay hojas de sprites de ellos) ===
// Tama de Satori (bola de nube con sorpresa), Tiburón del Cielo del Mar Blanco y Negative Hollow de Perona.
function procEnemyFrames(w, h, n, draw) {
    const out = [];
    for (let i = 0; i < n; i++) {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d'); g.imageSmoothingEnabled = false; draw(g, i);
        c.complete = true; out.push(c);
    }
    return out;
}
function px(g, col, x, y, w, h) { g.fillStyle = col; g.fillRect(x, y, w, h); }
(function buildProcEnemies() {
    const tama = (g, i) => {
        const bob = i % 2;
        px(g, '#cbd5e1', 6, 9 + bob, 20, 16); px(g, '#f8fafc', 4, 11 + bob, 24, 12); px(g, '#ffffff', 8, 7 + bob, 16, 18);
        px(g, '#e2e8f0', 9, 21 + bob, 14, 3);
        // bola ("tama") con la cara de sorpresa de Satori
        px(g, '#0f172a', 11, 13 + bob, 3, 3); px(g, '#0f172a', 18, 13 + bob, 3, 3);
        px(g, '#ef4444', 14, 18 + bob, 4, 2);
        if (i === 2) { px(g, '#f97316', 13, 3, 6, 4); px(g, '#facc15', 15, 1, 2, 3); }
    };
    const shark = (g, i) => {
        const t = i % 2 ? 1 : 0;
        px(g, '#64748b', 6, 10, 30, 10); px(g, '#94a3b8', 8, 16, 26, 5); px(g, '#e2e8f0', 10, 18, 20, 3);
        px(g, '#475569', 18, 4, 6, 6); px(g, '#475569', 0, 7 - t, 7, 6); px(g, '#475569', 0, 17 + t, 7, 5);
        px(g, '#0f172a', 32, 12, 2, 2); px(g, '#ffffff', 30, 19, 6, 2);
        px(g, '#f8fafc', 4, 24, 34, 4); px(g, '#cbd5e1', 10, 27, 22, 2);
        if (i === 2) { px(g, '#7f1d1d', 32, 18, 6, 3); }
    };
    const hollow = (g, i) => {
        const w = i % 2;
        g.globalAlpha = 0.9;
        px(g, '#f1f5f9', 7, 5, 16, 16); px(g, '#e2e8f0', 5, 9, 20, 10);
        px(g, '#f8fafc', 7, 21, 4, 4 + w); px(g, '#f8fafc', 13, 21, 4, 5 - w); px(g, '#f8fafc', 19, 21, 4, 4 + w);
        g.globalAlpha = 1;
        px(g, '#0f172a', 10, 10, 3, 4); px(g, '#0f172a', 17, 10, 3, 4);
        px(g, '#1e293b', 12, 16, 6, 2); px(g, '#ec4899', 14, 3, 2, 2);
    };
    ENEMY_IMG.tama = { idle: procEnemyFrames(32, 30, 2, tama), attack: procEnemyFrames(32, 30, 3, tama).slice(2) };
    ENEMY_IMG.sky_shark = { idle: procEnemyFrames(40, 30, 2, shark), attack: procEnemyFrames(40, 30, 3, shark).slice(2) };
    ENEMY_IMG.negative_hollow = { idle: procEnemyFrames(30, 28, 2, hollow), attack: [] };
    ENEMY_ANIMS.sky_shark = { faces: 1 }; ENEMY_ANIMS.tama = {}; ENEMY_ANIMS.negative_hollow = {};
})();

// --- CHARACTER SELECTION & ANIMATION ---
let selectedCharacter = 'luffy';
let selectedMap = 'baratie';
function selectMap(id) {
    if (mapLocked(id)) { playSound('muted'); return; }
    playSound('ui');
    selectedMap = id;
    prefetchRun(id, selectedCharacter);
    const names = { baratie: 'Baratie', alabasta: 'Alabasta', skypiea: 'Skypiea', thrillerbark: 'Thriller Bark', enieslobby: 'Enies Lobby', marineford: 'Marineford', water7: 'Water 7', wholecake: 'Whole Cake', wano: 'Wano' };
    document.getElementById('map-selected').innerText = 'Mapa: ' + names[id];
    document.querySelectorAll('#map-select .map-btn').forEach(b => b.classList.toggle('selected', b.dataset.map === id));
}
// VS: las etapas se desbloquean por logros — aquí, venciendo al boss del mapa anterior
function mapLocked(id) {
    // Todos los mapas abiertos. Para bloquear uno en desarrollo: return id === '<mapa>';
    return false;
}
// === CLIMA PELIGROSO (rango de Maldición 0-4, estilo VS) ===
// Más peligro (enemigos/HP/velocidad) a cambio de más Beli en la singlatura.
let runCurseRank = 0;
function selectCurse(n) {
    // VS: cada dificultad se desbloquea venciendo la anterior
    if (n > meta.curseUnlocked) {
        playSound('muted');
        showAchToast('CLIMA PELIGROSO ' + n + ' — VENCE EL CLIMA ' + (n - 1) + ' PARA DESBLOQUEARLO');
        return;
    }
    runCurseRank = n;
    playSound('ui');
    document.querySelectorAll('#curse-select .curse-btn').forEach(b => b.classList.toggle('selected', b.dataset.curse === String(n)));
    const desc = document.getElementById('curse-desc');
    if (desc) {
        const extras = [];
        if (n >= 2) extras.push('oleadas frecuentes');
        if (n >= 3) extras.push('2º Shichibukai');
        if (n >= 4) extras.push('boss doble');
        desc.innerText = '+' + (n * 25) + '% Berries · +' + (n * 25) + '% peligro' + (extras.length ? ' · ' + extras.join(' · ') : '');
    }
}
function applyRunCurse() {
    if (!player) return;
    player.curse += 0.25 * runCurseRank;
    player.runBeliMult = 1 + 0.25 * runCurseRank;
    // Clima 2+: las oleadas sorpresa empiezan antes
    window.nextEventAt = (runCurseRank >= 2) ? 55 : 70;
    applyRunMode(); // Modo Haki / Inverso (js/modes.js)
}
// toggle de solo la musica del menu (batalla sigue con su propio slider en OPCIONES)
function toggleMenuMusic() {
    windowOpts.menuMusicMuted = !windowOpts.menuMusicMuted;
    saveOpts();
    updateMenuMusicBtn();
    updateMusic();
}
function updateMenuMusicBtn() {
    const ico = document.getElementById('menu-music-ico');
    if (ico) ico.innerHTML = windowOpts.menuMusicMuted ? ICONS.muted : ICONS.sound;
    const l = document.getElementById('menu-music-label');
    if (l) l.innerText = windowOpts.menuMusicMuted ? 'OFF' : 'ON';
}
const CHAR_SKILLS = {
    luffy: ['pistol','gatling','bazooka','gear2','muchi','ono'],
    zoro: ['santoryu','onigiri','flyingslash','tatsumaki','poundho','zoroform'],
    sanji: ['diablejambe','collier','joueshot','concasse','partycourse','sanjiform'],
    // Tripulación desbloqueable (estilo VS: arma inicial propia + bonificación; el resto del arsenal es compartido)
    nami: ['climatact'], usopp: ['kabuto'], chopper: ['roseo'], robin: ['clutch']
};

// Animation frame indices within assets/extracted/<char>_gba/
// Adjust these numbers to change which sprite is used for each action.
const CHAR_ANIMS = {
    luffy: { name: 'Luffy', idle: [0,1,2,3,4], walk: [10,11,12], attack: [57,58,59,60], hit: [178,179,180,181], balloon: [278,279,280,281,282,283], death: [178,179,180,181] },
    zoro:  { name: 'Zoro',  idle: [0], walk: [0,1,2,3], attack: [15,16,18,19,21,22], hit: [15] },
    sanji: { name: 'Sanji', idle: [0], walk: [51,52,53,54], attack: [10], hit: [15] },
    // WonderSwan Color "Swan Colosseum" (espejados para mirar a la izquierda como los de GBA)
    nami:    { name: 'Nami',    folder: 'nami_wsc',    idle: [0,1,2,3,4,5], walk: [6,7,8,9,10,11,12,13], attack: [14,15,16,17], hit: [0] },
    usopp:   { name: 'Usopp',   folder: 'usopp_wsc',   idle: [0], walk: [1,2,3,4,5,6,7], attack: [8,9,10,11], hit: [0] },
    chopper: { name: 'Chopper', folder: 'chopper_wsc', idle: [0,1,2,3], walk: [4,5,6,7,8,9], attack: [10,11,12,13], hit: [0] },
    robin:   { name: 'Robin',   folder: 'robin_wsc',   idle: [0,1,2], walk: [3,4,5,6,7,8,9], attack: [10,11,12,13,14], hit: [0] }
};

function animPath(char, idx) {
    const folder = (CHAR_ANIMS[char] && CHAR_ANIMS[char].folder) || (char + '_gba');
    return 'assets/extracted/' + folder + '/sprite_' + String(idx).padStart(3, '0') + '.png';
}

const CHAR_PORTRAIT = {
    luffy: 'assets/wanted/luffy.jpg',
    zoro: 'assets/wanted/zoro.jpg',
    sanji: 'assets/wanted/sanji.jpg',
    nami: 'assets/wanted/nami.jpg', usopp: 'assets/wanted/usopp.jpg', chopper: 'assets/wanted/chopper.jpg', robin: 'assets/wanted/robin.jpg'
};
function updateHudPortrait() {
    const img = document.getElementById('hud-portrait');
    if (img) img.src = CHAR_PORTRAIT[selectedCharacter] || CHAR_PORTRAIT.luffy;
    const name = document.getElementById('hud-name');
    if (name) name.innerText = CHAR_FULLNAME[selectedCharacter] || '';
}
// Nombre completo como aparece en los carteles de Se Busca
const CHAR_FULLNAME = { luffy: 'MONKEY D. LUFFY', zoro: 'RORONOA ZORO', sanji: 'VINSMOKE SANJI', nami: 'NAMI', usopp: 'GOD USOPP', chopper: 'CHOPPER', robin: 'NICO ROBIN' };
// Cómo se desbloquea cada personaje (se muestra en la carta bloqueada)
const CHAR_LOCK_TEXT = { zoro: 'BLOQUEADO — TIENDA', sanji: 'BLOQUEADO — TIENDA', usopp: 'SOBREVIVE 5 MIN', nami: 'CONQUISTA EL BARATIE', chopper: 'DERROTA 1.500 ENEMIGOS', robin: 'CONQUISTA ALABASTA' };
// Tripulación aún sin kit completo: visible en la selección pero no jugable
const CHAR_COMING_SOON = { nami: true, usopp: true, chopper: true, robin: true };
function selectCharacter(id) {
    if (CHAR_COMING_SOON[id]) { showAchToast('PRÓXIMAMENTE — ' + CHAR_ANIMS[id].name); return; }
    if (!meta.unlocked[id]) {
        showAchToast('PERSONAJE BLOQUEADO — ' + (CHAR_LOCK_TEXT[id] || 'TIENDA'));
        return;
    }
    playSound('ui');
    selectedCharacter = id;
    void CHAR_IMG[id];
    document.getElementById('char-selected').innerText = 'Personaje: ' + CHAR_ANIMS[id].name;
    document.querySelectorAll('#char-select .char-card').forEach(b => b.classList.toggle('selected', b.dataset.char === id));
    updateHudPortrait();
}

// Marca las cartas bloqueadas según la meta-progresión
function refreshCharCards() {
    document.querySelectorAll('#char-select .char-card').forEach(b => {
        const soon = !!CHAR_COMING_SOON[b.dataset.char];
        const unlocked = meta.unlocked[b.dataset.char] && !soon;
        b.classList.toggle('locked', !unlocked);
        b.classList.toggle('soon', soon);
        let overlay = b.querySelector('.char-locked-overlay');
        if (!unlocked && !overlay) {
            overlay = document.createElement('div');
            overlay.className = 'char-locked-overlay';
            overlay.innerHTML = '<span class="char-locked-banner">' + (soon ? 'PRÓXIMAMENTE' : (CHAR_LOCK_TEXT[b.dataset.char] || 'BLOQUEADO')) + '</span>';
            b.appendChild(overlay);
        } else if (unlocked && overlay) {
            overlay.remove();
        }
    });
}

// Preload character animation frames
// Animaciones de cada personaje: se cargan la primera vez que se piden (al elegirlo en el menú)
const CHAR_IMG = new Proxy({}, {
    get(t, key) {
        if (typeof key !== 'string') return t[key];
        if (!(key in t) && CHAR_ANIMS[key]) {
            const cfg = CHAR_ANIMS[key], set = {};
            for (const action of ['idle','walk','attack','hit','death','balloon']) set[action] = (cfg[action] || [0]).map(idx => loadImg(animPath(key, idx)));
            t[key] = set;
        }
        return t[key];
    }
}); // { char: { action: [Image...] } }
function preloadSprites() {
    for (const [key, path] of Object.entries(SPRITE_PATHS)) {
        // los mapas pesan mucho: solo se cargan al elegirlos (ensureMapImage)
        if (/Map$/.test(key)) { IMG[key] = new Image(); continue; }
        const img = new Image();
        img.onload = () => { assetsToLoad--; if (assetsToLoad <= 0) assetsLoaded = true; };
        img.onerror = () => { console.warn('No se pudo cargar', path); assetsToLoad--; if (assetsToLoad <= 0) assetsLoaded = true; };
        img.src = path;
        IMG[key] = img;
    }
}
assetsToLoad = Object.keys(SPRITE_PATHS).filter(k => !/Map$/.test(k)).length;
preloadSprites();
function ensureMapImage(id) {
    const key = id + 'Map', img = IMG[key];
    if (img && !img.getAttribute('src') && SPRITE_PATHS[key]) { img.decoding = 'async'; img.src = SPRITE_PATHS[key]; }
    return img;
}
// Precarga lo que necesita una partida: mapa, personaje y todos los enemigos que nombra MAP_ENEMIES del mapa
function prefetchRun(map, ch) {
    ensureMapImage(map);
    void CHAR_IMG[ch];
    const walk = v => {
        if (typeof v === 'string') { if (ENEMY_ANIMS[v]) void ENEMY_IMG[v]; }
        else if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(MAP_ENEMIES[map]);
}
