import { IsNotEmpty, IsNumber, IsString, IsObject, IsOptional } from 'class-validator';

export class CreateCalculoDto {
    @IsNumber()
    @IsNotEmpty()
    clienteId: number;

    @IsString()
    @IsNotEmpty()
    origen: string;

    @IsString()
    @IsNotEmpty()
    destino: string;

    @IsNumber()
    @IsNotEmpty()
    totalCosto: number;

    @IsNumber()
    @IsNotEmpty()
    precioVenta: number;

    @IsObject()
    @IsNotEmpty()
    datos: Record<string, any>;

    @IsString()
    @IsOptional()
    estado?: string;

    // Información de la carga (opcional)
    @IsString()
    @IsOptional()
    tipoCarga?: string;

    @IsNumber()
    @IsOptional()
    pesoCarga?: number; // toneladas

    @IsString()
    @IsOptional()
    dimensiones?: string; // "L x A x H"
}
