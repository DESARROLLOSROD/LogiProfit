import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfiguracionMapeo } from '@prisma/client';
import { CreateFleteDto } from '../../fletes/dto/create-flete.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class MapperService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mapea una fila de archivo a un DTO de Flete
   */
  async mapToFlete(
    row: any,
    mapeo: ConfiguracionMapeo,
    empresaId: number,
  ): Promise<Partial<CreateFleteDto>> {
    const mapeos = mapeo.mapeos as any;

    // Extraer y mapear campos básicos
    const dto: any = {
      origen: this.extractValue(row, mapeos.origen),
      destino: this.extractValue(row, mapeos.destino),
      precioCliente: this.parseDecimal(
        this.extractValue(row, mapeos.precioCliente),
      ),
    };

    // Mapear campos opcionales
    if (mapeos.folio) {
      dto.folio = this.extractValue(row, mapeos.folio);
    }

    if (mapeos.kmReales) {
      dto.kmReales = this.parseDecimal(this.extractValue(row, mapeos.kmReales));
    }

    if (mapeos.fechaInicio) {
      dto.fechaInicio = this.parseDate(
        this.extractValue(row, mapeos.fechaInicio),
      );
    }

    if (mapeos.fechaFin) {
      dto.fechaFin = this.parseDate(this.extractValue(row, mapeos.fechaFin));
    }

    if (mapeos.notas) {
      dto.notas = this.sanitizeString(this.extractValue(row, mapeos.notas));
    }

    // Resolver cliente (buscar o crear)
    if (mapeos.clienteNombre) {
      const clienteNombre = this.extractValue(row, mapeos.clienteNombre);
      if (clienteNombre) {
        dto.clienteId = await this.resolveClienteId(clienteNombre, empresaId);
      }
    }

    return dto;
  }

  /**
   * Extrae un valor de la fila según el nombre de la columna
   */
  private extractValue(row: any, columnName: string): any {
    if (!columnName || !row) return null;

    // Buscar de manera insensible a mayúsculas/minúsculas
    const keys = Object.keys(row);
    const matchingKey = keys.find(
      (key) => key.toLowerCase() === columnName.toLowerCase(),
    );

    return matchingKey ? row[matchingKey] : null;
  }

  /**
   * Parsea un valor decimal/numérico
   */
  private parseDecimal(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;

    const parsed = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Parsea una fecha desde diferentes formatos
   */
  private parseDate(value: any): Date | null {
    if (!value) return null;

    // Si ya es una fecha
    if (value instanceof Date) return value;

    // Intentar parsear como string
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * Sanitiza strings para evitar XSS y SQL injection
   */
  private sanitizeString(value: any): string | null {
    if (!value) return null;

    return String(value)
      .replace(/[<>]/g, '') // Evitar XSS
      .replace(/;|--|\/\*/g, '') // Evitar SQL injection
      .trim()
      .substring(0, 500); // Limitar longitud
  }

  /**
   * Resuelve el ID de un cliente por nombre, creándolo si no existe
   */
  async resolveClienteId(
    clienteNombre: string,
    empresaId: number,
  ): Promise<number> {
    if (!clienteNombre) {
      throw new Error('El nombre del cliente es obligatorio');
    }

    const nombreSanitizado = this.sanitizeString(clienteNombre);

    if (!nombreSanitizado) {
      throw new Error('El nombre del cliente no puede estar vacío');
    }

    // Buscar cliente existente
    let cliente = await this.prisma.cliente.findFirst({
      where: {
        empresaId,
        nombre: {
          contains: nombreSanitizado,
          mode: 'insensitive',
        },
      },
    });

    // Si no existe, crear uno nuevo
    if (!cliente) {
      cliente = await this.prisma.cliente.create({
        data: {
          empresaId,
          nombre: nombreSanitizado,
          activo: true,
        },
      });
    }

    return cliente.id;
  }

  /**
   * Extrae el valor de un campo de un flete para exportación
   */
  extractFieldValue(flete: any, campoLogiProfit: string): any {
    // Mapeo directo de campos
    const fieldMap: Record<string, any> = {
      folio: flete.folio,
      clienteNombre: flete.cliente?.nombre || '',
      origen: flete.origen,
      destino: flete.destino,
      precioCliente: this.formatDecimal(flete.precioCliente),
      kmReales: this.formatDecimal(flete.kmReales),
      fechaInicio: this.formatDate(flete.fechaInicio),
      fechaFin: this.formatDate(flete.fechaFin),
      estado: flete.estado,
      notas: flete.notas || '',
    };

    return fieldMap[campoLogiProfit] || '';
  }

  /**
   * Formatea un decimal para exportación
   */
  private formatDecimal(value: any): string {
    if (value === null || value === undefined) return '';

    // Convertir Decimal de Prisma a número
    const num = typeof value === 'object' && value.toNumber
      ? value.toNumber()
      : Number(value);

    return isNaN(num) ? '' : num.toFixed(2);
  }

  /**
   * Formatea una fecha para exportación
   */
  private formatDate(value: any): string {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime())
      ? ''
      : date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}
