import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const allowedOrigins = [
    frontendUrl.replace(/\/$/, ''), // Elimina la barra final si existe
    'https://logiprofit-production.up.railway.app',
    'http://localhost:5173',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como mobile apps o curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 horas
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
    .addTag('viaticos', 'Gestión de viáticos')
    .addTag('reportes', 'Reportes y dashboards')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚛 LogiProfit API running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`✅ ViaticosModule loaded and ready`);
}

bootstrap();
