import { PartialType } from '@nestjs/mapped-types';
import { CreateCalculoDto } from './create-calculo.dto';

export class UpdateCalculoDto extends PartialType(CreateCalculoDto) { }
