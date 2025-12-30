-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('PUE', 'PPD');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('EFECTIVO', 'CHEQUE', 'TRANSFERENCIA', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'POR_DEFINIR');

-- CreateEnum
CREATE TYPE "EstadoPagoFactura" AS ENUM ('PENDIENTE', 'PAGADA_PARCIAL', 'PAGADA', 'VENCIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "facturas" (
    "id" SERIAL NOT NULL,
    "fleteId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "serie" TEXT,
    "uuid" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "iva" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "metodoPago" "MetodoPago" DEFAULT 'PUE',
    "formaPago" "FormaPago" DEFAULT 'TRANSFERENCIA',
    "usoCFDI" TEXT,
    "xmlUrl" TEXT,
    "pdfUrl" TEXT,
    "estadoPago" "EstadoPagoFactura" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facturas_fleteId_key" ON "facturas"("fleteId");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_uuid_key" ON "facturas"("uuid");

-- CreateIndex
CREATE INDEX "facturas_estadoPago_idx" ON "facturas"("estadoPago");

-- CreateIndex
CREATE INDEX "facturas_fechaEmision_idx" ON "facturas"("fechaEmision");

-- CreateIndex
CREATE INDEX "facturas_fechaVencimiento_idx" ON "facturas"("fechaVencimiento");

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_fleteId_fkey" FOREIGN KEY ("fleteId") REFERENCES "fletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
