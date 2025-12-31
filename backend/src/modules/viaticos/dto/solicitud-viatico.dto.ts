import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsNumber,
  IsObject,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';
import { TipoGastoViatico, EstadoSolicitudViatico } from '@prisma/client';

export class CreateSolicitudViaticoDto {
  @ApiProperty({ description: 'ID del flete asociado' })
  @IsInt()
  @IsNotEmpty()
  fleteId: number;

  @ApiProperty({ enum: TipoGastoViatico, description: 'Tipo de gasto de viático' })
  @IsEnum(TipoGastoViatico)
  @IsNotEmpty()
  tipoGasto: TipoGastoViatico;

  @ApiProperty({ description: 'Fecha de inicio del período', example: '2025-12-31T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  periodoInicio: string;

  @ApiProperty({ description: 'Fecha de fin del período', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  periodoFin: string;

  @ApiProperty({ description: 'Monto solicitado', example: 1500.50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsNotEmpty()
  montoSolicitado: number;

  @ApiProperty({
    description: 'Detalle del gasto en formato JSON',
    example: {
      dias: 3,
      descripcion: 'Viaje a Monterrey',
      conceptos: [
        { concepto: 'Alimentos día 1', monto: 500 },
        { concepto: 'Hospedaje', monto: 1000 },
      ],
    },
  })
  @IsObject()
  @IsNotEmpty()
  detalle: Record<string, any>;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class UpdateSolicitudViaticoDto {
  @ApiPropertyOptional({ enum: TipoGastoViatico, description: 'Tipo de gasto de viático' })
  @IsEnum(TipoGastoViatico)
  @IsOptional()
  tipoGasto?: TipoGastoViatico;

  @ApiPropertyOptional({ description: 'Fecha de inicio del período' })
  @IsDateString()
  @IsOptional()
  periodoInicio?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin del período' })
  @IsDateString()
  @IsOptional()
  periodoFin?: string;

  @ApiPropertyOptional({ description: 'Monto solicitado' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  montoSolicitado?: number;

  @ApiPropertyOptional({ description: 'Detalle del gasto en formato JSON' })
  @IsObject()
  @IsOptional()
  detalle?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class AprobarSolicitudViaticoDto {
  @ApiPropertyOptional({ description: 'Notas de aprobación' })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class DepositarSolicitudViaticoDto {
  @ApiPropertyOptional({ description: 'Notas sobre el depósito' })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class CancelarSolicitudViaticoDto {
  @ApiProperty({ description: 'Motivo de la cancelación' })
  @IsString()
  @IsNotEmpty()
  motivoCancelacion: string;
}

export class EnviarAdmonDto {
  @ApiPropertyOptional({ description: 'Email adicional para enviar notificación' })
  @IsString()
  @IsOptional()
  emailAdicional?: string;
}
