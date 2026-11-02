// === Oleadas con guion por minuto (como las tablas de cada fase de Vampire Survivors) ===
// El spawn continuo (handleSpawning) sigue igual; encima, cada mapa tiene momentos fijos:
//   swarm   enjambre que cruza la pantalla en línea recta sin perseguirte (los murciélagos de VS)
//   ring    emboscada en círculo con un hueco para escapar
//   charge  carga en fila desde un costado
//   horde   gran grupo compacto que llega desde una dirección
//   warn    aviso de que llega el jefe
// Los minijefes (min 3 y 6) y el jefe (min 8) siguen en MAP_ENEMIES. 'curse' = solo desde ese Clima.
const WAVE_SCRIPT = [
    { t: 45,  kind: 'swarm', n: 12 },
    { t: 70,  kind: 'ring' },
    { t: 110, kind: 'swarm', n: 16 },
    { t: 140, kind: 'ring', curse: 2 },
    { t: 165, kind: 'charge' },
    { t: 205, kind: 'swarm', n: 20, both: true },
    { t: 255, kind: 'ring' },
    { t: 300, kind: 'horde', n: 26 },
    { t: 320, kind: 'charge', curse: 2 },
    { t: 345, kind: 'charge' },
    { t: 390, kind: 'swarm', n: 26, both: true },
    { t: 430, kind: 'ring' },
    { t: 462, kind: 'warn' }
];
const WAVE_TEXT = {
    baratie:      { swarm: '¡BANCO DE PIRATAS HAMBRIENTOS!', horde: '¡ABORDAJE DE LA FLOTA DE KRIEG!' },
    alabasta:     { swarm: '¡ESTAMPIDA DE DUGONGOS KUNG-FU!', horde: '¡LOS REBELDES Y BAROQUE WORKS CHOCAN!' },
    skypiea:      { swarm: '¡LLUVIA DE TAMA DE SATORI!', horde: '¡EL EJÉRCITO SHANDIA ATACA!' },
    thrillerbark: { swarm: '¡NEGATIVE HOLLOWS!', horde: '¡NOCHE DE LOS ZOMBIS!' },
    enieslobby:   { swarm: '¡LA MARINA CRUZA EL PUENTE!', horde: '¡BUSTER CALL!' },
    water7:       { swarm: '¡LA FAMILIA FRANKY ASALTA EL MUELLE!', horde: '¡AQUA LAGUNA SE ACERCA!' },
    marineford:   { swarm: '¡LOS MARINES SALTAN DE LOS BARCOS!', horde: '¡LA GUERRA EN LA CUMBRE!' },
    wholecake:    { swarm: '¡AVANZAN LOS SOLDADOS DE AJEDREZ!', horde: '¡LA FIESTA DEL TÉ DE BIG MOM!' },
    wano:         { swarm: '¡LOS DIBUJOS DE KANJURO COBRAN VIDA!', horde: '¡EL ASALTO A ONIGASHIMA!' }
};

function waveSpot(x, y) { return selectedMap !== 'baratie' ? clampToArena(x, y) : [x, y]; }

function updateWaveScript() {
    if (window.waveIdx === undefined) window.waveIdx = 0;
    while (window.waveIdx < WAVE_SCRIPT.length && gameTime >= WAVE_SCRIPT[window.waveIdx].t) {
        const w = WAVE_SCRIPT[window.waveIdx++];
        if (w.curse && runCurseRank < w.curse) continue;
        runWave(w);
    }
}

function runWave(w) {
    const ev = mapEnemies().events;
    const txt = WAVE_TEXT[selectedMap] || WAVE_TEXT.baratie;
    const minutes = Math.floor(gameTime / 60);
    const hpScale = enemyHpScale();
    if (w.kind === 'warn') {
        window.spawnBanner = { text: '¡SE ACERCA ' + (BOSS_INFO[mapEnemies().boss] || 'EL JEFE').split(' —')[0].toUpperCase() + '!', life: 2.4, color: '#facc15' };
        playSound('boss');
        return;
    }
    playSound('warn');
    if (w.kind === 'swarm') {
        window.spawnBanner = { text: txt.swarm, life: 1.8, color: '#a78bfa' };
        const sides = w.both ? [1, -1] : [Math.random() < 0.5 ? 1 : -1];
        const vertical = Math.random() < 0.35;
        for (const side of sides) {
            for (let k = 0; k < w.n; k++) {
                const lane = (k / w.n - 0.5) * (vertical ? VIEW_W : VIEW_H) * 0.9 + (Math.random() * 30 - 15);
                const back = 620 + Math.random() * 160;
                let ex = vertical ? player.x + lane : player.x - side * back;
                let ey = vertical ? player.y - side * back : player.y + lane;
                const dir = vertical ? [0, side] : [side, 0];
                enemies.push(makeEnemy(ev.swarm || ev.runners, ex, ey, hpScale * 0.6, { speed: 150 + minutes * 6, fixedDir: dir, ttl: 9, isEvent: true }));
            }
        }
    } else if (w.kind === 'ring') {
        window.spawnBanner = { text: ev.ringText, life: 2.0, color: '#ef4444' };
        const n = 24 + minutes * 2;
        const gapAt = Math.random() * Math.PI * 2;
        for (let k = 0; k < n; k++) {
            const ang = (Math.PI * 2 * k) / n;
            const off = Math.abs(((ang - gapAt + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
            if (off < Math.PI / 5) continue; // hueco para escapar
            const [ex, ey] = waveSpot(player.x + Math.cos(ang) * 560, player.y + Math.sin(ang) * 560);
            enemies.push(makeEnemy(ev.ring, ex, ey, hpScale, { speed: 110 + minutes * 10, isEvent: true }));
        }
    } else if (w.kind === 'charge') {
        window.spawnBanner = { text: ev.chargeText, life: 2.0, color: '#38bdf8' };
        const side = Math.random() < 0.5 ? -1 : 1;
        const n = 20 + minutes * 2;
        for (let k = 0; k < n; k++) {
            const [ex, ey] = waveSpot(player.x + side * 640, player.y - 360 + k * 34);
            enemies.push(makeEnemy(ev.charge, ex, ey, hpScale, { speed: 70, damage: 16, isEvent: true }));
        }
        for (let k = 0; k < 10; k++) {
            const [ex, ey] = waveSpot(player.x + side * 640, player.y - 200 + k * 40);
            enemies.push(makeEnemy(ev.runners, ex, ey, hpScale, { speed: 130, isEvent: true }));
        }
    } else if (w.kind === 'horde') {
        window.spawnBanner = { text: txt.horde, life: 2.0, color: '#f97316' };
        const ang = Math.random() * Math.PI * 2;
        const cx = player.x + Math.cos(ang) * 600, cy = player.y + Math.sin(ang) * 600;
        const pool = [mapEnemies().base].concat(mapEnemies().pool.filter(p => !(ELITE_INFO[p.type] && ELITE_INFO[p.type].always)).map(p => p.type));
        for (let k = 0; k < w.n; k++) {
            const t = pool[k % pool.length];
            const [ex, ey] = waveSpot(cx + (Math.random() - 0.5) * 160, cy + (Math.random() - 0.5) * 160);
            enemies.push(makeEnemy(t, ex, ey, hpScale, { isEvent: true }));
        }
    }
}
