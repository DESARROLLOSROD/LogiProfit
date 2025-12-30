import { Module } from '@nestjs/common';
import { FletesService } from './fletes.service';
import { FletesController } from './fletes.controller';

@Module({
  controllers: [FletesController],
  providers: [FletesService],
  exports: [FletesService],
})
export class FletesModule {}
