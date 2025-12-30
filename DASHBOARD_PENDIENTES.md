# Dashboard de Tareas Pendientes

## 🎯 Objetivo
Proporcionar a la contadora una vista centralizada de todas las tareas pendientes del día, organizadas por prioridad y tipo, para mejorar la eficiencia y evitar olvidar tareas importantes.

## ✅ Implementación Completada

### 1. Backend - Módulo Dashboard

**Archivos creados:**
- `backend/src/modules/dashboard/dashboard.module.ts` - Módulo NestJS
- `backend/src/modules/dashboard/dashboard.controller.ts` - Controlador con endpoint
- `backend/src/modules/dashboard/dashboard.service.ts` - Lógica de negocio

**Endpoint disponible:**
```
GET /api/dashboard/pendientes
```

**Respuesta del endpoint:**
```typescript
{
  fletesSinGastos: {
    sinGastosRegistrados: Flete[],  // Fletes EN_CURSO/COMPLETADOS sin gastos
    total: number
  },
  cotizacionesPorVencer: {
    cotizaciones: Cotizacion[],     // Cotizaciones que vencen en 7 días o menos
    total: number
  },
  xmlFaltantes: {
    gastos: Gasto[],                // Gastos sin comprobante fiscal
    total: number
  },
  pagosVencidos: {
    pagos: Pago[],                  // Pagos con fecha de vencimiento pasada
    total: number                   // (Placeholder - requiere modelo Pago)
  }
}
```

### 2. Frontend - Página de Pendientes

**Archivo creado:**
- `frontend/src/pages/Pendientes.tsx` - Página completa del dashboard

**Características:**

#### Resumen Visual (4 Cards)
- **Fletes sin Gastos** (amarillo) - TruckIcon
- **Cotizaciones por Vencer** (naranja) - ClockIcon
- **Comprobantes Faltantes** (rojo) - DocumentTextIcon
- **Pagos Vencidos** (morado) - ExclamationTriangleIcon

#### Secciones Detalladas

##### 1. Fletes sin Gastos Registrados
- Lista de fletes en curso o completados sin gastos
- Muestra: Folio, Cliente, Ruta, Estado
- Link directo al detalle del flete
- Color: Amarillo (advertencia)

##### 2. Cotizaciones por Vencer
- Cotizaciones que vencen en los próximos 7 días
- Muestra: Folio, Cliente, Monto, Fecha de vencimiento, Días restantes
- Badge de urgencia:
  - Rojo: Ya vencida
  - Amarillo: Vence en ≤ 3 días
  - Azul: Vence en > 3 días
- Link directo al detalle de la cotización
- Color: Naranja (atención)

##### 3. Comprobantes Fiscales Faltantes
- Gastos sin archivo de comprobante (XML/PDF)
- Muestra: Folio del flete, Cliente, Tipo de gasto, Monto, Fecha
- Link directo al flete para subir el comprobante
- Color: Rojo (prioridad alta)

##### 4. Pagos Vencidos
- Pagos con fecha de vencimiento pasada
- Placeholder - se implementará cuando exista el modelo de Pagos
- Color: Morado (crítico)

### 3. Integración en la Aplicación

**Archivos modificados:**

#### `frontend/src/App.tsx`
```typescript
import Pendientes from './pages/Pendientes'
// ...
<Route path="/pendientes" element={<Pendientes />} />
```

#### `frontend/src/layouts/DashboardLayout.tsx`
```typescript
import { ClockIcon } from '@heroicons/react/24/outline'
// ...
const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Pendientes', href: '/pendientes', icon: ClockIcon },  // ← NUEVO
  { name: 'Cotizaciones', href: '/cotizaciones', icon: DocumentTextIcon },
  // ...
]
```

#### `backend/src/app.module.ts`
```typescript
import { DashboardModule } from './modules/dashboard/dashboard.module';
// ...
imports: [
  // ...
  DashboardModule,
]
```

## 📊 Detalles Técnicos

### Queries del Backend

#### 1. Fletes sin Gastos
```typescript
await this.prisma.flete.findMany({
  where: {
    empresaId,
    estado: { in: [EstadoFlete.EN_CURSO, EstadoFlete.COMPLETADO] },
    gastos: { none: {} }  // No tiene gastos relacionados
  },
  // ...
  take: 20  // Limita a 20 resultados
})
```

#### 2. Cotizaciones por Vencer
```typescript
await this.prisma.cotizacion.findMany({
  where: {
    empresaId,
    estado: { in: [EstadoCotizacion.ENVIADA, EstadoCotizacion.BORRADOR] },
    validoHasta: { lte: en7Dias }  // Vencen en 7 días o menos
  },
  // ...
})
```

#### 3. Gastos sin Comprobante
```typescript
await this.prisma.gasto.findMany({
  where: {
    flete: { empresaId },
    comprobanteUrl: null  // Sin comprobante
  },
  // ...
})
```

### Cálculos Frontend

#### Días Restantes para Cotizaciones
```typescript
const diasRestantes = cot.validoHasta
  ? Math.ceil((cot.validoHasta.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  : 0;
```

#### Badge de Urgencia
```typescript
cot.diasRestantes < 0 ? 'badge-error'        // Vencida
  : cot.diasRestantes <= 3 ? 'badge-warning'  // Urgente
  : 'badge-info'                              // Normal
```

## 🎨 Diseño de UI

### Colores de Sección
- **Amarillo** (`yellow-50/200/700/900`) - Fletes sin gastos (advertencia)
- **Naranja** (`orange-50/200/700/900`) - Cotizaciones por vencer (atención)
- **Rojo** (`red-50/200/700/900`) - Comprobantes faltantes (prioridad)
- **Morado** (`purple-50/200/700/900`) - Pagos vencidos (crítico)

### Componentes
- `SummaryCard` - Cards de resumen con iconos
- Tablas con hover states
- Links directos a detalles
- Badges de estado con colores semánticos
- Estado vacío con mensaje de éxito cuando no hay pendientes

## 🚀 Beneficios para la Contadora

### 1. Visibilidad Completa
- Ve de un vistazo todas las tareas pendientes
- No necesita revisar módulo por módulo
- Organización por prioridad visual (colores)

### 2. Eficiencia
- Acceso directo desde el menú principal
- Links directos a cada elemento
- Información resumida y clara

### 3. Prevención de Errores
- No olvidar registrar gastos
- Seguimiento de cotizaciones antes de que venzan
- Recordatorio de comprobantes fiscales faltantes

### 4. Organización Diaria
- Sabe exactamente qué hacer cada día
- Prioriza tareas por urgencia
- Reduce estrés y mejora control

## 📝 Uso Recomendado

### Rutina Diaria Sugerida
1. **Inicio del día:** Revisar `/pendientes`
2. **Priorizar:**
   - Cotizaciones vencidas → contactar cliente
   - Comprobantes faltantes → solicitar/subir
   - Fletes sin gastos → registrar
3. **Durante el día:** Actualizar conforme se resuelven tareas
4. **Fin del día:** Verificar que todo esté al día

## 🔮 Mejoras Futuras Planeadas

1. **Modelo de Pagos**
   - Implementar tabla de Pagos en BD
   - Trackear vencimientos
   - Mostrar pagos vencidos en el dashboard

2. **Notificaciones**
   - Alertas automáticas de tareas urgentes
   - Resumen diario por email
   - Badge de contador en el menú

3. **Filtros y Ordenamiento**
   - Filtrar por cliente
   - Ordenar por urgencia
   - Búsqueda rápida

4. **Exportación**
   - Exportar pendientes a Excel
   - Reporte de tareas completadas
   - Historial de pendientes

## ✅ Estado de Compilación

- ✅ Backend compila sin errores
- ✅ Frontend compila sin errores
- ✅ Ruta agregada al App.tsx
- ✅ Link agregado al menú de navegación
- ✅ Endpoint funcional en `/api/dashboard/pendientes`

## 📁 Archivos Creados/Modificados

### Creados:
1. `backend/src/modules/dashboard/dashboard.module.ts`
2. `backend/src/modules/dashboard/dashboard.controller.ts`
3. `backend/src/modules/dashboard/dashboard.service.ts`
4. `frontend/src/pages/Pendientes.tsx`
5. `DASHBOARD_PENDIENTES.md` (este archivo)

### Modificados:
1. `backend/src/app.module.ts` - Import DashboardModule
2. `frontend/src/App.tsx` - Route para /pendientes
3. `frontend/src/layouts/DashboardLayout.tsx` - Link en menú

## 🎉 Completado

El Dashboard de Tareas Pendientes está completamente implementado y listo para usar. Proporciona una herramienta poderosa para que la contadora gestione sus tareas diarias de manera eficiente y organizada.
