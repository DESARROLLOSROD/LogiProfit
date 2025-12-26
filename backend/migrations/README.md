# Migraciones de Base de Datos - LogiProfit

## 📋 Índice
- [Migraciones Aplicadas](#migraciones-aplicadas)
- [Cómo Aplicar Migraciones](#cómo-aplicar-migraciones)
- [Rollback](#rollback)
- [Verificación](#verificación)

---

## ✅ Migraciones Aplicadas

### 2024-12-26: RBAC, Presupuestos y Mantenimiento
**Archivo:** `add_rbac_budgets_maintenance.sql`

**Cambios:**
- ✅ Tablas de permisos RBAC (`permisos`, `usuario_permisos`)
- ✅ Categorías de gastos (`categorias_gasto`)
- ✅ Presupuestos (`presupuestos`, `presupuesto_categorias`)
- ✅ Mantenimiento (`mantenimientos`)
- ✅ Columna `categoriaId` en `gastos`
- ✅ Columna `kmActual` en `camiones`
- ✅ ENUMs: `TipoMantenimiento`, `EstadoMantenimiento`
- ✅ 25 permisos base insertados
- ✅ Índices de performance

**Datos iniciales:**
- 25 permisos granulares
- 14 categorías de gastos predeterminadas (por empresa)
- 2 vistas útiles: `vista_permisos_usuarios`, `vista_stats_mantenimiento`

---

## 🚀 Cómo Aplicar Migraciones

### Opción 1: Con Prisma (Recomendado en desarrollo)
```bash
cd backend
npx prisma migrate dev --name nombre_migracion
```

### Opción 2: Ejecutar SQL Directamente (Producción)
```bash
cd backend
npx prisma db execute --file migrations/nombre_archivo.sql --schema prisma/schema.prisma
```

### Opción 3: Desde PostgreSQL directamente
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f migrations/nombre_archivo.sql
```

### Después de aplicar migración:
```bash
# Regenerar cliente Prisma
npx prisma generate

# Verificar compilación
npm run build

# Reiniciar servidor
npm run start:dev
```

---

## 🔄 Rollback

### Para deshacer la última migración:

```sql
-- Eliminar tablas (en orden inverso por dependencias)
DROP VIEW IF EXISTS vista_stats_mantenimiento;
DROP VIEW IF EXISTS vista_permisos_usuarios;
DROP TABLE IF EXISTS mantenimientos;
DROP TABLE IF EXISTS presupuesto_categorias;
DROP TABLE IF EXISTS presupuestos;
DROP TABLE IF EXISTS usuario_permisos;
DROP TABLE IF EXISTS permisos;

-- Eliminar columnas agregadas
ALTER TABLE gastos DROP COLUMN IF EXISTS categoriaId;
ALTER TABLE camiones DROP COLUMN IF EXISTS kmActual;

-- Eliminar categorías (CUIDADO: esto borra datos)
DROP TABLE IF EXISTS categorias_gasto;

-- Eliminar ENUMs
DROP TYPE IF EXISTS "TipoMantenimiento";
DROP TYPE IF EXISTS "EstadoMantenimiento";

-- Eliminar función auxiliar
DROP FUNCTION IF EXISTS asignar_permisos_modulo;
```

**⚠️ ADVERTENCIA:** El rollback eliminará todos los datos de estas tablas. Hacer backup antes.

---

## ✔️ Verificación

### Verificar que las tablas existen:
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Verificar permisos insertados:
```sql
SELECT COUNT(*) FROM permisos;
-- Debe retornar: 25
```

### Verificar categorías por empresa:
```sql
SELECT e.nombre as empresa, COUNT(cg.id) as categorias
FROM empresas e
LEFT JOIN categorias_gasto cg ON e.id = cg."empresaId"
GROUP BY e.id, e.nombre;
-- Cada empresa debe tener 14 categorías
```

### Verificar vistas creadas:
```sql
-- Ver permisos de todos los usuarios
SELECT * FROM vista_permisos_usuarios LIMIT 10;

-- Ver estadísticas de mantenimiento
SELECT * FROM vista_stats_mantenimiento LIMIT 10;
```

### Verificar índices:
```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename IN ('usuario_permisos', 'gastos', 'mantenimientos')
ORDER BY
    tablename, indexname;
```

---

## 📊 Schema Actualizado

### Nuevas Tablas

#### `permisos`
- Control granular de acciones por módulo
- 25 permisos predefinidos

#### `usuario_permisos`
- Relación many-to-many
- Los ADMIN tienen acceso implícito a todo

#### `categorias_gasto`
- Personalizables por empresa
- Color coding para UI
- 14 categorías predeterminadas

#### `presupuestos`
- Por periodo (mensual, trimestral, anual)
- Control presupuestal

#### `presupuesto_categorias`
- Distribución de presupuesto
- Comparación ejecutado vs planeado

#### `mantenimientos`
- Preventivo y correctivo
- KM y fecha programada
- Historial completo

---

## 🎯 Próximos Pasos

1. ✅ Aplicar migración
2. ✅ Regenerar Prisma Client
3. ✅ Ejecutar seed de datos iniciales
4. ⏳ Asignar permisos a usuarios existentes
5. ⏳ Crear categorías personalizadas (opcional)
6. ⏳ Programar mantenimientos preventivos

---

## 📞 Soporte

Si encuentras problemas:
1. Verificar logs de Prisma: `npx prisma studio`
2. Revisar conexión a DB en `.env`
3. Verificar versión de Prisma: `npx prisma --version`

**Versión actual:** Prisma 5.22.0
**PostgreSQL:** Compatible con 12+
