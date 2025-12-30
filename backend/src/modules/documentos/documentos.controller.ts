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
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';
import { CreateDocumentoDto, UpdateDocumentoDto } from './dto/documento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as path from 'path';
import * as fs from 'fs';

// Configuración de multer para almacenar archivos
const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documentos');

    // Crear directorio si no existe
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `documento-${uniqueSuffix}${ext}`);
  },
});

@ApiTags('documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Post()
  @ApiOperation({ summary: 'Subir nuevo documento para un vehículo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['camionId', 'tipo', 'fechaEmision', 'fechaVencimiento', 'file'],
      properties: {
        camionId: { type: 'integer' },
        tipo: { type: 'string', enum: ['POLIZA', 'TARJETA_CIRCULACION', 'VERIFICACION', 'LICENCIA', 'TARJETA_IAVE', 'PERMISO_SCT', 'SEGURO', 'OTRO'] },
        numero: { type: 'string' },
        fechaEmision: { type: 'string', format: 'date' },
        fechaVencimiento: { type: 'string', format: 'date' },
        notas: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage }))
  async create(
    @Request() req: any,
    @Body() createDocumentoDto: CreateDocumentoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Debe proporcionar un archivo');
    }

    // Construir URL relativa del archivo
    const archivoUrl = `/uploads/documentos/${file.filename}`;

    const dto: CreateDocumentoDto = {
      ...createDocumentoDto,
      camionId: Number(createDocumentoDto.camionId),
      nombreArchivo: file.originalname,
    };

    return this.documentosService.create(dto, archivoUrl);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los documentos' })
  @ApiQuery({ name: 'camionId', required: false, type: Number })
  findAll(@Request() req: any, @Query('camionId') camionId?: number) {
    const camId = camionId ? Number(camionId) : undefined;
    return this.documentosService.findAll(req.user.empresaId, camId);
  }

  @Get('por-vencer')
  @ApiOperation({ summary: 'Obtener documentos próximos a vencer' })
  @ApiQuery({ name: 'dias', required: false, type: Number, description: 'Días hacia adelante (default: 30)' })
  getDocumentosPorVencer(
    @Request() req: any,
    @Query('dias') dias?: number,
  ) {
    const diasNum = dias ? Number(dias) : 30;
    return this.documentosService.getDocumentosPorVencer(req.user.empresaId, diasNum);
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de documentos' })
  getEstadisticas(@Request() req: any) {
    return this.documentosService.getEstadisticas(req.user.empresaId);
  }

  @Post('actualizar-estados')
  @ApiOperation({ summary: 'Actualizar estados de todos los documentos' })
  actualizarEstados(@Request() req: any) {
    return this.documentosService.actualizarEstados(req.user.empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un documento' })
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.documentosService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar información de un documento' })
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentoDto: UpdateDocumentoDto,
  ) {
    return this.documentosService.update(id, req.user.empresaId, updateDocumentoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un documento' })
  @ApiResponse({ status: 200, description: 'Documento eliminado exitosamente' })
  delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.documentosService.delete(id, req.user.empresaId);
  }
}
