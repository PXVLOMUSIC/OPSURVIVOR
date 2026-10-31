// Arranque: se ejecuta cuando todos los módulos ya están cargados.
// Mantener aquí cualquier llamada de inicialización que use funciones de varios archivos.

loadOpts();
applyOpts();
updateMetaUI();
selectMap('baratie');
selectCharacter('luffy');
updateHudPortrait();
selectCurse(0);
updateMenuMusicBtn();

initAudio();
updateMusic();
// Sonido de "click" en cada pulsación con el ratón sobre elementos interactivos
document.addEventListener('click', function (e) {
    const t = e.target;
    if (!t) return;
    const hit = t.closest('button, [onclick], .upgrade-card, .map-btn, .curse-btn, .char-card, .btn-start, input[type="range"]');
    if (hit) {
        try { if (!audioCtx) initAudio(); if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); playSound('ui'); } catch (err) {}
    }
    unlockAudio();
}, true);

// --- Desbloqueo de audio ---
// La musica arranca solo con el primer clic o toque en la pagina (no con teclas).
// La pantalla de titulo pide ese clic antes de mostrar el menu.
function unlockAudio() {
    if (!audioCtx) initAudio();
    try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {}
    if (window._audioUnlocked) return;
    window._audioUnlocked = true;
    try { menuMusic.muted = false; } catch (e) {}
    try { updateMusic(); } catch (err) {}
}
['pointerdown', 'touchend'].forEach(ev =>
    window.addEventListener(ev, unlockAudio, { capture: true, passive: true }));

(function setupPressStart() {
    const ps = document.getElementById('press-start');
    if (!ps) return;
    const touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    const txt = document.getElementById('press-start-txt');
    if (txt) txt.innerText = touch ? 'TOCA LA PANTALLA' : 'HAZ CLIC PARA ZARPAR';
    let done = false;
    function dismiss(e) {
        if (done) return;
        done = true;
        if (e) { e.preventDefault(); e.stopPropagation(); }
        unlockAudio();
        try { playSound('ui'); } catch (err) {}
        ps.classList.add('ps-out');
        setTimeout(() => ps.remove(), 500);
    }
    // el clic (no pointerdown) evita que el mismo gesto pulse un boton del menu de debajo
    ps.addEventListener('click', dismiss);
})();
