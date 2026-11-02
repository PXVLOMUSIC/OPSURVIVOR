// Sincronización de partida entre dispositivos (Cloudflare Pages Functions + D1, binding «DB»).
// - Sin cuentas ni datos personales: el código de sincronización (26 caracteres base32, 130 bits
//   aleatorios generados en el navegador) es la credencial. Llega por HTTPS en la cabecera
//   Authorization y en D1 solo se guarda su SHA-256, nunca el código.
// - GET    /api/sync          → { rev, updated, data }  (404 si el código no tiene copia)
// - PUT    /api/sync          { baseRev, data } → { rev, updated }; 409 + copia remota si baseRev no es la última
// - DELETE /api/sync          → borra la copia de la nube
// - GET    /api/sync?ping=1   → { ok: true } (para saber si hay servidor; no necesita código)
// Límite: 60 peticiones por minuto e IP, guardado de 64 KB como máximo y validado.
const MAX_BYTES = 64 * 1024;
const RATE_PER_MIN = 60;
const CODE_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/; // base32 de Crockford
let schemaReady = false;

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});

async function ensureSchema(db) {
    if (schemaReady) return;
    await db.batch([
        db.prepare('CREATE TABLE IF NOT EXISTS saves (id TEXT PRIMARY KEY, rev INTEGER NOT NULL, updated INTEGER NOT NULL, data TEXT NOT NULL)'),
        db.prepare('CREATE TABLE IF NOT EXISTS rate (k TEXT PRIMARY KEY, n INTEGER NOT NULL, t INTEGER NOT NULL)'),
    ]);
    schemaReady = true;
}

async function sha256Hex(s) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Ventana fija de un minuto por IP (la IP se guarda con hash y la fila se borra al minuto siguiente)
async function rateLimited(db, request) {
    const ip = request.headers.get('cf-connecting-ip') || 'local';
    const minute = Math.floor(Date.now() / 60000);
    const k = (await sha256Hex('rl:' + ip)).slice(0, 32);
    const row = await db.prepare(
        'INSERT INTO rate (k, n, t) VALUES (?1, 1, ?2) ON CONFLICT(k) DO UPDATE SET n = CASE WHEN t = ?2 THEN n + 1 ELSE 1 END, t = ?2 RETURNING n'
    ).bind(k, minute).first();
    if (Math.random() < 0.02) await db.prepare('DELETE FROM rate WHERE t < ?1').bind(minute - 1).run();
    return row && row.n > RATE_PER_MIN;
}

function validSave(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    if (data.game !== 'opsurvivor' || typeof data.v !== 'number') return false;
    const m = data.meta;
    return !!m && typeof m === 'object' && !Array.isArray(m) && typeof m.beli === 'number' && isFinite(m.beli);
}

export async function onRequest({ request, env }) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.searchParams.has('ping')) return json({ ok: !!env.DB });
    if (!env.DB) return json({ error: 'no_db' }, 503);
    const db = env.DB;
    await ensureSchema(db);
    if (await rateLimited(db, request)) return json({ error: 'rate' }, 429);

    const auth = request.headers.get('authorization') || '';
    const code = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!CODE_RE.test(code)) return json({ error: 'bad_code' }, 400);
    const id = await sha256Hex('opsurvivor-sync:' + code);

    if (request.method === 'GET') {
        const row = await db.prepare('SELECT rev, updated, data FROM saves WHERE id = ?1').bind(id).first();
        if (!row) return json({ error: 'not_found' }, 404);
        return json({ rev: row.rev, updated: row.updated, data: JSON.parse(row.data) });
    }

    if (request.method === 'PUT') {
        const len = +(request.headers.get('content-length') || 0);
        if (len > MAX_BYTES + 1024) return json({ error: 'too_big' }, 413);
        const text = await request.text();
        if (text.length > MAX_BYTES + 1024) return json({ error: 'too_big' }, 413);
        let body;
        try { body = JSON.parse(text); } catch (e) { return json({ error: 'bad_json' }, 400); }
        const baseRev = body && Number.isInteger(body.baseRev) && body.baseRev >= 0 ? body.baseRev : -1;
        if (baseRev < 0 || !validSave(body.data)) return json({ error: 'bad_save' }, 400);
        const data = JSON.stringify(body.data);
        if (data.length > MAX_BYTES) return json({ error: 'too_big' }, 413);
        const now = Date.now();
        // Escritura condicional: solo si la nube sigue en baseRev (o no existe y baseRev es 0)
        const res = baseRev === 0
            ? await db.prepare('INSERT INTO saves (id, rev, updated, data) VALUES (?1, 1, ?2, ?3) ON CONFLICT(id) DO NOTHING').bind(id, now, data).run()
            : await db.prepare('UPDATE saves SET rev = rev + 1, updated = ?2, data = ?3 WHERE id = ?1 AND rev = ?4').bind(id, now, data, baseRev).run();
        if (res.meta.changes === 1) return json({ rev: baseRev + 1, updated: now });
        const row = await db.prepare('SELECT rev, updated, data FROM saves WHERE id = ?1').bind(id).first();
        if (!row) return json({ error: 'not_found' }, 404);
        return json({ error: 'conflict', rev: row.rev, updated: row.updated, data: JSON.parse(row.data) }, 409);
    }

    if (request.method === 'DELETE') {
        await db.prepare('DELETE FROM saves WHERE id = ?1').bind(id).run();
        return json({ ok: true });
    }
    return json({ error: 'method' }, 405);
}
