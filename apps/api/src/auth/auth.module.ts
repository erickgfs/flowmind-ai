import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    // registerAsync: espera o ConfigService carregar o .env antes de
    // configurar o JWT (o segredo nunca fica escrito no código).
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(config.get('JWT_EXPIRES_IN') ?? 3600),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  // Exportamos o Guard e o JwtModule para que outros módulos (ex.: Tasks)
  // possam usar @UseGuards(AuthGuard) — o Guard precisa do JwtService.
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
