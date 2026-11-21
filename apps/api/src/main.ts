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

  // CORS: o front (Next.js em outra porta) é outra "origem" para o navegador.
  // Sem isto, o navegador bloqueia o front de ler as respostas da API.
  // Liberamos SÓ as origens listadas em WEB_ORIGIN (separadas por vírgula).
  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3001')
      .split(',')
      .map((o) => o.trim()),
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
