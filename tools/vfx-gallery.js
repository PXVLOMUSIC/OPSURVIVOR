// Galería de efectos: captura cada habilidad aislada (normal y evolucionada) en varios instantes,
// con enemigos quietos alrededor, para revisar animaciones y partículas.
// Requisitos: servir el repo (python3 -m http.server 8765) y tener Playwright.
// Uso: node tools/vfx-gallery.js [carpeta salida] [filtro de ids separado por comas] [calidad high|low]
// Genera una PNG por habilidad: fila superior normal, inferior evolucionada; columnas = instantes.
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2] || 'vfx-gallery';
const FILTER = (process.argv[3] || '').split(',').filter(Boolean);
const QUALITY = process.argv[4] || 'high';
const URL_ = process.env.URL || 'http://localhost:8765/index.html';
const TIMES = [0.1, 0.3, 0.6, 1.0]; // segundos tras el disparo
const CROP = 230, ZOOM = 2; // recorte lógico alrededor del jugador, ampliado x2

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
    const page = await (await browser.newContext({ viewport: { width: 900, height: 600 }, deviceScaleFactor: ZOOM })).newPage();
    // RING=0.5 acerca los enemigos (para técnicas que apuntan a uno al azar)
    await page.addInitScript(`window.__ringK = ${+(process.env.RING || 1)};`);
    await page.addInitScript((q) => {
        let s = 777;
        Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
        const all = { luffy: 1, zoro: 1, sanji: 1, nami: 1, usopp: 1, chopper: 1, robin: 1, franky: 1, brook: 1, jinbe: 1, map_alabasta: 1 };
        localStorage.setItem('op_survivor_meta', JSON.stringify({ beli: 0, upgrades: {}, unlocked: all }));
        localStorage.setItem('op_survivor_opts', JSON.stringify({ quality: q, shake: false }));
        window.requestAnimationFrame = () => 0;
    }, QUALITY);
    page.on('pageerror', e => console.error('ERR', e.message));
    await page.goto(URL_);
    await page.waitForFunction(() => typeof startGame === 'function' && assetsLoaded, null, { timeout: 120000 });
    const list = await page.evaluate(() => {
        const out = [];
        for (const ch in CHAR_SKILLS) for (const id of CHAR_SKILLS[ch]) if (skills[id] && skills[id].baseDamage !== undefined) out.push([ch, id]);
        for (const id of ['cuchillo', 'granada', 'rifle', 'ballesta', 'lanza', 'hacha', 'shuriken', 'hakiPulse', 'dial']) out.push(['luffy', id]);
        return out;
    });
    // precarga el mapa y los sprites de los enemigos de relleno
    await page.evaluate(() => { window.playSound = () => {}; window.updateMusic = () => {}; selectedCharacter = 'luffy'; selectedMap = 'alabasta'; startGame(); ENEMY_IMG.grunt; });
    await page.waitForFunction(() => IMG.alabastaMap.width > 0, null, { polling: 200, timeout: 60000 });
    await page.waitForTimeout(1500);
    for (const [ch, id] of list) {
        if (FILTER.length && !FILTER.includes(id)) continue;
        const shots = [];
        for (const evo of [false, true]) {
            await page.evaluate(({ ch, id, evo }) => {
                window.playSound = () => {}; window.updateMusic = () => {};
                selectedCharacter = ch; selectedMap = 'alabasta'; runCurseRank = 0;
                startGame();
                for (let k = 0; k < 10 && gameState !== 'PLAYING'; k++) {
                    const c = document.querySelector('#arcana-options .upgrade-card'); if (c) c.click(); else break;
                }
                gameState = 'PLAYING';
                for (const k in skills) if (skills[k] && skills[k].level !== undefined && k !== id && skills[k].baseDamage !== undefined) skills[k].level = 0;
                const sk = skills[id]; sk.level = 5; sk.evolved = evo; sk.timer = 0;
                player.x = 0; player.y = 60; player.facing = 1;
                enemies = []; particles = []; activeAttacks = [];
                const ring = [[90, 0], [150, -30], [130, 60], [-110, 20], [40, -110], [60, 120], [220, 10], [-60, -90], [180, -100], [260, 70]];
                const K = +(window.__ringK || 1);
                for (const [dx0, dy0] of ring) { const dx = dx0 * K, dy = dy0 * K; { const e = makeEnemy('grunt', player.x + dx, player.y + dy, 1, { _dummy: true }); e.hp = e.maxHp = 1e9; e.speed = 0; enemies.push(e); } }
                window.__step = (dt) => {
                    joystick.active = false; player.hp = player.maxHp; window.freezeTimer = 0; window.waveIdx = 1e9;
                    update(dt);
                    enemies = enemies.filter(e => e._dummy);
                    for (const e of enemies) { e.hp = 1e9; e.speed = 0; }
                    if (gameState !== 'PLAYING') gameState = 'PLAYING';
                };
                if (!document.getElementById('__galcss')) { const st = document.createElement('style'); st.id = '__galcss'; st.textContent = 'body *:not(#gameCanvas){visibility:hidden!important} #gameCanvas{visibility:visible!important}'; document.head.appendChild(st); }
                // fuerza el primer disparo
                sk.timer = 1e3;
            }, { ch, id, evo });
            let t = 0;
            for (const T of TIMES) {
                await page.evaluate((n) => { for (let i = 0; i < n; i++) window.__step(1 / 60); render(); }, Math.round((T - t) * 60));
                t = T;
                shots.push(await page.screenshot({ clip: { x: 450 - CROP / 2, y: 300 - CROP / 2, width: CROP, height: CROP } }));
            }
        }
        // monta la hoja en el navegador
        const sheet = await page.evaluate(async ({ imgs, cols, crop, title }) => {
            const c = document.createElement('canvas'); c.width = cols * crop; c.height = 2 * crop + 22; c.style.cssText = 'position:fixed;visibility:hidden';
            const g = c.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, c.width, c.height);
            g.fillStyle = '#fff'; g.font = '16px monospace'; g.fillText(title, 6, 16);
            for (let i = 0; i < imgs.length; i++) {
                const im = new Image(); im.src = 'data:image/png;base64,' + imgs[i]; await im.decode();
                g.drawImage(im, (i % cols) * crop, 22 + Math.floor(i / cols) * crop);
            }
            return c.toDataURL('image/png').split(',')[1];
        }, { imgs: shots.map(b => b.toString('base64')), cols: TIMES.length, crop: CROP * ZOOM, title: `${ch} · ${id} (arriba normal, abajo evolucionada) t=${TIMES.join('/')}s` });
        fs.writeFileSync(`${OUT}/${ch}_${id}.png`, Buffer.from(sheet, 'base64'));
        console.log('ok', ch, id);
    }
    await browser.close();
})();
