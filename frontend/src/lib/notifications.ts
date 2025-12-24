import { sendLocalNotification } from './serviceWorker'

// Tipos de notificaciones
export enum NotificationType {
  FLETE_URGENTE = 'flete_urgente',
  FLETE_PERDIDA = 'flete_perdida',
  COTIZACION_APROBADA = 'cotizacion_aprobada',
  MARGEN_BAJO = 'margen_bajo',
}

// Configuración de notificaciones por tipo
const notificationConfig = {
  [NotificationType.FLETE_URGENTE]: {
    title: '⚠️ Flete Urgente',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'flete-urgente',
    requireInteraction: true,
  },
  [NotificationType.FLETE_PERDIDA]: {
    title: '🚨 Flete con Pérdida',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'flete-perdida',
    requireInteraction: true,
  },
  [NotificationType.COTIZACION_APROBADA]: {
    title: '✅ Cotización Aprobada',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'cotizacion-aprobada',
    requireInteraction: false,
  },
  [NotificationType.MARGEN_BAJO]: {
    title: '⚠️ Margen Bajo',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'margen-bajo',
    requireInteraction: true,
  },
}

// Notificar flete urgente (fecha de inicio en menos de 24h)
export function notifyFleteUrgente(flete: {
  folio: string
  fechaInicio: string
  origen: string
  destino: string
}) {
  const horasRestantes = Math.floor(
    (new Date(flete.fechaInicio).getTime() - new Date().getTime()) / (1000 * 60 * 60)
  )

  sendLocalNotification(notificationConfig[NotificationType.FLETE_URGENTE].title, {
    ...notificationConfig[NotificationType.FLETE_URGENTE],
    body: `${flete.folio}: ${flete.origen} → ${flete.destino}\nInicia en ${horasRestantes} horas`,
    data: { fleteId: flete.folio, type: NotificationType.FLETE_URGENTE },
  })
}

// Notificar flete con pérdida
export function notifyFletePerdida(flete: {
  folio: string
  utilidad: number
  margen: number
}) {
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  sendLocalNotification(notificationConfig[NotificationType.FLETE_PERDIDA].title, {
    ...notificationConfig[NotificationType.FLETE_PERDIDA],
    body: `${flete.folio}\nPérdida: ${formatMoney(flete.utilidad)}\nMargen: ${flete.margen.toFixed(1)}%`,
    data: { fleteId: flete.folio, type: NotificationType.FLETE_PERDIDA },
  })
}

// Notificar cotización aprobada
export function notifyCotizacionAprobada(cotizacion: {
  folio: string
  cliente: string
  precio: number
}) {
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  sendLocalNotification(
    notificationConfig[NotificationType.COTIZACION_APROBADA].title,
    {
      ...notificationConfig[NotificationType.COTIZACION_APROBADA],
      body: `${cotizacion.folio} - ${cotizacion.cliente}\nMonto: ${formatMoney(cotizacion.precio)}`,
      data: { cotizacionId: cotizacion.folio, type: NotificationType.COTIZACION_APROBADA },
    }
  )
}

// Notificar margen bajo (menos del 10%)
export function notifyMargenBajo(item: {
  folio: string
  tipo: 'cotizacion' | 'flete'
  margen: number
}) {
  sendLocalNotification(notificationConfig[NotificationType.MARGEN_BAJO].title, {
    ...notificationConfig[NotificationType.MARGEN_BAJO],
    body: `${item.tipo === 'cotizacion' ? 'Cotización' : 'Flete'} ${item.folio}\nMargen: ${item.margen.toFixed(1)}% (objetivo: 20%)`,
    data: { id: item.folio, type: NotificationType.MARGEN_BAJO },
  })
}

// Verificar fletes urgentes (ejecutar periódicamente)
export function checkFleteUrgentes(fletes: any[]) {
  const ahora = new Date().getTime()
  const veinticuatroHoras = 24 * 60 * 60 * 1000

  fletes.forEach((flete) => {
    if (!flete.fechaInicio) return

    const fechaInicio = new Date(flete.fechaInicio).getTime()
    const diff = fechaInicio - ahora

    // Si falta menos de 24h y aún no ha iniciado
    if (diff > 0 && diff < veinticuatroHoras && flete.estado === 'PLANEADO') {
      notifyFleteUrgente({
        folio: flete.folio,
        fechaInicio: flete.fechaInicio,
        origen: flete.origen,
        destino: flete.destino,
      })
    }
  })
}

// Verificar fletes con pérdida
export function checkFletesPerdida(fletes: any[]) {
  fletes.forEach((flete) => {
    const totalGastos = flete.gastos?.reduce(
      (sum: number, g: any) => sum + Number(g.monto),
      0
    ) || 0
    const utilidad = Number(flete.precioCliente) - totalGastos
    const margen =
      flete.precioCliente > 0 ? (utilidad / Number(flete.precioCliente)) * 100 : 0

    // Si tiene pérdida o margen muy bajo
    if (utilidad < 0 && (flete.estado === 'EN_CURSO' || flete.estado === 'PLANEADO')) {
      notifyFletePerdida({
        folio: flete.folio,
        utilidad,
        margen,
      })
    }
  })
}

// Ejecutar todas las verificaciones
export function runAllNotificationChecks(data: { fletes?: any[] }) {
  if (data.fletes) {
    checkFleteUrgentes(data.fletes)
    checkFletesPerdida(data.fletes)
  }
}
