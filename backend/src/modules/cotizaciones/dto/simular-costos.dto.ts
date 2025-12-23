import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SimularCostosDto {
  @ApiProperty({ example: 850, description: 'Kilómetros estimados del viaje' })
  @IsNumber()
  kmEstimados: number;

  @ApiProperty({ example: 45000, description: 'Precio cotizado al cliente' })
  @IsNumber()
  precioCotizado: number;

  @ApiProperty({ required: false, description: 'ID del camión para usar su rendimiento' })
  @IsNumber()
  @IsOptional()
  camionId?: number;

  @ApiProperty({ required: false, description: 'ID del chofer para calcular su salario' })
  @IsNumber()
  @IsOptional()
  choferId?: number;
}

export class CreateCotizacionDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  clienteId: number;

  @ApiProperty({ example: 'Ciudad de México' })
  @IsString()
  @IsNotEmpty()
  origen: string;

  @ApiProperty({ example: 'Monterrey, NL' })
  @IsString()
  @IsNotEmpty()
  destino: string;

  @ApiProperty({ example: 850 })
  @IsNumber()
  kmEstimados: number;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  precioCotizado: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  camionId?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  choferId?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notas?: string;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  validoHasta?: Date;
}

export class UpdateCotizacionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  origen?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  destino?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  kmEstimados?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  precioCotizado?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notas?: string;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  validoHasta?: Date;
}
