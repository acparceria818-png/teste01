// service-worker.js - VERSÃO SIMPLIFICADA E FUNCIONAL
const CACHE_NAME = 'portal-qssma-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './firebase.js',
  './manifest.json',
  './logo.jpg',
  './avatar.png'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('📦 Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativar Service Worker
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Ativando...');
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== CACHE_NAME) {
              console.log('🗑️ Removendo cache antigo:', cache);
              return caches.delete(cache);
            }
          })
        );
      }),
      // Claim clients
      self.clients.claim()
    ])
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') return;
  
  // Para arquivos do próprio app, usar cache-first
  if (event.request.url.includes(location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Retornar do cache se existir
          if (cachedResponse) {
            console.log('💾 Cache hit:', event.request.url);
            return cachedResponse;
          }
          
          // Buscar da rede
          return fetch(event.request)
            .then(networkResponse => {
              // Não cachear requisições que falharam
              if (!networkResponse || networkResponse.status !== 200) {
                return networkResponse;
              }
              
              // Clonar resposta para cache
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return networkResponse;
            })
            .catch(error => {
              // Se for navegação e offline, mostrar página offline
              if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
              }
              
              throw error;
            });
        })
    );
  } else {
    // Para recursos externos, buscar da rede direto
    event.respondWith(fetch(event.request));
  }
});

// Mensagem para atualizar
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker simplificado carregado!');
