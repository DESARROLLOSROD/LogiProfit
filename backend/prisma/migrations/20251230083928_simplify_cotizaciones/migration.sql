-- Simplificar modelo de Cotizaciones
-- Eliminar campos de cálculos internos que no se muestran al cliente

-- Agregar nueva columna kmEstimado
ALTER TABLE "cotizaciones" ADD COLUMN IF NOT EXISTS "kmEstimado" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Migrar datos existentes (sumar kmCargado + kmVacio si existen)
UPDATE "cotizaciones" SET "kmEstimado" = COALESCE("kmCargado", 0) + COALESCE("kmVacio", 0)
WHERE "kmEstimado" = 0;

-- Eliminar columnas de cálculos detallados
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "kmCargado";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "kmVacio";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "kmTotal";

-- Eliminar costos operativos directos
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "dieselEstimado";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "casetasEstimado";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "viaticosEstimado";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "salarioEstimado";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "permisoEstimado";

-- Eliminar costos porcentuales
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "porcentajeMantenimiento";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "montoMantenimiento";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "porcentajeIndirectos";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "montoIndirectos";

-- Eliminar carro piloto
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "requiereCarroPiloto";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "diasCarroPiloto";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "costoBaseCarroPiloto";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "gasolinaCarroPiloto";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "casetasCarroPiloto";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "alimentacionCarroPiloto";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "imprevistosCarroPiloto";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "totalCarroPiloto";

-- Eliminar viáticos detallados
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "comidasCantidad";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "comidasPrecioUnitario";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "federalCantidad";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "federalPrecioUnitario";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "telefonoCantidad";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "telefonoPrecioUnitario";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "imprevistosViaticos";

-- Eliminar casetas detalladas
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "casetasCargado";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "casetasVacio";

-- Eliminar totales y márgenes internos
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "costoTotal";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "utilidadEsperada";
ALTER TABLE "cotizaciones" DROP COLUMN IF EXISTS "margenEsperado";
