// Simulador de balance: un bot juega partidas completas en Chromium headless y mide winrate.
// Requisitos: servir el repo (python3 -m http.server 8765) y tener Playwright.
// Uso: node tools/balance-sim.js http://localhost:8765/index.html <partidas por combo> <mejoras: 0 nada | 2 medias | 1 todas> [personajes] [mapas] [paralelo] [gear max 2-5] 2> runs.log
// El bot activa la transformación de cada personaje (FORM_CARD) en cuanto el medidor está lleno. [gear max] fija el escalón desbloqueado (por defecto 2; Zoro y Sanji llegan hasta 4).
//      python3 tools/balance-report.py runs.log
const { chromium } = require('playwright');
const URL_ = process.argv[2];
const RUNS = +process.argv[3] || 4;
const META = +process.argv[4] || 0;
const CHARS = (process.argv[5] || 'luffy,zoro,sanji').split(',');
const MAPS = (process.argv[6] || 'baratie,alabasta,skypiea,thrillerbark').split(',');
const PAR = +process.argv[7] || 8;
const GEAR = +process.argv[8] || 2;
// [forzar] = 'evo': a partir del minuto 4 la carta de transformación está evolucionada (mide el techo de Gear 4/5, Enma e Ifrit)
const FORCE_EVO = process.argv[9] === 'evo';
// TMAX=780 cambia el tope de 12 min; IMMORTAL_BOSS=1 alarga la partida para medir el oro de una singladura larga
// BAL='{"hpGrowth":1.3}' sobrescribe valores de BALANCE para probar ajustes sin tocar el código
const BAL_OVERRIDE = process.env.BAL ? JSON.parse(process.env.BAL) : null;

async function runOne(browser, ch, map, meta) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();
    await page.addInitScript(({ meta, gear }) => {
        const m = { beli: 0, upgrades: {}, unlocked: { luffy: true, zoro: true, sanji: true, nami: true, usopp: true, chopper: true, robin: true, item_dial: true, item_jolly: true }, gear: { unlocked: gear, forms: { zoro: Math.min(gear, 4), sanji: Math.min(gear, 4), nami: Math.min(gear, 4), usopp: Math.min(gear, 4), chopper: Math.min(gear, 4), robin: Math.min(gear, 4) }, up: { meter: 0, charge: 0, recover: 0 } } };
        // mejoras: se fijan tras cargar el juego a partir de META_UPGRADES (ver abajo)
        // (meta 1 = todas al máximo; meta 2 = la mitad, redondeando arriba y sin Revivir; la Maldición siempre a 0)
        localStorage.setItem('op_survivor_meta', JSON.stringify(m));
        window.requestAnimationFrame = () => 0;
    }, { meta, gear: GEAR });
    page.on('pageerror', e => console.error('ERR', ch, map, e.message));
    await page.goto(URL_);
    await page.waitForFunction(() => typeof startGame === 'function' && assetsLoaded, null, { timeout: 60000 }).catch(() => {});
    const res = await page.evaluate(async ({ ch, map, forceEvo, metaLvl, bal, tmax, immortalBoss }) => {
        if (bal) Object.assign(BALANCE, bal);
        META_UPGRADES.forEach(u => { meta.upgrades[u.id] = (u.id === 'curse' || (metaLvl === 2 && u.id === 'revival')) ? 0 : (metaLvl === 1 ? u.max : (metaLvl === 2 ? Math.ceil(u.max / 2) : 0)); });
        window.playSound = () => {}; window.updateMusic = () => {};
        selectedCharacter = ch; selectedMap = map; runCurseRank = 0;
        startGame();
        const PRI = { power: 9, cd: 8, area: 7, maxhp: 6, armor: 6, regen: 5, haki_buso: 6, crit: 5, speed: 4, magnet: 4, pickup: 4, growth: 3 };
        function pickCard(sel) {
            const cards = [...document.querySelectorAll(sel + ' .upgrade-card')];
            if (!cards.length) return false;
            let best = cards[0], bs = -1;
            for (const c of cards) {
                const t = c.querySelector('h4') ? c.querySelector('h4').innerText : '';
                let s = 1;
                if (c.dataset.kind === 'weapon') {
                    s = c.dataset.char === ch ? 10 : 5;
                    const up = Object.keys(skills).find(k => { const u = skills[k]; return u.level > 0; });
                    if (/EVOLUCI/.test(c.innerText) && !/EVOLUCIONADA/.test(c.innerText)) s += 0.5;
                } else {
                    const id = Object.keys(PRI).find(k => ({ power: /Poder/, cd: /Cooldown/, area: /Área/, maxhp: /Vitalidad/, armor: /Armadura de Haki/, regen: /Regener/, haki_buso: /Busoshoku Haki$/, crit: /Crit/, speed: /^Velocidad/, magnet: /Imán|Magnet/, pickup: /Recogida/, growth: /Crecimiento/ })[k].test(t));
                    s = id ? PRI[id] : 2;
                }
                s += Math.random() * 0.5;
                if (s > bs) { bs = s; best = c; }
            }
            best.click();
            return true;
        }
        const DT = 1 / 30;
        const samples = [];
        let t0 = performance.now();
        const gu = {};
        let maxOn = 0, lastSample = 0, minHp = 999, dmgTaken = 0, lastHp = player.hp;
        const src = {}; let wTime = 0, kills = 0, bossT = null, bossDead = null;
        while (true) {
            if (gameState === 'ARCANA') { pickCard('#arcana-options'); continue; }
            if (gameState === 'CHEST') { closeChestRoulette(); continue; }
            if (gameState === 'UPGRADE') { if (!pickCard('#upgrade-options')) { skipUpgrade(); } continue; }
            if (gameState !== 'PLAYING') break;
            // bot de movimiento: mantiene la distancia de su arma principal (melee cerca, Luffy a media distancia)
            const R = ch === 'zoro' ? 55 : (ch === 'sanji' || ch === 'chopper' ? 45 : 120);
            let fx = 0, fy = 0, close = 999, nearest = null;
            for (const e of enemies) {
                if (e.isProp) continue;
                const dx = player.x - e.x, dy = player.y - e.y, d = Math.hypot(dx, dy) || 1;
                if (d < close) { close = d; nearest = e; }
                const danger = (e.isBoss || e.isMiniboss) ? R + 60 : R;
                if (d < danger + 40) { const w = (e.isBoss || e.isMiniboss ? 3 : 1) / Math.max(8, d - 18) ** 2; fx += dx / d * w; fy += dy / d * w; }
            }
            for (const b of enemyBullets) {
                const dx = player.x - b.x, dy = player.y - b.y, d = Math.hypot(dx, dy) || 1;
                if (d < 120) { fx += dx / d * 2 / (d * d); fy += dy / d * 2 / (d * d); }
            }
            const fm = Math.hypot(fx, fy);
            let mx = 0, my = 0;
            if (fm > 0) { mx = fx / fm; my = fy / fm; }
            mx += -my * 0.35; my += mx * 0.35;
            // sin presión: se acerca al enemigo más cercano para que el arma llegue
            if (nearest && close > R + 30 && !(nearest.isBoss || nearest.isMiniboss)) { const dx = nearest.x - player.x, dy = nearest.y - player.y, d = Math.hypot(dx, dy) || 1; mx += dx / d * 0.6; my += dy / d * 0.6; }
            // drops
            let best = null, bd = 1e9;
            for (const d of drops) { const dd = Math.hypot(d.x - player.x, d.y - player.y) * (d.type === 'chest' ? 0.4 : 1); if (dd < bd) { bd = dd; best = d; } }
            if (best && (close > R || best.type === 'chest' && close > 40) && bd < 500) {
                const dx = best.x - player.x, dy = best.y - player.y, d = Math.hypot(dx, dy) || 1;
                const w = close > 160 ? 1.2 : 0.5;
                mx += dx / d * w; my += dy / d * w;
            }
            // vuelve al centro si se acerca al borde
            const poly = walkPoly();
            if (poly) {
                const px = player.x + mx * 80, py = player.y + my * 80;
                if (!pointInPoly(px, py, poly)) { let cx = 0, cy = 0; for (const p of poly) { cx += p[0] ?? p.x; cy += p[1] ?? p.y; } cx /= poly.length; cy /= poly.length; const dx = cx - player.x, dy = cy - player.y, d = Math.hypot(dx, dy) || 1; mx += dx / d * 1.5; my += dy / d * 1.5; }
            }
            const ml = Math.hypot(mx, my);
            joystick.active = ml > 0.05; joystick.dx = ml ? mx / ml : 0; joystick.dy = ml ? my / ml : 0;
            const fc = FORM_CARD[ch];
            if (forceEvo && gameTime > 240 && !skills[fc].evolved) { skills[fc].level = 5; skills[fc].evolved = true; }
            if (typeof gearReady === 'function' && gearReady()) { const gv = gearAvailable(); gearActivate(); gu[gv] = (gu[gv] || 0) + 1; }
            const preHp = player.hp;
            update(DT);
            if (immortalBoss) for (const e of enemies) if (e.isBoss) e.hp = e.maxHp;
            { const loss = preHp - player.hp; if (loss > 0) { let big = enemies.some(e => (e.isBoss||e.isMiniboss) && Math.hypot(e.x-player.x,e.y-player.y) < 40); let c = enemies.filter(e => Math.hypot(e.x-player.x,e.y-player.y) < 22).length; const key = big ? 'boss' : (c ? (c >= 5 ? 'swarm' : 'contact') : 'bullet'); src[key] = (src[key]||0) + loss; } }
            if (player.hp < lastHp) dmgTaken += lastHp - player.hp;
            lastHp = player.hp;
            if (player.hp < minHp) minHp = player.hp;
            if (window.runStats) kills = Math.max(kills, window.runStats.kills);
            if (bossSpawned && bossT === null) bossT = gameTime;
            const on = enemies.filter(e => Math.abs(e.x - player.x) < VIEW_W / 2 && Math.abs(e.y - player.y) < VIEW_H / 2).length;
            if (on > maxOn) maxOn = on;
            if (gameTime - lastSample >= 60) {
                lastSample = gameTime;
                samples.push({ m: Math.round(gameTime / 60), on, alive: enemies.length, kills: window.runStats ? window.runStats.kills : 0, lvl: player.level, hp: Math.round(player.hp), maxHp: player.maxHp, power: player.powerPct, beli: scoreBeli });
            }
            if (gameTime > tmax) break; // 12 min de tope: si no mata al boss, cuenta como derrota
            if (performance.now() - t0 > 240000) break;
        }
        const boss = enemies.find(e => e.isBoss);
        const beli = scoreBeli, beliSrc = window.beliSrc || {};
        return { ch, map, state: gameState, time: Math.round(gameTime), beli, beliSrc, lvl: player.level, kills, minHp: Math.round(minHp), src: Object.fromEntries(Object.entries(src).map(([k,v])=>[k,Math.round(v)])),
            maxOn, dmgTaken: Math.round(dmgTaken), bossHpLeft: boss ? Math.round(boss.hp / boss.maxHp * 100) : null,
            gearMax: (typeof meta !== 'undefined' && meta.gear) ? meta.gear.unlocked : null, gearUses: gu,
            weapons: Object.keys(skills).filter(k => skills[k].level > 0).map(k => k + skills[k].level + (skills[k].evolved ? '*' : '')).join(' '),
            samples, realMs: Math.round(performance.now() - t0) };
    }, { ch, map, forceEvo: FORCE_EVO, metaLvl: meta, bal: BAL_OVERRIDE, tmax: +process.env.TMAX || 720, immortalBoss: !!process.env.IMMORTAL_BOSS });
    await ctx.close();
    return res;
}

(async () => {
    const browser = await chromium.launch();
    const jobs = [];
    for (const ch of CHARS) for (const map of MAPS) for (let i = 0; i < RUNS; i++) jobs.push([ch, map]);
    const out = [];
    let idx = 0;
    async function worker() { while (idx < jobs.length) { const j = jobs[idx++]; try { const r = await runOne(browser, j[0], j[1], META); out.push(r); console.error(JSON.stringify({ ch: r.ch, map: r.map, st: r.state, t: r.time, lvl: r.lvl, k: r.kills, on: r.maxOn, boss: r.bossHpLeft, gears: r.gearUses, beli: r.beli, src: r.beliSrc })); } catch (e) { console.error('fail', j, e.message); } } }
    await Promise.all(Array.from({ length: PAR }, worker));
    await browser.close();
    console.log(JSON.stringify(out));
})();
