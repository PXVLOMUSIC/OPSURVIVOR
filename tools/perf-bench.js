// Benchmark de rendimiento: carga (peticiones, peso, tiempo) y coste por frame en una partida cargada.
// Requisitos: servir el repo (python3 -m http.server 8765) y tener Playwright.
// Uso: node tools/perf-bench.js http://localhost:8765/index.html [personaje] [mapa] [minuto] [throttle CPU] [frames] [calidad]
// Es determinista: Math.random lleva semilla fija, el jugador no muere y elige siempre la primera carta.
const { chromium } = require('playwright');
const URL_ = process.argv[2] || 'http://localhost:8765/index.html';
const CH = process.argv[3] || 'luffy';
const MAP = process.argv[4] || 'thrillerbark';
const MIN = +(process.argv[5] || 6);
const THROTTLE = +(process.argv[6] || 1);
const FRAMES = +(process.argv[7] || 300);
const QUALITY = process.argv[8] || 'high'; // calidad fija para comparar (auto | high | medium | low)

(async () => {
    const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    let reqs = 0, bytes = 0;
    const byType = {};
    cdp.on('Network.loadingFinished', e => { reqs++; bytes += e.encodedDataLength; });
    cdp.on('Network.responseReceived', e => { const t = e.response.mimeType.split('/')[0]; byType[t] = (byType[t] || 0) + 1; });
    await page.addInitScript((q) => {
        let s = 12345;
        Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
        const m = { beli: 0, upgrades: {}, unlocked: { luffy: true, zoro: true, sanji: true, nami: true, usopp: true, chopper: true, robin: true } };
        localStorage.setItem('op_survivor_meta', JSON.stringify(m));
        localStorage.setItem('op_survivor_opts', JSON.stringify({ quality: q }));
        window.__realRAF = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = () => 0;
    }, QUALITY);
    page.on('pageerror', e => console.error('ERR', e.message));
    const t0 = Date.now();
    await page.goto(URL_);
    await page.waitForFunction(() => typeof startGame === 'function' && assetsLoaded, null, { timeout: 120000 });
    const loadMs = Date.now() - t0;
    await page.waitForLoadState('networkidle');
    const menuReqs = reqs, menuBytes = bytes;

    // Arranca la partida y la adelanta hasta el minuto MIN sin dibujar
    await page.evaluate(async ({ ch, map, min }) => {
        window.playSound = () => {}; window.updateMusic = () => {};
        selectedCharacter = ch; selectedMap = map; runCurseRank = 0;
        startGame();
        const pick = sel => { const c = document.querySelector(sel + ' .upgrade-card'); if (c) { c.click(); return true; } return false; };
        window.__step = (dt) => {
            for (let k = 0; k < 20 && gameState !== 'PLAYING'; k++) {
                if (gameState === 'ARCANA') pick('#arcana-options');
                else if (gameState === 'CHEST') closeChestRoulette();
                else if (gameState === 'UPGRADE') { if (!pick('#upgrade-options')) skipUpgrade(); }
                else break;
            }
            player.hp = player.maxHp;
            const a = gameTime * 0.4;
            joystick.active = true; joystick.dx = Math.cos(a); joystick.dy = Math.sin(a);
            update(dt);
        };
        while (gameTime < min * 60 && (gameState === 'PLAYING' || gameState === 'UPGRADE' || gameState === 'ARCANA' || gameState === 'CHEST')) window.__step(1 / 30);
    }, { ch: CH, map: MAP, min: MIN });
    await page.waitForLoadState('networkidle');

    if (THROTTLE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
    // Coste por frame en CPU: update(1/60) + render() (sin leer píxeles, que pasaría el canvas a modo software)
    const r = await page.evaluate(async (frames) => {
        const ms = [], upd = [];
        const onScreen = () => enemies.filter(e => Math.abs(e.x - player.x) < VIEW_W / 2 + 60 && Math.abs(e.y - player.y) < VIEW_H / 2 + 60).length;
        let ent = { enemies: 0, onScreen: 0, particles: 0, attacks: 0, drops: 0, texts: 0 };
        for (let i = 0; i < frames; i++) {
            const a = performance.now();
            window.__step(1 / 60);
            const b = performance.now();
            render();
            ms.push(performance.now() - a); upd.push(b - a);
            if (i === frames >> 1) ent = { enemies: enemies.length, onScreen: onScreen(), particles: particles.length, attacks: activeAttacks.length, drops: drops.length, texts: damageTexts.length };
            if (i % 30 === 0) await new Promise(r => setTimeout(r, 0));
        }
        // FPS real con requestAnimationFrame durante 3 s
        let n = 0; const t0 = performance.now();
        await new Promise(res => { const f = () => { window.__step(1 / 60); render(); n++; if (performance.now() - t0 < 3000) window.__realRAF(f); else res(); }; window.__realRAF(f); });
        const fps = n / ((performance.now() - t0) / 1000);
        const sorted = ms.slice().sort((x, y) => x - y);
        const q = p => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
        const avg = a => a.reduce((s, v) => s + v, 0) / a.length;
        // Memoria de imágenes decodificadas (aprox. ancho*alto*4)
        let imgBytes = 0, imgs = 0; const seen = new Set();
        const walk = o => { if (!o || seen.has(o)) return; seen.add(o); if (o instanceof HTMLImageElement || o instanceof HTMLCanvasElement) { if (o.width) { imgs++; imgBytes += o.width * o.height * 4; } return; } if (Array.isArray(o)) o.forEach(walk); else if (typeof o === 'object') Object.values(o).forEach(walk); };
        [IMG, CHAR_IMG, ENEMY_IMG].forEach(walk);
        return { avg: avg(ms), p50: q(0.5), p95: q(0.95), p99: q(0.99), max: sorted[sorted.length - 1], updAvg: avg(upd), fps, ent,
            heapMB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null, imgs, imgMB: imgBytes / 1048576, level: player.level };
    }, FRAMES);
    const f = x => x.toFixed(2);
    console.log(JSON.stringify({ ch: CH, map: MAP, min: MIN, throttle: THROTTLE, quality: QUALITY,
        load: { ms: loadMs, menuReqs, menuMB: +(menuBytes / 1048576).toFixed(2), totalReqs: reqs, totalMB: +(bytes / 1048576).toFixed(2), byType },
        frame: { avg: f(r.avg), p50: f(r.p50), p95: f(r.p95), p99: f(r.p99), max: f(r.max), update: f(r.updAvg), fps: f(r.fps) },
        ent: r.ent, mem: { heapMB: r.heapMB && +r.heapMB.toFixed(1), imgs: r.imgs, decodedImgMB: +r.imgMB.toFixed(1) }, level: r.level }));
    await browser.close();
})();
