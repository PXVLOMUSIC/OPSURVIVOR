// Comprueba los atlas: ningún frame suelto de assets/extracted o gears se pide por red,
// todos los frames que usa el juego (personajes, enemigos, Gears, objetos) se recortan con su tamaño real,
// y la Colección pinta sus miniaturas. Lista además todos los archivos pedidos (sirve para la build).
// Uso: python3 -m http.server 8765 & node tools/atlas-test.js http://localhost:8765/index.html
const { chromium } = require('playwright');
const URL_ = process.argv[2] || 'http://localhost:8765/index.html';
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const reqs = new Set(), errors = [];
    page.on('request', r => reqs.add(new URL(r.url()).pathname));
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(URL_);
    await page.waitForFunction(() => typeof startGame === 'function' && assetsLoaded, null, { timeout: 60000 });
    const res = await page.evaluate(async () => {
        const all = [];
        for (const ch of Object.keys(CHAR_ANIMS)) for (const set of Object.values(CHAR_IMG[ch])) all.push(...set);
        for (const t of Object.keys(ENEMY_ANIMS)) { const s = ENEMY_IMG[t]; if (s) for (const v of Object.values(s)) if (Array.isArray(v)) all.push(...v); }
        for (const k of [4, 5, 'chibi']) for (const a of ['idle', 'walk', 'attack']) all.push(...GEAR_SPR[k][a]);
        all.push(GEAR_SPR.fist);
        for (const k of Object.keys(SPRITE_PATHS)) if (!/Map$/.test(k)) all.push(IMG[k]);
        await Promise.all(all.map(imgReady));
        const bad = all.filter(i => !i.complete || !i.width).length;
        // tamaño real frente al índice del atlas
        let mism = 0;
        for (const [p, r] of Object.entries(IMG_CACHE)) { const a = ATLAS_FRAMES[p]; if (a && (r.width !== a[3] || r.height !== a[4])) mism++; }
        showCollection('enemies');
        await new Promise(r => setTimeout(r, 1500));
        const pending = document.querySelectorAll('img[data-thumb]').length;
        return { frames: all.length, bad, mism, pending };
    });
    const loose = [...reqs].filter(p => /assets\/(extracted|sprites\/gears)\//.test(p));
    console.log(JSON.stringify({ ...res, loose: loose.length, errors }, null, 1));
    console.log('Archivos pedidos:', reqs.size);
    await browser.close();
    process.exit(res.bad || res.mism || res.pending || loose.length || errors.length ? 1 : 0);
})();
