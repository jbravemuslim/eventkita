import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // API hanya diakses lewat web (same-origin rewrite Next.js) di production.
  // Trust proxy agar IP klien dan protokol HTTPS dari Cloudflare/Traefik terbaca.
  app.set('trust proxy', true);

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  // Berkas statis (bukti pembayaran & QR tiket) disajikan API sendiri,
  // supaya reverse proxy (Traefik/Next.js rewrite) cukup meneruskan /uploads/* .
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

  // Same-origin di production: browser memanggil /api lewat rewrite Next.js.
  // WEB_ORIGIN hanya untuk deployment lintas-origin/legacy; biarkan kosong di Dokploy.
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
