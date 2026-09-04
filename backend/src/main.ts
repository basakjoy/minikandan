import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .concat('http://localhost:3000');

  app.enableCors({
    origin: (requestOrigin, callback) => {
      const isVercelOrigin = requestOrigin?.match(/^https:\/\/[a-z0-9-]+\.vercel\.app$/i);
      if (!requestOrigin || corsOrigins.includes(requestOrigin) || isVercelOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Mini Kanban Board API')
    .setDescription('Full-stack Mini Kanban Board REST API with Auth, RBAC, and Movement engine')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Mini Kanban API running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger documentation at: http://localhost:${port}/api/docs`);
}

bootstrap();
