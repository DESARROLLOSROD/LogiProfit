// Service Worker para LogiProfit PWA
const CACHE_NAME = 'logiprofit-v1'
const API_CACHE_NAME = 'logiprofit-api-v1'

// Assets estáticos críticos para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/truck.svg',
]

// Instalar Service Worker y cachear assets estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando assets estáticos')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activar Service Worker y limpiar caches antiguos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo cachear requests GET
  if (request.method !== 'GET') {
    return
  }

  // API requests: Stale-While-Revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE_NAME))
    return
  }

  // Assets estáticos: Cache First
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME))
    return
  }

  // HTML: Network First
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, CACHE_NAME))
    return
  }

  // Default: Network First
  event.respondWith(networkFirst(request, CACHE_NAME))
})

// Estrategia Cache First (para assets estáticos)
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('[SW] Error en cache first:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Estrategia Network First (para HTML)
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    return new Response('Offline - No cached version available', { status: 503 })
  }
}

// Estrategia Stale-While-Revalidate (para API)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  })

  // Retornar cached inmediatamente si existe, sino esperar network
  return cachedResponse || fetchPromise
}

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      })
    )
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event)

  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de LogiProfit',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'logiprofit-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Ver detalles',
      },
      {
        action: 'close',
        title: 'Cerrar',
      },
    ],
  }

  event.waitUntil(self.registration.showNotification('LogiProfit', options))
})

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada:', event)

  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus()
          }
        }
        // Sino, abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
    )
  }
})
