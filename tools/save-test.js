// Prueba de exportar/importar partida: exporta en un navegador, importa (código y archivo) en otro limpio
// y comprueba que el progreso llega igual. Rechaza códigos no válidos.
// Uso: python3 -m http.server 8765 & node tools/save-test.js http://localhost:8765/index.html [captura.png]
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path');
const URL_ = process.argv[2] || 'http://localhost:8765/index.html';
(async () => {
    const browser = await chromium.launch();
    const errors = [];
    const open = async (meta) => {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, acceptDownloads: true });
        const page = await ctx.newPage();
        page.on('pageerror', e => errors.push(e.message));
        page.on('dialog', d => d.accept());
        if (meta) await page.addInitScript(m => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('op_survivor_meta', JSON.stringify(m)); sessionStorage.setItem('seeded', '1'); } }, meta);
        await page.goto(URL_);
        await page.waitForFunction(() => typeof startGame === 'function' && assetsLoaded);
        await page.evaluate(() => { const p = document.getElementById('press-start'); if (p) p.remove(); window.playSound = () => {}; });
        return page;
    };
    const META = { beli: 12345, upgrades: { damage: 3 }, unlocked: { luffy: true, zoro: true, usopp: true, map_syrup: true }, achievements: { first_blood: true }, wins: { shelltown: 1 }, gear: { unlocked: 3, forms: {}, up: {} } };
    const a = await open(META);
    await a.evaluate(() => { showOptions(); showSavePanel(); });
    if (process.argv[3]) await a.screenshot({ path: process.argv[3] });
    const code = await a.inputValue('#save-code');
    const SNAP = () => JSON.stringify({ beli: meta.beli, upgrades: meta.upgrades, unlocked: meta.unlocked, achievements: meta.achievements, gear: meta.gear, stats: meta.stats });
    const want = await a.evaluate(SNAP);
    const [dl] = await Promise.all([a.waitForEvent('download'), a.click('text=Descargar archivo')]);
    const file = path.join(os.tmpdir(), 'op-save-test.json'); await dl.saveAs(file);
    const fails = [];
    const check = async (page, how) => {
        await page.waitForFunction(() => typeof meta !== 'undefined' && assetsLoaded);
        const got = await page.evaluate(SNAP);
        const m = JSON.parse(got), ok = got === want && m.upgrades.damage === 3 && m.unlocked.usopp;
        console.log(how, ok ? 'OK' : 'FALLO', '฿' + m.beli); if (!ok) fails.push(how);
    };
    // importar por código
    const b = await open(null);
    await b.evaluate(() => { showOptions(); showSavePanel(); });
    await b.fill('#save-code', code);
    await Promise.all([b.waitForNavigation(), b.click('text=Importar código')]);
    await check(b, 'código');
    // importar por archivo
    const c = await open(null);
    await c.evaluate(() => { showOptions(); showSavePanel(); });
    await Promise.all([c.waitForNavigation(), c.setInputFiles('#save-screen input[type=file]', file)]);
    await check(c, 'archivo');
    // código no válido: no recarga y avisa
    const d = await open(null);
    await d.evaluate(() => { showOptions(); showSavePanel(); });
    await d.fill('#save-code', 'hola');
    await d.click('text=Importar código');
    const msg = await d.textContent('#save-msg');
    const beli = await d.evaluate(() => meta.beli);
    console.log('no válido', msg && beli === 0 ? 'OK' : 'FALLO', msg);
    if (!(msg && beli === 0)) fails.push('no válido');
    console.log(errors.length ? 'Errores JS: ' + errors.join(' | ') : '0 errores JS');
    await browser.close();
    process.exit(fails.length || errors.length ? 1 : 0);
})();
