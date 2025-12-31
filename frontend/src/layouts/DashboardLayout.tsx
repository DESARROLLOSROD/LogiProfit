import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { usePendientes } from '../hooks/usePendientes'
import GlobalSearch from '../components/GlobalSearch'
import {
  HomeIcon,
  DocumentTextIcon,
  TruckIcon,
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  BanknotesIcon,
  DocumentDuplicateIcon,
  
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Pendientes', href: '/pendientes', icon: ClockIcon },
  { name: 'Cotizaciones', href: '/cotizaciones', icon: DocumentTextIcon },
  { name: 'Fletes', href: '/fletes', icon: ClipboardDocumentListIcon },
  { name: 'Facturación', href: '/facturas', icon: BanknotesIcon },
  
  { name: 'Viáticos', href: '/viaticos/solicitudes', icon: ReceiptPercentIcon },
  { name: 'Documentos', href: '/documentos', icon: DocumentDuplicateIcon },
  { name: 'Camiones', href: '/camiones', icon: TruckIcon },
  { name: 'Choferes', href: '/choferes', icon: UserGroupIcon },
  { name: 'Clientes', href: '/clientes', icon: UsersIcon },
  { name: 'Reportes', href: '/reportes', icon: ChartBarIcon },
  { name: 'Integraciones', href: '/integraciones', icon: ArrowsRightLeftIcon },
  { name: 'Usuarios', href: '/usuarios', icon: UsersIcon },
  { name: 'Configuración', href: '/configuracion', icon: Cog6ToothIcon },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <TruckIcon className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">LogiProfit</span>
          </div>
          <button onClick={() => setSidebarOpen(false)}>
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center gap-2 p-4 border-b">
            <TruckIcon className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">LogiProfit</span>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="w-6 h-6 text-gray-600" />
            </button>

            <div className="flex items-center gap-4">
              <GlobalSearch />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{usuario?.nombre}</p>
                <p className="text-xs text-gray-500">{usuario?.empresa.nombre}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                title="Cerrar sesión"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SidebarContent() {
  const { count } = usePendientes()

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            `flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-5 h-5" />
            {item.name}
          </div>
          {item.name === 'Pendientes' && count.total > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {count.total}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
