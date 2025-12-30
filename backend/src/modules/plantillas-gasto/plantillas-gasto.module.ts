import { Module } from '@nestjs/common';
import { PlantillasGastoController } from './plantillas-gasto.controller';
import { PlantillasGastoService } from './plantillas-gasto.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlantillasGastoController],
  providers: [PlantillasGastoService],
  exports: [PlantillasGastoService],
})
export class PlantillasGastoModule {}
