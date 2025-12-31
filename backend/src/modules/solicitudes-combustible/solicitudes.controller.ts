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
import { SolicitudesService } from './solicitudes.service';
import {
  CreateSolicitudDto,
  AprobarSolicitudDto,
  RechazarSolicitudDto,
  DepositarSolicitudDto,
} from './dto/solicitud.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EstadoSolicitud } from '@prisma/client';
import { RolesGuard } from '../../common/rbac/roles.guard';
import { RequirePermission } from '../../common/rbac/roles.decorator';
import { Modulo, Accion } from '../../common/rbac/permissions.config';

@ApiTags('solicitudes-combustible')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('solicitudes-combustible')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  @RequirePermission(Modulo.SOLICITUDES_COMBUSTIBLE, Accion.CREAR)
  @ApiOperation({ summary: 'Crear nueva solicitud de combustible (operador)' })
  @ApiResponse({ status: 201, description: 'Solicitud creada exitosamente' })
  create(@Request() req: any, @Body() createSolicitudDto: CreateSolicitudDto) {
    return this.solicitudesService.create(req.user.id, createSolicitudDto);
  }

  @Get()
  @RequirePermission(Modulo.SOLICITUDES_COMBUSTIBLE, Accion.LEER)
  @ApiOperation({ summary: 'Listar todas las solicitudes (admin/mantenimiento/contabilidad)' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoSolicitud })
  findAll(@Request() req: any, @Query('estado') estado?: EstadoSolicitud) {
    return this.solicitudesService.findAll(req.user.empresaId, estado);
  }

  @Get('mis-solicitudes')
  @ApiOperation({ summary: 'Obtener mis solicitudes (operador)' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoSolicitud })
  findMisSolicitudes(@Request() req: any, @Query('estado') estado?: EstadoSolicitud) {
    return this.solicitudesService.findMisSolicitudes(req.user.id, estado);
  }

  @Get('fletes-disponibles')
  @RequirePermission(Modulo.SOLICITUDES_COMBUSTIBLE, Accion.CREAR)
  @ApiOperation({ summary: 'Obtener fletes disponibles para solicitudes de combustible' })
  getFletesDisponibles(@Request() req: any) {
    return this.solicitudesService.getFletesDisponibles(req.user.empresaId);
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de solicitudes' })
  getEstadisticas(@Request() req: any) {
    return this.solicitudesService.getEstadisticas(req.user.empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una solicitud' })
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.solicitudesService.findOne(id, req.user.empresaId);
  }

  @Patch(':id/aprobar')
  @RequirePermission(Modulo.SOLICITUDES_COMBUSTIBLE, Accion.APROBAR)
  @ApiOperation({ summary: 'Aprobar solicitud (mantenimiento)' })
  @ApiResponse({ status: 200, description: 'Solicitud aprobada' })
  @ApiResponse({ status: 400, description: 'Solo se pueden aprobar solicitudes PENDIENTES' })
  aprobar(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() aprobarDto?: AprobarSolicitudDto
  ) {
    return this.solicitudesService.aprobar(id, req.user.empresaId, req.user.id, aprobarDto);
  }

  @Patch(':id/rechazar')
  @RequirePermission(Modulo.SOLICITUDES_COMBUSTIBLE, Accion.RECHAZAR)
  @ApiOperation({ summary: 'Rechazar solicitud (mantenimiento)' })
  @ApiResponse({ status: 200, description: 'Solicitud rechazada' })
  @ApiResponse({ status: 400, description: 'Solo se pueden rechazar solicitudes PENDIENTES' })
  rechazar(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() rechazarDto: RechazarSolicitudDto
  ) {
    return this.solicitudesService.rechazar(id, req.user.empresaId, req.user.id, rechazarDto);
  }

  @Patch(':id/depositar')
  @RequirePermission(Modulo.SOLICITUDES_COMBUSTIBLE, Accion.DEPOSITAR)
  @ApiOperation({ summary: 'Marcar como depositada (contabilidad)' })
  @ApiResponse({ status: 200, description: 'Solicitud marcada como depositada' })
  @ApiResponse({ status: 400, description: 'Solo se pueden depositar solicitudes APROBADAS' })
  depositar(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() depositarDto?: DepositarSolicitudDto
  ) {
    return this.solicitudesService.depositar(id, req.user.empresaId, req.user.id, depositarDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar solicitud' })
  @ApiResponse({
    status: 200,
    description: 'Solicitud eliminada. Solo se pueden eliminar solicitudes PENDIENTES o RECHAZADAS.',
  })
  @ApiResponse({ status: 400, description: 'No se puede eliminar la solicitud en su estado actual' })
  delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.solicitudesService.delete(id, req.user.empresaId);
  }
}
