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
import { PlantillasGastoService } from './plantillas-gasto.service';
import { CreatePlantillaGastoDto, UpdatePlantillaGastoDto } from '../gastos/dto/plantilla-gasto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('plantillas-gasto')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plantillas-gasto')
export class PlantillasGastoController {
  constructor(private readonly service: PlantillasGastoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva plantilla de gasto' })
  @ApiResponse({ status: 201, description: 'Plantilla creada exitosamente' })
  create(@Request() req: any, @Body() createDto: CreatePlantillaGastoDto) {
    return this.service.create(req.user.empresaId, createDto);
  }

  @Post('predeterminadas')
  @ApiOperation({ summary: 'Crear plantillas predeterminadas para la empresa' })
  @ApiResponse({ status: 201, description: 'Plantillas predeterminadas creadas' })
  crearPredeterminadas(@Request() req: any) {
    return this.service.crearPlantillasPredeterminadas(req.user.empresaId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las plantillas de gasto' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(@Request() req: any, @Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(req.user.empresaId, includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una plantilla' })
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar plantilla de gasto' })
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePlantillaGastoDto,
  ) {
    return this.service.update(id, req.user.empresaId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar plantilla de gasto (soft delete)' })
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id, req.user.empresaId);
  }
}
