import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Liga a validação dos DTOs (class-validator) em TODAS as rotas.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos que não estão no DTO...
      forbidNonWhitelisted: true, // ...e, melhor ainda, responde 400 se vierem
      transform: true, // converte o JSON numa instância real do DTO (ativa os @Transform)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
