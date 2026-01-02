import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { CamionesModule } from './modules/camiones/camiones.module';
import { ChoferesModule } from './modules/choferes/choferes.module';
import { CotizacionesModule } from './modules/cotizaciones/cotizaciones.module';
import { FletesModule } from './modules/fletes/fletes.module';
import { GastosModule } from './modules/gastos/gastos.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MantenimientoModule } from './modules/mantenimiento/mantenimiento.module';
import { IntegracionesModule } from './modules/integraciones/integraciones.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SearchModule } from './modules/search/search.module';
import { PlantillasGastoModule } from './modules/plantillas-gasto/plantillas-gasto.module';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { FacturasModule } from './modules/facturas/facturas.module';
import { SolicitudesModule } from './modules/solicitudes-combustible/solicitudes.module';
import { CalculosModule } from './modules/calculos/calculos.module';

import { ViaticosModule } from './modules/viaticos/viaticos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting global: 10 requests por minuto
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 60 segundos
      limit: 10,    // 10 requests máximo
    }]),
    PrismaModule,
    AuthModule,
    EmpresasModule,
    UsuariosModule,
    ClientesModule,
    CamionesModule,
    ChoferesModule,
    CotizacionesModule,
    FletesModule,
    GastosModule,
    PlantillasGastoModule,
    ReportesModule,
    NotificationsModule,
    MantenimientoModule,
    IntegracionesModule,
    DashboardModule,
    SearchModule,
    DocumentosModule,
    DocumentosModule,
    FacturasModule,
    SolicitudesModule,
    CalculosModule,

    ViaticosModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
