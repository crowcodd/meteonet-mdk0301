import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!process.env[key]) throw new Error(`Не задана переменная окружения ${key}`);
  }

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const config = new DocumentBuilder().setTitle('Meteonet API').setVersion('1.0').addBearerAuth().build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config), { jsonDocumentUrl: 'api-json' });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`API: http://localhost:${port}/api, Swagger: http://localhost:${port}/docs`);
}

bootstrap();
