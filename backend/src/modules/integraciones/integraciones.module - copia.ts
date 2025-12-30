import { Module } from '@nestjs/common';
import { IntegracionesService } from './integraciones.service';
import { IntegracionesController } from './integraciones.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExcelParser } from './parsers/excel.parser';
import { CsvParser } from './parsers/csv.parser';
import { XmlParser } from './parsers/xml.parser';
import { ExcelExporter } from './exporters/excel.exporter';
import { CsvExporter } from './exporters/csv.exporter';
import { XmlExporter } from './exporters/xml.exporter';
import { MapperService } from './mappers/mapper.service';
import { ValidadorService } from './mappers/validador.service';
import { FletesModule } from '../fletes/fletes.module';

@Module({
  imports: [PrismaModule, FletesModule],
  controllers: [IntegracionesController],
  providers: [
    IntegracionesService,
    // Parsers
    ExcelParser,
    CsvParser,
    XmlParser,
    // Exporters
    ExcelExporter,
    CsvExporter,
    XmlExporter,
    // Mappers
    MapperService,
    ValidadorService,
  ],
  exports: [IntegracionesService],
})
export class IntegracionesModule {}
