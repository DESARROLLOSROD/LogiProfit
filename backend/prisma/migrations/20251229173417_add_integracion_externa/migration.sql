-- CreateEnum
CREATE TYPE "SistemaExterno" AS ENUM ('ASPEL', 'MICROSIP', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoArchivo" AS ENUM ('EXCEL', 'CSV', 'XML');

-- CreateEnum
CREATE TYPE "TipoOperacion" AS ENUM ('IMPORTACION', 'EXPORTACION');

-- CreateTable
CREATE TABLE "configuraciones_mapeo" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "sistema" "SistemaExterno" NOT NULL,
    "tipoArchivo" "TipoArchivo" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "mapeos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuraciones_mapeo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importaciones_log" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "configuracionMapeoId" INTEGER,
    "nombreArchivo" TEXT NOT NULL,
    "tipoOperacion" "TipoOperacion" NOT NULL,
    "formato" "TipoArchivo" NOT NULL,
    "totalRegistros" INTEGER NOT NULL,
    "registrosExitosos" INTEGER NOT NULL,
    "registrosActualizados" INTEGER NOT NULL,
    "registrosErrores" INTEGER NOT NULL,
    "detallesErrores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "importaciones_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "configuraciones_mapeo_empresaId_idx" ON "configuraciones_mapeo"("empresaId");

-- CreateIndex
CREATE INDEX "importaciones_log_empresaId_idx" ON "importaciones_log"("empresaId");

-- CreateIndex
CREATE INDEX "importaciones_log_createdAt_idx" ON "importaciones_log"("createdAt");

-- AddForeignKey
ALTER TABLE "configuraciones_mapeo" ADD CONSTRAINT "configuraciones_mapeo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importaciones_log" ADD CONSTRAINT "importaciones_log_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importaciones_log" ADD CONSTRAINT "importaciones_log_configuracionMapeoId_fkey" FOREIGN KEY ("configuracionMapeoId") REFERENCES "configuraciones_mapeo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
