-- AlterEnum
-- Agregar nuevos tipos de pago: POR_QUINCENA y MENSUAL
ALTER TYPE "TipoPago" ADD VALUE 'POR_QUINCENA';
ALTER TYPE "TipoPago" ADD VALUE 'MENSUAL';
