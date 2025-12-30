import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCotizacionDto {
  @ApiProperty({ example: 1, description: 'ID del cliente' })
  @IsNumber()
  clienteId: number;

  @ApiProperty({ example: 'Hermosillo, SON', description: 'Origen del viaje' })
  @IsString()
  @IsNotEmpty()
  origen: string;

  @ApiProperty({ example: 'Coatzacoalcos, VER', description: 'Destino del viaje' })
  @IsString()
  @IsNotEmpty()
  destino: string;

  // Información de la carga
  @ApiProperty({ required: false, example: 'TANQUE DE FIBRA', description: 'Tipo de carga' })
  @IsString()
  @IsOptional()
  tipoCarga?: string;

  @ApiProperty({ required: false, example: 10, description: 'Peso de la carga en toneladas' })
  @IsNumber()
  @IsOptional()
  pesoCarga?: number;

  @ApiProperty({ required: false, example: '8.3 x 4.1 x 4.0 M', description: 'Dimensiones L x A x H' })
  @IsString()
  @IsOptional()
  dimensiones?: string;

  // Kilometraje estimado
  @ApiProperty({ example: 2500, description: 'Kilómetros estimados del viaje' })
  @IsNumber()
  kmEstimado: number;

  // Precio cotizado al cliente
  @ApiProperty({ example: 45000, description: 'Precio total cotizado al cliente' })
  @IsNumber()
  precioCotizado: number;

  @ApiProperty({ required: false, description: 'Notas adicionales' })
  @IsString()
  @IsOptional()
  notas?: string;

  @ApiProperty({ required: false, description: 'Fecha de validez de la cotización' })
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
  @IsString()
  @IsOptional()
  tipoCarga?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  pesoCarga?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  dimensiones?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  kmEstimado?: number;

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

// DTOs para Conceptos de Cotización
export class CreateConceptoDto {
  @ApiProperty({ example: 'Diesel', description: 'Descripción del concepto/servicio' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ example: 100, description: 'Cantidad' })
  @IsNumber()
  cantidad: number;

  @ApiProperty({ example: 'litros', description: 'Unidad de medida' })
  @IsString()
  @IsNotEmpty()
  unidad: string;

  @ApiProperty({ example: 24, description: 'Precio unitario' })
  @IsNumber()
  precioUnit: number;

  @ApiProperty({ required: false, example: 0, description: 'Orden de visualización' })
  @IsNumber()
  @IsOptional()
  orden?: number;
}

export class UpdateConceptoDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  cantidad?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  unidad?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  precioUnit?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  orden?: number;
}
