import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('LogiProfit API')
    .setDescription('API para gestión de rentabilidad de fletes')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación')
    .addTag('empresas', 'Gestión de empresas')
    .addTag('usuarios', 'Gestión de usuarios')
    .addTag('clientes', 'Gestión de clientes')
    .addTag('camiones', 'Gestión de camiones')
    .addTag('choferes', 'Gestión de choferes')
    .addTag('cotizaciones', 'Gestión de cotizaciones')
    .addTag('fletes', 'Gestión de fletes')
    .addTag('gastos', 'Gestión de gastos')
    .addTag('reportes', 'Reportes y dashboards')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚛 LogiProfit API running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
