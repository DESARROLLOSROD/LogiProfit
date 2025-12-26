import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
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
    ReportesModule,
    NotificationsModule,
    MantenimientoModule,
  ],
})
export class AppModule {}
