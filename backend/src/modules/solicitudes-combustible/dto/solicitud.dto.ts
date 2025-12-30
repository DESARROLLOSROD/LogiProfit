import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ParadaDto {
  @ApiProperty({ description: 'Lugar de la parada (gasolinera, ciudad)' })
  @IsString()
  lugar: string;

  @ApiProperty({ description: 'Litros de combustible' })
  @IsNumber()
  @Type(() => Number)
  litros: number;

  @ApiProperty({ description: 'Precio por litro' })
  @IsNumber()
  @Type(() => Number)
  precioLitro: number;

  @ApiPropertyOptional({ description: 'Notas de la parada' })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class CreateSolicitudDto {
  @ApiProperty({ description: 'ID del flete' })
  @IsInt()
  @Type(() => Number)
  fleteId: number;

  @ApiProperty({ description: 'Paradas de combustible', type: [ParadaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParadaDto)
  paradas: ParadaDto[];

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class AprobarSolicitudDto {
  @ApiPropertyOptional({ description: 'Notas de aprobación' })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class RechazarSolicitudDto {
  @ApiProperty({ description: 'Motivo del rechazo' })
  @IsString()
  motivoRechazo: string;
}

export class DepositarSolicitudDto {
  @ApiPropertyOptional({ description: 'Notas de depósito' })
  @IsString()
  @IsOptional()
  notas?: string;
}
