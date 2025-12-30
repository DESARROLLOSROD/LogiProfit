import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SistemaExterno, TipoArchivo } from '@prisma/client';

export class MapeoConfig {
  @ApiProperty({ required: false, example: 'FOLIO' })
  @IsString()
  @IsOptional()
  folio?: string;

  @ApiProperty({ required: false, example: 'NOMBRE_CLIENTE' })
  @IsString()
  @IsOptional()
  clienteNombre?: string;

  @ApiProperty({ required: false, example: 'ORIGEN' })
  @IsString()
  @IsOptional()
  origen?: string;

  @ApiProperty({ required: false, example: 'DESTINO' })
  @IsString()
  @IsOptional()
  destino?: string;

  @ApiProperty({ required: false, example: 'PRECIO' })
  @IsString()
  @IsOptional()
  precioCliente?: string;

  @ApiProperty({ required: false, example: 'KM' })
  @IsString()
  @IsOptional()
  kmReales?: string;

  @ApiProperty({ required: false, example: 'FECHA_INICIO' })
  @IsString()
  @IsOptional()
  fechaInicio?: string;

  @ApiProperty({ required: false, example: 'FECHA_FIN' })
  @IsString()
  @IsOptional()
  fechaFin?: string;

  @ApiProperty({ required: false, example: 'ESTADO' })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiProperty({ required: false, example: 'NOTAS' })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class CreateConfiguracionMapeoDto {
  @ApiProperty({ example: 'Aspel SAE - Importación de Folios' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    required: false,
    example: 'Configuración para importar folios desde Aspel SAE',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: SistemaExterno, example: 'ASPEL' })
  @IsEnum(SistemaExterno)
  sistema: SistemaExterno;

  @ApiProperty({ enum: TipoArchivo, example: 'EXCEL' })
  @IsEnum(TipoArchivo)
  tipoArchivo: TipoArchivo;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @ApiProperty({
    type: MapeoConfig,
    example: {
      folio: 'FOLIO',
      clienteNombre: 'NOMBRE_CLIENTE',
      origen: 'ORIGEN',
      destino: 'DESTINO',
      precioCliente: 'PRECIO',
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => MapeoConfig)
  mapeos: MapeoConfig;
}
