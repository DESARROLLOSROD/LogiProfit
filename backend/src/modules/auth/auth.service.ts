import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: { empresa: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    const passwordValid = await bcrypt.compare(password, usuario.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
      rol: usuario.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresa: {
          id: usuario.empresa.id,
          nombre: usuario.empresa.nombre,
        },
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, nombre, empresaNombre, empresaRfc } = registerDto;

    // Verificar si el email ya existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Crear empresa y usuario admin
    const hashedPassword = await bcrypt.hash(password, 10);

    const empresa = await this.prisma.empresa.create({
      data: {
        nombre: empresaNombre,
        rfc: empresaRfc,
        usuarios: {
          create: {
            nombre,
            email,
            password: hashedPassword,
            rol: 'ADMIN',
          },
        },
      },
      include: {
        usuarios: true,
      },
    });

    const usuario = empresa.usuarios[0];

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      empresaId: empresa.id,
      rol: usuario.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresa: {
          id: empresa.id,
          nombre: empresa.nombre,
        },
      },
    };
  }

  async validateUser(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { empresa: true },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException();
    }

    return usuario;
  }
}
