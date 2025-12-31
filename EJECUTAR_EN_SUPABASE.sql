-- =========================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- =========================================
-- Este script crea las tablas necesarias para el módulo de VIATICOS
-- Si alguna tabla ya existe, el script la omitirá automáticamente

-- Paso 1: Crear los tipos ENUM (si no existen)
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

-- Paso 2: Crear tabla solicitudes_viatico
CREATE TABLE IF NOT EXISTS "solicitudes_viatico" (
    "id" SERIAL NOT NULL,
    "fleteId" INTEGER NOT NULL,
    "operadorId" INTEGER NOT NULL,
    "tipoGasto" "TipoGastoViatico" NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFin" TIMESTAMP(3) NOT NULL,
    "montoSolicitado" DECIMAL(12,2) NOT NULL,
    "detalle" JSONB NOT NULL,
    "estado" "EstadoSolicitudViatico" NOT NULL DEFAULT 'SOLICITADO',
    "pdfUrl" TEXT,
    "enviadoAdmon" BOOLEAN NOT NULL DEFAULT false,
    "correoEnvioTs" TIMESTAMP(3),
    "aprobadoPor" INTEGER,
    "aprobadoAt" TIMESTAMP(3),
    "depositadoPor" INTEGER,
    "depositadoAt" TIMESTAMP(3),
    "canceladoPor" INTEGER,
    "canceladoAt" TIMESTAMP(3),
    "motivoCancelacion" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitudes_viatico_pkey" PRIMARY KEY ("id")
);

-- Paso 3: Crear tabla comprobaciones_viatico
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

-- Paso 4: Crear índices (solo si no existen)
CREATE INDEX IF NOT EXISTS "solicitudes_viatico_fleteId_idx" ON "solicitudes_viatico"("fleteId");
CREATE INDEX IF NOT EXISTS "solicitudes_viatico_operadorId_idx" ON "solicitudes_viatico"("operadorId");
CREATE INDEX IF NOT EXISTS "solicitudes_viatico_estado_idx" ON "solicitudes_viatico"("estado");
CREATE INDEX IF NOT EXISTS "comprobaciones_viatico_solicitudId_idx" ON "comprobaciones_viatico"("solicitudId");
CREATE INDEX IF NOT EXISTS "comprobaciones_viatico_fleteId_idx" ON "comprobaciones_viatico"("fleteId");
CREATE INDEX IF NOT EXISTS "comprobaciones_viatico_operadorId_idx" ON "comprobaciones_viatico"("operadorId");
CREATE INDEX IF NOT EXISTS "comprobaciones_viatico_estado_idx" ON "comprobaciones_viatico"("estado");

-- Paso 5: Agregar foreign keys (solo si no existen)
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

-- Paso 6: Registrar migración en la tabla _prisma_migrations
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
    'a8c7e5f9-4b2d-4e1a-9f3c-6d8e2a1b5c4d',
    'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    NOW(),
    '20251231_add_viaticos',
    NULL,
    NULL,
    NOW(),
    1
) ON CONFLICT (id) DO NOTHING;

-- =========================================
-- SCRIPT COMPLETADO
-- =========================================
-- Ahora puedes ejecutar este script en Supabase SQL Editor
-- Selecciona todo el contenido (Ctrl+A) y presiona "Run" o F5
