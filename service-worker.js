// service-worker.js - VERSÃO AVANÇADA
const CACHE_NAME = 'portal-qssma-v4-' + new Date().getTime();
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './firebase.js',
  './manifest.json',
  './assets/logo.jpg',
  './assets/avatar.png'
];

const API_CACHE_NAME = 'portal-qssma-api-cache';
const DYNAMIC_CACHE_NAME = 'portal-qssma-dynamic-cache';

// Estratégias de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// URLs que devem usar cache-first
const CACHE_FIRST_URLS = [
  /\.(css|js)$/,
  /\.(png|jpg|jpeg|gif|svg|ico)$/,
  /\.(woff|woff2|eot|ttf)$/
];

// URLs que devem usar network-first
const NETWORK_FIRST_URLS = [
  /\/api\//,
  /\.json$/,
  /firebase/
];

// URLs que não devem ser cacheadas
const NO_CACHE_URLS = [
  /\/__\/auth\//,
  /\/identitytoolkit\//
];

self.addEventListener('install', event => {
  console.log('📦 Service Worker: Instalando Portal QSSMA v4...');
  
  event.waitUntil(
    Promise.all([
      // Cache dos assets core
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('✅ Cache aberto:', CACHE_NAME);
          return cache.addAll(CORE_ASSETS);
        }),
      
      // Cache de API
      caches.open(API_CACHE_NAME)
        .then(cache => {
          console.log('✅ Cache de API aberto');
          return cache.addAll([]); // Adicionar endpoints de API importantes
        }),
      
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Ativando...');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.map(cache => {
              if (cache !== CACHE_NAME && 
                  cache !== API_CACHE_NAME && 
                  cache !== DYNAMIC_CACHE_NAME) {
                console.log('🗑️ Removendo cache antigo:', cache);
                return caches.delete(cache);
              }
            })
          );
        }),
      
      // Claim clients
      self.clients.claim(),
      
      // Limpar cache dinâmico se muito antigo
      limparCacheAntigo()
    ])
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorar URLs específicas
  if (NO_CACHE_URLS.some(regex => regex.test(url.href))) {
    return;
  }
  
  // Escolher estratégia baseada na URL
  let strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  
  if (CACHE_FIRST_URLS.some(regex => regex.test(url.href))) {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  } else if (NETWORK_FIRST_URLS.some(regex => regex.test(url.href))) {
    strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  // Aplicar estratégia
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(event.request));
      break;
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirst(event.request));
      break;
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(event.request));
      break;
      
    default:
      event.respondWith(networkFirst(event.request));
  }
});

// Estratégias de cache
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Log de hit do cache
    console.log('💾 Cache hit:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache da resposta se for bem-sucedida
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Se offline e não tem cache, retornar offline page
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    
    throw error;
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Atualizar cache
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('🌐 Offline, buscando no cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Para navegação, retornar offline page
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Retornar do cache imediatamente se existir
  const fetchPromise = fetch(request).then(networkResponse => {
    // Atualizar cache com nova resposta
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Ignorar erros de rede
  });
  
  return cachedResponse || fetchPromise;
}

// Limpar cache antigo
async function limparCacheAntigo() {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const keys = await cache.keys();
  const umaSemanaAtras = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const dataResposta = new Date(dateHeader).getTime();
        if (dataResposta < umaSemanaAtras) {
          await cache.delete(request);
        }
      }
    }
  }
}

// Push notifications
self.addEventListener('push', event => {
  console.log('📬 Push notification recebida');
  
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Nova notificação do Portal QSSMA',
    icon: './assets/logo.jpg',
    badge: './assets/logo.jpg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './',
      timestamp: new Date().toISOString()
    },
    actions: data.actions || []
  };
  
  // Adicionar tag para agrupamento
  if (data.tag) {
    options.tag = data.tag;
  }
  
  // Adicionar imagem se disponível
  if (data.image) {
    options.image = data.image;
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Portal QSSMA', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('👆 Notificação clicada');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || './';
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then(windowClients => {
      // Verificar se já há uma janela aberta
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync (para enviar dados quando offline)
self.addEventListener('sync', event => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-avisos') {
    event.waitUntil(syncAvisos());
  }
});

async function syncAvisos() {
  console.log('🔄 Sincronizando avisos...');
  // Implementar lógica de sincronização
}

// Periodic background sync (para atualizações periódicas)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-cache') {
      event.waitUntil(updateCachePeriodically());
    }
  });
}

async function updateCachePeriodically() {
  console.log('🔄 Atualizando cache periodicamente...');
  
  // Atualizar páginas importantes
  const importantUrls = ['./', './index.html'];
  
  for (const url of importantUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(url, response);
      }
    } catch (error) {
      console.log('Erro ao atualizar cache:', url, error);
    }
  }
}

// Log de eventos do Service Worker
self.addEventListener('message', event => {
  console.log('📨 Mensagem recebida:', event.data);
  
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker carregado e pronto!');
