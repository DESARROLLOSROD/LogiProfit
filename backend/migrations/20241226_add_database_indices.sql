-- Migración: Agregar índices para optimización de performance
-- Fecha: 26 de Diciembre 2024
-- Impacto: CRÍTICO - Mejora performance 10-100x

-- TABLA: usuarios
-- Búsquedas por empresa y email (login)
CREATE INDEX IF NOT EXISTS "usuarios_empresaId_idx" ON "usuarios"("empresaId");
CREATE INDEX IF NOT EXISTS "usuarios_email_idx" ON "usuarios"("email");

-- TABLA: cotizaciones
-- Filtros comunes: empresa+estado, cliente, fecha
CREATE INDEX IF NOT EXISTS "cotizaciones_empresaId_estado_idx" ON "cotizaciones"("empresaId", "estado");
CREATE INDEX IF NOT EXISTS "cotizaciones_clienteId_idx" ON "cotizaciones"("clienteId");
CREATE INDEX IF NOT EXISTS "cotizaciones_createdAt_idx" ON "cotizaciones"("createdAt");

-- TABLA: fletes
-- Filtros comunes y ordenamiento
CREATE INDEX IF NOT EXISTS "fletes_empresaId_estado_idx" ON "fletes"("empresaId", "estado");
CREATE INDEX IF NOT EXISTS "fletes_clienteId_idx" ON "fletes"("clienteId");
CREATE INDEX IF NOT EXISTS "fletes_fechaInicio_idx" ON "fletes"("fechaInicio");
CREATE INDEX IF NOT EXISTS "fletes_createdAt_idx" ON "fletes"("createdAt");

-- TABLA: gastos
-- JOIN más común (flete_id) y filtros por categoría y fecha
CREATE INDEX IF NOT EXISTS "gastos_fleteId_idx" ON "gastos"("fleteId");
CREATE INDEX IF NOT EXISTS "gastos_categoriaId_idx" ON "gastos"("categoriaId");
CREATE INDEX IF NOT EXISTS "gastos_fecha_idx" ON "gastos"("fecha");

-- TABLA: mantenimientos
-- Búsquedas por camión+estado y alertas por fecha programada
CREATE INDEX IF NOT EXISTS "mantenimientos_camionId_estado_idx" ON "mantenimientos"("camionId", "estado");
CREATE INDEX IF NOT EXISTS "mantenimientos_fechaProgramada_idx" ON "mantenimientos"("fechaProgramada");