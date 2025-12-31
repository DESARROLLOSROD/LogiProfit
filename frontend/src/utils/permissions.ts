/**
 * Frontend RBAC Permission Utilities
 * Mirrors backend permission system
 */

export enum Modulo {
  // Core entities
  EMPRESAS = 'empresas',
  USUARIOS = 'usuarios',
  CLIENTES = 'clientes',
  CAMIONES = 'camiones',
  CHOFERES = 'choferes',

  // Business operations
  COTIZACIONES = 'cotizaciones',
  FLETES = 'fletes',
  GASTOS = 'gastos',
  FACTURAS = 'facturas',

  // Special modules
  SOLICITUDES_COMBUSTIBLE = 'solicitudes_combustible',
  VIATICOS = 'viaticos',
  DOCUMENTOS = 'documentos',
  MANTENIMIENTO = 'mantenimiento',
  PLANTILLAS_GASTO = 'plantillas_gasto',
  INTEGRACIONES = 'integraciones',

  // Reporting
  REPORTES = 'reportes',
  DASHBOARD = 'dashboard',
}

export enum Accion {
  CREAR = 'crear',
  LEER = 'leer',
  EDITAR = 'editar',
  ACTUALIZAR = 'actualizar',
  ELIMINAR = 'eliminar',
  EXPORTAR = 'exportar',
  APROBAR = 'aprobar',
  RECHAZAR = 'rechazar',
  DEPOSITAR = 'depositar',
  CANCELAR = 'cancelar',
  VALIDAR = 'validar',
  CONFIGURAR = 'configurar',
}

export type PermissionKey = `${Modulo}:${Accion}`;

/**
 * Permission Matrix by Role
 * Must match backend permissions.config.ts
 */
export const ROLE_PERMISSIONS: Record<string, Partial<Record<PermissionKey, boolean>>> = {
  ADMIN: {
    // Full access to everything
    [`${Modulo.EMPRESAS}:${Accion.LEER}`]: true,
    [`${Modulo.EMPRESAS}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.EMPRESAS}:${Accion.CONFIGURAR}`]: true,

    [`${Modulo.USUARIOS}:${Accion.CREAR}`]: true,
    [`${Modulo.USUARIOS}:${Accion.LEER}`]: true,
    [`${Modulo.USUARIOS}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.USUARIOS}:${Accion.ELIMINAR}`]: true,

    [`${Modulo.CLIENTES}:${Accion.CREAR}`]: true,
    [`${Modulo.CLIENTES}:${Accion.LEER}`]: true,
    [`${Modulo.CLIENTES}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.CLIENTES}:${Accion.ELIMINAR}`]: true,
    [`${Modulo.CLIENTES}:${Accion.EXPORTAR}`]: true,

    [`${Modulo.CAMIONES}:${Accion.CREAR}`]: true,
    [`${Modulo.CAMIONES}:${Accion.LEER}`]: true,
    [`${Modulo.CAMIONES}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.CAMIONES}:${Accion.ELIMINAR}`]: true,

    [`${Modulo.CHOFERES}:${Accion.CREAR}`]: true,
    [`${Modulo.CHOFERES}:${Accion.LEER}`]: true,
    [`${Modulo.CHOFERES}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.CHOFERES}:${Accion.ELIMINAR}`]: true,

    [`${Modulo.COTIZACIONES}:${Accion.CREAR}`]: true,
    [`${Modulo.COTIZACIONES}:${Accion.LEER}`]: true,
    [`${Modulo.COTIZACIONES}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.COTIZACIONES}:${Accion.ELIMINAR}`]: true,
    [`${Modulo.COTIZACIONES}:${Accion.EXPORTAR}`]: true,

    [`${Modulo.FLETES}:${Accion.CREAR}`]: true,
    [`${Modulo.FLETES}:${Accion.LEER}`]: true,
    [`${Modulo.FLETES}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.FLETES}:${Accion.ELIMINAR}`]: true,
    [`${Modulo.FLETES}:${Accion.CANCELAR}`]: true,

    [`${Modulo.GASTOS}:${Accion.CREAR}`]: true,
    [`${Modulo.GASTOS}:${Accion.LEER}`]: true,
    [`${Modulo.GASTOS}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.GASTOS}:${Accion.ELIMINAR}`]: true,

    [`${Modulo.FACTURAS}:${Accion.CREAR}`]: true,
    [`${Modulo.FACTURAS}:${Accion.LEER}`]: true,
    [`${Modulo.FACTURAS}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.FACTURAS}:${Accion.ELIMINAR}`]: true,
    [`${Modulo.FACTURAS}:${Accion.EXPORTAR}`]: true,

    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.CREAR}`]: true,
    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.LEER}`]: true,
    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.APROBAR}`]: true,
    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.RECHAZAR}`]: true,
    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.DEPOSITAR}`]: true,

    [`${Modulo.VIATICOS}:${Accion.CREAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.LEER}`]: true,
    [`${Modulo.VIATICOS}:${Accion.EDITAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.ELIMINAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.APROBAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.DEPOSITAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.VALIDAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.CANCELAR}`]: true,

    [`${Modulo.DOCUMENTOS}:${Accion.CREAR}`]: true,
    [`${Modulo.DOCUMENTOS}:${Accion.LEER}`]: true,
    [`${Modulo.DOCUMENTOS}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.DOCUMENTOS}:${Accion.ELIMINAR}`]: true,

    [`${Modulo.MANTENIMIENTO}:${Accion.CREAR}`]: true,
    [`${Modulo.MANTENIMIENTO}:${Accion.LEER}`]: true,
    [`${Modulo.MANTENIMIENTO}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.MANTENIMIENTO}:${Accion.ELIMINAR}`]: true,

    [`${Modulo.PLANTILLAS_GASTO}:${Accion.CREAR}`]: true,
    [`${Modulo.PLANTILLAS_GASTO}:${Accion.LEER}`]: true,
    [`${Modulo.PLANTILLAS_GASTO}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.PLANTILLAS_GASTO}:${Accion.ELIMINAR}`]: true,

    [`${Modulo.INTEGRACIONES}:${Accion.CREAR}`]: true,
    [`${Modulo.INTEGRACIONES}:${Accion.LEER}`]: true,
    [`${Modulo.INTEGRACIONES}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.INTEGRACIONES}:${Accion.ELIMINAR}`]: true,
    [`${Modulo.INTEGRACIONES}:${Accion.CONFIGURAR}`]: true,

    [`${Modulo.REPORTES}:${Accion.LEER}`]: true,
    [`${Modulo.REPORTES}:${Accion.EXPORTAR}`]: true,

    [`${Modulo.DASHBOARD}:${Accion.LEER}`]: true,
  },

  OPERADOR: {
    // Operations management
    [`${Modulo.CLIENTES}:${Accion.LEER}`]: true,
    [`${Modulo.CLIENTES}:${Accion.CREAR}`]: true,
    [`${Modulo.CLIENTES}:${Accion.ACTUALIZAR}`]: true,

    [`${Modulo.CAMIONES}:${Accion.LEER}`]: true,
    [`${Modulo.CAMIONES}:${Accion.CREAR}`]: true,
    [`${Modulo.CAMIONES}:${Accion.ACTUALIZAR}`]: true,

    [`${Modulo.CHOFERES}:${Accion.LEER}`]: true,
    [`${Modulo.CHOFERES}:${Accion.CREAR}`]: true,
    [`${Modulo.CHOFERES}:${Accion.ACTUALIZAR}`]: true,

    [`${Modulo.COTIZACIONES}:${Accion.CREAR}`]: true,
    [`${Modulo.COTIZACIONES}:${Accion.LEER}`]: true,
    [`${Modulo.COTIZACIONES}:${Accion.ACTUALIZAR}`]: true,

    [`${Modulo.FLETES}:${Accion.CREAR}`]: true,
    [`${Modulo.FLETES}:${Accion.LEER}`]: true,
    [`${Modulo.FLETES}:${Accion.ACTUALIZAR}`]: true,

    [`${Modulo.GASTOS}:${Accion.CREAR}`]: true,
    [`${Modulo.GASTOS}:${Accion.LEER}`]: true,
    [`${Modulo.GASTOS}:${Accion.ACTUALIZAR}`]: true,

    [`${Modulo.FACTURAS}:${Accion.LEER}`]: true,

    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.CREAR}`]: true,
    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.LEER}`]: true,
    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.APROBAR}`]: true,
    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.RECHAZAR}`]: true,

    [`${Modulo.VIATICOS}:${Accion.CREAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.LEER}`]: true,
    [`${Modulo.VIATICOS}:${Accion.EDITAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.ELIMINAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.APROBAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.VALIDAR}`]: true,

    [`${Modulo.DOCUMENTOS}:${Accion.CREAR}`]: true,
    [`${Modulo.DOCUMENTOS}:${Accion.LEER}`]: true,
    [`${Modulo.DOCUMENTOS}:${Accion.ACTUALIZAR}`]: true,

    [`${Modulo.MANTENIMIENTO}:${Accion.CREAR}`]: true,
    [`${Modulo.MANTENIMIENTO}:${Accion.LEER}`]: true,
    [`${Modulo.MANTENIMIENTO}:${Accion.ACTUALIZAR}`]: true,

    [`${Modulo.PLANTILLAS_GASTO}:${Accion.LEER}`]: true,

    [`${Modulo.DASHBOARD}:${Accion.LEER}`]: true,
  },

  CHOFER: {
    // Drivers - limited access
    [`${Modulo.FLETES}:${Accion.LEER}`]: true,

    [`${Modulo.GASTOS}:${Accion.CREAR}`]: true,
    [`${Modulo.GASTOS}:${Accion.LEER}`]: true,

    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.CREAR}`]: true,
    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.LEER}`]: true,

    [`${Modulo.VIATICOS}:${Accion.CREAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.LEER}`]: true,
    [`${Modulo.VIATICOS}:${Accion.EDITAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.ELIMINAR}`]: true,

    [`${Modulo.DOCUMENTOS}:${Accion.LEER}`]: true,

    [`${Modulo.MANTENIMIENTO}:${Accion.LEER}`]: true,
  },

  CONTABILIDAD: {
    // Accounting - financial operations
    [`${Modulo.CLIENTES}:${Accion.LEER}`]: true,

    [`${Modulo.COTIZACIONES}:${Accion.LEER}`]: true,
    [`${Modulo.COTIZACIONES}:${Accion.EXPORTAR}`]: true,

    [`${Modulo.FLETES}:${Accion.LEER}`]: true,
    [`${Modulo.FLETES}:${Accion.ACTUALIZAR}`]: true,

    [`${Modulo.GASTOS}:${Accion.LEER}`]: true,
    [`${Modulo.GASTOS}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.GASTOS}:${Accion.ELIMINAR}`]: true,

    [`${Modulo.FACTURAS}:${Accion.CREAR}`]: true,
    [`${Modulo.FACTURAS}:${Accion.LEER}`]: true,
    [`${Modulo.FACTURAS}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.FACTURAS}:${Accion.EXPORTAR}`]: true,

    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.LEER}`]: true,
    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.DEPOSITAR}`]: true,

    [`${Modulo.VIATICOS}:${Accion.LEER}`]: true,
    [`${Modulo.VIATICOS}:${Accion.DEPOSITAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.VALIDAR}`]: true,

    [`${Modulo.DOCUMENTOS}:${Accion.LEER}`]: true,

    [`${Modulo.REPORTES}:${Accion.LEER}`]: true,
    [`${Modulo.REPORTES}:${Accion.EXPORTAR}`]: true,

    [`${Modulo.DASHBOARD}:${Accion.LEER}`]: true,
  },

  DIRECCION: {
    // Management - strategic view
    [`${Modulo.CLIENTES}:${Accion.LEER}`]: true,

    [`${Modulo.CAMIONES}:${Accion.LEER}`]: true,

    [`${Modulo.CHOFERES}:${Accion.LEER}`]: true,

    [`${Modulo.COTIZACIONES}:${Accion.LEER}`]: true,
    [`${Modulo.COTIZACIONES}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.COTIZACIONES}:${Accion.EXPORTAR}`]: true,

    [`${Modulo.FLETES}:${Accion.LEER}`]: true,
    [`${Modulo.FLETES}:${Accion.ACTUALIZAR}`]: true,
    [`${Modulo.FLETES}:${Accion.CANCELAR}`]: true,

    [`${Modulo.GASTOS}:${Accion.LEER}`]: true,
    [`${Modulo.GASTOS}:${Accion.APROBAR}`]: true,

    [`${Modulo.FACTURAS}:${Accion.LEER}`]: true,
    [`${Modulo.FACTURAS}:${Accion.EXPORTAR}`]: true,

    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.LEER}`]: true,
    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.APROBAR}`]: true,
    [`${Modulo.SOLICITUDES_COMBUSTIBLE}:${Accion.RECHAZAR}`]: true,

    [`${Modulo.VIATICOS}:${Accion.LEER}`]: true,
    [`${Modulo.VIATICOS}:${Accion.APROBAR}`]: true,
    [`${Modulo.VIATICOS}:${Accion.CANCELAR}`]: true,

    [`${Modulo.DOCUMENTOS}:${Accion.LEER}`]: true,

    [`${Modulo.MANTENIMIENTO}:${Accion.LEER}`]: true,

    [`${Modulo.REPORTES}:${Accion.LEER}`]: true,
    [`${Modulo.REPORTES}:${Accion.EXPORTAR}`]: true,

    [`${Modulo.DASHBOARD}:${Accion.LEER}`]: true,
  },
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string | undefined, modulo: Modulo, accion: Accion): boolean {
  if (!role) return false;
  const permissionKey: PermissionKey = `${modulo}:${accion}`;
  return ROLE_PERMISSIONS[role]?.[permissionKey] === true;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): PermissionKey[] {
  const permissions = ROLE_PERMISSIONS[role] || {};
  return Object.keys(permissions).filter(key => permissions[key as PermissionKey]) as PermissionKey[];
}

/**
 * Check if user can perform multiple actions on a module (OR logic)
 */
export function canPerformAny(role: string | undefined, modulo: Modulo, acciones: Accion[]): boolean {
  return acciones.some(accion => hasPermission(role, modulo, accion));
}

/**
 * Check if user can perform all actions on a module (AND logic)
 */
export function canPerformAll(role: string | undefined, modulo: Modulo, acciones: Accion[]): boolean {
  return acciones.every(accion => hasPermission(role, modulo, accion));
}
