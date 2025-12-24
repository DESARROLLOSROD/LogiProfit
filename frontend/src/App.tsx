import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Dashboard Pages
import Dashboard from './pages/Dashboard'
import Cotizaciones from './pages/cotizaciones/Cotizaciones'
import CotizacionDetalle from './pages/cotizaciones/CotizacionDetalle'
import NuevaCotizacionMejorada from './pages/cotizaciones/NuevaCotizacionMejorada'
import Fletes from './pages/fletes/Fletes'
import FleteDetalle from './pages/fletes/FleteDetalle'
import Camiones from './pages/camiones/Camiones'
import Choferes from './pages/choferes/Choferes'
import Clientes from './pages/clientes/Clientes'
import Reportes from './pages/reportes/Reportes'
import Configuracion from './pages/Configuracion'
import Usuarios from './pages/usuarios/Usuarios'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />
}

export default function App() {
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
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
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
        
        {/* Cotizaciones */}
        <Route path="/cotizaciones" element={<Cotizaciones />} />
        <Route path="/cotizaciones/nueva" element={<NuevaCotizacionMejorada />} />
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

        {/* Configuración */}
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/usuarios" element={<Usuarios />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
