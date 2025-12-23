import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FletesService } from './fletes.service';
import { CreateFleteDto } from './dto/create-flete.dto';
import { UpdateFleteDto } from './dto/update-flete.dto';
import { AsignarCamionDto } from './dto/asignar-camion.dto';
import { AsignarChoferDto } from './dto/asignar-chofer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EstadoFlete } from '@prisma/client';

@ApiTags('fletes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fletes')
export class FletesController {
  constructor(private readonly fletesService: FletesService) { }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo flete' })
  @ApiResponse({ status: 201, description: 'Flete creado exitosamente' })
  create(@Request() req: any, @Body() createFleteDto: CreateFleteDto) {
    return this.fletesService.create(req.user.empresaId, createFleteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los fletes' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoFlete })
  @ApiQuery({ name: 'clienteId', required: false, type: Number })
  findAll(
    @Request() req: any,
    @Query('estado') estado?: EstadoFlete,
    @Query('clienteId') clienteId?: number,
  ) {
    return this.fletesService.findAll(req.user.empresaId, { estado, clienteId });
  }

  @Get('resumen-mensual')
  @ApiOperation({ summary: 'Obtener resumen mensual de fletes' })
  @ApiQuery({ name: 'mes', required: true, type: Number })
  @ApiQuery({ name: 'anio', required: true, type: Number })
  getResumenMensual(
    @Request() req: any,
    @Query('mes', ParseIntPipe) mes: number,
    @Query('anio', ParseIntPipe) anio: number,
  ) {
    return this.fletesService.getResumenMensual(req.user.empresaId, mes, anio);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un flete' })
  @ApiResponse({ status: 200, description: 'Detalle del flete con utilidad calculada' })
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.fletesService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar flete' })
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFleteDto: UpdateFleteDto,
  ) {
    return this.fletesService.update(id, req.user.empresaId, updateFleteDto);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado del flete' })
  @ApiQuery({ name: 'estado', required: true, enum: EstadoFlete })
  cambiarEstado(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('estado') estado: EstadoFlete,
  ) {
    return this.fletesService.cambiarEstado(id, req.user.empresaId, estado);
  }

  @Get(':id/utilidad')
  @ApiOperation({ summary: 'Calcular utilidad del flete' })
  calcularUtilidad(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.fletesService.calcularUtilidad(id, req.user.empresaId);
  }

  // ==================== ASIGNACIONES ====================

  @Post(':id/camiones')
  @ApiOperation({ summary: 'Asignar camión al flete' })
  asignarCamion(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarCamionDto,
  ) {
    return this.fletesService.asignarCamion(id, req.user.empresaId, dto);
  }

  @Delete(':id/camiones/:camionId')
  @ApiOperation({ summary: 'Desasignar camión del flete' })
  desasignarCamion(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('camionId', ParseIntPipe) camionId: number,
  ) {
    return this.fletesService.desasignarCamion(id, camionId, req.user.empresaId);
  }

  @Post(':id/choferes')
  @ApiOperation({ summary: 'Asignar chofer al flete (calcula salario automático)' })
  asignarChofer(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarChoferDto,
  ) {
    return this.fletesService.asignarChofer(id, req.user.empresaId, dto);
  }

  @Delete(':id/choferes/:choferId')
  @ApiOperation({ summary: 'Desasignar chofer del flete' })
  desasignarChofer(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('choferId', ParseIntPipe) choferId: number,
  ) {
    return this.fletesService.desasignarChofer(id, choferId, req.user.empresaId);
  }
}
