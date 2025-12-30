/**
 * Utilidades de validación para formularios
 */

export const validations = {
  /**
   * Valida formato de email
   */
  email: (value: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(value)
  },

  /**
   * Valida RFC mexicano (12 o 13 caracteres)
   */
  rfc: (value: string): boolean => {
    const regex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/
    return regex.test(value.toUpperCase())
  },

  /**
   * Valida teléfono mexicano (10 dígitos)
   */
  telefono: (value: string): boolean => {
    const regex = /^\d{10}$/
    return regex.test(value.replace(/\s/g, ''))
  },

  /**
   * Valida placas mexicanas (formatos: ABC-123-D o AB-12345)
   */
  placas: (value: string): boolean => {
    const regex = /^[A-Z]{2,3}-?\d{3,5}-?[A-Z]?$/
    return regex.test(value.toUpperCase())
  },

  /**
   * Valida número positivo
   */
  positivo: (value: number): boolean => {
    return value > 0
  },

  /**
   * Valida rango numérico
   */
  rango: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max
  },
}

/**
 * Mensajes de error para validaciones
 */
export const mensajesError = {
  email: 'Ingresa un email válido (ejemplo: usuario@empresa.com)',
  rfc: 'RFC inválido. Debe tener 12 o 13 caracteres (ejemplo: ABC123456XYZ)',
  telefono: 'Teléfono debe tener 10 dígitos',
  placas: 'Placas inválidas. Formato: ABC-123-D',
  requerido: 'Este campo es obligatorio',
  positivo: 'El valor debe ser mayor a 0',
  rango: (min: number, max: number) => `El valor debe estar entre ${min} y ${max}`,
}

/**
 * Formateadores de input
 */
export const formatters = {
  /**
   * Formatea RFC a mayúsculas
   */
  rfc: (value: string): string => {
    return value.toUpperCase().substring(0, 13)
  },

  /**
   * Formatea teléfono eliminando espacios y limitando a 10 dígitos
   */
  telefono: (value: string): string => {
    return value.replace(/\D/g, '').substring(0, 10)
  },

  /**
   * Formatea placas a mayúsculas
   */
  placas: (value: string): string => {
    return value.toUpperCase()
  },

  /**
   * Formatea número con 2 decimales
   */
  decimal: (value: string): string => {
    const num = parseFloat(value)
    return isNaN(num) ? '' : num.toFixed(2)
  },
}
