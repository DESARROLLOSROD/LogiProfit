import { Controller, Get, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';




@ApiTags('reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) { }

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener dashboard principal' })
  getDashboard(@Request() req: any) {
    return this.reportesService.getDashboard(req.user.empresaId);
  }

  @Get('rentabilidad')
  @ApiOperation({ summary: 'Reporte de rentabilidad por período' })
  @ApiQuery({ name: 'fechaDesde', required: true })
  @ApiQuery({ name: 'fechaHasta', required: true })
  getReporteRentabilidad(
    @Request() req: any,
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.reportesService.getReporteRentabilidad(
      req.user.empresaId,
      new Date(fechaDesde),
      new Date(fechaHasta),
    );
  }

  @Get('gastos-por-tipo')
  @ApiOperation({ summary: 'Reporte de gastos agrupados por tipo' })
  @ApiQuery({ name: 'fechaDesde', required: true })
  @ApiQuery({ name: 'fechaHasta', required: true })
  getReporteGastosPorTipo(
    @Request() req: any,
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.reportesService.getReporteGastosPorTipo(
      req.user.empresaId,
      new Date(fechaDesde),
      new Date(fechaHasta),
    );
  }

  @Get('por-cliente')
  @ApiOperation({ summary: 'Reporte de rentabilidad por cliente' })
  @ApiQuery({ name: 'fechaDesde', required: true })
  @ApiQuery({ name: 'fechaHasta', required: true })
  getReportePorCliente(
    @Request() req: any,
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.reportesService.getReportePorCliente(
      req.user.empresaId,
      new Date(fechaDesde),
      new Date(fechaHasta),
    );
  }
}
