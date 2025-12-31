-- =========================================
-- COMPLETAR MÓDULO DE VIATICOS EN SUPABASE
-- =========================================
-- Este script verifica y crea solo lo que falta para el módulo de viáticos
-- Ejecutar en Supabase SQL Editor

-- Paso 1: Verificar y crear tipos ENUM si no existen
DO $$ BEGIN
    CREATE TYPE "TipoGastoViatico" AS ENUM ('ALIMENTOS', 'HOSPEDAJE', 'CASETAS', 'COMBUSTIBLE', 'OTROS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EstadoSolicitudViatico" AS ENUM ('SOLICITADO', 'APROBADO', 'DEPOSITADO', 'CANCELADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EstadoComprobacionViatico" AS ENUM ('PENDIENTE_VALIDACION', 'APROBADO', 'RECHAZADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Paso 2: Crear tabla comprobaciones_viatico si no existe
CREATE TABLE IF NOT EXISTS "comprobaciones_viatico" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER,
    "fleteId" INTEGER NOT NULL,
    "operadorId" INTEGER NOT NULL,
    "archivos" JSONB NOT NULL,
    "estado" "EstadoComprobacionViatico" NOT NULL DEFAULT 'PENDIENTE_VALIDACION',
    "validadorId" INTEGER,
    "validadoAt" TIMESTAMP(3),
    "motivoRechazo" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comprobaciones_viatico_pkey" PRIMARY KEY ("id")
);

-- Paso 3: Crear índices para comprobaciones_viatico si no existen
CREATE INDEX IF NOT EXISTS "comprobaciones_viatico_solicitudId_idx" ON "comprobaciones_viatico"("solicitudId");
CREATE INDEX IF NOT EXISTS "comprobaciones_viatico_fleteId_idx" ON "comprobaciones_viatico"("fleteId");
CREATE INDEX IF NOT EXISTS "comprobaciones_viatico_operadorId_idx" ON "comprobaciones_viatico"("operadorId");
CREATE INDEX IF NOT EXISTS "comprobaciones_viatico_estado_idx" ON "comprobaciones_viatico"("estado");

-- Paso 4: Crear índices para solicitudes_viatico si no existen
CREATE INDEX IF NOT EXISTS "solicitudes_viatico_fleteId_idx" ON "solicitudes_viatico"("fleteId");
CREATE INDEX IF NOT EXISTS "solicitudes_viatico_operadorId_idx" ON "solicitudes_viatico"("operadorId");
CREATE INDEX IF NOT EXISTS "solicitudes_viatico_estado_idx" ON "solicitudes_viatico"("estado");

-- Paso 5: Agregar foreign keys para comprobaciones_viatico si no existen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'comprobaciones_viatico_solicitudId_fkey'
    ) THEN
        ALTER TABLE "comprobaciones_viatico"
        ADD CONSTRAINT "comprobaciones_viatico_solicitudId_fkey"
        FOREIGN KEY ("solicitudId") REFERENCES "solicitudes_viatico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'comprobaciones_viatico_fleteId_fkey'
    ) THEN
        ALTER TABLE "comprobaciones_viatico"
        ADD CONSTRAINT "comprobaciones_viatico_fleteId_fkey"
        FOREIGN KEY ("fleteId") REFERENCES "fletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'comprobaciones_viatico_operadorId_fkey'
    ) THEN
        ALTER TABLE "comprobaciones_viatico"
        ADD CONSTRAINT "comprobaciones_viatico_operadorId_fkey"
        FOREIGN KEY ("operadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'comprobaciones_viatico_validadorId_fkey'
    ) THEN
        ALTER TABLE "comprobaciones_viatico"
        ADD CONSTRAINT "comprobaciones_viatico_validadorId_fkey"
        FOREIGN KEY ("validadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Paso 6: Agregar foreign keys para solicitudes_viatico si no existen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'solicitudes_viatico_fleteId_fkey'
    ) THEN
        ALTER TABLE "solicitudes_viatico"
        ADD CONSTRAINT "solicitudes_viatico_fleteId_fkey"
        FOREIGN KEY ("fleteId") REFERENCES "fletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'solicitudes_viatico_operadorId_fkey'
    ) THEN
        ALTER TABLE "solicitudes_viatico"
        ADD CONSTRAINT "solicitudes_viatico_operadorId_fkey"
        FOREIGN KEY ("operadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Paso 7: Verificar que la tabla _prisma_migrations existe y registrar la migración
INSERT INTO "_prisma_migrations" (
    "id",
    "checksum",
    "finished_at",
    "migration_name",
    "logs",
    "rolled_back_at",
    "started_at",
    "applied_steps_count"
) VALUES (
    gen_random_uuid()::text,
    'viaticos_module_complete_v1',
    NOW(),
    '20251231_add_viaticos',
    NULL,
    NULL,
    NOW(),
    1
) ON CONFLICT (migration_name) DO NOTHING;

-- =========================================
-- VERIFICACIÓN
-- =========================================
-- Ejecuta estas consultas después para verificar que todo está bien:

-- Ver las tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%viatico%'
ORDER BY table_name;

-- Ver los tipos ENUM creados
SELECT t.typname as enum_name,
       string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%viatico%'
GROUP BY t.typname
ORDER BY t.typname;

-- Contar registros en cada tabla
SELECT 'solicitudes_viatico' as tabla, COUNT(*) as registros FROM solicitudes_viatico
UNION ALL
SELECT 'comprobaciones_viatico' as tabla, COUNT(*) as registros FROM comprobaciones_viatico;
