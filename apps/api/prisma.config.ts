// Configuração do Prisma CLI (migrate, generate, studio...).
// O Prisma 7 não lê o .env sozinho — por isso o import do dotenv.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
