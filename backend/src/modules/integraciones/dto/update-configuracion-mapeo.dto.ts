import { PartialType } from '@nestjs/swagger';
import { CreateConfiguracionMapeoDto } from './create-configuracion-mapeo.dto';

export class UpdateConfiguracionMapeoDto extends PartialType(
  CreateConfiguracionMapeoDto,
) {}
