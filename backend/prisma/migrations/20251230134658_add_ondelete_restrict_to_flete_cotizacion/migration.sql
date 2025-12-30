-- DropForeignKey
ALTER TABLE "fletes" DROP CONSTRAINT IF EXISTS "fletes_cotizacionId_fkey";

-- AddForeignKey
ALTER TABLE "fletes" ADD CONSTRAINT "fletes_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "cotizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
