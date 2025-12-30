import { Injectable } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { ConfiguracionMapeo } from '@prisma/client';
import { MapperService } from '../mappers/mapper.service';

@Injectable()
export class CsvExporter {
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

    // Generar CSV con headers
    const csv = stringify(datos, {
      header: true,
      columns: Object.values(mapeos).filter(Boolean) as string[],
    });

    return Buffer.from(csv);
  }
}
