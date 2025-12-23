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
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo cliente' })
  create(@Request() req, @Body() dto: CreateClienteDto) {
    return this.clientesService.create(req.user.empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  findAll(@Request() req, @Query('activo') activo?: boolean) {
    return this.clientesService.findAll(req.user.empresaId, activo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de cliente con estadísticas' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, req.user.empresaId, dto);
  }

  @Patch(':id/toggle-activo')
  @ApiOperation({ summary: 'Activar/desactivar cliente' })
  toggleActivo(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.clientesService.toggleActivo(id, req.user.empresaId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cliente' })
  delete(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.clientesService.delete(id, req.user.empresaId);
  }
}
