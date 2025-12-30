import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsEnum, IsDateString, IsDecimal } from 'class-validator';
import { MetodoPago, FormaPago, EstadoPagoFactura } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateFacturaDto {
  @ApiProperty({ description: 'ID del flete a facturar' })
  @IsInt()
  @Type(() => Number)
  fleteId: number;

  @ApiProperty({ description: 'Número de factura' })
  @IsString()
  numero: string;

  @ApiPropertyOptional({ description: 'Serie de la factura' })
  @IsString()
  @IsOptional()
  serie?: string;

  @ApiProperty({ description: 'UUID fiscal (Folio Fiscal / Timbre)' })
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Fecha de emisión de la factura' })
  @IsDateString()
  fechaEmision: string;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento del pago' })
  @IsDateString()
  @IsOptional()
  fechaVencimiento?: string;

  @ApiProperty({ description: 'Subtotal (antes de IVA)' })
  @Type(() => Number)
  subtotal: number;

  @ApiProperty({ description: 'IVA' })
  @Type(() => Number)
  iva: number;

  @ApiProperty({ description: 'Total (subtotal + IVA)' })
  @Type(() => Number)
  total: number;

  @ApiPropertyOptional({ enum: MetodoPago, description: 'Método de pago SAT' })
  @IsEnum(MetodoPago)
  @IsOptional()
  metodoPago?: MetodoPago;

  @ApiPropertyOptional({ enum: FormaPago, description: 'Forma de pago SAT' })
  @IsEnum(FormaPago)
  @IsOptional()
  formaPago?: FormaPago;

  @ApiPropertyOptional({ description: 'Uso de CFDI (G03, P01, etc.)' })
  @IsString()
  @IsOptional()
  usoCFDI?: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class UpdateFacturaDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  serie?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  uuid?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fechaEmision?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fechaVencimiento?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  subtotal?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  iva?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  total?: number;

  @ApiPropertyOptional({ enum: MetodoPago })
  @IsEnum(MetodoPago)
  @IsOptional()
  metodoPago?: MetodoPago;

  @ApiPropertyOptional({ enum: FormaPago })
  @IsEnum(FormaPago)
  @IsOptional()
  formaPago?: FormaPago;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  usoCFDI?: string;

  @ApiPropertyOptional({ enum: EstadoPagoFactura })
  @IsEnum(EstadoPagoFactura)
  @IsOptional()
  estadoPago?: EstadoPagoFactura;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notas?: string;
}

export class UpdateEstadoPagoDto {
  @ApiProperty({ enum: EstadoPagoFactura })
  @IsEnum(EstadoPagoFactura)
  estadoPago: EstadoPagoFactura;
}
