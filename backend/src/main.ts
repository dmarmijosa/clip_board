import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    credentials: false,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Clipboard API')
    .setDescription(
      'Servicio para gestionar el clipboard colaborativo en tiempo real',
    )
    .setVersion('1.0.0')
    .addTag('clipboard')
    .addTag('health')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);
}
void bootstrap();
