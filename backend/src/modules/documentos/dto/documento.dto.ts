import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TipoDocumento, EstadoDocumento } from '@prisma/client';

export class CreateDocumentoDto {
  @ApiProperty({ description: 'ID del camión al que pertenece el documento' })
  @IsInt()
  camionId: number;

  @ApiProperty({ enum: TipoDocumento, description: 'Tipo de documento' })
  @IsEnum(TipoDocumento)
  tipo: TipoDocumento;

  @ApiPropertyOptional({ description: 'Número de documento (p. ej., número de póliza)' })
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiProperty({ description: 'Nombre original del archivo' })
  @IsString()
  nombreArchivo: string;

  @ApiProperty({ description: 'Fecha de emisión del documento' })
  @IsDateString()
  fechaEmision: string;

  @ApiProperty({ description: 'Fecha de vencimiento del documento' })
  @IsDateString()
  fechaVencimiento: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class UpdateDocumentoDto {
  @ApiPropertyOptional({ enum: TipoDocumento })
  @IsEnum(TipoDocumento)
  @IsOptional()
  tipo?: TipoDocumento;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fechaEmision?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fechaVencimiento?: string;

  @ApiPropertyOptional({ enum: EstadoDocumento })
  @IsEnum(EstadoDocumento)
  @IsOptional()
  estado?: EstadoDocumento;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notas?: string;
}
