import { useState, useEffect } from 'react'
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline'
import { requestNotificationPermission } from '../lib/serviceWorker'

export default function NotificationControl() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    // Verificar permiso actual
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Verificar estado offline
    setOffline(!navigator.onLine)

    // Escuchar cambios de conectividad
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)

    if (result === 'granted') {
      // Enviar notificación de prueba
      new Notification('LogiProfit', {
        body: 'Notificaciones activadas correctamente',
        icon: '/icon-192.png',
      })
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Indicador de estado offline */}
      {offline && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
          Modo Offline
        </div>
      )}

      {/* Control de notificaciones */}
      {permission === 'default' && (
        <button
          onClick={handleRequestPermission}
          className="btn-secondary flex items-center gap-2"
          title="Activar notificaciones"
        >
          <BellIcon className="w-5 h-5" />
          Activar Alertas
        </button>
      )}

      {permission === 'granted' && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm">
          <BellIcon className="w-5 h-5" />
          Alertas Activas
        </div>
      )}

      {permission === 'denied' && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm"
          title="Notificaciones bloqueadas. Habilítalas en la configuración del navegador."
        >
          <BellSlashIcon className="w-5 h-5" />
          Alertas Desactivadas
        </div>
      )}
    </div>
  )
}
