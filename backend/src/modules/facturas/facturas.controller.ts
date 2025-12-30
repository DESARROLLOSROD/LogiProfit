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
  UploadedFiles,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { FacturasService } from './facturas.service';
import { CreateFacturaDto, UpdateFacturaDto, UpdateEstadoPagoDto } from './dto/factura.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EstadoPagoFactura } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

// Configuración de multer para archivos de facturas
const storage = diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'facturas');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `factura-${uniqueSuffix}${ext}`);
  },
});

@ApiTags('facturas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('facturas')
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva factura para un flete' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'xml', maxCount: 1 },
        { name: 'pdf', maxCount: 1 },
      ],
      { storage }
    )
  )
  create(
    @Request() req: any,
    @Body() createFacturaDto: CreateFacturaDto,
    @UploadedFiles()
    files: {
      xml?: Express.Multer.File[];
      pdf?: Express.Multer.File[];
    }
  ) {
    const xmlFile = files?.xml?.[0];
    const pdfFile = files?.pdf?.[0];

    return this.facturasService.create(req.user.empresaId, createFacturaDto, xmlFile, pdfFile);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las facturas' })
  @ApiQuery({ name: 'estadoPago', required: false, enum: EstadoPagoFactura })
  findAll(@Request() req: any, @Query('estadoPago') estadoPago?: EstadoPagoFactura) {
    return this.facturasService.findAll(req.user.empresaId, estadoPago);
  }

  @Get('pendientes-facturacion')
  @ApiOperation({ summary: 'Obtener fletes completados pendientes de facturación' })
  @ApiResponse({ status: 200, description: 'Lista de fletes sin factura' })
  getFletesPendientesFacturacion(@Request() req: any) {
    return this.facturasService.getFletesPendientesFacturacion(req.user.empresaId);
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de facturación' })
  getEstadisticas(@Request() req: any) {
    return this.facturasService.getEstadisticas(req.user.empresaId);
  }

  @Get('by-flete/:fleteId')
  @ApiOperation({ summary: 'Obtener factura de un flete específico' })
  findByFlete(@Request() req: any, @Param('fleteId', ParseIntPipe) fleteId: number) {
    return this.facturasService.findByFlete(fleteId, req.user.empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una factura' })
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.facturasService.findOne(id, req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar factura' })
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFacturaDto: UpdateFacturaDto
  ) {
    return this.facturasService.update(id, req.user.empresaId, updateFacturaDto);
  }

  @Patch(':id/estado-pago')
  @ApiOperation({ summary: 'Actualizar estado de pago de factura' })
  updateEstadoPago(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstadoPagoDto: UpdateEstadoPagoDto
  ) {
    return this.facturasService.updateEstadoPago(id, req.user.empresaId, updateEstadoPagoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar factura' })
  @ApiResponse({ status: 200, description: 'Factura eliminada exitosamente' })
  delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.facturasService.delete(id, req.user.empresaId);
  }
}
