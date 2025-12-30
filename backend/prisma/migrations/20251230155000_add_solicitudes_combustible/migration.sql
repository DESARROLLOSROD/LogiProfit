-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'DEPOSITADA');

-- CreateTable
CREATE TABLE "solicitudes_combustible" (
    "id" SERIAL NOT NULL,
    "fleteId" INTEGER NOT NULL,
    "operadorId" INTEGER NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
    "montoTotal" DECIMAL(12,2) NOT NULL,
    "aprobadoPor" INTEGER,
    "aprobadoAt" TIMESTAMP(3),
    "depositadoPor" INTEGER,
    "depositadoAt" TIMESTAMP(3),
    "rechazadoPor" INTEGER,
    "rechazadoAt" TIMESTAMP(3),
    "motivoRechazo" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_combustible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitud_paradas" (
    "id" SERIAL NOT NULL,
    "solicitudId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "lugar" TEXT NOT NULL,
    "litros" DECIMAL(10,2) NOT NULL,
    "precioLitro" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitud_paradas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitudes_combustible_fleteId_idx" ON "solicitudes_combustible"("fleteId");

-- CreateIndex
CREATE INDEX "solicitudes_combustible_operadorId_idx" ON "solicitudes_combustible"("operadorId");

-- CreateIndex
CREATE INDEX "solicitudes_combustible_estado_idx" ON "solicitudes_combustible"("estado");

-- CreateIndex
CREATE INDEX "solicitud_paradas_solicitudId_idx" ON "solicitud_paradas"("solicitudId");

-- AddForeignKey
ALTER TABLE "solicitudes_combustible" ADD CONSTRAINT "solicitudes_combustible_fleteId_fkey" FOREIGN KEY ("fleteId") REFERENCES "fletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_combustible" ADD CONSTRAINT "solicitudes_combustible_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_paradas" ADD CONSTRAINT "solicitud_paradas_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes_combustible"("id") ON DELETE CASCADE ON UPDATE CASCADE;
