-- Migration: Add viaticos-gastos relation
-- Date: 2026-01-02
-- Description: Adds comprobanteDepositoUrl to solicitudes_viatico and solicitudViaticoId to gastos

-- Add comprobanteDepositoUrl column to solicitudes_viatico
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'solicitudes_viatico'
    AND column_name = 'comprobanteDepositoUrl'
  ) THEN
    ALTER TABLE "solicitudes_viatico"
    ADD COLUMN "comprobanteDepositoUrl" TEXT;

    RAISE NOTICE 'Column comprobanteDepositoUrl added to solicitudes_viatico';
  ELSE
    RAISE NOTICE 'Column comprobanteDepositoUrl already exists in solicitudes_viatico';
  END IF;
END $$;

-- Add solicitudViaticoId column to gastos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gastos'
    AND column_name = 'solicitudViaticoId'
  ) THEN
    ALTER TABLE "gastos"
    ADD COLUMN "solicitudViaticoId" INTEGER;

    RAISE NOTICE 'Column solicitudViaticoId added to gastos';
  ELSE
    RAISE NOTICE 'Column solicitudViaticoId already exists in gastos';
  END IF;
END $$;

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'gastos_solicitudViaticoId_fkey'
  ) THEN
    ALTER TABLE "gastos"
    ADD CONSTRAINT "gastos_solicitudViaticoId_fkey"
    FOREIGN KEY ("solicitudViaticoId")
    REFERENCES "solicitudes_viatico"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

    RAISE NOTICE 'Foreign key constraint added';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- Create index on solicitudViaticoId if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'gastos_solicitudViaticoId_idx'
  ) THEN
    CREATE INDEX "gastos_solicitudViaticoId_idx"
    ON "gastos"("solicitudViaticoId");

    RAISE NOTICE 'Index on solicitudViaticoId created';
  ELSE
    RAISE NOTICE 'Index on solicitudViaticoId already exists';
  END IF;
END $$;

-- Migration completed successfully
SELECT 'Migration completed: add_viaticos_gastos_relation' AS status;
