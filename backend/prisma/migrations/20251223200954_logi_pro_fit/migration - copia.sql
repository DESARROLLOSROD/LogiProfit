-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('BASICO', 'PROFESIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'OPERADOR', 'CHOFER', 'CONTABILIDAD', 'DIRECCION');

-- CreateEnum
CREATE TYPE "EstadoCotizacion" AS ENUM ('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'CONVERTIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoFlete" AS ENUM ('PLANEADO', 'EN_CURSO', 'COMPLETADO', 'CERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoCamion" AS ENUM ('TORTON', 'TRAILER', 'RABON', 'CAMIONETA', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoChofer" AS ENUM ('FIJO', 'ROTATIVO');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('POR_DIA', 'POR_VIAJE', 'POR_KM');

-- CreateEnum
CREATE TYPE "TipoGasto" AS ENUM ('DIESEL', 'CASETAS', 'VIATICOS', 'MANTENIMIENTO', 'MULTA', 'SALARIO', 'PENSION', 'MANIOBRAS', 'OTRO');

-- CreateTable
CREATE TABLE "empresas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "rfc" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'BASICO',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "rfc" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizaciones" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "folio" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "kmEstimados" DECIMAL(10,2) NOT NULL,
    "precioCotizado" DECIMAL(12,2) NOT NULL,
    "dieselEstimado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "casetasEstimado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "viaticosEstimado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "salarioEstimado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otrosEstimado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "utilidadEsperada" DECIMAL(12,2) NOT NULL,
    "margenEsperado" DECIMAL(5,2) NOT NULL,
    "estado" "EstadoCotizacion" NOT NULL DEFAULT 'BORRADOR',
    "notas" TEXT,
    "validoHasta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fletes" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "cotizacionId" INTEGER,
    "clienteId" INTEGER NOT NULL,
    "folio" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "kmReales" DECIMAL(10,2),
    "precioCliente" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoFlete" NOT NULL DEFAULT 'PLANEADO',
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "camiones" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "placas" TEXT NOT NULL,
    "numeroEconomico" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "anio" INTEGER,
    "tipo" "TipoCamion" NOT NULL,
    "rendimientoKmL" DECIMAL(5,2) NOT NULL,
    "capacidadCarga" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "camiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "choferes" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "licencia" TEXT,
    "tipo" "TipoChofer" NOT NULL,
    "tipoPago" "TipoPago" NOT NULL,
    "tarifa" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "choferes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flete_camiones" (
    "id" SERIAL NOT NULL,
    "fleteId" INTEGER NOT NULL,
    "camionId" INTEGER NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flete_camiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flete_choferes" (
    "id" SERIAL NOT NULL,
    "fleteId" INTEGER NOT NULL,
    "choferId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "dias" INTEGER,
    "kmReales" DECIMAL(10,2),
    "salarioCalculado" DECIMAL(12,2),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flete_choferes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" SERIAL NOT NULL,
    "fleteId" INTEGER NOT NULL,
    "camionId" INTEGER,
    "tipo" "TipoGasto" NOT NULL,
    "concepto" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "comprobanteUrl" TEXT,
    "validado" BOOLEAN NOT NULL DEFAULT false,
    "validadoPor" INTEGER,
    "validadoAt" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_rfc_key" ON "empresas"("rfc");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cotizaciones_folio_key" ON "cotizaciones"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "fletes_folio_key" ON "fletes"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "camiones_empresaId_placas_key" ON "camiones"("empresaId", "placas");

-- CreateIndex
CREATE UNIQUE INDEX "flete_camiones_fleteId_camionId_key" ON "flete_camiones"("fleteId", "camionId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fletes" ADD CONSTRAINT "fletes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fletes" ADD CONSTRAINT "fletes_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "cotizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fletes" ADD CONSTRAINT "fletes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "camiones" ADD CONSTRAINT "camiones_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choferes" ADD CONSTRAINT "choferes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flete_camiones" ADD CONSTRAINT "flete_camiones_fleteId_fkey" FOREIGN KEY ("fleteId") REFERENCES "fletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flete_camiones" ADD CONSTRAINT "flete_camiones_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "camiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flete_choferes" ADD CONSTRAINT "flete_choferes_fleteId_fkey" FOREIGN KEY ("fleteId") REFERENCES "fletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flete_choferes" ADD CONSTRAINT "flete_choferes_choferId_fkey" FOREIGN KEY ("choferId") REFERENCES "choferes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_fleteId_fkey" FOREIGN KEY ("fleteId") REFERENCES "fletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "camiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
