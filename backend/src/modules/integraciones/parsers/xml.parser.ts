import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { ParsedData } from './excel.parser';

@Injectable()
export class XmlParser {
  parse(buffer: Buffer): ParsedData {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    const xmlObj = parser.parse(buffer.toString());

    // Detectar la estructura del XML y extraer los registros
    const records = this.extractRecords(xmlObj);

    if (!records || records.length === 0) {
      return { headers: [], rows: [] };
    }

    // Extraer headers del primer registro
    const headers = this.extractHeaders(records[0]);

    return {
      headers,
      rows: records,
    };
  }

  private extractRecords(xmlObj: any): any[] {
    // Buscar un array en el objeto XML
    // Esto puede variar según la estructura del XML
    // Por ahora asumimos una estructura tipo: { root: { record: [...] } }

    if (!xmlObj) return [];

    // Buscar el primer array en el objeto
    for (const key of Object.keys(xmlObj)) {
      const value = xmlObj[key];

      if (Array.isArray(value)) {
        return value;
      }

      if (typeof value === 'object' && value !== null) {
        // Buscar recursivamente
        for (const subKey of Object.keys(value)) {
          const subValue = value[subKey];
          if (Array.isArray(subValue)) {
            return subValue;
          }
        }
      }
    }

    // Si no se encontró un array, retornar el objeto como un solo registro
    return [xmlObj];
  }

  private extractHeaders(record: any): string[] {
    if (!record || typeof record !== 'object') {
      return [];
    }

    return Object.keys(record).filter(
      (key) => !key.startsWith('@_'), // Excluir atributos
    );
  }
}
