import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoChofer, TipoPago } from '@prisma/client';

export class CreateChoferDto {
  @ApiProperty({ example: 'Juan Pérez García' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: '5512345678', required: false })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ example: 'LIC-123456', required: false })
  @IsString()
  @IsOptional()
  licencia?: string;

  @ApiProperty({ enum: TipoChofer, example: 'FIJO' })
  @IsEnum(TipoChofer)
  tipo: TipoChofer;

  @ApiProperty({ enum: TipoPago, example: 'POR_DIA' })
  @IsEnum(TipoPago)
  tipoPago: TipoPago;

  @ApiProperty({ example: 600, description: 'Tarifa según tipo de pago' })
  @IsNumber()
  tarifa: number;
}

export class UpdateChoferDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  licencia?: string;

  @ApiProperty({ required: false })
  @IsEnum(TipoChofer)
  @IsOptional()
  tipo?: TipoChofer;

  @ApiProperty({ required: false })
  @IsEnum(TipoPago)
  @IsOptional()
  tipoPago?: TipoPago;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  tarifa?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
