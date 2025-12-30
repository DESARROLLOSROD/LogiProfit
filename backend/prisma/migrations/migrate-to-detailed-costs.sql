-- Migration: Add detailed cost fields to support real-world quotation methodology
-- This migration adds fields for: carro piloto, detailed expenses, percentage-based costs, etc.

BEGIN;

-- ============================================
-- STEP 1: Add new columns to camiones table
-- ============================================

-- Add new rendimiento fields (split cargado/vacio)
ALTER TABLE "camiones"
  ADD COLUMN "rendimientoKmLCargado" DECIMAL(5,2) DEFAULT 2.5 NOT NULL,
  ADD COLUMN "rendimientoKmLVacio" DECIMAL(5,2) DEFAULT 3.0 NOT NULL;

-- Migrate existing rendimientoKmL data to new fields
UPDATE "camiones"
SET "rendimientoKmLCargado" = "rendimientoKmL",
    "rendimientoKmLVacio" = "rendimientoKmL" * 1.2  -- Vacío tiene mejor rendimiento
WHERE "rendimientoKmL" IS NOT NULL;

-- Drop old column
ALTER TABLE "camiones" DROP COLUMN "rendimientoKmL";

-- ============================================
-- STEP 2: Add new columns to cotizaciones table
-- ============================================

-- Descripción de carga
ALTER TABLE "cotizaciones"
  ADD COLUMN "tipoCarga" TEXT,
  ADD COLUMN "pesoCarga" DECIMAL(10,2),
  ADD COLUMN "dimensiones" TEXT;

-- Kilometraje detallado
ALTER TABLE "cotizaciones"
  ADD COLUMN "kmCargado" DECIMAL(10,2) DEFAULT 0 NOT NULL,
  ADD COLUMN "kmVacio" DECIMAL(10,2) DEFAULT 0 NOT NULL,
  ADD COLUMN "kmTotal" DECIMAL(10,2) DEFAULT 0 NOT NULL;

-- Migrate existing kmEstimados to kmCargado and kmTotal
UPDATE "cotizaciones"
SET "kmCargado" = "kmEstimados",
    "kmTotal" = "kmEstimados"
WHERE "kmEstimados" IS NOT NULL;

-- Permiso SCT
ALTER TABLE "cotizaciones"
  ADD COLUMN "permisoEstimado" DECIMAL(12,2) DEFAULT 0 NOT NULL;

-- Costos porcentuales (mantenimiento e indirectos)
ALTER TABLE "cotizaciones"
  ADD COLUMN "porcentajeMantenimiento" DECIMAL(5,2) DEFAULT 25 NOT NULL,
  ADD COLUMN "montoMantenimiento" DECIMAL(12,2) DEFAULT 0 NOT NULL,
  ADD COLUMN "porcentajeIndirectos" DECIMAL(5,2) DEFAULT 20 NOT NULL,
  ADD COLUMN "montoIndirectos" DECIMAL(12,2) DEFAULT 0 NOT NULL;

-- Carro piloto
ALTER TABLE "cotizaciones"
  ADD COLUMN "requiereCarroPiloto" BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN "diasCarroPiloto" INTEGER,
  ADD COLUMN "costoBaseCarroPiloto" DECIMAL(12,2),
  ADD COLUMN "gasolinaCarroPiloto" DECIMAL(12,2),
  ADD COLUMN "casetasCarroPiloto" DECIMAL(12,2),
  ADD COLUMN "alimentacionCarroPiloto" DECIMAL(12,2),
  ADD COLUMN "imprevistosCarroPiloto" DECIMAL(12,2),
  ADD COLUMN "totalCarroPiloto" DECIMAL(12,2) DEFAULT 0 NOT NULL;

-- Viáticos detallados
ALTER TABLE "cotizaciones"
  ADD COLUMN "comidasCantidad" INTEGER,
  ADD COLUMN "comidasPrecioUnitario" DECIMAL(10,2),
  ADD COLUMN "federalCantidad" INTEGER,
  ADD COLUMN "federalPrecioUnitario" DECIMAL(10,2),
  ADD COLUMN "telefonoCantidad" INTEGER,
  ADD COLUMN "telefonoPrecioUnitario" DECIMAL(10,2),
  ADD COLUMN "imprevistosViaticos" DECIMAL(12,2);

-- Casetas detalladas
ALTER TABLE "cotizaciones"
  ADD COLUMN "casetasCargado" DECIMAL(12,2),
  ADD COLUMN "casetasVacio" DECIMAL(12,2);

-- Migrate existing casetasEstimado to casetasCargado
UPDATE "cotizaciones"
SET "casetasCargado" = "casetasEstimado" * 0.6,  -- Aproximadamente 60% es cargado
    "casetasVacio" = "casetasEstimado" * 0.4     -- 40% es vacío
WHERE "casetasEstimado" > 0;

-- Totales
ALTER TABLE "cotizaciones"
  ADD COLUMN "costoTotal" DECIMAL(12,2) DEFAULT 0 NOT NULL;

-- Migrate existing cost data to costoTotal
UPDATE "cotizaciones"
SET "costoTotal" =
  COALESCE("dieselEstimado", 0) +
  COALESCE("casetasEstimado", 0) +
  COALESCE("viaticosEstimado", 0) +
  COALESCE("salarioEstimado", 0) +
  COALESCE("otrosEstimado", 0);

-- Ensure utilidadEsperada and margenEsperado have defaults
ALTER TABLE "cotizaciones"
  ALTER COLUMN "utilidadEsperada" SET DEFAULT 0,
  ALTER COLUMN "margenEsperado" SET DEFAULT 0;

-- Drop old column
ALTER TABLE "cotizaciones" DROP COLUMN "kmEstimados";
ALTER TABLE "cotizaciones" DROP COLUMN "otrosEstimado";

COMMIT;
