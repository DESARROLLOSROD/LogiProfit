import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { connectWebSocket, disconnectWebSocket } from './lib/websocket'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Auth Pages
import Login from './pages/auth/Login'
// import Register from './pages/auth/Register'

// Dashboard Pages
import Dashboard from './pages/Dashboard'
import Pendientes from './pages/Pendientes'
import Cotizaciones from './pages/cotizaciones/Cotizaciones'
import CotizacionDetalle from './pages/cotizaciones/CotizacionDetalle'
import NuevaCotizacionMejorada from './pages/cotizaciones/NuevaCotizacionMejorada'
import Fletes from './pages/fletes/Fletes'
import FleteDetalle from './pages/fletes/FleteDetalle'
import Camiones from './pages/camiones/Camiones'
import Choferes from './pages/choferes/Choferes'
import Clientes from './pages/clientes/Clientes'
import Reportes from './pages/reportes/Reportes'
import ResumenMensual from './pages/reportes/ResumenMensual'
import Configuracion from './pages/Configuracion'
import Usuarios from './pages/usuarios/Usuarios'
import Integraciones from './pages/integraciones/Integraciones'
import NuevaConfiguracion from './pages/integraciones/NuevaConfiguracion'
import ImportarArchivo from './pages/integraciones/ImportarArchivo'
import CompararArchivo from './pages/integraciones/CompararArchivo'
import EditarCotizacion from './pages/cotizaciones/EditarCotizacion'
import Facturas from './pages/facturas/Facturas'
import Documentos from './pages/documentos/Documentos'
import SolicitudesCombustible from './pages/solicitudes-combustible/SolicitudesCombustible'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />
}

export default function App() {
  const { usuario, isAuthenticated, checkAuth } = useAuthStore()

  // Verificar sesión al cargar la app
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Conectar WebSocket cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && usuario?.empresa?.id) {
      console.log('[App] Conectando WebSocket para empresa:', usuario.empresa.id)
      connectWebSocket(usuario.empresa.id)

      return () => {
        console.log('[App] Desconectando WebSocket')
        disconnectWebSocket()
      }
    }
  }, [isAuthenticated, usuario?.empresa?.id])

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        {/* <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        /> */}
      </Route>

      {/* Dashboard Routes */}
      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/pendientes" element={<Pendientes />} />

        {/* Cotizaciones */}
        <Route path="/cotizaciones" element={<Cotizaciones />} />
        <Route path="/cotizaciones/nueva" element={<NuevaCotizacionMejorada />} />
        <Route path="/cotizaciones/editar/:id" element={<EditarCotizacion />} />
        <Route path="/cotizaciones/:id" element={<CotizacionDetalle />} />

        {/* Fletes */}
        <Route path="/fletes" element={<Fletes />} />
        <Route path="/fletes/:id" element={<FleteDetalle />} />

        {/* Catálogos */}
        <Route path="/camiones" element={<Camiones />} />
        <Route path="/choferes" element={<Choferes />} />
        <Route path="/clientes" element={<Clientes />} />

        {/* Reportes */}
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/reportes/resumen-mensual" element={<ResumenMensual />} />

        {/* Integraciones */}
        <Route path="/integraciones" element={<Integraciones />} />
        <Route path="/integraciones/nueva" element={<NuevaConfiguracion />} />
        <Route path="/integraciones/editar/:id" element={<NuevaConfiguracion />} />
        <Route path="/integraciones/importar" element={<ImportarArchivo />} />
        <Route path="/integraciones/comparar" element={<CompararArchivo />} />

        {/* Facturación */}
        <Route path="/facturas" element={<Facturas />} />

        {/* Documentos de Vehículos */}
        <Route path="/documentos" element={<Documentos />} />

        {/* Solicitudes de Combustible */}
        <Route path="/solicitudes-combustible" element={<SolicitudesCombustible />} />

        {/* Configuración */}
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/usuarios" element={<Usuarios />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
