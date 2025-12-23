# 🚛 LogiProfit

**Plataforma SaaS de Rentabilidad Inteligente para Empresas de Fletes**

LogiProfit permite a las empresas de transporte conocer la rentabilidad real de cada viaje, tratando cada flete como un mini estado de resultados (P&L).

## 🎯 Características Principales

- **Cotizaciones Inteligentes**: Simula costos antes de aceptar un flete
- **Gestión de Fletes**: Control completo del ciclo de vida del viaje
- **Cálculo Automático de Salarios**: Según días, km o viaje
- **Control de Gastos**: Diesel, casetas, viáticos, mantenimiento
- **Utilidad en Tiempo Real**: Recálculo automático con cada gasto
- **Multi-tenant**: Soporte para múltiples empresas

## 🏗️ Arquitectura

```
logiprofit/
├── backend/          # API REST con NestJS
├── frontend/         # SPA con React + Tailwind
├── database/         # Scripts SQL y migraciones
└── docs/             # Documentación adicional
```

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend   | React 18 + TypeScript + Tailwind CSS |
| Backend    | NestJS + TypeScript |
| Base de Datos | PostgreSQL |
| ORM        | Prisma |
| Autenticación | JWT |
| Hosting    | Railway / Render |

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/logiprofit.git
cd logiprofit

# Instalar dependencias del backend
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar backend
npm run start:dev

# En otra terminal, instalar frontend
cd ../frontend
npm install
npm run dev
```

## 📊 Módulos

### 1. Cotizaciones
Crea cotizaciones con cálculo automático de costos estimados y utilidad esperada.

### 2. Fletes
Gestiona el ciclo completo: Planeado → En Curso → Cerrado

### 3. Camiones
Centro de costos con rendimiento histórico y costo por km.

### 4. Choferes
Configuración flexible de pagos: por día, viaje o kilómetro.

### 5. Gastos
Registro con evidencia y validación contable.

### 6. Reportes
Dashboard de rentabilidad y exportación a PDF.

## 🔐 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| Administrador | Configuración completa del sistema |
| Operador Logístico | Cotizaciones, fletes, asignaciones |
| Chofer | Captura de gastos |
| Contabilidad | Validación de gastos |
| Dirección | Dashboards y reportes |

## 📝 Licencia

MIT License - ver [LICENSE](LICENSE)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request
