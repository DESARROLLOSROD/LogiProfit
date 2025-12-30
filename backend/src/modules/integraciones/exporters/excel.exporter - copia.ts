import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ConfiguracionMapeo } from '@prisma/client';
import { MapperService } from '../mappers/mapper.service';

@Injectable()
export class ExcelExporter {
  constructor(private readonly mapperService: MapperService) {}

  export(fletes: any[], mapeo: ConfiguracionMapeo): Buffer {
    const mapeos = mapeo.mapeos as any;

    // Mapear fletes según configuración
    const datos = fletes.map((flete) => {
      const row: any = {};

      for (const [campoLogiProfit, columnaDestino] of Object.entries(mapeos)) {
        if (columnaDestino) {
          row[columnaDestino as string] = this.mapperService.extractFieldValue(
            flete,
            campoLogiProfit,
          );
        }
      }

      return row;
    });

    // Crear hoja de Excel
    const worksheet = XLSX.utils.json_to_sheet(datos);

    // Ajustar ancho de columnas
    const columnWidths = Object.keys(datos[0] || {}).map(() => ({ wch: 20 }));
    worksheet['!cols'] = columnWidths;

    // Crear libro
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fletes');

    // Generar buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
