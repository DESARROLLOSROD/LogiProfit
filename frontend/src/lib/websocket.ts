import { io, Socket } from 'socket.io-client'
import {
  notifyFleteUrgente,
  notifyFletePerdida,
  notifyCotizacionAprobada,
  notifyMargenBajo,
} from './notifications'

let socket: Socket | null = null

// Conectar al servidor WebSocket
export function connectWebSocket(empresaId: number): Socket {
  if (socket && socket.connected) {
    return socket
  }

  // URL del servidor WebSocket
  const wsUrl = 'http://localhost:3000'

  socket = io(wsUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.log('[WS] Conectado al servidor WebSocket')
    // Unirse a la sala de la empresa
    socket!.emit('join', empresaId)
  })

  socket.on('disconnect', () => {
    console.log('[WS] Desconectado del servidor WebSocket')
  })

  socket.on('connect_error', (error) => {
    console.error('[WS] Error de conexión:', error)
  })

  // Escuchar eventos de notificaciones
  setupNotificationListeners()

  return socket
}

// Configurar listeners de notificaciones
function setupNotificationListeners() {
  if (!socket) return

  socket.on('flete-urgente', (data: {
    fleteId: number
    folio: string
    fechaInicio: string
    origen: string
    destino: string
    horasRestantes: number
  }) => {
    console.log('[WS] Flete urgente recibido:', data)
    notifyFleteUrgente({
      folio: data.folio,
      fechaInicio: data.fechaInicio,
      origen: data.origen,
      destino: data.destino,
    })
  })

  socket.on('flete-perdida', (data: {
    fleteId: number
    folio: string
    utilidad: number
    margen: number
  }) => {
    console.log('[WS] Flete con pérdida recibido:', data)
    notifyFletePerdida({
      folio: data.folio,
      utilidad: data.utilidad,
      margen: data.margen,
    })
  })

  socket.on('cotizacion-aprobada', (data: {
    cotizacionId: number
    folio: string
    cliente: string
    precio: number
  }) => {
    console.log('[WS] Cotización aprobada recibida:', data)
    notifyCotizacionAprobada({
      folio: data.folio,
      cliente: data.cliente,
      precio: data.precio,
    })
  })

  socket.on('margen-bajo', (data: {
    id: number
    folio: string
    tipo: 'cotizacion' | 'flete'
    margen: number
  }) => {
    console.log('[WS] Margen bajo recibido:', data)
    notifyMargenBajo({
      folio: data.folio,
      tipo: data.tipo,
      margen: data.margen,
    })
  })
}

// Desconectar del servidor WebSocket
export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('[WS] Conexión cerrada')
  }
}

// Obtener instancia del socket
export function getSocket(): Socket | null {
  return socket
}

// Verificar si está conectado
export function isConnected(): boolean {
  return socket !== null && socket.connected
}
