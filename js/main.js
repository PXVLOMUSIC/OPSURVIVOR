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
    // Arranca la música en el primer gesto del usuario (política de autoplay del navegador)
    if (!window._audioUnlocked) {
        window._audioUnlocked = true;
        if (!audioCtx) initAudio();
        try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {}
        try { menuMusic.muted = false; } catch (e) {}
        try { updateMusic(); } catch (err) {}
    }
}, true);
