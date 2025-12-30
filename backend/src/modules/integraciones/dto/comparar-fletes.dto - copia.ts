import { IsNumber, IsOptional, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompararFletesDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  configuracionMapeoId?: number;
}

export class SincronizarDiferenciasDto {
  @ApiProperty({ description: 'Array de folios a sincronizar' })
  @IsArray()
  @IsString({ each: true })
  folios: string[];

  @ApiProperty({ description: 'ID de configuración de mapeo' })
  @IsNumber()
  configuracionMapeoId: number;
}

export interface DiferenciaFlete {
  folio: string;
  fleteId: number;
  campo: string;
  valorLogiProfit: any;
  valorArchivo: any;
  tipoConflicto: 'diferencia' | 'faltante_logiprofit' | 'faltante_archivo';
}

export interface ComparacionResult {
  totalFletesArchivo: number;
  totalFletesLogiProfit: number;
  fletesCoincidentes: number;
  fletesConDiferencias: number;
  fletesSoloEnArchivo: string[];
  fletesSoloEnLogiProfit: string[];
  diferencias: DiferenciaFlete[];
  gastosPorFolio: Record<string, {
    totalGastos: number;
    cantidadGastos: number;
    gastos: any[];
  }>;
}
