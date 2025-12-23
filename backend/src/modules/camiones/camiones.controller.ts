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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CamionesService } from './camiones.service';
import { CreateCamionDto, UpdateCamionDto } from './dto/camion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('camiones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('camiones')
export class CamionesController {
  constructor(private readonly camionesService: CamionesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo camión' })
  create(@Request() req, @Body() dto: CreateCamionDto) {
    return this.camionesService.create(req.user.empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar camiones' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  findAll(@Request() req, @Query('activo') activo?: boolean) {
    return this.camionesService.findAll(req.user.empresaId, activo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de camión con estadísticas' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.camionesService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar camión' })
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCamionDto,
  ) {
    return this.camionesService.update(id, req.user.empresaId, dto);
  }

  @Patch(':id/toggle-activo')
  @ApiOperation({ summary: 'Activar/desactivar camión' })
  toggleActivo(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.camionesService.toggleActivo(id, req.user.empresaId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar camión' })
  delete(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.camionesService.delete(id, req.user.empresaId);
  }
}
