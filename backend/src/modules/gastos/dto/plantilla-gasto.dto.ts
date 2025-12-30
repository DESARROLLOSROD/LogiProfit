import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { TipoGasto } from '@prisma/client';

export class CreatePlantillaGastoDto {
  @ApiProperty({ example: 'Diesel Ruta Estándar' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ enum: TipoGasto, example: TipoGasto.DIESEL })
  @IsString()
  @IsNotEmpty()
  tipo: TipoGasto;

  @ApiProperty({ example: 'Carga de diesel promedio', required: false })
  @IsString()
  @IsOptional()
  concepto?: string;

  @ApiProperty({ example: 5000, description: 'Monto estimado' })
  @IsNumber()
  montoEstimado: number;
}

export class UpdatePlantillaGastoDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiProperty({ enum: TipoGasto, required: false })
  @IsString()
  @IsOptional()
  tipo?: TipoGasto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  concepto?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  montoEstimado?: number;
}
