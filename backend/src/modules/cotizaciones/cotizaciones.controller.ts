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
import { CotizacionesService } from './cotizaciones.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
import { SimularCostosDto } from './dto/simular-costos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EstadoCotizacion } from '@prisma/client';


@ApiTags('cotizaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cotizaciones')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) { }

  @Post('simular')
  @ApiOperation({ summary: 'Simular costos de una cotización' })
  @ApiResponse({ status: 200, description: 'Simulación de costos y utilidad' })
  simularCostos(@Request() req: any, @Body() dto: SimularCostosDto) {
    return this.cotizacionesService.simularCostos(req.user.empresaId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva cotización' })
  @ApiResponse({ status: 201, description: 'Cotización creada' })
  create(@Request() req: any, @Body() dto: CreateCotizacionDto) {
    return this.cotizacionesService.create(req.user.empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cotizaciones' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoCotizacion })
  findAll(@Request() req: any, @Query('estado') estado?: EstadoCotizacion) {
    return this.cotizacionesService.findAll(req.user.empresaId, estado);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de cotización' })
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.cotizacionesService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cotización' })
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCotizacionDto,
  ) {
    return this.cotizacionesService.update(id, req.user.empresaId, dto);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado de cotización' })
  @ApiQuery({ name: 'estado', required: true, enum: EstadoCotizacion })
  cambiarEstado(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('estado') estado: EstadoCotizacion,
  ) {
    return this.cotizacionesService.cambiarEstado(id, req.user.empresaId, estado);
  }

  @Post(':id/convertir-flete')
  @ApiOperation({ summary: 'Convertir cotización a flete' })
  @ApiResponse({ status: 201, description: 'Flete creado desde cotización' })
  convertirAFlete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.cotizacionesService.convertirAFlete(id, req.user.empresaId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cotización' })
  delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.cotizacionesService.delete(id, req.user.empresaId);
  }
}
