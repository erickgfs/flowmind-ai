import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// @Global: registrado uma vez no AppModule, fica disponível em todos os módulos.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
