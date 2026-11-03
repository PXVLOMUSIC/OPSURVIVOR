// Sincronización en la nube (functions/api/sync.js). Solo funciona en la web pública (opsurvivor.pages.dev).
// - El código de sincronización es la cuenta: 26 caracteres base32 (130 bits) generados aquí con crypto.
//   El servidor solo guarda su hash. Si se pierde el código, se pierde la copia de la nube (no la local).
// - Se sincroniza solo el progreso (meta); las opciones son de cada dispositivo.
// - Subida: unos segundos después de cada saveMeta (fin de partida, tienda...). Bajada: al abrir el juego
//   y al volver a la pestaña estando en el menú. Si los dos lados han cambiado, se pregunta cuál conservar.
const CS_KEY = 'op_survivor_sync';
const CS_ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const cs = { online: false, busy: false, timer: 0, conflict: null, msg: '', bad: false };

function csState() { try { return JSON.parse(localStorage.getItem(CS_KEY)) || null; } catch (e) { return null; } }
function csSetState(s) { try { s ? localStorage.setItem(CS_KEY, JSON.stringify(s)) : localStorage.removeItem(CS_KEY); } catch (e) {} }
function csLocalMeta() { try { return localStorage.getItem(SAVE_KEYS.meta) || ''; } catch (e) { return ''; } }
function csNewCode() {
    const r = crypto.getRandomValues(new Uint8Array(26));
    return Array.from(r, b => CS_ALPHA[b & 31]).join('');
}
// Admite minúsculas, espacios y guiones; O→0 e I/L→1 como en base32 de Crockford
function csNormalize(t) { return (t || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/[^0-9A-Z]/g, ''); }
function csPretty(c) { return c.replace(/^(.{5})(.{5})(.{5})(.{5})(.{6})$/, '$1-$2-$3-$4-$5'); }

// code = código de sincronización; si es null se usa la sesión de Google (cookie)
async function csFetch(method, code, body) {
    const res = await fetch('api/sync', {
        method, cache: 'no-store', credentials: 'same-origin', keepalive: method === 'PUT' && !!body && body.length < 60000,
        headers: { ...(code ? { authorization: 'Bearer ' + code } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
        body,
    });
    let j = {}; try { j = await res.json(); } catch (e) {}
    return { status: res.status, ...j };
}
function csErr(r) {
    return ({ 429: 'Demasiadas peticiones. Espera un minuto.', 413: 'La partida es demasiado grande para la nube.',
        404: 'No hay ninguna partida con ese código.', 400: 'Código no válido.', 401: 'Tu sesión de Google ha caducado. Vuelve a entrar.', 503: 'La nube no está disponible ahora.' })[r.status]
        || 'No se pudo conectar con la nube.';
}
function csNote(t, bad) { cs.msg = t; cs.bad = !!bad; csRender(); }

// Sube el progreso local si ha cambiado desde la última sincronización
async function csPush(force) {
    const s = csState();
    if (!s || !cs.online || cs.busy || cs.conflict) return;
    const local = csLocalMeta();
    if (!local || (!force && local === s.synced)) return;
    cs.busy = true;
    try {
        const r = await csFetch('PUT', s.code || null, JSON.stringify({ baseRev: s.rev, data: { game: 'opsurvivor', v: 1, date: new Date().toISOString(), meta: JSON.parse(local) } }));
        if (r.status === 200) { csSetState({ ...s, rev: r.rev, synced: local, at: r.updated }); cs.msg = ''; }
        else if (r.status === 409) csConflict(r);
        else csNote(csErr(r), true);
    } catch (e) { /* sin conexión: se reintenta en el próximo guardado */ }
    cs.busy = false; csRender();
}
function csSchedule() { if (csState() && cs.online) { clearTimeout(cs.timer); cs.timer = setTimeout(csPush, 4000); } }

// Baja la copia de la nube; si solo ha cambiado la nube se aplica, si han cambiado ambos se pregunta
async function csPull() {
    const s = csState();
    if (!s || !cs.online || cs.busy || (typeof gameState !== 'undefined' && gameState !== 'START')) return;
    cs.busy = true;
    let r;
    try { r = await csFetch('GET', s.code || null); } catch (e) { cs.busy = false; return; }
    cs.busy = false;
    if (r.status === 404 && s.mode === 'google') { csPush(true); return; } // primera vez con Google: se sube lo local
    if (r.status === 404) { csNote('La copia de la nube ya no existe. Desvincula este dispositivo o crea otra.', true); return; }
    if (r.status !== 200) { csNote(csErr(r), true); return; }
    const local = csLocalMeta();
    if (r.rev === s.rev) { if (local !== s.synced) csPush(); return; }
    if (local === s.synced || !local) csApply(r);
    else csConflict(r);
}
function csApply(r) {
    const s = csState(), m = JSON.stringify(r.data.meta);
    try { localStorage.setItem(SAVE_KEYS.meta, m); } catch (e) { return; }
    csSetState({ ...s, rev: r.rev, synced: m, at: r.updated });
    location.reload();
}
function csConflict(r) {
    cs.conflict = r;
    if (typeof showSavePanel === 'function' && (typeof gameState === 'undefined' || gameState === 'START')) showSavePanel();
    csRender();
}
function csKeepCloud() { const r = cs.conflict; cs.conflict = null; if (r) csApply(r); }
function csKeepLocal() {
    const r = cs.conflict, s = csState(); cs.conflict = null;
    if (r && s) { csSetState({ ...s, rev: r.rev }); csPush(true); }
}

// Acciones del panel
async function csCreate() {
    if (cs.busy) return;
    const code = csNewCode();
    csSetState({ code, rev: 0, synced: '' });
    await csPush(true);
    const s = csState();
    if (!s || !s.rev) { csSetState(null); csNote(cs.msg || 'No se pudo conectar con la nube.', true); return; }
    csNote('Copia creada. Guarda el código: es la única llave de tu partida en la nube.');
}
async function csLink() {
    if (cs.busy) return;
    const code = csNormalize(document.getElementById('cs-input').value);
    if (code.length !== 26) { csNote('El código tiene 26 caracteres.', true); return; }
    cs.busy = true;
    let r; try { r = await csFetch('GET', code); } catch (e) { r = { status: 0 }; }
    cs.busy = false;
    if (r.status !== 200) { csNote(csErr(r), true); return; }
    if (!confirm('¿Cargar la partida de la nube?\n' + saveSummary(r.data.meta) + '\n\nSustituye el progreso de este dispositivo:\n' + saveSummary(meta))) return;
    csSetState({ code, rev: 0, synced: '' });
    csApply(r);
}
function csUnlink() {
    if (!confirm('¿Desvincular este dispositivo? Tu partida local y la de la nube no se borran.')) return;
    csSetState(null); cs.conflict = null; csNote('Dispositivo desvinculado.');
}
async function csDelete() {
    const s = csState();
    if (!s || !confirm('¿Borrar la copia de la nube? La partida de este dispositivo se queda como está.')) return;
    try { const r = await csFetch('DELETE', s.code || null); if (r.status !== 200) { csNote(csErr(r), true); return; } }
    catch (e) { csNote('No se pudo conectar con la nube.', true); return; }
    csSetState(null); cs.conflict = null; csNote('Copia de la nube borrada.');
}
// Login con Google: el servidor deja una cookie de sesión; aquí solo se marca el dispositivo como vinculado
function csGoogleLink() { if (!csState()) csSetState({ mode: 'google', rev: 0, synced: '' }); }
async function csLogout() {
    if (!confirm('¿Cerrar sesión de Google en este dispositivo? La partida local y la de la nube no se borran.')) return;
    try { await fetch('api/google/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store' }); } catch (e) {}
    csSetState(null); cs.conflict = null; csNote('Sesión cerrada.');
}
function csCopy() {
    const s = csState(); if (!s) return;
    const t = csPretty(s.code);
    try { navigator.clipboard.writeText(t).then(() => csNote('Código copiado.'), () => csNote('Cópialo a mano: ' + t)); }
    catch (e) { csNote('Cópialo a mano: ' + t); }
}

function csRender() {
    const box = document.getElementById('cloud-box');
    if (!box) return;
    const s = csState(), esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    let h;
    if (!cs.online) h = '<p class="cs-note">La sincronización en la nube solo funciona en la web <b>opsurvivor.pages.dev</b>.</p>';
    else if (cs.conflict) {
        h = '<p class="cs-note">Esta partida ha cambiado aquí y en otro dispositivo. ¿Cuál quieres conservar?</p>' +
            '<div class="save-row">' +
            `<button class="op-btn" onclick="csKeepCloud()"><span class="op-ic" data-ico="up"></span><span>Nube<small>${esc(saveSummary(cs.conflict.data.meta))}</small></span></button>` +
            `<button class="op-btn" onclick="csKeepLocal()"><span class="op-ic" data-ico="ship"></span><span>Este dispositivo<small>${esc(saveSummary(meta))}</small></span></button></div>`;
    } else if (s && s.mode === 'google') {
        const when = s.at ? new Date(s.at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—';
        h = `<p class="cs-note">Sincronizada con Google · última subida ${esc(when)}</p>` +
            '<div class="save-row">' +
            '<button class="op-btn" onclick="csPush(true)"><span class="op-ic" data-ico="up"></span><span>Subir ahora</span></button>' +
            '<button class="op-btn" onclick="csLogout()"><span class="op-ic" data-ico="ship"></span><span>Cerrar sesión</span></button>' +
            '<button class="op-btn" onclick="csDelete()"><span class="op-ic" data-ico="power"></span><span>Borrar de la nube</span></button></div>';
    } else if (s) {
        const when = s.at ? new Date(s.at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—';
        h = `<p class="cs-note">Sincronizada · última subida ${esc(when)}</p>` +
            `<div class="cs-code" id="cs-code">${esc(csPretty(s.code))}</div>` +
            '<p class="cs-note">Escribe este código en otro dispositivo. Quien lo tenga puede cargar tu partida: no lo compartas.</p>' +
            '<div class="save-row">' +
            '<button class="op-btn" onclick="csCopy()"><span class="op-ic" data-ico="drop"></span><span>Copiar código</span></button>' +
            '<button class="op-btn" onclick="csPush(true)"><span class="op-ic" data-ico="up"></span><span>Subir ahora</span></button>' +
            '<button class="op-btn" onclick="csUnlink()"><span class="op-ic" data-ico="ship"></span><span>Desvincular</span></button>' +
            '<button class="op-btn" onclick="csDelete()"><span class="op-ic" data-ico="power"></span><span>Borrar de la nube</span></button></div>';
    } else {
        h = '<p class="cs-note">Guarda tu progreso en la nube. Entra con Google (solo se usa tu identificador, sin email ni nombre) o crea un código secreto.</p>' +
            '<button class="op-btn cs-wide" onclick="location.href=\'api/google/start\'"><span class="op-ic" data-ico="ship"></span><span>Entrar con Google</span></button>' +
            '<button class="op-btn cs-wide" onclick="csCreate()"><span class="op-ic" data-ico="up"></span><span>Crear código de sincronización</span></button>' +
            '<div class="cs-link"><input id="cs-input" class="cs-input" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXXX" aria-label="Código de sincronización">' +
            '<button class="op-btn" onclick="csLink()"><span class="op-ic" data-ico="play"></span><span>Vincular</span></button></div>';
    }
    if (cs.msg) h += `<p class="save-msg${cs.bad ? ' bad' : ''}">${esc(cs.msg)}</p>`;
    box.innerHTML = h;
    box.querySelectorAll('[data-ico]').forEach(el => { el.innerHTML = (typeof ICONS !== 'undefined' && ICONS[el.getAttribute('data-ico')]) || ''; });
}

// Arranque: comprueba si hay servidor (en el artifact o en local sin backend no lo hay)
(function csInit() {
    const base = saveMeta;
    saveMeta = function () { base(); csSchedule(); };
    const go = () => fetch('api/sync?ping=1', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(async j => {
        cs.online = !!(j && j.ok);
        if (cs.online) {
            // Vuelta del login con Google (?g=ok / ?g=err) o sesión ya existente sin dispositivo vinculado
            const q = new URLSearchParams(location.search).get('g');
            if (q) history.replaceState(null, '', location.pathname);
            if (q === 'err') cs.msg = 'No se pudo entrar con Google. Inténtalo de nuevo.', cs.bad = true;
            try { const me = await fetch('api/google/me', { cache: 'no-store', credentials: 'same-origin' }).then(r => r.json()); if (me.linked) csGoogleLink(); } catch (e) {}
        }
        csRender(); if (cs.online && csState()) csPull();
    }).catch(() => { cs.online = false; csRender(); });
    if (/^https?:$/.test(location.protocol)) go(); else csRender();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') csPull(); else if (cs.timer) { clearTimeout(cs.timer); csPush(); } });
})();
