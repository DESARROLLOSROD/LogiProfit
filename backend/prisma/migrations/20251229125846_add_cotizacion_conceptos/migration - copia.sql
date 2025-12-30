-- CreateTable
CREATE TABLE "cotizacion_conceptos" (
    "id" SERIAL NOT NULL,
    "cotizacionId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "unidad" TEXT NOT NULL,
    "precioUnit" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotizacion_conceptos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cotizacion_conceptos_cotizacionId_idx" ON "cotizacion_conceptos"("cotizacionId");

-- AddForeignKey
ALTER TABLE "cotizacion_conceptos" ADD CONSTRAINT "cotizacion_conceptos_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "cotizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
