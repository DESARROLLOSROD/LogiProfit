-- Migración: RBAC, Presupuestos, Mantenimiento y Categorías de Gastos
-- Fecha: 2024-12-26

-- ==================== PERMISOS RBAC ====================

CREATE TABLE IF NOT EXISTS "permisos" (
  "id" SERIAL PRIMARY KEY,
  "modulo" TEXT NOT NULL,
  "accion" TEXT NOT NULL,
  "descripcion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "permisos_modulo_accion_key" UNIQUE("modulo", "accion")
);

CREATE TABLE IF NOT EXISTS "usuario_permisos" (
  "id" SERIAL PRIMARY KEY,
  "usuarioId" INTEGER NOT NULL,
  "permisoId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usuario_permisos_usuarioId_permisoId_key" UNIQUE("usuarioId", "permisoId"),
  CONSTRAINT "usuario_permisos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE,
  CONSTRAINT "usuario_permisos_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE CASCADE
);

-- ==================== CATEGORÍAS DE GASTOS ====================

CREATE TABLE IF NOT EXISTS "categorias_gasto" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "nombre" TEXT NOT NULL,
  "descripcion" TEXT,
  "color" TEXT,
  "activa" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Agregar columna categoriaId a gastos si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gastos' AND column_name = 'categoriaId'
  ) THEN
    ALTER TABLE "gastos" ADD COLUMN "categoriaId" INTEGER;
    ALTER TABLE "gastos" ADD CONSTRAINT "gastos_categoriaId_fkey"
      FOREIGN KEY ("categoriaId") REFERENCES "categorias_gasto"("id");
  END IF;
END $$;

-- ==================== PRESUPUESTOS ====================

CREATE TABLE IF NOT EXISTS "presupuestos" (
  "id" SERIAL PRIMARY KEY,
  "empresaId" INTEGER NOT NULL,
  "nombre" TEXT NOT NULL,
  "periodo" TEXT NOT NULL,
  "total" DECIMAL(12,2) NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "presupuesto_categorias" (
  "id" SERIAL PRIMARY KEY,
  "presupuestoId" INTEGER NOT NULL,
  "categoriaId" INTEGER NOT NULL,
  "monto" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "presupuesto_categorias_presupuestoId_categoriaId_key" UNIQUE("presupuestoId", "categoriaId"),
  CONSTRAINT "presupuesto_categorias_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "presupuestos"("id") ON DELETE CASCADE,
  CONSTRAINT "presupuesto_categorias_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_gasto"("id")
);

-- ==================== MANTENIMIENTO ====================

-- Agregar kmActual a camiones si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'camiones' AND column_name = 'kmActual'
  ) THEN
    ALTER TABLE "camiones" ADD COLUMN "kmActual" DECIMAL(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Crear ENUM TipoMantenimiento
DO $$ BEGIN
  CREATE TYPE "TipoMantenimiento" AS ENUM (
    'PREVENTIVO',
    'CORRECTIVO',
    'CAMBIO_ACEITE',
    'CAMBIO_LLANTAS',
    'FRENOS',
    'SUSPENSION',
    'ELECTRICO',
    'TRANSMISION',
    'MOTOR',
    'OTRO'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Crear ENUM EstadoMantenimiento
DO $$ BEGIN
  CREATE TYPE "EstadoMantenimiento" AS ENUM (
    'PENDIENTE',
    'EN_PROCESO',
    'COMPLETADO',
    'CANCELADO'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "mantenimientos" (
  "id" SERIAL PRIMARY KEY,
  "camionId" INTEGER NOT NULL,
  "tipo" "TipoMantenimiento" NOT NULL,
  "descripcion" TEXT NOT NULL,
  "kmProgramado" DECIMAL(10,2),
  "fechaProgramada" TIMESTAMP(3),
  "kmRealizado" DECIMAL(10,2),
  "fechaRealizado" TIMESTAMP(3),
  "costo" DECIMAL(12,2),
  "proveedor" TEXT,
  "comprobanteUrl" TEXT,
  "estado" "EstadoMantenimiento" NOT NULL DEFAULT 'PENDIENTE',
  "notas" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mantenimientos_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "camiones"("id") ON DELETE CASCADE
);

-- ==================== DATOS INICIALES ====================

-- Insertar permisos base
INSERT INTO "permisos" ("modulo", "accion", "descripcion")
VALUES
  ('cotizaciones', 'crear', 'Crear nuevas cotizaciones'),
  ('cotizaciones', 'leer', 'Ver cotizaciones'),
  ('cotizaciones', 'actualizar', 'Modificar cotizaciones'),
  ('cotizaciones', 'eliminar', 'Eliminar cotizaciones'),
  ('cotizaciones', 'exportar', 'Exportar cotizaciones a PDF/Excel'),

  ('fletes', 'crear', 'Crear nuevos fletes'),
  ('fletes', 'leer', 'Ver fletes'),
  ('fletes', 'actualizar', 'Modificar fletes'),
  ('fletes', 'eliminar', 'Eliminar fletes'),
  ('fletes', 'asignar', 'Asignar camiones y choferes'),

  ('gastos', 'crear', 'Registrar gastos'),
  ('gastos', 'leer', 'Ver gastos'),
  ('gastos', 'actualizar', 'Modificar gastos'),
  ('gastos', 'eliminar', 'Eliminar gastos'),
  ('gastos', 'validar', 'Validar gastos'),

  ('reportes', 'leer', 'Ver reportes y dashboard'),
  ('reportes', 'exportar', 'Exportar reportes'),

  ('mantenimiento', 'crear', 'Programar mantenimientos'),
  ('mantenimiento', 'leer', 'Ver mantenimientos'),
  ('mantenimiento', 'actualizar', 'Modificar mantenimientos'),
  ('mantenimiento', 'eliminar', 'Eliminar mantenimientos'),

  ('usuarios', 'crear', 'Crear usuarios'),
  ('usuarios', 'leer', 'Ver usuarios'),
  ('usuarios', 'actualizar', 'Modificar usuarios'),
  ('usuarios', 'eliminar', 'Eliminar usuarios')
ON CONFLICT ("modulo", "accion") DO NOTHING;

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS "idx_usuario_permisos_usuarioId" ON "usuario_permisos"("usuarioId");
CREATE INDEX IF NOT EXISTS "idx_usuario_permisos_permisoId" ON "usuario_permisos"("permisoId");
CREATE INDEX IF NOT EXISTS "idx_gastos_categoriaId" ON "gastos"("categoriaId");
CREATE INDEX IF NOT EXISTS "idx_mantenimientos_camionId" ON "mantenimientos"("camionId");
CREATE INDEX IF NOT EXISTS "idx_mantenimientos_estado" ON "mantenimientos"("estado");
CREATE INDEX IF NOT EXISTS "idx_mantenimientos_fechaProgramada" ON "mantenimientos"("fechaProgramada");

COMMIT;
