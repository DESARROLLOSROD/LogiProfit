# 🚛 LogiProfit

**Plataforma SaaS de Rentabilidad Inteligente para Empresas de Fletes**

LogiProfit permite a las empresas de transporte conocer la rentabilidad real de cada viaje, tratando cada flete como un mini estado de resultados (P&L).

---

## ✅ Estado Actual del Sistema
**Sistema 100% Funcional y Listo para Producción**
- **Backend**: NestJS + Prisma (PostgreSQL)
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Despliegue**: Preparado para Railway + Supabase

---

## 🎯 Características Principales
- **Cotizaciones Inteligentes**: Simula costos antes de aceptar un flete.
- **Gestión de Fletes**: Control completo del ciclo de vida (Planeado → En Curso → Cerrado).
- **Módulo de Mantenimiento**: Alertas preventivas y control de reparaciones por camión.
- **Categorías y Presupuestos**: 14 categorías de gastos con control presupuestal.
- **Notificaciones Real-Time**: WebSocket para alertas urgentes y márgenes bajos.
- **Exportación**: Generación de reportes profesionales en PDF y Excel (multi-sheet).
- **Sistema RBAC**: Control de acceso basado en 25 permisos granulares.

---

## ⚙️ Flujos Técnicos

### 1. Ciclo de Vida de Cotización a Flete
```mermaid
graph TD
    A[Nueva Cotización] --> B{Validación de Costos}
    B -->|Borrador| C[Cálculo de Utilidad Estimada]
    C --> D[Envío a Cliente]
    D --> E{Respuesta}
    E -->|Aprobada| F[Conversión a Flete]
    E -->|Rechazada| G[Archivo]
    F --> H[Asignación de Camión y Chofer]
```

### 2. Flujo de Control de Gastos y Rentabilidad
```mermaid
graph LR
    A[Flete en Curso] --> B[Registro de Gasto]
    B --> C[Subir Comprobante]
    C --> D{Validación Contable}
    D -->|Validado| E[Actualización de P&L Real]
    E --> F[Dashboard de Rentabilidad]
```

### 3. Sistema de Alertas (WebSockets)
```mermaid
sequenceDiagram
    participant B as Backend
    participant W as WebSocket Gateway
    participant F as Frontend
    B->>B: Detectar Gasto Alto / Margen Bajo
    B->>W: Emitir Evento 'margen-bajo'
    W->>F: Notificación en Tiempo Real
    F->>F: Actualizar Badge de Pendientes
```

### 4. Mantenimiento Preventivo
```mermaid
graph TD
    A[Kilometraje de Camión] --> B{¿Requiere Mant.?}
    B -->|Sí/Próximo| C[Alerta en Dashboard]
    C --> D[Programar Mantenimiento]
    D --> E[Ejecutar y Registrar Costo]
    E --> F[Actualizar Odómetro y Fecha]
```

---

## 🚀 Inicio Rápido (Desarrollo)

### Prerrequisitos
- Node.js 18+, PostgreSQL 14+, npm

### Instalación
```bash
# 1. Clonar e instalar backend
cd backend && npm install
cp .env.example .env # Configura DATABASE_URL, JWT_SECRET, FRONTEND_URL
npx prisma generate
npx prisma migrate dev
npm run start:dev

# 2. Instalar frontend (en otra terminal)
cd frontend && npm install
npm run dev
```

---

## ☁️ Despliegue en Railway

### 1. Backend (NestJS)
- **Root Directory**: `backend`
- **Build Command**: `npx prisma generate && npm run build`
- **Start Command**: `npm run start:prod`
- **Variables**: `DATABASE_URL` (Supabase), `JWT_SECRET`, `FRONTEND_URL`.

### 2. Frontend (Vite)
- **Root Directory**: `frontend`
- **Variables**: 
  - `VITE_API_URL`: URL del backend + `/api/v1`
  - `VITE_WS_URL`: URL del backend

---

## 📋 Guía del Dashboard de Pendientes
Accede desde el menú lateral (ícono ⏰) para gestionar:
1.  🟡 **Fletes sin Gastos**: Viajes activos sin registros financieros.
2.  🟠 **Cotizaciones por Vencer**: Seguimiento a propuestas próximas a expirar.
3.  🔴 **Comprobantes Faltantes**: Gastos registrados sin factura (XML/PDF).
4.  🟣 **Pagos Vencidos**: Control de cobranza.

---

## 🔐 Roles y Permisos
- **Admin**: Control total.
- **Operador**: Cotizaciones y fletes.
- **Chofer**: Registro de gastos.
- **Contabilidad**: Validación de facturas y presupuestos.

---

## 📝 Notas de Desarrollo
- **Prisma Decimals**: Siempre convertir a número en el frontend: `Number(valor) || 0`.
- **Caché**: Si hay cambios visuales no reflejados, usa `Ctrl + Shift + R`.
- **RBAC**: Usa el hook `usePermissions()` para proteger componentes en el frontend.

---
**Generado:** Diciembre 2024
**Licencia:** MIT
