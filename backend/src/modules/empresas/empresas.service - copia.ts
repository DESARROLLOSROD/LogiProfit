import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateEmpresaDto } from './dto/empresa.dto';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usuarios: true,
            clientes: true,
            camiones: true,
            choferes: true,
            fletes: true,
          },
        },
      },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return empresa;
  }

  async update(id: number, dto: UpdateEmpresaDto) {
    await this.findOne(id);

    return this.prisma.empresa.update({
      where: { id },
      data: dto,
    });
  }

  async getEstadisticas(id: number) {
    const empresa = await this.findOne(id);

    // Obtener fletes con gastos
    const fletes = await this.prisma.flete.findMany({
      where: { empresaId: id },
      include: { gastos: true },
    });

    let totalIngresos = 0;
    let totalGastos = 0;
    let fletesConPerdida = 0;

    for (const flete of fletes) {
      const ingresos = Number(flete.precioCliente);
      const gastos = flete.gastos.reduce((sum, g) => sum + Number(g.monto), 0);
      
      totalIngresos += ingresos;
      totalGastos += gastos;

      if (gastos > ingresos) {
        fletesConPerdida++;
      }
    }

    return {
      empresa: {
        id: empresa.id,
        nombre: empresa.nombre,
        plan: empresa.plan,
      },
      contadores: empresa._count,
      financiero: {
        totalIngresos,
        totalGastos,
        utilidadNeta: totalIngresos - totalGastos,
        margenPromedio: totalIngresos > 0 
          ? ((totalIngresos - totalGastos) / totalIngresos) * 100 
          : 0,
        fletesConPerdida,
      },
    };
  }
}
