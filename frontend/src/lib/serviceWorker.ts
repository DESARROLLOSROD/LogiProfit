// Registrar Service Worker
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('[App] Service Worker registrado:', registration.scope)

      // Escuchar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión disponible
              console.log('[App] Nueva versión disponible')

              // Notificar al usuario (opcional)
              if (confirm('Nueva versión disponible. ¿Recargar?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
                window.location.reload()
              }
            }
          })
        }
      })

      return registration
    } catch (error) {
      console.error('[App] Error registrando Service Worker:', error)
    }
  } else {
    console.warn('[App] Service Workers no soportados en este navegador')
  }
}

// Solicitar permisos de notificaciones
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[App] Notificaciones no soportadas')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission
  }

  return Notification.permission
}

// Enviar notificación local
export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Enviar a través del service worker
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          ...options,
        })
      })
    } else {
      // Fallback: notificación directa
      new Notification(title, {
        icon: '/icon-192.png',
        ...options,
      })
    }
  }
}

// Verificar estado offline/online
export function setupOnlineStatusListener(
  onOnline: () => void,
  onOffline: () => void
) {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  // Retornar función de cleanup
  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

// Limpiar cache (útil para desarrollo)
export async function clearAllCaches() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
  }

  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((name) => caches.delete(name)))
    console.log('[App] Todos los caches eliminados')
  }
}

// Verificar si estamos offline
export function isOffline(): boolean {
  return !navigator.onLine
}

// Verificar si el SW está activo
export function isServiceWorkerActive(): boolean {
  return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller
}

// Desregistrar Service Worker y limpiar todo (útil para resolver problemas)
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
      console.log('[App] Service Worker desregistrado')
    }
    await clearAllCaches()
    console.log('[App] Service Worker y caches eliminados completamente')
  }
}
