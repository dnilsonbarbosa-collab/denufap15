# Criar o Service Worker (sw.js)
sw_code = """// Service Worker para Sistema de Gestão - 1° Pelotão Esperança
const CACHE_NAME = 'pelotao-esperanca-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './anotacoes.html',
    './fo-sistema.html',
    './manifest.json'
];

// Instalação - cachear recursos estáticos
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cache aberto');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => console.log('[SW] Erro ao cachear:', err))
    );
    self.skipWaiting();
});

// Ativação - limpar caches antigos
self.addEventListener('activate', (event) => {
    console.log('[SW] Ativando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Deletando cache antigo:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch - estratégia: Network First, depois Cache
self.addEventListener('fetch', (event) => {
    // Ignorar requisições não-GET
    if (event.request.method !== 'GET') return;
    
    // Ignorar requisições de analytics/CDNs externos
    if (!event.request.url.startsWith(self.location.origin)) return;
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Se resposta válida, atualizar cache
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Se falhar, tentar cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Se não estiver no cache, retornar página offline genérica
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        return new Response('Offline - Recurso não disponível', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Mensagens do cliente (para atualizações)
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
"""
