import { Module } from '@nestjs/common';
import { ViaticosController } from './viaticos.controller';
import { ViaticosService } from './viaticos.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ViaticosController],
  providers: [ViaticosService],
  exports: [ViaticosService],
})
export class ViaticosModule {}
