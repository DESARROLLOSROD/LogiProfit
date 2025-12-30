import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface ParsedData {
  headers: string[];
  rows: any[];
}

@Injectable()
export class ExcelParser {
  parse(buffer: Buffer): ParsedData {
    // Leer el archivo Excel desde el buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertir la hoja a JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      defval: null, // Valores nulos para celdas vacías
    });

    if (!jsonData || jsonData.length === 0) {
      return { headers: [], rows: [] };
    }

    // Extraer headers (claves del primer objeto)
    const firstRow = jsonData[0] as Record<string, any>;
    const headers = Object.keys(firstRow);

    return {
      headers,
      rows: jsonData,
    };
  }
}
