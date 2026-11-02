// Prueba de estado entre partidas: juega varias partidas seguidas (game over, reinicio, salir al menú
// desde la pausa o con un cofre abierto, cambio de personaje y de mapa) y compara el estado al empezar
// cada una con el de una partida recién cargada. Cualquier diferencia es estado que se arrastra.
// Uso: python3 -m http.server 8765 & node tools/reset-test.js http://localhost:8765/index.html
const { chromium } = require('playwright');
const URL_ = process.argv[2] || 'http://localhost:8765/index.html';

async function newPage(browser) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
        localStorage.setItem('op_survivor_meta', JSON.stringify({ beli: 0, upgrades: {}, unlocked: { luffy: true, zoro: true, sanji: true, nami: true, usopp: true, chopper: true, robin: true }, gear: { unlocked: 5, forms: { zoro: 4, sanji: 4, nami: 4, usopp: 4, chopper: 4, robin: 4 }, up: { meter: 0, charge: 0, recover: 0 } } }));
        window.requestAnimationFrame = () => 0; // el bucle lo mueve la prueba
    });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(URL_);
    await page.waitForFunction(() => typeof startGame === 'function' && assetsLoaded, null, { timeout: 60000 }).catch(() => {});
    await page.evaluate(() => {
        window.playSound = () => {}; window.updateMusic = () => {};
        // estado al empezar (antes de elegir la Voluntad de D). Se ignoran valores aleatorios o de reloj real.
        window.__snap = () => {
            const clean = o => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)));
            const win = {};
            ['freezeTimer','vacuumTimer','haoTimer','_evolveCut','_pendingLevelUps','spawnTimer','endlessMode','endlessBossKills','nextBossAt','minibossesSpawned','mirrorMinibossSpawned','waveIdx','spawnBanner','_hollowTxt','_gearFlash','_propTimer','_applyOnly','_chestAnim'].forEach(k => win[k] = window[k] === undefined ? null : window[k]);
            return clean({ state: gameState, player, skills, gearState, win, gameTime, scoreBeli, bossSpawned, cameraShake,
                arrays: { enemies: enemies.length, enemyBullets: enemyBullets.length, drops: drops.length, activeAttacks: activeAttacks.length, groundDecals: groundDecals.length },
                upgradeIsChest, banishing: _banishing, keys: Object.keys(keys).filter(k => keys[k]), joystick: { active: joystick.active, dx: joystick.dx, dy: joystick.dy },
                screens: [...document.querySelectorAll('#gameover-screen,#victory-screen,#pause-screen,#upgrade-screen,#chest-screen,#controls-screen,#start-screen')].filter(e => e.style.display && e.style.display !== 'none').map(e => e.id).sort() });
        };
        window.__play = (secs, opts = {}) => {
            const DT = 1 / 30;
            const t1 = gameTime + secs;
            while (gameTime < t1) {
                if (gameState === 'ARCANA') { const c = document.querySelector('#arcana-options .upgrade-card'); c ? c.click() : (gameState = 'PLAYING'); continue; }
                if (gameState === 'CHEST') { if (opts.stopAtChest) return 'CHEST'; closeChestRoulette(); continue; }
                if (gameState === 'UPGRADE') { const c = document.querySelector('#upgrade-options .upgrade-card'); c ? c.click() : skipUpgrade(); continue; }
                if (gameState !== 'PLAYING') return gameState;
                const a = gameTime * 0.7; joystick.active = true; joystick.dx = Math.cos(a); joystick.dy = Math.sin(a);
                if (gearReady()) gearActivate();
                update(DT);
            }
            return gameState;
        };
    });
    return { page, errors };
}

function diff(a, b, path = '', out = []) {
    if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
        if (JSON.stringify(a) !== JSON.stringify(b)) out.push(path + ': ' + JSON.stringify(b) + ' -> ' + JSON.stringify(a));
        return out;
    }
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], path ? path + '.' + k : k, out);
    return out;
}
// campos con azar: se comparan aparte
const RANDOM = [/^win\.nextEventAt$/];

(async () => {
    const browser = await chromium.launch();
    const fresh = {};
    async function freshSnap(ch, map) {
        const key = ch + '@' + map;
        if (fresh[key]) return fresh[key];
        const { page } = await newPage(browser);
        fresh[key] = await page.evaluate(({ ch, map }) => { selectedCharacter = ch; selectedMap = map; runCurseRank = 0; startGame(); return __snap(); }, { ch, map });
        await page.context().close();
        return fresh[key];
    }
    const { page, errors } = await newPage(browser);
    // Secuencia: cada paso termina la partida de una forma distinta y arranca la siguiente
    const steps = [
        { ch: 'luffy', map: 'baratie',  how: 'start' },
        { ch: 'zoro',  map: 'baratie',  how: 'menu-after-gameover', play: 120, extra: 'jango' },
        { ch: 'zoro',  map: 'baratie',  how: 'restart-after-gameover', play: 150, extra: 'gear' },
        { ch: 'sanji', map: 'alabasta', how: 'menu-from-pause', play: 90, extra: 'gear' },
        { ch: 'luffy', map: 'skypiea',  how: 'menu-from-chest', play: 240, extra: 'chest' },
        { ch: 'zoro',  map: 'thrillerbark', how: 'menu-after-victory', play: 60, extra: 'hollow' },
        { ch: 'zoro',  map: 'thrillerbark', how: 'restart-after-gameover', play: 200 },
        { ch: 'nami',  map: 'baratie',  how: 'menu-after-gameover', play: 150, extra: 'gear' },
        { ch: 'usopp', map: 'alabasta', how: 'menu-from-pause', play: 150, extra: 'gear' },
        { ch: 'chopper', map: 'skypiea', how: 'menu-from-pause', play: 150, extra: 'gear' },
        { ch: 'chopper', map: 'skypiea', how: 'restart-after-gameover', play: 400 },
        { ch: 'robin', map: 'baratie',  how: 'menu-from-pause', play: 150, extra: 'gear' },
        { ch: 'luffy', map: 'baratie',  how: 'menu-after-gameover', play: 150 },
    ];
    let fails = 0;
    for (const st of steps) {
        const r = await page.evaluate((st) => {
            const log = [];
            if (st.how !== 'start') {
                const end = __play(st.play, { stopAtChest: st.how === 'menu-from-chest' });
                log.push('fin juego: ' + end + ' t=' + Math.round(gameTime));
                // efectos activos al terminar (lo que pasa en una partida real)
                if (st.extra === 'jango') { player._slowUntil = gameTime + 1.5; player._slowMult = 0.75; }
                if (st.extra === 'hollow') { window._hollowTxt = gameTime + 4; player._slowUntil = gameTime + 1.2; player._slowMult = 0.4; }
                if (st.extra === 'gear' && !gearState.active) { gearState.meter = 100; if (gearReady()) gearActivate(); }
                keys['w'] = true; keys['arrowleft'] = true; // tecla pulsada al morir
                cameraShake = 3;
                if (st.how === 'menu-after-gameover' || st.how === 'restart-after-gameover') {
                    if (gameState === 'PLAYING') { player.revives = 0; player.hp = 0; triggerGameOver(); }
                    if (st.how === 'restart-after-gameover') { restartGame(); return { log, snap: __snap() }; }
                    backToMenu();
                } else if (st.how === 'menu-from-pause') {
                    if (gameState === 'PLAYING') togglePause();
                    backToMenu();
                } else if (st.how === 'menu-from-chest') {
                    // cofre abierto al morir de un golpe en el mismo frame: se fuerza el game over con la ruleta en pantalla
                    if (gameState === 'PLAYING') { try { openChestRoulette(1, 1, 100, []); } catch (e) { log.push('cofre: ' + e.message); } }
                    log.push('estado al salir: ' + gameState);
                    player.revives = 0; player.hp = 0; triggerGameOver();
                    backToMenu();
                } else if (st.how === 'menu-after-victory') {
                    triggerVictory();
                    backToMenu();
                }
            }
            selectMap(st.map); selectCharacter(st.ch); runCurseRank = 0;
            log.push('menu: ' + selectedCharacter + '@' + selectedMap);
            startGame();
            return { log, snap: __snap() };
        }, st);
        const ref = await freshSnap(st.ch, st.map);
        const d = diff(r.snap, ref).filter(x => !RANDOM.some(re => re.test(x.split(':')[0])));
        console.log(`\n[${st.how}] -> ${st.ch}@${st.map}  ${r.log.join(' | ')}`);
        if (d.length) { fails++; d.slice(0, 40).forEach(x => console.log('  DIFF ' + x)); } else console.log('  OK: igual que una partida recién cargada');
    }
    // Economía: victoria + Modo Infinito + muerte (dos golpes mortales en el mismo frame) cobra cada Berry una sola vez
    const eco = await page.evaluate(() => {
        backToMenu(); selectMap('baratie'); selectCharacter('luffy'); startGame(); __play(5);
        const b0 = meta.beli, t0 = meta.stats.beliTotal;
        scoreBeli = 1000; triggerVictory(); triggerVictory();
        startEndless(); scoreBeli += 500;
        player.revives = 0; player.hp = 0; triggerGameOver(); triggerGameOver();
        return { beli: meta.beli - b0, total: meta.stats.beliTotal - t0, state: gameState };
    });
    console.log('\n[economía] victoria 1000 + infinito 500 -> bolsa +' + eco.beli + ', total +' + eco.total + ' (' + eco.state + ')');
    if (eco.beli !== 1500 || eco.total !== 1500) { fails++; console.log('  DIFF se esperaba +1500 en ambos'); } else console.log('  OK');
    if (errors.length) { console.log('\nErrores JS:'); [...new Set(errors)].forEach(e => console.log('  ' + e)); }
    console.log(`\n${fails} pasos con estado arrastrado, ${errors.length} errores JS`);
    await browser.close();
    process.exit(fails || errors.length ? 1 : 0);
})();
