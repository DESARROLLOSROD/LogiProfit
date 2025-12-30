import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDate, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TipoGasto } from '@prisma/client';

export class CreateGastoDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  fleteId: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  camionId?: number;

  @ApiProperty({ enum: TipoGasto, example: 'DIESEL' })
  @IsEnum(TipoGasto)
  tipo: TipoGasto;

  @ApiProperty({ example: 'Carga de diesel en Gasolinera XYZ', required: false })
  @IsString()
  @IsOptional()
  concepto?: string;

  @ApiProperty({ example: 2500.50 })
  @IsNumber()
  monto: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  fecha: Date;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  comprobanteUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class UpdateGastoDto {
  @ApiProperty({ required: false })
  @IsEnum(TipoGasto)
  @IsOptional()
  tipo?: TipoGasto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  concepto?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  monto?: number;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fecha?: Date;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  comprobanteUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notas?: string;
}
