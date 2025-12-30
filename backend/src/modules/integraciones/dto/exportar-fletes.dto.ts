import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoArchivo, EstadoFlete } from '@prisma/client';

export class ExportarFletesDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  configuracionMapeoId: number;

  @ApiProperty({ enum: TipoArchivo, example: 'EXCEL' })
  @IsEnum(TipoArchivo)
  formato: TipoArchivo;

  @ApiProperty({ required: false, type: [Number], example: [1, 2, 3] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  fleteIds?: number[];

  @ApiProperty({ required: false, enum: EstadoFlete, example: 'CERRADO' })
  @IsEnum(EstadoFlete)
  @IsOptional()
  estado?: EstadoFlete;

  @ApiProperty({ required: false, example: 1 })
  @IsNumber()
  @IsOptional()
  clienteId?: number;

  @ApiProperty({ required: false, example: '2025-01-01' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaDesde?: Date;

  @ApiProperty({ required: false, example: '2025-01-31' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaHasta?: Date;
}
