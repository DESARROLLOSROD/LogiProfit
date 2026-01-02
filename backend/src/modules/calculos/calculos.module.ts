import { Module } from '@nestjs/common';
import { CalculosService } from './calculos.service';
import { CalculosController } from './calculos.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CalculosController],
    providers: [CalculosService],
})
export class CalculosModule { }
