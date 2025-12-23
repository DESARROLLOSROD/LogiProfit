import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmpresasService } from './empresas.service';
import { UpdateEmpresaDto } from './dto/empresa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('empresas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Get('mi-empresa')
  @ApiOperation({ summary: 'Obtener datos de mi empresa' })
  findMiEmpresa(@Request() req) {
    return this.empresasService.findOne(req.user.empresaId);
  }

  @Patch('mi-empresa')
  @ApiOperation({ summary: 'Actualizar datos de mi empresa' })
  update(@Request() req, @Body() dto: UpdateEmpresaDto) {
    return this.empresasService.update(req.user.empresaId, dto);
  }

  @Get('mi-empresa/estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas generales de la empresa' })
  getEstadisticas(@Request() req) {
    return this.empresasService.getEstadisticas(req.user.empresaId);
  }
}
