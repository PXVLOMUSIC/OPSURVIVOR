// Prueba del audio: carga todos los efectos, juega un rato con cada personaje y comprueba
// que no hay errores, que el límite de voces se respeta y qué sonidos suenan.
// Uso: python3 -m http.server 8765 & node tools/audio-test.js http://localhost:8765/index.html
const { chromium } = require('playwright');
const URL_ = process.argv[2] || 'http://localhost:8765/index.html';
(async () => {
    const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.addInitScript(() => {
        localStorage.setItem('op_survivor_meta', JSON.stringify({ beli: 0, upgrades: {}, unlocked: { luffy: true, zoro: true, sanji: true, nami: true, usopp: true, chopper: true, robin: true, franky: true, brook: true, jinbe: true }, gear: { unlocked: 5, forms: { zoro: 4, sanji: 4, nami: 4, usopp: 4, chopper: 4, robin: 4, franky: 4, brook: 4, jinbe: 4 }, up: { meter: 0, charge: 0, recover: 0 } } }));
        window.requestAnimationFrame = () => 0;
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(URL_);
    await page.waitForFunction(() => typeof startGame === 'function' && assetsLoaded, null, { timeout: 60000 }).catch(() => {});
    await page.mouse.click(640, 360);
    await page.waitForFunction(() => Object.keys(SFX_FILES).every(k => sfxBuffers[k]), null, { timeout: 20000 }).catch(() => {});
    const missing = await page.evaluate(() => Object.keys(SFX_FILES).filter(k => !sfxBuffers[k]));
    console.log('buffers sin cargar:', missing.length ? missing : 'ninguno');
    for (const ch of ['luffy', 'zoro', 'sanji', 'nami', 'usopp', 'chopper', 'robin', 'franky', 'brook', 'jinbe']) {
        const r = await page.evaluate(async (ch) => {
            const real = playSound, count = {}; let maxV = 0, ms = 0, calls = 0;
            window.playSound = function (t) { count[t] = (count[t] || 0) + 1; const a = performance.now(); real(t); ms += performance.now() - a; calls++; if (sfxVoices.length > maxV) maxV = sfxVoices.length; };
            selectedCharacter = ch; selectedMap = 'baratie';
            startGame();
            const DT = 1 / 30; let guard = 0;
            while (gameTime < 240 && guard++ < 20000) {
                if (gameState === 'ARCANA') { const c = document.querySelector('#arcana-options .upgrade-card'); c ? c.click() : (gameState = 'PLAYING'); continue; }
                if (gameState === 'CHEST') { closeChestRoulette(); continue; }
                if (gameState === 'UPGRADE') { const c = document.querySelector('#upgrade-options .upgrade-card'); c ? c.click() : skipUpgrade(); continue; }
                if (gameState !== 'PLAYING') break;
                const a = gameTime * 0.7; joystick.active = true; joystick.dx = Math.cos(a); joystick.dy = Math.sin(a);
                if (gearReady()) gearActivate();
                player.hp = player.maxHp;
                update(DT);
                if (guard % 30 === 0) await new Promise(r => setTimeout(r, 1));
            }
            window.playSound = real;
            gameState = 'START';
            return { count, maxV, avgUs: Math.round(ms / Math.max(1, calls) * 1000), voicesNow: sfxVoices.length };
        }, ch);
        console.log(ch, JSON.stringify(r));
    }
    console.log('errores:', errors.length ? errors : 'ninguno');
    await browser.close();
})();
