import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFleteDto } from '../../fletes/dto/create-flete.dto';

export interface ValidationError {
  linea: number;
  campo: string;
  error: string;
}

export interface ValidationResult {
  valido: boolean;
  errores: ValidationError[];
}

@Injectable()
export class ValidadorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida un DTO de Flete antes de importarlo
   */
  async validarFlete(
    dto: Partial<CreateFleteDto>,
    linea: number,
    empresaId: number,
  ): Promise<ValidationResult> {
    const errores: ValidationError[] = [];

    // Validar campos obligatorios
    if (!dto.origen || dto.origen.trim() === '') {
      errores.push({
        linea,
        campo: 'origen',
        error: 'El origen es obligatorio',
      });
    }

    if (!dto.destino || dto.destino.trim() === '') {
      errores.push({
        linea,
        campo: 'destino',
        error: 'El destino es obligatorio',
      });
    }

    if (!dto.precioCliente || dto.precioCliente <= 0) {
      errores.push({
        linea,
        campo: 'precioCliente',
        error: 'El precio del cliente debe ser mayor a 0',
      });
    }

    if (!dto.clienteId) {
      errores.push({
        linea,
        campo: 'clienteId',
        error: 'El cliente es obligatorio',
      });
    }

    // Validar que el cliente existe
    if (dto.clienteId) {
      const cliente = await this.prisma.cliente.findFirst({
        where: {
          id: dto.clienteId,
          empresaId,
        },
      });

      if (!cliente) {
        errores.push({
          linea,
          campo: 'clienteId',
          error: `Cliente con ID ${dto.clienteId} no encontrado`,
        });
      }
    }

    // Validar cotización si se proporciona
    if (dto.cotizacionId) {
      const cotizacion = await this.prisma.cotizacion.findFirst({
        where: {
          id: dto.cotizacionId,
          empresaId,
        },
      });

      if (!cotizacion) {
        errores.push({
          linea,
          campo: 'cotizacionId',
          error: `Cotización con ID ${dto.cotizacionId} no encontrada`,
        });
      }
    }

    // Validar formato de fechas
    if (dto.fechaInicio && !(dto.fechaInicio instanceof Date)) {
      errores.push({
        linea,
        campo: 'fechaInicio',
        error: 'Formato de fecha de inicio inválido',
      });
    }

    if (dto.fechaFin && !(dto.fechaFin instanceof Date)) {
      errores.push({
        linea,
        campo: 'fechaFin',
        error: 'Formato de fecha de fin inválido',
      });
    }

    // Validar que fechaFin sea posterior a fechaInicio
    if (
      dto.fechaInicio &&
      dto.fechaFin &&
      dto.fechaInicio instanceof Date &&
      dto.fechaFin instanceof Date
    ) {
      if (dto.fechaFin < dto.fechaInicio) {
        errores.push({
          linea,
          campo: 'fechaFin',
          error: 'La fecha de fin debe ser posterior a la fecha de inicio',
        });
      }
    }

    // Validar rangos numéricos
    if (dto.kmReales !== null && dto.kmReales !== undefined && dto.kmReales < 0) {
      errores.push({
        linea,
        campo: 'kmReales',
        error: 'Los kilómetros no pueden ser negativos',
      });
    }

    return {
      valido: errores.length === 0,
      errores,
    };
  }

  /**
   * Valida múltiples fletes en batch
   */
  async validarFletes(
    fletes: Array<{ dto: Partial<CreateFleteDto>; linea: number }>,
    empresaId: number,
  ): Promise<ValidationError[]> {
    const todosLosErrores: ValidationError[] = [];

    for (const { dto, linea } of fletes) {
      const resultado = await this.validarFlete(dto, linea, empresaId);
      if (!resultado.valido) {
        todosLosErrores.push(...resultado.errores);
      }
    }

    return todosLosErrores;
  }
}
