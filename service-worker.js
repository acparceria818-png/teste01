// service-worker.js - Portal QSSMA
const CACHE_NAME = 'portal-qssma-v1-' + new Date().getTime();
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './firebase.js',
  './manifest.json',
  'logo.jpg',
  'avatar.png'
];

// ========== INSTALAÇÃO ==========
self.addEventListener('install', event => {
  console.log('📦 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache aberto:', CACHE_NAME);
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('🚀 Instalação completa');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Erro na instalação:', error);
      })
  );
});

// ========== ATIVAÇÃO ==========
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== CACHE_NAME) {
              console.log('🗑️ Removendo cache antigo:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        console.log('🎯 Claiming clients');
        return self.clients.claim();
      })
  );
});

// ========== FETCH ==========
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições do Firebase
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) return;
  
  // Ignorar formulários Google
  if (url.hostname.includes('google.com')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Retornar do cache se disponível
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Buscar na rede
        return fetch(event.request)
          .then(networkResponse => {
            // Cachear apenas recursos locais
            if (url.origin === self.location.origin) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return networkResponse;
          })
          .catch(() => {
            // Fallback para página offline
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            return new Response('Conteúdo offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// ========== PUSH NOTIFICATIONS ==========
self.addEventListener('push', event => {
  const options = {
    body: 'Nova notificação do Portal QSSMA',
    icon: './logo.jpg',
    badge: './logo.jpg',
    vibrate: [100, 50, 100],
    data: { url: './' }
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.body || options.body;
      options.data = { ...options.data, ...data };
    } catch (e) {
      options.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Portal QSSMA', options)
  );
});

// ========== NOTIFICATION CLICK ==========
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        for (let client of windowClients) {
          if (client.url === './' && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
  );
});

console.log('✅ Service Worker carregado');
