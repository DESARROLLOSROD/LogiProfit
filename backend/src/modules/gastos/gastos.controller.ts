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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GastosService } from './gastos.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('gastos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gastos')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar nuevo gasto' })
  @ApiResponse({ status: 201, description: 'Gasto registrado' })
  create(@Request() req, @Body() dto: CreateGastoDto) {
    return this.gastosService.create(req.user.empresaId, dto);
  }

  @Get('flete/:fleteId')
  @ApiOperation({ summary: 'Listar gastos de un flete' })
  findAllByFlete(
    @Request() req,
    @Param('fleteId', ParseIntPipe) fleteId: number,
  ) {
    return this.gastosService.findAllByFlete(fleteId, req.user.empresaId);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen de gastos por período' })
  @ApiQuery({ name: 'fechaDesde', required: true })
  @ApiQuery({ name: 'fechaHasta', required: true })
  getResumen(
    @Request() req,
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.gastosService.getResumenPorPeriodo(
      req.user.empresaId,
      new Date(fechaDesde),
      new Date(fechaHasta),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de gasto' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.gastosService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar gasto' })
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGastoDto,
  ) {
    return this.gastosService.update(id, req.user.empresaId, dto);
  }

  @Patch(':id/validar')
  @ApiOperation({ summary: 'Validar gasto (contabilidad)' })
  validar(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.gastosService.validar(id, req.user.empresaId, req.user.id);
  }

  @Patch(':id/invalidar')
  @ApiOperation({ summary: 'Invalidar gasto' })
  invalidar(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.gastosService.invalidar(id, req.user.empresaId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar gasto' })
  delete(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.gastosService.delete(id, req.user.empresaId);
  }
}
