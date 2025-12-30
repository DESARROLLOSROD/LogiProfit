import { IsNotEmpty, IsOptional, IsString, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty({ example: 'Cemex S.A. de C.V.' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'CEM123456ABC', required: false })
  @IsString()
  @IsOptional()
  rfc?: string;

  @ApiProperty({ example: 'contacto@cemex.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '5512345678', required: false })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ example: 'Av. Principal #123', required: false })
  @IsString()
  @IsOptional()
  direccion?: string;
}

export class UpdateClienteDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  rfc?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
