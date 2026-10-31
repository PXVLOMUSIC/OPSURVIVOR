// --- WEB AUDIO API SYNTHESIZER ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

// --- BACKGROUND MUSIC ---
const menuMusic = new Audio('assets/music/menu.mp3');
const battleMusic = new Audio('assets/music/battle.mp3');
menuMusic.loop = true; battleMusic.loop = true;
function updateMusic() {
    if (!soundEnabled) { menuMusic.pause(); battleMusic.pause(); return; }
    const vol = masterVolume * (windowOpts ? windowOpts.music : 1) * 0.75;
    if (gameState === 'START' || gameState === 'SHOP') {
        battleMusic.pause();
        // toggle del menu: silencia solo la musica del menu (la batalla sigue su slider)
        if (windowOpts && windowOpts.menuMusicMuted) { menuMusic.pause(); return; }
        // autoplay con sonido esta bloqueado por el navegador hasta el primer gesto:
        // arrancamos silenciado y activamos el sonido en el primer click.
        menuMusic.muted = !window._audioUnlocked;
        menuMusic.volume = vol;
        menuMusic.play().catch(() => {});
    } else if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'UPGRADE' || gameState === 'GAMEOVER' || gameState === 'VICTORY') {
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
    preloadSfx();
}

// === SFX 8/16-bit (pack CC0 "The Essential Retro Video Game Sound Effects Collection" de Juhani Junkala — assets/sfx/CREDITS.txt) ===
const SFX_FILES = {
    coin: 'coin.wav', gem: 'gem.wav', beli_rush: 'beli_rush.wav', buy: 'buy.wav', meat: 'meat.wav',
    levelup: 'levelup.wav', evolve: 'evolve.wav', achievement: 'achievement.wav',
    victory: 'victory.wav', gameover: 'gameover.wav', chest: 'chest.wav', reward: 'reward.wav',
    hit: 'hit.wav', crit: 'crit.wav', hurt: 'hit.wav', enemydie: 'enemydie.wav',
    boss: 'boss.wav', boss_die: 'boss_die.wav', death: 'death.wav',
    pistol: 'pistol.wav', gatling: 'gatling.wav', laser: 'laser.wav', slash: 'slash.wav',
    kick: 'kick.wav', boom: 'boom.wav', gear2: 'gear2.wav', haoshoku: 'haoshoku.wav',
    ui: 'ui.wav', select: 'select.wav', error: 'error.wav', muted: 'error.wav'
};
const sfxBuffers = {};
let sfxPreloaded = false;
// volumen relativo por sonido (el pack manda algunas muy fuertes)
const SFX_VOL = {
    enemydie: 0.3, hit: 0.55, gem: 0.4, coin: 0.45, gatling: 0.35, gun: 0, pistol: 0.5,
    meat: 0.5, chest: 0.6, reward: 0.55, ui: 0.4, select: 0.5, error: 0.4, muted: 0.35,
    beli_rush: 0.5, buy: 0.5, levelup: 0.5, evolve: 0.5, achievement: 0.55,
    victory: 0.6, gameover: 0.5, crit: 0.5, hurt: 0.45, boss: 0.5, boss_die: 0.5, death: 0.55,
    laser: 0.5, slash: 0.5, kick: 0.5, boom: 0.45, gear2: 0.45, haoshoku: 0.55,
    concasse: 0.5, partycourse: 0.5
};
// anti-spam: sonidos que se disparan en masa se acotan como en VS (cola de audio)
const SFX_THROTTLE = { hit: 50, crit: 80, coin: 45, gem: 30, enemydie: 70, slash: 70, kick: 70, laser: 70, pistol: 70, gatling: 150, boom: 100 };
const sfxLast = {};

function preloadSfx() {
    if (sfxPreloaded || !audioCtx) return;
    sfxPreloaded = true;
    for (const k in SFX_FILES) {
        fetch('assets/sfx/' + SFX_FILES[k]).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(
            b => audioCtx.decodeAudioData(b)
        ).then(buf => { sfxBuffers[k] = buf; }).catch(() => {});
    }
}

function playSound(type) {
    if (!audioCtx || !soundEnabled) return;
    preloadSfx();
    try {
        // ruta de archivo: buffer pre-cargado, con anti-spam y volumen por tipo
        if (sfxBuffers[type]) {
            const throttle = SFX_THROTTLE[type] || 0;
            if (throttle) {
                const now = performance.now();
                if (sfxLast[type] && now - sfxLast[type] < throttle) return;
                sfxLast[type] = now;
            }
            const src = audioCtx.createBufferSource();
            const gain = audioCtx.createGain();
            gain.gain.value = (SFX_VOL[type] || 0.75) * masterVolume * (windowOpts ? windowOpts.sfx : 1) * 0.7;
            src.buffer = sfxBuffers[type];
            src.connect(gain);
            gain.connect(audioCtx.destination);
            src.start();
            return;
        }
        // fallback sintetizado mientras cargan los buffers
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'hit') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampType ? osc.frequency.exponentialRampToValueAtTime(30, now + 0.1) : osc.frequency.linearRampToValueAtTime(30, now + 0.1);
            gain.gain.setValueAtTime(0.2 * masterVolume * (windowOpts ? windowOpts.sfx : 1) * 0.7, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'crit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
            gain.gain.setValueAtTime(0.25 * masterVolume * (windowOpts ? windowOpts.sfx : 1) * 0.7, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'coin') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987, now);
            osc.frequency.setValueAtTime(1318, now + 0.08);
            gain.gain.setValueAtTime(0.15 * masterVolume * (windowOpts ? windowOpts.sfx : 1) * 0.7, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'levelup') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(659, now + 0.08);
            osc.frequency.setValueAtTime(783, now + 0.15);
            gain.gain.setValueAtTime(0.2 * masterVolume * (windowOpts ? windowOpts.sfx : 1) * 0.7, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'boss') {
            // fanfarria de aparición de boss (VS: anuncio con sting propio)
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.setValueAtTime(880, now + 0.15);
            osc.frequency.setValueAtTime(110, now + 0.45);
            gain.gain.setValueAtTime(0.25 * masterVolume * (windowOpts ? windowOpts.sfx : 1) * 0.7, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.7);
            osc.start(now); osc.stop(now + 0.7);
        }
    } catch(e){}
}
