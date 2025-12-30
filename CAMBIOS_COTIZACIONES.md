# Cambios Realizados: Simplificación de Cotizaciones

## ✅ Cambios Aplicados

### Base de Datos
- ✅ Migración creada y aplicada: `20251230083928_simplify_cotizaciones`
- ✅ Eliminados campos de cálculos detallados del modelo `Cotizacion`
- ✅ Simplificado a:
  - `kmEstimado` (en lugar de kmCargado + kmVacio + kmTotal)
  - `precioCotizado` (único monto que ve el cliente)
  - Información básica: origen, destino, tipoCarga, pesoCarga, dimensiones
  - Estado y notas

### DTOs Actualizados
- ✅ `CreateCotizacionDto`: Simplificado a campos esenciales
- ✅ `UpdateCotizacionDto`: Actualizado acorde
- ✅ Eliminado `SimularCostosDto`

### Controlador
- ✅ Eliminado endpoint `/cotizaciones/simular`
- ✅ Actualizada importación de DTOs

## ✅ Actualizaciones Completadas

### Backend - Servicio de Cotizaciones
✅ El archivo `backend/src/modules/cotizaciones/cotizaciones.service.ts` fue actualizado:

1. ✅ **Eliminado método `simularCostos` completo** (229 líneas removidas)
2. ✅ **Eliminadas constantes de costos** (COSTO_DIESEL_LITRO, COSTO_CASETA_KM, etc.)
3. ✅ **Simplificado método `create`** - Cambió de:
```typescript
const simulacion = await this.simularCostos(empresaId, dto);
await this.prisma.cotizacion.create({
  data: {
    empresaId,
    folio,
    clienteId: dto.clienteId,
    origen: dto.origen,
    destino: dto.destino,
    tipoCarga: dto.tipoCarga,
    pesoCarga: dto.pesoCarga,
    dimensiones: dto.dimensiones,
    kmCargado: simulacion.kmCargado,
    kmVacio: simulacion.kmVacio,
    kmTotal: simulacion.kmTotal,
    precioCotizado: dto.precioCotizado,
    dieselEstimado: simulacion.dieselEstimado,
    // ... muchos campos más
  }
});
```

A:
```typescript
await this.prisma.cotizacion.create({
  data: {
    empresaId,
    folio,
    clienteId: dto.clienteId,
    origen: dto.origen,
    destino: dto.destino,
    tipoCarga: dto.tipoCarga,
    pesoCarga: dto.pesoCarga,
    dimensiones: dto.dimensiones,
    kmEstimado: dto.kmEstimado,
    precioCotizado: dto.precioCotizado,
    notas: dto.notas,
    validoHasta: dto.validoHasta,
    estado: EstadoCotizacion.BORRADOR,
  },
  include: {
    cliente: true,
    conceptos: true,
  },
});
```

4. ✅ **Actualizado método `findAll`** - Ahora solo convierte: `kmEstimado`, `precioCotizado`, `pesoCarga`
5. ✅ **Actualizado método `findOne`** - Simplificado para retornar solo campos esenciales
6. ✅ **Simplificado método `update`** - Removida lógica de recálculo de costos

### Frontend
✅ Actualizados archivos en `frontend/src/pages/cotizaciones/`:

1. ✅ **NuevaCotizacionMejorada.tsx** (de 804 líneas a 305 líneas):
   - ✅ Eliminado formulario complejo de simulación
   - ✅ Simplificado a campos esenciales:
     - Cliente, Origen/Destino
     - Tipo de carga, Peso, Dimensiones (opcionales)
     - KM Estimados
     - Precio Cotizado
     - Notas, Válido Hasta

2. ✅ **CotizacionDetalle.tsx** (de 667 líneas a 513 líneas):
   - ✅ Eliminada visualización de costos detallados
   - ✅ Ahora muestra solo:
     - Datos del cliente
     - Ruta (origen → destino)
     - Carga (tipo, peso, dimensiones)
     - KM Estimados
     - **PRECIO COTIZADO** (destacado en verde)
     - Conceptos/Servicios (tabla editable)
     - Estado y acciones

3. ✅ **Cotizaciones.tsx** (lista):
   - ✅ Eliminadas columnas de Utilidad y Margen
   - ✅ Ahora muestra: Folio, Cliente, Ruta, Precio Cotizado, Estado, Fecha, Acciones

4. ✅ **CotizacionRow.tsx** (componente):
   - ✅ Actualizado para eliminar campos `utilidadEsperada` y `margenEsperado`

### Seed Data
✅ Actualizado `backend/prisma/seed.ts`:
- ✅ Cambiado `kmCargado` y `kmVacio` por `kmEstimado`
- ✅ Eliminados todos los campos de costos detallados

## 🎯 Beneficios

1. **Simplicidad**: Cotización es solo un presupuesto para el cliente
2. **Separación clara**:
   - **Cotización** = Precio ofrecido al cliente
   - **Flete** = Operación real con gastos detallados
3. **Menos mantenimiento**: Sin cálculos complejos en cotizaciones
4. **UX mejorada**: Formulario más simple y rápido

## 📝 Notas

- Los **Conceptos** (CotizacionConcepto) se mantienen para permitir desglose de servicios si el cliente lo requiere
- Los **Fletes** mantienen todos los gastos detallados (diesel, casetas, viáticos, etc.)
- La conversión de Cotización a Flete se mantiene

## 📊 Resumen de Cambios

### Archivos Modificados:
1. ✅ `backend/prisma/schema.prisma` - Modelo Cotizacion simplificado (~40 campos removidos)
2. ✅ `backend/prisma/migrations/20251230083928_simplify_cotizaciones/migration.sql` - Migración aplicada
3. ✅ `backend/src/modules/cotizaciones/dto/cotizacion.dto.ts` - DTOs simplificados
4. ✅ `backend/src/modules/cotizaciones/cotizaciones.controller.ts` - Endpoint /simular removido
5. ✅ `backend/src/modules/cotizaciones/cotizaciones.service.ts` - Método simularCostos removido (~250 líneas)
6. ✅ `backend/prisma/seed.ts` - Datos de prueba actualizados
7. ✅ `frontend/src/pages/cotizaciones/NuevaCotizacionMejorada.tsx` - Simplificado (804 → 305 líneas)
8. ✅ `frontend/src/pages/cotizaciones/CotizacionDetalle.tsx` - Simplificado (667 → 513 líneas)
9. ✅ `frontend/src/pages/cotizaciones/Cotizaciones.tsx` - Columnas de utilidad/margen removidas
10. ✅ `frontend/src/components/CotizacionRow.tsx` - Campos de utilidad/margen removidos

### Compilación:
- ✅ Backend: Compila exitosamente sin errores
- ✅ Frontend: Compila exitosamente sin errores

### Estado Final:
🎉 **Todas las actualizaciones completadas exitosamente**
