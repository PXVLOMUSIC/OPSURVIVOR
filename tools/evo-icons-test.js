// Comprueba que cada evolución tiene icono propio (evo_<id>) y que se ve en HUD, pausa, carta, cofre y Colección.
// Uso: python3 -m http.server 8765 & node tools/evo-icons-test.js http://localhost:8765/index.html [captura.png]
const { chromium } = require('playwright');
(async () => {
    const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = []; p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(() => localStorage.setItem('op_survivor_meta', JSON.stringify({ beli: 0, upgrades: {}, unlocked: { luffy: true } })));
    await p.goto(process.argv[2] || 'http://localhost:8765/index.html');
    await p.waitForFunction(() => typeof startGame === 'function' && assetsLoaded);
    const r = await p.evaluate(() => {
        window.playSound = () => {};
        const missing = Object.keys(EVOLUTIONS).filter(id => !PX_ICON_INDEX['evo_' + id]);
        selectedCharacter = 'luffy'; selectedMap = 'shelltown'; startGame();
        document.getElementById('press-start') && document.getElementById('press-start').remove();
        skills.pistol.level = 5; evolveWeapon('pistol'); updateWeaponsHUD();
        const hud = document.querySelector('.wslot.evo .hud-ico i.pxi');
        const want = pxIcon('evo_pistol').match(/background-position:[^"]+/)[0];
        return { n: Object.keys(EVOLUTIONS).length, missing, hud: !!hud && hud.outerHTML.includes(want) };
    });
    console.log(JSON.stringify(r));
    if (process.argv[3]) { await p.evaluate(() => { gameState = 'PAUSED'; openChestRoulette(1, 2, 100, ['Red Hawk (Gomu Gomu no Pistol)']); }); await p.waitForTimeout(400); await p.screenshot({ path: process.argv[3] }); }
    console.log(errors.length ? 'Errores JS: ' + errors.join(' | ') : '0 errores JS');
    await b.close(); process.exit(r.missing.length || !r.hud || errors.length ? 1 : 0);
})();
