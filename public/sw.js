const CACHE_NAME = 'panelcraft-cache-v3';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Instalação - Busca os arquivos básicos
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Força a nova versão a assumir imediatamente
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Ativação - Limpa caches antigos (importante para evitar tela branca)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Estratégia: Network First (Tenta internet primeiro, se falhar usa cache)
// Isso evita que o usuário fique preso em uma versão antiga/quebrada do cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
