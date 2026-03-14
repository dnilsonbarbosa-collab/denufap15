const CACHE_NAME = 'gestao-militar-v2.0.2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './anotacoes.html',
  './fo-sistema.html',
  './manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando versão:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Assets cacheados com sucesso');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Erro ao cachear:', err);
        // Continua mesmo com erro para não bloquear
        return self.skipWaiting();
      })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('gestao-militar-') && name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deletando cache antigo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Ativado e controlando clientes');
        return self.clients.claim();
      })
  );
});

// Interceptação de requisições - Cache First strategy
self.addEventListener('fetch', (event) => {
  // Só processa GET
  if (event.request.method !== 'GET') return;
  
  // Ignora requisições de outros domínios
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Se tem no cache, retorna e atualiza em background
        if (cachedResponse) {
          // Atualiza cache em background
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {});
          
          return cachedResponse;
        }

        // Se não tem no cache, busca na rede
        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clona e guarda no cache
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          })
          .catch((error) => {
            console.error('[SW] Fetch falhou:', error);
            // Se for navegação, retorna index.html offline
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Comunicação com o cliente (main thread)
self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida:', event.data);
  
  if (event.data === 'SKIP_WAITING') {
    console.log('[SW] Pulando espera...');
    self.skipWaiting();
  }
  
  if (event.data === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        version: CACHE_NAME,
        timestamp: new Date().toISOString()
      });
    }
  }
});
