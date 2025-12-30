import { Injectable } from '@nestjs/common';
import { XMLBuilder } from 'fast-xml-parser';
import { ConfiguracionMapeo } from '@prisma/client';
import { MapperService } from '../mappers/mapper.service';

@Injectable()
export class XmlExporter {
  constructor(private readonly mapperService: MapperService) {}

  export(fletes: any[], mapeo: ConfiguracionMapeo): Buffer {
    const mapeos = mapeo.mapeos as any;

    // Mapear fletes según configuración
    const registros = fletes.map((flete) => {
      const registro: any = {};

      for (const [campoLogiProfit, tagXml] of Object.entries(mapeos)) {
        if (tagXml) {
          registro[tagXml as string] = this.mapperService.extractFieldValue(
            flete,
            campoLogiProfit,
          );
        }
      }

      return registro;
    });

    // Construir XML
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
    });

    const xmlObj = {
      Fletes: {
        Flete: registros,
      },
    };

    const xml = builder.build(xmlObj);

    return Buffer.from(xml);
  }
}
