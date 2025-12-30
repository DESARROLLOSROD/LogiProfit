import {
  Controller,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('pendientes')
  @ApiOperation({ summary: 'Obtener resumen de tareas pendientes para hoy' })
  @ApiResponse({ status: 200, description: 'Tareas pendientes obtenidas exitosamente' })
  getPendientes(@Request() req: any) {
    return this.dashboardService.getPendientes(req.user.empresaId);
  }
}
