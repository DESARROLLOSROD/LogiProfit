import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCalculoDto } from './dto/create-calculo.dto';
import { UpdateCalculoDto } from './dto/update-calculo.dto';

@Injectable()
export class CalculosService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateCalculoDto) {
        // Generar folio simple: CAL-{ID}
        // Primero creamos para obtener ID
        // O consultamos el ultimo ID. Mejor usamos una transaccion o generamos despues.
        // Simplemente usaremos un timestamp o random por ahora, o actualizamos despues de crear.

        // Mejor estrategia: Count + 1
        const count = await this.prisma.calculo.count();
        const folio = `CAL-${(count + 1).toString().padStart(4, '0')}`;

        return this.prisma.calculo.create({
            data: {
                ...data,
                folio,
            },
        });
    }

    findAll() {
        return this.prisma.calculo.findMany({
            include: {
                cliente: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    findOne(id: number) {
        return this.prisma.calculo.findUnique({
            where: { id },
            include: {
                cliente: true,
            },
        });
    }

    update(id: number, data: UpdateCalculoDto) {
        return this.prisma.calculo.update({
            where: { id },
            data,
        });
    }

    remove(id: number) {
        return this.prisma.calculo.delete({
            where: { id },
        });
    }
}
