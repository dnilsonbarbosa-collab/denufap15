const CACHE_NAME = 'anotacoes-v1';
const STATIC_CACHE = 'anotacoes-static-v1';
const DYNAMIC_CACHE = 'anotacoes-dynamic-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'
];

const OFFLINE_PAGE = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - Sistema de Anotações</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
            color: white;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 20px;
        }
        .icon {
            width: 80px;
            height: 80px;
            margin-bottom: 24px;
            opacity: 0.8;
        }
        h1 { font-size: 1.5rem; margin-bottom: 12px; }
        p { font-size: 1rem; opacity: 0.8; margin-bottom: 24px; line-height: 1.5; }
        .btn {
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            color: white;
            padding: 12px 32px;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.3s;
        }
        .btn:hover { background: white; color: #1a237e; }
        .status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 8px 16px;
            background: rgba(255,255,255,0.2);
            border-radius: 20px;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .status::before {
            content: '';
            width: 8px;
            height: 8px;
            background: #ff9800;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="status">Modo Offline</div>
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
    <h1>Você está offline</h1>
    <p>Verifique sua conexão com a internet.<br>Seus dados locais ainda estão disponíveis.</p>
    <button class="btn" onclick="window.location.reload()">Tentar novamente</button>
</body>
</html>
`;

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Armazena página offline no cache dinâmico
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          const offlineResponse = new Response(OFFLINE_PAGE, {
            headers: { 'Content-Type': 'text/html' }
          });
          return cache.put('./offline.html', offlineResponse);
        });
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Erro na instalação:', err))
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de cache: Cache First, falling back to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET
  if (request.method !== 'GET') return;

  // Estratégia específica para a página principal
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    event.respondWith(
      caches.match('./index.html')
        .then((response) => {
          return response || fetch(request)
            .then((fetchResponse) => {
              return caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, fetchResponse.clone());
                return fetchResponse;
              });
            })
            .catch(() => {
              return caches.match('./offline.html');
            });
        })
    );
    return;
  }

  // Estratégia para assets estáticos (CDN)
  if (url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request)
            .then((fetchResponse) => {
              return caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, fetchResponse.clone());
                return fetchResponse;
              });
            });
        })
    );
    return;
  }

  // Estratégia padrão: Stale While Revalidate
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.log('[SW] Fetch falhou, usando cache:', error);
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
      .catch(() => {
        // Retorna página offline se nada estiver disponível
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('./offline.html');
        }
        return new Response('Offline', { status: 503 });
      })
  );
});

// Sincronização em background (para quando voltar online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-anotacoes') {
    event.waitUntil(syncAnotacoes());
  }
});

// Notificações push (opcional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nova atualização disponível',
    icon: './icon-192x192.png',
    badge: './icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: './index.html'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Sistema de Anotações', options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || './index.html')
    );
  }
});

// Mensagens do cliente (comunicação com a página)
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_DATA') {
    // Cacheia dados específicos do usuário
    caches.open(DYNAMIC_CACHE).then((cache) => {
      const dataResponse = new Response(JSON.stringify(event.data.payload), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put('./user-data.json', dataResponse);
    });
  }
});

// Função auxiliar para sincronização
async function syncAnotacoes() {
  console.log('[SW] Sincronizando anotações...');
  // Aqui você pode implementar sincronização com servidor quando houver backend
}

// Atualização periódica do cache (a cada 24 horas)
setInterval(() => {
  caches.open(STATIC_CACHE).then((cache) => {
    cache.addAll(STATIC_ASSETS);
  });
}, 24 * 60 * 60 * 1000);
