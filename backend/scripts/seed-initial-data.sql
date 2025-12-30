-- Script para poblar datos iniciales
-- Ejecutar después de la migración principal

-- ==================== CATEGORÍAS DE GASTOS POR DEFECTO ====================

-- Nota: Reemplazar {EMPRESA_ID} con el ID real de la empresa

-- Categorías comunes para todas las empresas
INSERT INTO "categorias_gasto" ("empresaId", "nombre", "descripcion", "color", "activa")
SELECT
  e.id as "empresaId",
  categoria.nombre,
  categoria.descripcion,
  categoria.color,
  true as activa
FROM empresas e
CROSS JOIN (
  VALUES
    ('Combustible', 'Diesel y gasolina para unidades', '#EF4444'),
    ('Casetas', 'Peajes y casetas de autopista', '#F97316'),
    ('Viáticos', 'Alimentos y hospedaje de operadores', '#F59E0B'),
    ('Mantenimiento Preventivo', 'Servicios programados', '#10B981'),
    ('Mantenimiento Correctivo', 'Reparaciones no programadas', '#EF4444'),
    ('Llantas', 'Compra y reparación de neumáticos', '#8B5CF6'),
    ('Refacciones', 'Partes y componentes', '#6366F1'),
    ('Maniobras', 'Carga y descarga', '#EC4899'),
    ('Seguros', 'Pólizas de unidades y carga', '#14B8A6'),
    ('Permisos', 'Licencias y permisos especiales', '#06B6D4'),
    ('Multas', 'Infracciones de tránsito', '#DC2626'),
    ('Salarios', 'Pago a operadores', '#84CC16'),
    ('Pensión', 'Estacionamiento de unidades', '#A855F7'),
    ('Otros Gastos', 'Gastos varios no categorizados', '#6B7280')
) as categoria(nombre, descripcion, color)
ON CONFLICT DO NOTHING;

-- ==================== PERMISOS POR ROL ====================

-- Función auxiliar para asignar todos los permisos de un módulo a un usuario
CREATE OR REPLACE FUNCTION asignar_permisos_modulo(
  p_usuario_id INTEGER,
  p_modulo TEXT,
  p_acciones TEXT[]
) RETURNS void AS $$
DECLARE
  v_permiso_id INTEGER;
  v_accion TEXT;
BEGIN
  FOREACH v_accion IN ARRAY p_acciones
  LOOP
    SELECT id INTO v_permiso_id
    FROM permisos
    WHERE modulo = p_modulo AND accion = v_accion;

    IF v_permiso_id IS NOT NULL THEN
      INSERT INTO usuario_permisos (usuarioId, permisoId)
      VALUES (p_usuario_id, v_permiso_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de asignación de permisos para rol OPERADOR
-- (Descomentar y ajustar usuario_id según necesidad)

/*
-- OPERADOR: Puede ver y crear cotizaciones/fletes, pero no eliminar
SELECT asignar_permisos_modulo(
  {USUARIO_ID},
  'cotizaciones',
  ARRAY['crear', 'leer', 'actualizar']
);

SELECT asignar_permisos_modulo(
  {USUARIO_ID},
  'fletes',
  ARRAY['crear', 'leer', 'actualizar', 'asignar']
);

SELECT asignar_permisos_modulo(
  {USUARIO_ID},
  'gastos',
  ARRAY['crear', 'leer']
);

-- CONTABILIDAD: Todos los permisos de gastos y reportes
SELECT asignar_permisos_modulo(
  {USUARIO_ID},
  'gastos',
  ARRAY['crear', 'leer', 'actualizar', 'eliminar', 'validar']
);

SELECT asignar_permisos_modulo(
  {USUARIO_ID},
  'reportes',
  ARRAY['leer', 'exportar']
);

-- DIRECCION: Solo lectura y reportes
SELECT asignar_permisos_modulo(
  {USUARIO_ID},
  'cotizaciones',
  ARRAY['leer', 'exportar']
);

SELECT asignar_permisos_modulo(
  {USUARIO_ID},
  'fletes',
  ARRAY['leer']
);

SELECT asignar_permisos_modulo(
  {USUARIO_ID},
  'reportes',
  ARRAY['leer', 'exportar']
);
*/

-- ==================== MANTENIMIENTOS DE EJEMPLO ====================

-- Crear mantenimientos preventivos programados para todos los camiones
-- (Descomentar si se desea poblar con ejemplos)

/*
INSERT INTO mantenimientos (
  camionId,
  tipo,
  descripcion,
  kmProgramado,
  fechaProgramada,
  estado
)
SELECT
  c.id,
  'PREVENTIVO',
  'Servicio preventivo inicial - Cambio de aceite y filtros',
  c.kmActual + 5000,
  CURRENT_DATE + INTERVAL '30 days',
  'PENDIENTE'
FROM camiones c
WHERE c.activo = true
ON CONFLICT DO NOTHING;
*/

-- ==================== VISTA ÚTIL: PERMISOS POR USUARIO ====================

CREATE OR REPLACE VIEW vista_permisos_usuarios AS
SELECT
  u.id as usuario_id,
  u.nombre as usuario_nombre,
  u.email,
  u.rol,
  e.nombre as empresa,
  p.modulo,
  p.accion,
  p.descripcion
FROM usuarios u
INNER JOIN empresas e ON u."empresaId" = e.id
LEFT JOIN usuario_permisos up ON u.id = up."usuarioId"
LEFT JOIN permisos p ON up."permisoId" = p.id
ORDER BY u.id, p.modulo, p.accion;

-- Para ver permisos de un usuario específico:
-- SELECT * FROM vista_permisos_usuarios WHERE usuario_id = {ID};

-- ==================== VISTA ÚTIL: ESTADÍSTICAS DE MANTENIMIENTO ====================

CREATE OR REPLACE VIEW vista_stats_mantenimiento AS
SELECT
  c."empresaId",
  c.id as camion_id,
  c.placas,
  c."numeroEconomico",
  COUNT(m.id) as total_mantenimientos,
  COUNT(CASE WHEN m.estado = 'COMPLETADO' THEN 1 END) as completados,
  COUNT(CASE WHEN m.estado = 'PENDIENTE' THEN 1 END) as pendientes,
  SUM(CASE WHEN m.estado = 'COMPLETADO' THEN m.costo ELSE 0 END) as costo_total,
  MAX(m."fechaRealizado") as ultimo_mantenimiento,
  MIN(CASE WHEN m.estado = 'PENDIENTE' THEN m."fechaProgramada" END) as proximo_mantenimiento
FROM camiones c
LEFT JOIN mantenimientos m ON c.id = m."camionId"
GROUP BY c."empresaId", c.id, c.placas, c."numeroEconomico"
ORDER BY c.placas;

COMMIT;
