// Service worker: juego sin conexión y carga instantánea en la segunda visita.
// - Imágenes, sonidos cortos y fuentes: primero la caché (no cambian de nombre al editarlos poco).
// - HTML, JS, CSS y manifest: red primero y caché si no hay conexión, para que siempre llegue la última versión.
// - La música (.mp3) no pasa por aquí: el navegador la pide por rangos y la cachea él mismo.
// Sube CACHE_VER si cambias un asset sin cambiar su nombre y quieres forzar que se descargue de nuevo.
const CACHE_VER = 'opsurvivor-v3';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET' || req.headers.has('range')) return;
    const url = new URL(req.url);
    const sameOrigin = url.origin === self.location.origin;
    const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
    if (!sameOrigin && !isFont) return;
    if (/\.mp3$/.test(url.pathname)) return;
    const isAsset = isFont || /\.(png|jpe?g|webp|gif|wav|ogg|woff2?)$/.test(url.pathname);
    if (isAsset) {
        e.respondWith(caches.open(CACHE_VER).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
            if (res.ok || res.type === 'opaque') c.put(req, res.clone());
            return res;
        }))));
    } else {
        e.respondWith(fetch(req).then(res => {
            if (res.ok) { const copy = res.clone(); caches.open(CACHE_VER).then(c => c.put(req, copy)); }
            return res;
        }).catch(() => caches.match(req)));
    }
});
