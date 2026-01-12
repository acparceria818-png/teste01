// service-worker.js - VERSÃO OTIMIZADA
const CACHE_NAME = 'portal-qssma-v4-' + new Date().getTime();
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './assets/logo.jpg',
  './assets/avatar.png'
];

// JS Modules (cache separado para atualizações)
const JS_MODULES = [
  './js/app.js',
  './js/state.js',
  './js/auth.js',
  './js/avisos.js',
  './js/dashboard.js',
  './js/ui.js',
  './js/theme.js',
  './js/pwa.js',
  './js/forms.js',
  './js/notifications.js',
  './js/emergency.js',
  './js/utils.js',
  './firebase.js'
];

self.addEventListener('install', event => {
  console.log('📦 Service Worker: Instalando...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)),
      caches.open(`${CACHE_NAME}-js`).then(cache => cache.addAll(JS_MODULES))
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== `${CACHE_NAME}-js`) {
            console.log('🗑️ Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Firebase/Google APIs - network only
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') ||
      url.hostname.includes('google.com')) {
    return;
  }
  
  // Assets locais - cache first
  if (url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') ||
      url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // Páginas HTML - network first
  event.respondWith(networkFirst(event.request));
});

// Estratégia: Cache First
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME + (request.url.endsWith('.js') ? '-js' : ''));
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Se offline e não tem cache, mostrar offline page
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    throw error;
  }
}

// Estratégia: Network First
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    
    throw error;
  }
}

// Background sync para dados offline
self.addEventListener('sync', event => {
  if (event.tag === 'sync-avisos') {
    event.waitUntil(syncAvisos());
  }
});

async function syncAvisos() {
  console.log('🔄 Sincronizando dados offline...');
}
