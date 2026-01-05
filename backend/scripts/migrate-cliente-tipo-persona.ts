/**
 * Script de Migración: Asignar Tipo de Persona a Clientes Existentes
 *
 * Este script ayuda a identificar el tipo de persona (Física o Moral) de los clientes
 * existentes basándose en el RFC.
 *
 * Lógica:
 * - Si el RFC tiene 12 caracteres → Persona MORAL
 * - Si el RFC tiene 13 caracteres → Persona FISICA
 * - Si no tiene RFC → Se asigna FISICA por default
 *
 * Uso: npx ts-node scripts/migrate-cliente-tipo-persona.ts
 */

import { PrismaClient, TipoPersona } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración de tipo de persona en clientes...\n');

  // Obtener todos los clientes
  const clientes = await prisma.cliente.findMany({
    select: {
      id: true,
      nombre: true,
      rfc: true,
      tipoPersona: true,
    },
  });

  console.log(`📊 Total de clientes encontrados: ${clientes.length}\n`);

  let actualizados = 0;
  let sinCambios = 0;
  let errores = 0;

  for (const cliente of clientes) {
    try {
      // Si ya tiene tipoPersona definido y no es el default, saltarlo
      if (cliente.tipoPersona && cliente.tipoPersona !== TipoPersona.FISICA) {
        console.log(`⏭️  Cliente "${cliente.nombre}" ya tiene tipo: ${cliente.tipoPersona}`);
        sinCambios++;
        continue;
      }

      let nuevoTipo: TipoPersona;

      if (cliente.rfc) {
        // RFC de Persona Física: 13 caracteres (CURP style: AAAA000000AAA)
        // RFC de Persona Moral: 12 caracteres (AAA000000AAA)
        const rfcLimpio = cliente.rfc.trim().toUpperCase();

        if (rfcLimpio.length === 12) {
          nuevoTipo = TipoPersona.MORAL;
        } else if (rfcLimpio.length === 13) {
          nuevoTipo = TipoPersona.FISICA;
        } else {
          // RFC inválido, asignar FISICA por default
          nuevoTipo = TipoPersona.FISICA;
          console.log(`⚠️  Cliente "${cliente.nombre}" tiene RFC inválido (${rfcLimpio.length} caracteres), asignando FISICA`);
        }
      } else {
        // Sin RFC, asignar FISICA por default
        nuevoTipo = TipoPersona.FISICA;
        console.log(`ℹ️  Cliente "${cliente.nombre}" sin RFC, asignando FISICA por default`);
      }

      // Actualizar cliente
      await prisma.cliente.update({
        where: { id: cliente.id },
        data: { tipoPersona: nuevoTipo },
      });

      console.log(`✅ Cliente "${cliente.nombre}" → ${nuevoTipo} (RFC: ${cliente.rfc || 'N/A'})`);
      actualizados++;

    } catch (error) {
      console.error(`❌ Error al procesar cliente "${cliente.nombre}":`, error);
      errores++;
    }
  }

  console.log('\n📈 Resumen de migración:');
  console.log(`   ✅ Actualizados: ${actualizados}`);
  console.log(`   ⏭️  Sin cambios: ${sinCambios}`);
  console.log(`   ❌ Errores: ${errores}`);
  console.log(`   📊 Total: ${clientes.length}\n`);

  if (actualizados > 0) {
    console.log('✨ Migración completada exitosamente!');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error fatal en la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
