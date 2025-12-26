# Troubleshooting - LogiProfit

## 🐛 Problemas Comunes y Soluciones

---

## 1. Loop Infinito en Dashboard / Cotizaciones

### ❌ Síntoma
- El navegador se congela
- La consola muestra requests infinitos
- El backend no deja de leer datos

### 🔍 Causa
**useEffect con dependencias incorrectas** que causan re-renders infinitos.

### ✅ Solución

#### Dashboard.tsx - INCORRECTO:
```typescript
useEffect(() => {
  fetchDashboard()
  // Interval setup...
}, [data]) // ❌ data cambia cada vez que fetchDashboard se ejecuta
```

#### Dashboard.tsx - CORRECTO:
```typescript
// Separar en dos useEffect
useEffect(() => {
  fetchDashboard()
}, []) // ✅ Solo al montar

useEffect(() => {
  if (!data) return
  const interval = setInterval(() => {
    runAllNotificationChecks({ fletes: data.topPerdidas })
  }, 5 * 60 * 1000)
  return () => clearInterval(interval)
}, [data?.topPerdidas]) // ✅ Solo cuando topPerdidas cambia
```

#### Cotizaciones.tsx - INCORRECTO:
```typescript
const fetchCotizaciones = useCallback(async () => {
  // ...
}, [])

useEffect(() => {
  fetchCotizaciones()
}, [fetchCotizaciones]) // ❌ fetchCotizaciones cambia en cada render
```

#### Cotizaciones.tsx - CORRECTO:
```typescript
useEffect(() => {
  const fetchCotizaciones = async () => {
    // ...
  }
  fetchCotizaciones()
}, []) // ✅ Solo al montar
```

---

## 2. Error: "Column categoriaId does not exist"

### ❌ Síntoma
```
PrismaClientKnownRequestError: The column `gastos.categoriaId` does not exist
```

### 🔍 Causa
La base de datos no tiene las nuevas columnas del schema actualizado.

### ✅ Solución

```bash
# 1. Aplicar migración
cd backend
npx prisma db execute --file migrations/add_rbac_budgets_maintenance.sql

# 2. Regenerar Prisma Client
npx prisma generate

# 3. Reiniciar servidor
npm run start:dev
```

---

## 3. WebSocket No Conecta

### ❌ Síntoma
- Consola frontend: `[WS] Error de conexión`
- No llegan notificaciones en tiempo real

### 🔍 Causa
- Backend no está corriendo
- URL incorrecta en `frontend/src/lib/websocket.ts`
- CORS bloqueando conexión

### ✅ Solución

1. **Verificar backend corriendo:**
```bash
cd backend
npm run start:dev
# Debe mostrar: WebSocketGateway listening...
```

2. **Verificar URL en frontend:**
```typescript
// frontend/src/lib/websocket.ts
const wsUrl = 'http://localhost:3000' // ✅ Debe coincidir con backend
```

3. **Verificar CORS en backend:**
```typescript
// backend/src/notifications/notifications.gateway.ts
@WebSocketGateway({
  cors: {
    origin: '*', // En desarrollo acepta todo
    credentials: true,
  },
})
```

---

## 4. Permisos RBAC No Funcionan

### ❌ Síntoma
- Usuario OPERADOR puede hacer acciones de ADMIN
- Error 403 en acciones permitidas

### 🔍 Causa
- Permisos no asignados en base de datos
- Guard no registrado en módulo

### ✅ Solución

1. **Verificar permisos en DB:**
```sql
-- Ver permisos de un usuario
SELECT * FROM vista_permisos_usuarios WHERE usuario_id = 1;
```

2. **Asignar permisos:**
```sql
-- Asignar permiso de lectura de cotizaciones
INSERT INTO usuario_permisos ("usuarioId", "permisoId")
SELECT 1, id FROM permisos WHERE modulo = 'cotizaciones' AND accion = 'leer';
```

3. **Verificar que el guard está registrado:**
```typescript
// En el controller
@UseGuards(JwtAuthGuard, PermissionsGuard) // ✅ Ambos guards
```

---

## 5. Build Frontend Falla

### ❌ Síntoma
```
error TS2339: Property 'X' does not exist on type 'Y'
```

### 🔍 Causa
- Tipos TypeScript desactualizados
- Imports incorrectos

### ✅ Solución

```bash
cd frontend

# 1. Limpiar cache
rm -rf node_modules/.vite
rm -rf dist

# 2. Verificar tipos
npm run build

# 3. Si persiste, reinstalar dependencias
rm -rf node_modules
npm install
```

---

## 6. Prisma Generate Falla (Windows)

### ❌ Síntoma
```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp'
```

### 🔍 Causa
- Proceso Node bloqueando archivo
- Antivirus bloqueando

### ✅ Solución

```bash
# 1. Cerrar todos los procesos Node
# En PowerShell:
Get-Process node | Stop-Process -Force

# 2. Reintentar
npx prisma generate

# 3. Si persiste, excluir carpeta en antivirus
# Agregar a exclusiones: C:\Users\...\logiprofit\backend\node_modules\.prisma
```

---

## 7. Mantenimiento No Aparece en Menú

### ❌ Síntoma
- Módulo implementado pero no visible en navegación

### 🔍 Causa
- Ruta no agregada al router
- Componente no exportado

### ✅ Solución

1. **Agregar ruta en App.tsx:**
```typescript
<Route path="/mantenimiento" element={<Mantenimiento />} />
<Route path="/mantenimiento/:id" element={<MantenimientoDetalle />} />
```

2. **Agregar al menú de navegación:**
```typescript
// En Sidebar o Header
<Link to="/mantenimiento">
  <WrenchIcon className="w-5 h-5" />
  Mantenimiento
</Link>
```

---

## 8. Categorías de Gastos No Aparecen

### ❌ Síntoma
- Dropdown de categorías vacío
- Error al crear gasto

### 🔍 Causa
- Seed no ejecutado
- empresaId incorrecto en query

### ✅ Solución

```bash
# 1. Ejecutar seed de datos iniciales
cd backend
npx prisma db execute --file scripts/seed-initial-data.sql

# 2. Verificar en DB
psql -d logiprofit -c "SELECT COUNT(*) FROM categorias_gasto;"
# Debe retornar: 14 * número_de_empresas
```

---

## 9. Notificaciones Push No Funcionan

### ❌ Síntoma
- No aparece popup de permiso
- Notificaciones no se muestran

### 🔍 Causa
- HTTPS requerido (en producción)
- Service Worker no registrado
- Permisos denegados

### ✅ Solución

1. **Verificar Service Worker:**
```javascript
// Consola del navegador
navigator.serviceWorker.controller
// Debe retornar objeto, no null
```

2. **Forzar registro:**
```javascript
// Consola del navegador
navigator.serviceWorker.register('/sw.js')
```

3. **Verificar permisos:**
```javascript
// Consola del navegador
Notification.permission
// Debe ser 'granted'
```

4. **Re-solicitar permisos:**
```javascript
Notification.requestPermission().then(permission => {
  console.log(permission) // 'granted', 'denied', or 'default'
})
```

---

## 10. Lentitud en Filtros / Búsqueda

### ❌ Síntoma
- Lag al escribir en búsqueda
- UI se congela al filtrar

### 🔍 Causa
- Falta debouncing
- Re-renders excesivos
- Datos no memoizados

### ✅ Solución

**Ya implementado en Cotizaciones.tsx:**
```typescript
// ✅ Debounce de 300ms
const debouncedBusqueda = useDebounce(busqueda, 300)

// ✅ Memoización de filtros
const filteredCotizaciones = useMemo(() => {
  // ... filtrado
}, [cotizaciones, debouncedBusqueda, filtroEstado])
```

---

## 11. Error: "toFixed is not a function"

### ❌ Síntoma
```
TypeError: cotizacion.margenEsperado.toFixed is not a function
```

### 🔍 Causa
Los campos `Decimal` de Prisma se serializan como **strings** en JSON, no como números.

### ✅ Solución

**Convertir a número antes de usar métodos numéricos:**

```typescript
// ❌ INCORRECTO
<td>{cotizacion.margenEsperado.toFixed(1)}%</td>

// ✅ CORRECTO
const margenEsperado = Number(cotizacion.margenEsperado)
<td>{margenEsperado.toFixed(1)}%</td>
```

**Campos afectados:**
- `precioCotizado` (Decimal)
- `utilidadEsperada` (Decimal)
- `margenEsperado` (Decimal)
- `kmActual` (Decimal)
- `monto` en gastos (Decimal)

**Conversión segura:**
```typescript
// En componentes
const precio = Number(cotizacion.precioCotizado) || 0
const margen = Number(cotizacion.margenEsperado) || 0

// Para cálculos
const total = datos.reduce((sum, item) => sum + Number(item.monto), 0)
```

---

## 📊 Herramientas de Diagnóstico

### Verificar Estado del Sistema

```bash
# Backend
cd backend
npm run start:dev

# Debe mostrar:
# - Nest application started
# - All modules initialized
# - Application listening on port 3000
```

```bash
# Frontend
cd frontend
npm run dev

# Debe mostrar:
# - VITE ready in XXXms
# - Local: http://localhost:5173
```

### Verificar Base de Datos

```sql
-- Tablas creadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Permisos
SELECT COUNT(*) FROM permisos; -- Debe ser 25

-- Categorías
SELECT e.nombre, COUNT(c.id)
FROM empresas e
LEFT JOIN categorias_gasto c ON e.id = c."empresaId"
GROUP BY e.id, e.nombre;
```

### Ver Logs

```bash
# Backend logs
cd backend
npm run start:dev 2>&1 | tee backend.log

# Frontend en consola del navegador
# F12 -> Console tab
```

---

## 🆘 Soporte

Si el problema persiste:
1. Verificar logs completos
2. Revisar documentación en `MEJORAS_IMPLEMENTADAS.md`
3. Verificar migraciones en `backend/migrations/README.md`
4. Limpiar caché y reinstalar dependencias

---

**Última actualización:** Diciembre 2024
