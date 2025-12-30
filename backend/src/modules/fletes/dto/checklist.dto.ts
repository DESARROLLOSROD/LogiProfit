import { IsString, IsBoolean, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChecklistItemDto {
  @ApiProperty({ example: 'Asignar camión y chofer' })
  @IsString()
  descripcion: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  orden?: number;
}

export class UpdateChecklistItemDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  completado: boolean;
}

export class UpdateChecklistDescripcionDto {
  @ApiProperty({ example: 'Confirmar horario de carga' })
  @IsString()
  descripcion: string;
}
