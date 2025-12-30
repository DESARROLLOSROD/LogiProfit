import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDate, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EstadoFlete } from '@prisma/client';

export class CreateFleteDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  clienteId: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  cotizacionId?: number;

  @ApiProperty({ example: 'Ciudad de México' })
  @IsString()
  @IsNotEmpty()
  origen: string;

  @ApiProperty({ example: 'Monterrey, NL' })
  @IsString()
  @IsNotEmpty()
  destino: string;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  precioCliente: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  folio?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  kmReales?: number;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaInicio?: Date;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaFin?: Date;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notas?: string;

  @ApiProperty({ required: false, description: 'Fecha límite de pago' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaVencimiento?: Date;
}

export class UpdateFleteDto {
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
  precioCliente?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  kmReales?: number;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaInicio?: Date;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaFin?: Date;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class AsignarCamionDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  camionId: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  principal?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class AsignarChoferDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  choferId: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  fechaInicio: Date;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaFin?: Date;

  @ApiProperty({ example: 5, required: false, description: 'Días del viaje (para pago por día)' })
  @IsNumber()
  @IsOptional()
  dias?: number;

  @ApiProperty({ example: 850, required: false, description: 'Km recorridos (para pago por km)' })
  @IsNumber()
  @IsOptional()
  kmReales?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notas?: string;
}
