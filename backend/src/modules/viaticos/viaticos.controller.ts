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
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ViaticosService } from './viaticos.service';
import {
  CreateSolicitudViaticoDto,
  UpdateSolicitudViaticoDto,
  AprobarSolicitudViaticoDto,
  DepositarSolicitudViaticoDto,
  CancelarSolicitudViaticoDto,
} from './dto/solicitud-viatico.dto';
import {
  CreateComprobacionViaticoDto,
  ValidarComprobacionDto,
} from './dto/comprobacion-viatico.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EstadoSolicitudViatico, EstadoComprobacionViatico } from '@prisma/client';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { RequirePermission } from '../../common/rbac/roles.decorator';
import { Modulo, Accion } from '../../common/rbac/permissions.config';

@ApiTags('viaticos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('viaticos')
export class ViaticosController {
  constructor(private readonly viaticosService: ViaticosService) {}

  // ==================== SOLICITUDES ====================

  @Post('solicitudes')
  @RequirePermission(Modulo.VIATICOS, Accion.CREAR)
  @ApiOperation({ summary: 'Crear nueva solicitud de viáticos (operador)' })
  @ApiResponse({ status: 201, description: 'Solicitud creada exitosamente' })
  createSolicitud(
    @Request() req: any,
    @Body() createDto: CreateSolicitudViaticoDto,
  ) {
    return this.viaticosService.createSolicitud(req.user.id, createDto);
  }

  @Get('solicitudes')
  @RequirePermission(Modulo.VIATICOS, Accion.LEER)
  @ApiOperation({ summary: 'Listar todas las solicitudes (admin/contabilidad)' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoSolicitudViatico })
  @ApiQuery({ name: 'fleteId', required: false, type: Number })
  findAllSolicitudes(
    @Request() req: any,
    @Query('estado') estado?: EstadoSolicitudViatico,
    @Query('fleteId') fleteId?: string,
  ) {
    return this.viaticosService.findAllSolicitudes(
      req.user.empresaId,
      estado,
      fleteId ? parseInt(fleteId) : undefined,
    );
  }

  @Get('solicitudes/mis-solicitudes')
  @ApiOperation({ summary: 'Obtener mis solicitudes (operador)' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoSolicitudViatico })
  findMisSolicitudes(
    @Request() req: any,
    @Query('estado') estado?: EstadoSolicitudViatico,
  ) {
    return this.viaticosService.findMisSolicitudes(req.user.id, estado);
  }

  @Get('solicitudes/estadisticas')
  @RequirePermission(Modulo.VIATICOS, Accion.LEER)
  @ApiOperation({ summary: 'Obtener estadísticas de solicitudes' })
  getEstadisticasSolicitudes(@Request() req: any) {
    return this.viaticosService.getEstadisticasSolicitudes(req.user.empresaId);
  }

  @Get('solicitudes/:id')
  @ApiOperation({ summary: 'Obtener detalle de una solicitud' })
  findOneSolicitud(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.viaticosService.findOneSolicitud(id, req.user.empresaId);
  }

  @Patch('solicitudes/:id')
  @RequirePermission(Modulo.VIATICOS, Accion.EDITAR)
  @ApiOperation({ summary: 'Actualizar solicitud (operador)' })
  @ApiResponse({
    status: 200,
    description: 'Solicitud actualizada. Solo se pueden editar solicitudes SOLICITADO.',
  })
  updateSolicitud(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSolicitudViaticoDto,
  ) {
    return this.viaticosService.updateSolicitud(
      id,
      req.user.empresaId,
      req.user.id,
      updateDto,
    );
  }

  @Patch('solicitudes/:id/aprobar')
  @RequirePermission(Modulo.VIATICOS, Accion.APROBAR)
  @ApiOperation({ summary: 'Aprobar solicitud (admin/contabilidad)' })
  @ApiResponse({ status: 200, description: 'Solicitud aprobada' })
  @ApiResponse({
    status: 400,
    description: 'Solo se pueden aprobar solicitudes SOLICITADO',
  })
  aprobarSolicitud(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() aprobarDto?: AprobarSolicitudViaticoDto,
  ) {
    return this.viaticosService.aprobarSolicitud(
      id,
      req.user.empresaId,
      req.user.id,
      aprobarDto,
    );
  }

  @Patch('solicitudes/:id/depositar')
  @RequirePermission(Modulo.VIATICOS, Accion.DEPOSITAR)
  @ApiOperation({ summary: 'Marcar como depositada (contabilidad)' })
  @ApiResponse({ status: 200, description: 'Solicitud marcada como depositada' })
  @ApiResponse({
    status: 400,
    description: 'Solo se pueden depositar solicitudes APROBADO',
  })
  depositarSolicitud(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() depositarDto?: DepositarSolicitudViaticoDto,
  ) {
    return this.viaticosService.depositarSolicitud(
      id,
      req.user.empresaId,
      req.user.id,
      depositarDto,
    );
  }

  @Patch('solicitudes/:id/cancelar')
  @RequirePermission(Modulo.VIATICOS, Accion.CANCELAR)
  @ApiOperation({ summary: 'Cancelar solicitud (admin)' })
  @ApiResponse({ status: 200, description: 'Solicitud cancelada' })
  @ApiResponse({
    status: 400,
    description: 'No se pueden cancelar solicitudes DEPOSITADO',
  })
  cancelarSolicitud(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelarDto: CancelarSolicitudViaticoDto,
  ) {
    return this.viaticosService.cancelarSolicitud(
      id,
      req.user.empresaId,
      req.user.id,
      cancelarDto,
    );
  }

  @Delete('solicitudes/:id')
  @RequirePermission(Modulo.VIATICOS, Accion.ELIMINAR)
  @ApiOperation({ summary: 'Eliminar solicitud (operador)' })
  @ApiResponse({
    status: 200,
    description:
      'Solicitud eliminada. Solo se pueden eliminar solicitudes SOLICITADO o CANCELADO.',
  })
  deleteSolicitud(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.viaticosService.deleteSolicitud(
      id,
      req.user.empresaId,
      req.user.id,
    );
  }

  // ==================== COMPROBACIONES ====================

  @Post('comprobaciones')
  @RequirePermission(Modulo.VIATICOS, Accion.CREAR)
  @ApiOperation({ summary: 'Crear nueva comprobación de viáticos (operador)' })
  @ApiResponse({ status: 201, description: 'Comprobación creada exitosamente' })
  createComprobacion(
    @Request() req: any,
    @Body() createDto: CreateComprobacionViaticoDto,
  ) {
    return this.viaticosService.createComprobacion(req.user.id, createDto);
  }

  @Get('comprobaciones')
  @RequirePermission(Modulo.VIATICOS, Accion.LEER)
  @ApiOperation({ summary: 'Listar todas las comprobaciones (admin/contabilidad)' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoComprobacionViatico })
  @ApiQuery({ name: 'fleteId', required: false, type: Number })
  findAllComprobaciones(
    @Request() req: any,
    @Query('estado') estado?: EstadoComprobacionViatico,
    @Query('fleteId') fleteId?: string,
  ) {
    return this.viaticosService.findAllComprobaciones(
      req.user.empresaId,
      estado,
      fleteId ? parseInt(fleteId) : undefined,
    );
  }

  @Get('comprobaciones/mis-comprobaciones')
  @ApiOperation({ summary: 'Obtener mis comprobaciones (operador)' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoComprobacionViatico })
  findMisComprobaciones(
    @Request() req: any,
    @Query('estado') estado?: EstadoComprobacionViatico,
  ) {
    return this.viaticosService.findMisComprobaciones(req.user.id, estado);
  }

  @Get('comprobaciones/estadisticas')
  @RequirePermission(Modulo.VIATICOS, Accion.LEER)
  @ApiOperation({ summary: 'Obtener estadísticas de comprobaciones' })
  getEstadisticasComprobaciones(@Request() req: any) {
    return this.viaticosService.getEstadisticasComprobaciones(req.user.empresaId);
  }

  @Get('comprobaciones/:id')
  @ApiOperation({ summary: 'Obtener detalle de una comprobación' })
  findOneComprobacion(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.viaticosService.findOneComprobacion(id, req.user.empresaId);
  }

  @Patch('comprobaciones/:id/validar')
  @RequirePermission(Modulo.VIATICOS, Accion.VALIDAR)
  @ApiOperation({ summary: 'Validar comprobación (admin/contabilidad)' })
  @ApiResponse({ status: 200, description: 'Comprobación validada (aprobada o rechazada)' })
  @ApiResponse({
    status: 400,
    description: 'Solo se pueden validar comprobaciones PENDIENTE_VALIDACION',
  })
  validarComprobacion(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() validarDto: ValidarComprobacionDto,
  ) {
    return this.viaticosService.validarComprobacion(
      id,
      req.user.empresaId,
      req.user.id,
      validarDto,
    );
  }

  @Delete('comprobaciones/:id')
  @RequirePermission(Modulo.VIATICOS, Accion.ELIMINAR)
  @ApiOperation({ summary: 'Eliminar comprobación (operador)' })
  @ApiResponse({
    status: 200,
    description:
      'Comprobación eliminada. Solo se pueden eliminar comprobaciones PENDIENTE_VALIDACION o RECHAZADO.',
  })
  deleteComprobacion(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.viaticosService.deleteComprobacion(
      id,
      req.user.empresaId,
      req.user.id,
    );
  }

  // ==================== UTILIDADES ====================

  @Get('fletes-disponibles')
  @RequirePermission(Modulo.VIATICOS, Accion.CREAR)
  @ApiOperation({ summary: 'Obtener fletes disponibles para viáticos' })
  getFletesDisponibles(@Request() req: any) {
    return this.viaticosService.getFletesDisponibles(req.user.empresaId);
  }
}
