import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CalculosService } from './calculos.service';
import { CreateCalculoDto } from './dto/create-calculo.dto';
import { UpdateCalculoDto } from './dto/update-calculo.dto';

@Controller('calculos')
export class CalculosController {
    constructor(private readonly calculosService: CalculosService) { }

    @Post()
    create(@Body() createCalculoDto: CreateCalculoDto) {
        return this.calculosService.create(createCalculoDto);
    }

    @Get()
    findAll() {
        return this.calculosService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.calculosService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateCalculoDto: UpdateCalculoDto) {
        return this.calculosService.update(id, updateCalculoDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.calculosService.remove(id);
    }
}
