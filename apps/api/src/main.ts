import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  // Berkas statis (bukti pembayaran & QR tiket) disajikan API sendiri,
  // supaya reverse proxy (nginx CapRover) cukup meneruskan /uploads/* .
  const uploadDir = config.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads');
  app.use('/uploads/public', express.static(join(uploadDir, 'public')));
  app.use(
    helmet({
      // Swagger UI membutuhkan inline script.
      contentSecurityPolicy: false,
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const webOrigin = config.get<string>('WEB_ORIGIN');
  if (webOrigin) {
    app.enableCors({
      origin: webOrigin,
      credentials: true,
    });
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EventKita API')
    .setDescription('API platform pendaftaran dan event ticketing komunitas.')
    .setVersion('0.1.0')
    .addCookieAuth(config.get<string>('COOKIE_NAME') ?? 'eventkita_session')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(config.get<string>('PORT') ?? 4000);
  await app.listen(port, '0.0.0.0');

  Logger.log(`API berjalan di http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`Swagger tersedia di http://localhost:${port}/api/docs`, 'Bootstrap');
}

void bootstrap();
