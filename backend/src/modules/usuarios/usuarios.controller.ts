import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  create(@Request() req, @Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(req.user.empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios de la empresa' })
  findAll(@Request() req) {
    return this.usuariosService.findAll(req.user.empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de usuario' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, req.user.empresaId, dto);
  }

  @Patch(':id/toggle-activo')
  @ApiOperation({ summary: 'Activar/desactivar usuario' })
  toggleActivo(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.toggleActivo(id, req.user.empresaId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario' })
  delete(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.delete(id, req.user.empresaId);
  }
}
