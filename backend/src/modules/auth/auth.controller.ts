import { Controller, Post, Body, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Más restrictivo: 5 intentos por minuto
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos, intenta más tarde' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Muy restrictivo: 3 intentos por minuto
  @ApiOperation({ summary: 'Registrar nueva empresa y usuario admin' })
  @ApiResponse({ status: 201, description: 'Registro exitoso' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos, intenta más tarde' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario actual' })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  async me(@Request() req: any,) {
    return {
      id: req.user.id,
      nombre: req.user.nombre,
      email: req.user.email,
      rol: req.user.rol,
      empresa: {
        id: req.user.empresa.id,
        nombre: req.user.empresa.nombre,
      },
    };
  }
}
