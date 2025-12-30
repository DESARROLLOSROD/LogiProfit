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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChoferesService } from './choferes.service';
import { CreateChoferDto, UpdateChoferDto } from './dto/chofer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@ApiTags('choferes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('choferes')
export class ChoferesController {
  constructor(private readonly choferesService: ChoferesService) { }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo chofer' })
  create(@Request() req: any, @Body() dto: CreateChoferDto) {
    return this.choferesService.create(req.user.empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar choferes' })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  findAll(@Request() req: any, @Query('activo') activo?: boolean) {
    return this.choferesService.findAll(req.user.empresaId, activo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de chofer con estadísticas' })
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.choferesService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar chofer' })
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChoferDto,
  ) {
    return this.choferesService.update(id, req.user.empresaId, dto);
  }

  @Patch(':id/toggle-activo')
  @ApiOperation({ summary: 'Activar/desactivar chofer' })
  toggleActivo(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.choferesService.toggleActivo(id, req.user.empresaId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar chofer' })
  delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.choferesService.delete(id, req.user.empresaId);
  }
}
