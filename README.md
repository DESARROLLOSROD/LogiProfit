# 🚛 LogiProfit

**Plataforma SaaS de Rentabilidad Inteligente para Empresas de Fletes**

Sistema completo de gestión logística que permite a empresas de transporte conocer la rentabilidad real de cada viaje, tratando cada flete como un mini estado de resultados (P&L) en tiempo real.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.0-blue)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-green)](https://www.prisma.io/)

---

## 📋 Tabla de Contenidos

- [Estado del Sistema](#-estado-del-sistema)
- [Características](#-características-principales)
- [Arquitectura](#-arquitectura-del-sistema)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Flujos de Trabajo](#-flujos-de-trabajo)
- [Instalación](#-instalación)
- [Despliegue](#-despliegue)
- [Guías de Uso](#-guías-de-uso)
- [API Documentation](#-api-documentation)
- [Seguridad y RBAC](#-seguridad-y-rbac)

---

## ✅ Estado del Sistema

**Sistema 100% Funcional y en Producción**

```
Backend:  ✅ Desplegado en Railway
Frontend: ✅ Desplegado en Railway
Database: ✅ PostgreSQL en Supabase
Status:   🟢 Operacional
```

### Stack Tecnológico

#### Backend
- **Framework**: NestJS 10.x
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 14+
- **Auth**: JWT + Passport
- **Real-time**: Socket.io
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

#### Frontend
- **Framework**: React 18.x
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **State**: Zustand
- **Router**: React Router v6
- **Icons**: Heroicons
- **HTTP**: Axios
- **Forms**: React Hook Form

---

## 🎯 Características Principales

### 💰 Gestión Financiera
- **P&L en Tiempo Real**: Cada flete muestra ingresos, gastos y utilidad
- **Control Presupuestal**: 14 categorías de gastos con límites configurables
- **Proyecciones**: Simulación de costos antes de aceptar fletes
- **Alertas de Margen**: Notificaciones cuando la rentabilidad cae < 15%

### 📊 Módulos Operativos
- **Cotizaciones**: Sistema de propuestas con versionado y aprobación
- **Fletes**: Gestión completa del ciclo de vida de viajes
- **Solicitudes de Combustible**: Control de gastos de diesel con aprobación
- **Viáticos**: Gestión de gastos de viaje con comprobación
- **Mantenimiento**: Alertas preventivas por KM y control de reparaciones
- **Facturación**: Integración con SAT (México) para timbrado CFDI

### 🔔 Inteligencia Operativa
- **Dashboard de Pendientes**: Vista unificada de tareas críticas
- **Notificaciones Real-Time**: WebSocket para alertas urgentes
- **Reportes Avanzados**: Exportación PDF y Excel multi-sheet
- **Búsqueda Global**: Encuentra cualquier entidad instantáneamente

### 🔐 Seguridad y Compliance
- **RBAC Granular**: 5 roles con 25+ permisos específicos
- **Multi-Tenant**: Aislamiento completo por empresa
- **Auditoría**: Registro de cambios en entidades críticas
- **Rate Limiting**: Protección contra ataques de fuerza bruta

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React SPA  │  │  Zustand     │  │  React Query │      │
│  │   + Vite     │  │  (State)     │  │  (Cache)     │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                    │
│         │ HTTPS/WSS                                          │
└─────────┼────────────────────────────────────────────────────┘
          │
┌─────────┼────────────────────────────────────────────────────┐
│         │              BACKEND LAYER                         │
│  ┌──────▼───────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   NestJS     │  │  Socket.io   │  │   Prisma     │      │
│  │   REST API   │◄─┤  WebSocket   │  │   ORM        │      │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘      │
│         │                                    │               │
│  ┌──────▼───────────────────────────────────▼───────┐      │
│  │              Middleware Layer                     │      │
│  │  • JWT Auth Guard                                 │      │
│  │  • RBAC Guard (Permissions)                       │      │
│  │  • Rate Limiter (10 req/min)                      │      │
│  │  • Validation Pipe (class-validator)              │      │
│  └──────────────────────────────────────────────────┘      │
└─────────┬──────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────┐
│                   DATABASE LAYER                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │   PostgreSQL 14+ (Supabase)                            │ │
│  │   • 30+ Tables                                         │ │
│  │   • Multi-tenant isolation (empresaId)                 │ │
│  │   • Constraints & Indexes                              │ │
│  │   • Decimal precision for money                        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Modelo de Datos Simplificado

```mermaid
erDiagram
    EMPRESA ||--o{ USUARIO : tiene
    EMPRESA ||--o{ CLIENTE : tiene
    EMPRESA ||--o{ CAMION : tiene
    EMPRESA ||--o{ CHOFER : tiene

    CLIENTE ||--o{ COTIZACION : solicita
    COTIZACION ||--o{ FLETE : genera

    FLETE ||--o{ GASTO : acumula
    FLETE ||--o{ DOCUMENTO : adjunta
    FLETE }o--o{ CAMION : asigna
    FLETE }o--o{ CHOFER : asigna

    FLETE ||--o{ SOLICITUD_COMBUSTIBLE : requiere
    FLETE ||--o{ SOLICITUD_VIATICO : requiere
    SOLICITUD_VIATICO ||--o{ COMPROBACION_VIATICO : comprueba

    CAMION ||--o{ MANTENIMIENTO : registra
```

---

## 📦 Módulos del Sistema

### 1. 📋 Cotizaciones
**Propósito**: Simular costos y presentar propuestas a clientes

**Entidades**:
- `Cotizacion`: Propuesta comercial con conceptos
- `ConceptoCotizacion`: Línea de servicio (ej: flete, maniobras, estancia)

**Estados**: `BORRADOR` → `ENVIADA` → `APROBADA` / `RECHAZADA` → `CONVERTIDA`

**Funcionalidades**:
- ✅ Creación con conceptos ilimitados
- ✅ Cálculo automático de totales (subtotal + IVA)
- ✅ Validez temporal (fecha de expiración)
- ✅ Conversión a flete con un clic
- ✅ Exportación a PDF profesional

---

### 2. 🚚 Fletes
**Propósito**: Gestionar el ciclo completo de un viaje

**Estados del Ciclo de Vida**:
```
PLANEADO → EN_CURSO → COMPLETADO → CERRADO
                    ↘ CANCELADO
```

**Componentes Clave**:
- **Asignaciones**: Camiones y choferes (muchos a muchos)
- **Gastos**: 14 categorías (diesel, casetas, mantenimiento, etc.)
- **Documentos**: Carta porte, POD, facturas
- **Checklist**: 20 puntos de verificación operativa
- **P&L**: `Utilidad = Precio Cliente - Σ Gastos`

**Reglas de Negocio**:
- Un flete `CERRADO` no permite gastos sin validar
- El margen mínimo recomendado es 15%
- Los gastos de salario se generan automáticamente al asignar chofer

---

### 3. ⛽ Solicitudes de Combustible
**Propósito**: Control de gastos de diesel con aprobación previa

**Flujo**:
```mermaid
graph LR
    A[Operador crea solicitud] --> B{Mantenimiento revisa}
    B -->|Aprueba| C[APROBADA]
    B -->|Rechaza| D[RECHAZADA]
    C --> E{Contabilidad deposita}
    E --> F[DEPOSITADA]
```

**Campos**:
- Paradas múltiples (lugar, litros, precio/litro)
- Monto total calculado automáticamente
- Notas y motivo de rechazo
- Comprobantes adjuntos

---

### 4. 💵 Viáticos
**Propósito**: Gestión de gastos de viaje con comprobación posterior

**Tipos de Gasto**:
- `ALIMENTOS`: Comidas durante el viaje
- `HOSPEDAJE`: Hoteles y alojamiento
- `CASETAS`: Peajes y cuotas de carretera
- `COMBUSTIBLE`: Diesel del viaje
- `OTROS`: Gastos misceláneos

**Flujo de Solicitud**:
```
SOLICITADO → APROBADO → DEPOSITADO
          ↘ CANCELADO
```

**Flujo de Comprobación**:
```
PENDIENTE → VALIDADO (Contabilidad)
         ↘ RECHAZADO
```

**Funcionalidades**:
- ✅ Solicitud con múltiples conceptos
- ✅ Aprobación por dirección
- ✅ Depósito por contabilidad
- ✅ Comprobación con archivos adjuntos
- ✅ Validación contable

---

### 5. 🔧 Mantenimiento
**Propósito**: Gestión preventiva y correctiva de vehículos

**Tipos**:
- `PREVENTIVO`: Servicios programados (cada X km)
- `CORRECTIVO`: Reparaciones por fallas
- `EMERGENCIA`: Atención urgente en carretera

**Alertas Automáticas**:
- 🔴 Vencimiento de verificación vehicular
- 🟡 Próximo cambio de aceite (500 km antes)
- 🟠 Servicio mayor programado

---

### 6. 📄 Documentos
**Propósito**: Almacenamiento centralizado de archivos por flete

**Tipos Soportados**:
- `CARTA_PORTE`: Documento fiscal de transporte
- `POD`: Proof of Delivery (acuse de entrega)
- `FACTURA`: CFDI del cliente
- `COMPROBANTE`: Evidencias de gastos
- `OTRO`: Documentos adicionales

**Características**:
- Upload a S3/CloudStorage
- Previsualización en navegador
- Descarga directa
- Vinculación a fletes

---

### 7. 💼 Facturación
**Propósito**: Emisión y control de CFDI (México)

**Estados**:
```
BORRADOR → TIMBRADA → PAGADA
        ↘ CANCELADA
```

**Integración**:
- API del SAT (Sistema de Administración Tributaria)
- Generación de XML con sello digital
- Descarga de PDF oficial
- Control de pagos parciales

---

### 8. 📊 Reportes y Dashboard

#### Dashboard de Pendientes
Vista unificada de tareas críticas:

| Pendiente | Criterio | Prioridad |
|-----------|----------|-----------|
| **Fletes sin Gastos** | Estado EN_CURSO/COMPLETADO sin registros | 🟡 Media |
| **Cotizaciones por Vencer** | validoHasta <= hoy + 7 días | 🟠 Alta |
| **Comprobantes Faltantes** | comprobanteUrl == null | 🔴 Crítica |
| **Pagos Vencidos** | fechaVencimiento < hoy y estado != PAGADA | 🟣 Urgente |
| **Mantenimientos Próximos** | proximoServicio <= kmActual + 500 | 🟡 Media |

#### Reportes Exportables
- **PDF**: Cotizaciones, órdenes de servicio, facturas
- **Excel**: Reporte de fletes multi-sheet (resumen, gastos, asignaciones)
- **CSV**: Exportación masiva para análisis

---

## 🔄 Flujos de Trabajo

### Flujo 1: Cotización → Flete → Cierre

```mermaid
sequenceDiagram
    participant Vendedor
    participant Sistema
    participant Operador
    participant Chofer
    participant Contabilidad

    Vendedor->>Sistema: Crear Cotización
    Sistema-->>Vendedor: Cotización #12345
    Vendedor->>Sistema: Enviar a Cliente
    Note over Sistema: Estado: ENVIADA

    Vendedor->>Sistema: Cliente aprueba
    Sistema->>Sistema: Convertir a Flete F-00001
    Note over Sistema: Copiar conceptos y precios

    Operador->>Sistema: Asignar Camión + Chofer
    Sistema->>Sistema: Crear gasto SALARIO automático

    Operador->>Sistema: Iniciar Flete
    Note over Sistema: Estado: EN_CURSO

    Chofer->>Sistema: Registrar gastos (diesel, casetas)
    Chofer->>Sistema: Subir comprobantes

    Operador->>Sistema: Completar Flete
    Note over Sistema: Estado: COMPLETADO

    Contabilidad->>Sistema: Validar gastos
    Contabilidad->>Sistema: Cerrar Flete
    Note over Sistema: Estado: CERRADO
    Sistema-->>Contabilidad: P&L Final: $12,500 utilidad
```

---

### Flujo 2: Solicitud de Combustible

```mermaid
graph TD
    A[Operador crea solicitud] --> B[Selecciona Flete]
    B --> C[Agrega paradas con litros y precios]
    C --> D[Sistema calcula total]
    D --> E{Mantenimiento revisa}

    E -->|Aprueba| F[Estado: APROBADA]
    E -->|Rechaza con motivo| G[Estado: RECHAZADA]

    F --> H{Contabilidad deposita}
    H --> I[Estado: DEPOSITADA]
    H --> J[Registra fecha y monto depositado]

    I --> K[Chofer puede cargar combustible]
    K --> L[Sube comprobantes de gasolinera]
    L --> M[Contabilidad valida facturas]
```

---

### Flujo 3: Gestión de Viáticos

```mermaid
stateDiagram-v2
    [*] --> SOLICITADO: Chofer crea solicitud
    SOLICITADO --> APROBADO: Dirección aprueba
    SOLICITADO --> CANCELADO: Se cancela con motivo

    APROBADO --> DEPOSITADO: Contabilidad deposita

    DEPOSITADO --> Comprobación

    state Comprobación {
        [*] --> PENDIENTE: Chofer sube facturas
        PENDIENTE --> VALIDADO: Contabilidad aprueba
        PENDIENTE --> RECHAZADO: Faltan comprobantes
    }

    Comprobación --> [*]
    CANCELADO --> [*]
```

---

## 🚀 Instalación

### Prerrequisitos

```bash
Node.js >= 18.x
PostgreSQL >= 14
npm >= 9.x
```

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/logiprofit.git
cd logiprofit
```

### 2. Configurar Backend

```bash
cd backend
npm install

# Crear archivo .env
cp .env.example .env
```

Editar `.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/logiprofit?schema=public"

# JWT
JWT_SECRET="tu-secreto-super-seguro-cambiar-en-produccion"
JWT_EXPIRATION="7d"

# CORS
FRONTEND_URL="http://localhost:5173"

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-contraseña-de-aplicación"

# Storage (opcional)
AWS_S3_BUCKET="tu-bucket"
AWS_ACCESS_KEY_ID="tu-key"
AWS_SECRET_ACCESS_KEY="tu-secret"
```

Ejecutar migraciones:
```bash
npx prisma generate
npx prisma migrate dev
```

Seed inicial (opcional):
```bash
npx prisma db seed
```

Iniciar backend:
```bash
npm run start:dev
```

El backend estará en `http://localhost:3000`
Swagger docs en `http://localhost:3000/api/docs`

---

### 3. Configurar Frontend

```bash
cd frontend
npm install

# Crear archivo .env
cp .env.example .env
```

Editar `.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
```

Iniciar frontend:
```bash
npm run dev
```

El frontend estará en `http://localhost:5173`

---

### 4. Primer Login

Credenciales por defecto (del seed):
```
Email: admin@logiprofit.com
Password: Admin123!
```

**⚠️ IMPORTANTE**: Cambiar estas credenciales en producción.

---

## ☁️ Despliegue

### Opción 1: Railway (Recomendado)

#### Backend
1. Conectar repositorio a Railway
2. Configurar servicio:
   - **Root Directory**: `backend`
   - **Build Command**: `npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`

3. Variables de entorno:
```env
DATABASE_URL=<tu-url-de-supabase>
JWT_SECRET=<generar-uno-seguro>
FRONTEND_URL=https://tu-frontend.up.railway.app
PORT=3000
NODE_ENV=production
```

4. Ejecutar migraciones:
```bash
railway run npx prisma migrate deploy
```

#### Frontend
1. Crear nuevo servicio en Railway
2. Configurar:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run preview`

3. Variables de entorno:
```env
VITE_API_URL=https://tu-backend.up.railway.app/api/v1
VITE_WS_URL=https://tu-backend.up.railway.app
```

---

### Opción 2: Docker

```bash
# Build
docker-compose build

# Run
docker-compose up -d

# Migraciones
docker-compose exec backend npx prisma migrate deploy
```

---

## 📖 Guías de Uso

### Para Administradores

#### Configuración Inicial
1. **Crear empresa**: Ir a `/configuracion` → Datos de la empresa
2. **Crear usuarios**: `/usuarios` → Asignar roles (ADMIN, OPERADOR, CHOFER, CONTABILIDAD, DIRECCION)
3. **Configurar catálogos**:
   - Clientes en `/clientes`
   - Camiones en `/camiones`
   - Choferes en `/choferes`
4. **Configurar plantillas de gasto**: `/configuracion` → Plantillas

#### Gestión de Permisos
El sistema RBAC permite control granular:

```typescript
// Ejemplo de verificación en frontend
import { usePermissions } from '@/hooks/usePermissions';
import { Modulo, Accion } from '@/utils/permissions';

function MiComponente() {
  const { can } = usePermissions();

  return (
    <>
      {can(Modulo.FLETES, Accion.CREAR) && (
        <button>Crear Flete</button>
      )}
    </>
  );
}
```

---

### Para Operadores

#### Flujo Cotización → Flete
1. **Crear cotización**: `/cotizaciones` → Nuevo
2. **Agregar conceptos**: Flete, maniobras, estancia, etc.
3. **Enviar a cliente**: Click en "Enviar"
4. **Cliente aprueba**: Marcar como "Aprobada"
5. **Convertir a flete**: Botón "Convertir a Flete"
6. **Asignar recursos**:
   - Camiones: Botón "Asignar Camión"
   - Choferes: Botón "Asignar Chofer"
7. **Iniciar viaje**: Cambiar estado a "En Curso"

#### Registro de Gastos
1. En detalle del flete, sección "Gastos"
2. Click "Agregar Gasto"
3. Seleccionar categoría (DIESEL, CASETAS, PEAJE, etc.)
4. Ingresar monto y concepto
5. Subir comprobante (opcional pero recomendado)
6. Guardar

---

### Para Choferes

#### Aplicación Móvil (Próximamente)
Actualmente pueden usar el navegador móvil:

1. **Ver mis fletes**: `/fletes` (muestra solo los asignados)
2. **Reportar gastos**:
   - Diesel: Usar `/solicitudes-combustible` para pre-autorización
   - Otros gastos: Directamente en el flete
3. **Solicitar viáticos**: `/viaticos/solicitudes`
4. **Subir comprobantes**: Después del viaje

---

### Para Contabilidad

#### Validación de Gastos
1. Ir a `/pendientes` → "Comprobantes Faltantes"
2. Para cada gasto:
   - Verificar comprobante
   - Validar monto vs factura
   - Marcar como "Validado"

#### Cierre de Fletes
1. Verificar que todos los gastos estén validados
2. Revisar P&L (utilidad y margen)
3. Cambiar estado a "CERRADO"
4. El flete ya no permite modificaciones

#### Control de Pagos
1. `/facturas` → Ver facturas pendientes
2. Registrar pagos parciales o totales
3. Actualizar estado de pago
4. El dashboard mostrará pagos vencidos automáticamente

---

## 🔌 API Documentation

### Autenticación

Todas las rutas (excepto `/auth/login` y `/auth/register`) requieren JWT:

```bash
# Login
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "MiPassword123"
}

# Respuesta
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez",
    "rol": "OPERADOR"
  }
}
```

Usar el token en requests subsecuentes:
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Endpoints Principales

#### Cotizaciones
```bash
# Listar
GET /api/v1/cotizaciones?estado=ENVIADA&page=1&limit=20

# Crear
POST /api/v1/cotizaciones
{
  "clienteId": 5,
  "origen": "CDMX",
  "destino": "Guadalajara",
  "validoHasta": "2024-12-31",
  "conceptos": [
    {
      "descripcion": "Flete",
      "subtotal": 15000
    }
  ]
}

# Convertir a flete
POST /api/v1/cotizaciones/:id/convertir-a-flete
```

---

#### Fletes
```bash
# Listar mis fletes
GET /api/v1/fletes?estado=EN_CURSO

# Detalle
GET /api/v1/fletes/:id

# Asignar chofer
POST /api/v1/fletes/:id/asignar-chofer
{
  "choferId": 3,
  "dias": 5
}

# Agregar gasto
POST /api/v1/gastos
{
  "fleteId": 10,
  "tipo": "DIESEL",
  "monto": 2500,
  "concepto": "Carga en Veracruz",
  "comprobanteUrl": "https://..."
}
```

---

#### Viáticos
```bash
# Crear solicitud
POST /api/v1/viaticos/solicitudes
{
  "fleteId": 15,
  "tipoGasto": "ALIMENTOS",
  "periodoInicio": "2024-12-01",
  "periodoFin": "2024-12-05",
  "montoSolicitado": 3000,
  "detalle": [
    {
      "concepto": "Desayunos",
      "importe": 1500
    },
    {
      "concepto": "Comidas",
      "importe": 1500
    }
  ]
}

# Aprobar
PATCH /api/v1/viaticos/solicitudes/:id/aprobar

# Depositar
PATCH /api/v1/viaticos/solicitudes/:id/depositar
{
  "montoDepositado": 3000,
  "fechaDeposito": "2024-12-06"
}

# Comprobar
POST /api/v1/viaticos/comprobaciones
{
  "solicitudId": 5,
  "fleteId": 15,
  "archivos": [
    {
      "nombre": "factura-hotel.pdf",
      "url": "https://storage/...",
      "tipo": "application/pdf",
      "tamano": 245000
    }
  ]
}
```

---

### Documentación Interactiva

Swagger UI disponible en:
```
http://localhost:3000/api/docs (desarrollo)
https://tu-api.railway.app/api/docs (producción)
```

---

## 🔐 Seguridad y RBAC

### Roles del Sistema

| Rol | Descripción | Casos de Uso |
|-----|-------------|--------------|
| **ADMIN** | Acceso total | Configuración, usuarios, todo |
| **OPERADOR** | Gestión operativa | Cotizaciones, fletes, asignaciones |
| **CHOFER** | Operación de campo | Registro de gastos, consulta de viajes |
| **CONTABILIDAD** | Validación financiera | Validar gastos, emitir facturas, control de pagos |
| **DIRECCION** | Vista ejecutiva | Reportes, aprobaciones, dashboard |

---

### Matriz de Permisos

| Módulo | ADMIN | OPERADOR | CHOFER | CONTABILIDAD | DIRECCION |
|--------|-------|----------|--------|--------------|-----------|
| **Empresas** | CRUD | - | - | - | R |
| **Usuarios** | CRUD | - | - | - | R |
| **Clientes** | CRUD | CRU | - | R | R |
| **Camiones** | CRUD | CRU | - | R | R |
| **Choferes** | CRUD | CRU | - | R | R |
| **Cotizaciones** | CRUD + Export | CRUD | - | R + Export | RU + Export |
| **Fletes** | CRUD + Cancel | CRUD | R | RU | RU + Cancel |
| **Gastos** | CRUD | CRUD | CR | CRUD + Validar | R + Aprobar |
| **Facturas** | CRUD + Export | R | - | CRUD + Export | R + Export |
| **Combustible** | CRUD + Aprobar + Depositar | CRU + Aprobar | CR | R + Depositar | R + Aprobar |
| **Viáticos** | CRUD + Aprobar + Depositar + Validar | CRUD + Aprobar + Validar | CRUD | R + Depositar + Validar | R + Aprobar + Cancelar |
| **Documentos** | CRUD | CRU | R | R | R |
| **Mantenimiento** | CRUD | CRU | R | - | R |
| **Reportes** | R + Export | - | - | R + Export | R + Export |
| **Dashboard** | R | R | - | R | R |

**Leyenda**: C=Crear, R=Leer, U=Actualizar, D=Eliminar

---

### Implementación de Permisos

#### Backend (NestJS)
```typescript
import { RequirePermission } from '@/common/rbac/roles.decorator';
import { Modulo, Accion } from '@/common/rbac/permissions.config';

@Controller('fletes')
export class FletesController {
  @Post()
  @RequirePermission(Modulo.FLETES, Accion.CREAR)
  create(@Body() dto: CreateFleteDto) {
    // Solo usuarios con permiso FLETES:CREAR pueden ejecutar
  }
}
```

#### Frontend (React)
```typescript
import { usePermissions } from '@/hooks/usePermissions';
import { Modulo, Accion } from '@/utils/permissions';

function FletesList() {
  const { can } = usePermissions();

  return (
    <div>
      {can(Modulo.FLETES, Accion.CREAR) && (
        <button>Nuevo Flete</button>
      )}

      {can(Modulo.FLETES, Accion.ELIMINAR) && (
        <button>Eliminar</button>
      )}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
```bash
# Verificar que PostgreSQL esté corriendo
pg_isready

# Verificar conexión
psql $DATABASE_URL

# Regenerar cliente Prisma
npx prisma generate
```

### Error: "JWT token invalid"
- El token expiró (duración: 7 días)
- Hacer logout y login nuevamente
- Verificar que JWT_SECRET sea el mismo en backend

### Error: "Permission denied"
- Verificar rol del usuario: `GET /api/v1/auth/me`
- Revisar matriz de permisos arriba
- Los permisos se evalúan en cada request

### Frontend no conecta con Backend
- Verificar `VITE_API_URL` en `.env`
- Revisar CORS en `backend/src/main.ts`
- Asegurar que ambos servicios estén corriendo

---

## 📊 Monitoreo y Logs

### Logs del Backend
```bash
# Development
npm run start:dev  # Logs en consola con colores

# Production
npm run start:prod  # Logs a archivo y consola
```

### Métricas Recomendadas
- Tiempo de respuesta de API (p95 < 500ms)
- Tasa de errores (< 1%)
- Uso de memoria (< 80%)
- Conexiones activas a DB (< 50)

### Herramientas de Monitoreo
- **Sentry**: Para errores en producción
- **LogRocket**: Grabación de sesiones
- **Datadog**: Métricas de infraestructura
- **Prisma Accelerate**: Cache y analytics de DB

---

## 🧪 Testing

### Backend
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend
```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e
```

---

## 🚦 Roadmap

### v2.0 (Q1 2025)
- [ ] App móvil nativa (React Native)
- [ ] Integración con GPS de camiones
- [ ] IA para predicción de costos
- [ ] Módulo de nómina

### v2.1 (Q2 2025)
- [ ] Multi-idioma (EN/ES)
- [ ] Dashboard ejecutivo avanzado
- [ ] Integración con Uber Freight
- [ ] API pública para terceros

---

## 🤝 Contribuciones

### Cómo Contribuir
1. Fork el repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'feat: agregar X'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request

### Convenciones de Código
- **TypeScript**: Strict mode habilitado
- **Linting**: ESLint + Prettier
- **Commits**: Conventional Commits (feat, fix, docs, etc.)
- **Tests**: Mínimo 70% de cobertura

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles

---

## 👥 Autores

- **Equipo LogiProfit** - *Desarrollo inicial*

---

## 📞 Soporte

- **Documentación**: https://docs.logiprofit.com (próximamente)
- **Email**: soporte@logiprofit.com
- **Discord**: https://discord.gg/logiprofit

---

## 🙏 Agradecimientos

- NestJS por el framework backend robusto
- Prisma por el ORM intuitivo
- React Team por las mejoras de React 18
- Tailwind CSS por el sistema de diseño
- Railway por el hosting simplificado
- Supabase por PostgreSQL confiable

---

**Última actualización:** Diciembre 2024
**Versión:** 1.5.0
**Estado:** ✅ Producción
