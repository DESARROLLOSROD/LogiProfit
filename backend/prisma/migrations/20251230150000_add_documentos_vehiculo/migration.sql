-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('POLIZA', 'TARJETA_CIRCULACION', 'VERIFICACION', 'LICENCIA', 'TARJETA_IAVE', 'PERMISO_SCT', 'SEGURO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('VIGENTE', 'POR_VENCER', 'VENCIDO');

-- CreateTable
CREATE TABLE "documentos_vehiculo" (
    "id" SERIAL NOT NULL,
    "camionId" INTEGER NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "numero" TEXT,
    "archivoUrl" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'VIGENTE',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documentos_vehiculo_camionId_idx" ON "documentos_vehiculo"("camionId");

-- CreateIndex
CREATE INDEX "documentos_vehiculo_estado_idx" ON "documentos_vehiculo"("estado");

-- CreateIndex
CREATE INDEX "documentos_vehiculo_fechaVencimiento_idx" ON "documentos_vehiculo"("fechaVencimiento");

-- AddForeignKey
ALTER TABLE "documentos_vehiculo" ADD CONSTRAINT "documentos_vehiculo_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "camiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
