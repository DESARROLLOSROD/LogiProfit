import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsArray,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ArchivoComprobanteDto {
  @ApiProperty({ description: 'Nombre del archivo' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'URL del archivo en almacenamiento' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Tipo MIME del archivo', example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ description: 'Tamaño del archivo en bytes' })
  @IsInt()
  @IsNotEmpty()
  tamano: number;

  @ApiPropertyOptional({ description: 'Descripción del comprobante' })
  @IsString()
  @IsOptional()
  descripcion?: string;
}

export class CreateComprobacionViaticoDto {
  @ApiPropertyOptional({ description: 'ID de la solicitud asociada (opcional)' })
  @IsInt()
  @IsOptional()
  solicitudId?: number;

  @ApiProperty({ description: 'ID del flete asociado' })
  @IsInt()
  @IsNotEmpty()
  fleteId: number;

  @ApiProperty({
    type: [ArchivoComprobanteDto],
    description: 'Lista de archivos comprobantes',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArchivoComprobanteDto)
  @IsNotEmpty()
  archivos: ArchivoComprobanteDto[];

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class ValidarComprobacionDto {
  @ApiProperty({ description: 'Indica si se aprueba (true) o rechaza (false)' })
  @IsNotEmpty()
  aprobado: boolean;

  @ApiPropertyOptional({ description: 'Motivo del rechazo (requerido si aprobado=false)' })
  @IsString()
  @IsOptional()
  motivoRechazo?: string;

  @ApiPropertyOptional({ description: 'Notas de validación' })
  @IsString()
  @IsOptional()
  notas?: string;
}
