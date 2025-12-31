-- CreateEnum
CREATE TYPE "TipoGastoViatico" AS ENUM ('ALIMENTOS', 'HOSPEDAJE', 'CASETAS', 'COMBUSTIBLE', 'OTROS');

-- CreateEnum
CREATE TYPE "EstadoSolicitudViatico" AS ENUM ('SOLICITADO', 'APROBADO', 'DEPOSITADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoComprobacionViatico" AS ENUM ('PENDIENTE_VALIDACION', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "solicitudes_viatico" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_viatico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprobaciones_viatico" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comprobaciones_viatico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitudes_viatico_fleteId_idx" ON "solicitudes_viatico"("fleteId");

-- CreateIndex
CREATE INDEX "solicitudes_viatico_operadorId_idx" ON "solicitudes_viatico"("operadorId");

-- CreateIndex
CREATE INDEX "solicitudes_viatico_estado_idx" ON "solicitudes_viatico"("estado");

-- CreateIndex
CREATE INDEX "comprobaciones_viatico_solicitudId_idx" ON "comprobaciones_viatico"("solicitudId");

-- CreateIndex
CREATE INDEX "comprobaciones_viatico_fleteId_idx" ON "comprobaciones_viatico"("fleteId");

-- CreateIndex
CREATE INDEX "comprobaciones_viatico_operadorId_idx" ON "comprobaciones_viatico"("operadorId");

-- CreateIndex
CREATE INDEX "comprobaciones_viatico_estado_idx" ON "comprobaciones_viatico"("estado");

-- AddForeignKey
ALTER TABLE "solicitudes_viatico" ADD CONSTRAINT "solicitudes_viatico_fleteId_fkey" FOREIGN KEY ("fleteId") REFERENCES "fletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_viatico" ADD CONSTRAINT "solicitudes_viatico_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobaciones_viatico" ADD CONSTRAINT "comprobaciones_viatico_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes_viatico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobaciones_viatico" ADD CONSTRAINT "comprobaciones_viatico_fleteId_fkey" FOREIGN KEY ("fleteId") REFERENCES "fletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobaciones_viatico" ADD CONSTRAINT "comprobaciones_viatico_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobaciones_viatico" ADD CONSTRAINT "comprobaciones_viatico_validadorId_fkey" FOREIGN KEY ("validadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
