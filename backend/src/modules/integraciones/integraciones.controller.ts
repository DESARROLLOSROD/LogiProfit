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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { IntegracionesService } from './integraciones.service';
import { CreateConfiguracionMapeoDto } from './dto/create-configuracion-mapeo.dto';
import { UpdateConfiguracionMapeoDto } from './dto/update-configuracion-mapeo.dto';
import { ExportarFletesDto } from './dto/exportar-fletes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TipoArchivo } from '@prisma/client';

@ApiTags('integraciones')
@Controller('integraciones')
@UseGuards(JwtAuthGuard)
export class IntegracionesController {
  constructor(private readonly integracionesService: IntegracionesService) {}

  // ==================== CONFIGURACIONES DE MAPEO ====================

  @Post('mapeos')
  @ApiOperation({ summary: 'Crear configuración de mapeo' })
  create(@Request() req: any, @Body() dto: CreateConfiguracionMapeoDto) {
    const empresaId = req.user.empresa.id;
    return this.integracionesService.createConfiguracion(empresaId, dto);
  }

  @Get('mapeos')
  @ApiOperation({ summary: 'Listar configuraciones de mapeo' })
  findAll(@Request() req: any) {
    const empresaId = req.user.empresa.id;
    return this.integracionesService.findAllConfiguraciones(empresaId);
  }

  @Get('mapeos/:id')
  @ApiOperation({ summary: 'Obtener configuración de mapeo' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const empresaId = req.user.empresa.id;
    return this.integracionesService.findOneConfiguracion(id, empresaId);
  }

  @Patch('mapeos/:id')
  @ApiOperation({ summary: 'Actualizar configuración de mapeo' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: UpdateConfiguracionMapeoDto,
  ) {
    const empresaId = req.user.empresa.id;
    return this.integracionesService.updateConfiguracion(id, empresaId, dto);
  }

  @Delete('mapeos/:id')
  @ApiOperation({ summary: 'Eliminar configuración de mapeo' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const empresaId = req.user.empresa.id;
    return this.integracionesService.deleteConfiguracion(id, empresaId);
  }

  // ==================== IMPORTACIÓN ====================

  @Post('importar/preview')
  @ApiOperation({ summary: 'Vista previa de importación (sin guardar)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        configuracionMapeoId: { type: 'number' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'application/xml',
          'text/xml',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Tipo de archivo no permitido. Solo: Excel, CSV, XML',
            ),
            false,
          );
        }
      },
    }),
  )
  async preview(
    @UploadedFile() file: Express.Multer.File,
    @Body('configuracionMapeoId', ParseIntPipe) configuracionMapeoId: number,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    const empresaId = req.user.empresa.id;
    return this.integracionesService.preview(
      file,
      configuracionMapeoId,
      empresaId,
    );
  }

  @Post('importar')
  @ApiOperation({ summary: 'Importar archivo de fletes' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        configuracionMapeoId: { type: 'number' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'application/xml',
          'text/xml',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Tipo de archivo no permitido. Solo: Excel, CSV, XML',
            ),
            false,
          );
        }
      },
    }),
  )
  async importar(
    @UploadedFile() file: Express.Multer.File,
    @Body('configuracionMapeoId', ParseIntPipe) configuracionMapeoId: number,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    const empresaId = req.user.empresa.id;
    const usuarioId = req.user.id;

    return this.integracionesService.importar(
      file,
      configuracionMapeoId,
      empresaId,
      usuarioId,
    );
  }

  // ==================== COMPARACIÓN ====================

  @Post('comparar')
  @ApiOperation({ summary: 'Comparar archivo con fletes en LogiProfit' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        configuracionMapeoId: { type: 'number' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'application/xml',
          'text/xml',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Tipo de archivo no permitido. Solo: Excel, CSV, XML',
            ),
            false,
          );
        }
      },
    }),
  )
  async comparar(
    @UploadedFile() file: Express.Multer.File,
    @Body('configuracionMapeoId', ParseIntPipe) configuracionMapeoId: number,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    const empresaId = req.user.empresa.id;
    return this.integracionesService.compararConArchivo(
      file,
      configuracionMapeoId,
      empresaId,
    );
  }

  @Post('sincronizar')
  @ApiOperation({ summary: 'Sincronizar diferencias seleccionadas con LogiProfit' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        configuracionMapeoId: { type: 'number' },
        folios: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async sincronizar(
    @UploadedFile() file: Express.Multer.File,
    @Body('configuracionMapeoId', ParseIntPipe) configuracionMapeoId: number,
    @Body('folios') folios: string | string[],
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    const empresaId = req.user.empresa.id;
    const usuarioId = req.user.id;

    // Convertir folios a array si viene como string
    const foliosArray = typeof folios === 'string' ? JSON.parse(folios) : folios;

    return this.integracionesService.sincronizarDiferencias(
      file,
      { configuracionMapeoId, folios: foliosArray },
      empresaId,
      usuarioId,
    );
  }

  @Post('exportar-comparacion')
  @ApiOperation({ summary: 'Exportar resultado de comparación a Excel' })
  async exportarComparacion(
    @Body() comparacion: any,
    @Res() res: Response,
  ) {
    const buffer = await this.integracionesService.exportarComparacion(comparacion);

    const timestamp = new Date().getTime();
    const filename = `comparacion_${timestamp}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // ==================== EXPORTACIÓN ====================

  @Post('exportar')
  @ApiOperation({ summary: 'Exportar fletes a archivo' })
  async exportar(
    @Body() dto: ExportarFletesDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const empresaId = req.user.empresa.id;
    const usuarioId = req.user.id;

    const buffer = await this.integracionesService.exportar(
      dto,
      empresaId,
      usuarioId,
    );

    // Determinar tipo MIME
    const mimeTypes = {
      [TipoArchivo.EXCEL]:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      [TipoArchivo.CSV]: 'text/csv',
      [TipoArchivo.XML]: 'application/xml',
    };

    const mimeType = mimeTypes[dto.formato];
    const extension = dto.formato.toLowerCase();
    const timestamp = new Date().getTime();
    const filename = `fletes_export_${timestamp}.${extension}`;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  // ==================== LOGS ====================

  @Get('logs')
  @ApiOperation({ summary: 'Listar historial de importaciones/exportaciones' })
  findAllLogs(@Request() req: any) {
    const empresaId = req.user.empresa.id;
    return this.integracionesService.findAllLogs(empresaId);
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Obtener detalle de un log' })
  findOneLog(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const empresaId = req.user.empresa.id;
    return this.integracionesService.findOneLog(id, empresaId);
  }
}
