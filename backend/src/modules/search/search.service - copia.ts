import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SearchResult {
  fletes: Array<{
    id: number;
    folio: string;
    cliente: { nombre: string };
    origen: string;
    destino: string;
    estado: string;
    type: 'flete';
  }>;
  cotizaciones: Array<{
    id: number;
    folio: string;
    cliente: { nombre: string };
    precioCotizado: any;
    estado: string;
    type: 'cotizacion';
  }>;
  clientes: Array<{
    id: number;
    nombre: string;
    rfc?: string | null;
    telefono?: string | null;
    type: 'cliente';
  }>;
  camiones: Array<{
    id: number;
    placas: string;
    numeroEconomico?: string | null;
    marca?: string | null;
    modelo?: string | null;
    type: 'camion';
  }>;
  choferes: Array<{
    id: number;
    nombre: string;
    telefono?: string | null;
    licencia?: string | null;
    type: 'chofer';
  }>;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(empresaId: number, query: string): Promise<SearchResult> {
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm || searchTerm.length < 2) {
      return {
        fletes: [],
        cotizaciones: [],
        clientes: [],
        camiones: [],
        choferes: [],
      };
    }

    // Búsqueda en paralelo para mejor performance
    const [fletes, cotizaciones, clientes, camiones, choferes] = await Promise.all([
      // Buscar Fletes por folio, origen, destino o cliente
      this.prisma.flete.findMany({
        where: {
          empresaId,
          OR: [
            { folio: { contains: searchTerm, mode: 'insensitive' } },
            { origen: { contains: searchTerm, mode: 'insensitive' } },
            { destino: { contains: searchTerm, mode: 'insensitive' } },
            { cliente: { nombre: { contains: searchTerm, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          folio: true,
          cliente: { select: { nombre: true } },
          origen: true,
          destino: true,
          estado: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),

      // Buscar Cotizaciones por folio o cliente
      this.prisma.cotizacion.findMany({
        where: {
          empresaId,
          OR: [
            { folio: { contains: searchTerm, mode: 'insensitive' } },
            { cliente: { nombre: { contains: searchTerm, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          folio: true,
          cliente: { select: { nombre: true } },
          precioCotizado: true,
          estado: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),

      // Buscar Clientes por nombre, RFC o teléfono
      this.prisma.cliente.findMany({
        where: {
          empresaId,
          OR: [
            { nombre: { contains: searchTerm, mode: 'insensitive' } },
            { rfc: { contains: searchTerm, mode: 'insensitive' } },
            { telefono: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          nombre: true,
          rfc: true,
          telefono: true,
        },
        take: 10,
        orderBy: { nombre: 'asc' },
      }),

      // Buscar Camiones por placas, número económico o marca
      this.prisma.camion.findMany({
        where: {
          empresaId,
          OR: [
            { placas: { contains: searchTerm, mode: 'insensitive' } },
            { numeroEconomico: { contains: searchTerm, mode: 'insensitive' } },
            { marca: { contains: searchTerm, mode: 'insensitive' } },
            { modelo: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          placas: true,
          numeroEconomico: true,
          marca: true,
          modelo: true,
        },
        take: 10,
        orderBy: { placas: 'asc' },
      }),

      // Buscar Choferes por nombre, teléfono o licencia
      this.prisma.chofer.findMany({
        where: {
          empresaId,
          OR: [
            { nombre: { contains: searchTerm, mode: 'insensitive' } },
            { telefono: { contains: searchTerm, mode: 'insensitive' } },
            { licencia: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          licencia: true,
        },
        take: 10,
        orderBy: { nombre: 'asc' },
      }),
    ]);

    return {
      fletes: fletes.map((f) => ({ ...f, type: 'flete' as const })),
      cotizaciones: cotizaciones.map((c) => ({ ...c, type: 'cotizacion' as const })),
      clientes: clientes.map((c) => ({ ...c, type: 'cliente' as const })),
      camiones: camiones.map((c) => ({ ...c, type: 'camion' as const })),
      choferes: choferes.map((c) => ({ ...c, type: 'chofer' as const })),
    };
  }
}
