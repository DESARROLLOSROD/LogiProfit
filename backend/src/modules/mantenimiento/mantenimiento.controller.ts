import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { MantenimientoService } from './mantenimiento.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { RequirePermissions } from '../../decorators/permissions.decorator';

@Controller('mantenimiento')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MantenimientoController {
  constructor(private readonly mantenimientoService: MantenimientoService) {}

  @Post()
  @RequirePermissions({ modulo: 'mantenimiento', accion: 'crear' })
  create(@Req() req: any, @Body() createDto: any) {
    return this.mantenimientoService.create(createDto);
  }

  @Get()
  @RequirePermissions({ modulo: 'mantenimiento', accion: 'leer' })
  findAll(@Req() req: any) {
    return this.mantenimientoService.findAll(req.user.empresaId);
  }

  @Get('pendientes')
  @RequirePermissions({ modulo: 'mantenimiento', accion: 'leer' })
  findPendientes(@Req() req: any) {
    return this.mantenimientoService.findPendientes(req.user.empresaId);
  }

  @Get('proximos')
  @RequirePermissions({ modulo: 'mantenimiento', accion: 'leer' })
  getProximos(@Req() req: any) {
    return this.mantenimientoService.getProximosMantenimientos(req.user.empresaId);
  }

  @Get('estado/:estado')
  @RequirePermissions({ modulo: 'mantenimiento', accion: 'leer' })
  findByEstado(@Req() req: any, @Param('estado') estado: string) {
    return this.mantenimientoService.findByEstado(req.user.empresaId, estado);
  }

  @Get('camion/:camionId')
  @RequirePermissions({ modulo: 'mantenimiento', accion: 'leer' })
  getHistorialCamion(
    @Req() req: any,
    @Param('camionId', ParseIntPipe) camionId: number,
  ) {
    return this.mantenimientoService.getHistorialCamion(camionId, req.user.empresaId);
  }

  @Get(':id')
  @RequirePermissions({ modulo: 'mantenimiento', accion: 'leer' })
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.mantenimientoService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @RequirePermissions({ modulo: 'mantenimiento', accion: 'actualizar' })
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: any,
  ) {
    return this.mantenimientoService.update(id, req.user.empresaId, updateDto);
  }

  @Patch(':id/completar')
  @RequirePermissions({ modulo: 'mantenimiento', accion: 'actualizar' })
  completar(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.mantenimientoService.completar(id, req.user.empresaId, data);
  }

  @Delete(':id')
  @RequirePermissions({ modulo: 'mantenimiento', accion: 'eliminar' })
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.mantenimientoService.remove(id, req.user.empresaId);
  }
}
