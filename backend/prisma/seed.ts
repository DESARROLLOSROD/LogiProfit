import { PrismaClient, RolUsuario, TipoCamion, TipoChofer, TipoPago, EstadoFlete, TipoGasto } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear empresa demo
  const empresa = await prisma.empresa.create({
    data: {
      nombre: 'Transportes Demo S.A. de C.V.',
      rfc: 'TDE123456ABC',
      plan: 'PROFESIONAL',
    },
  });

  console.log('✅ Empresa creada:', empresa.nombre);

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const admin = await prisma.usuario.create({
    data: {
      empresaId: empresa.id,
      nombre: 'Admin Demo',
      email: 'admin@demo.com',
      password: hashedPassword,
      rol: RolUsuario.ADMIN,
    },
  });

  console.log('✅ Usuario admin creado:', admin.email);

  // Crear más usuarios
  await prisma.usuario.createMany({
    data: [
      {
        empresaId: empresa.id,
        nombre: 'Operador Logístico',
        email: 'operador@demo.com',
        password: hashedPassword,
        rol: RolUsuario.OPERADOR,
      },
      {
        empresaId: empresa.id,
        nombre: 'Contador',
        email: 'contabilidad@demo.com',
        password: hashedPassword,
        rol: RolUsuario.CONTABILIDAD,
      },
      {
        empresaId: empresa.id,
        nombre: 'Director General',
        email: 'direccion@demo.com',
        password: hashedPassword,
        rol: RolUsuario.DIRECCION,
      },
    ],
  });

  console.log('✅ Usuarios adicionales creados');

  // Crear clientes
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        empresaId: empresa.id,
        nombre: 'Cemex S.A. de C.V.',
        rfc: 'CEM123456ABC',
        email: 'logistica@cemex.com',
        telefono: '5512345678',
      },
    }),
    prisma.cliente.create({
      data: {
        empresaId: empresa.id,
        nombre: 'Peñoles Industrial',
        rfc: 'PEN123456ABC',
        email: 'fletes@penoles.com',
        telefono: '5587654321',
      },
    }),
    prisma.cliente.create({
      data: {
        empresaId: empresa.id,
        nombre: 'Grupo Bimbo',
        rfc: 'BIM123456ABC',
        email: 'transporte@bimbo.com',
        telefono: '5511223344',
      },
    }),
  ]);

  console.log('✅ Clientes creados:', clientes.length);

  // Crear camiones
  const camiones = await Promise.all([
    prisma.camion.create({
      data: {
        empresaId: empresa.id,
        placas: 'ABC-123-XY',
        numeroEconomico: 'T-01',
        marca: 'Kenworth',
        modelo: 'T680',
        anio: 2022,
        tipo: TipoCamion.TRAILER,
        rendimientoKmL: 3.5,
        capacidadCarga: 30,
      },
    }),
    prisma.camion.create({
      data: {
        empresaId: empresa.id,
        placas: 'DEF-456-ZW',
        numeroEconomico: 'T-02',
        marca: 'Freightliner',
        modelo: 'Cascadia',
        anio: 2021,
        tipo: TipoCamion.TRAILER,
        rendimientoKmL: 3.2,
        capacidadCarga: 28,
      },
    }),
    prisma.camion.create({
      data: {
        empresaId: empresa.id,
        placas: 'GHI-789-UV',
        numeroEconomico: 'R-01',
        marca: 'International',
        modelo: 'LT625',
        anio: 2020,
        tipo: TipoCamion.TORTON,
        rendimientoKmL: 4.0,
        capacidadCarga: 15,
      },
    }),
  ]);

  console.log('✅ Camiones creados:', camiones.length);

  // Crear choferes
  const choferes = await Promise.all([
    prisma.chofer.create({
      data: {
        empresaId: empresa.id,
        nombre: 'Juan Pérez García',
        telefono: '5544332211',
        licencia: 'LIC-001-2020',
        tipo: TipoChofer.FIJO,
        tipoPago: TipoPago.POR_DIA,
        tarifa: 600,
      },
    }),
    prisma.chofer.create({
      data: {
        empresaId: empresa.id,
        nombre: 'Pedro Hernández López',
        telefono: '5533221100',
        licencia: 'LIC-002-2019',
        tipo: TipoChofer.FIJO,
        tipoPago: TipoPago.POR_KM,
        tarifa: 3.5,
      },
    }),
    prisma.chofer.create({
      data: {
        empresaId: empresa.id,
        nombre: 'Miguel Sánchez Ruiz',
        telefono: '5522110099',
        licencia: 'LIC-003-2021',
        tipo: TipoChofer.ROTATIVO,
        tipoPago: TipoPago.POR_VIAJE,
        tarifa: 2500,
      },
    }),
  ]);

  console.log('✅ Choferes creados:', choferes.length);

  // Crear cotización
  const cotizacion = await prisma.cotizacion.create({
    data: {
      empresaId: empresa.id,
      clienteId: clientes[0].id,
      folio: 'COT-00001',
      origen: 'Ciudad de México',
      destino: 'Monterrey, NL',
      kmEstimados: 900,
      precioCotizado: 45000,
      dieselEstimado: 6000,
      casetasEstimado: 4500,
      viaticosEstimado: 1500,
      salarioEstimado: 3600,
      utilidadEsperada: 29400,
      margenEsperado: 65.33,
      estado: 'APROBADA',
    },
  });

  console.log('✅ Cotización creada:', cotizacion.folio);

  // Crear fletes con gastos
  const flete1 = await prisma.flete.create({
    data: {
      empresaId: empresa.id,
      cotizacionId: cotizacion.id,
      clienteId: clientes[0].id,
      folio: 'F-00001',
      origen: 'Ciudad de México',
      destino: 'Monterrey, NL',
      kmReales: 920,
      precioCliente: 45000,
      estado: EstadoFlete.CERRADO,
      fechaInicio: new Date('2024-01-10'),
      fechaFin: new Date('2024-01-12'),
    },
  });

  // Asignar camión y chofer
  await prisma.fleteCamion.create({
    data: {
      fleteId: flete1.id,
      camionId: camiones[0].id,
      principal: true,
    },
  });

  await prisma.fleteChofer.create({
    data: {
      fleteId: flete1.id,
      choferId: choferes[0].id,
      fechaInicio: new Date('2024-01-10'),
      fechaFin: new Date('2024-01-12'),
      dias: 3,
      kmReales: 920,
      salarioCalculado: 1800,
    },
  });

  // Agregar gastos
  await prisma.gasto.createMany({
    data: [
      {
        fleteId: flete1.id,
        camionId: camiones[0].id,
        tipo: TipoGasto.DIESEL,
        concepto: 'Carga de diesel CDMX',
        monto: 3200,
        fecha: new Date('2024-01-10'),
        validado: true,
      },
      {
        fleteId: flete1.id,
        camionId: camiones[0].id,
        tipo: TipoGasto.DIESEL,
        concepto: 'Carga de diesel San Luis Potosí',
        monto: 2800,
        fecha: new Date('2024-01-11'),
        validado: true,
      },
      {
        fleteId: flete1.id,
        tipo: TipoGasto.CASETAS,
        concepto: 'Casetas autopista México-Querétaro',
        monto: 2100,
        fecha: new Date('2024-01-10'),
        validado: true,
      },
      {
        fleteId: flete1.id,
        tipo: TipoGasto.CASETAS,
        concepto: 'Casetas autopista Querétaro-Monterrey',
        monto: 2400,
        fecha: new Date('2024-01-11'),
        validado: true,
      },
      {
        fleteId: flete1.id,
        tipo: TipoGasto.VIATICOS,
        concepto: 'Alimentos y hospedaje',
        monto: 1200,
        fecha: new Date('2024-01-11'),
        validado: true,
      },
      {
        fleteId: flete1.id,
        tipo: TipoGasto.SALARIO,
        concepto: 'Salario chofer: Juan Pérez García',
        monto: 1800,
        fecha: new Date('2024-01-12'),
        validado: true,
      },
    ],
  });

  console.log('✅ Flete cerrado creado con gastos:', flete1.folio);

  // Crear flete en curso
  const flete2 = await prisma.flete.create({
    data: {
      empresaId: empresa.id,
      clienteId: clientes[1].id,
      folio: 'F-00002',
      origen: 'Guadalajara, JAL',
      destino: 'Tijuana, BC',
      precioCliente: 85000,
      estado: EstadoFlete.EN_CURSO,
      fechaInicio: new Date('2024-01-20'),
    },
  });

  await prisma.fleteCamion.create({
    data: {
      fleteId: flete2.id,
      camionId: camiones[1].id,
      principal: true,
    },
  });

  await prisma.fleteChofer.create({
    data: {
      fleteId: flete2.id,
      choferId: choferes[1].id,
      fechaInicio: new Date('2024-01-20'),
    },
  });

  await prisma.gasto.createMany({
    data: [
      {
        fleteId: flete2.id,
        camionId: camiones[1].id,
        tipo: TipoGasto.DIESEL,
        concepto: 'Carga inicial Guadalajara',
        monto: 4500,
        fecha: new Date('2024-01-20'),
        validado: false,
      },
      {
        fleteId: flete2.id,
        tipo: TipoGasto.CASETAS,
        concepto: 'Casetas GDL-Mazatlán',
        monto: 1800,
        fecha: new Date('2024-01-20'),
        validado: false,
      },
    ],
  });

  console.log('✅ Flete en curso creado:', flete2.folio);

  // Crear flete con pérdida (para mostrar alertas)
  const flete3 = await prisma.flete.create({
    data: {
      empresaId: empresa.id,
      clienteId: clientes[2].id,
      folio: 'F-00003',
      origen: 'Veracruz, VER',
      destino: 'Puebla, PUE',
      kmReales: 280,
      precioCliente: 12000,
      estado: EstadoFlete.CERRADO,
      fechaInicio: new Date('2024-01-05'),
      fechaFin: new Date('2024-01-06'),
    },
  });

  await prisma.gasto.createMany({
    data: [
      {
        fleteId: flete3.id,
        tipo: TipoGasto.DIESEL,
        monto: 5500,
        fecha: new Date('2024-01-05'),
        validado: true,
      },
      {
        fleteId: flete3.id,
        tipo: TipoGasto.CASETAS,
        monto: 1200,
        fecha: new Date('2024-01-05'),
        validado: true,
      },
      {
        fleteId: flete3.id,
        tipo: TipoGasto.MANTENIMIENTO,
        concepto: 'Reparación de llanta ponchada',
        monto: 4500,
        fecha: new Date('2024-01-06'),
        validado: true,
      },
      {
        fleteId: flete3.id,
        tipo: TipoGasto.SALARIO,
        monto: 1500,
        fecha: new Date('2024-01-06'),
        validado: true,
      },
    ],
  });

  console.log('✅ Flete con pérdida creado:', flete3.folio);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📧 Credenciales de acceso:');
  console.log('   Email: admin@demo.com');
  console.log('   Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
