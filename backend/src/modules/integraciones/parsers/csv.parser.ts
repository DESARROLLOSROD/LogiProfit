import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { ParsedData } from './excel.parser';

@Injectable()
export class CsvParser {
  async parse(buffer: Buffer): Promise<ParsedData> {
    const rows: any[] = [];
    const stream = Readable.from(buffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (row) => rows.push(row))
        .on('end', () => {
          if (rows.length === 0) {
            resolve({ headers: [], rows: [] });
            return;
          }

          const headers = Object.keys(rows[0]);
          resolve({ headers, rows });
        })
        .on('error', (error) => reject(error));
    });
  }
}
