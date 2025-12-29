import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @ApiProperty({ example: 'admin@empresa.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({ example: 'MiPassword123!', description: 'Mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
    {
      message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&#)'
    }
  )
  password: string;

  @ApiProperty({ example: 'Transportes López S.A.' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la empresa es requerido' })
  empresaNombre: string;

  @ApiProperty({ example: 'TLO123456ABC', required: false })
  @IsString()
  @IsOptional()
  empresaRfc?: string;
}
