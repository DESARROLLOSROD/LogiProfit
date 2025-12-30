import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConfiguracionMapeoDto } from './dto/create-configuracion-mapeo.dto';
import { UpdateConfiguracionMapeoDto } from './dto/update-configuracion-mapeo.dto';
import { ExportarFletesDto } from './dto/exportar-fletes.dto';
import { ComparacionResult, DiferenciaFlete, SincronizarDiferenciasDto } from './dto/comparar-fletes.dto';
import { TipoArchivo, TipoOperacion } from '@prisma/client';
import { ExcelParser } from './parsers/excel.parser';
import { CsvParser } from './parsers/csv.parser';
import { XmlParser } from './parsers/xml.parser';
import { ExcelExporter } from './exporters/excel.exporter';
import { CsvExporter } from './exporters/csv.exporter';
import { XmlExporter } from './exporters/xml.exporter';
import { MapperService } from './mappers/mapper.service';
import { ValidadorService, ValidationError } from './mappers/validador.service';
import { FletesService } from '../fletes/fletes.service';
import * as XLSX from 'xlsx';

export interface ResultadoImportacion {
  logId: number;
  totalRegistros: number;
  exitosos: number;
  actualizados: number;
  errores: number;
  detallesErrores: ValidationError[];
}

export interface PreviewResult {
  totalRegistros: number;
  headers: string[];
  mapeoActual: any;
  preview: Array<{
    linea: number;
    datosOriginales: any;
    datosMapeados: any;
  }>;
}

@Injectable()
export class IntegracionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelParser: ExcelParser,
    private readonly csvParser: CsvParser,
    private readonly xmlParser: XmlParser,
    private readonly excelExporter: ExcelExporter,
    private readonly csvExporter: CsvExporter,
    private readonly xmlExporter: XmlExporter,
    private readonly mapperService: MapperService,
    private readonly validadorService: ValidadorService,
    private readonly fletesService: FletesService,
  ) {}

  // ==================== CONFIGURACIONES DE MAPEO ====================

  async createConfiguracion(empresaId: number, dto: CreateConfiguracionMapeoDto) {
    return this.prisma.configuracionMapeo.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        sistema: dto.sistema,
        tipoArchivo: dto.tipoArchivo,
        activa: dto.activa !== undefined ? dto.activa : true,
        mapeos: dto.mapeos as any,
      },
    });
  }

  async findAllConfiguraciones(empresaId: number) {
    return this.prisma.configuracionMapeo.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneConfiguracion(id: number, empresaId: number) {
    const config = await this.prisma.configuracionMapeo.findFirst({
      where: { id, empresaId },
    });

    if (!config) {
      throw new NotFoundException(`Configuración con ID ${id} no encontrada`);
    }

    return config;
  }

  async updateConfiguracion(
    id: number,
    empresaId: number,
    dto: UpdateConfiguracionMapeoDto,
  ) {
    await this.findOneConfiguracion(id, empresaId);

    return this.prisma.configuracionMapeo.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        sistema: dto.sistema,
        tipoArchivo: dto.tipoArchivo,
        activa: dto.activa,
        mapeos: dto.mapeos as any,
      },
    });
  }

  async deleteConfiguracion(id: number, empresaId: number) {
    await this.findOneConfiguracion(id, empresaId);

    return this.prisma.configuracionMapeo.delete({
      where: { id },
    });
  }

  // ==================== IMPORTACIÓN ====================

  async preview(
    file: Express.Multer.File,
    configuracionMapeoId: number,
    empresaId: number,
  ): Promise<PreviewResult> {
    // Obtener configuración
    const config = await this.findOneConfiguracion(configuracionMapeoId, empresaId);

    // Parsear archivo
    const parser = this.getParser(config.tipoArchivo);
    const { headers, rows } = await this.parseFile(parser, file.buffer);

    // Mostrar solo primeras 10 filas
    const preview = await Promise.all(
      rows.slice(0, 10).map(async (row: any, i: number) => {
        const dto = await this.mapperService.mapToFlete(row, config, empresaId);
        return {
          linea: i + 2, // +2 porque línea 1 es header
          datosOriginales: row,
          datosMapeados: dto,
        };
      }),
    );

    return {
      totalRegistros: rows.length,
      headers,
      mapeoActual: config.mapeos,
      preview,
    };
  }

  async importar(
    file: Express.Multer.File,
    configuracionMapeoId: number,
    empresaId: number,
    usuarioId: number,
  ): Promise<ResultadoImportacion> {
    // Obtener configuración
    const config = await this.findOneConfiguracion(configuracionMapeoId, empresaId);

    // Parsear archivo
    const parser = this.getParser(config.tipoArchivo);
    const { rows } = await this.parseFile(parser, file.buffer);

    const errores: ValidationError[] = [];
    let exitosos = 0;
    let actualizados = 0;

    // Procesar cada fila
    for (let i = 0; i < rows.length; i++) {
      const linea = i + 2; // +2 porque línea 1 es header

      try {
        // Mapear fila a DTO
        const dto = await this.mapperService.mapToFlete(rows[i], config, empresaId);

        // Validar DTO
        const validacion = await this.validadorService.validarFlete(dto, linea, empresaId);

        if (!validacion.valido) {
          errores.push(...validacion.errores);
          continue;
        }

        // Verificar si existe un flete con ese folio
        const folioExiste = dto.folio
          ? await this.prisma.flete.findFirst({
              where: { empresaId, folio: dto.folio },
            })
          : null;

        if (folioExiste) {
          // Actualizar flete existente
          await this.prisma.flete.update({
            where: { id: folioExiste.id },
            data: {
              origen: dto.origen,
              destino: dto.destino,
              precioCliente: dto.precioCliente,
              kmReales: dto.kmReales,
              fechaInicio: dto.fechaInicio,
              fechaFin: dto.fechaFin,
              notas: dto.notas,
              clienteId: dto.clienteId,
            },
          });
          actualizados++;
        } else {
          // Crear nuevo flete
          await this.fletesService.create(empresaId, dto as any);
          exitosos++;
        }
      } catch (error) {
        errores.push({
          linea,
          campo: 'general',
          error: error.message || 'Error desconocido',
        });
      }
    }

    // Registrar log de importación
    const log = await this.prisma.importacionLog.create({
      data: {
        empresaId,
        usuarioId,
        configuracionMapeoId,
        nombreArchivo: file.originalname,
        tipoOperacion: TipoOperacion.IMPORTACION,
        formato: config.tipoArchivo,
        totalRegistros: rows.length,
        registrosExitosos: exitosos,
        registrosActualizados: actualizados,
        registrosErrores: errores.length,
        detallesErrores: errores as any,
      },
    });

    return {
      logId: log.id,
      totalRegistros: rows.length,
      exitosos,
      actualizados,
      errores: errores.length,
      detallesErrores: errores,
    };
  }

  // ==================== EXPORTACIÓN ====================

  async exportar(
    dto: ExportarFletesDto,
    empresaId: number,
    usuarioId: number,
  ): Promise<Buffer> {
    // Obtener configuración
    const config = await this.findOneConfiguracion(dto.configuracionMapeoId, empresaId);

    // Obtener fletes según filtros
    const fletes = await this.fletesService.findAll(empresaId, {
      estado: dto.estado,
      clienteId: dto.clienteId,
      fechaDesde: dto.fechaDesde,
      fechaHasta: dto.fechaHasta,
    });

    // Filtrar por IDs si se especificaron
    const fleteIds = dto.fleteIds;
    const fletesAExportar = fleteIds
      ? fletes.filter((f) => fleteIds.includes(f.id))
      : fletes;

    // Obtener exporter según formato
    const exporter = this.getExporter(dto.formato);
    const buffer = exporter.export(fletesAExportar, config);

    // Registrar log de exportación
    await this.prisma.importacionLog.create({
      data: {
        empresaId,
        usuarioId,
        configuracionMapeoId: dto.configuracionMapeoId,
        nombreArchivo: `export_${new Date().getTime()}.${dto.formato.toLowerCase()}`,
        tipoOperacion: TipoOperacion.EXPORTACION,
        formato: dto.formato,
        totalRegistros: fletesAExportar.length,
        registrosExitosos: fletesAExportar.length,
        registrosActualizados: 0,
        registrosErrores: 0,
      },
    });

    return buffer;
  }

  // ==================== LOGS ====================

  async findAllLogs(empresaId: number) {
    return this.prisma.importacionLog.findMany({
      where: { empresaId },
      include: {
        configuracionMapeo: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneLog(id: number, empresaId: number) {
    const log = await this.prisma.importacionLog.findFirst({
      where: { id, empresaId },
      include: {
        configuracionMapeo: true,
      },
    });

    if (!log) {
      throw new NotFoundException(`Log con ID ${id} no encontrado`);
    }

    return log;
  }

  // ==================== HELPERS PRIVADOS ====================

  private getParser(tipo: TipoArchivo) {
    switch (tipo) {
      case TipoArchivo.EXCEL:
        return this.excelParser;
      case TipoArchivo.CSV:
        return this.csvParser;
      case TipoArchivo.XML:
        return this.xmlParser;
      default:
        throw new BadRequestException(`Tipo de archivo no soportado: ${tipo}`);
    }
  }

  private async parseFile(parser: any, buffer: Buffer) {
    try {
      return await parser.parse(buffer);
    } catch (error) {
      throw new BadRequestException(
        `Error al parsear archivo: ${error.message}`,
      );
    }
  }

  private getExporter(tipo: TipoArchivo) {
    switch (tipo) {
      case TipoArchivo.EXCEL:
        return this.excelExporter;
      case TipoArchivo.CSV:
        return this.csvExporter;
      case TipoArchivo.XML:
        return this.xmlExporter;
      default:
        throw new BadRequestException(`Tipo de archivo no soportado: ${tipo}`);
    }
  }

  // ==================== COMPARACIÓN Y RECONCILIACIÓN ====================

  async compararConArchivo(
    file: Express.Multer.File,
    configuracionMapeoId: number,
    empresaId: number,
  ): Promise<ComparacionResult> {
    // Obtener configuración
    const config = await this.findOneConfiguracion(configuracionMapeoId, empresaId);

    // Parsear archivo
    const parser = this.getParser(config.tipoArchivo);
    const { rows } = await this.parseFile(parser, file.buffer);

    // Mapear folios del archivo
    const foliosArchivo = new Map<string, any>();
    for (const row of rows) {
      const dto = await this.mapperService.mapToFlete(row, config, empresaId);
      if (dto.folio) {
        foliosArchivo.set(dto.folio, dto);
      }
    }

    // Obtener todos los fletes de LogiProfit
    const fletesLogiProfit = await this.prisma.flete.findMany({
      where: { empresaId },
      include: {
        cliente: true,
        gastos: true,
      },
    });

    // Mapear folios de LogiProfit
    const foliosLogiProfit = new Map<string, any>();
    for (const flete of fletesLogiProfit) {
      if (flete.folio) {
        foliosLogiProfit.set(flete.folio, flete);
      }
    }

    // Análisis de diferencias
    const diferencias: DiferenciaFlete[] = [];
    const fletesSoloEnArchivo: string[] = [];
    const fletesSoloEnLogiProfit: string[] = [];
    const gastosPorFolio: Record<string, any> = {};

    let fletesCoincidentes = 0;
    let fletesConDiferencias = 0;

    // Comparar folios del archivo vs LogiProfit
    for (const [folio, datosArchivo] of foliosArchivo.entries()) {
      const fleteLogipro = foliosLogiProfit.get(folio);

      if (!fleteLogipro) {
        // Flete existe en archivo pero no en LogiProfit
        fletesSoloEnArchivo.push(folio);
      } else {
        // Comparar campos
        const difs = this.compararCamposFlete(folio, fleteLogipro.id, datosArchivo, fleteLogipro);

        if (difs.length > 0) {
          diferencias.push(...difs);
          fletesConDiferencias++;
        } else {
          fletesCoincidentes++;
        }

        // Agregar gastos asociados
        if (fleteLogipro.gastos && fleteLogipro.gastos.length > 0) {
          const totalGastos = fleteLogipro.gastos.reduce(
            (sum: number, g: any) => sum + (Number(g.monto) || 0),
            0,
          );

          gastosPorFolio[folio] = {
            totalGastos,
            cantidadGastos: fleteLogipro.gastos.length,
            gastos: fleteLogipro.gastos.map((g: any) => ({
              id: g.id,
              tipo: g.tipoGasto,
              monto: Number(g.monto),
              descripcion: g.descripcion,
              fecha: g.fecha,
            })),
          };
        }
      }
    }

    // Folios que solo están en LogiProfit
    for (const [folio] of foliosLogiProfit.entries()) {
      if (!foliosArchivo.has(folio)) {
        fletesSoloEnLogiProfit.push(folio);
      }
    }

    return {
      totalFletesArchivo: foliosArchivo.size,
      totalFletesLogiProfit: foliosLogiProfit.size,
      fletesCoincidentes,
      fletesConDiferencias,
      fletesSoloEnArchivo,
      fletesSoloEnLogiProfit,
      diferencias,
      gastosPorFolio,
    };
  }

  private compararCamposFlete(
    folio: string,
    fleteId: number,
    datosArchivo: any,
    fleteLogiProfit: any,
  ): DiferenciaFlete[] {
    const diferencias: DiferenciaFlete[] = [];

    // Comparar cliente (por nombre)
    const clienteArchivo = datosArchivo.clienteId; // Aquí vendría el nombre del cliente
    const clienteLogiProfit = fleteLogiProfit.cliente?.nombre;

    // Comparar origen
    if (datosArchivo.origen && datosArchivo.origen !== fleteLogiProfit.origen) {
      diferencias.push({
        folio,
        fleteId,
        campo: 'origen',
        valorLogiProfit: fleteLogiProfit.origen,
        valorArchivo: datosArchivo.origen,
        tipoConflicto: 'diferencia',
      });
    }

    // Comparar destino
    if (datosArchivo.destino && datosArchivo.destino !== fleteLogiProfit.destino) {
      diferencias.push({
        folio,
        fleteId,
        campo: 'destino',
        valorLogiProfit: fleteLogiProfit.destino,
        valorArchivo: datosArchivo.destino,
        tipoConflicto: 'diferencia',
      });
    }

    // Comparar precio (con tolerancia de 0.01)
    const precioArchivo = Number(datosArchivo.precioCliente) || 0;
    const precioLogiProfit = Number(fleteLogiProfit.precioCliente) || 0;
    if (Math.abs(precioArchivo - precioLogiProfit) > 0.01) {
      diferencias.push({
        folio,
        fleteId,
        campo: 'precioCliente',
        valorLogiProfit: precioLogiProfit,
        valorArchivo: precioArchivo,
        tipoConflicto: 'diferencia',
      });
    }

    // Comparar kmReales
    const kmArchivo = Number(datosArchivo.kmReales) || 0;
    const kmLogiProfit = Number(fleteLogiProfit.kmReales) || 0;
    if (kmArchivo > 0 && Math.abs(kmArchivo - kmLogiProfit) > 0.1) {
      diferencias.push({
        folio,
        fleteId,
        campo: 'kmReales',
        valorLogiProfit: kmLogiProfit,
        valorArchivo: kmArchivo,
        tipoConflicto: 'diferencia',
      });
    }

    return diferencias;
  }

  // ==================== SINCRONIZACIÓN DE DIFERENCIAS ====================

  async sincronizarDiferencias(
    file: Express.Multer.File,
    dto: SincronizarDiferenciasDto,
    empresaId: number,
    usuarioId: number,
  ): Promise<{ actualizados: number; errores: string[] }> {
    // Obtener configuración
    const config = await this.findOneConfiguracion(dto.configuracionMapeoId, empresaId);

    // Parsear archivo
    const parser = this.getParser(config.tipoArchivo);
    const { rows } = await this.parseFile(parser, file.buffer);

    // Mapear folios del archivo
    const foliosArchivo = new Map<string, any>();
    for (const row of rows) {
      const dtoMapeado = await this.mapperService.mapToFlete(row, config, empresaId);
      if (dtoMapeado.folio && dto.folios.includes(dtoMapeado.folio)) {
        foliosArchivo.set(dtoMapeado.folio, dtoMapeado);
      }
    }

    let actualizados = 0;
    const errores: string[] = [];

    // Actualizar solo los folios seleccionados
    for (const folio of dto.folios) {
      const datosArchivo = foliosArchivo.get(folio);

      if (!datosArchivo) {
        errores.push(`Folio ${folio} no encontrado en archivo`);
        continue;
      }

      try {
        // Buscar flete en LogiProfit
        const fleteExistente = await this.prisma.flete.findFirst({
          where: { empresaId, folio },
        });

        if (!fleteExistente) {
          errores.push(`Folio ${folio} no existe en LogiProfit`);
          continue;
        }

        // Actualizar con datos del archivo
        await this.prisma.flete.update({
          where: { id: fleteExistente.id },
          data: {
            origen: datosArchivo.origen || fleteExistente.origen,
            destino: datosArchivo.destino || fleteExistente.destino,
            precioCliente: datosArchivo.precioCliente || fleteExistente.precioCliente,
            kmReales: datosArchivo.kmReales || fleteExistente.kmReales,
            fechaInicio: datosArchivo.fechaInicio || fleteExistente.fechaInicio,
            fechaFin: datosArchivo.fechaFin || fleteExistente.fechaFin,
            notas: datosArchivo.notas || fleteExistente.notas,
            clienteId: datosArchivo.clienteId || fleteExistente.clienteId,
          },
        });

        actualizados++;
      } catch (error) {
        errores.push(`Error al actualizar ${folio}: ${error.message}`);
      }
    }

    // Registrar log
    await this.prisma.importacionLog.create({
      data: {
        empresaId,
        usuarioId,
        configuracionMapeoId: dto.configuracionMapeoId,
        nombreArchivo: file.originalname,
        tipoOperacion: TipoOperacion.IMPORTACION,
        formato: config.tipoArchivo,
        totalRegistros: dto.folios.length,
        registrosExitosos: 0,
        registrosActualizados: actualizados,
        registrosErrores: errores.length,
        detallesErrores: errores.length > 0 ? errores.map(e => ({ error: e })) as any : undefined,
      },
    });

    return { actualizados, errores };
  }

  // ==================== EXPORTAR COMPARACIÓN A EXCEL ====================

  async exportarComparacion(comparacion: ComparacionResult): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Resumen
    const resumenData = [
      ['RESUMEN DE COMPARACIÓN'],
      [],
      ['Total Folios en Archivo', comparacion.totalFletesArchivo],
      ['Total Folios en LogiProfit', comparacion.totalFletesLogiProfit],
      ['Folios Coincidentes', comparacion.fletesCoincidentes],
      ['Folios con Diferencias', comparacion.fletesConDiferencias],
      ['Folios Solo en Archivo', comparacion.fletesSoloEnArchivo.length],
      ['Folios Solo en LogiProfit', comparacion.fletesSoloEnLogiProfit.length],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

    // Hoja 2: Diferencias Detectadas
    if (comparacion.diferencias.length > 0) {
      const diferenciasData: any[][] = [
        ['Folio', 'Campo', 'Valor Aspel/Microsip', 'Valor LogiProfit', 'Gastos Totales', 'Cantidad Gastos'],
      ];

      for (const diff of comparacion.diferencias) {
        const gastos = comparacion.gastosPorFolio[diff.folio];
        diferenciasData.push([
          diff.folio,
          diff.campo,
          diff.valorArchivo,
          diff.valorLogiProfit,
          gastos ? gastos.totalGastos : 0,
          gastos ? gastos.cantidadGastos : 0,
        ]);
      }

      const wsDiferencias = XLSX.utils.aoa_to_sheet(diferenciasData);
      XLSX.utils.book_append_sheet(workbook, wsDiferencias, 'Diferencias');
    }

    // Hoja 3: Folios Solo en Archivo
    if (comparacion.fletesSoloEnArchivo.length > 0) {
      const soloArchivoData: any[][] = [['Folio']];
      for (const folio of comparacion.fletesSoloEnArchivo) {
        soloArchivoData.push([folio]);
      }
      const wsSoloArchivo = XLSX.utils.aoa_to_sheet(soloArchivoData);
      XLSX.utils.book_append_sheet(workbook, wsSoloArchivo, 'Solo en Archivo');
    }

    // Hoja 4: Folios Solo en LogiProfit
    if (comparacion.fletesSoloEnLogiProfit.length > 0) {
      const soloLogiProfitData: any[][] = [['Folio']];
      for (const folio of comparacion.fletesSoloEnLogiProfit) {
        soloLogiProfitData.push([folio]);
      }
      const wsSoloLogiProfit = XLSX.utils.aoa_to_sheet(soloLogiProfitData);
      XLSX.utils.book_append_sheet(workbook, wsSoloLogiProfit, 'Solo en LogiProfit');
    }

    // Hoja 5: Detalle de Gastos por Folio
    const gastosData: any[][] = [
      ['Folio', 'Total Gastos', 'Cantidad Gastos', 'Tipo Gasto', 'Monto', 'Descripción'],
    ];

    for (const [folio, gastosInfo] of Object.entries(comparacion.gastosPorFolio)) {
      if (gastosInfo.gastos.length > 0) {
        for (let i = 0; i < gastosInfo.gastos.length; i++) {
          const gasto = gastosInfo.gastos[i];
          gastosData.push([
            i === 0 ? folio : '', // Solo mostrar folio en primera fila
            i === 0 ? gastosInfo.totalGastos : '',
            i === 0 ? gastosInfo.cantidadGastos : '',
            gasto.tipo,
            gasto.monto,
            gasto.descripcion || '',
          ]);
        }
      }
    }

    const wsGastos = XLSX.utils.aoa_to_sheet(gastosData);
    XLSX.utils.book_append_sheet(workbook, wsGastos, 'Gastos Detallados');

    // Generar buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
