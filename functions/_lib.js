// Utilidades compartidas por las Pages Functions (sin manejadores: no son rutas).
export const SESSION_COOKIE = 'ops_s';
export const SESSION_DAYS = 30;

export const json = (obj, status = 200, extra = {}) => new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...extra },
});

export async function sha256Hex(s) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function b64url(bytes) {
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomToken(n = 32) { return b64url(crypto.getRandomValues(new Uint8Array(n))); }

export function getCookie(request, name) {
    const h = request.headers.get('cookie') || '';
    for (const part of h.split(';')) {
        const i = part.indexOf('=');
        if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
    }
    return '';
}

export function setCookie(name, value, maxAge) {
    return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export async function ensureSchema(db) {
    await db.batch([
        db.prepare('CREATE TABLE IF NOT EXISTS saves (id TEXT PRIMARY KEY, rev INTEGER NOT NULL, updated INTEGER NOT NULL, data TEXT NOT NULL)'),
        db.prepare('CREATE TABLE IF NOT EXISTS rate (k TEXT PRIMARY KEY, n INTEGER NOT NULL, t INTEGER NOT NULL)'),
        db.prepare('CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, account TEXT NOT NULL, exp INTEGER NOT NULL)'),
    ]);
}

// Devuelve el id de la cuenta (fila de saves) si la cookie de sesión de Google es válida
export async function sessionAccount(db, request) {
    const t = getCookie(request, SESSION_COOKIE);
    if (!/^[A-Za-z0-9_-]{43}$/.test(t)) return null;
    const row = await db.prepare('SELECT account, exp FROM sessions WHERE id = ?1').bind(await sha256Hex('session:' + t)).first();
    if (!row || row.exp < Date.now()) return null;
    return row.account;
}
