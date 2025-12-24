import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDate, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SimularCostosDto {
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

  // Kilometraje
  @ApiProperty({ example: 2500, description: 'Kilómetros cargado' })
  @IsNumber()
  kmCargado: number;

  @ApiProperty({ required: false, example: 2150, description: 'Kilómetros de regreso vacío' })
  @IsNumber()
  @IsOptional()
  kmVacio?: number;

  @ApiProperty({ example: 45000, description: 'Precio cotizado al cliente' })
  @IsNumber()
  precioCotizado: number;

  // Camión y chofer
  @ApiProperty({ required: false, description: 'ID del camión para usar su rendimiento' })
  @IsNumber()
  @IsOptional()
  camionId?: number;

  @ApiProperty({ required: false, description: 'ID del chofer para calcular su salario' })
  @IsNumber()
  @IsOptional()
  choferId?: number;

  // Costos porcentuales
  @ApiProperty({ required: false, example: 25, description: 'Porcentaje de mantenimiento (default 25%)' })
  @IsNumber()
  @IsOptional()
  porcentajeMantenimiento?: number;

  @ApiProperty({ required: false, example: 20, description: 'Porcentaje de indirectos (default 20%)' })
  @IsNumber()
  @IsOptional()
  porcentajeIndirectos?: number;

  // Carro piloto
  @ApiProperty({ required: false, example: false, description: 'Requiere carro piloto para carga sobredimensionada' })
  @IsBoolean()
  @IsOptional()
  requiereCarroPiloto?: boolean;

  @ApiProperty({ required: false, example: 5, description: 'Días del carro piloto' })
  @IsNumber()
  @IsOptional()
  diasCarroPiloto?: number;

  @ApiProperty({ required: false, example: 5000, description: 'Costo base del carro piloto' })
  @IsNumber()
  @IsOptional()
  costoBaseCarroPiloto?: number;

  // Viáticos detallados
  @ApiProperty({ required: false, example: 21, description: 'Cantidad de comidas' })
  @IsNumber()
  @IsOptional()
  comidasCantidad?: number;

  @ApiProperty({ required: false, example: 120, description: 'Precio unitario por comida' })
  @IsNumber()
  @IsOptional()
  comidasPrecioUnitario?: number;

  @ApiProperty({ required: false, example: 15, description: 'Cantidad de vales federal' })
  @IsNumber()
  @IsOptional()
  federalCantidad?: number;

  @ApiProperty({ required: false, example: 100, description: 'Precio unitario federal' })
  @IsNumber()
  @IsOptional()
  federalPrecioUnitario?: number;

  @ApiProperty({ required: false, example: 2, description: 'Cantidad de recarga de teléfono' })
  @IsNumber()
  @IsOptional()
  telefonoCantidad?: number;

  @ApiProperty({ required: false, example: 100, description: 'Precio unitario teléfono' })
  @IsNumber()
  @IsOptional()
  telefonoPrecioUnitario?: number;

  @ApiProperty({ required: false, example: 500, description: 'Imprevistos de viáticos' })
  @IsNumber()
  @IsOptional()
  imprevistosViaticos?: number;

  // Casetas detalladas (opción manual)
  @ApiProperty({ required: false, example: 14000, description: 'Costo real de casetas cargado (si se conoce)' })
  @IsNumber()
  @IsOptional()
  casetasCargado?: number;

  @ApiProperty({ required: false, example: 10500, description: 'Costo real de casetas vacío (si se conoce)' })
  @IsNumber()
  @IsOptional()
  casetasVacio?: number;

  // Permiso SCT
  @ApiProperty({ required: false, example: 2200, description: 'Costo del permiso SCT' })
  @IsNumber()
  @IsOptional()
  permisoEstimado?: number;
}

export class CreateCotizacionDto extends SimularCostosDto {
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
  kmCargado?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  kmVacio?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  precioCotizado?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  requiereCarroPiloto?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  porcentajeMantenimiento?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  porcentajeIndirectos?: number;

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
