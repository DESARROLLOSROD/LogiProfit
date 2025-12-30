import { IsNotEmpty, IsNumber, IsOptional, IsDate, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EstadoPago } from '@prisma/client';

export class UpdatePagoFleteDto {
  @ApiProperty({ enum: EstadoPago, example: EstadoPago.PAGADO })
  @IsEnum(EstadoPago)
  @IsNotEmpty()
  estadoPago: EstadoPago;

  @ApiProperty({ example: 45000, required: false })
  @IsNumber()
  @IsOptional()
  montoPagado?: number;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaPago?: Date;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaVencimiento?: Date;
}
