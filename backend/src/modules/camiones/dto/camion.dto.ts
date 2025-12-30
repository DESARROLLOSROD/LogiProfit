import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoCamion } from '@prisma/client';

export class CreateCamionDto {
  @ApiProperty({ example: 'ABC-123-XY' })
  @IsString()
  @IsNotEmpty()
  placas: string;

  @ApiProperty({ example: 'T-23', required: false })
  @IsString()
  @IsOptional()
  numeroEconomico?: string;

  @ApiProperty({ example: 'Kenworth', required: false })
  @IsString()
  @IsOptional()
  marca?: string;

  @ApiProperty({ example: 'T680', required: false })
  @IsString()
  @IsOptional()
  modelo?: string;

  @ApiProperty({ example: 2022, required: false })
  @IsNumber()
  @IsOptional()
  anio?: number;

  @ApiProperty({ enum: TipoCamion, example: 'TRAILER' })
  @IsEnum(TipoCamion)
  tipo: TipoCamion;

  @ApiProperty({ example: 3.5, description: 'Rendimiento en km/litro' })
  @IsNumber()
  rendimientoKmL: number;

  @ApiProperty({ example: 30, description: 'Capacidad de carga en toneladas', required: false })
  @IsNumber()
  @IsOptional()
  capacidadCarga?: number;
}

export class UpdateCamionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  placas?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  numeroEconomico?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  marca?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  modelo?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  anio?: number;

  @ApiProperty({ required: false })
  @IsEnum(TipoCamion)
  @IsOptional()
  tipo?: TipoCamion;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  rendimientoKmL?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  capacidadCarga?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
