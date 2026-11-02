// Exportar e importar la partida guardada (progreso y opciones de localStorage).
// - Archivo .json descargable y, como alternativa (móvil o artifact sin descargas), un código de texto para copiar y pegar.
// - Al importar se valida, se pide confirmación y se recarga la página para empezar con el estado nuevo limpio.
const SAVE_KEYS = { meta: 'op_survivor_meta', opts: 'op_survivor_opts' };

function saveExportData() {
    saveMeta();
    const raw = k => { try { return JSON.parse(localStorage.getItem(SAVE_KEYS[k]) || 'null'); } catch (e) { return null; } };
    return { game: 'opsurvivor', v: 1, date: new Date().toISOString(), meta: raw('meta'), opts: raw('opts') };
}
// Código de texto: JSON en base64 (UTF-8), sin espacios para copiarlo de una vez
function saveToCode(data) { return btoa(unescape(encodeURIComponent(JSON.stringify(data)))); }
function saveFromText(txt) {
    txt = (txt || '').trim();
    if (!txt) throw new Error('Está vacío.');
    let data;
    try { data = JSON.parse(txt[0] === '{' ? txt : decodeURIComponent(escape(atob(txt.replace(/\s+/g, ''))))); }
    catch (e) { throw new Error('No es una partida de One Piece Survivor.'); }
    if (!data || data.game !== 'opsurvivor' || !data.meta || typeof data.meta !== 'object' || typeof data.meta.beli !== 'number')
        throw new Error('No es una partida de One Piece Survivor.');
    if ((data.v || 1) > 1) throw new Error('La partida es de una versión más nueva del juego.');
    return data;
}
function saveSummary(m) {
    const chars = Object.keys(CHAR_ANIMS || {}).filter(c => m.unlocked && m.unlocked[c]).length;
    const ach = Object.keys(m.achievements || {}).length;
    return `฿${(m.beli || 0).toLocaleString('es-ES')} · ${chars} piratas · ${ach} logros`;
}

function showSavePanel() {
    playSound('ui');
    const data = saveExportData();
    document.getElementById('save-code').value = saveToCode(data);
    document.getElementById('save-current').textContent = 'Partida actual: ' + saveSummary(data.meta || {});
    saveMsg('');
    document.getElementById('save-screen').style.display = 'flex';
}
function closeSavePanel() { document.getElementById('save-screen').style.display = 'none'; }
function saveMsg(t, bad) { const el = document.getElementById('save-msg'); el.textContent = t; el.className = 'save-msg' + (bad ? ' bad' : ''); }

function saveDownload() {
    const data = saveExportData();
    const name = 'opsurvivor-partida-' + data.date.slice(0, 10) + '.json';
    try {
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        saveMsg('Archivo descargado: ' + name + '. Si no aparece, copia el código.');
    } catch (e) { saveMsg('No se pudo descargar. Copia el código de abajo.', true); }
}
function saveCopy() {
    const ta = document.getElementById('save-code');
    ta.value = saveToCode(saveExportData());
    const ok = () => saveMsg('Código copiado. Pégalo en otro navegador con «Importar código».');
    try { navigator.clipboard.writeText(ta.value).then(ok, () => { ta.select(); document.execCommand('copy') ? ok() : saveMsg('Selecciona el código y cópialo a mano.', true); }); }
    catch (e) { ta.select(); document.execCommand('copy') ? ok() : saveMsg('Selecciona el código y cópialo a mano.', true); }
}
function saveApply(data) {
    if (!confirm('¿Cargar esta partida?\n' + saveSummary(data.meta) + '\n\nSustituye por completo tu progreso actual.')) return;
    try {
        localStorage.setItem(SAVE_KEYS.meta, JSON.stringify(data.meta));
        if (data.opts) localStorage.setItem(SAVE_KEYS.opts, JSON.stringify(data.opts));
    } catch (e) { saveMsg('El navegador no deja guardar (¿modo privado?).', true); return; }
    location.reload();
}
function saveImportCode() {
    try { saveApply(saveFromText(document.getElementById('save-code').value)); }
    catch (e) { saveMsg(e.message, true); playSound('error'); }
}
function saveImportFile(input) {
    const f = input.files && input.files[0];
    input.value = '';
    if (!f) return;
    if (f.size > 2e6) { saveMsg('El archivo es demasiado grande.', true); return; }
    f.text().then(t => saveApply(saveFromText(t))).catch(e => { saveMsg(e.message, true); playSound('error'); });
}
