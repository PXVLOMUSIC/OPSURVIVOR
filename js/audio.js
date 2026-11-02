// --- WEB AUDIO API SYNTHESIZER ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

// --- BACKGROUND MUSIC ---
const menuMusic = new Audio('assets/music/menu.mp3');
const battleMusic = new Audio('assets/music/battle.mp3');
menuMusic.loop = true; battleMusic.loop = true;
// la de batalla no se descarga hasta que suena (ahorra ~2 MB al abrir el juego en datos móviles)
battleMusic.preload = 'none'; menuMusic.preload = 'auto';
function updateMusic() {
    if (!soundEnabled) { menuMusic.pause(); battleMusic.pause(); return; }
    const vol = masterVolume * (windowOpts ? windowOpts.music : 1) * 0.75;
    if (gameState === 'START' || gameState === 'SHOP') {
        battleMusic.pause();
        // toggle del menu: silencia solo la musica del menu (la batalla sigue su slider)
        if (windowOpts && windowOpts.menuMusicMuted) { menuMusic.pause(); return; }
        // la musica no arranca (ni silenciada) hasta el primer clic o toque en la pagina
        if (!window._audioUnlocked) { menuMusic.pause(); return; }
        menuMusic.muted = false;
        menuMusic.volume = vol;
        menuMusic.play().catch(() => {});
    } else if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'UPGRADE' || gameState === 'CHEST' || gameState === 'GAMEOVER' || gameState === 'VICTORY') {
        menuMusic.pause();
        battleMusic.muted = false;
        battleMusic.volume = vol;
        battleMusic.play().catch(() => {});
    } else {
        menuMusic.pause();
        battleMusic.pause();
    }
}

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    sfxBusInit();
    preloadSfx();
}

// === SFX ===
// Pack CC0 "The Essential Retro Video Game Sound Effects Collection" de Juhani Junkala (assets/sfx/CREDITS.txt)
// + efectos sintetizados a juego con tools/sfx-gen.py (heal, ouch, sad, revive, warn, magnet, bell, stretch,
//   whip, wind, thunder, rain, twang, throw, crack, drums).
const SFX_FILES = {
    coin: 'coin.wav', gem: 'gem.wav', beli_rush: 'beli_rush.wav', buy: 'buy.wav', meat: 'heal.wav',
    levelup: 'levelup.wav', evolve: 'evolve.wav', achievement: 'achievement.wav',
    victory: 'victory.wav', gameover: 'sad.wav', chest: 'chest.wav', reward: 'reward.wav',
    hit: 'hit.wav', crit: 'crit.wav', hurt: 'ouch.wav', enemydie: 'enemydie.wav',
    boss: 'boss.wav', boss_die: 'boss_die.wav', death: 'death.wav',
    pistol: 'pistol.wav', gatling: 'gatling.wav', laser: 'laser.wav', slash: 'slash.wav',
    kick: 'kick.wav', boom: 'boom.wav', gear2: 'gear2.wav', haoshoku: 'haoshoku.wav',
    ui: 'ui.wav', select: 'select.wav', error: 'error.wav', muted: 'error.wav',
    revive: 'revive.wav', warn: 'warn.wav', magnet: 'magnet.wav', bell: 'bell.wav',
    stretch: 'stretch.wav', whip: 'whip.wav', wind: 'wind.wav', thunder: 'thunder.wav', rain: 'rain.wav',
    twang: 'twang.wav', throw: 'throw.wav', crack: 'crack.wav', drums: 'drums.wav'
};
const sfxBuffers = {};
let sfxPreloaded = false;
// volumen relativo por sonido (mezcla: los de spam van bajos, los avisos por encima)
const SFX_VOL = {
    enemydie: 0.28, hit: 0.45, crit: 0.5, gem: 0.38, coin: 0.4, gatling: 0.35, pistol: 0.45,
    meat: 0.6, chest: 0.6, reward: 0.55, ui: 0.4, select: 0.5, error: 0.4, muted: 0.35,
    beli_rush: 0.5, buy: 0.5, levelup: 0.55, evolve: 0.6, achievement: 0.55,
    victory: 0.6, gameover: 0.55, hurt: 0.6, boss: 0.6, boss_die: 0.55, death: 0.55,
    laser: 0.45, slash: 0.45, kick: 0.45, boom: 0.45, gear2: 0.5, haoshoku: 0.55,
    revive: 0.6, warn: 0.55, magnet: 0.5, bell: 0.55, stretch: 0.5, whip: 0.5, wind: 0.5,
    thunder: 0.5, rain: 0.45, twang: 0.5, throw: 0.45, crack: 0.55, drums: 0.75
};
// anti-spam: un mismo sonido no se repite antes de X ms (como la cola de audio de VS)
const SFX_THROTTLE = { hit: 45, crit: 70, coin: 40, gem: 28, enemydie: 60, slash: 70, kick: 70, laser: 70, pistol: 70,
    gatling: 150, boom: 90, stretch: 70, whip: 80, wind: 90, thunder: 90, twang: 70, throw: 60, crack: 80, rain: 200, hurt: 120 };
// prioridad: 0 = combate en masa (se descarta si no cabe), 1 = normal, 2 = avisos que siempre suenan
const SFX_PRIO = {
    levelup: 2, evolve: 2, boss: 2, boss_die: 2, death: 2, gameover: 2, victory: 2, achievement: 2,
    revive: 2, warn: 2, gear2: 2, drums: 2, haoshoku: 1, hurt: 2, meat: 1, chest: 2, reward: 1, magnet: 1, bell: 1,
    beli_rush: 1, buy: 1, ui: 1, select: 1, error: 1, muted: 1
};
// copias simultáneas máximas de un mismo sonido
const SFX_MAX = { hit: 4, crit: 3, enemydie: 4, gem: 3, coin: 3, boom: 3, thunder: 3, slash: 3, kick: 3 };
// variación aleatoria de tono y volumen (solo en los repetitivos, para que no suenen a metralleta)
const SFX_VAR = {
    hit: [0.08, 0.15], crit: [0.05, 0.1], enemydie: [0.1, 0.15], coin: [0.03, 0.1], slash: [0.07, 0.12],
    kick: [0.07, 0.12], pistol: [0.05, 0.1], laser: [0.04, 0.1], boom: [0.06, 0.1], stretch: [0.06, 0.1],
    whip: [0.06, 0.1], wind: [0.05, 0.1], thunder: [0.06, 0.1], twang: [0.06, 0.1], throw: [0.08, 0.12],
    crack: [0.08, 0.1], gatling: [0.03, 0.08], hurt: [0.04, 0]
};
const sfxLast = {};
// móvil: menos voces simultáneas (CPU y altavoz pequeño)
const SFX_MAX_VOICES = (window.matchMedia && matchMedia('(pointer: coarse)').matches) ? 14 : 22;
const sfxVoices = [];
let sfxBus = null;
// VS: las gemas encadenadas suben de tono semitono a semitono
let gemChain = 0, gemChainT = 0;

function sfxBusInit() {
    if (sfxBus || !audioCtx) return;
    try {
        // bus de efectos -> compresor suave -> salida: evita saturar cuando explotan 20 cosas a la vez
        sfxBus = audioCtx.createGain();
        const comp = audioCtx.createDynamicsCompressor();
        comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4;
        comp.attack.value = 0.003; comp.release.value = 0.2;
        sfxBus.connect(comp); comp.connect(audioCtx.destination);
    } catch (e) { sfxBus = null; }
}
function sfxOut() { return sfxBus || audioCtx.destination; }
function sfxLevel() { return masterVolume * (windowOpts ? windowOpts.sfx : 1) * 0.7; }

function preloadSfx() {
    if (sfxPreloaded || !audioCtx) return;
    sfxPreloaded = true;
    const byFile = {};
    for (const k in SFX_FILES) (byFile[SFX_FILES[k]] = byFile[SFX_FILES[k]] || []).push(k);
    for (const f in byFile) {
        fetch('assets/sfx/' + f).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(
            b => new Promise((ok, ko) => { const p = audioCtx.decodeAudioData(b, ok, ko); if (p && p.catch) p.catch(ko); })
        ).then(buf => { for (const k of byFile[f]) sfxBuffers[k] = buf; }).catch(() => {});
    }
}

function sfxDropVoice(v) {
    try { v.src.onended = null; v.src.stop(); } catch (e) {}
    const i = sfxVoices.indexOf(v); if (i >= 0) sfxVoices.splice(i, 1);
}

function playSound(type) {
    if (!audioCtx || !soundEnabled) return;
    if (audioCtx.state === 'suspended' && window._audioUnlocked) audioCtx.resume().catch(() => {});
    preloadSfx();
    try {
        if (sfxBuffers[type]) {
            const nowMs = performance.now();
            const throttle = SFX_THROTTLE[type] || 0;
            if (throttle) {
                if (sfxLast[type] && nowMs - sfxLast[type] < throttle) return;
                sfxLast[type] = nowMs;
            }
            const prio = SFX_PRIO[type] || 0;
            // límite por sonido: los de combate se descartan; el resto corta su copia más antigua
            const maxSame = SFX_MAX[type] || (prio >= 2 ? 2 : 3);
            let same = 0, oldestSame = null;
            for (const v of sfxVoices) if (v.type === type) { same++; if (!oldestSame) oldestSame = v; }
            if (same >= maxSame) { if (prio === 0) return; sfxDropVoice(oldestSame); }
            // límite global: si no cabe, se roba la voz más antigua de menor prioridad
            if (sfxVoices.length >= SFX_MAX_VOICES) {
                let victim = null;
                for (const v of sfxVoices) if (v.prio < prio || (prio === 0 && v.prio === 0)) { victim = v; break; }
                if (!victim) return;
                sfxDropVoice(victim);
            }
            let rate = 1, vol = SFX_VOL[type] || 0.6;
            const vr = SFX_VAR[type];
            if (vr) { rate += (Math.random() * 2 - 1) * vr[0]; vol *= 1 - Math.random() * vr[1]; }
            if (type === 'gem') {
                gemChain = (nowMs - gemChainT < 450) ? Math.min(gemChain + 1, 12) : 0;
                gemChainT = nowMs;
                rate = Math.pow(2, gemChain / 12);
            }
            const src = audioCtx.createBufferSource();
            const gain = audioCtx.createGain();
            gain.gain.value = vol * sfxLevel();
            src.buffer = sfxBuffers[type];
            src.playbackRate.value = rate;
            src.connect(gain);
            gain.connect(sfxOut());
            const voice = { src, type, prio };
            src.onended = () => { const i = sfxVoices.indexOf(voice); if (i >= 0) sfxVoices.splice(i, 1); try { gain.disconnect(); } catch (e) {} };
            sfxVoices.push(voice);
            src.start();
            return;
        }
        // fallback sintetizado mientras cargan los buffers (solo los más frecuentes)
        if (type !== 'hit' && type !== 'crit' && type !== 'coin' && type !== 'levelup' && type !== 'boss') return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(sfxOut());
        const now = audioCtx.currentTime, lv = sfxLevel();

        if (type === 'hit') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
            gain.gain.setValueAtTime(0.2 * lv, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'crit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
            gain.gain.setValueAtTime(0.25 * lv, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'coin') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987, now);
            osc.frequency.setValueAtTime(1318, now + 0.08);
            gain.gain.setValueAtTime(0.15 * lv, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'levelup') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(659, now + 0.08);
            osc.frequency.setValueAtTime(783, now + 0.15);
            gain.gain.setValueAtTime(0.2 * lv, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'boss') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.setValueAtTime(880, now + 0.15);
            osc.frequency.setValueAtTime(110, now + 0.45);
            gain.gain.setValueAtTime(0.25 * lv, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.7);
            osc.start(now); osc.stop(now + 0.7);
        }
    } catch(e){}
}

// iOS/Android suspenden el contexto al cambiar de app: se reanuda al volver
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && audioCtx && audioCtx.state !== 'running' && window._audioUnlocked) audioCtx.resume().catch(() => {});
});
