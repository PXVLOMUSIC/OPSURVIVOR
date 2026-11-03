// Login con Google (OpenID Connect, flujo de código). Solo se pide el identificador («sub»): sin email ni nombre.
// En D1 solo se guarda el hash del identificador. La sesión va en una cookie HttpOnly, Secure y SameSite=Lax.
// Rutas: GET start → Google · GET callback → vuelve a la web con ?g=ok · GET me → { linked } · POST logout.
import { ensureSchema, json, sha256Hex, randomToken, getCookie, setCookie, sessionAccount, SESSION_COOKIE, SESSION_DAYS } from '../../_lib.js';

const ORIGINS = ['https://opsurvivor.pages.dev', 'http://localhost:8788'];
const DAY = 86400000;

function redirect(location, cookies = []) {
    const h = new Headers({ location, 'cache-control': 'no-store' });
    for (const c of cookies) h.append('set-cookie', c);
    return new Response(null, { status: 302, headers: h });
}

function idTokenPayload(jwt) {
    const seg = (jwt || '').split('.')[1];
    if (!seg) return null;
    const b64 = seg.replace(/-/g, '+').replace(/_/g, '/');
    try { return JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))); } catch (e) { return null; }
}

export async function onRequest({ request, env, params }) {
    const url = new URL(request.url);
    const action = params.action;
    if (!env.DB) return json({ error: 'no_db' }, 503);
    const db = env.DB;
    await ensureSchema(db);

    if (action === 'me' && request.method === 'GET') {
        return json({ linked: !!(await sessionAccount(db, request)) });
    }
    if (action === 'logout' && request.method === 'POST') {
        const t = getCookie(request, SESSION_COOKIE);
        if (/^[A-Za-z0-9_-]{43}$/.test(t)) await db.prepare('DELETE FROM sessions WHERE id = ?1').bind(await sha256Hex('session:' + t)).run();
        return json({ ok: true }, 200, { 'set-cookie': setCookie(SESSION_COOKIE, '', 0) });
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return json({ error: 'no_google' }, 503);
    const origin = ORIGINS.includes(url.origin) ? url.origin : ORIGINS[0];
    const redirectUri = origin + '/api/google/callback';

    if (action === 'start' && request.method === 'GET') {
        const state = randomToken(24);
        const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        auth.search = new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: 'code',
            scope: 'openid', state, prompt: 'select_account',
        }).toString();
        return redirect(auth.toString(), [setCookie('ops_state', state, 600)]);
    }

    if (action === 'callback' && request.method === 'GET') {
        const clear = setCookie('ops_state', '', 0);
        const state = url.searchParams.get('state') || '';
        const code = url.searchParams.get('code') || '';
        const expected = getCookie(request, 'ops_state');
        if (!code || !state || !expected || state !== expected) return redirect('/?g=err', [clear]);
        const tr = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
        });
        const tok = tr.ok ? await tr.json() : null;
        const p = tok && idTokenPayload(tok.id_token);
        const issOk = p && (p.iss === 'https://accounts.google.com' || p.iss === 'accounts.google.com');
        if (!p || !issOk || p.aud !== env.GOOGLE_CLIENT_ID || !p.sub || !(p.exp * 1000 > Date.now())) return redirect('/?g=err', [clear]);
        const account = await sha256Hex('google:' + p.sub);
        const token = randomToken(32);
        await db.prepare('INSERT INTO sessions (id, account, exp) VALUES (?1, ?2, ?3)')
            .bind(await sha256Hex('session:' + token), account, Date.now() + SESSION_DAYS * DAY).run();
        await db.prepare('DELETE FROM sessions WHERE exp < ?1').bind(Date.now()).run();
        return redirect('/?g=ok', [clear, setCookie(SESSION_COOKIE, token, SESSION_DAYS * 86400)]);
    }

    return json({ error: 'not_found' }, 404);
}
