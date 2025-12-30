import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
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
import { UpdatePagoFleteDto } from './dto/update-pago-flete.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EstadoFlete } from '@prisma/client';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { RequirePermission } from '../../common/rbac/roles.decorator';
import { Modulo, Accion } from '../../common/rbac/permissions.config';

@ApiTags('fletes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fletes')
export class FletesController {
  constructor(private readonly fletesService: FletesService) { }

  @Post()
  @RequirePermission(Modulo.FLETES, Accion.CREAR)
  @ApiOperation({ summary: 'Crear nuevo flete' })
  @ApiResponse({ status: 201, description: 'Flete creado exitosamente' })
  create(@Request() req: any, @Body() createFleteDto: CreateFleteDto) {
    return this.fletesService.create(req.user.empresaId, createFleteDto);
  }

  @Get()
  @RequirePermission(Modulo.FLETES, Accion.LEER)
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
  @RequirePermission(Modulo.FLETES, Accion.ACTUALIZAR)
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

  @Delete(':id')
  @RequirePermission(Modulo.FLETES, Accion.ELIMINAR)
  @ApiOperation({ summary: 'Eliminar flete' })
  @ApiResponse({ status: 200, description: 'Flete eliminado. Solo se pueden eliminar fletes en estado PLANEADO o CANCELADO.' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar el flete en su estado actual' })
  delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.fletesService.delete(id, req.user.empresaId);
  }

  @Patch(':id/pago')
  @ApiOperation({ summary: 'Actualizar estado de pago del flete' })
  @ApiResponse({ status: 200, description: 'Estado de pago actualizado' })
  actualizarPago(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePagoDto: UpdatePagoFleteDto,
  ) {
    return this.fletesService.actualizarPago(id, req.user.empresaId, updatePagoDto);
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

  // ==================== DUPLICAR FLETE ====================

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar flete existente' })
  @ApiQuery({ name: 'copyGastos', required: false, type: Boolean, description: 'Copiar gastos del flete original' })
  @ApiQuery({ name: 'copyAsignaciones', required: false, type: Boolean, description: 'Copiar asignaciones de camiones y choferes' })
  @ApiResponse({ status: 201, description: 'Flete duplicado exitosamente' })
  duplicarFlete(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('copyGastos') copyGastos?: string,
    @Query('copyAsignaciones') copyAsignaciones?: string,
  ) {
    const options = {
      copyGastos: copyGastos === 'true',
      copyAsignaciones: copyAsignaciones === 'true',
    };
    return this.fletesService.duplicarFlete(id, req.user.empresaId, options);
  }

  // ==================== CHECKLIST ====================

  @Get(':id/checklist')
  @ApiOperation({ summary: 'Obtener checklist del flete' })
  @ApiResponse({ status: 200, description: 'Checklist del flete' })
  getChecklist(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.fletesService.getChecklist(id, req.user.empresaId);
  }

  @Post(':id/checklist/predeterminado')
  @ApiOperation({ summary: 'Crear checklist predeterminado para el flete' })
  @ApiResponse({ status: 201, description: 'Checklist predeterminado creado' })
  crearChecklistPredeterminado(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.fletesService.crearChecklistPredeterminado(id, req.user.empresaId);
  }

  @Post(':id/checklist')
  @ApiOperation({ summary: 'Agregar item al checklist' })
  @ApiResponse({ status: 201, description: 'Item agregado al checklist' })
  agregarItemChecklist(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() createDto: any,
  ) {
    return this.fletesService.agregarItemChecklist(id, req.user.empresaId, createDto);
  }

  @Patch(':id/checklist/:itemId')
  @ApiOperation({ summary: 'Marcar/desmarcar item del checklist' })
  @ApiResponse({ status: 200, description: 'Item actualizado' })
  marcarChecklistItem(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateDto: any,
  ) {
    return this.fletesService.marcarChecklistItem(id, itemId, req.user.empresaId, updateDto);
  }

  @Put(':id/checklist/:itemId/descripcion')
  @ApiOperation({ summary: 'Actualizar descripción del item' })
  @ApiResponse({ status: 200, description: 'Descripción actualizada' })
  actualizarDescripcionChecklistItem(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateDto: any,
  ) {
    return this.fletesService.actualizarDescripcionChecklistItem(id, itemId, req.user.empresaId, updateDto);
  }

  @Delete(':id/checklist/:itemId')
  @ApiOperation({ summary: 'Eliminar item del checklist' })
  @ApiResponse({ status: 200, description: 'Item eliminado' })
  eliminarChecklistItem(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.fletesService.eliminarChecklistItem(id, itemId, req.user.empresaId);
  }
}
