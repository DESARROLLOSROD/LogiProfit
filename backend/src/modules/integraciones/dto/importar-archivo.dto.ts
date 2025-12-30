import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ImportarArchivoDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  configuracionMapeoId: number;
}
